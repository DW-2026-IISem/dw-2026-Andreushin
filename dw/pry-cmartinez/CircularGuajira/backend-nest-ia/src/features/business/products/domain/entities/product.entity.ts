import { InsufficientStockException } from '../exceptions/insufficient-stock.exception.js';

/**
 * Entidad pura de dominio. Sin decoradores de Sequelize/NestJS ni
 * dependencias de framework: representa un producto terminado elaborado a
 * partir de un material reciclable.
 */
export class ProductEntity {
  constructor(
    public readonly id: number,
    public name: string,
    public brand: string | null,
    public price: number,
    public minStock: number,
    public quantity: number,
    public materialId: number,
    public isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Invariante de dominio: reduce el stock disponible. Lanza
   * `InsufficientStockException` si la cantidad a reducir es negativa o si
   * dejaría el inventario en negativo.
   */
  reduceStock(n: number): void {
    if (n < 0 || this.quantity - n < 0) {
      throw new InsufficientStockException(this.quantity, n);
    }

    this.quantity -= n;
  }
}
