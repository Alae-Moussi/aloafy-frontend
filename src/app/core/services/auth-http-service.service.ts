import { Injectable } from '@angular/core';
import { AuthServiceService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthHttpService {

  constructor(private authService: AuthServiceService) { }

  /**
   * Récupère un fichier (Blob) de manière sécurisée
   */
  fetchBlob(url: string): Promise<Blob> {
    return this.makeRequest(url, false);
  }

  private makeRequest(url: string, isRetry: boolean): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      
      // Headers de sécurité standards
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      const token = this.authService.getAccessToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } 
        // Si le token est expiré (401) ou accès refusé (403)
        else if ((xhr.status === 401 || xhr.status === 403) && !isRetry) {
          this.authService.refreshAccessTokenAsync()
            .then(() => {
              // On retente la requête une seule fois avec le nouveau token
              this.makeRequest(url, true).then(resolve).catch(reject);
            })
            .catch(() => {
              reject(new Error('Authentication failed after retry'));
            });
        } 
        else {
          reject(new Error(`Request failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred'));
      };

      xhr.send();
    });
  }
}