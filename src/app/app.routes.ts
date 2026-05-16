import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard'; // Import de ton nouveau Guard
import { UploadSongComponent } from './features/upload-song/upload-song.component';
import { MyUploadsComponent } from './features/my-uploads/my-uploads.component';
import { CreatePlaylist } from './features/create-playlist/create-playlist.component';
import { PlaylistDetailComponent } from './features/playlist-detail/playlist-detail.component';
import { SearchComponent } from './features/search/search.component';

export const routes: Routes = [
  // 1. Redirection par défaut vers le login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // 2. Route publique pour la connexion
  { path: 'login', component: LoginComponent },

  // 3. Routes protégées utilisant le Layout (Sidebar + Navbar)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { 
        path: 'upload-song', 
        component: UploadSongComponent, 
        //canActivate: [AdminGuard] // Seul l'admin peut uploader !
      },
      { 
        path: 'my-uploads', 
        component: MyUploadsComponent, 
        //canActivate: [AdminGuard] // Seul l'admin peut uploader !
      },
      { 
        path: 'create-playlist', 
        component: CreatePlaylist, 

      },
       { 
        path: 'playlist/:id', 
        component: PlaylistDetailComponent, 
        //canActivate: [AdminGuard] // Seul l'admin peut uploader !
      },
      { 
        path: 'search', 
        component: SearchComponent, 
        //canActivate: [AdminGuard] // Seul l'admin peut uploader !
      }
    ]
  },

  // 4. Redirection pour les URLs inconnues
  { path: '**', redirectTo: '/login' }
];