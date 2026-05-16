import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth-service.service';
import { PlaylistService } from '../../core/services/playlist-service.service';
import { MusicPlayerService } from '../../core/services/music-player-service.service'; 
import { Playlist } from '../../core/models/playlist.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MusicPlayer } from "../music-player/music-player.component";
import { ExpandedPlayer } from '../expanded-player/expanded-player.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormsModule,
    MusicPlayer,
    ExpandedPlayer
],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: '0',
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1',
        overflow: 'visible'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class LayoutComponent implements OnInit, OnDestroy {
  // --- ÉTAT UI ---
  userName = 'User';
  //isAdmin = false;
  isAdmin = true;
  isUserMenuExpanded = false;

  // --- GESTION DES PLAYLISTS ---
  private _playlists: Playlist[] = [];
  playlistSearchQuery = '';
  currentPage = 0;
  pageSize = 10;
  hasMorePlaylists = true;
  loadingMorePlaylists = false;

  // --- INFINITE SCROLL ---
  private playlistObserver!: IntersectionObserver;
  private _scrollTriggerPlaylists!: ElementRef;

  @ViewChild('scrollTriggerPlaylists') set scrollTriggerPlaylists(el: ElementRef) {
    if (el) {
      this._scrollTriggerPlaylists = el;
      this.setupPlaylistInfiniteScroll();
    }
  }

  constructor(
    public router: Router,
    public location: Location,
    private authService: AuthService,
    private playlistService: PlaylistService,
    private musicPlayerService: MusicPlayerService
  ) {}

  ngOnInit(): void {
    // 1. Suivre l'utilisateur
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.name!; 
        this.isAdmin = user.role === 'ADMIN';
      }
      console.log(this.isAdmin);
    });

    // 2. Charger les données initiales
    this.loadPlaylists();

    // 3. Rafraîchir si une playlist est créée/modifiée
    this.playlistService.playlistUpdated$.subscribe(() => {
      this.loadPlaylists();
    });
  }

  ngOnDestroy(): void {
    if (this.playlistObserver) {
      this.playlistObserver.disconnect();
    }
  }

  get playlists(): Playlist[] {
    return Array.isArray(this._playlists) ? this._playlists : [];
  }

  // --- LOGIQUE API ---

  loadPlaylists(): void {
    this.currentPage = 0;
    this._playlists = [];
    this.loadingMorePlaylists = true;

    this.playlistService.getMyPlaylists(this.currentPage, this.pageSize, this.playlistSearchQuery)
      .subscribe({
        next: (response) => {
          this._playlists = response.content;
          this.hasMorePlaylists = !response.last;
          this.loadingMorePlaylists = false;
        },
        error: () => {
          this._playlists = [];
          this.loadingMorePlaylists = false;
        }
      });
  }

  loadMorePlaylists(): void {
    if (this.loadingMorePlaylists || !this.hasMorePlaylists) return;

    this.loadingMorePlaylists = true;
    this.currentPage++;

    this.playlistService.getMyPlaylists(this.currentPage, this.pageSize, this.playlistSearchQuery)
      .subscribe({
        next: (response) => {
          this._playlists = [...this._playlists, ...response.content];
          this.hasMorePlaylists = !response.last;
          this.loadingMorePlaylists = false;
        },
        error: () => {
          this.loadingMorePlaylists = false;
          this.currentPage--; // Annule l'incrémentation en cas d'échec
        }
      });
  }

  // --- UTILS ---

  setupPlaylistInfiniteScroll(): void {
    if (this.playlistObserver) this.playlistObserver.disconnect();

    this.playlistObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loadingMorePlaylists && this.hasMorePlaylists) {
        this.loadMorePlaylists();
      }
    }, { rootMargin: '100px', threshold: 0.1 });

    if (this._scrollTriggerPlaylists?.nativeElement) {
      this.playlistObserver.observe(this._scrollTriggerPlaylists.nativeElement);
    }
  }

  // --- NAVIGATION & ACTIONS ---

  onSearchPlaylists(): void {
    this.loadPlaylists();
  }

  clearPlaylistSearch(): void {
    this.playlistSearchQuery = '';
    this.loadPlaylists();
  }

  goBack(): void {
    this.location.back();
  }

  goForward(): void {
    this.location.forward();
  }

  toggleUserMenu(): void {
    this.isUserMenuExpanded = !this.isUserMenuExpanded;
  }

  logout(): void {
    this.musicPlayerService.stop();
    this.authService.logout();
  }
}