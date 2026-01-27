import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdvanceService, AdvanceHistory } from '../../../services/advance/advance.service';

@Component({
  selector: 'app-advances',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './advances.component.html',
  styleUrl: './advances.component.scss'
})
export class AdvancesComponent implements OnInit {
  allAdvances: AdvanceHistory[] = [];
  filteredAdvances: AdvanceHistory[] = [];
  displayedColumns: string[] = ['employeeName', 'amount', 'requestDate', 'status', 'actions'];
  loading = false;
  error: string | null = null;
  selectedTab = 0;

  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  constructor(
    private advanceService: AdvanceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAdvances();
  }

  loadAdvances(): void {
    this.loading = true;
    this.error = null;

    this.advanceService.getAllAdvances().subscribe({
      next: (data) => {
        this.allAdvances = data.sort((a, b) =>
          new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
        );
        this.calculateCounts();
        this.filterByTab(this.selectedTab);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading advances:', error);
        this.error = 'Hiba történt az előlegek betöltése során.';
        this.loading = false;
      }
    });
  }

  calculateCounts(): void {
    this.pendingCount = this.allAdvances.filter(a => a.status === 'PENDING').length;
    this.approvedCount = this.allAdvances.filter(a => a.status === 'APPROVED').length;
    this.rejectedCount = this.allAdvances.filter(a => a.status === 'REJECTED').length;
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    this.filterByTab(index);
  }

  filterByTab(index: number): void {
    switch (index) {
      case 0: // All
        this.filteredAdvances = [...this.allAdvances];
        break;
      case 1: // Pending
        this.filteredAdvances = this.allAdvances.filter(a => a.status === 'PENDING');
        break;
      case 2: // Approved
        this.filteredAdvances = this.allAdvances.filter(a => a.status === 'APPROVED');
        break;
      case 3: // Rejected
        this.filteredAdvances = this.allAdvances.filter(a => a.status === 'REJECTED');
        break;
    }
  }

  openReviewDialog(advance: AdvanceHistory): void {
    import('./review-dialog/review-dialog.component').then(module => {
      const dialogRef = this.dialog.open(module.ReviewDialogComponent, {
        width: '500px',
        maxWidth: '95vw',
        data: advance
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.reviewAdvance(advance.id, result.status, result.rejectionReason);
        }
      });
    });
  }

  reviewAdvance(id: number, status: 'APPROVED' | 'REJECTED', rejectionReason?: string): void {
    const review = {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
    };

    this.advanceService.reviewAdvance(id, review).subscribe({
      next: () => {
        const statusText = status === 'APPROVED' ? 'jóváhagyva' : 'elutasítva';
        this.snackBar.open(`Előleg kérelem sikeresen ${statusText}!`, 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.loadAdvances();
      },
      error: (error) => {
        console.error('Error reviewing advance:', error);
        this.snackBar.open('Hiba történt az elbírálás során.', 'Bezárás', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  quickApprove(advance: AdvanceHistory, event: Event): void {
    event.stopPropagation();
    if (confirm(`Biztosan jóváhagyja ${advance.employeeName} előleg kérelmét (${this.formatCurrency(advance.amount)})?`)) {
      this.reviewAdvance(advance.id, 'APPROVED');
    }
  }

  quickReject(advance: AdvanceHistory, event: Event): void {
    event.stopPropagation();
    this.openReviewDialog(advance);
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'APPROVED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      case 'PENDING': return 'schedule';
      default: return 'help';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
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

