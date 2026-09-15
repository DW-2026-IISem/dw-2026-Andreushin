import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * No se puede registrar una tarifa para un material inactivo. Mapea a 409
 * vía `GlobalExceptionFilter`.
 */
export class MaterialInactiveException extends BusinessRuleException {
  constructor(materialId: number) {
    super(`El material con id "${materialId}" está inactivo`);
  }
}
