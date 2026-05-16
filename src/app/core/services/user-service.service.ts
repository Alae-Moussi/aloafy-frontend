import { Injectable } from '@angular/core';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment'; // Vérifie le chemin de ton environnement
import { User, UpdateUserProfileRequest, PageResponse } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  private baseUrl = `${environment.apiUrl}/appUser`;

  constructor(private http: HttpClient) { }

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
  getAllUsers(page: number, size: number): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<User>>(`${this.baseUrl}/getAllUsers`, { params });
  }

  updateUserRole(userId: number, role: 'USER' | 'ADMIN'): Observable<User> {
    const params = new HttpParams().set('role', role);
    return this.http.patch<User>(`${this.baseUrl}/updateUserRole/${userId}`, null, { params });
  }
}
