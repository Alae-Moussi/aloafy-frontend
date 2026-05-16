import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserServiceService } from '../../core/services/user-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { User } from '../../core/models/user.models';

import { EditProfileDialogComponent } from '../../shared/edit-profile-dialog/edit-profile-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private userService: UserServiceService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  // --- CHARGEMENT DU PROFIL ---
  loadUserProfile() {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load your profile. Please try again later.';
        this.loading = false;
        console.error(error);
      }
    });
  }

  // --- MODIFICATION DU PROFIL (DIALOG) ---
  openEditProfileDialog() {
    if (!this.user) return;

    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '500px',
      maxHeight: '90vw',
      panelClass: ['custom-dialog-container', 'edit-profile-dialog'],
      data: { user: this.user }
    });

    dialogRef.afterClosed().subscribe(updateRequest => {
      if (!updateRequest) return;

      this.userService.updateUserProfile(updateRequest).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.notificationService.success('Profile updated successfully');
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Failed to update profile. Please try again.';
          this.notificationService.error(errorMessage);
        }
      });
    });
  }

  // --- GESTION DU BADGE DE RÔLE ---
  getRoleBadgeClass(): string {
    return this.user?.role === 'ADMIN' ? 'role-badge-admin' : 'role-badge-user';
  }


}
