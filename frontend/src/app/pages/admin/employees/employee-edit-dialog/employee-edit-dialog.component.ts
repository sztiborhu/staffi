import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Employee, EmployeeService } from '../../../../services/employee/employee.service';

@Component({
  selector: 'app-employee-edit-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './employee-edit-dialog.component.html',
  styleUrl: './employee-edit-dialog.component.scss'
})
export class EmployeeEditDialogComponent implements OnInit {
  editForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EmployeeEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public employee: Employee
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      firstName: [this.employee.firstName, [Validators.required]],
      lastName: [this.employee.lastName, [Validators.required]],
      email: [this.employee.email, [Validators.required, Validators.email]],
      phoneNumber: [this.employee.phoneNumber, [Validators.required]],
      nationality: [this.employee.nationality, [Validators.required]],
      primaryAddress: [this.employee.primaryAddress, [Validators.required]],
      companyName: [this.employee.companyName, [Validators.required]],
      startDate: [this.employee.startDate, [Validators.required]],
      roomNumber: [this.employee.roomNumber],
      taxId: [this.employee.taxId, [Validators.required]],
      tajNumber: [this.employee.tajNumber, [Validators.required]],
      idCardNumber: [this.employee.idCardNumber, [Validators.required]],
      isActive: [this.employee.isActive]
    });
    // Note: birthDate is not included in the form as it's read-only
  }

  close(): void {
    this.dialogRef.close();
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

  save(): void {
    if (this.editForm.valid) {
      this.loading = true;

      const updatedEmployee: Employee = {
        ...this.employee,
        ...this.editForm.value
      };

      this.employeeService.updateEmployee(this.employee.id, updatedEmployee).subscribe({
        next: (result) => {
          this.loading = false;
          this.snackBar.open('Alkalmazott sikeresen frissítve!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.loading = false;

          if (!error.error || !error.error.message) {
            this.snackBar.open('Hiba történt a frissítés során.', 'Bezárás', {
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
