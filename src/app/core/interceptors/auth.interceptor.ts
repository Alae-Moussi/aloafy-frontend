import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthServiceService } from '../services/auth-service.service';
import { catchError, switchMap, throwError } from 'rxjs';

// Liste des endpoints qui ne nécessitent pas de token
const PUBLIC_ENDPOINTS = [
  '/loginUser',
  '/registerUser',
  '/forgotPassword',
  '/refreshAccessToken'
];

const isPublicEndPoint = (url: string): boolean => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

const addToken = (req: HttpRequest<any>, token: string): HttpRequest<any> => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    // On considère expiré 5 secondes avant la fin réelle pour être sûr
    return Date.now() >= (exp - 5000);
  } catch {
    return true;
  }
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthServiceService);

  // 1. Si c'est un endpoint public, on laisse passer sans rien toucher
  if (isPublicEndPoint(req.url)) {
    return next(req);
  }

  const token = authService.getAccessToken();

  // 2. Si on n'a pas de token, on continue normalement (le Guard s'occupera du reste)
  if (!token) {
    return next(req);
  }

  // 3. Si le token est expiré, on le rafraîchit AVANT d'envoyer la requête
  if (isTokenExpired(token)) {
    return authService.refreshAccessToken().pipe(
      switchMap(response => {
        return next(addToken(req, response.accessToken!));
      }),
      catchError(error => throwError(() => error))
    );
  }

  // 4. Si le token est valide, on l'ajoute et on gère les erreurs 401/403 imprévues
  return next(addToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403 || error.status === 0) {
        return authService.refreshAccessToken().pipe(
          switchMap(response => {
            return next(addToken(req, response.accessToken!));
          }),
          catchError(refreshError => throwError(() => refreshError))
        );
      }
      return throwError(() => error);
    })
  );
};