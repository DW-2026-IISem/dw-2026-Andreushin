export type Status = 'active' | 'inactive';

/** Numeric columns (kg, amounts, rates) may arrive as number or as a DECIMAL string. */
export type Money = number | string;

/** Error body of the backend: `handleError` always answers `{ message }`. */
export interface ApiError {
  message: string;
}

/** Answer of the physical deletes (`DELETE /:id`). */
export interface ApiMessage {
  message: string;
}

/** Minimal signature of the Sequelize objects the backend returns. */
export interface Timestamps {
  createdAt?: string;
  updatedAt?: string;
}

export function toNumber(value: Money | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
