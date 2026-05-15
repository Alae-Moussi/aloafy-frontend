import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MusicPlayerService, RepeatMode } from '../../core/services/music-player-service.service';
import { Song } from '../../core/models/song.model';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common'; // Pour le *ngIf
import { MatButtonModule } from '@angular/material/button'; // Pour mat-icon-button
import { MatIconModule } from '@angular/material/icon'; // Pour

@Component({
  selector: 'app-music-player',
  standalone: true, 
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.scss']
})
export class MusicPlayer implements OnInit, OnDestroy {
  // --- ÉTATS ---
  currentSong: Song | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  isMuted = false;
  previousVolume = 1;
  hasNext = false;
  hasPrevious = false;
  isShuffle = false;
  repeatMode: RepeatMode = 'off';

  protected subscriptions: Subscription[] = [];

  constructor(protected musicPlayerService: MusicPlayerService) {}

  ngOnInit(): void {
    // --- ABONNEMENTS AUX OBSERVABLES DU SERVICE ---
    this.subscriptions.push(
      this.musicPlayerService.currentSong$.subscribe(song => {
        this.currentSong = song;
      }),
      this.musicPlayerService.isPlaying$.subscribe(playing => {
        this.isPlaying = playing;
      }),
      this.musicPlayerService.currentTime$.subscribe(time => {
        this.currentTime = time;
      }),
      this.musicPlayerService.duration$.subscribe(duration => {
        this.duration = duration;
      }),
      this.musicPlayerService.volume$.subscribe(volume => {
        this.volume = volume;
      }),
      this.musicPlayerService.isShuffle$.subscribe(shuffle => {
        this.isShuffle = shuffle;
      }),
      this.musicPlayerService.repeatMode$.subscribe(mode => {
        this.repeatMode = mode;
        this.updateNavigationState();
      }),
      this.musicPlayerService.queue$.subscribe(() => {
        this.updateNavigationState();
      }),
      this.musicPlayerService.currentIndex$.subscribe(() => {
        this.updateNavigationState();
      })
    );
  }

  ngOnDestroy(): void {
    // Nettoyage pour éviter les fuites de mémoire
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateNavigationState(): void {
    this.hasNext = this.musicPlayerService.hasNext();
    this.hasPrevious = this.musicPlayerService.hasPrevious();
  }

  // --- ACTIONS DE LECTURE ---
  togglePlayPause() {
    this.musicPlayerService.togglePlayPause();
  }

  skipNext() {
    this.musicPlayerService.playNext();
  }

  skipPrevious() {
    this.musicPlayerService.playPrevious();
  }

  // --- GESTION DE LA PROGRESSION (SEEKING) ---
  onSeek(event: any) {
    const time = parseFloat(event.target.value);
    this.musicPlayerService.seekTo(time);
  }

  onProgressClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // On ignore si on clique directement sur le curseur de l'input
    if (target.tagName.toLowerCase() === 'input') return;

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const time = percentage * this.duration;

    if (time >= 0 && time <= this.duration) {
      this.musicPlayerService.seekTo(time);
    }
  }

  // --- GESTION DU VOLUME ---
  onVolumeChange(event: any) {
    const volume = parseFloat(event.target.value);
    this.musicPlayerService.setVolume(volume);
    this.isMuted = volume === 0;
    if (volume > 0) this.previousVolume = volume;
  }

  onVolumeClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input') return;

    const volumeBar = event.currentTarget as HTMLElement;
    const rect = volumeBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));

    this.musicPlayerService.setVolume(percentage);
    this.isMuted = percentage === 0;
    if (percentage > 0) this.previousVolume = percentage;
  }

  toggleMute() {
    if (this.isMuted || this.volume === 0) {
      const volumeToRestore = this.previousVolume > 0 ? this.previousVolume : 0.5;
      this.musicPlayerService.setVolume(volumeToRestore);
      this.isMuted = false;
    } else {
      this.previousVolume = this.volume;
      this.musicPlayerService.setVolume(0);
      this.isMuted = true;
    }
  }

  // --- MODES ---
  toggleShuffle() {
    this.musicPlayerService.toggleShuffle();
  }

  toggleRepeat() {
    this.musicPlayerService.toggleRepeat();
  }

  expandPlayer() {
    if (this.currentSong) {
      this.musicPlayerService.toggleExpanded();
    }
  }

  // --- HELPERS D'AFFICHAGE ---
  getRepeatIcon(): string {
    return this.repeatMode === 'one' ? 'repeat_one' : 'repeat';
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get progress(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  get volumePercentage(): number {
    return this.volume * 100;
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return 'default-album.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.apiUrl}/file/image/${imageUrl}`;
  }
}