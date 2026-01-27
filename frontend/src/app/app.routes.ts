import { Routes } from '@angular/router';
import {LoginComponent} from './pages/login/login.component';
import {AdminDashboardComponent} from './pages/admin/dashboard/dashboard.component';
import {AdminEmployeesComponent} from './pages/admin/employees/employees.component';
import {HomeComponent} from './pages/admin/home/home.component';
import {ProfileComponent} from './pages/admin/profile/profile.component';
import {AccommodationsComponent} from './pages/admin/accommodations/accommodations.component';
import {RoomsComponent} from './pages/admin/rooms/rooms.component';
import {AdvancesComponent} from './pages/admin/advances/advances.component';
import {AuditLogsComponent} from './pages/admin/audit-logs/audit-logs.component';
import {UserManagementComponent} from './pages/admin/user-management/user-management.component';
import {EmployeeDashboardComponent} from './pages/employees/dashboard/dashboard.component';
import {AdvanceRequestComponent} from './pages/employees/advance-request/advance-request.component';
import {MyRequestsComponent} from './pages/employees/my-requests/my-requests.component';
import {ProfileComponent as EmployeeProfileComponent} from './pages/employees/profile/profile.component';
import {MyRoomComponent} from './pages/employees/my-room/my-room.component';
import {authGuard} from './guards/auth.guard';
import {adminGuard} from './guards/admin.guard';
import {adminOnlyGuard} from './guards/admin-only.guard';

export const routes: Routes = [
    {
        path: '',
        title: 'Staffi - Bejelentkezés',
        component: LoginComponent
    },
    {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [authGuard, adminGuard],
        canActivateChild: [authGuard, adminGuard],
        children: [
            {
                path: 'dashboard',
                title: 'Staffi - Admin Dashboard',
                component: HomeComponent
            },
            {
                path: 'employees',
                title: 'Staffi - Alkalmazottak',
                component: AdminEmployeesComponent
            },
            {
                path: 'advances',
                title: 'Staffi - Előlegek',
                component: AdvancesComponent
            },
            {
                path: 'profile',
                title: 'Staffi - Profil',
                component: ProfileComponent
            },
            {
                path: 'accommodations',
                title: 'Staffi - Szállások',
                component: AccommodationsComponent
            },
            {
                path: 'rooms',
                title: 'Staffi - Szobák',
                component: RoomsComponent
            },
            {
                path: 'audit-logs',
                title: 'Staffi - Audit Naplók',
                component: AuditLogsComponent,
                canActivate: [adminOnlyGuard]
            },
            {
                path: 'user-management',
                title: 'Staffi - Felhasználó Kezelés',
                component: UserManagementComponent,
                canActivate: [adminOnlyGuard]
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'employees',
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                title: 'Staffi - Dashboard',
                component: EmployeeDashboardComponent
            },
            {
                path: 'advance-request',
                title: 'Staffi - Előleg kérelem',
                component: AdvanceRequestComponent
            },
            {
                path: 'my-requests',
                title: 'Staffi - Kérelmeim',
                component: MyRequestsComponent
            },
            {
                path: 'my-room',
                title: 'Staffi - Szobám',
                component: MyRoomComponent
            },
            {
                path: 'profile',
                title: 'Staffi - Profilom',
                component: EmployeeProfileComponent
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
