import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Song } from '../../core/models/song.model';
import { SongService } from '../../core/services/song-service.service';
import { MusicPlayerService } from '../../core/services/music-player-service.service';
import { AuthServiceService } from '../../core/services/auth-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { PlaylistSelectorDialogComponent } from '../../shared/playlist-selector-dialog/playlist-selector-dialog.component';

@Component({
  selector: 'app-my-uploads',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './my-uploads.component.html',
  styleUrls: ['./my-uploads.component.scss']
})
export class MyUploadsComponent implements OnInit, OnDestroy {
  songs: Song[] = [];
  loading = false;
  loadingMore = false;
  errorMessage = '';
  userId!: number;
  searchQuery = '';
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  hasMoreSongs = true;

  private _scrollTrigger!: ElementRef;
  private observer!: IntersectionObserver;

  @ViewChild('scrollTrigger') set scrollTrigger(el: ElementRef) {
    if (el) {
      this._scrollTrigger = el;
      this.setupPlaylistInfiniteScroll();
    }
  }

  constructor(
    private songService: SongService,
    private musicPlayerService: MusicPlayerService,
    private authService: AuthServiceService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
      this.loadMySongs();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
  }

  setupPlaylistInfiniteScroll() {
    if (this.observer) this.observer.disconnect();
    const options = { root: null, rootMargin: '200px', threshold: 0.1 };
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loadingMore && this.hasMoreSongs) {
        this.loadMoreSongs();
      }
    }, options);
    if (this._scrollTrigger?.nativeElement) {
      this.observer.observe(this._scrollTrigger.nativeElement);
    }
  }

  loadMySongs() {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 0;

    // On utilise getAllSongs avec le userId pour filtrer tes propres musiques
    this.songService.getAllSongs(this.currentPage, this.pageSize, this.searchQuery, this.userId).subscribe({
      next: (response) => {
        this.songs = response.content;
        this.totalElements = response.totalElements;
        this.hasMoreSongs = this.songs.length < this.totalElements;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load songs.';
        this.loading = false;
      }
    });
  }

  loadMoreSongs() {
    if (this.loadingMore || !this.hasMoreSongs) return;
    this.loadingMore = true;
    this.currentPage++;

    this.songService.getAllSongs(this.currentPage, this.pageSize, this.searchQuery, this.userId).subscribe({
      next: (response) => {
        this.songs = [...this.songs, ...response.content];
        this.hasMoreSongs = this.songs.length < response.totalElements;
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
        this.currentPage--;
      }
    });
  }

  deleteSong(event: Event, song: Song) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '450px',
      data: {
        title: 'Delete Song',
        message: `Are you sure you want to delete "${song.title}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.songService.deleteSong(song.id!).subscribe({
          next: (res) => {
            this.songs = this.songs.filter(s => s.id !== song.id);
            this.notificationService.success(res.message);
          },
          error: () => this.notificationService.error('Failed to delete song.')
        });
      }
    });
  }

  // Ajoute cette méthode pour pouvoir cliquer sur une musique et la jouer !
  playSong(song: Song) {
    // On ne passe que la chanson, sans la liste, pour respecter la signature de ta méthode
    this.musicPlayerService.playSong(song);
  }

  onSearch() {
    this.loadMySongs();
  }
  clearSearch() {
    this.searchQuery = '';
    this.loadMySongs();

  }
  openAddToPlaylistDialog(event: Event, song: Song){
    event.stopPropagation();
    this.dialog.open(PlaylistSelectorDialogComponent,{
      width:'450px',
      maxWidth:'90vw',
      panelClass: 'custom-dialog-container',
      data:{ song }

    });
  }
  editSong(event: Event,song:Song){
    event.stopImmediatePropagation();
  }

}
