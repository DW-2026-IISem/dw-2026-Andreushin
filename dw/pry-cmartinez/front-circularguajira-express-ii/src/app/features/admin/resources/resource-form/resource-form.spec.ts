import { TestBed } from '@angular/core/testing';
import { ResourcePayload } from '../../../../core/models/resource.model';
import { RESOURCE_PATH_PATTERN, ResourceForm } from './resource-form';

describe('ResourceForm', () => {
  it('should accept API patterns and reject paths that do not start with /api', () => {
    expect(RESOURCE_PATH_PATTERN.test('/api/collections/:id')).toBe(true);
    expect(RESOURCE_PATH_PATTERN.test('/api/settlements/:id/verify')).toBe(true);
    expect(RESOURCE_PATH_PATTERN.test('api/collections')).toBe(false);
    expect(RESOURCE_PATH_PATTERN.test('/collections')).toBe(false);
    expect(RESOURCE_PATH_PATTERN.test('/api/Collections')).toBe(false);
    expect(RESOURCE_PATH_PATTERN.test('/api/reports/')).toBe(true);
  });

  it('should drop the trailing slash and send the status on create', async () => {
    await TestBed.configureTestingModule({ imports: [ResourceForm] }).compileComponents();
    const fixture = TestBed.createComponent(ResourceForm);
    await fixture.whenStable();
    const emitted: ResourcePayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => emitted.push(payload));
    fixture.componentInstance.form.setValue({ method: 'GET', path: '/api/reports/', description: '', status: 'active' });
    fixture.componentInstance.submit();
    expect(emitted[0]).toEqual({ method: 'GET', path: '/api/reports', description: null, status: 'active' });
  });
});
