import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SongService } from '../../core/services/song-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
@Component({
  selector: 'app-upload-song',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule 
  ],
  templateUrl: './upload-song.component.html',
  styleUrl: './upload-song.component.scss'
})
export class UploadSongComponent implements OnInit, OnDestroy {
  songForm!: FormGroup;
  uploading = false;

  songFile: File | null = null;
  imageFile: File | null = null;

  imagePreviewUrl: string | null = null;
  audioPreviewUrl: string | null = null;

  songFileError = '';
  imageFileError = '';

  constructor(
    private formBuilder: FormBuilder,
    private songService: SongService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.songForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      artist: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  // Destruction du composant : Libération de la mémoire des URLs créées
  ngOnDestroy(): void {
    if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
    if (this.audioPreviewUrl) URL.revokeObjectURL(this.audioPreviewUrl);
  }

  // Gestion du fichier Audio
  onSongFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('audio/')) {
        this.songFileError = 'Please select a valid audio file';
        this.songFile = null;
        this.audioPreviewUrl = null;
        return;
      }

      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        this.songFileError = 'Audio file size should not exceed 50MB';
        this.songFile = null;
        this.audioPreviewUrl = null;
        return;
      }

      if (this.audioPreviewUrl) URL.revokeObjectURL(this.audioPreviewUrl);
      this.songFile = file;
      this.audioPreviewUrl = URL.createObjectURL(file);
      this.songFileError = '';
    }
  }

  // Gestion de l'image de couverture
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

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.imageFileError = 'Image file size should not exceed 5MB';
        this.imageFile = null;
        this.imagePreviewUrl = null;
        return;
      }

      if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
      this.imageFile = file;
      this.imagePreviewUrl = URL.createObjectURL(file);
      this.imageFileError = '';
    }
  }

  onSubmit(): void {
    this.uploading = true;
    const { title, artist } = this.songForm.value;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('artist', artist.trim());
    formData.append('songFile', this.songFile!);
    formData.append('imageFile', this.imageFile!);

    this.songService.addSong(formData).subscribe({
      next: () => {
        this.uploading = false;
        this.notificationService.success('Song uploaded successfully!');
        this.resetForm();
        this.router.navigate(['/home']); // Ou '/my-uploads' si tu as créé la page
      },
      error: (error) => {
        console.error(error);
        this.uploading = false;
        this.notificationService.error(error.error?.message || 'Failed to upload song. Please try again.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/home']);
  }

  private resetForm(): void {
    this.songForm.reset();
    this.songFile = null;
    this.imageFile = null;
    if (this.audioPreviewUrl) URL.revokeObjectURL(this.audioPreviewUrl);
    if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
    this.audioPreviewUrl = null;
    this.imagePreviewUrl = null;
    this.songFileError = '';
    this.imageFileError = '';
  }

  get isFormValid(): boolean {
    return this.songForm.valid && !!this.songFile && !!this.imageFile && !this.songFileError && !this.imageFileError;
  }
  clearSongFile(): void {
    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
    }
    this.songFile = null;
    this.audioPreviewUrl = null;
    this.songFileError = '';
  }

  clearImageFile(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.imageFile = null;
    this.imagePreviewUrl = null;
    this.imageFileError = '';
  }
}