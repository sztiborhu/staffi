import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from '../../../services/authservice/auth.service';
import { AuditLogDetailDialogComponent } from './audit-log-detail-dialog/audit-log-detail-dialog.component';

interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  userId: number;
  userEmail: string;
  userRole: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  timestamp: string;
}

interface AuditLogResponse {
  content: AuditLog[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

interface AuditStatistics {
  totalLogs: number;
  createActions: number;
  updateActions: number;
  deleteActions: number;
  loginActions: number;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss'
})
export class AuditLogsComponent implements OnInit {
  filterForm: FormGroup;
  auditLogs: AuditLog[] = [];
  statistics: AuditStatistics | null = null;
  loading = false;
  loadingStats = false;

  // Pagination
  pageIndex = 0;
  pageSize = 50;
  totalElements = 0;
  totalPages = 0;

  // Table columns
  displayedColumns: string[] = ['timestamp', 'action', 'entityType', 'user', 'description', 'details'];

  // Filter options
  entityTypes = ['Employee', 'Contract', 'Accommodation', 'Room', 'RoomAllocation', 'AdvanceRequest'];
  actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

  private apiUrl = 'http://localhost:8081/api/audit-logs';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      entityType: [''],
      action: [''],
      userEmail: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadAuditLogs();
    this.loadStatistics();
  }

  loadAuditLogs(): void {
    this.loading = true;

    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('page', this.pageIndex.toString())
      .set('size', this.pageSize.toString());

    // Add filters
    const filters = this.filterForm.value;
    if (filters.entityType) {
      params = params.set('entityType', filters.entityType);
    }
    if (filters.action) {
      params = params.set('action', filters.action);
    }
    if (filters.userEmail) {
      params = params.set('userEmail', filters.userEmail);
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      params = params.set('startDate', startDate.toISOString());
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      params = params.set('endDate', endDate.toISOString());
    }

    this.http.get<AuditLogResponse>(this.apiUrl, { headers, params })
      .subscribe({
        next: (response) => {
          this.auditLogs = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading audit logs:', error);
          this.loading = false;
        }
      });
  }

  loadStatistics(): void {
    const userRole = this.authService.getUserRole();
    if (userRole !== 'ADMIN') {
      return; // Only admins can see statistics (but this page is admin-only anyway)
    }

    this.loadingStats = true;

    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<AuditStatistics>(`${this.apiUrl}/statistics`, { headers })
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
          this.loadingStats = false;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          this.loadingStats = false;
        }
      });
  }

  applyFilters(): void {
    this.pageIndex = 0; // Reset to first page
    this.loadAuditLogs();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.pageIndex = 0;
    this.loadAuditLogs();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuditLogs();
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'CREATE': return 'primary';
      case 'UPDATE': return 'accent';
      case 'DELETE': return 'warn';
      case 'LOGIN': return 'success';
      case 'LOGOUT': return 'default';
      default: return 'default';
    }
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'CREATE': return 'action-create';
      case 'UPDATE': return 'action-update';
      case 'DELETE': return 'action-delete';
      case 'LOGIN': return 'action-login';
      case 'LOGOUT': return 'action-logout';
      default: return 'action-default';
    }
  }

  viewDetails(log: AuditLog): void {
    this.dialog.open(AuditLogDetailDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: log
    });
  }

  hasChanges(log: AuditLog): boolean {
    return !!(log.oldValue || log.newValue);
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }
}

