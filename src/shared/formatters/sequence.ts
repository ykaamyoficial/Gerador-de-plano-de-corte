import { formatMm } from './formatMm'

interface SequencePiece {
  lengthMm: number
}

export function groupedSequenceLabel(pieces: readonly SequencePiece[]): string {
  const groups: Array<{ lengthMm: number; count: number }> = []
  for (const piece of pieces) {
    const last = groups[groups.length - 1]
    if (last && last.lengthMm === piece.lengthMm) {
      last.count += 1
    } else {
      groups.push({ lengthMm: piece.lengthMm, count: 1 })
    }
  }
  return groups
    .map((group) =>
      group.count > 1
        ? `${group.count} peças de ${formatMm(group.lengthMm)}`
        : `1 peça de ${formatMm(group.lengthMm)}`,
    )
    .join(' + ')
}

export function detailedSequenceLabel(pieces: readonly SequencePiece[]): string {
  return pieces.map((piece) => piece.lengthMm).join(' + ')
}
