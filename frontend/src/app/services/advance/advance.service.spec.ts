import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdvanceService, AdvanceRequest, AdvanceHistory } from './advance.service';
import { AuthService } from '../authservice/auth.service';

describe('AdvanceService', () => {
  let service: AdvanceService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockToken = 'fake-jwt-token';
  const apiUrl = 'http://localhost:8081/api';

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', ['getAuthToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AdvanceService,
        { provide: AuthService, useValue: spy }
      ]
    });

    service = TestBed.inject(AdvanceService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authServiceSpy.getAuthToken.and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createAdvanceRequest', () => {
    it('should create an advance request', () => {
      const request: AdvanceRequest = {
        amount: 50000,
        reason: 'Családi okok miatt szükségem van előlegre'
      };

      service.createAdvanceRequest(request).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/advances`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ success: true });
    });

    it('should handle validation error for invalid amount', () => {
      const request: AdvanceRequest = {
        amount: 0,
        reason: 'Invalid amount'
      };

      service.createAdvanceRequest(request).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/advances`);
      req.flush(
        { message: 'Amount must be greater than zero' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle validation error for short reason', () => {
      const request: AdvanceRequest = {
        amount: 50000,
        reason: 'Short'
      };

      service.createAdvanceRequest(request).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/advances`);
      req.flush(
        { message: 'Reason must be at least 10 characters' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('getMyAdvanceHistory', () => {
    it('should fetch advance history for current user', () => {
      const mockHistory: AdvanceHistory[] = [
        {
          id: 1,
          employeeId: 5,
          employeeName: 'János Kovács',
          employeeEmail: 'janos@example.com',
          amount: 50000,
          reason: 'Családi okok',
          requestDate: '2026-01-20T10:00:00',
          status: 'PENDING',
          reviewedById: undefined,
          reviewedByName: undefined,
          reviewedAt: undefined,
          rejectionReason: undefined
        },
        {
          id: 2,
          employeeId: 5,
          employeeName: 'János Kovács',
          employeeEmail: 'janos@example.com',
          amount: 30000,
          reason: 'Számla kifizetése',
          requestDate: '2026-01-15T14:30:00',
          status: 'APPROVED',
          reviewedById: 1,
          reviewedByName: 'Admin User',
          reviewedAt: '2026-01-16T09:00:00',
          rejectionReason: undefined
        }
      ];

      service.getMyAdvanceHistory().subscribe(history => {
        expect(history).toEqual(mockHistory);
        expect(history.length).toBe(2);
        expect(history[0].status).toBe('PENDING');
        expect(history[1].status).toBe('APPROVED');
      });

      const req = httpMock.expectOne(`${apiUrl}/advances/my-history`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockHistory);
    });

    it('should handle empty history', () => {
      service.getMyAdvanceHistory().subscribe(history => {
        expect(history).toEqual([]);
        expect(history.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/advances/my-history`);
      req.flush([]);
    });

    it('should handle unauthorized error', () => {
      service.getMyAdvanceHistory().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/advances/my-history`);
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('getAllAdvances (Admin)', () => {
    it('should fetch all advances for admin/HR', () => {
      const mockAdvances: AdvanceHistory[] = [
        {
          id: 1,
          employeeId: 5,
          employeeName: 'János Kovács',
          employeeEmail: 'janos@example.com',
          amount: 50000,
          reason: 'Családi okok',
          requestDate: '2026-01-20T10:00:00',
          status: 'PENDING',
          reviewedById: undefined,
          reviewedByName: undefined,
          reviewedAt: undefined,
          rejectionReason: undefined
        },
        {
          id: 2,
          employeeId: 7,
          employeeName: 'Anna Nagy',
          employeeEmail: 'anna@example.com',
          amount: 40000,
          reason: 'Sürgős kiadás',
          requestDate: '2026-01-21T11:00:00',
          status: 'PENDING',
          reviewedById: undefined,
          reviewedByName: undefined,
          reviewedAt: undefined,
          rejectionReason: undefined
        }
      ];

      service.getAllAdvances().subscribe(advances => {
        expect(advances).toEqual(mockAdvances);
        expect(advances.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/advances`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockAdvances);
    });

    it('should handle forbidden error for non-admin user', () => {
      service.getAllAdvances().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/advances`);
      req.flush(
        { message: 'Access Denied' },
        { status: 403, statusText: 'Forbidden' }
      );
    });
  });

  describe('reviewAdvance', () => {
    it('should approve an advance request', () => {
      const reviewData = {
        status: 'APPROVED' as const,
        rejectionReason: undefined
      };

      const mockResponse: AdvanceHistory = {
        id: 1,
        employeeId: 5,
        employeeName: 'János Kovács',
        employeeEmail: 'janos@example.com',
        amount: 50000,
        reason: 'Családi okok',
        requestDate: '2026-01-20T10:00:00',
        status: 'APPROVED',
        reviewedById: 1,
        reviewedByName: 'Admin User',
        reviewedAt: '2026-01-25T10:00:00',
        rejectionReason: undefined
      };

      service.reviewAdvance(1, reviewData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.status).toBe('APPROVED');
        expect(response.reviewedByName).toBe('Admin User');
      });

      const req = httpMock.expectOne(`${apiUrl}/advances/1/review`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(reviewData);
      req.flush(mockResponse);
    });

    it('should reject an advance request with reason', () => {
      const reviewData = {
        status: 'REJECTED' as const,
        rejectionReason: 'Nincs elegendő fedezet a költségvetésben'
      };

      const mockResponse: AdvanceHistory = {
        id: 1,
        employeeId: 5,
        employeeName: 'János Kovács',
        employeeEmail: 'janos@example.com',
        amount: 50000,
        reason: 'Családi okok',
        requestDate: '2026-01-20T10:00:00',
        status: 'REJECTED',
        reviewedById: 1,
        reviewedByName: 'Admin User',
        reviewedAt: '2026-01-25T10:00:00',
        rejectionReason: 'Nincs elegendő fedezet a költségvetésben'
      };

      service.reviewAdvance(1, reviewData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.status).toBe('REJECTED');
        expect(response.rejectionReason).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/advances/1/review`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('should handle advance not found error', () => {
      const reviewData = {
        status: 'APPROVED' as const
      };

      service.reviewAdvance(999, reviewData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/advances/999/review`);
      req.flush(
        { message: 'Advance request not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });
});

