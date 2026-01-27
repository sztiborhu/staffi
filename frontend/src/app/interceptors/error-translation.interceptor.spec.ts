import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError, of } from 'rxjs';

import { errorTranslationInterceptor } from './error-translation.interceptor';

describe('errorTranslationInterceptor', () => {
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let mockNext: jasmine.Spy;

  beforeEach(() => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    mockNext = jasmine.createSpy('next');
  });

  const createRequest = (url: string): HttpRequest<any> => {
    return new HttpRequest('GET', url);
  };

  it('should be created', () => {
    const interceptor: HttpInterceptorFn = (req, next) =>
      TestBed.runInInjectionContext(() => errorTranslationInterceptor(req, next));
    expect(interceptor).toBeTruthy();
  });

  it('should translate inactive account error', (done) => {
    const req = createRequest('http://localhost:8081/api/some-endpoint');
    const error = new HttpErrorResponse({
      error: { message: 'Account is inactive. Please contact an administrator.' },
      status: 403
    });

    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorTranslationInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(snackBar.open).toHaveBeenCalledWith(
            'A fiók inaktív. Kérjük, lépjen kapcsolatba egy adminisztrátorral.',
            'Bezárás',
            jasmine.objectContaining({
              duration: 5000,
              panelClass: ['error-snackbar']
            })
          );
          done();
        }
      });
    });
  });

  it('should NOT show snackbar for login page errors', (done) => {
    const req = createRequest('http://localhost:8081/api/auth/login');
    const error = new HttpErrorResponse({
      error: { message: 'Account is inactive. Please contact an administrator.' },
      status: 403
    });

    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorTranslationInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(snackBar.open).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('should translate email already exists error', (done) => {
    const req = createRequest('http://localhost:8081/api/employees');
    const error = new HttpErrorResponse({
      error: { message: 'Email already exists' },
      status: 400
    });

    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorTranslationInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(snackBar.open).toHaveBeenCalledWith(
            'Ez az e-mail cím már használatban van',
            'Bezárás',
            jasmine.any(Object)
          );
          done();
        }
      });
    });
  });

  it('should translate room full capacity error with partial match', (done) => {
    const req = createRequest('http://localhost:8081/api/accommodations/rooms');
    const error = new HttpErrorResponse({
      error: { message: 'Room is at full capacity' },
      status: 400
    });

    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorTranslationInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(snackBar.open).toHaveBeenCalledWith(
            'A szoba betelt',
            'Bezárás',
            jasmine.any(Object)
          );
          done();
        }
      });
    });
  });

  it('should handle errors without error.message gracefully', (done) => {
    const req = createRequest('http://localhost:8081/api/employees');
    const error = new HttpErrorResponse({
      error: 'Plain text error',
      status: 500
    });

    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorTranslationInterceptor(req, mockNext).subscribe({
        error: (receivedError) => {
          expect(snackBar.open).not.toHaveBeenCalled();
          expect(receivedError).toBe(error);
          done();
        }
      });
    });
  });

  it('should pass through successful responses', (done) => {
    const req = createRequest('http://localhost:8081/api/employees');
    const response = { data: 'success' };

    mockNext.and.returnValue(of(response as any));

    TestBed.runInInjectionContext(() => {
      errorTranslationInterceptor(req, mockNext).subscribe({
        next: () => {
          expect(snackBar.open).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('should translate Cannot delete room with active allocations', (done) => {
    const req = createRequest('http://localhost:8081/api/accommodations/rooms/1');
    const error = new HttpErrorResponse({
      error: { message: 'Cannot delete room with active allocations. Currently 1 employee(s) living here.' },
      status: 400
    });

    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorTranslationInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(snackBar.open).toHaveBeenCalledWith(
            'Nem törölhető olyan szoba, amelyben dolgozók laknak',
            'Bezárás',
            jasmine.any(Object)
          );
          done();
        }
      });
    });
  });
});
