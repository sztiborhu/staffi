import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Employee } from '../../../../services/employee/employee.service';
import { EmployeeEditDialogComponent } from '../employee-edit-dialog/employee-edit-dialog.component';
import { RoomHistoryDialogComponent } from '../room-history-dialog/room-history-dialog.component';

@Component({
  selector: 'app-employee-detail-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './employee-detail-dialog.component.html',
  styleUrl: './employee-detail-dialog.component.scss'
})
export class EmployeeDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EmployeeDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public employee: Employee,
    private dialog: MatDialog
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  openEdit(): void {
    // Close this dialog first
    this.dialogRef.close();

    // Open edit dialog
    const editDialogRef = this.dialog.open(EmployeeEditDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: this.employee,
      autoFocus: false,
      panelClass: 'employee-edit-dialog'
    });

    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Employee was updated, pass the result back
        this.dialogRef.close(result);
      }
    });
  }

  viewRoomHistory(): void {
    this.dialog.open(RoomHistoryDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        employeeId: this.employee.id,
        employeeName: `${this.employee.lastName} ${this.employee.firstName}`
      },
      autoFocus: false,
      panelClass: 'room-history-dialog'
    });
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

  getStatusText(): string {
    return this.employee.isActive ? 'Aktív' : 'Inaktív';
  }

  getStatusClass(): string {
    return this.employee.isActive ? 'status-active' : 'status-inactive';
  }
}
