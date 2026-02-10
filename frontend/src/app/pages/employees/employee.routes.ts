import { Routes } from '@angular/router';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: 'dashboard',
    title: 'Staffi - Dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.EmployeeDashboardComponent)
  },
  {
    path: 'advance-request',
    title: 'Staffi - Előleg kérelem',
    loadComponent: () => import('./advance-request/advance-request.component').then(m => m.AdvanceRequestComponent)
  },
  {
    path: 'my-requests',
    title: 'Staffi - Kérelmeim',
    loadComponent: () => import('./my-requests/my-requests.component').then(m => m.MyRequestsComponent)
  },
  {
    path: 'my-room',
    title: 'Staffi - Szobám',
    loadComponent: () => import('./my-room/my-room.component').then(m => m.MyRoomComponent)
  },
  {
    path: 'profile',
    title: 'Staffi - Profilom',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

