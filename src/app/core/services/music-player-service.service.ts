import { inject, Injectable, OnDestroy } from '@angular/core';
import { AuthHttpService } from './auth-http-service.service';
import { BehaviorSubject } from 'rxjs';
import { Song } from '../models/song.model';

export type RepeatMode = 'off' | 'all' | 'one';

@Injectable({
  providedIn: 'root',
})
export class MusicPlayerService implements OnDestroy {
  private authHttpService = inject(AuthHttpService);
  private audio: HTMLAudioElement;

  // --- ÉTATS INTERNES (SUBJECTS) ---
  private currentSongSubject = new BehaviorSubject<Song | null>(null);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);
  private volumeSubject = new BehaviorSubject<number>(1);
  private currentBlobUrl: string | null = null;

  private queueSubject = new BehaviorSubject<Song[]>([]);
  private currentIndexSubject = new BehaviorSubject<number>(-1);
  private isShuffleSubject = new BehaviorSubject<boolean>(false);
  private repeatModeSubject = new BehaviorSubject<RepeatMode>('off');
  private isExpandedSubject = new BehaviorSubject<boolean>(false);
  private originalQueue: Song[] = [];

  // --- OBSERVABLES PUBLICS ---
  public currentSong$ = this.currentSongSubject.asObservable();
  public isPlaying$ = this.isPlayingSubject.asObservable();
  public currentTime$ = this.currentTimeSubject.asObservable();
  public duration$ = this.durationSubject.asObservable();
  public volume$ = this.volumeSubject.asObservable();
  public queue$ = this.queueSubject.asObservable();
  public currentIndex$ = this.currentIndexSubject.asObservable();
  public isShuffle$ = this.isShuffleSubject.asObservable();
  public repeatMode$ = this.repeatModeSubject.asObservable();
  public isExpanded$ = this.isExpandedSubject.asObservable();

  constructor() {
    this.audio = new Audio();
    this.audio.volume = 1;
    this.audio.preload = 'metadata';

    this.initAudioListeners();
  }

  private initAudioListeners(): void {
    this.audio.addEventListener('timeupdate', () => {
      this.currentTimeSubject.next(this.audio.currentTime);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.durationSubject.next(this.audio.duration);
    });

    this.audio.addEventListener('ended', () => {
      this.isPlayingSubject.next(false);
      this.handleSongEnd();
    });

    this.audio.addEventListener('play', () => this.isPlayingSubject.next(true));
    this.audio.addEventListener('pause', () => this.isPlayingSubject.next(false));
  }

  // --- MÉTHODES DE LECTURE ---

  async playSong(song: Song, updateQueue: boolean = true): Promise<void> {
    const isSameSong = this.currentSongSubject.value?.id === song.id;

    if (isSameSong && !this.audio.paused) {
      this.pause();
    } else if (isSameSong && this.audio.paused) {
      this.play();
    } else {
      this.currentSongSubject.next(song);

      if (updateQueue) {
        const queue = this.queueSubject.value;
        const indexInQueue = queue.findIndex(s => s.id === song.id);
        if (indexInQueue >= 0) {
          this.currentIndexSubject.next(indexInQueue);
        } else {
          this.queueSubject.next([song]);
          this.currentIndexSubject.next(0);
        }
      }

      try {
        await this.loadAudioFromUrl(song.songUrl);
        this.play();
      } catch (error) {
        console.error('Error loading audio:', error);
        this.stop();
      }
    }
  }

  private async loadAudioFromUrl(url: string): Promise<void> {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    const blob = await this.authHttpService.fetchBlob(url);
    this.currentBlobUrl = URL.createObjectURL(blob);
    this.audio.src = this.currentBlobUrl;

    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        this.audio.removeEventListener('canplay', onCanPlay);
        this.audio.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        this.audio.removeEventListener('canplay', onCanPlay);
        this.audio.removeEventListener('error', onError);
        reject();
      };
      this.audio.addEventListener('canplay', onCanPlay);
      this.audio.addEventListener('error', onError);
      this.audio.load();
    });
  }

  // --- CONTRÔLES ---

  play(): void {
    if (this.audio.src) {
      this.audio.play().catch(err => console.error('Play error:', err));
    }
  }

  pause(): void {
    this.audio.pause();
  }

  togglePlayPause(): void {
    this.audio.paused ? this.play() : this.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentSongSubject.next(null);
    this.isPlayingSubject.next(false);
    this.currentTimeSubject.next(0);
    this.durationSubject.next(0);
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    this.audio.src = '';
  }

  seekTo(time: number): void {
    this.audio.currentTime = time;
  }

  setVolume(volume: number): void {
    this.audio.volume = volume;
    this.volumeSubject.next(volume);
  }

  // --- NAVIGATION ---

  setQueue(songs: Song[], startIndex: number = 0): void {
    this.queueSubject.next(songs);
    this.currentIndexSubject.next(startIndex);
    if (songs.length > 0) {
      this.playSong(songs[startIndex], false);
    }
  }

  playNext(): void {
    const queue = this.queueSubject.value;
    const index = this.currentIndexSubject.value;
    if (queue.length > 0 && index < queue.length - 1) {
      const nextIndex = index + 1;
      this.currentIndexSubject.next(nextIndex);
      this.playSong(queue[nextIndex], false);
    } else if (this.repeatModeSubject.value === 'all' && queue.length > 0) {
      this.currentIndexSubject.next(0);
      this.playSong(queue[0], false);
    }
  }

  playPrevious(): void {
    const queue = this.queueSubject.value;
    const index = this.currentIndexSubject.value;
    if (queue.length > 0 && index > 0) {
      const prevIndex = index - 1;
      this.currentIndexSubject.next(prevIndex);
      this.playSong(queue[prevIndex], false);
    }
  }

  handleSongEnd(): void {
    const mode = this.repeatModeSubject.value;
    if (mode === 'one') {
      this.seekTo(0);
      this.play();
    } else {
      this.playNext();
    }
  }

  // --- MÉTHODES DE VÉRIFICATION (POUR LE COMPOSANT) ---

  hasNext(): boolean {
    const queue = this.queueSubject.value;
    const index = this.currentIndexSubject.value;
    const mode = this.repeatModeSubject.value;
    if (mode === 'all' && queue.length > 0) return true;
    return queue.length > 0 && index < queue.length - 1;
  }

  hasPrevious(): boolean {
    const queue = this.queueSubject.value;
    const index = this.currentIndexSubject.value;
    return queue.length > 0 && index > 0;
  }

  // --- SHUFFLE & REPEAT ---

  toggleShuffle(): void {
    const isShuffle = !this.isShuffleSubject.value;
    this.isShuffleSubject.next(isShuffle);
    const queue = this.queueSubject.value;
    const current = this.currentSongSubject.value;

    if (isShuffle) {
      this.originalQueue = [...queue];
      const shuffled = this.shuffleArray([...queue], current);
      this.queueSubject.next(shuffled);
      this.currentIndexSubject.next(0);
    } else if (this.originalQueue.length > 0) {
      const index = this.originalQueue.findIndex(s => s.id === current?.id);
      this.queueSubject.next([...this.originalQueue]);
      this.currentIndexSubject.next(index >= 0 ? index : 0);
      this.originalQueue = [];
    }
  }

  private shuffleArray(array: Song[], current: Song | null): Song[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    if (current) {
      const idx = array.findIndex(s => s.id === current.id);
      if (idx > 0) {
        const [song] = array.splice(idx, 1);
        array.unshift(song);
      }
    }
    return array;
  }

  toggleRepeat(): void {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(this.repeatModeSubject.value);
    const nextIdx = (currentIdx + 1) % modes.length;
    this.repeatModeSubject.next(modes[nextIdx]);
  }

  // --- EXPANSION ---

  toggleExpanded(): void {
    this.isExpandedSubject.next(!this.isExpandedSubject.value);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}