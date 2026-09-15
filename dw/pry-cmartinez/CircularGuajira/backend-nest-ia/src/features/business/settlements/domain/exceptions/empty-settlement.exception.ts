import { DomainException } from '../../../../../common/exceptions/domain.exception.js';

/**
 * Una liquidación no puede registrarse sin al menos un pesaje. Mapea a 400
 * vía `GlobalExceptionFilter`.
 */
export class EmptySettlementException extends DomainException {
  constructor() {
    super('La liquidación debe tener al menos un pesaje');
  }
}
