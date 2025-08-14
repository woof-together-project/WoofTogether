import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { NavigationService } from '../../shared/navigation/navigation.service';
import { TokenService } from '../../shared/auth/tokenService';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  static readonly insertUserToDBURL =
    'https://65uloxgkusbas32clh3zf4o2zm0dmxdv.lambda-url.us-east-1.on.aws/'; // insert user to DB lambda function URL

  constructor(
    private router: Router,
    private userContext: UserContextService,
    private navigationService: NavigationService,
    private tokenSvc: TokenService
  ) {}

  username: string | null = null;
  searchText: string = '';
  loading: boolean = true;
  isComplete: boolean = false;

  async ngOnInit() {
    //navigate to home when requested
    this.navigationService.homeRedirect$.subscribe(() => this.router.navigate(['/']));

    //Rehydrate tokens from storage so refresh doesn't log user out
    this.tokenSvc.loadFromStorage();

    //If we already have tokens, hydrate user (and silently refresh if needed)
    if (this.tokenSvc.getIdToken()) {
      if (this.tokenSvc.isExpired() && this.tokenSvc.getRefreshToken()) {
        await this.tokenSvc.refreshIfPossible();
      }
      this.hydrateFromIdToken(this.tokenSvc.getIdToken());
    }
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      try {
        const tokens = await this.exchangeCodeForTokens(code);
        if (tokens && tokens.id_token) {
          this.tokenSvc.setTokens(tokens);
          this.hydrateFromIdToken(tokens.id_token);
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.toString());
          await this.sendDataToBackendOnce();
        }
      } catch (error) {
        console.error('Error exchanging code for tokens:', error);
      }
    }

    this.loading = false;
  }

  async exchangeCodeForTokens(code: string) {
    const tokenUrl = `${environment.cognitoDomain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: environment.grantType, // 'authorization_code'
      client_id: environment.clientId,
      redirect_uri: environment.redirectUri,
      code
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

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to exchange code. Status: ${response.status} ${text}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error exchanging code:', error);
      throw error;
    }
  }

  redirectToLogin(): void {
    window.location.href = environment.loginUrl;
  }

  login(): void {
    this.redirectToLogin();
  }


  private hydrateFromIdToken(idToken: string | null) {
    if (!idToken) return;

    const userDetails = this.parseJwt(idToken);
    this.username = userDetails?.nickname ?? null;

    if (userDetails?.email && userDetails?.nickname && userDetails?.name && userDetails?.sub) {
      this.userContext.setUser(
        userDetails.email,
        userDetails.nickname,
        userDetails.name,
        userDetails.sub
      );
    } else {
      console.warn('Missing claims on id_token; cannot set full user context.', userDetails);
    }
  }

  parseJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }


  private async sendDataToBackendOnce() {
    const current = this.userContext.getCurrentUserValue();
    if (!current) return;

    const key = `userSynced:${current.sub}`;
    if (localStorage.getItem(key) === '1') return;

    await this.sendDataToBackend();
    localStorage.setItem(key, '1');
  }

  async sendDataToBackend() {
    const currentUser = this.userContext.getCurrentUserValue();
    const lambdaUrl = NavbarComponent.insertUserToDBURL;

    if (!currentUser) {
      console.error(
        'CRITICAL: User context is null or missing properties. Current User (from service):',
        currentUser
      );
      return;
    }

    const payload = {
      user: {
        name: currentUser.username,
        email: currentUser.email,
        nickname: currentUser.nickname,
        provider: 'COGNITO',
        providerId: currentUser.sub
      }
    };

    try {
      const response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        if (result.userExists === true) {
          this.userContext.setUserCompleteStatus(true);
          console.log('User already exists in the database.');
        } else {
          console.log('User created successfully.');
        }
      } else {
        console.error('Lambda responded with error:', result);
      }
    } catch (err) {
      console.error('Error sending request to Lambda:', err);
    }
  }

  handleProtectedRoute(event: Event, targetRoute: string): void {
    event.preventDefault();
    const currentUser = this.userContext.getCurrentUserValue();
    if (!(currentUser?.isComplete)) {
      alert('Please complete your sign up information to access this page.');
      this.router.navigate(['/signup']);
    } else {
      this.router.navigate([targetRoute]);
    }
  }

  redirectToHome() {
    this.router.navigate(['/']);
  }
}
