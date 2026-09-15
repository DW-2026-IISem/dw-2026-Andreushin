import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

/**
 * La liquidación solicitada no existe. Mapea a 404 vía `GlobalExceptionFilter`.
 */
export class SettlementNotFoundException extends EntityNotFoundException {
  constructor(id: number | string) {
    super(`Liquidación con id "${id}" no encontrada`);
  }
}
