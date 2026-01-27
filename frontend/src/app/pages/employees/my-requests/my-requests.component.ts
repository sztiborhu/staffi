import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdvanceService, AdvanceHistory } from '../../../services/advance/advance.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.scss'
})
export class MyRequestsComponent implements OnInit {
  requests: AdvanceHistory[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private advanceService: AdvanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.error = null;

    this.advanceService.getMyAdvanceHistory().subscribe({
      next: (data) => {
        this.requests = data.sort((a, b) =>
          new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a kérelmek betöltése során.';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/employees/dashboard']);
  }

  newRequest(): void {
    this.router.navigate(['/employees/advance-request']);
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

