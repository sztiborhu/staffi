import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/authservice/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated first
  if (!authService.isAuthenticated()) {
    router.navigate(['/'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if user has ADMIN or HR role
  const userRole = authService.getUserRole();

  if (userRole !== 'ADMIN' && userRole !== 'HR') {
    // User is authenticated but not an admin or HR
    // Redirect to appropriate dashboard based on role or show access denied
    router.navigate(['/']); // Or redirect to user's dashboard
    return false;
  }

  return true;
};

