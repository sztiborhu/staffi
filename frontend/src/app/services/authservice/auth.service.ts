import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8081/api/auth/';

  constructor(private http: HttpClient) { }

  getTestData(): Observable<any> {
    let headers = {};

    if (this.getAuthToken() !== null) {
      headers = {"Authorization": "Bearer " + this.getAuthToken()};
    }

    return this.http.get<any>(this.apiUrl + "teszt", { headers });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'login', { email, password }).pipe(
      tap(response => {
        if (response && response.token) {
          this.setAuthToken(response.token);
          this.setUserData(response);
        }
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    return this.http.put(this.apiUrl + 'change-password',
      { oldPassword, newPassword },
      { headers, responseType: 'text' }
    );
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  setAuthToken(token: string | null): void {
    if (token !== null)
      localStorage.setItem('authToken', token);
    else
      localStorage.removeItem('authToken');
  }

  setUserData(userData: any): void {
    if (userData !== null) {
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      localStorage.removeItem('userData');
    }
  }

  getUserData(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getUserRole(): string | null {
    const userData = this.getUserData();
    return userData ? userData.role : null;
  }

  getUserId(): number | null {
    const userData = this.getUserData();
    return userData ? userData.id : null;
  }

  getCurrentUserProfile(): Observable<any> {
    const token = this.getAuthToken();
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    return this.http.get<any>('http://localhost:8081/api/employees/me', { headers });
  }

  logout(): void {
    this.setAuthToken(null);
    this.setUserData(null);
  }

  isTokenExpired(): boolean {
    const token = this.getAuthToken();

    if (!token) {
      return true;
    }

    try {
      // Decode JWT token to get expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp;

      if (!expiration) {
        return true;
      }

      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      const now = Math.floor(Date.now() / 1000);
      return now >= expiration;
    } catch (error) {
      // If token cannot be decoded, consider it invalid
      return true;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return token !== null && !this.isTokenExpired();
  }

}
