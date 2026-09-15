/**
 * Entidad pura de dominio. Sin decoradores de Sequelize/NestJS ni
 * dependencias de framework: representa una línea de detalle (un producto
 * vendido) dentro de una venta.
 */
export class ProductSaleEntity {
  constructor(
    public readonly id: number,
    public readonly saleId: number,
    public readonly productId: number,
    public readonly quantity: number,
    public readonly unitPrice: number,
    public readonly total: number,
  ) {}
}
