import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/authservice/auth.service';
import { DashboardService, DashboardStats } from '../../../services/dashboard/dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'admin-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  sidenavOpened = true;
  userData: any;
  stats: DashboardStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {
    this.userData = this.authService.getUserData();
  }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a statisztikák betöltése során.';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
