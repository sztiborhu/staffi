import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmployeeService } from '../../../../services/employee/employee.service';

@Component({
  selector: 'app-employee-add-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './employee-add-dialog.component.html',
  styleUrl: './employee-add-dialog.component.scss'
})
export class EmployeeAddDialogComponent implements OnInit {
  addForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EmployeeAddDialogComponent>
  ) {}

  ngOnInit(): void {
    this.addForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phoneNumber: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      nationality: ['', [Validators.required]],
      primaryAddress: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      roomNumber: [''],
      taxId: ['', [Validators.required]],
      tajNumber: ['', [Validators.required]],
      idCardNumber: ['', [Validators.required]],
      role: ['EMPLOYEE'] // Default role
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.addForm.valid) {
      this.loading = true;

      const newEmployee = this.addForm.value;

      this.employeeService.createEmployee(newEmployee).subscribe({
        next: (result) => {
          this.loading = false;
          this.snackBar.open('Alkalmazott sikeresen létrehozva!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error creating employee:', error);
          this.loading = false;
          if (!error.error || !error.error.message) {
            this.snackBar.open('Hiba történt a létrehozás során.', 'Bezárás', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    } else {
      this.snackBar.open('Kérem töltse ki az összes kötelező mezőt!', 'Bezárás', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }
}
