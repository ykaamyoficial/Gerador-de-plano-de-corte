export function mm2ToM2(areaMm2: number): number {
  return areaMm2 / 1_000_000
}

export function calculateAreaM2(widthMm: number, lengthMm: number): number {
  return mm2ToM2(widthMm * lengthMm)
}
