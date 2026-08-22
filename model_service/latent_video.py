import torch


def loop_coordinates(frame: float, frame_count: int, key_count: int) -> tuple[int, int, float]:
    phase = ((frame % frame_count) / frame_count) * key_count
    current = int(phase // 1) % key_count
    following = (current + 1) % key_count
    local = phase - (phase // 1)
    eased = local * local * local * (local * (local * 6 - 15) + 10)
    return current, following, eased


def interpolate_loop(keyframes: torch.Tensor, frame: float, frame_count: int) -> torch.Tensor:
    current, following, mix = loop_coordinates(frame, frame_count, keyframes.shape[0])
    return keyframes[current].lerp(keyframes[following], mix)
