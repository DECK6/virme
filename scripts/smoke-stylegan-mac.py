from latent_control import ModelRequest
from stylegan_runtime import ROOT, StyleGanRuntime


request = ModelRequest(
    signals=[0.18, 0.78, 0.22, 0.41, 0.68],
    activity=0.72,
    change=0.36,
    confidence=0.88,
    intensity=0.86,
    state="novelty",
    seed=609348,
)
image, metadata = StyleGanRuntime().generate_jpeg(request)
output = ROOT / "generated" / "stylegan-mac-smoke.jpg"
output.parent.mkdir(exist_ok=True)
output.write_bytes(image)
print({**metadata, "output": str(output), "bytes": len(image)})
