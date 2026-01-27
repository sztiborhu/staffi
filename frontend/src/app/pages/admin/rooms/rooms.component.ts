import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { Room, AccommodationService } from '../../../services/accommodation/accommodation.service';
import { AuthService } from '../../../services/authservice/auth.service';

@Component({
  selector: 'app-rooms',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatExpansionModule,
    MatChipsModule
  ],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss'
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  accommodationId: number | null = null;
  accommodationName: string = '';
  loading = false;
  error: string | null = null;
  showCreateForm = false;
  createForm!: FormGroup;
  creating = false;
  editMode = false;
  editingRoom: Room | null = null;
  userRole: string | null = null;

  constructor(
    private accommodationService: AccommodationService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();

    this.route.queryParams.subscribe(params => {
      this.accommodationId = params['accommodationId'] ? +params['accommodationId'] : null;
      this.accommodationName = params['name'] || '';

      if (this.accommodationId) {
        this.initCreateForm();
        this.loadRooms();
      } else {
        this.router.navigate(['/admin/accommodations']);
      }
    });
  }

  initCreateForm(): void {
    this.createForm = this.fb.group({
      roomNumber: ['', [Validators.required]],
      capacity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  loadRooms(): void {
    if (!this.accommodationId) return;

    this.loading = true;
    this.error = null;

    this.accommodationService.getRoomsByAccommodation(this.accommodationId).subscribe({
      next: (data) => {
        this.rooms = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.error = 'Hiba történt a szobák betöltése során.';
        this.loading = false;
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createForm.reset({ capacity: 1 });
      this.editMode = false;
      this.editingRoom = null;
    }
  }

  editRoom(room: Room): void {
    this.editMode = true;
    this.editingRoom = room;
    this.showCreateForm = true;
    this.createForm.patchValue({
      roomNumber: room.roomNumber,
      capacity: room.capacity
    });
  }

  createRoom(): void {
    if (this.createForm.valid && this.accommodationId) {
      this.creating = true;

      if (this.editMode && this.editingRoom) {
        // Update existing room
        const updateData = {
          roomNumber: this.createForm.value.roomNumber,
          capacity: this.createForm.value.capacity
        };

        this.accommodationService.updateRoom(this.editingRoom.id, updateData).subscribe({
          next: () => {
            this.creating = false;
            this.snackBar.open('Szoba sikeresen frissítve!', 'Bezárás', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            this.showCreateForm = false;
            this.createForm.reset({ capacity: 1 });
            this.editMode = false;
            this.editingRoom = null;
            this.loadRooms();
          },
          error: (error) => {
            console.error('Error updating room:', error);
            this.creating = false;
            if (!error.error || !error.error.message) {
              this.snackBar.open('Hiba történt a frissítés során.', 'Bezárás', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          }
        });
      } else {
        // Create new room
        const roomData = {
          accommodationId: this.accommodationId,
          ...this.createForm.value
        };

        this.accommodationService.createRoom(this.accommodationId, roomData).subscribe({
          next: () => {
            this.creating = false;
            this.snackBar.open('Szoba sikeresen létrehozva!', 'Bezárás', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            this.showCreateForm = false;
            this.createForm.reset({ capacity: 1 });
            this.loadRooms();
          },
          error: (error) => {
            console.error('Error creating room:', error);
            this.creating = false;
            if (!error.error || !error.error.message) {
              this.snackBar.open('Hiba történt a szoba létrehozása során.', 'Bezárás', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          }
        });
      }
    }
  }

  deleteRoom(room: Room): void {
    if (confirm(`Biztosan törölni szeretné a(z) ${room.roomNumber} szobát?`)) {
      this.accommodationService.deleteRoom(room.id).subscribe({
        next: () => {
          this.snackBar.open('Szoba sikeresen törölve!', 'Bezárás', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.loadRooms();
        },
        error: (error) => {
          console.error('Error deleting room:', error);
          if (!error.error || !error.error.message) {
            this.snackBar.open('Hiba történt a törlés során.', 'Bezárás', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    }
  }

  backToAccommodations(): void {
    this.router.navigate(['/admin/accommodations']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU');
  }
}
