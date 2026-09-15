import { InvalidWeightException } from '../exceptions/invalid-weight.exception.js';

/**
 * Entidad pura de dominio. Sin decoradores de Sequelize/NestJS ni
 * dependencias de framework: representa un pesaje individual dentro de una
 * liquidación. `netWeight` y `total` se derivan en el constructor, nunca
 * se reciben calculados desde afuera.
 *
 * INVARIANTE DE DOMINIO (INV-01): lanza `InvalidWeightException` si el
 * peso bruto no es mayor que la tara (peso neto resultante <= 0).
 */
export class WeighingEntity {
  public readonly netWeight: number;
  public readonly total: number;

  constructor(
    public readonly id: number,
    public readonly settlementId: number,
    public readonly materialId: number,
    public readonly grossWeight: number,
    public readonly tareWeight: number,
    public readonly pricePerKg: number,
  ) {
    const netWeight = grossWeight - tareWeight;

    if (grossWeight <= tareWeight || netWeight <= 0) {
      throw new InvalidWeightException(grossWeight, tareWeight);
    }

    this.netWeight = netWeight;
    this.total = netWeight * pricePerKg;
  }
}
