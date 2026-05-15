import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NotificationService} from './core/services/notification-service.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Ajoute withInterceptors ici
import { authInterceptor } from './core/interceptors/auth.interceptor'; // Importe ton intercepteur

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    
    // Configuration du client HTTP avec ton intercepteur de sécurité
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    
    NotificationService
  ]
};