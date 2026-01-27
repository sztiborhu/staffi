import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/authservice/auth.service';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getUserRole'
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

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/admin/employees' } as RouterStateSnapshot;
  });

  describe('ADMIN role', () => {
    it('should allow access for ADMIN users', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue('ADMIN');

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('HR role', () => {
    it('should allow access for HR users', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue('HR');

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('EMPLOYEE role', () => {
    it('should deny access for EMPLOYEE users', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue('EMPLOYEE');

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });
  });

  describe('Unauthenticated users', () => {
    it('should redirect to login when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(
          ['/'],
          { queryParams: { returnUrl: '/admin/employees' } }
        );
      });
    });

    it('should preserve return URL when redirecting unauthenticated user', () => {
      authService.isAuthenticated.and.returnValue(false);
      const customState = { url: '/admin/contracts' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, customState);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(
          ['/'],
          { queryParams: { returnUrl: '/admin/contracts' } }
        );
      });
    });
  });

  describe('Invalid roles', () => {
    it('should deny access for unknown roles', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue('UNKNOWN_ROLE');

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });

    it('should deny access when role is null', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue(null as any);

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });

    it('should deny access when role is undefined', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue(undefined as any);

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });
  });

  describe('Edge cases', () => {
    it('should check authentication before checking role', () => {
      authService.isAuthenticated.and.returnValue(false);
      authService.getUserRole.and.returnValue('ADMIN');

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(false);
        // Should redirect due to authentication, not role
        expect(router.navigate).toHaveBeenCalledWith(
          ['/'],
          jasmine.objectContaining({ queryParams: { returnUrl: jasmine.any(String) } })
        );
      });
    });

    it('should handle case-sensitive role names', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue('admin'); // lowercase

      TestBed.runInInjectionContext(() => {
        const result = adminGuard(mockRoute, mockState);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });
  });
});

