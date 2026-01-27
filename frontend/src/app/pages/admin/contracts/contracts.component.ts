import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContractService, Contract } from '../../../services/contract/contract.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss'
})
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  displayedColumns: string[] = ['contractNumber', 'dates', 'rate', 'hours', 'status', 'actions'];
  loading = false;
  error: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { employeeId: number; employeeName: string },
    private dialogRef: MatDialogRef<ContractsComponent>,
    private contractService: ContractService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;
    this.error = null;

    this.contractService.getEmployeeContracts(this.data.employeeId).subscribe({
      next: (contracts) => {
        this.contracts = contracts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.error = 'Hiba történt a szerződések betöltése során.';
        this.loading = false;
      }
    });
  }

  openCreateDialog(): void {
    import('./create-contract-dialog/create-contract-dialog.component').then(module => {
      const dialogRef = this.dialog.open(module.CreateContractDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: {
          employeeId: this.data.employeeId,
          employeeName: this.data.employeeName
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadContracts(); // Refresh list
        }
      });
    });
  }

  downloadPdf(contract: Contract): void {
    this.contractService.downloadContractPdf(contract.id).subscribe({
      next: (blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contract-${contract.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Szerződés PDF letöltve!', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      },
      error: async (error) => {
        console.error('Error downloading PDF:', error);
        let errorMessage = 'Hiba történt a PDF letöltése során.';

        // Handle blob error responses (like 401, 404)
        if (error.error instanceof Blob) {
          try {
            // Parse the blob error message
            const text = await error.error.text();
            const errorObj = JSON.parse(text);
            if (errorObj.message) {
              if (errorObj.message.includes('not found') || errorObj.message.includes('not available')) {
                errorMessage = 'A PDF fájl még nem elérhető vagy nem található.';
              }
            }
          } catch (e) {
            // If parsing fails, use default message
            console.error('Error parsing blob error:', e);
          }
        } else if (error.status === 404) {
          errorMessage = 'A PDF fájl még nem elérhető vagy nem található.';
        } else if (error.status === 401) {
          errorMessage = 'Nincs jogosultsága a PDF letöltéséhez. Kérem jelentkezzen be újra.';
        }

        this.snackBar.open(errorMessage, 'Bezárás', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  invalidateContract(contract: Contract, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Check if contract can be invalidated
    if (contract.status === 'TERMINATED') {
      this.snackBar.open('Ez a szerződés már le van zárva.', 'Bezárás', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (contract.status === 'EXPIRED') {
      this.snackBar.open('Lejárt szerződés nem zárható le.', 'Bezárás', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Confirm invalidation
    const confirmMessage = `Biztosan le szeretné zárni a következő szerződést?\n\n` +
      `Szerződésszám: ${contract.contractNumber}\n` +
      `Állapot: ${this.getStatusText(contract.status)}\n\n` +
      `A szerződés státusza "Megszüntetett"-re változik.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Call API to invalidate
    this.contractService.invalidateContract(contract.id).subscribe({
      next: (updatedContract) => {
        this.snackBar.open('Szerződés sikeresen lezárva!', 'Bezárás', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.loadContracts(); // Refresh list
      },
      error: (error) => {
        console.error('Error invalidating contract:', error);
        // Error is handled by global errorTranslationInterceptor
        if (!error.error || !error.error.message) {
          this.snackBar.open('Hiba történt a szerződés lezárása során.', 'Bezárás', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'TERMINATED': return 'terminated';
      case 'EXPIRED': return 'expired';
      case 'DRAFT': return 'draft';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Aktív';
      case 'TERMINATED': return 'Megszüntetett';
      case 'EXPIRED': return 'Lejárt';
      case 'DRAFT': return 'Tervezet';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'check_circle';
      case 'TERMINATED': return 'cancel';
      case 'EXPIRED': return 'event_busy';
      case 'DRAFT': return 'edit';
      default: return 'help';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Határozatlan';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value);
  }

  close(): void {
    this.dialogRef.close();
  }
}

