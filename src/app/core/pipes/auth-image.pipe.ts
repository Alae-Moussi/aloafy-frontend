import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthHttpService } from '../services/auth-http-service.service';

@Pipe({
  name: 'authImage',
  pure: false,
  standalone: true
})
export class AuthImagePipe implements PipeTransform, OnDestroy {
  private cachedUrl: string | null = null;
  private cachedSafeUrl: SafeUrl | null = null;
  private blobUrl: string | null = null;
  private loading = false;

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private authHttpService: AuthHttpService
  ) {}

  transform(url: string): SafeUrl | string {
    // 1. Si l'URL est vide, on retourne l'image par défaut
    if (!url) {
      return 'default-album.png';
    }

    // 2. Si on est déjà en train de charger cette URL, on rend le cache ou le défaut
    if (this.loading && url === this.cachedUrl) {
      return this.cachedSafeUrl || 'default-album.png';
    }

    // 3. Si l'URL a déjà été traitée, on rend le cache
    if (url === this.cachedUrl && this.cachedSafeUrl) {
      return this.cachedSafeUrl;
    }

    // 4. Si c'est une URL externe (ex: Google Photos) qui n'a pas besoin de notre API
    if (url.startsWith('http') && !url.includes('/api/file')) {
      return url;
    }

    // --- Logique de chargement ---
    this.cachedUrl = url;
    this.loading = true;

    // Nettoyage de l'ancien Blob pour libérer la mémoire vive
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }

    this.authHttpService.fetchBlob(url)
      .then(blob => {
        this.blobUrl = URL.createObjectURL(blob);
        this.cachedSafeUrl = this.sanitizer.bypassSecurityTrustUrl(this.blobUrl);
        this.loading = false;
        // On prévient Angular que l'image est prête (Marquer pour vérification)
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.loading = false;
        this.cachedSafeUrl = null;
        this.cdr.markForCheck();
      });

    // En attendant que le 'then' arrive, on affiche le défaut
    return this.cachedSafeUrl || 'default-album.png';
  }

  ngOnDestroy(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
  }
}