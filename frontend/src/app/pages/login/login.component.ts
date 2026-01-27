import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import {AuthService} from '../../services/authservice/auth.service';
import {Router, RouterLink, ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  loginForm: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if user already has a valid auth token
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.getUserRole();

      // Check for return URL in query params
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];

      if (returnUrl) {
        this.router.navigate([returnUrl]);
      } else if (userRole === 'ADMIN' || userRole === 'HR') {
        this.router.navigate(['/admin/dashboard']);
      } else if (userRole === 'EMPLOYEE') {
        this.router.navigate(['/employees/dashboard']);
      } else {
        this.router.navigate(['/employees/dashboard']);
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value.email, this.loginForm.value.password).subscribe(response => {
        // Navigate to dashboard after successful login
        this.snackBar.open('Sikeres bejelentkezés!', 'Bezárás', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });

        // Redirect based on user role
        const userRole = response.role;
        if (userRole === 'ADMIN' || userRole === 'HR') {
          this.router.navigate(['/admin/dashboard']);
        } else if (userRole === 'EMPLOYEE') {
          this.router.navigate(['/employees/dashboard']);
        } else {
          // Default redirect for other roles
          this.router.navigate(['/employees/dashboard']);
        }
      }, error => {
        // Show error message with snackbar

        // Check for specific error messages from backend
        if (error.error && error.error.message) {
          const errorMessage = error.error.message;

          // Handle inactive account
          if (errorMessage.includes('Account is inactive') || errorMessage.includes('inactive')) {
            this.snackBar.open('A fiók inaktív. Kérjük, lépjen kapcsolatba egy adminisztrátorral.', 'Bezárás', {
              duration: 7000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          }
        }

        // Handle HTTP status codes
        switch (error.status) {
          case 404:
            this.snackBar.open('Érvénytelen e-mail cím vagy jelszó.', 'Bezárás', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          case 400:
            this.snackBar.open('Érvénytelen e-mail cím vagy jelszó.', 'Bezárás', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          case 403:
            // Forbidden - could be inactive account
            this.snackBar.open('A fiók inaktív. Kérjük, lépjen kapcsolatba egy adminisztrátorral.', 'Bezárás', {
              duration: 7000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          case 500:
            this.snackBar.open('Szerver hiba történt. Kérjük, próbálja meg később.', 'Bezárás', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          default:
            this.snackBar.open('Bejelentkezési hiba történt. Kérjük, próbálja újra.', 'Bezárás', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
        }
      });
    }
  }

  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'E-mail cím megadása kötelező';
    }
    return emailControl?.hasError('email') ? 'Adjon meg egy érvényes e-mail címet' : '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Jelszó megadása kötelező';
    }
    return passwordControl?.hasError('minlength') ? 'A jelszónak minimum 6 karakter hosszúnak kell lennie' : '';
  }
}
