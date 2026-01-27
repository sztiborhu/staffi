import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../authservice/auth.service';

export interface AdvanceRequest {
  amount: number;
  reason: string;
}

export interface AdvanceHistory {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedById?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface ReviewRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdvanceService {
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

  createAdvanceRequest(request: AdvanceRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/advances`, request, { headers: this.getHeaders() });
  }

  getMyAdvanceHistory(): Observable<AdvanceHistory[]> {
    return this.http.get<AdvanceHistory[]>(`${this.apiUrl}/advances/my-history`, { headers: this.getHeaders() });
  }

  // Admin methods
  getAllAdvances(): Observable<AdvanceHistory[]> {
    return this.http.get<AdvanceHistory[]>(`${this.apiUrl}/advances`, { headers: this.getHeaders() });
  }

  reviewAdvance(id: number, review: ReviewRequest): Observable<AdvanceHistory> {
    return this.http.put<AdvanceHistory>(`${this.apiUrl}/advances/${id}/review`, review, { headers: this.getHeaders() });
  }
}

