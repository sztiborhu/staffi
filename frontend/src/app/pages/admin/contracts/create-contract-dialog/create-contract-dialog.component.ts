import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContractService } from '../../../../services/contract/contract.service';

@Component({
  selector: 'app-create-contract-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './create-contract-dialog.component.html',
  styleUrl: './create-contract-dialog.component.scss'
})
export class CreateContractDialogComponent implements OnInit {
  contractForm!: FormGroup;
  submitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { employeeId: number; employeeName: string },
    private dialogRef: MatDialogRef<CreateContractDialogComponent>,
    private fb: FormBuilder,
    private contractService: ContractService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const today = new Date();

    this.contractForm = this.fb.group({
      startDate: [today, Validators.required],
      endDate: [null], // Optional, can be indefinite
      hourlyRate: [3500, [Validators.required, Validators.min(1)]],
      currency: ['HUF'],
      workingHoursPerWeek: [40, [Validators.required, Validators.min(1), Validators.max(168)]]
    });

    // Add custom validator for date range
    this.contractForm.setValidators(this.dateRangeValidator);
  }

  dateRangeValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return { dateRangeInvalid: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.contractForm.valid && !this.submitting) {
      this.submitting = true;

      const formValue = this.contractForm.value;
      const contractData = {
        startDate: this.formatDateForApi(formValue.startDate),
        endDate: formValue.endDate ? this.formatDateForApi(formValue.endDate) : null,
        hourlyRate: formValue.hourlyRate,
        currency: formValue.currency || 'HUF',
        workingHoursPerWeek: formValue.workingHoursPerWeek || 40
      };

      this.contractService.createContract(this.data.employeeId, contractData).subscribe({
        next: (contract) => {
          this.submitting = false;
          this.snackBar.open('Szerződés sikeresen létrehozva!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.dialogRef.close(contract);
        },
        error: (error) => {
          this.submitting = false;
          // Error is handled by global errorTranslationInterceptor
          if (!error.error || !error.error.message) {
            this.snackBar.open('Hiba történt a szerződés létrehozása során.', 'Bezárás', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    } else if (this.contractForm.hasError('dateRangeInvalid')) {
      this.snackBar.open('A végdátum nem lehet korábbi a kezdési dátumnál.', 'Bezárás', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    } else {
      this.snackBar.open('Kérem töltse ki helyesen az összes kötelező mezőt!', 'Bezárás', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }

  formatDateForApi(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

