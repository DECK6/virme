export const getFlowOffset = (
  x: number,
  y: number,
  time: number,
  latentA: number,
  latentB: number,
  change: number,
  flow: number,
) => {
  const curl = Math.sin(x * Math.PI * 3.4 + time * 0.72 + latentA * 2.1)
    + Math.cos(y * Math.PI * 3.1 - time * 0.54 + latentB * 2.4)
  const angle = curl * Math.PI + Math.atan2(latentB, latentA)
  const amplitude = Math.min(0.42, 0.08 + flow * 0.24 + change * 0.16)
  return { x: Math.cos(angle) * amplitude, y: Math.sin(angle) * amplitude }
}
