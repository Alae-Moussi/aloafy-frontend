import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // On vérifie si l'utilisateur est connecté ET s'il est admin
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      return true;
    }

    // Sinon, on le redirige vers l'accueil
    this.router.navigate(['/home']);
    return false;
  }
}