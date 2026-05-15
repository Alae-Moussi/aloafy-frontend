import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

import { tap } from 'rxjs/operators';
import { PageResponse, MessageResponse } from '../models/user.models';
import { Playlist, PlaylistWithSongs } from '../models/playlist.model';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private baseUrl = `${environment.apiUrl}/playlist`;
  
  // Subject pour notifier quand une playlist est ajoutée ou modifiée
  private playlistUpdatedSubject = new Subject<void>();
  playlistUpdated$ = this.playlistUpdatedSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Récupère les playlists de l'utilisateur avec pagination et recherche
   */
  getMyPlaylists(page: number = 0, size: number = 10, search?: string): Observable<PageResponse<Playlist>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'id,desc'); // Les plus récentes en premier

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponse<Playlist>>(`${this.baseUrl}/getMyPlaylists`, { params });
  }
createPlaylist(name: string, description: string | null, isPublic: boolean, imageFile: File | null): Observable<Playlist> {
    let params = new HttpParams()
      .set('name', name)
      .set('isPublic', isPublic.toString());

    if (description) {
      params = params.set('description', description);
    }

    const formData = new FormData();
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    return this.http.post<Playlist>(`${this.baseUrl}/createPlaylist`, formData, { params }).pipe(
      tap(() => this.playlistUpdatedSubject.next())
    );
  }
  addSongToPlaylist(playlistId: number, songId: number): Observable<MessageResponse> {
    const params = new HttpParams().set('songId', songId.toString());
    return this.http.post<MessageResponse>(`${this.baseUrl}/addSongToPlaylist/${playlistId}`, null, { params });
  }

  // 1. Récupérer une playlist avec ses chansons
  getPlaylistWithSongs(id: number): Observable<PlaylistWithSongs> {
    return this.http.get<PlaylistWithSongs>(`${this.baseUrl}/getPlaylistWithSongs/${id}`);
  }

  // 2. Changer l'ordre d'une chanson dans la playlist
  reorderSongInPlaylist(playlistId: number, songId: number, newPosition: number): Observable<MessageResponse> {
    const params = new HttpParams()
      .set('songId', songId.toString())
      .set('newPosition', newPosition.toString());
    
    return this.http.patch<MessageResponse>(`${this.baseUrl}/reorderSongInPlaylist/${playlistId}`, null, { params });
  }

  // 3. Supprimer une chanson d'une playlist spécifique
  removeSongFromPlaylist(playlistId: number, songId: number): Observable<MessageResponse> {
    const params = new HttpParams()
      .set('songId', songId.toString());
      
    return this.http.delete<MessageResponse>(`${this.baseUrl}/removeSongFromPlaylist/${playlistId}`, { params });
  }

  // 4. Supprimer complètement une playlist
  deletePlaylist(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/deletePlaylist/${id}`).pipe(
      tap(() => this.playlistUpdatedSubject.next())
    );
  }

  // 5. Mettre à jour la confidentialité (Public/Privé)
  updatePlaylistPrivacy(id: number, isPublic: boolean): Observable<Playlist> {
    const params = new HttpParams().set('isPublic', isPublic.toString());
    
    return this.http.patch<Playlist>(`${this.baseUrl}/updatePlaylistPrivacy/${id}`, null, { params }).pipe(
      tap(() => this.playlistUpdatedSubject.next())
    );
  }
  getAllPublicPlaylists(page: number = 0, size: number = 10, search?: string): Observable<PageResponse<Playlist>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'id,desc');

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponse<Playlist>>(`${this.baseUrl}/getAllPublicPlaylists`, { params });
  }
}