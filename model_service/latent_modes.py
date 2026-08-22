from dataclasses import dataclass


@dataclass(frozen=True)
class LatentMode:
    mode_id: str
    output_name: str
    classes: tuple[int, ...]
    seeds: tuple[int, ...]


MULTI_CLASS_MODES = (
    LatentMode(
        mode_id="object",
        output_name="latent-object-loop.mp4",
        classes=(414, 504, 559, 732, 892, 968),
        seeds=(14041, 25043, 36047, 47051, 58057, 69061),
    ),
    LatentMode(
        mode_id="situation",
        output_name="latent-situation-loop.mp4",
        classes=(424, 454, 582, 624, 762, 819, 978),
        seeds=(17011, 28019, 39023, 41039, 52051, 63059, 74071),
    ),
)
