import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../core/services/user-service.service';
import { AuthService } from '../../core/services/auth-service.service';
import { NotificationService } from '../../core/services/notification-service.service';
import { User } from '../../core/models/user.models';

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,

  ],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.scss'
})
export class AllUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = true;
  loadingMore = false;
  errorMessage = '';
  currentUserId: number | null = null;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  hasMoreUsers = true;

  private _scrollTrigger!: ElementRef;
  private observer!: IntersectionObserver;


  @ViewChild('scrollTrigger') set scrollTrigger(el: ElementRef) {
    if (el) {
      this._scrollTrigger = el;
      this.setupInfiniteScroll();
    } else {
      this._scrollTrigger = null!;
    }
  }

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {

    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;

    this.loadUsers();
  }


  ngOnDestroy(): void {

    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupInfiniteScroll() {
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.loadingMore && this.hasMoreUsers) {
        this.loadMoreUsers();
      }
    }, { rootMargin: '200px', threshold: 0.1 });

    if (this._scrollTrigger?.nativeElement) {
      this.observer.observe(this._scrollTrigger.nativeElement);
    }
  }
  loadUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 0;
    this.users = [];


    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.users = response.content || [];
        this.hasMoreUsers = !response.last;
        this.loading = false;
        this.totalElements = response.totalElements;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users. Please try again.';
        this.loading = false;
        console.error(error);
      }
    });
  }
  loadMoreUsers() {
    if (this.loadingMore || !this.hasMoreUsers) return;
    this.loadingMore = true;
    this.currentPage++;

    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.users = [...this.users, ...response.content];
        this.hasMoreUsers = !response.last;
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
        this.currentPage--;
        this.notificationService.error('Failed to load more users. Please try again.');
      }
    });
  }

  updateUserRole(user: User, newRole: 'USER' | 'ADMIN') {
    if (user.role === newRole) return;


    this.userService.updateUserRole(user.id!, newRole).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.notificationService.success(`User role updated to ${newRole}`);
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Failed to update user role. Please try again.';
        this.notificationService.error(errorMessage);
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    return role === 'ADMIN' ? 'role-badge-admin' : 'role-badge-user';
  }

  isCurrentUser(user: User): boolean {
    return user.id === this.currentUserId;
  }

}