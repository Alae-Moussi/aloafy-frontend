import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SongService } from '../../core/services/song-service.service';
import { MusicPlayerService } from '../../core/services/music-player-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { Song } from '../../core/models/song.model';
import { MatDialog } from '@angular/material/dialog';
import { AuthImagePipe } from '../../core/pipes/auth-image.pipe'; 
import { PlaylistSelectorDialogComponent } from '../../shared/playlist-selector-dialog/playlist-selector-dialog.component';

@Component({
  selector: 'app-search',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AuthImagePipe

  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  songs: Song[] = [];
  loading = false;
  loadingMore = false;
  errorMessage = '';
  currentPlayingSongId: number | null = null;
  hasSearched = false;

  private destroy$ = new Subject<void>();

  searchQuery = '';
  currentPage = 0;
  pageSize = 20;
  hasMoreSongs = true;


  @ViewChild('searchInput') searchInput!: ElementRef;

  private _scrollTrigger!: ElementRef;
  private observer!: IntersectionObserver;

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

    private musicPlayerService: MusicPlayerService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.musicPlayerService.currentSong$.pipe(takeUntil(this.destroy$)).subscribe(song => {
      this.currentPlayingSongId = song?.id || null;
    });
  }
  ngAfterViewInit(): void {
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupInfiniteScroll() {
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.loadingMore && this.hasMoreSongs && this.hasSearched) {
        this.loadMoreSongs();
      }
    }, { rootMargin: '200px', threshold: 0.1 });

    if (this._scrollTrigger?.nativeElement) {
      this.observer.observe(this._scrollTrigger.nativeElement);
    }
  }
  onSearch() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 0;
    this.songs = [];
    this.hasSearched = true;

    this.songService.getAllSongs(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response) => {
        this.songs = response.content || [];
        this.hasMoreSongs = !response.last;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to search songs. Please try again.';
        this.loading = false;
        console.error(error);
      }
    });
  }
  loadMoreSongs() {
    if (this.loadingMore || !this.hasMoreSongs || !this.hasSearched ) return;
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
  clearSearch() {
    this.searchQuery = '';
    this.songs = [];
    this.hasSearched = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
    this.searchInput?.nativeElement?.focus();
  }

  playSong(song: Song) {
    const clickedIndex = this.songs.findIndex(s => s.id === song.id);
    this.musicPlayerService.setQueue(this.songs, clickedIndex >= 0 ? clickedIndex : 0);
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
}
