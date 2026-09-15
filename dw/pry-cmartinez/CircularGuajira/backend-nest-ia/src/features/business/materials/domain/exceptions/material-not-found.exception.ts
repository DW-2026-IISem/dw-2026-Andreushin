import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

/**
 * El material solicitado no existe. Mapea a 404 vía `GlobalExceptionFilter`.
 */
export class MaterialNotFoundException extends EntityNotFoundException {
  constructor(id: number | string) {
    super(`Material con id "${id}" no encontrado`);
  }
}
