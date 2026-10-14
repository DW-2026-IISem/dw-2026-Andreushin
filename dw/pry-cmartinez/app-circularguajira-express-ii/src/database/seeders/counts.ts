/**
 * Rows per feature/entity.
 * Priority: CLI (--recyclers=N) > env (SEED_RECYCLERS) > default in this file.
 * camelCase keys map to SNAKE_CASE env vars (materialRates -> SEED_MATERIAL_RATES).
 *
 * When a feature gets a seeder, add its key here and call it from the runner.
 */
export type SeedCounts = {
  recyclers: number;
  materials: number;
  // Monthly rate periods per material.
  materialRates: number;
  routes: number;
  // Collection points per route.
  collectionPoints: number;
  collections: number;
  // Weighings per collection.
  weighings: number;
  // Target of issued settlements.
  settlements: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  recyclers: 10,
  materials: 10,
  materialRates: 3,
  routes: 6,
  collectionPoints: 4,
  collections: 8,
  weighings: 3,
  settlements: 4,
};

const toCount = (raw: string, source: string): number => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid seed count in ${source}: "${raw}"`);
  }
  return value;
};

const isSeedKey = (key: string): key is keyof SeedCounts => key in DEFAULT_SEED_COUNTS;

export function resolveSeedCounts(argv: string[] = process.argv.slice(2)): SeedCounts {
  const counts: SeedCounts = { ...DEFAULT_SEED_COUNTS };

  for (const key of Object.keys(counts)) {
    const envName = `SEED_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
    const envValue = process.env[envName];
    if (isSeedKey(key) && envValue !== undefined && envValue !== "") {
      counts[key] = toCount(envValue, envName);
    }
  }

  for (const arg of argv) {
    const match = arg.match(/^--([a-zA-Z_]+)=(.*)$/);
    if (match && isSeedKey(match[1])) {
      counts[match[1]] = toCount(match[2], arg);
    }
  }

  return counts;
}
