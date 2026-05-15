import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, firstValueFrom } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { 
  AuthResponse, 
  LoginRequest, 
  MessageResponse, 
  SignUpRequest, 
  User 
} from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private baseUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isRefreshing = false;
  private refreshResult$ = new BehaviorSubject<{ success: boolean; token?: string } | null>(null);

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  /**
   * Version asynchrone demandée par ton service HTTP/Intercepteur
   * Résout l'erreur TS2551
   */
  refreshAccessTokenAsync(): Promise<AuthResponse> {
    return firstValueFrom(this.refreshAccessToken());
  }

  refreshAccessToken(): Observable<AuthResponse> {
    if (this.isRefreshing) {
      return this.refreshResult$.pipe(
        filter(result => result !== null),
        take(1),
        switchMap(result => {
          if (result!.success && result!.token) {
            return of({ accessToken: result!.token } as AuthResponse);
          }
          return throwError(() => new Error('Token refresh failed'));
        })
      );
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    this.isRefreshing = true;
    this.refreshResult$.next(null);

    return this.http.post<AuthResponse>(`${this.baseUrl}/refreshAccessToken`, { refreshToken }).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('accessToken', response.accessToken!);
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken!);
          }
        }
        this.isRefreshing = false;
        this.refreshResult$.next({ success: true, token: response.accessToken! });
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.refreshResult$.next({ success: false });
        this.logout();
        return throwError(() => error);
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): 'USER' | 'ADMIN' | null {
    const user = this.getCurrentUser();
    return user ? (user.role as 'USER' | 'ADMIN') : null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  private getUserFromStorage(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? JSON.parse(userJson) : null;
    }
    return null;
  }
//hay
  getAccessToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;
  }

  getRefreshToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('refreshToken') : null;
  }

  isLoggedIn(): boolean {
    //return !!this.getAccessToken();
    return true ;
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgotPassword`, { email });
  }

  signUp(request: SignUpRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/registerUser`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/loginUser`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId) && response.accessToken && response.refreshToken) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      const user: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}