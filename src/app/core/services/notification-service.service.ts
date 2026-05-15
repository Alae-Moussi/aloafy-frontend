import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) { }

  success(message: string, duration: number = 5000): void {
    this.snackBar.open(`✔️ ${message}`, 'X', {
      duration: duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['notification-success']
    });
  }

  error(message: string, duration: number = 5000): void {
    this.snackBar.open(`❌ ${message}`, 'X', {
      duration: duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['notification-error']
    });
  }

  warning(message: string, duration: number = 5000): void {
    this.snackBar.open(`⚠️ ${message}`, 'X', {
      duration: duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['notification-warning']
    });
  }
}