import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService, Employee } from './employee.service';
import { AuthService } from '../authservice/auth.service';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockToken = 'fake-jwt-token';
  const apiUrl = 'http://localhost:8081/api/employees';

  const mockEmployee: Employee = {
    id: 1,
    userId: 5,
    firstName: 'János',
    lastName: 'Kovács',
    email: 'janos.kovacs@example.com',
    role: 'EMPLOYEE',
    isActive: true,
    taxId: '8234567891',
    tajNumber: '123456789',
    idCardNumber: 'AB123456',
    primaryAddress: 'Budapest, Váci utca 12., 1056',
    phoneNumber: '+36 30 234 5678',
    nationality: 'Magyar',
    birthDate: '1985-03-15',
    companyName: 'ÉpítőMester Kft.',
    startDate: '2024-01-10',
    roomNumber: '101'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', ['getAuthToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EmployeeService,
        { provide: AuthService, useValue: spy }
      ]
    });

    service = TestBed.inject(EmployeeService);
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

  describe('getAllEmployees', () => {
    it('should fetch all employees', () => {
      const mockEmployees: Employee[] = [mockEmployee];

      service.getAllEmployees().subscribe(employees => {
        expect(employees).toEqual(mockEmployees);
        expect(employees.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockEmployees);
    });

    it('should handle empty employee list', () => {
      service.getAllEmployees().subscribe(employees => {
        expect(employees).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });

    it('should handle unauthorized error', () => {
      service.getAllEmployees().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('getEmployeeById', () => {
    it('should fetch employee by id', () => {
      const employeeId = 1;

      service.getEmployeeById(employeeId).subscribe(employee => {
        expect(employee).toEqual(mockEmployee);
        expect(employee.id).toBe(employeeId);
      });

      const req = httpMock.expectOne(`${apiUrl}/${employeeId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockEmployee);
    });

    it('should handle employee not found', () => {
      const employeeId = 999;

      service.getEmployeeById(employeeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${employeeId}`);
      req.flush(
        { message: 'Employee not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });

  describe('createEmployee', () => {
    it('should create a new employee', () => {
      const newEmployee: Employee = { ...mockEmployee, id: 0, userId: 0 };
      const createdEmployee: Employee = { ...mockEmployee };

      service.createEmployee(newEmployee).subscribe(employee => {
        expect(employee).toEqual(createdEmployee);
        expect(employee.id).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newEmployee);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(createdEmployee);
    });

    it('should handle email already exists error', () => {
      const newEmployee: Employee = { ...mockEmployee };

      service.createEmployee(newEmployee).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.message).toContain('Email already exists');
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { message: 'Email already exists for another employee' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle tax ID already exists error', () => {
      const newEmployee: Employee = { ...mockEmployee };

      service.createEmployee(newEmployee).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.message).toContain('Tax ID already exists');
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { message: 'Tax ID already exists for another employee' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle room not found error', () => {
      const newEmployee: Employee = { ...mockEmployee, roomNumber: 'nonexistent' };

      service.createEmployee(newEmployee).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { message: 'Room nonexistent not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle room at full capacity error', () => {
      const newEmployee: Employee = { ...mockEmployee, roomNumber: '101' };

      service.createEmployee(newEmployee).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { message: 'Room 101 is at full capacity' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('updateEmployee', () => {
    it('should update an employee', () => {
      const employeeId = 1;
      const updatedData: Employee = {
        ...mockEmployee,
        phoneNumber: '+36 30 999 8888',
        primaryAddress: 'Budapest, Új utca 1., 1010'
      };

      service.updateEmployee(employeeId, updatedData).subscribe(employee => {
        expect(employee).toEqual(updatedData);
        expect(employee.phoneNumber).toBe('+36 30 999 8888');
      });

      const req = httpMock.expectOne(`${apiUrl}/${employeeId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedData);
      req.flush(updatedData);
    });

    it('should handle employee not found on update', () => {
      const employeeId = 999;
      const updatedData: Employee = { ...mockEmployee };

      service.updateEmployee(employeeId, updatedData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${employeeId}`);
      req.flush(
        { message: 'Employee not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle room not found on update', () => {
      const employeeId = 1;
      const updatedData: Employee = { ...mockEmployee, roomNumber: 'invalid' };

      service.updateEmployee(employeeId, updatedData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${employeeId}`);
      req.flush(
        { message: 'Room invalid not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });

  describe('deleteEmployee', () => {
    it('should delete an employee', () => {
      const employeeId = 1;

      service.deleteEmployee(employeeId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/${employeeId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(null);
    });

    it('should handle employee not found on delete', () => {
      const employeeId = 999;

      service.deleteEmployee(employeeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${employeeId}`);
      req.flush(
        { message: 'Employee not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });
});

