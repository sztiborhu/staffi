import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../services/authservice/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatToolbarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  passwordForm: FormGroup;
  userInfo: any = null;
  hideOldPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;
  loadingUserData = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private location: Location
  ) {
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.loadingUserData = true;
    this.authService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.userInfo = user;
        this.loadingUserData = false;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.snackBar.open('Hiba történt a felhasználói adatok betöltése során.', 'Bezárás', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loadingUserData = false;
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.loading = true;
    const { oldPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.snackBar.open('Jelszó sikeresen megváltoztatva! Kérjük jelentkezzen be újra.', 'Bezárás', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Logout and redirect to login
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error changing password:', error);
        let errorMessage = 'Hiba történt a jelszó módosítása során.';

        if (error.error && typeof error.error === 'string') {
          const backendMessage = error.error;

          if (backendMessage.includes('Old password is incorrect')) {
            errorMessage = 'A régi jelszó helytelen.';
          } else if (backendMessage.includes('at least 6 characters')) {
            errorMessage = 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie.';
          }
        }

        this.snackBar.open(errorMessage, 'Bezárás', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  getFullName(): string {
    if (this.userInfo) {
      return `${this.userInfo.lastName || ''} ${this.userInfo.firstName || ''}`.trim();
    }
    return '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Nincs megadva';

    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.location.back();
  }
}

