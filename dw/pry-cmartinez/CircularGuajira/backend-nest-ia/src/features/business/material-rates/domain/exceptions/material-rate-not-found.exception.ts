import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

/**
 * La tarifa de material solicitada no existe (o no hay una vigente para el
 * material y fecha consultados). Mapea a 404 vía `GlobalExceptionFilter`.
 */
export class MaterialRateNotFoundException extends EntityNotFoundException {
  constructor(id: number | string) {
    super(`Tarifa de material con id "${id}" no encontrada`);
  }
}
