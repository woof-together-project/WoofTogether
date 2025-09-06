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

    this.http.post<any>('https://njh75xi63rgzweic7ywnlyx2f40htjgw.lambda-url.us-east-1.on.aws/', body).subscribe({
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

      // Only fetch chat history ONCE when sub is ready
      if (this.sub && this.messages.length === 0) {
        this.http.get<any>(`https://njh75xi63rgzweic7ywnlyx2f40htjgw.lambda-url.us-east-1.on.aws/?sub=${this.sub}`).subscribe({
          next: (res) => {
            this.messages = Array.isArray(res.messages) ? res.messages : [];
          },
          error: (err) => {
            if (![200, 204, 404].includes(err.status)) {
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


  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

}
