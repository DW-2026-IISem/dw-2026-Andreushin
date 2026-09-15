import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

/**
 * La venta solicitada no existe. Mapea a 404 vía `GlobalExceptionFilter`.
 */
export class SaleNotFoundException extends EntityNotFoundException {
  constructor(id: number | string) {
    super(`Venta con id "${id}" no encontrada`);
  }
}
