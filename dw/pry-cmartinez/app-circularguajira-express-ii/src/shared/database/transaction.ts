import { Transaction } from "sequelize";
import { sequelize } from "../../database/db";

// Runs related writes atomically: commits when `work` resolves, rolls back if it throws.
export const withTransaction = <T>(work: (transaction: Transaction) => Promise<T>): Promise<T> =>
  sequelize.transaction(work);
