import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../services/authservice/auth.service';

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName?: string;
  roomNumber?: string;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class EmployeeDashboardComponent implements OnInit {
  userData: UserData | null = null;
  currentDate: Date = new Date();

  quickActions = [
    {
      icon: 'request_quote',
      title: 'Előleg kérelem',
      description: 'Új előleg igénylése',
      route: '/employees/advance-request',
      color: 'primary'
    },
    {
      icon: 'history',
      title: 'Kérelmeim',
      description: 'Korábbi kérelmek megtekintése',
      route: '/employees/my-requests',
      color: 'accent'
    },
    {
      icon: 'person',
      title: 'Profil',
      description: 'Személyes adatok',
      route: '/employees/profile',
      color: 'primary'
    },
    {
      icon: 'meeting_room',
      title: 'Szobám',
      description: 'Szállás információk',
      route: '/employees/my-room',
      color: 'accent'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const user = this.authService.getUserData();
    if (user) {
      this.userData = user;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Jó reggelt';
    if (hour < 18) return 'Jó napot';
    return 'Jó estét';
  }

  formatDate(): string {
    return this.currentDate.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

