import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User, UpdateUserProfileRequest } from '../../core/models/user.models';
@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './edit-profile-dialog.component.html',
  styleUrls: ['./edit-profile-dialog.component.scss']
})
export class EditProfileDialogComponent implements OnInit {
  editForm!: FormGroup;
  hideOldPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  showPasswordSection = false;

  private readonly passwordFields = ['oldPassword', 'newPassword', 'confirmPassword'] as const;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    // Initialisation du formulaire avec le validateur personnalisé pour la correspondance des mots de passe
    this.editForm = this.formBuilder.group({
      name: [this.data.user?.name || '', [Validators.required, Validators.minLength(2)]],
      oldPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });

    // Relance la validation du groupe dès que l'un des champs de mot de passe change
    this.editForm.get('newPassword')?.valueChanges.subscribe(() => this.triggerFormValidation());
    this.editForm.get('confirmPassword')?.valueChanges.subscribe(() => this.triggerFormValidation());
  }

  private triggerFormValidation() {
    this.editForm.updateValueAndValidity({ emitEvent: false });
  }

  // --- VALIDATEUR PERSONNALISÉ ---
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // --- GESTION DE LA SECTION MOT DE PASSE ---
  togglePasswordSection() {
    this.showPasswordSection = !this.showPasswordSection;

    if (this.showPasswordSection) {
      this.setPasswordValidators();
    } else {
      this.clearPasswordFields();
    }
  }

  private setPasswordValidators() {
    this.editForm.get('oldPassword')?.setValidators([Validators.required]);
    this.editForm.get('newPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.editForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.updatePasswordFieldsValidity();
  }

  private clearPasswordFields() {
    this.passwordFields.forEach(field => {
      const control = this.editForm.get(field)!;
      control.clearValidators();
      control.setValue('');
      control.updateValueAndValidity();
    });
  }

  private updatePasswordFieldsValidity() {
    this.passwordFields.forEach(field => {
      this.editForm.get(field)!.updateValueAndValidity();
    });
  }

  // --- SAUVEGARDE ET ANNULATION ---
  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.editForm.markAllAsTouched();
    
    if (this.editForm.invalid) {
      return;
    }

    const updateRequest = this.buildUpdateRequest();
    
    // Si aucune modification n'a été faite, on ferme simplement le dialogue
    if (!this.hasChange(updateRequest)) {
      this.dialogRef.close();
      return;
    }

    this.dialogRef.close(updateRequest);
  }

  // --- CONSTRUIRE LA REQUÊTE ---
  private buildUpdateRequest(): UpdateUserProfileRequest {
    const request: UpdateUserProfileRequest = {};

    const name = this.editForm.get('name')?.value?.trim();
    if (name && name !== this.data.user.name) {
      request.name = name;
    }

    const oldPassword = this.editForm.get('oldPassword')?.value;
    const newPassword = this.editForm.get('newPassword')?.value;

    if (this.showPasswordSection && oldPassword && newPassword) {
      request.oldPassword = oldPassword;
      request.password = newPassword;
    }

    return request;
  }

  private hasChange(request: UpdateUserProfileRequest): boolean {
    return Object.keys(request).length > 0;
  }
}