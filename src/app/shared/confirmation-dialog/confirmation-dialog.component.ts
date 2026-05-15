import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import nécessaire pour CommonModule
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'; // Import nécessaire pour MatButtonModule
import { ConfirmationDialogData } from '../../core/models/dialog.models';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true, // Configuration correcte
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialog {

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    // Initialisation des valeurs par défaut si elles ne sont pas fournies
    this.data.confirmText = this.data.confirmText || 'Confirm';
    this.data.cancelText = this.data.cancelText || 'Cancel';
    this.data.confirmColor = this.data.confirmColor || 'warn';
    this.data.type = this.data.type || 'warning';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  getIconClass(): string {
    return `icon-${this.data.type}`;
  }

  getIconSymbol(): string {
    switch (this.data.type) {
      case 'warning': return '!';
      case 'danger': return '⚠';
      case 'info': return 'i';
      case 'success': return '✓';
      default: return '!';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.data.confirmColor) {
      case 'warn': return 'btn-danger';
      case 'primary': return 'btn-primary';
      case 'accent': return 'btn-accent';
      default: return 'btn-danger';
    }
  }
}