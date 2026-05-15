import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Song, AiSongData } from '../models/song.model';
import { PageResponse } from '../models/page-response.model';
import { MessageResponse } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class SongService {
  // On remet le /admin nécessaire pour ton vrai Backend
  private baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  getAllSongs(page: number = 0, size: number = 10, search?: string, userId?: number): Observable<PageResponse<Song>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    if (userId) {
      params = params.set('userId', userId.toString());
    }

    // On remet la route originale
    return this.http.get<PageResponse<Song>>(`${this.baseUrl}/getAllSongs`, { params });
  }

  addSong(formData: FormData): Observable<Song> {
    return this.http.post<Song>(`${this.baseUrl}/addSong`, formData);
  }

  updateSong(songId: number, formData: FormData): Observable<Song> {
    return this.http.put<Song>(`${this.baseUrl}/updateSong/${songId}`, formData);
  }

  deleteSong(songId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/deleteSong/${songId}`);
  }

  getSongAiInsights(songId: number): Observable<AiSongData> {
    // On remet la route correcte pour les insights IA
    return this.http.get<AiSongData>(`${environment.apiUrl}/song/getSongAiInsights/${songId}`);
  }
}