import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/authservice/auth.service';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  passwordForm!: FormGroup;
  userData: any;
  loading = false;
  hideOldPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userData = this.authService.getUserData();

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      const { oldPassword, newPassword } = this.passwordForm.value;

      this.authService.changePassword(oldPassword, newPassword).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackBar.open('Jelszó sikeresen megváltoztatva! Kijelentkezés...', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          // Logout and redirect after short delay
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;

          let errorMessage = 'Hiba történt a jelszó megváltoztatása során.';
          if (error.status === 400) {
            errorMessage = 'A régi jelszó helytelen.';
          } else if (error.status === 401) {
            errorMessage = 'Hitelesítési hiba. Kérjük jelentkezzen be újra.';
          }

          this.snackBar.open(errorMessage, 'Bezárás', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.snackBar.open('Kérem töltse ki helyesen az összes mezőt!', 'Bezárás', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }
}
