import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { AccommodationService } from '../../../../services/accommodation/accommodation.service';

interface RoomHistory {
  id: number;
  roomNumber: string;
  employeeName: string;
  checkInDate: string;
  checkOutDate: string | null;
  status: string;
}

@Component({
  selector: 'app-room-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './room-history-dialog.component.html',
  styleUrl: './room-history-dialog.component.scss'
})
export class RoomHistoryDialogComponent implements OnInit {
  loading = false;
  roomHistory: RoomHistory[] = [];
  displayedColumns: string[] = ['roomNumber', 'checkInDate', 'checkOutDate', 'status'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { employeeId: number; employeeName: string },
    private dialogRef: MatDialogRef<RoomHistoryDialogComponent>,
    private accommodationService: AccommodationService
  ) {}

  ngOnInit(): void {
    this.loadRoomHistory();
  }

  loadRoomHistory(): void {
    this.loading = true;
    this.accommodationService.getEmployeeRoomHistory(this.data.employeeId).subscribe({
      next: (history: RoomHistory[]) => {
        this.roomHistory = history;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading room history:', error);
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Folyamatban';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU');
  }

  close(): void {
    this.dialogRef.close();
  }
}

