import { Song } from './song.model';
import { User } from './user.models';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  type?: 'warning' | 'info' | 'danger' | 'success';
}

export interface SongDialogData {
  song: Song;
}

export interface EditProfileDialogData {
  user: User;
}