import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * La reducción de stock (kg) solicitada dejaría el inventario de la tarifa
 * en negativo. Mapea a 409 vía `GlobalExceptionFilter`.
 */
export class InsufficientStockException extends BusinessRuleException {
  constructor(availableKg: number, requestedKg: number) {
    super(
      `Stock insuficiente para reducir ${requestedKg} kg (disponible: ${availableKg} kg)`,
    );
  }
}
