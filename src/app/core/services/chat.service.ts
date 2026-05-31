import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // L'adresse locale de ton serveur Spring Boot
  private apiUrl = 'http://localhost:8080/api/chat'; 

  constructor(private http: HttpClient) { }

  // Cette méthode va être appelée par ton bouton "Try Again"
  getAIInsights(prompt: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, { prompt });
  }
}