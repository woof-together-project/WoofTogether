import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { NavigationService } from '../../shared/navigation/navigation.service';
import { TokenService } from '../../shared/auth/tokenService';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,MatIconModule, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  static readonly insertUserToDBURL =
    'https://n2wr2kxcun27zuws7zpkk5ujfy0btspl.lambda-url.us-east-1.on.aws/'; //final user
    
    // static readonly insertUserToDBURL =
    // 'https://og3trfcczul4fjn5hsachnn7ma0lijfq.lambda-url.us-east-1.on.aws/'; 

  constructor(
    private router: Router,
    private userContext: UserContextService,
    private navigationService: NavigationService,
    private tokenSvc: TokenService,
  ) {}

  username: string | null = null;
  searchText: string = '';
  loading = true;
  isComplete = false;

  async ngOnInit() {
  this.navigationService.homeRedirect$.subscribe(() => this.router.navigate(['/']));
  this.userContext.getUserObservable().subscribe(u => {
    this.username   = u?.nickname ?? null;
    this.isComplete = !!u?.isComplete;
  });
  this.tokenSvc.loadFromStorage();

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state');

  let returnTo = '/';
  try {
    if (rawState) {
      const obj = JSON.parse(atob(rawState));
      returnTo = obj.returnTo || '/';
    }
  } catch {}

  if (code) {
    try {
      const tokens = await this.exchangeCodeForTokens(code);
      if (tokens?.id_token) {
        this.tokenSvc.setTokens(tokens);
        this.hydrateFromIdToken(tokens.id_token);   

        try {
          const status = await this.getUserStatus(); 
          this.userContext.setUserCompleteStatus(status.isComplete);
          this.isComplete = status.isComplete;

          const shouldGoToSignup = !status.userExists || !status.isComplete;
          await this.router.navigate([shouldGoToSignup ? '/signup' : (returnTo || '/')]);
        } catch (e) {
          console.warn('getUserStatus function failed on callback; keeping local flag.', e);
        }

        // Clean URL once
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (err) {
      console.error('Error exchanging code for tokens:', err);
    }
    this.loading = false;
    return; 
  }

  const tokenStatus = this.tokenSvc.getStatus?.() ?? (this.tokenSvc.isExpired() ? 'EXPIRED' : 'VALID');
  console.log('Token status on boot:', tokenStatus);

  if (tokenStatus === 'VALID') {
    const idToken = this.tokenSvc.getIdToken();
    if (idToken) {
      this.hydrateFromIdToken(idToken);          
      try {
        const backend = await this.getUserStatus(); 
        this.userContext.setUserCompleteStatus(backend.isComplete);
        this.isComplete = backend.isComplete;
      } catch (e) {
        console.warn('getUserStatus function failed on boot; keeping local flag.', e);
      }
    } else {
      this.username = null;
      console.warn('VALID status but missing idToken; not setting user.');
    }
  } else {
    this.username = null;
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
      window.location.href = this.buildHostedUiUrl(this.router.url || '/');

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
        // if (result.userExists === true) {
        //   this.userContext.setUserCompleteStatus(true);
        //   console.log('User already exists in the database.');
        // } else {
        //   console.log('User created successfully.');
        // }
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



  logout(): void {
    this.localSignOut();
    //const logoutUrl = this.buildCognitoLogoutUrl();
    // window.location.href = logoutUrl;
    this.router.navigate(['/']);
  }

  private localSignOut(): void {
    this.tokenSvc.clear();

    const sub = this.userContext.getCurrentUserValue?.()?.sub;
    if (sub) localStorage.removeItem(`userSynced:${sub}`);
    this.userContext.clearUser?.();
    this.username = null;
  }

private buildCognitoLogoutUrl(): string {
  const domain = environment.cognitoDomain.replace(/\/+$/, '');
  const clientId = encodeURIComponent(environment.clientId);
  const logoutUri = encodeURIComponent(environment.signOutRedirectUri || environment.redirectUri);
  return `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
}

  private buildHostedUiUrl(returnTo = '/'): string {
  const domain = environment.cognitoDomain.replace(/\/+$/, '');
  const clientId = encodeURIComponent(environment.clientId);
  const redirectUri = encodeURIComponent(environment.redirectUri);
  const scope = encodeURIComponent('openid email profile');
  const state = encodeURIComponent(btoa(JSON.stringify({ returnTo })));

  return `${domain}/login?client_id=${clientId}` +
         `&redirect_uri=${redirectUri}` +
         `&response_type=code&scope=${scope}&state=${state}`;
  }

private async getUserStatus(): Promise<{ userExists: boolean; isComplete: boolean }> {
  const currentUser = this.userContext.getCurrentUserValue();
  if (!currentUser) return { userExists: false, isComplete: false };

  const payload = {
    user: {
      name: currentUser.username,
      email: currentUser.email,
      nickname: currentUser.nickname,
      provider: 'COGNITO',
      providerId: currentUser.sub
    }
  };
  console.log('[Auth] getUserStatus payload:', payload);

  const res = await fetch(NavbarComponent.insertUserToDBURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  console.log('[Auth] getUserStatus response:', data);
  return { userExists: !!data.userExists, isComplete: !!data.isComplete };
}

private buildHostedUiLoginUrl(returnTo: string = '/'): string {
  const domain = environment.cognitoDomain.replace(/\/+$/, '');
  const clientId = encodeURIComponent(environment.clientId);
  const redirectUri = encodeURIComponent(environment.redirectUri);
  const scope = encodeURIComponent('openid email profile');
  const state = encodeURIComponent(btoa(JSON.stringify({ returnTo })));
  return `${domain}/login?client_id=${clientId}`
       + `&redirect_uri=${redirectUri}`
       + `&response_type=code&scope=${scope}&state=${state}`;
}


goToLogin(returnTo: string = '/'): void {
  window.location.href = this.buildHostedUiLoginUrl(returnTo);
}

}

