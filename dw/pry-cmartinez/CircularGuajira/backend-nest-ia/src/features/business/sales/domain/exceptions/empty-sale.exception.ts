import { DomainException } from '../../../../../common/exceptions/domain.exception.js';

/**
 * Una venta no puede registrarse sin al menos un ítem. Mapea a 400 vía
 * `GlobalExceptionFilter`.
 */
export class EmptySaleException extends DomainException {
  constructor() {
    super('La venta debe tener al menos un ítem');
  }
}
