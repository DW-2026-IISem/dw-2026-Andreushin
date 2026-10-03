import { Transaction } from "sequelize";
import { sequelize } from "../../database/db";

// Unit of work: commits when the callback resolves, rolls back when it throws.
export function withTransaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
  return sequelize.transaction(work);
}
