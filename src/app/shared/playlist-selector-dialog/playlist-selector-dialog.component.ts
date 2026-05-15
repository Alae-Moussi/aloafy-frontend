import { Component, OnInit, OnDestroy, Inject, ElementRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlaylistService } from '../../core/services/playlist-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { Playlist } from '../../core/models/playlist.model';

interface SongDialogData {
  song: {
    id: number;
    title: string;
    artist: string;    // Vérifie que cette ligne existe
    imageUrl: string;
  };
}

@Component({
  selector: 'app-playlist-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './playlist-selector-dialog.component.html',
  styleUrls: ['./playlist-selector-dialog.component.scss']
})
export class PlaylistSelectorDialogComponent implements OnInit, OnDestroy {
  playlists: Playlist[] = [];
  loading = true;
  loadingMorePlaylists = false;
  adding = false;
  errorMessage = '';
  selectedPlaylistId: number | null = null;

  currentPage = 0;
  pageSize = 10;
  hasMorePlaylists = true;

  private _scrollTriggerPlaylists!: ElementRef;
  private playlistObserver!: IntersectionObserver;

  @ViewChild('scrollTriggerPlaylists') set scrollTriggerPlaylists(el: ElementRef) {
    if (el) {
      this._scrollTriggerPlaylists = el;
      this.setupPlaylistInfiniteScroll();
    } else {
      this._scrollTriggerPlaylists = null!;
    }
  }

  constructor(
    private dialogRef: MatDialogRef<PlaylistSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SongDialogData,
    private playlistService: PlaylistService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  ngOnDestroy(): void {
    if (this.playlistObserver) {
      this.playlistObserver.disconnect();
    }
  }

  setupPlaylistInfiniteScroll() {
    if (this.playlistObserver) {
      this.playlistObserver.disconnect();
    }

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    this.playlistObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loadingMorePlaylists && this.hasMorePlaylists) {
          this.loadMorePlaylists();
        }
      });
    }, options);

    if (this._scrollTriggerPlaylists?.nativeElement) {
      this.playlistObserver.observe(this._scrollTriggerPlaylists.nativeElement);
    }
  }

  loadPlaylists() {
    this.currentPage = 0;
    this.playlists = [];
    this.loading = true;
    this.errorMessage = '';

    this.playlistService.getMyPlaylists(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.playlists = response.content;
        this.hasMorePlaylists = !response.last;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load playlists. Please try again.';
        this.notificationService.error('Failed to load playlists. Please try again.');
        this.playlists = [];
        this.loading = false;
      }
    });
  }

  loadMorePlaylists() {
    if (this.loadingMorePlaylists || !this.hasMorePlaylists) return;

    this.loadingMorePlaylists = true;
    this.currentPage++;

    this.playlistService.getMyPlaylists(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.playlists = [...this.playlists, ...response.content];
        this.hasMorePlaylists = !response.last;
        this.loadingMorePlaylists = false;
      },
      error: () => {
        this.loadingMorePlaylists = false;
        this.currentPage--;
      }
    });
  }

  addToPlaylist(playlist: Playlist) {
    if (this.adding) return;

    this.adding = true;
    this.errorMessage = '';
    this.selectedPlaylistId = playlist.id;

    this.playlistService.addSongToPlaylist(playlist.id, this.data.song.id).subscribe({
      next: (response) => {
        this.adding = false;
        const message = response.message || `Added to "${playlist.name}"`;
        this.notificationService.success(message);
        this.dialogRef.close({ success: true, playlistName: playlist.name });
      },
      error: (error) => {
        const errorMsg = error.error?.message || `Failed to add to "${playlist.name}". The song may already be in this playlist`;
        this.errorMessage = errorMsg;
        this.notificationService.error(errorMsg);
        this.adding = false;
        this.selectedPlaylistId = null;
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }
}