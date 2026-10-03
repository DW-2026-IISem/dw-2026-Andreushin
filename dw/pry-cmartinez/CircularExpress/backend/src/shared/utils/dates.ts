// Date-only helpers ("YYYY-MM-DD") anchored to La Guajira's time zone.
const BUSINESS_TIME_ZONE = "America/Bogota";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Today in the business time zone (en-CA formats dates in ISO order).
export const todayInBusinessZone = (): string =>
  new Date().toLocaleDateString("en-CA", { timeZone: BUSINESS_TIME_ZONE });

// True for well-formed, existing calendar dates (rejects 2026-02-30).
export const isValidDateOnly = (value: unknown): value is string => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

// `date` minus n days, computed in UTC to avoid DST shifts.
export const daysBefore = (date: string, days: number): string => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
};
