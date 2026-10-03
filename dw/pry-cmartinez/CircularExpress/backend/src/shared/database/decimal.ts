// MySQL and PostgreSQL return DECIMAL columns as strings to keep precision; models expose them as numbers.
// null/undefined (e.g. attribute not selected) pass through untouched.
export const decimalToNumber = (value: unknown): number =>
  value === null || value === undefined ? (value as unknown as number) : Number(value);
