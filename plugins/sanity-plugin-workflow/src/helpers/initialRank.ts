import {LexoRank} from 'lexorank'

// Use in initial value field by passing in the rank value of the last document
// If no value passed, generate a sensibly low rank
export default function initialRank(lastRankValue = ``): string {
  const lastRank =
    lastRankValue && typeof lastRankValue === 'string'
      ? LexoRank.parse(lastRankValue)
      : LexoRank.min()
  const nextRank = lastRank.genNext().genNext()

  // oxlint-disable-next-line no-unsafe-type-assertion
  return (nextRank as any).value
}
