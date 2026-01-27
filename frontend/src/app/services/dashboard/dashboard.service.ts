import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../authservice/auth.service';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalCapacity: number;
  currentOccupancy: number;
  totalAdvanceRequests: number;
  pendingAdvanceRequests: number;
  approvedAdvanceRequests: number;
  rejectedAdvanceRequests: number;
  newEmployeesThisMonth: number;
  checkInsThisMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8081/api/dashboard';

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

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }
}
