import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/authservice/auth.service';

export const adminOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated first
  if (!authService.isAuthenticated()) {
    router.navigate(['/'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if user has ADMIN role only
  const userRole = authService.getUserRole();

  if (userRole !== 'ADMIN') {
    // User is authenticated but not an admin
    router.navigate(['/admin/dashboard']); // Redirect to admin dashboard
    return false;
  }

  return true;
};

