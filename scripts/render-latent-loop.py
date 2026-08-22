import subprocess
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from latent_video import interpolate_loop
from stylegan_runtime import StyleGanRuntime, latent_rgb_structure_fields, structure_map_to_rgb, synthesize_latent_stage


FPS = 12
DURATION_SECONDS = 12
FRAME_COUNT = FPS * DURATION_SECONDS
BATCH_SIZE = 6
KEY_SEEDS = (609348, 192781, 884013, 447201, 730119)
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "latent-landscape-loop.mp4"


def main():
    runtime = StyleGanRuntime().load()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    latents = np.stack([np.random.RandomState(seed).randn(runtime.generator.z_dim) for seed in KEY_SEEDS])
    with torch.no_grad():
        z = torch.from_numpy(latents).to(device=runtime.device, dtype=torch.float32)
        key_ws = runtime.generator.mapping(z, None, truncation_psi=0.72)

    resolution = int(runtime.generator.img_resolution)
    command = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pixel_format", "rgb24",
        "-video_size", f"{resolution}x{resolution}",
        "-framerate", str(FPS), "-i", "-", "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUTPUT),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    if encoder.stdin is None:
        raise RuntimeError("ffmpeg stdin unavailable")

    with torch.no_grad():
        for batch_start in range(0, FRAME_COUNT, BATCH_SIZE):
            batch_frames = list(range(batch_start, min(FRAME_COUNT, batch_start + BATCH_SIZE)))
            sample_ws = []
            for frame in batch_frames:
                sample_ws.extend([
                    interpolate_loop(key_ws, frame, FRAME_COUNT),
                    interpolate_loop(key_ws, frame - 0.8, FRAME_COUNT),
                    interpolate_loop(key_ws, frame + 0.8, FRAME_COUNT),
                ])
            _, progressive = synthesize_latent_stage(
                runtime.generator.synthesis,
                torch.stack(sample_ws),
                128,
            )
            progressive = progressive.reshape(len(batch_frames), 3, 3, 128, 128)
            weights = torch.tensor((0.5, 0.25, 0.25), device=runtime.device, dtype=progressive.dtype)
            for images in progressive:
                fields = latent_rgb_structure_fields(images, weights)
                frame_rgb = structure_map_to_rgb(fields, "stability").permute(1, 2, 0).numpy()
                frame_image = Image.fromarray(frame_rgb, "RGB").resize(
                    (resolution, resolution),
                    Image.Resampling.LANCZOS,
                )
                encoder.stdin.write(np.asarray(frame_image).tobytes())
            if runtime.device.type == "mps":
                torch.mps.synchronize()
            print(f"rendered {batch_frames[-1] + 1}/{FRAME_COUNT}", flush=True)

    encoder.stdin.close()
    return_code = encoder.wait()
    if return_code != 0:
        raise RuntimeError(f"ffmpeg exited with {return_code}")
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
