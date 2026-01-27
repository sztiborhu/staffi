import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/authservice/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getAuthToken',
      'isTokenExpired',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Create mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;
  });

  it('should allow access when token is valid', () => {
    authService.getAuthToken.and.returnValue('valid-token');
    authService.isTokenExpired.and.returnValue(false);

    TestBed.runInInjectionContext(() => {
      const result = authGuard(mockRoute, mockState);
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  it('should redirect to login when no token exists', () => {
    authService.getAuthToken.and.returnValue(null);

    TestBed.runInInjectionContext(() => {
      const result = authGuard(mockRoute, mockState);
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(
        ['/'],
        { queryParams: { returnUrl: '/admin/dashboard' } }
      );
    });
  });

  it('should logout and redirect when token is expired', () => {
    authService.getAuthToken.and.returnValue('expired-token');
    authService.isTokenExpired.and.returnValue(true);

    TestBed.runInInjectionContext(() => {
      const result = authGuard(mockRoute, mockState);
      expect(result).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/'],
        { queryParams: { returnUrl: '/admin/dashboard' } }
      );
    });
  });

  it('should preserve return URL in query params', () => {
    authService.getAuthToken.and.returnValue(null);
    const customState = { url: '/employees/dashboard' } as RouterStateSnapshot;

    TestBed.runInInjectionContext(() => {
      const result = authGuard(mockRoute, customState);
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(
        ['/'],
        { queryParams: { returnUrl: '/employees/dashboard' } }
      );
    });
  });

  it('should handle empty token string as no token', () => {
    authService.getAuthToken.and.returnValue('');

    TestBed.runInInjectionContext(() => {
      const result = authGuard(mockRoute, mockState);
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalled();
    });
  });
});

