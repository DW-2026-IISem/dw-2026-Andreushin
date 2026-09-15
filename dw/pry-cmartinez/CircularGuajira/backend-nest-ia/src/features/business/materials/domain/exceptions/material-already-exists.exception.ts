import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

/**
 * Ya existe un material con el mismo `name`. Mapea a 409 vía
 * `GlobalExceptionFilter`.
 */
export class MaterialAlreadyExistsException extends BusinessRuleException {
  constructor(name: string) {
    super(`Ya existe un material con el nombre "${name}"`);
  }
}
