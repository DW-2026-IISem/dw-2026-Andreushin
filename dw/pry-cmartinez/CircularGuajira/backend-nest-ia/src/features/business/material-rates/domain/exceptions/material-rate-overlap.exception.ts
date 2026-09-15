import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * Ya existe una tarifa activa para el material que se solapa con el rango
 * de fechas indicado. Mapea a 409 vía `GlobalExceptionFilter`.
 */
export class MaterialRateOverlapException extends BusinessRuleException {
  constructor(materialId: number) {
    super(
      `Ya existe una tarifa activa para el material con id "${materialId}" que se solapa con el rango de fechas indicado`,
    );
  }
}
