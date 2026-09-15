import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * La reducción de stock solicitada dejaría el inventario en negativo (o el
 * monto a reducir es negativo). Mapea a 409 vía `GlobalExceptionFilter`.
 */
export class InsufficientStockException extends BusinessRuleException {
  constructor(available: number, requested: number) {
    super(
      `Stock insuficiente para reducir ${requested} unidades (disponible: ${available})`,
    );
  }
}
