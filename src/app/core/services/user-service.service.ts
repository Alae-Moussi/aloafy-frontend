import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment'; // Vérifie le chemin de ton environnement
import { User, UpdateUserProfileRequest } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
private baseUrl = `${environment.apiUrl}/appUser`;

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/getUserProfile`).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  updateUserProfile(request: UpdateUserProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/updateUserProfile`, request).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }
}
