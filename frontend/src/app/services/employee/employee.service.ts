import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../authservice/auth.service';

export interface Employee {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  taxId: string;
  tajNumber: string;
  idCardNumber: string;
  primaryAddress: string;
  phoneNumber: string;
  nationality: string;
  birthDate: string;
  companyName: string;
  startDate: string;
  roomNumber: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:8081/api/employees';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee, { headers: this.getHeaders() });
  }

  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee, { headers: this.getHeaders() });
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
