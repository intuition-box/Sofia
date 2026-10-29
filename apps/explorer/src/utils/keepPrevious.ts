/**
 * `placeholderData` for a query whose key moves with fresher inputs (a
 * ranking, a value ratio, a set of claim ids): keep showing the previous
 * data while the new key loads — instead of a loader — but only for the
 * same owner (key part `index` unchanged), never another wallet's data.
 */
export function keepPreviousIfSame(index: number, value: unknown) {
  return <T>(
    previousData: T | undefined,
    previousQuery: { queryKey: readonly unknown[] } | undefined,
  ): T | undefined =>
    previousQuery?.queryKey[index] === value ? previousData : undefined
}
