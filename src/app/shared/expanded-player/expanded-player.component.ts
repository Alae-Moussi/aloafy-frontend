import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MusicPlayer } from '../music-player/music-player.component';
import { MusicPlayerService } from '../../core/services/music-player-service.service';
import { SongService } from '../../core/services/song-service.service';
import { Song, AiSongData } from '../../core/models/song.model';
import { CommonModule } from '@angular/common';
import { AuthImagePipe } from '../../core/pipes/auth-image.pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-expanded-player',
  standalone: true,
  imports: [
    CommonModule,
    AuthImagePipe,
    MatIconModule
  ],
  templateUrl: './expanded-player.component.html',
  styleUrl: './expanded-player.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ExpandedPlayer extends MusicPlayer implements OnInit, OnDestroy {
  @ViewChild('expandedPlayerContainer') expandedPlayerContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('aiPanel') aiPanel!: ElementRef<HTMLDivElement>;

  // --- Propriétés d'état ---
  queue: Song[] = [];
  currentIndex = 0;
  isExpanded = false;
  showAiPanel = false;
  isAiPanelActive = false;
  aiPanelTop = 0;
  aiSongData: AiSongData | null = null;
  aiError: string | null = null;
  loadingAiData = false;
  currentLoadingStep = 0;
  showFlyingParticles = false;

  // --- Visualisation Audio ---
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  audioLevel = 0;

  constructor(
    musicPlayerService: MusicPlayerService,
    private songService: SongService
  ) {
    super(musicPlayerService);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.subscriptions.push(
      this.musicPlayerService.isPlaying$.subscribe(playing => {
        if (playing) {
          this.startAudioVisualization();
        } else {
          this.stopAudioVisualization();
        }
      }),
      this.musicPlayerService.queue$.subscribe(queue => this.queue = queue),
      this.musicPlayerService.currentIndex$.subscribe(index => this.currentIndex = index),
      this.musicPlayerService.isExpanded$.subscribe(expanded => this.isExpanded = expanded)
    );
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopAudioVisualization();
    if (this.audioContext) {
      this.audioContext.close();
    }
    document.documentElement.style.setProperty('--audio-level', '0');
  }

  // --- Actions de navigation et contrôle (Résout image_767463.png) ---

  playPrevious() {
    this.musicPlayerService.playPrevious();
  }

  playNext() {
    this.musicPlayerService.playNext();
  }

  onProgressChange(event: any) {
    const value = event.target.value;
    this.musicPlayerService.seekTo(value);
  }

  override toggleShuffle() {
    this.musicPlayerService.toggleShuffle();
  }

  override toggleRepeat() {
    this.musicPlayerService.toggleRepeat();
  }

  collapse() {
    this.musicPlayerService.toggleExpanded();
  }

  playFromQueue(index: number) {
    this.musicPlayerService.setQueue(this.queue, index);
  }

  // --- Logique IA ---

  toggleAiPanel() {
    if (!this.showAiPanel) {
      if (this.expandedPlayerContainer?.nativeElement) {
        this.aiPanelTop = this.expandedPlayerContainer.nativeElement.scrollTop;
      }
      this.isAiPanelActive = true;
      this.showFlyingParticles = true;

      setTimeout(() => {
        this.showAiPanel = true;
        if (this.currentSong) {
          this.loadAiInsights();
        }
      }, 400);

      setTimeout(() => this.showFlyingParticles = false, 3000);
    } else {
      this.showAiPanel = false;
      this.isAiPanelActive = false;
    }
  }

  loadAiInsights() {
    if (!this.currentSong) return;
    this.loadingAiData = true;
    this.aiError = null;
    this.aiSongData = null;
    this.currentLoadingStep = 0;

    setTimeout(() => this.currentLoadingStep = 1, 2000);
    setTimeout(() => this.currentLoadingStep = 2, 4000);

    setTimeout(() => {
      this.songService.getSongAiInsights(this.currentSong!.id).subscribe({
        next: (data) => {
          this.aiSongData = data;
          this.loadingAiData = false;
          this.currentLoadingStep = 0;
        },
        error: (err) => {
          console.error('Error loading AI insights:', err);
          this.aiError = 'Failed to load AI insights. Please try again.';
          this.loadingAiData = false;
          this.currentLoadingStep = 0;
        }
      });
    }, 6000);
  }

  // --- Visualisation Audio ---

  private startAudioVisualization() {
    try {
      const audioElement = (this.musicPlayerService as any).audio;
      if (!audioElement) return;

      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        const source = this.audioContext.createMediaElementSource(audioElement);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
      }
      this.visualize();
    } catch (error) {
      console.error('Error starting audio visualization:', error);
    }
  }

  private stopAudioVisualization() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.audioLevel = 0;
    document.documentElement.style.setProperty('--audio-level', '0');
  }

  private visualize() {
    const analyser = this.analyser as AnalyserNode;
    const dataArray = this.dataArray as Uint8Array<ArrayBuffer>;

    if (!analyser || !dataArray) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.visualize());
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    const average = sum / dataArray.length;
    this.audioLevel = average / 255;

    document.documentElement.style.setProperty('--audio-level', this.audioLevel.toString());
  }
}