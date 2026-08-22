from dataclasses import dataclass


def _clamp(value: float) -> float:
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return 0.0


@dataclass(frozen=True)
class ModelRequest:
    signals: list[float]
    activity: float
    change: float
    confidence: float
    intensity: float
    state: str
    seed: int
    variation: int = 0

    @classmethod
    def from_dict(cls, payload: dict) -> "ModelRequest":
        signals = list(payload.get("signals", []))[:5]
        signals += [0.0] * (5 - len(signals))
        return cls(
            signals=[_clamp(value) for value in signals],
            activity=_clamp(payload.get("activity", 0.0)),
            change=_clamp(payload.get("change", 0.0)),
            confidence=_clamp(payload.get("confidence", 0.0)),
            intensity=_clamp(payload.get("intensity", 0.0)),
            state=str(payload.get("state", "stability")),
            seed=max(0, int(payload.get("seed", 0))) % (2**31),
            variation=max(0, int(payload.get("variation", 0))),
        )


@dataclass(frozen=True)
class LatentControl:
    seed: int
    secondary_seeds: tuple[int, ...]
    weights: tuple[float, ...]
    truncation: float
    noise_strength: float


def derive_control(request: ModelRequest) -> LatentControl:
    modulus = 2**31
    secondary = tuple(
        (request.seed * 1103515245 + 12345 + index * 2654435761 + round(signal * 1_000_003)) % modulus
        for index, signal in enumerate(request.signals)
    )
    signal_total = sum(request.signals)
    signal_weights = (
        tuple(signal / signal_total for signal in request.signals)
        if signal_total > 0
        else (0.2, 0.2, 0.2, 0.2, 0.2)
    )
    primary_weight = max(0.16, 0.48 - request.change * 0.25)
    weights = (primary_weight,) + tuple((1.0 - primary_weight) * weight for weight in signal_weights)
    truncation = _clamp(0.42 + request.confidence * 0.2 + request.intensity * 0.1 + request.activity * 0.075 - request.change * 0.05)
    return LatentControl(
        seed=request.seed,
        secondary_seeds=secondary,
        weights=weights,
        truncation=max(0.35, truncation),
        noise_strength=_clamp(0.15 + request.change * 0.55 + request.activity * 0.2),
    )
