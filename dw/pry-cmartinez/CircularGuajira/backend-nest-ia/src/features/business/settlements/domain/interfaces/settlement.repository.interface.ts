import type { SettlementEntity } from '../entities/settlement.entity.js';

/**
 * Token de inyección de dependencias del puerto `ISettlementRepository`.
 * Un `Symbol` es una construcción nativa de TypeScript, no un import de
 * framework: puede vivir en el dominio sin violar la regla de pureza.
 */
export const SETTLEMENT_REPOSITORY = Symbol('SETTLEMENT_REPOSITORY');

export interface CreateWeighingItemData {
  materialId: number;
  grossWeight: number;
  tareWeight: number;
}

export interface CreateSettlementData {
  recyclerId: number;
  items: CreateWeighingItemData[];
  tax: number;
  discounts: number;
}

/**
 * Puerto de persistencia del feature `settlements`. Definido en el
 * dominio e implementado por la capa de infraestructura
 * (`SettlementRepository`), que envuelve `create` en una transacción
 * atómica de Sequelize.
 */
export interface ISettlementRepository {
  create(data: CreateSettlementData): Promise<SettlementEntity>;
  findById(id: number): Promise<SettlementEntity | null>;
}
