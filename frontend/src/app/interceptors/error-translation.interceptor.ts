import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorTranslationInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      try {
        // Only handle errors with error.message from backend
        if (error.error && error.error.message) {
          const backendMessage = error.error.message;

          // Map backend error messages to Hungarian
          const errorMap: { [key: string]: string } = {
            // Account & Authentication
            'Account is inactive. Please contact an administrator.': 'A fiók inaktív. Kérjük, lépjen kapcsolatba egy adminisztrátorral.',
            'You cannot deactivate your own account': 'Nem deaktiválhatod a saját fiókodat',
            'Unknown user': 'Ismeretlen felhasználó',
            'User not found': 'Felhasználó nem található',
            'Current user not found': 'Jelenlegi felhasználó nem található',
            'Invalid password': 'Hibás jelszó',
            'Authentication required': 'Bejelentkezés szükséges',
            'Authentication required to create users': 'Felhasználók létrehozásához bejelentkezés szükséges',
            'Authentication required. Please provide a valid token.': 'Bejelentkezés szükséges. Kérjük, adjon meg érvényes tokent.',
            'You do not have permission': 'Nincs jogosultságod ehhez a művelethez',
            'You can only access your own employee data': 'Csak a saját dolgozói adataidat érheted el',
            'You do not have permission to create users. Only ADMIN and HR roles can create users.': 'Nincs jogosultságod felhasználók létrehozásához. Csak ADMIN és HR szerepkörök hozhatnak létre felhasználókat.',
            'Only ADMIN users can create ADMIN or HR accounts': 'Csak ADMIN felhasználók hozhatnak létre ADMIN vagy HR fiókokat',
            'Access denied': 'Hozzáférés megtagadva',

            // Employee
            'Email already exists': 'Ez az e-mail cím már használatban van',
            'Email already exists for another employee': 'Ez az e-mail cím már használatban van',
            'Employee not found': 'Dolgozó nem található',
            'Employee profile not found': 'Dolgozói profil nem található',
            'Employee already checked out': 'A dolgozó már kijelentkezett',
            'Tax ID already exists': 'Ez az adóazonosító már használatban van',
            'Tax ID already exists for another employee': 'Ez az adóazonosító már használatban van',
            'TAJ number already exists': 'Ez a TAJ szám már használatban van',
            'TAJ number already exists for another employee': 'Ez a TAJ szám már használatban van',
            'ID card number already exists': 'Ez a személyi igazolvány szám már használatban van',
            'ID card number already exists for another employee': 'Ez a személyi igazolvány szám már használatban van',

            // Accommodation & Room
            'Accommodation not found': 'Szállás nem található',
            'Room not found': 'Szoba nem található',
            'is at full capacity': 'A szoba betelt',
            'Room is at full capacity': 'A szoba betelt',
            'Cannot reduce capacity below current occupancy': 'A szoba kapacitása nem csökkenthető a jelenlegi foglaltság alá',
            'Cannot delete room with active allocations': 'Nem törölhető olyan szoba, amelyben dolgozók laknak',
            'Room number': 'A szobaszám már létezik ebben a szállásban',
            'already exists in this accommodation': 'A szobaszám már létezik ebben a szállásban',
            'Employee already has an active room allocation': 'A dolgozó már rendelkezik aktív szoba beosztással',
            'not found': 'Nem található',

            // Room Allocation
            'Allocation not found': 'Beosztás nem található',

            // Password
            'Old password is incorrect': 'A régi jelszó helytelen',
            'New password must be at least 6 characters long': 'A jelszónak legalább 6 karakter hosszúnak kell lennie',

            // Contract
            'Contract not found': 'A szerződés nem található',
            'Contract is already terminated': 'Ez a szerződés már le van zárva',
            'Cannot terminate an expired contract': 'Lejárt szerződés nem zárható le',
            'Start date is required': 'A kezdő dátum megadása kötelező',
            'End date cannot be before start date': 'A végdátum nem lehet korábbi a kezdési dátumnál',
            'Hourly rate must be greater than zero': 'Az óradíjnak nagyobbnak kell lennie 0-nál',
            'PDF not available for this contract': 'A szerződéshez nem érhető el PDF',
            'PDF file not found or not readable': 'A PDF fájl nem található vagy nem olvasható',
            'Error reading PDF file': 'Hiba a PDF fájl olvasása során',

            // Advance Requests
            'Advance request not found': 'Előleg kérelem nem található',
            'Advance request has already been reviewed': 'Az előleg kérelem már felülvizsgálásra került',
            'Amount must be greater than zero': 'Az összegnek nagyobbnak kell lennie nullánál',
            'Invalid status': 'Érvénytelen státusz',
            'Status must be APPROVED or REJECTED': 'A státusznak JÓVÁHAGYVA vagy ELUTASÍTVA értékűnek kell lennie',
            'Rejection reason is required when rejecting': 'Elutasítási indok megadása kötelező elutasításkor',
            'Invalid status. Use APPROVED or REJECTED': 'Érvénytelen státusz. Használja a JÓVÁHAGYVA vagy ELUTASÍTVA értéket'
          };

          // Check for exact match
          if (errorMap[backendMessage]) {
            // Don't show snackbar here for login errors - let login component handle it
            if (!req.url.includes('/auth/login')) {
              snackBar.open(errorMap[backendMessage], 'Bezárás', {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              });
            }
          }
          // Check for partial matches
          else {
            for (const [key, value] of Object.entries(errorMap)) {
              if (backendMessage.includes(key)) {
                if (!req.url.includes('/auth/login')) {
                  snackBar.open(value, 'Bezárás', {
                    duration: 5000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['error-snackbar']
                  });
                }
                break;
              }
            }
          }
        }
      } catch (e) {}

      return throwError(() => error);
    })
  );
};
