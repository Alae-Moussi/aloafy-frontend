import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AloafyService } from '../../core/services/aloafy.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent {
  private aloafyService = inject(AloafyService);

  isOpen = false;
  message = '';
  messages: {text: string, isUser: boolean}[] = [];
  loading = false;

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.messages.push({
        text: "Bonjour ! Je suis Aloafy 🎵 Comment tu te sens aujourd'hui ?",
        isUser: false
      });
    }
  }

  send() {
    if (!this.message.trim() || this.loading) return;
    this.messages.push({text: this.message, isUser: true});
    const userMsg = this.message;
    this.message = '';
    this.loading = true;

    this.aloafyService.chat(userMsg).subscribe({
      next: (res) => {
        this.messages.push({text: res.response, isUser: false});
        this.loading = false;
      },
      error: () => {
        this.messages.push({text: "Désolé, je ne peux pas répondre maintenant.", isUser: false});
        this.loading = false;
      }
    });
  }

  onEnter(event: any) {
    if (event.key === 'Enter') this.send();
  }
}