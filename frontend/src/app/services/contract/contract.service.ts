import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../authservice/auth.service';

export interface Contract {
  id: number;
  employeeId: number;
  employeeName: string;
  contractNumber: string;
  startDate: string;
  endDate: string | null;
  hourlyRate: number;
  currency: string;
  workingHoursPerWeek: number;
  pdfPath: string;
  status: 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
  createdAt: string;
}

export interface CreateContractRequest {
  startDate: string;
  endDate?: string | null;
  hourlyRate: number;
  currency?: string;
  workingHoursPerWeek?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all contracts for an employee
  getEmployeeContracts(employeeId: number): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.apiUrl}/employees/${employeeId}/contracts`,
      { headers: this.getHeaders() }
    );
  }

  // Create a new contract for an employee
  createContract(employeeId: number, contract: CreateContractRequest): Observable<Contract> {
    return this.http.post<Contract>(
      `${this.apiUrl}/employees/${employeeId}/contracts`,
      contract,
      { headers: this.getHeaders() }
    );
  }

  // Download contract PDF
  downloadContractPdf(contractId: number): Observable<Blob> {
    const token = this.authService.getAuthToken();
    return this.http.get(
      `${this.apiUrl}/contracts/${contractId}/pdf`,
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`
        }),
        responseType: 'blob'
      }
    );
  }

  // Invalidate/terminate a contract
  invalidateContract(contractId: number): Observable<Contract> {
    return this.http.put<Contract>(
      `${this.apiUrl}/contracts/${contractId}/invalidate`,
      null,
      { headers: this.getHeaders() }
    );
  }
}

