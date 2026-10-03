// Rows to generate per table. Override from the CLI: npm run db:seed -- --recyclers=25 --collection-points=40
export interface SeedCounts {
  recyclers: number;
  routes: number;
  collectionPoints: number;
  collections: number;
  materials: number;
  materialRates: number;
  plants: number;
  materialLots: number;
  weighings: number;
  materialSales: number;
  settlements: number;
}

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  recyclers: 10,
  routes: 5,
  collectionPoints: 15,
  collections: 10,
  materials: 8,
  materialRates: 8,
  plants: 3,
  materialLots: 6,
  weighings: 20,
  materialSales: 10,
  settlements: 10,
};

// Accepts --collection-points=N, --collection_points=N and --collectionPoints=N.
const toCamelCase = (key: string): string => key.replace(/[-_]([a-z])/g, (_, letter: string) => letter.toUpperCase());

export function resolveSeedCounts(argv: string[] = process.argv.slice(2)): SeedCounts {
  const counts: SeedCounts = { ...DEFAULT_SEED_COUNTS };
  for (const arg of argv) {
    const match = arg.match(/^--([a-zA-Z_-]+)=(\d+)$/);
    if (!match) continue;
    const key = toCamelCase(match[1]);
    if (key in counts) {
      counts[key as keyof SeedCounts] = Number(match[2]);
    } else {
      console.warn(`⚠️  Unknown seed count "${match[1]}", ignored`);
    }
  }
  return counts;
}
