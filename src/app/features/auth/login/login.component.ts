import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// Services
import { AuthService } from '../../../core/services/auth-service.service';
import { NotificationService } from '../../../core/services/notification-service.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

type AuthView = 'login' | 'forgotPassword' | 'signUp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule, 
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  signUpForm!: FormGroup;

  currentView: AuthView = 'login';
  hidePassword = true;
  returnUrl = '/home';

  loginLoading = false;
  loginError = '';

  forgotPasswordLoading = false;
  forgotPasswordSuccess = '';
  forgotPasswordError = '';

  signUpLoading = false;
  signUpSuccess = '';
  signUpError = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    this.initForms();

    const savedView = localStorage.getItem('authViewState') as AuthView;
    if (savedView && ['login', 'forgotPassword', 'signUp'].includes(savedView)) {
      this.currentView = savedView;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  private initForms(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.signUpForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Navigation entre les vues
  showLoginView() {
    this.currentView = 'login';
    this.clearAllMessages();
    localStorage.removeItem('authViewState');
  }

  showSignUpView() {
    this.currentView = 'signUp';
    this.clearAllMessages();
    localStorage.setItem('authViewState', 'signUp');
    const loginEmail = this.loginForm.get('email')?.value;
    if (loginEmail) {
      this.signUpForm.patchValue({ email: loginEmail });
    }
  }

  showForgotPasswordView() {
    this.currentView = 'forgotPassword';
    this.clearAllMessages();
    localStorage.setItem('authViewState', 'forgotPassword');
    const loginEmail = this.loginForm.get('email')?.value;
    if (loginEmail) {
      this.forgotPasswordForm.patchValue({ email: loginEmail });
    }
  }

  // Soumission des formulaires
  onLoginSubmit() {
    if (this.loginForm.invalid) return;
    this.loginLoading = true;
    this.loginError = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loginLoading = false;
        this.notificationService.success('Welcome back!');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loginLoading = false;
        this.loginError = this.getErrorMessage(err, 'Invalid email or password');
        this.notificationService.error(this.loginError);
      }
    });
  }

  onSignUpSubmit() {
    if (this.signUpForm.invalid) return;
    this.signUpLoading = true;
    this.signUpError = '';
    this.signUpSuccess = '';

    const { email, name } = this.signUpForm.value;

    this.authService.signUp({ email, name }).subscribe({
      next: (response) => {
        this.signUpLoading = false;
        this.signUpSuccess = response.message;
        this.notificationService.success(response.message);
        setTimeout(() => this.showLoginView(), 3000);
      },
      error: (error) => {
        this.signUpLoading = false;
        this.signUpError = this.getErrorMessage(error, 'Failed to create account.');
        this.notificationService.error(this.signUpError);
      }
    });
  }

  onForgotPasswordSubmit() {
    if (this.forgotPasswordForm.invalid) return;
    this.forgotPasswordLoading = true;
    this.clearAllMessages();

    this.authService.forgotPassword(this.forgotPasswordForm.value.email).subscribe({
      next: (res) => {
        this.forgotPasswordLoading = false;
        this.forgotPasswordSuccess = res.message;
        this.notificationService.success(res.message);
        setTimeout(() => this.showLoginView(), 3000);
      },
      error: (err) => {
        this.forgotPasswordLoading = false;
        this.forgotPasswordError = this.getErrorMessage(err, 'Error sending email');
        this.notificationService.error(this.forgotPasswordError);
      }
    });
  }

  // Getters pour le HTML
  get isLoginView(): boolean { return this.currentView === 'login'; }
  get isForgotPasswordView(): boolean { return this.currentView === 'forgotPassword'; }
  get isSignUpView(): boolean { return this.currentView === 'signUp'; }

  get pageTitle(): string {
    switch (this.currentView) {
      case 'forgotPassword': return 'Reset Password';
      case 'signUp': return 'Sign Up for Aloafy';
      default: return 'Log in to Aloafy';
    }
  }

  private clearAllMessages(): void {
    this.loginError = '';
    this.forgotPasswordSuccess = '';
    this.forgotPasswordError = '';
    this.signUpSuccess = '';
    this.signUpError = '';
  }

  private getErrorMessage(error: any, defaultMessage: string): string {
    if (error.status === 0) return 'Unable to connect to server.';
    return error.error?.message || defaultMessage;
  }
}