import { HttpErrorResponse } from '@angular/common/http';
import { toApiMessage } from './api-error';

describe('toApiMessage', () => {
  it('should explain status 0 as the backend being down', () => {
    const error = new HttpErrorResponse({ status: 0, url: 'http://localhost:4000/api/recyclers' });
    expect(toApiMessage(error)).toContain('No se pudo conectar con el backend');
  });

  it('should show the { message } of the backend for a 403', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: { message: 'No tienes permiso para GET /api/recyclers' },
    });
    expect(toApiMessage(error)).toBe('No tienes permiso para GET /api/recyclers');
  });

  it('should show plain text bodies as they are', () => {
    const error = new HttpErrorResponse({ status: 500, error: 'Error interno del servidor' });
    expect(toApiMessage(error)).toBe('Error interno del servidor');
  });

  it('should fall back for non HTTP errors', () => {
    expect(toApiMessage(new Error('boom'))).toBe('boom');
    expect(toApiMessage('?')).toBe('Error inesperado');
  });
});
