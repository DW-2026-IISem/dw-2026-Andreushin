import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification';

describe('NotificationService', () => {
  it('should translate each severity into MessageService with its duration', () => {
    TestBed.configureTestingModule({ providers: [MessageService] });
    const messages = TestBed.inject(MessageService);
    const added: { severity?: string; life?: number }[] = [];
    messages.messageObserver.subscribe((message) => {
      added.push(...(Array.isArray(message) ? message : [message]));
    });

    const notifications = TestBed.inject(NotificationService);
    notifications.success('Guardado');
    notifications.info('Info');
    notifications.warn('Atención');
    notifications.error('Error');

    expect(added.map(({ severity, life }) => [severity, life])).toEqual([
      ['success', 3000],
      ['info', 3500],
      ['warn', 4500],
      ['error', 6000],
    ]);
  });
});
