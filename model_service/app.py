import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Response

from latent_control import ModelRequest
from stylegan_runtime import StyleGanRuntime


runtime = StyleGanRuntime()
load_error: str | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global load_error
    try:
        await asyncio.to_thread(runtime.load)
    except Exception as error:
        load_error = str(error)
    yield


app = FastAPI(title="Virtueme Mac StyleGAN", lifespan=lifespan)


@app.get("/health")
def health():
    if load_error:
        return {"status": "error", "detail": load_error, **runtime.metadata}
    return runtime.metadata


@app.post("/generate")
async def generate(payload: dict):
    if load_error:
        raise HTTPException(status_code=503, detail=load_error)
    try:
        image, metadata = await asyncio.to_thread(runtime.generate_jpeg, ModelRequest.from_dict(payload))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    return Response(
        content=image,
        media_type="image/jpeg",
        headers={
            "X-StyleGAN-Device": str(metadata["device"]),
            "X-StyleGAN-Model": str(metadata["model"]),
            "X-StyleGAN-Seconds": str(metadata["generation_seconds"]),
            "X-StyleGAN-Render-Mode": str(metadata["render_mode"]),
        },
    )
