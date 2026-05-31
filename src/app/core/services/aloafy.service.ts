import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const ALOAFY_URL = 'https://alaemoussi-aloafy-api.hf.space';

@Injectable({
  providedIn: 'root'
})
export class AloafyService {

  constructor(private http: HttpClient) {}

  getSongs(mood?: string, limit: number = 20, skip: number = 0): Observable<any> {
    let url = `${ALOAFY_URL}/songs/?limit=${limit}&skip=${skip}`;
    if (mood) url += `&mood=${mood}`;
    return this.http.get<any>(url);
  }

  getMoods(): Observable<any> {
    return this.http.get<any>(`${ALOAFY_URL}/songs/moods`);
  }

  getRandomSong(mood?: string): Observable<any> {
    let url = `${ALOAFY_URL}/songs/random`;
    if (mood) url += `?mood=${mood}`;
    return this.http.get<any>(url);
  }

  chat(message: string, userId: number = 1): Observable<any> {
    return this.http.post<any>(`${ALOAFY_URL}/chat/`, {
      user_id: userId,
      message: message
    });
  }

  recommend(mood: string): Observable<any> {
    return this.http.post<any>(`${ALOAFY_URL}/recommend/`, {
      mood: mood
    });
  }
}