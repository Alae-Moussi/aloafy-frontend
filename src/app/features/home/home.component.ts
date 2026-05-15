import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { SongService } from '../../core/services/song-service.service';
import { PlaylistService } from '../../core/services/playlist-service.service';
import { MusicPlayerService } from '../../core/services/music-player-service.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification-service.service';
import { Song } from '../../core/models/song.model';
import { Playlist, PlaylistWithSongs } from '../../core/models/playlist.model';
import { MatDialog } from '@angular/material/dialog'; // Ajouté
import { PlaylistSelectorDialogComponent } from '../../shared/playlist-selector-dialog/playlist-selector-dialog.component'; 
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthImagePipe } from '../../core/pipes/auth-image.pipe'; // vérifiez le chemin


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AuthImagePipe,
    
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  songs: Song[] = [];
  playlists: Playlist[] = [];
  loading = true;
  errorMessage = '';
  currentPlayingSongId: number | null = null;

  private typingInterval: any = null;
  private destroy$ = new Subject<void>();

  searchQuery = '';
  playlistSearchQuery = '';

  loadingMore = false;
  currentPage = 0;
  pageSize = 10;
  hasMoreSongs = true;

  playlistsExpanded = true;
  loadingMorePlaylists = false;
  currentPlaylistPage = 0;
  playlistPageSize = 10;
  hasMorePlaylists = true;

  private _scrollTriggerPlaylists!: ElementRef;
  private playlistObserver!: IntersectionObserver;

  private _scrollTrigger!: ElementRef;
  private Observer!: IntersectionObserver;

  @ViewChild('scrollTriggerPlaylists') set scrollTriggerPlaylists(el: ElementRef) {
    if (el) {
      this._scrollTriggerPlaylists = el;
      this.setupPlaylistInfiniteScroll();
    } else {
      this._scrollTriggerPlaylists = null!;
    }
  }

  @ViewChild('scrollTrigger') set scrollTrigger(el: ElementRef) {
    if (el) {
      this._scrollTrigger = el;
      this.setupInfiniteScroll();
    } else {
      this._scrollTrigger = null!;
    }
  }

  constructor(
    private songService: SongService,
    private playlistService: PlaylistService,
    private musicPlayerService: MusicPlayerService,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog // Injecté ici
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.musicPlayerService.currentSong$.pipe(takeUntil(this.destroy$)).subscribe(song => {
      this.currentPlayingSongId = song?.id || null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.Observer) this.Observer.disconnect();
    if (this.playlistObserver) this.playlistObserver.disconnect();
    if (this.typingInterval) clearTimeout(this.typingInterval);
  }

  async loadData() {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 0;
    this.currentPlaylistPage = 0;
    this.songs = [];
    this.playlists = [];
    this.hasMoreSongs = true;
    this.hasMorePlaylists = true;

    try {
      const [songsResponse, playlistsResponse] = await Promise.all([
        firstValueFrom(this.songService.getAllSongs(this.currentPage, this.pageSize, this.searchQuery)),
        firstValueFrom(this.playlistService.getAllPublicPlaylists(this.currentPlaylistPage, this.playlistPageSize, this.playlistSearchQuery))
      ]);

      this.songs = songsResponse.content;
      this.hasMoreSongs = !songsResponse.last;

      this.playlists = playlistsResponse.content;
      this.hasMorePlaylists = !playlistsResponse.last;

      this.loading = false;
      this.cdr.detectChanges();
      this.startTypingEffect();
    } catch (error) {
      this.errorMessage = 'Failed to load content. Please try again later.';
      this.songs = [];
      this.playlists = [];
      this.loading = false;
    }
  }

  setupPlaylistInfiniteScroll() {
    if (this.playlistObserver) this.playlistObserver.disconnect();
    this.playlistObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.loadingMorePlaylists && this.hasMorePlaylists) {
        this.loadMorePlaylists();
      }
    }, { rootMargin: '200px', threshold: 0.1 });

    if (this._scrollTriggerPlaylists?.nativeElement) {
      this.playlistObserver.observe(this._scrollTriggerPlaylists.nativeElement);
    }
  }

  setupInfiniteScroll() {
    if (this.Observer) this.Observer.disconnect();
    this.Observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.loadingMore && this.hasMoreSongs) {
        this.loadMoreSongs();
      }
    }, { rootMargin: '200px', threshold: 0.1 });

    if (this._scrollTrigger?.nativeElement) {
      this.Observer.observe(this._scrollTrigger.nativeElement);
    }
  }

  loadMorePlaylists() {
    if (this.loadingMorePlaylists || !this.hasMorePlaylists) return;
    this.loadingMorePlaylists = true;
    this.currentPlaylistPage++;

    this.playlistService.getAllPublicPlaylists(this.currentPlaylistPage, this.playlistPageSize, this.playlistSearchQuery).subscribe({
      next: (response) => {
        this.playlists = [...this.playlists, ...response.content];
        this.hasMorePlaylists = !response.last;
        this.loadingMorePlaylists = false;
      },
      error: () => {
        this.loadingMorePlaylists = false;
        this.currentPlaylistPage--;
        this.notificationService.error('Failed to load more playlists. Please try again.');
      }
    });
  }

  loadMoreSongs() {
    if (this.loadingMore || !this.hasMoreSongs) return;
    this.loadingMore = true;
    this.currentPage++;

    this.songService.getAllSongs(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response) => {
        this.songs = [...this.songs, ...response.content];
        this.hasMoreSongs = !response.last;
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
        this.currentPage--;
        this.notificationService.error('Failed to load more songs. Please try again.');
      }
    });
  }

  onSearch() {
    this.loadData();
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
  }

  onSearchPlaylists() {
    this.loadData();
  }

  clearPlaylistSearch() {
    this.playlistSearchQuery = '';
    this.onSearchPlaylists();
  }

  playSong(song: Song) {
    const clickedIndex = this.songs.findIndex(s => s.id === song.id);
    this.musicPlayerService.setQueue(this.songs, clickedIndex >= 0 ? clickedIndex : 0);
  }

  openPlaylist(playlist: Playlist) {
    this.router.navigate(['/playlist', playlist.id]);
  }

  playPlaylist(event: Event, playlist: Playlist) {
    event.stopPropagation();
    this.playlistService.getPlaylistWithSongs(playlist.id).subscribe({
      next: (playlistWithSongs: PlaylistWithSongs) => {
        if (playlistWithSongs.songs && playlistWithSongs.songs.length > 0) {
          const songs: Song[] = playlistWithSongs.songs.map(s => ({
            id: s.songId,
            title: s.title,
            artist: s.artist,
            songUrl: s.songUrl,
            imageUrl: s.imageUrl,
            createdAt: '',
            appUserId: 0,
            appUserName: ''
          }));

          this.musicPlayerService.setQueue(songs, 0);
          this.router.navigate(['/playlist', playlist.id]);
        } else {
          this.notificationService.warning('This playlist is empty');
        }
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Failed to load playlist songs. Please try again.';
        this.notificationService.error(errorMessage);
      }
    });
  }

  private startTypingEffect() {
    if (this.typingInterval) clearTimeout(this.typingInterval);
    const text = 'Musify';
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;

    let charIndex = 0;
    const type = () => {
      if (charIndex <= text.length) {
        typingElement.innerHTML = text.substring(0, charIndex) + '<span class="typing-cursor">|</span>';
        charIndex++;
        this.typingInterval = setTimeout(type, 200);
      }
    };
    type();
  }

  openAddToPlaylistDialog(event: Event, song: Song) {
    event.stopPropagation();
    this.dialog.open(PlaylistSelectorDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      data: { song }
    });
  }

  isCurrentlyPlaying(songId: number): boolean {
    return this.currentPlayingSongId === songId;
  }

  togglePlaylists() {
    this.playlistsExpanded = !this.playlistsExpanded;
  }
}