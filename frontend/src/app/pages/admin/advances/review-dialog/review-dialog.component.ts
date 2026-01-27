import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AdvanceHistory } from '../../../../services/advance/advance.service';

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './review-dialog.component.html',
  styleUrl: './review-dialog.component.scss'
})
export class ReviewDialogComponent {
  reviewForm!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdvanceHistory,
    private dialogRef: MatDialogRef<ReviewDialogComponent>,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      decision: [this.data.status === 'PENDING' ? '' : this.data.status, Validators.required],
      rejectionReason: ['']
    });

    // Add conditional validation for rejection reason
    this.reviewForm.get('decision')?.valueChanges.subscribe(decision => {
      const rejectionReasonControl = this.reviewForm.get('rejectionReason');
      if (decision === 'REJECTED') {
        rejectionReasonControl?.setValidators([Validators.required, Validators.minLength(10)]);
      } else {
        rejectionReasonControl?.clearValidators();
      }
      rejectionReasonControl?.updateValueAndValidity();
    });

    // Set rejection reason if already rejected
    if (this.data.status === 'REJECTED' && this.data.rejectionReason) {
      this.reviewForm.patchValue({
        rejectionReason: this.data.rejectionReason
      });
    }
  }

  onSubmit(): void {
    if (this.reviewForm.valid) {
      const decision = this.reviewForm.value.decision;
      const result = {
        status: decision,
        rejectionReason: decision === 'REJECTED' ? this.reviewForm.value.rejectionReason : undefined
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'APPROVED': return 'approved';
      case 'REJECTED': return 'rejected';
      case 'PENDING': return 'pending';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'APPROVED': return 'Jóváhagyva';
      case 'REJECTED': return 'Elutasítva';
      case 'PENDING': return 'Folyamatban';
      default: return status;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(value);
  }
}

