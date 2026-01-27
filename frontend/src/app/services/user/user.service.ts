import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../authservice/auth.service';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8081/api/users';

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

  /**
   * Get all users with optional filters
   * @param role Filter by role (ADMIN, HR, EMPLOYEE)
   * @param isActive Filter by active status
   * @param search Search by name or email
   */
  getUsers(role?: string, isActive?: boolean, search?: string): Observable<User[]> {
    let params = new HttpParams();

    if (role) {
      params = params.set('role', role);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<User[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  /**
   * Get HR and ADMIN users only
   * Makes two API calls (one for HR, one for ADMIN) and combines results
   */
  getAdminAndHRUsers(): Observable<User[]> {
    return forkJoin({
      hrUsers: this.getUsers('HR'),
      adminUsers: this.getUsers('ADMIN')
    }).pipe(
      map(({ hrUsers, adminUsers }) => [...hrUsers, ...adminUsers])
    );
  }

  /**
   * Toggle user active status
   * @param userId User ID to toggle
   */
  toggleUserActive(userId: number): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/${userId}/toggle-active`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get user by ID
   * @param userId User ID
   */
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`, {
      headers: this.getHeaders()
    });
  }
}

