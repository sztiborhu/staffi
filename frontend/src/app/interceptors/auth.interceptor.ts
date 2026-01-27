import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/authservice/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if the error is 401 Unauthorized (token expired or invalid)
      if (error.status === 401) {
        // Clear authentication data
        authService.logout();

        // Redirect to login page with return URL
        const currentUrl = router.url;

        // Only add returnUrl if not already on login page
        if (!currentUrl.includes('/login') && currentUrl !== '/') {
          router.navigate(['/'], {
            queryParams: { returnUrl: currentUrl },
            replaceUrl: true
          });
        } else {
          router.navigate(['/'], { replaceUrl: true });
        }
      }

      // Re-throw the error so components can still handle it if needed
      return throwError(() => error);
    })
  );
};

