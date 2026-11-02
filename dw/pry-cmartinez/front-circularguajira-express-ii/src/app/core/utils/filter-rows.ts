/**
 * Reusable local filter for PrimeNG 22 tables.
 *
 * PrimeNG 22 removed the `globalFilter` input of `p-table`, so the array is filtered
 * **before** it reaches `[value]`. It is a pure function: it depends on no DOM, table or
 * Angular, so it is tested without mounting anything.
 */
export function filterRows<T>(
  rows: readonly T[],
  query: string,
  pick: (row: T) => Array<string | number | null | undefined>,
): T[] {
  const term = query.trim().toLowerCase();

  // Without a term a copy is returned: the caller may mutate the result without touching
  // the original array that lives in the signal.
  if (!term) {
    return [...rows];
  }

  return rows.filter((row) =>
    pick(row).some((value) => (value ?? '').toString().toLowerCase().includes(term)),
  );
}
