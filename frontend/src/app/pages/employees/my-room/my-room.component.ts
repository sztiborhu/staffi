import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/authservice/auth.service';

interface RoomOccupant {
  name: string;
  phoneNumber: string;
  email: string;
}

interface RoomInfo {
  roomId: number;
  roomNumber: string;
  accommodationName: string;
  accommodationAddress: string;
  roomCapacity: number;
  checkInDate: string;
  occupants: RoomOccupant[];
}

@Component({
  selector: 'app-my-room',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './my-room.component.html',
  styleUrl: './my-room.component.scss'
})
export class MyRoomComponent implements OnInit {
  roomInfo: RoomInfo | null = null;
  loading = true;
  error: string | null = null;
  noRoom = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRoomInfo();
  }

  loadRoomInfo(): void {
    this.loading = true;
    this.error = null;
    this.noRoom = false;

    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<RoomInfo>('http://localhost:8081/api/employees/me/room', { headers })
      .subscribe({
        next: (data) => {
          this.roomInfo = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading room info:', error);
          this.loading = false;

          if (error.status === 404) {
            this.noRoom = true;
          } else {
            this.error = 'Hiba történt a szoba adatok betöltése során.';
            this.snackBar.open('Hiba történt a szoba adatok betöltése során.', 'Bezárás', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
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

  getOccupancyPercentage(): number {
    if (!this.roomInfo) return 0;
    return Math.round((this.roomInfo.occupants.length / this.roomInfo.roomCapacity) * 100);
  }

  getOccupancyColor(): string {
    const percentage = this.getOccupancyPercentage();
    if (percentage >= 100) return '#dc2626'; // Red - Full
    if (percentage >= 75) return '#f59e0b'; // Orange - Almost full
    return '#10b981'; // Green - Available space
  }

  goBack(): void {
    this.location.back();
  }
}

