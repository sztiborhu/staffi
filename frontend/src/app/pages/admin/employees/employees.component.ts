import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { Employee, EmployeeService } from '../../../services/employee/employee.service';
import { EmployeeDetailDialogComponent } from './employee-detail-dialog/employee-detail-dialog.component';
import { EmployeeEditDialogComponent } from './employee-edit-dialog/employee-edit-dialog.component';
import { EmployeeAddDialogComponent } from './employee-add-dialog/employee-add-dialog.component';

@Component({
  selector: 'admin-employees',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSlideToggleModule
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class AdminEmployeesComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'companyName', 'roomNumber', 'startDate', 'actions'];
  allEmployees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchQuery: string = '';
  showInactive: boolean = false;
  loading = false;
  error: string | null = null;

  constructor(
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.error = null;

    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.allEmployees = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt az alkalmazottak betöltése során.';
        this.loading = false;
        this.snackBar.open('Nem sikerült betölteni az alkalmazottakat.', 'Bezárás', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilters(): void {
    let filtered = this.allEmployees;

    // Filter by active status
    if (!this.showInactive) {
      filtered = filtered.filter(employee => employee.isActive);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(employee => {
        const fullName = `${employee.lastName} ${employee.firstName}`.toLowerCase();
        const email = employee.email.toLowerCase();
        const company = employee.companyName.toLowerCase();
        const roomNumber = employee.roomNumber?.toLowerCase() || '';

        return fullName.includes(query) ||
               email.includes(query) ||
               company.includes(query) ||
               roomNumber.includes(query);
      });
    }

    this.filteredEmployees = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onToggleInactive(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  editEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeEditDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: employee,
      autoFocus: false,
      panelClass: 'employee-edit-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Employee was updated, reload the list
        this.loadEmployees();
      }
    });
  }

  viewContracts(employee: Employee): void {
    import('../contracts/contracts.component').then(module => {
      this.dialog.open(module.ContractsComponent, {
        width: '1200px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: {
          employeeId: employee.userId,
          employeeName: `${employee.lastName} ${employee.firstName}`
        },
        autoFocus: false
      });
    });
  }

  viewEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDetailDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: employee,
      autoFocus: false,
      panelClass: 'employee-detail-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Employee was updated via edit dialog, reload the list
        this.loadEmployees();
      }
    });
  }

  addEmployee(): void {
    const dialogRef = this.dialog.open(EmployeeAddDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'employee-add-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Employee was created, reload the list
        this.loadEmployees();
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU');
  }

  getStatusForEmployee(employee: Employee): 'active' | 'inactive' {
    // You can implement your own logic here
    // For now, we'll assume all employees are active
    return 'active';
  }
}
