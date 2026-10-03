// Helpers for DECIMAL(x, 2) quantities (kg, COP): validate precision and round sums without float drift.

export const hasAtMostTwoDecimals = (value: number): boolean => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const roundTo2 = (value: number): number => Math.round(value * 100) / 100;
