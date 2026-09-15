import type { WeighingEntity } from './weighing.entity.js';

export type SettlementStatus = 'EMITIDA' | 'PAGADA' | 'ANULADA';

/**
 * Entidad pura de dominio (agregado cabecera/detalle). Sin decoradores de
 * Sequelize/NestJS ni dependencias de framework: representa la cabecera de
 * una liquidación de compra de material a un reciclador y sus pesajes
 * (`items`).
 */
export class SettlementEntity {
  constructor(
    public readonly id: number,
    public readonly recyclerId: number,
    public readonly settlementDate: Date,
    public readonly subtotal: number,
    public readonly tax: number,
    public readonly discounts: number,
    public readonly total: number,
    public readonly status: SettlementStatus,
    public readonly items: WeighingEntity[],
  ) {}
}
