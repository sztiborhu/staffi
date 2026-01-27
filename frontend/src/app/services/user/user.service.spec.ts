import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService, User } from './user.service';
import { AuthService } from '../authservice/auth.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockToken = 'test-token-123';
  const apiUrl = 'http://localhost:8081/api/users';

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAuthToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authService.getAuthToken.and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should fetch users without filters', () => {
      const mockUsers: User[] = [
        { id: 1, email: 'admin@test.com', role: 'ADMIN', isActive: true },
        { id: 2, email: 'hr@test.com', role: 'HR', isActive: true }
      ];

      service.getUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockUsers);
    });

    it('should fetch users with role filter', () => {
      const mockHRUsers: User[] = [
        { id: 2, email: 'hr@test.com', role: 'HR', isActive: true }
      ];

      service.getUsers('HR').subscribe(users => {
        expect(users).toEqual(mockHRUsers);
      });

      const req = httpMock.expectOne(`${apiUrl}?role=HR`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('role')).toBe('HR');
      req.flush(mockHRUsers);
    });

    it('should fetch users with isActive filter', () => {
      const mockActiveUsers: User[] = [
        { id: 1, email: 'admin@test.com', role: 'ADMIN', isActive: true }
      ];

      service.getUsers(undefined, true).subscribe(users => {
        expect(users).toEqual(mockActiveUsers);
      });

      const req = httpMock.expectOne(`${apiUrl}?isActive=true`);
      expect(req.request.params.get('isActive')).toBe('true');
      req.flush(mockActiveUsers);
    });

    it('should fetch users with multiple filters', () => {
      service.getUsers('HR', true, 'john').subscribe();

      const req = httpMock.expectOne(`${apiUrl}?role=HR&isActive=true&search=john`);
      expect(req.request.params.get('role')).toBe('HR');
      expect(req.request.params.get('isActive')).toBe('true');
      expect(req.request.params.get('search')).toBe('john');
      req.flush([]);
    });
  });

  describe('getAdminAndHRUsers', () => {
    it('should fetch HR and ADMIN users in parallel and combine results', () => {
      const mockHRUsers: User[] = [
        { id: 2, email: 'hr@test.com', firstName: 'HR', lastName: 'User', role: 'HR', isActive: true }
      ];
      const mockAdminUsers: User[] = [
        { id: 1, email: 'admin@test.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN', isActive: true }
      ];

      service.getAdminAndHRUsers().subscribe(users => {
        expect(users.length).toBe(2);
        expect(users).toEqual([...mockHRUsers, ...mockAdminUsers]);
        expect(users.some(u => u.role === 'HR')).toBe(true);
        expect(users.some(u => u.role === 'ADMIN')).toBe(true);
      });

      const hrReq = httpMock.expectOne(`${apiUrl}?role=HR`);
      const adminReq = httpMock.expectOne(`${apiUrl}?role=ADMIN`);

      expect(hrReq.request.method).toBe('GET');
      expect(adminReq.request.method).toBe('GET');

      hrReq.flush(mockHRUsers);
      adminReq.flush(mockAdminUsers);
    });

    it('should handle empty results', () => {
      service.getAdminAndHRUsers().subscribe(users => {
        expect(users.length).toBe(0);
      });

      const hrReq = httpMock.expectOne(`${apiUrl}?role=HR`);
      const adminReq = httpMock.expectOne(`${apiUrl}?role=ADMIN`);

      hrReq.flush([]);
      adminReq.flush([]);
    });
  });

  describe('toggleUserActive', () => {
    it('should toggle user active status', () => {
      const mockUser: User = {
        id: 1,
        email: 'test@test.com',
        role: 'HR',
        isActive: false
      };

      service.toggleUserActive(1).subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(user.isActive).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/toggle-active`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should fetch a single user by ID', () => {
      const mockUser: User = {
        id: 1,
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true
      };

      service.getUserById(1).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });
});


