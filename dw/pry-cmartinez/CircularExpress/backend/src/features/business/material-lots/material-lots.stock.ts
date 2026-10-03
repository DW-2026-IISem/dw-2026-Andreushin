import { Transaction } from "sequelize";
import { ConflictError, ValidationError } from "../../../shared/errors/app-error";
import { roundTo2 } from "../../../shared/utils/numbers";
import { MaterialLotsRepository } from "./material-lots.repository";

// One operation's effect on a lot's stock (kg): positive adds (weighings), negative removes (sales).
export interface StockEffect {
  lotId: number;
  kg: number;
}

// Applies "remove the old effect, add the new one" to every touched lot with atomic UPDATEs, in lot id
// order so concurrent operations lock rows in the same order (no deadlocks). Never leaves a lot below 0:
// the guarded UPDATE affects no row and a 409 is raised with `conflictMessage`.
export async function applyStockChange(
  repository: MaterialLotsRepository,
  oldEffect: StockEffect | null,
  newEffect: StockEffect | null,
  transaction: Transaction,
  conflictMessage: string
): Promise<void> {
  const deltas = new Map<number, number>();
  if (oldEffect) deltas.set(oldEffect.lotId, (deltas.get(oldEffect.lotId) ?? 0) - oldEffect.kg);
  if (newEffect) deltas.set(newEffect.lotId, (deltas.get(newEffect.lotId) ?? 0) + newEffect.kg);

  for (const lotId of [...deltas.keys()].sort((a, b) => a - b)) {
    const delta = roundTo2(deltas.get(lotId)!);
    if (delta === 0) continue;
    if (await repository.adjustWeight(lotId, delta, transaction)) continue;
    const lot = await repository.findById(lotId, transaction);
    if (!lot) throw new ValidationError("El lote indicado no existe", { materialLotId: lotId });
    throw new ConflictError(conflictMessage, { materialLotId: lotId, stockKg: lot.weightKg, requiredKg: -delta });
  }
}
