import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from './application.exception.js';

/**
 * El recurso/entidad solicitado no existe. Mapea a 404 Not Found.
 */
export class EntityNotFoundException extends ApplicationException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}
