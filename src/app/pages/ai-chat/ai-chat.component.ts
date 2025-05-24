import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent implements OnInit{
  userInput: string = '';
  messages: { role: string, content: string }[] = [];
  sub: string | null = null;
  nickname: string | null = null;

  constructor(private http: HttpClient, private userContext: UserContextService) {}

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage = { role: 'user', content: this.userInput };
    this.messages.push(userMessage);

    const body: any = { user_prompt: this.userInput };

    if (this.sub) {
      body.sub = this.sub;
    }

    this.userInput = '';

    this.http.post<any>('https://fgqmlufb663hbl2gzc77fvfa6a0szvmz.lambda-url.us-east-1.on.aws/', body).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.response });
      },
      error: (err) => {
        console.error('POST error:', err);
        this.messages.push({ role: 'assistant', content: 'Something went wrong.' });
      }
    });
  }

  ngOnInit() {
    this.userContext.getUserObservable().subscribe(currentUser => {
      this.nickname = currentUser?.nickname ?? null;
      this.sub = currentUser?.sub ?? null;

      if (this.sub) {
        this.http.get<any>(`https://fgqmlufb663hbl2gzc77fvfa6a0szvmz.lambda-url.us-east-1.on.aws/?sub=${this.sub}`)
          .subscribe({
            next: (res) => {
              this.messages = Array.isArray(res.messages) ? res.messages : [];
            },
            error: (err) => {
              if (err.status !== 404 && err.status !== 204 && err.status !== 200) {
                this.messages.push({
                  role: 'assistant',
                  content: 'Something went wrong while loading chat history 🐾',
                });
              }
            }
          });
      }
    });
  }
}
