import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private router: Router) {}
  username: string | null = null;
  searchText: string = '';
  loading: boolean = true;

  async ngOnInit() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
  
      if (code) {
        try {
            const tokens = await this.exchangeCodeForTokens(code);
            if (tokens && tokens.id_token) {
              const userDetails = this.parseJwt(tokens.id_token);
              this.username = userDetails.nickname;
            }
          }
            catch (error) {
              console.error('Error exchanging code for tokens:', error);
            }
        }
    }
  
    async exchangeCodeForTokens(code: string) {
      const tokenUrl = `${environment.cognitoDomain}/oauth2/token`;
      const body = new URLSearchParams({
          grant_type: environment.grantType,
          client_id: environment.clientId,
          redirect_uri: environment.redirectUri,
          code: code
      });
      try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${environment.clientId}:${environment.clientSecret}`)
            },
            body
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error(`Failed to exchange code for tokens. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error exchanging code:', error);
        throw error;
    }
    }
  
  
    redirectToLogin(): void {
     window.location.href = environment.loginUrl;
    }
  
    login() : void {
      this.redirectToLogin();
    }
  
     parseJwt(token: string): any {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }
}
