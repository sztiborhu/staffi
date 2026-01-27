import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  userId: number;
  userEmail: string;
  userRole: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  timestamp: string;
}

@Component({
  selector: 'app-audit-log-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './audit-log-detail-dialog.component.html',
  styleUrl: './audit-log-detail-dialog.component.scss'
})
export class AuditLogDetailDialogComponent {
  oldValueObj: any = null;
  newValueObj: any = null;
  changes: { field: string; oldValue: any; newValue: any }[] = [];

  constructor(
    public dialogRef: MatDialogRef<AuditLogDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AuditLog
  ) {
    this.parseValues();
    this.calculateChanges();
  }

  parseValues(): void {
    // Parse old value - backend sends JSON
    if (this.data.oldValue) {
      try {
        this.oldValueObj = JSON.parse(this.data.oldValue);
      } catch (e) {
        console.error('Error parsing old value:', e);
        this.oldValueObj = null;
      }
    }

    // Parse new value - backend sends JSON
    if (this.data.newValue) {
      try {
        this.newValueObj = JSON.parse(this.data.newValue);
      } catch (e) {
        console.error('Error parsing new value:', e);
        this.newValueObj = null;
      }
    }
  }

  calculateChanges(): void {
    if (!this.oldValueObj && !this.newValueObj) {
      return;
    }

    // Special handling for DELETE actions
    const isDeleteAction = this.data.action === 'DELETE';

    const allKeys = new Set([
      ...Object.keys(this.oldValueObj || {}),
      ...Object.keys(this.newValueObj || {})
    ]);

    allKeys.forEach(key => {
      const oldVal = this.oldValueObj?.[key];
      const newVal = this.newValueObj?.[key];

      // Skip if both values are the same
      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) {
        return;
      }

      // Skip if both are empty/null/undefined
      if (this.isEmpty(oldVal) && this.isEmpty(newVal)) {
        return;
      }

      // For DELETE actions, show fields that had values (were deleted)
      if (isDeleteAction) {
        // Only show fields that had values before deletion
        if (!this.isEmpty(oldVal)) {
          this.changes.push({
            field: this.formatFieldName(key),
            oldValue: this.formatValue(oldVal),
            newValue: '(törölve)' // Show "deleted" instead of empty
          });
        }
      } else {
        // For CREATE/UPDATE actions, show normal comparison
        this.changes.push({
          field: this.formatFieldName(key),
          oldValue: this.formatValue(oldVal),
          newValue: this.formatValue(newVal)
        });
      }
    });
  }

  isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return typeof value === 'object' && Object.keys(value).length === 0;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '(üres)';
    }

    // Handle dates (arrays like [2023, 6, 15])
    if (Array.isArray(value) && value.length === 3 &&
        typeof value[0] === 'number' && typeof value[1] === 'number' && typeof value[2] === 'number') {
      const [year, month, day] = value;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Handle objects (convert to readable string)
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `[${value.length} elem]` : '(üres)';
      }

      // Handle User objects specifically
      if (value.firstName && value.lastName) {
        return `${value.lastName} ${value.firstName}`;
      }

      // Handle objects with email
      if (value.email && !value.firstName) {
        return value.email;
      }

      // Handle objects with name
      if (value.name) {
        return value.name;
      }

      // Handle objects with id (show as reference)
      if (value.id && Object.keys(value).length === 1) {
        return `ID: ${value.id}`;
      }

      // Otherwise show number of properties
      const keys = Object.keys(value).filter(k => k !== 'password' && k !== 'createdAt' && k !== 'updatedAt');
      return keys.length > 0 ? `{${keys.length} mező}` : '(üres)';
    }

    // Handle strings
    if (typeof value === 'string') {
      return value.trim() || '(üres)';
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Igen' : 'Nem';
    }

    // Handle other types
    return String(value);
  }

  formatFieldName(field: string): string {
    // Convert camelCase to readable format
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getOldValueLabel(): string {
    switch (this.data.action) {
      case 'DELETE':
        return 'Törölt érték:';
      case 'CREATE':
        return 'Kezdeti érték:';
      default:
        return 'Régi érték:';
    }
  }

  getNewValueLabel(): string {
    switch (this.data.action) {
      case 'DELETE':
        return 'Állapot:';
      case 'CREATE':
        return 'Létrehozott érték:';
      default:
        return 'Új érték:';
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}

