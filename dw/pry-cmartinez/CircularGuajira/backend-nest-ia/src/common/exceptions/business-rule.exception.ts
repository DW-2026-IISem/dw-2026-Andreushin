import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from './application.exception.js';

/**
 * Violación de una regla de negocio, duplicidad de clave única o conflicto
 * de estado. Mapea a 409 Conflict.
 */
export class BusinessRuleException extends ApplicationException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}
