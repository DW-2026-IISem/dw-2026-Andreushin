import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Forbidden } from './forbidden';

describe('Forbidden', () => {
  it('should show the missing grant from the query string', async () => {
    await TestBed.configureTestingModule({
      imports: [Forbidden],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ permission: 'GET /api/recyclers' }) },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Forbidden);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Permiso requerido');
    expect(text).toContain('GET /api/recyclers');
  });
});
