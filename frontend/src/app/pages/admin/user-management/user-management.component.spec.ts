import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagementComponent } from './user-management.component';
import { EmployeeService } from '../../../services/employee/employee.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUsers: any[] = [
    { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@test.com', role: 'ADMIN', isActive: true },
    { id: 2, firstName: 'HR', lastName: 'User', email: 'hr@test.com', role: 'HR', isActive: true }
  ];

  beforeEach(async () => {
    const employeeServiceSpy = jasmine.createSpyObj('EmployeeService', ['getAllEmployees', 'createEmployee']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: EmployeeService, useValue: employeeServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    employeeService.getAllEmployees.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load HR and ADMIN users on init', () => {
    const allEmployees: any[] = [
      ...mockUsers,
      { id: 3, firstName: 'Employee', lastName: 'User', email: 'emp@test.com', role: 'EMPLOYEE', isActive: true }
    ];

    employeeService.getAllEmployees.and.returnValue(of(allEmployees as any));
    fixture.detectChanges();

    expect(component.users.length).toBe(2);
    expect(component.users.every((u: any) => u.role === 'ADMIN' || u.role === 'HR')).toBe(true);
  });

  it('should create HR user successfully', () => {
    employeeService.getAllEmployees.and.returnValue(of(mockUsers as any));
    employeeService.createEmployee.and.returnValue(of({ id: 3 } as any));

    fixture.detectChanges();

    component.userForm.patchValue({
      firstName: 'New',
      lastName: 'HR',
      email: 'newhr@test.com',
      password: 'Password123!',
      role: 'HR'
    });

    component.createUser();

    expect(employeeService.createEmployee).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'HR felhasználó sikeresen létrehozva!',
      'Bezárás',
      jasmine.any(Object)
    );
  });

  it('should create ADMIN user successfully', () => {
    employeeService.getAllEmployees.and.returnValue(of(mockUsers as any));
    employeeService.createEmployee.and.returnValue(of({ id: 3 } as any));

    fixture.detectChanges();

    component.userForm.patchValue({
      firstName: 'New',
      lastName: 'Admin',
      email: 'newadmin@test.com',
      password: 'Password123!',
      role: 'ADMIN'
    });

    component.createUser();

    expect(employeeService.createEmployee).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Admin felhasználó sikeresen létrehozva!',
      'Bezárás',
      jasmine.any(Object)
    );
  });

  it('should handle email already exists error', () => {
    employeeService.getAllEmployees.and.returnValue(of(mockUsers as any));
    employeeService.createEmployee.and.returnValue(
      throwError(() => ({ error: { message: 'Email already exists' } }))
    );

    fixture.detectChanges();

    component.userForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'existing@test.com',
      password: 'Password123!',
      role: 'HR'
    });

    component.createUser();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Ez az e-mail cím már használatban van.',
      'Bezárás',
      jasmine.any(Object)
    );
  });

  it('should handle permission error', () => {
    employeeService.getAllEmployees.and.returnValue(of(mockUsers as any));
    employeeService.createEmployee.and.returnValue(
      throwError(() => ({ error: { message: 'You do not have permission' } }))
    );

    fixture.detectChanges();

    component.userForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      password: 'Password123!',
      role: 'ADMIN'
    });

    component.createUser();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Nincs jogosultságod ehhez a művelethez.',
      'Bezárás',
      jasmine.any(Object)
    );
  });

  it('should validate form before submission', () => {
    employeeService.getAllEmployees.and.returnValue(of(mockUsers as any));
    fixture.detectChanges();

    component.createUser();

    expect(employeeService.createEmployee).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Kérem töltse ki az összes mezőt helyesen!',
      'Bezárás',
      jasmine.any(Object)
    );
  });

  it('should get correct role color', () => {
    expect(component.getRoleColor('ADMIN')).toBe('warn');
    expect(component.getRoleColor('HR')).toBe('accent');
    expect(component.getRoleColor('OTHER')).toBe('primary');
  });

  it('should get correct role label', () => {
    expect(component.getRoleLabel('ADMIN')).toBe('Adminisztrátor');
    expect(component.getRoleLabel('HR')).toBe('HR');
    expect(component.getRoleLabel('OTHER')).toBe('OTHER');
  });
});

