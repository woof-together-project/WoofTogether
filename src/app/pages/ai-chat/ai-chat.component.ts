import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent {
  userInput: string = '';
  messages: { role: string, content: string }[] = [];

  constructor(private http: HttpClient) {}

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage = { role: 'user', content: this.userInput };
    this.messages.push(userMessage);

    const body = {
      user_id: '1',
      user_prompt: this.userInput
    };

    this.userInput = '';

    this.http.post<any>('https://f6r6ezku4ruhpstp5hi4vvodeq0spzlg.lambda-url.us-east-1.on.aws/', body).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.response });
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Something went wrong.' });
      }
    });
  }
}
