import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

/**
 * El producto solicitado no existe. Mapea a 404 vía `GlobalExceptionFilter`.
 */
export class ProductNotFoundException extends EntityNotFoundException {
  constructor(id: number | string) {
    super(`Producto con id "${id}" no encontrado`);
  }
}
