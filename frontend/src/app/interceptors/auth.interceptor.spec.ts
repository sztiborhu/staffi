import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpEvent, HttpErrorResponse, HttpHandlerFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/authservice/auth.service';

describe('authInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'getAuthToken']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/' });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should pass through successful requests', (done) => {
    const req = new HttpRequest('GET', '/api/test');
    const mockResponse = { status: 200 } as HttpEvent<any>;

    const next: HttpHandlerFn = jasmine.createSpy('next').and.returnValue(of(mockResponse));

    TestBed.runInInjectionContext(() => {
      const interceptor$ = authInterceptor(req, next);

      interceptor$.subscribe({
        next: (event) => {
          expect(event).toEqual(mockResponse);
          expect(authService.logout).not.toHaveBeenCalled();
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('should logout and redirect on 401 error', (done) => {
    const req = new HttpRequest('GET', '/api/test');
    const error401 = new HttpErrorResponse({
      error: 'Unauthorized',
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/test'
    });

    const next: HttpHandlerFn = jasmine.createSpy('next').and.returnValue(throwError(() => error401));

    // Mock router.url
    Object.defineProperty(router, 'url', {
      get: () => '/employees/dashboard',
      configurable: true
    });

    TestBed.runInInjectionContext(() => {
      const interceptor$ = authInterceptor(req, next);

      interceptor$.subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(authService.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(
            ['/'],
            jasmine.objectContaining({
              queryParams: { returnUrl: '/employees/dashboard' },
              replaceUrl: true
            })
          );
          done();
        }
      });
    });
  });

  it('should not add returnUrl when already on login page', (done) => {
    const req = new HttpRequest('GET', '/api/test');
    const error401 = new HttpErrorResponse({ status: 401 });

    const next: HttpHandlerFn = jasmine.createSpy('next').and.returnValue(throwError(() => error401));

    // Mock router.url to be login page
    Object.defineProperty(router, 'url', {
      get: () => '/login',
      configurable: true
    });

    TestBed.runInInjectionContext(() => {
      const interceptor$ = authInterceptor(req, next);

      interceptor$.subscribe({
        error: () => {
          expect(router.navigate).toHaveBeenCalledWith(
            ['/'],
            jasmine.objectContaining({ replaceUrl: true })
          );
          // Should not have queryParams with returnUrl
          const navArgs = router.navigate.calls.mostRecent().args[1];
          expect(navArgs?.queryParams).toBeUndefined();
          done();
        }
      });
    });
  });

  it('should not intercept non-401 errors', (done) => {
    const req = new HttpRequest('GET', '/api/test');
    const error500 = new HttpErrorResponse({ status: 500 });

    const next: HttpHandlerFn = jasmine.createSpy('next').and.returnValue(throwError(() => error500));

    TestBed.runInInjectionContext(() => {
      const interceptor$ = authInterceptor(req, next);

      interceptor$.subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          expect(authService.logout).not.toHaveBeenCalled();
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('should preserve current URL for returnUrl', (done) => {
    const req = new HttpRequest('GET', '/api/test');
    const error401 = new HttpErrorResponse({ status: 401 });

    const next: HttpHandlerFn = jasmine.createSpy('next').and.returnValue(throwError(() => error401));

    // Mock router.url
    Object.defineProperty(router, 'url', {
      get: () => '/admin/employees',
      configurable: true
    });

    TestBed.runInInjectionContext(() => {
      const interceptor$ = authInterceptor(req, next);

      interceptor$.subscribe({
        error: () => {
          const navArgs = router.navigate.calls.mostRecent().args;
          expect(navArgs[1]?.queryParams?.['returnUrl']).toBe('/admin/employees');
          done();
        }
      });
    });
  });
});

