import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from latent_modes import MULTI_CLASS_MODES, LatentMode
from latent_video import interpolate_loop
from stylegan_runtime import latent_rgb_structure_fields, structure_map_to_rgb


ROOT = Path(__file__).resolve().parents[1]
STYLEGAN_XL_ROOT = ROOT / ".runtime" / "stylegan-xl"
MODEL = ROOT / "models" / "stylegan-xl-imagenet128.pkl"
OUTPUT_DIR = ROOT / "public" / "assets"
PREVIEW_DIR = ROOT / "generated"
BASE_FPS = 4
OUTPUT_FPS = 12
DURATION_SECONDS = 12
BASE_FRAME_COUNT = BASE_FPS * DURATION_SECONDS
OUTPUT_RESOLUTION = 256


def load_generator():
    if not STYLEGAN_XL_ROOT.exists():
        raise RuntimeError("StyleGAN-XL runtime missing; run scripts/setup-stylegan-mac.sh")
    if not MODEL.exists():
        raise RuntimeError(f"StyleGAN-XL checkpoint missing: {MODEL}")
    previous_cwd = Path.cwd()
    os.chdir(STYLEGAN_XL_ROOT)
    sys.path.insert(0, str(STYLEGAN_XL_ROOT))
    try:
        import legacy

        with MODEL.open("rb") as handle:
            generator = legacy.load_network_pkl(handle)["G_ema"].eval().requires_grad_(False)
    finally:
        os.chdir(previous_cwd)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    return generator.to(device), device


def class_keyframes(generator, device: torch.device, mode: LatentMode) -> torch.Tensor:
    latents = np.stack([np.random.RandomState(seed).randn(generator.z_dim) for seed in mode.seeds])
    z = torch.from_numpy(latents).to(device=device, dtype=torch.float32)
    class_indices = torch.tensor(mode.classes, device=device)
    labels = torch.nn.functional.one_hot(class_indices, generator.c_dim)
    with torch.no_grad():
        return generator.mapping(z, labels, truncation_psi=0.72)


def generate_latent_images(generator, device: torch.device, keyframes: torch.Tensor, mode_id: str) -> list[torch.Tensor]:
    images: list[torch.Tensor] = []
    started = time.perf_counter()
    with torch.no_grad():
        _ = generator.synthesis(keyframes[:1], noise_mode="const", force_fp32=True)
        if device.type == "mps":
            torch.mps.synchronize()
        for frame in range(BASE_FRAME_COUNT):
            w = interpolate_loop(keyframes, frame, BASE_FRAME_COUNT)
            generated = generator.synthesis(w.unsqueeze(0), noise_mode="const", force_fp32=True)[0]
            images.append(((generated + 1) * 0.5).clamp(0, 1).cpu())
            if device.type == "mps":
                torch.mps.synchronize()
                torch.mps.empty_cache()
            if (frame + 1) % 4 == 0:
                elapsed = time.perf_counter() - started
                print(f"{mode_id}: generated {frame + 1}/{BASE_FRAME_COUNT} latent frames ({elapsed:.1f}s)", flush=True)
    return images


def structure_frames(images: list[torch.Tensor], mode_id: str) -> list[np.ndarray]:
    weights = torch.tensor((0.5, 0.25, 0.25), dtype=torch.float32)
    frames: list[np.ndarray] = []
    for index, current in enumerate(images):
        neighborhood = torch.stack((current, images[index - 1], images[(index + 1) % len(images)]))
        fields = latent_rgb_structure_fields(neighborhood, weights)
        rgb = structure_map_to_rgb(fields, mode_id).permute(1, 2, 0).numpy()
        frame = Image.fromarray(rgb, "RGB").resize(
            (OUTPUT_RESOLUTION, OUTPUT_RESOLUTION),
            Image.Resampling.LANCZOS,
        )
        frames.append(np.asarray(frame))
    return frames


def encode_loop(frames: list[np.ndarray], output: Path):
    command = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pixel_format", "rgb24",
        "-video_size", f"{OUTPUT_RESOLUTION}x{OUTPUT_RESOLUTION}",
        "-framerate", str(BASE_FPS), "-i", "-", "-an",
        "-vf", f"minterpolate=fps={OUTPUT_FPS}:mi_mode=blend,tpad=stop_mode=clone:stop_duration={2 / OUTPUT_FPS:.6f}",
        "-t", str(DURATION_SECONDS),
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    if encoder.stdin is None:
        raise RuntimeError("ffmpeg stdin unavailable")
    for frame in (*frames, frames[0]):
        encoder.stdin.write(frame.tobytes())
    encoder.stdin.close()
    return_code = encoder.wait()
    if return_code != 0:
        raise RuntimeError(f"ffmpeg exited with {return_code}")


def render_mode(generator, device: torch.device, mode: LatentMode):
    output = OUTPUT_DIR / mode.output_name
    keyframes = class_keyframes(generator, device, mode)
    images = generate_latent_images(generator, device, keyframes, mode.mode_id)
    frames = structure_frames(images, mode.mode_id)
    encode_loop(frames, output)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(frames[len(frames) // 2], "RGB").save(PREVIEW_DIR / f"latent-{mode.mode_id}-preview.png")
    print(f"{mode.mode_id}: wrote {output} ({output.stat().st_size} bytes)", flush=True)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generator, device = load_generator()
    print(
        f"StyleGAN-XL ready: {MODEL.name}, {generator.img_resolution}px, {generator.c_dim} classes, {device.type}",
        flush=True,
    )
    for mode in MULTI_CLASS_MODES:
        render_mode(generator, device, mode)


if __name__ == "__main__":
    main()
