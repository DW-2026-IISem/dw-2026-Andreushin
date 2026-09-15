import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * No se puede registrar una liquidación para un reciclador inactivo. Mapea
 * a 409 vía `GlobalExceptionFilter`.
 */
export class RecyclerInactiveException extends BusinessRuleException {
  constructor(recyclerId: number) {
    super(`El reciclador con id "${recyclerId}" está inactivo`);
  }
}
