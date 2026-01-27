import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats } from '../../../services/dashboard/dashboard.service';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  stats: StatCard[] = [];
  loading = false;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getStats().subscribe({
      next: (data: DashboardStats) => {
        this.stats = this.buildStatCards(data);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a statisztikák betöltése során.';
        this.loading = false;
      }
    });
  }

  private buildStatCards(data: DashboardStats): StatCard[] {
    return [
      {
        title: 'Összes alkalmazott',
        value: data.totalEmployees,
        icon: 'people',
        color: '#1e88e5',
        subtitle: `${data.activeEmployees} aktív • ${data.inactiveEmployees} inaktív`
      },
      {
        title: 'Új alkalmazottak',
        value: data.newEmployeesThisMonth,
        icon: 'person_add',
        color: '#43a047',
        subtitle: 'Ebben a hónapban'
      },
      {
        title: 'Előleg kérelmek',
        value: data.pendingAdvanceRequests,
        icon: 'assignment',
        color: '#fb8c00',
        subtitle: `${data.totalAdvanceRequests} összes kérelem`
      },
      {
        title: 'Jóváhagyott kérelmek',
        value: data.approvedAdvanceRequests,
        icon: 'check_circle',
        color: '#2e7d32',
        subtitle: `${data.rejectedAdvanceRequests} elutasítva`
      }
    ];
  }

  refreshStats(): void {
    this.loadStats();
  }
}
