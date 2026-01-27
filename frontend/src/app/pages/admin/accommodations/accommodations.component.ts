import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Accommodation, AccommodationService } from '../../../services/accommodation/accommodation.service';
import { AuthService } from '../../../services/authservice/auth.service';

@Component({
  selector: 'app-accommodations',
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
    MatTooltipModule
  ],
  templateUrl: './accommodations.component.html',
  styleUrl: './accommodations.component.scss'
})
export class AccommodationsComponent implements OnInit {
  accommodations: Accommodation[] = [];
  displayedColumns: string[] = ['id', 'name', 'address', 'managerContact', 'totalCapacity', 'actions'];
  loading = false;
  error: string | null = null;
  showCreateForm = false;
  createForm!: FormGroup;
  creating = false;
  editMode = false;
  editingAccommodation: Accommodation | null = null;
  userRole: string | null = null;

  constructor(
    private accommodationService: AccommodationService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.initCreateForm();
    this.loadAccommodations();
  }

  initCreateForm(): void {
    this.createForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      managerContact: ['', [Validators.required]]
    });
  }

  loadAccommodations(): void {
    this.loading = true;
    this.error = null;

    this.accommodationService.getAllAccommodations().subscribe({
      next: (data) => {
        this.accommodations = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accommodations:', error);
        this.error = 'Hiba történt a szállások betöltése során.';
        this.loading = false;
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createForm.reset();
      this.editMode = false;
      this.editingAccommodation = null;
    }
  }

  editAccommodation(accommodation: Accommodation): void {
    this.editMode = true;
    this.editingAccommodation = accommodation;
    this.showCreateForm = true;
    this.createForm.patchValue({
      name: accommodation.name,
      address: accommodation.address,
      managerContact: accommodation.managerContact
    });
  }

  createAccommodation(): void {
    if (this.createForm.valid) {
      this.creating = true;

      if (this.editMode && this.editingAccommodation) {
        // Update existing accommodation
        this.accommodationService.updateAccommodation(this.editingAccommodation.id, this.createForm.value).subscribe({
          next: () => {
            this.creating = false;
            this.snackBar.open('Szállás sikeresen frissítve!', 'Bezárás', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            this.showCreateForm = false;
            this.createForm.reset();
            this.editMode = false;
            this.editingAccommodation = null;
            this.loadAccommodations();
          },
          error: (error) => {
            console.error('Error updating accommodation:', error);
            this.creating = false;
            this.snackBar.open('Hiba történt a frissítés során.', 'Bezárás', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      } else {
        // Create new accommodation
        this.accommodationService.createAccommodation(this.createForm.value).subscribe({
          next: () => {
            this.creating = false;
            this.snackBar.open('Szállás sikeresen létrehozva!', 'Bezárás', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            this.showCreateForm = false;
            this.createForm.reset();
            this.loadAccommodations();
          },
          error: (error) => {
            console.error('Error creating accommodation:', error);
            this.creating = false;
            this.snackBar.open('Hiba történt a szállás létrehozása során.', 'Bezárás', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  viewRooms(accommodation: Accommodation): void {
    this.router.navigate(['/admin/rooms'], { queryParams: { accommodationId: accommodation.id, name: accommodation.name } });
  }
}
