import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContractService, Contract, CreateContractRequest } from './contract.service';
import { AuthService } from '../authservice/auth.service';

describe('ContractService', () => {
  let service: ContractService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockToken = 'fake-jwt-token';
  const apiUrl = 'http://localhost:8081/api';

  beforeEach(() => {
    // Create spy for AuthService
    const spy = jasmine.createSpyObj('AuthService', ['getAuthToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ContractService,
        { provide: AuthService, useValue: spy }
      ]
    });

    service = TestBed.inject(ContractService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Default behavior for getAuthToken
    authServiceSpy.getAuthToken.and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEmployeeContracts', () => {
    it('should fetch contracts for an employee', () => {
      const employeeId = 5;
      const mockContracts: Contract[] = [
        {
          id: 1,
          employeeId: 5,
          employeeName: 'Kovács János',
          contractNumber: 'CONTRACT-20260125-5-A3F2',
          startDate: '2026-02-01',
          endDate: null,
          hourlyRate: 3500,
          currency: 'HUF',
          workingHoursPerWeek: 40,
          pdfPath: 'contracts/pdfs/CONTRACT-20260125-5-A3F2.pdf',
          status: 'ACTIVE',
          createdAt: '2026-01-25T14:30:00'
        }
      ];

      service.getEmployeeContracts(employeeId).subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
        expect(contracts.length).toBe(1);
        expect(contracts[0].status).toBe('ACTIVE');
      });

      const req = httpMock.expectOne(`${apiUrl}/employees/${employeeId}/contracts`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockContracts);
    });

    it('should handle HTTP error when fetching contracts', () => {
      const employeeId = 5;
      const errorMessage = 'Employee not found';

      service.getEmployeeContracts(employeeId).subscribe(
        () => fail('should have failed with 404 error'),
        error => {
          expect(error.status).toBe(404);
          expect(error.error.message).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/employees/${employeeId}/contracts`);
      req.flush({ message: errorMessage }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createContract', () => {
    it('should create a new contract', () => {
      const employeeId = 5;
      const contractRequest: CreateContractRequest = {
        startDate: '2026-02-01',
        endDate: null,
        hourlyRate: 3500,
        currency: 'HUF',
        workingHoursPerWeek: 40
      };

      const mockResponse: Contract = {
        id: 1,
        employeeId: 5,
        employeeName: 'Kovács János',
        contractNumber: 'CONTRACT-20260125-5-A3F2',
        startDate: '2026-02-01',
        endDate: null,
        hourlyRate: 3500,
        currency: 'HUF',
        workingHoursPerWeek: 40,
        pdfPath: 'contracts/pdfs/CONTRACT-20260125-5-A3F2.pdf',
        status: 'ACTIVE',
        createdAt: '2026-01-25T14:30:00'
      };

      service.createContract(employeeId, contractRequest).subscribe(contract => {
        expect(contract).toEqual(mockResponse);
        expect(contract.status).toBe('ACTIVE');
        expect(contract.contractNumber).toContain('CONTRACT-');
      });

      const req = httpMock.expectOne(`${apiUrl}/employees/${employeeId}/contracts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(contractRequest);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should handle validation error when creating contract', () => {
      const employeeId = 5;
      const invalidRequest: CreateContractRequest = {
        startDate: '2026-02-01',
        endDate: '2026-01-01', // End date before start date
        hourlyRate: 3500
      };

      service.createContract(employeeId, invalidRequest).subscribe(
        () => fail('should have failed with validation error'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.message).toContain('End date cannot be before start date');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/employees/${employeeId}/contracts`);
      req.flush(
        { message: 'End date cannot be before start date' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('downloadContractPdf', () => {
    it('should download PDF as blob', () => {
      const contractId = 1;
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadContractPdf(contractId).subscribe(blob => {
        expect(blob).toEqual(mockBlob);
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${apiUrl}/contracts/${contractId}/pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should handle 404 when PDF not found', () => {
      const contractId = 1;

      service.downloadContractPdf(contractId).subscribe(
        () => fail('should have failed with 404 error'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/contracts/${contractId}/pdf`);
      req.flush(
        new Blob([JSON.stringify({ message: 'PDF not available' })]),
        { status: 404, statusText: 'Not Found' }
      );
    });
  });

  describe('invalidateContract', () => {
    it('should invalidate a contract', () => {
      const contractId = 1;
      const mockResponse: Contract = {
        id: 1,
        employeeId: 5,
        employeeName: 'Kovács János',
        contractNumber: 'CONTRACT-20260125-5-A3F2',
        startDate: '2026-02-01',
        endDate: '2026-01-25',
        hourlyRate: 3500,
        currency: 'HUF',
        workingHoursPerWeek: 40,
        pdfPath: 'contracts/pdfs/CONTRACT-20260125-5-A3F2.pdf',
        status: 'TERMINATED',
        createdAt: '2026-01-25T14:30:00'
      };

      service.invalidateContract(contractId).subscribe(contract => {
        expect(contract).toEqual(mockResponse);
        expect(contract.status).toBe('TERMINATED');
      });

      const req = httpMock.expectOne(`${apiUrl}/contracts/${contractId}/invalidate`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockResponse);
    });

    it('should handle error when contract already terminated', () => {
      const contractId = 1;

      service.invalidateContract(contractId).subscribe(
        () => fail('should have failed with error'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Contract is already terminated');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/contracts/${contractId}/invalidate`);
      req.flush(
        { message: 'Contract is already terminated' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });
});

