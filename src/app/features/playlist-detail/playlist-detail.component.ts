import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PlaylistService } from '../../core/services/playlist-service.service';
import { MusicPlayerService } from '../../core/services/music-player-service.service';
import { AuthService } from '../../core/services/auth-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { PlaylistWithSongs, SongInPlaylist } from '../../core/models/playlist.model';
import { Song } from '../../core/models/song.model';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common'; // Pour ngIf et ngClass
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthImagePipe } from '../../core/pipes/auth-image.pipe'; // Vérifie le chemin de ton pipe
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AuthImagePipe,
    DragDropModule,// N'oublie pas de l'ajouter ici !
  ],
  templateUrl: './playlist-detail.component.html',
  styleUrls: ['./playlist-detail.component.scss']
})
export class PlaylistDetailComponent implements OnInit, OnDestroy {
  playlist: PlaylistWithSongs | null = null;
  loading = true;
  errorMessage = '';
  playlistId = 0;
  currentPlaySongId: number | null = null;
  isOwner = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playlistService: PlaylistService,
    private musicPlayerService: MusicPlayerService,
    private authService: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // 1. Récupération de l'ID depuis l'URL
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.playlistId = +params['id'];
      if (this.playlistId) {
        this.loadPlaylist();
      }
    });

    // 2. Suivi de la chanson en cours de lecture pour l'affichage
    this.musicPlayerService.currentSong$.pipe(takeUntil(this.destroy$)).subscribe(song => {
      this.currentPlaySongId = song?.id || null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlaylist() {
    this.loading = true;
    this.errorMessage = '';

    this.playlistService.getPlaylistWithSongs(this.playlistId).subscribe({
      next: (playlist) => {
        this.playlist = playlist;
        const currentUser = this.authService.getCurrentUser();
        this.isOwner = currentUser ? currentUser.id === playlist.appUserId : false;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load playlist. Please try again.';
        this.loading = false;
      }
    });
  }

  // --- LOGIQUE DE LECTURE ---

  playSong(songInPlaylist: SongInPlaylist) {
    const allSongs = this.mapPlaylistSongsToSongs();
    const clickedIndex = this.playlist!.songs.findIndex(s => s.songId === songInPlaylist.songId);
    this.musicPlayerService.setQueue(allSongs, clickedIndex >= 0 ? clickedIndex : 0);
  }

  playAll() {
    if (!this.playlist || this.playlist.songs.length === 0) return;
    this.musicPlayerService.setQueue(this.mapPlaylistSongsToSongs(), 0);
  }

  private mapPlaylistSongsToSongs(): Song[] {
    return this.playlist!.songs.map(s => ({
      id: s.songId,
      title: s.title,
      artist: s.artist,
      songUrl: s.songUrl,
      imageUrl: s.imageUrl,
      createdAt: '',
      appUserId: 0,
      appUserName: ''
    }));
  }

  // --- RÉORDONNANCEMENT ---

  moveSongUp(event: Event, songInPlaylist: SongInPlaylist, currentIndex: number) {
    event.stopPropagation();
    if (currentIndex === 0) return;

    const newPosition = currentIndex; // Car les positions commencent à 1 en DB (index 0 -> pos 1)
    this.playlistService.reorderSongInPlaylist(this.playlistId, songInPlaylist.songId, newPosition).subscribe({
      next: (response) => {
        const songs = [...this.playlist!.songs];
        songs.splice(currentIndex, 1);
        songs.splice(currentIndex - 1, 0, songInPlaylist);
        this.playlist!.songs = songs;
        this.notificationService.success(response.message);
      }
    });
  }

  moveSongDown(event: Event, songInPlaylist: SongInPlaylist, currentIndex: number) {
    event.stopPropagation();
    if (currentIndex === this.playlist!.songs.length - 1) return;

    const newPosition = currentIndex + 2;
    this.playlistService.reorderSongInPlaylist(this.playlistId, songInPlaylist.songId, newPosition).subscribe({
      next: (response) => {
        const songs = [...this.playlist!.songs];
        songs.splice(currentIndex, 1);
        songs.splice(currentIndex + 1, 0, songInPlaylist);
        this.playlist!.songs = songs;
        this.notificationService.success(response.message);
      },
      error: () => {
        this.notificationService.error('Failed to reorder song. Please try again.');
      }
    });
  }

  onSongDrop(event: CdkDragDrop<SongInPlaylist[]>) {
    if (!this.isOwner) return;
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (previousIndex === currentIndex) return;

    const song = this.playlist!.songs[previousIndex];
    moveItemInArray(this.playlist!.songs, previousIndex, currentIndex);

    const newPosition = currentIndex + 1;

    this.playlistService.reorderSongInPlaylist(this.playlistId, song.songId, newPosition).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
      },
      error: () => {
        // Rollback en cas d'erreur
        moveItemInArray(this.playlist!.songs, currentIndex, previousIndex);
        this.notificationService.error('Failed to reorder song. Please try again.');
      }
    });
  }

  // --- SUPPRESSION ---

  removeSongFromPlaylist(event: Event, songInPlaylist: SongInPlaylist) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      data: {
        title: 'Remove Song',
        message: `Remove "${songInPlaylist.title}" from this playlist?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.playlistService.removeSongFromPlaylist(this.playlistId, songInPlaylist.songId).subscribe({
        next: (response) => {
          this.loadPlaylist();
          this.notificationService.success(response.message);
        },
        error: () => {
          this.notificationService.error('Failed to remove song from playlist. Please try again.');
        }
      });
    });
  }
  // --- GESTION DE LA PLAYLIST ---

  deletePlaylist() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      data: {
        title: 'Delete Playlist',
        message: `Are you sure you want to delete "${this.playlist?.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.playlistService.deletePlaylist(this.playlistId).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Failed to delete playlist. Please try again.';
          this.notificationService.error(errorMessage);
        }
      });
    });
  }

  togglePrivacy() {
    if (!this.playlist) return;
    
    const newPrivacy = !this.playlist.isPublic;

    this.playlistService.updatePlaylistPrivacy(this.playlistId, newPrivacy).subscribe({
      next: (updatedPlaylist) => {
        this.playlist!.isPublic = updatedPlaylist.isPublic;
        this.notificationService.success(`Playlist is now ${updatedPlaylist.isPublic ? 'public' : 'private'}`);
      },
      error: () => {
        this.notificationService.error('Failed to update privacy. Please try again.');
      }
    });
  }

  // --- UTILITAIRES ---

  goBack() {
    this.router.navigate(['/home']);
  }

  isCurrentlyPlaying(songId: number): boolean {
    // On compare l'ID de la chanson avec l'ID stocké dans le service de lecture
    return this.currentPlaySongId === songId;
  }
}