import { DomainException } from '../../../../../common/exceptions/domain.exception.js';

/**
 * Invariante de dominio (INV-01): el peso bruto debe ser mayor que la tara
 * (peso neto resultante > 0). Mapea a 400 vía `GlobalExceptionFilter`.
 */
export class InvalidWeightException extends DomainException {
  constructor(grossWeight: number, tareWeight: number) {
    super(
      `El peso bruto (${grossWeight}) debe ser mayor que la tara (${tareWeight})`,
    );
  }
}
