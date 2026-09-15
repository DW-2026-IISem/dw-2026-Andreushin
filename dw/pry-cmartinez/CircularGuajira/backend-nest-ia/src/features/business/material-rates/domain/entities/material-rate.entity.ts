import { InsufficientStockException } from '../exceptions/insufficient-stock.exception.js';

/**
 * Entidad pura de dominio. Sin decoradores de Sequelize/NestJS ni
 * dependencias de framework: representa la tarifa vigente (o histórica)
 * por kilogramo de un material, junto con su stock acumulado en planta.
 */
export class MaterialRateEntity {
  constructor(
    public readonly id: number,
    public readonly materialId: number,
    public pricePerKg: number,
    public minStockKg: number,
    public stockKg: number,
    /** Fecha calendario en formato ISO `YYYY-MM-DD` (sin componente de hora/zona horaria). */
    public readonly startDate: string,
    public endDate: string | null,
    public isActive: boolean,
  ) {}

  /**
   * Invariante de dominio: reduce el stock (kg) disponible. Lanza
   * `InsufficientStockException` si la cantidad a reducir es negativa o si
   * dejaría el inventario en negativo.
   */
  reduceStockKg(n: number): void {
    if (n < 0 || this.stockKg - n < 0) {
      throw new InsufficientStockException(this.stockKg, n);
    }

    this.stockKg -= n;
  }
}
