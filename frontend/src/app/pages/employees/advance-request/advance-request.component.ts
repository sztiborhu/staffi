import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdvanceService } from '../../../services/advance/advance.service';

@Component({
  selector: 'app-advance-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './advance-request.component.html',
  styleUrl: './advance-request.component.scss'
})
export class AdvanceRequestComponent implements OnInit {
  advanceForm!: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private advanceService: AdvanceService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.advanceForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  onSubmit(): void {
    if (this.advanceForm.valid) {
      this.submitting = true;

      this.advanceService.createAdvanceRequest(this.advanceForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.snackBar.open('Előleg kérelem sikeresen beküldve!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.router.navigate(['/employees/my-requests']);
        },
        error: (error) => {
          this.submitting = false;
          this.snackBar.open('Hiba történt a kérelem beküldése során.', 'Bezárás', {
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

  goBack(): void {
    this.router.navigate(['/employees/dashboard']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(value);
  }
}

