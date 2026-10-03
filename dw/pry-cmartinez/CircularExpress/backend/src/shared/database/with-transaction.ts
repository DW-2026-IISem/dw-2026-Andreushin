import { Transaction } from "sequelize";
import { sequelize } from "../../database/db";

const MAX_ATTEMPTS = 3;

// Deadlock / serialization failure codes per engine: the database aborted the transaction and asks to retry.
const isRetryable = (error: unknown): boolean => {
  const parent = (error as { parent?: Record<string, unknown> })?.parent ?? {};
  return (
    parent.code === "ER_LOCK_DEADLOCK" || // MySQL 1213
    parent.errno === 1213 ||
    parent.code === "40P01" || // PostgreSQL deadlock_detected
    parent.code === "40001" || // serialization_failure (PostgreSQL, MySQL)
    parent.number === 1205 || // SQL Server deadlock victim
    parent.errorNum === 60 || // Oracle ORA-00060
    /ORA-00060/.test(String(parent.message ?? ""))
  );
};

// Unit of work: commits when the callback resolves, rolls back when it throws. A transaction chosen as a
// deadlock victim is retried (whole callback, fresh transaction) up to MAX_ATTEMPTS times.
export async function withTransaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await sequelize.transaction(work);
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 * attempt + Math.random() * 25));
    }
  }
}
