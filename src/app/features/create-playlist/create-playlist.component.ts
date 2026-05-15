import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PlaylistService } from '../../core/services/playlist-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-playlist',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,      // Indispensable pour [formGroup]
    MatIconModule,            // Indispensable pour <mat-icon>
    MatButtonModule,          // Indispensable pour mat-raised-button
    MatProgressSpinnerModule, // Indispensable pour <mat-spinner>
    RouterModule              // Indispensable pour routerLink
  ],
  templateUrl: './create-playlist.component.html',
  styleUrls: ['./create-playlist.component.scss']
})
export class CreatePlaylist implements OnDestroy {
  playlistForm: FormGroup;
  uploading = false;
  imageFileError = '';
  imageFile: File | null = null;
  imagePreviewUrl: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private playlistService: PlaylistService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.playlistForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      isPublic: [true]
    });
  }

  ngOnDestroy(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.imageFileError = 'Please select a valid image file';
        this.imageFile = null;
        this.imagePreviewUrl = null;
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.imageFileError = 'Image file size should not exceed 5MB';
        this.imageFile = null;
        this.imagePreviewUrl = null;
        return;
      }

      if (this.imagePreviewUrl) {
        URL.revokeObjectURL(this.imagePreviewUrl);
      }

      this.imageFile = file;
      this.imagePreviewUrl = URL.createObjectURL(file);
      this.imageFileError = '';
    }
  }

  clearImageFile(): void {
    this.imageFile = null;
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.imagePreviewUrl = null;
    this.imageFileError = '';
  }

  onSubmit() {
    if (this.isFormValid) {
      this.uploading = true;
      const { name, description, isPublic } = this.playlistForm.value;

      this.playlistService.createPlaylist(
        name.trim(), 
        description.trim(), 
        isPublic, 
        this.imageFile!
      ).subscribe({
        next: (playlist) => {
          this.router.navigate(['/playlist', playlist.id]);
          this.notificationService.success('Playlist created successfully!');
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Failed to create playlist. Please try again.';
          this.notificationService.error(errorMessage);
          this.uploading = false;
        }
      });
    }
  }

  get isFormValid(): boolean {
    return this.playlistForm.valid && !!this.imageFile && !this.imageFileError;
  }
}