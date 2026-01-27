import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/authservice/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user has a valid token
  const token = authService.getAuthToken();

  if (!token) {
    // No token found, redirect to login
    router.navigate(['/'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if token is expired
  if (authService.isTokenExpired()) {
    // Token expired, clear storage and redirect to login
    authService.logout();
    router.navigate(['/'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Token exists and is valid
  return true;
};

