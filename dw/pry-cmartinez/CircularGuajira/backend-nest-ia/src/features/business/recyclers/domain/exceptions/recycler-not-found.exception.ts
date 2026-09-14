import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

/**
 * El reciclador solicitado no existe. Mapea a 404 vía `GlobalExceptionFilter`.
 */
export class RecyclerNotFoundException extends EntityNotFoundException {
  constructor(id: number | string) {
    super(`Reciclador con id "${id}" no encontrado`);
  }
}
