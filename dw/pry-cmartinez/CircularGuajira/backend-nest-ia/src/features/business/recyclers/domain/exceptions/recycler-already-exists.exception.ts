import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * Ya existe un reciclador con el mismo `documentNumber`. Mapea a 409 vía
 * `GlobalExceptionFilter`.
 */
export class RecyclerAlreadyExistsException extends BusinessRuleException {
  constructor(documentNumber: string) {
    super(`Ya existe un reciclador con el documento "${documentNumber}"`);
  }
}
