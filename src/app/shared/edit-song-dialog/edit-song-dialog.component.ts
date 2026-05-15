import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog'; // Pour mat-dialog-content/actions
import { MatButtonModule } from '@angular/material/button';   // Pour les boutons
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Assure-toi que cette interface est définie dans ton modèle
export interface SongDialogData {
  song: any;
}

@Component({
  selector: 'app-edit-song-dialog',
  standalone: true, // Assure-toi qu'il est bien à true
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDialogModule, // Ajoute cette ligne
    MatButtonModule, // Ajoute cette ligne
    MatIconModule    // Ajoute cette ligne
  ],
  templateUrl: './edit-song-dialog.component.html',
  styleUrls: ['./edit-song-dialog.component.scss']
})
export class EditSongDialog implements OnDestroy {
  songForm: FormGroup;
  songFile: File | null = null;
  imageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  audioPreviewUrl: string | null = null;
  songFileError = '';
  imageFileError = '';

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<EditSongDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SongDialogData
  ) {
    this.songForm = this.formBuilder.group({
      title: [data.song.title, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      artist: [data.song.artist, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  ngOnDestroy(): void {
    if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
    if (this.audioPreviewUrl) URL.revokeObjectURL(this.audioPreviewUrl);
  }

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
      if (file.size > 50 * 1024 * 1024) {
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
      if (file.size > 5 * 1024 * 1024) {
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

  clearSongFile(): void {
    if (this.audioPreviewUrl) URL.revokeObjectURL(this.audioPreviewUrl);
    this.songFile = null;
    this.audioPreviewUrl = null;
    this.songFileError = '';
  }

  clearImageFile(): void {
    if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
    this.imageFile = null;
    this.imagePreviewUrl = null;
    this.imageFileError = '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const { title, artist } = this.songForm.value;
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('artist', artist.trim());
    if (this.songFile) formData.append('songFile', this.songFile);
    if (this.imageFile) formData.append('imageFile', this.imageFile);
    
    this.dialogRef.close(formData);
  }

  get isFormValid(): boolean {
    return this.songForm.valid && !this.songFileError && !this.imageFileError;
  }
}