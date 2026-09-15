import type { ProductSaleEntity } from './product-sale.entity.js';

/**
 * Entidad pura de dominio (agregado cabecera/detalle). Sin decoradores de
 * Sequelize/NestJS ni dependencias de framework: representa la cabecera de
 * una venta y sus líneas de detalle (`items`).
 */
export class SaleEntity {
  constructor(
    public readonly id: number,
    public readonly saleDate: Date,
    public readonly subtotal: number,
    public readonly tax: number,
    public readonly discounts: number,
    public readonly total: number,
    public readonly status: string,
    public readonly clientId: number,
    public readonly items: ProductSaleEntity[],
  ) {}
}
