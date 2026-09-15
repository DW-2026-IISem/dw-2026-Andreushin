import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * Invariante de negocio (INV-02): no existe una tarifa activa vigente para
 * el material a la fecha de la liquidación. Mapea a 409 vía
 * `GlobalExceptionFilter`.
 */
export class NoActiveRateForMaterialException extends BusinessRuleException {
  constructor(materialId: number) {
    super(`No existe una tarifa activa para el material con id "${materialId}"`);
  }
}
