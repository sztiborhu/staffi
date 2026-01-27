import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmployeeService } from '../../../services/employee/employee.service';
import { UserService, User } from '../../../services/user/user.service';
import { AuthService } from '../../../services/authservice/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  userForm!: FormGroup;
  loading = false;
  hidePassword = true;
  users: User[] = [];
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
  currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.initForm();
    this.loadUsers();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['HR', [Validators.required]]
    });
  }

  loadUsers(): void {
    this.loading = true;
    console.log('Loading HR and ADMIN users from /api/users...');
    this.userService.getAdminAndHRUsers().subscribe({
      next: (users: User[]) => {
        console.log('HR and ADMIN users received:', users);
        console.log('User details:', users.map((u: User) => ({
          name: u.firstName && u.lastName ? `${u.lastName} ${u.firstName}` : u.email,
          role: u.role,
          active: u.isActive
        })));
        this.users = users;
        console.log(`Loaded ${this.users.length} HR/ADMIN users`);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.loading = false;
        this.snackBar.open('Hiba történt a felhasználók betöltése során.', 'Bezárás', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  createUser(): void {
    if (this.userForm.valid) {
      this.loading = true;
      const userData = this.userForm.value;

      this.employeeService.createEmployee(userData).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open(
            `${userData.role === 'ADMIN' ? 'Admin' : 'HR'} felhasználó sikeresen létrehozva!`,
            'Bezárás',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
          this.userForm.reset({ role: 'HR' });
          this.loadUsers();
        },
        error: (error: any) => {
          console.error('Error creating user:', error);
          this.loading = false;
          // Error is handled by global errorTranslationInterceptor
          // Only show generic fallback if no backend message
          if (!error.error || !error.error.message) {
            this.snackBar.open('Hiba történt a felhasználó létrehozása során.', 'Bezárás', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    } else {
      this.snackBar.open('Kérem töltse ki az összes mezőt helyesen!', 'Bezárás', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'warn';
      case 'HR':
        return 'accent';
      default:
        return 'primary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Adminisztrátor';
      case 'HR':
        return 'HR';
      default:
        return role;
    }
  }

  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'deaktiválása' : 'aktiválása';
    const actionPast = user.isActive ? 'deaktiválva' : 'aktiválva';

    if (confirm(`Biztosan ${action === 'deaktiválása' ? 'deaktiválni' : 'aktiválni'} szeretnéd ${user.firstName && user.lastName ? user.lastName + ' ' + user.firstName : user.email} felhasználót?`)) {
      this.userService.toggleUserActive(user.id).subscribe({
        next: (updatedUser: User) => {
          // Update the user in the local array
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }

          this.snackBar.open(
            `Felhasználó sikeresen ${actionPast}!`,
            'Bezárás',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
        },
        error: (error: any) => {
          console.error('Error toggling user status:', error);
          // Error is handled by global errorTranslationInterceptor
          // Only show fallback if no backend message exists
          if (!error.error || !error.error.message) {
            this.snackBar.open(
              `Hiba történt a felhasználó ${action} során.`,
              'Bezárás',
              {
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
          }
        }
      });
    }
  }
}

