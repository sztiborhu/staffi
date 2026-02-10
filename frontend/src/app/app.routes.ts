import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    {
        path: '',
        title: 'Staffi - Bejelentkezés',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadChildren: () => import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES)
    },
    {
        path: 'employees',
        canActivate: [authGuard],
        loadChildren: () => import('./pages/employees/employee.routes').then(m => m.EMPLOYEE_ROUTES)
    }
];
