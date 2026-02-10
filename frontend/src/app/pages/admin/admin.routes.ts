import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';
import { adminGuard } from '../../guards/admin.guard';
import { adminOnlyGuard } from '../../guards/admin-only.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard],
    canActivateChild: [authGuard, adminGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Staffi - Admin Dashboard',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'employees',
        title: 'Staffi - Alkalmazottak',
        loadComponent: () => import('./employees/employees.component').then(m => m.AdminEmployeesComponent)
      },
      {
        path: 'advances',
        title: 'Staffi - Előlegek',
        loadComponent: () => import('./advances/advances.component').then(m => m.AdvancesComponent)
      },
      {
        path: 'profile',
        title: 'Staffi - Profil',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'accommodations',
        title: 'Staffi - Szállások',
        loadComponent: () => import('./accommodations/accommodations.component').then(m => m.AccommodationsComponent)
      },
      {
        path: 'rooms',
        title: 'Staffi - Szobák',
        loadComponent: () => import('./rooms/rooms.component').then(m => m.RoomsComponent)
      },
      {
        path: 'audit-logs',
        title: 'Staffi - Audit Naplók',
        loadComponent: () => import('./audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
        canActivate: [adminOnlyGuard]
      },
      {
        path: 'user-management',
        title: 'Staffi - Felhasználó Kezelés',
        loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent),
        canActivate: [adminOnlyGuard]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

