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

type Intent = 'login' | 'signup';
type UserStatus = { userExists: boolean; isComplete: boolean };

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,MatIconModule, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  static readonly insertUserToDBURL =
    'https://65uloxgkusbas32clh3zf4o2zm0dmxdv.lambda-url.us-east-1.on.aws/'; // insert user to DB lambda

  constructor(
    private router: Router,
    private userContext: UserContextService,
    private navigationService: NavigationService,
    private tokenSvc: TokenService
  ) {}

  username: string | null = null;
  searchText: string = '';
  loading = true;
  isComplete = false;

  async ngOnInit() {
  this.navigationService.homeRedirect$.subscribe(() => this.router.navigate(['/']));

  // 1) Load tokens from storage (whatever your TokenService does)
  this.tokenSvc.loadFromStorage();

  // 2) OAuth callback handling (has ?code=...)
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
        // Persist tokens, then set user from ID token
        this.tokenSvc.setTokens(tokens);
        this.hydrateFromIdToken(tokens.id_token);   // <-- does NOTHING if id_token is falsy

        // ✅ Get truth from backend and store it (NO defaulting to false)
        try {
          const status = await this.getUserStatus(); // { userExists, isComplete }
          this.userContext.setUserCompleteStatus(status.isComplete);

          const shouldGoToSignup = !status.userExists || !status.isComplete;
          await this.router.navigate([shouldGoToSignup ? '/signup' : (returnTo || '/')]);
        } catch (e) {
          console.warn('[Auth] getUserStatus failed on callback; keeping local flag.', e);
          // Do nothing—keep whatever local isComplete currently is
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
    return; // ⛔️ IMPORTANT: don’t fall through to boot path on same tick
  }

  // 3) Normal boot path (no code in URL)
  const tokenStatus = this.tokenSvc.getStatus?.() ?? (this.tokenSvc.isExpired() ? 'EXPIRED' : 'VALID');
  console.log('Token status on boot:', tokenStatus);

  if (tokenStatus === 'VALID') {
    const idToken = this.tokenSvc.getIdToken();
    if (idToken) {
      this.hydrateFromIdToken(idToken);           // <-- sets user; preserves previous isComplete
      // Pull server truth and update flag
      try {
        const backend = await this.getUserStatus(); // { userExists, isComplete }
        this.userContext.setUserCompleteStatus(backend.isComplete);
      } catch (e) {
        console.warn('[Auth] getUserStatus failed on boot; keeping local flag.', e);
      }
    } else {
      // No ID token in storage — do NOT call setUser; just show signed out
      this.username = null;
      console.warn('[Auth] VALID status but missing idToken; not setting user.');
    }
  } else {
    // EXPIRED/NONE
    this.username = null;
    // Do NOT call setUser() here. Wait for explicit login.
  }

  this.loading = false;
}


//   async ngOnInit() {
//   this.navigationService.homeRedirect$.subscribe(() => this.router.navigate(['/']));

//   this.tokenSvc.loadFromStorage();

//   const status = this.tokenSvc.getStatus?.() ?? (this.tokenSvc.isExpired() ? 'EXPIRED' : 'VALID');
//   console.log('Token status on boot:', status);

//   // if (status === 'VALID') {
//   //   this.hydrateFromIdToken(this.tokenSvc.getIdToken());
//   // } else {
//   //   this.username = null;
//   // }

//   if (status === 'VALID') {
//   this.hydrateFromIdToken(this.tokenSvc.getIdToken());

//   try {
//     const backend = await this.getUserStatus();  
//     this.userContext.setUserCompleteStatus(backend.isComplete);
//   } catch (e) {
//     console.warn('[Auth] Failed to get user status on boot:', e);
//   }
// } else {
//   this.username = null;
// }


//   const url = new URL(window.location.href);
//   const code = url.searchParams.get('code');
//   const rawState = url.searchParams.get('state');

//   let intent: Intent = 'login';
//   let returnTo = '/';

//   if (rawState) {
//     try {
//       const obj = JSON.parse(atob(rawState));
//       intent = (obj.intent === 'signup' ? 'signup' : 'login') as Intent;
//       returnTo = obj.returnTo || '/';
//     } catch {}
//   }

//   if (code) {
//     try {
//       const tokens = await this.exchangeCodeForTokens(code);
//       if (tokens?.id_token) {
//         // this.tokenSvc.setTokens(tokens);
//         // this.hydrateFromIdToken(tokens.id_token);

//         // await this.sendDataToBackendOnce();

//         // if (intent === 'signup') {
//         //   await this.router.navigate(['/signup']);
//         // } else {
//         //   await this.router.navigate([returnTo || '/']);
//         // }

//        this.tokenSvc.setTokens(tokens);
//         this.hydrateFromIdToken(tokens.id_token);

//         const status = await this.getUserStatus();
//         const shouldGoToSignup = !status.userExists || !status.isComplete;
//         console.log('[Auth] Routing – shouldGoToSignup:', shouldGoToSignup, status);

//         if (shouldGoToSignup) {
//           await this.router.navigate(['/signup']);
//         } else {
//           await this.router.navigate([returnTo || '/']);
// }

//         url.searchParams.delete('code');
//         url.searchParams.delete('state');
//         window.history.replaceState({}, '', url.toString());
//       }
//     } catch (error) {
//       console.error('Error exchanging code for tokens:', error);
//     }
//   }

//   this.loading = false;
// }


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
          // you chose to keep the client secret in the browser
          'Authorization': 'Basic ' + btoa(`${environment.clientId}:${environment.clientSecret}`)
        },
        body
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to exchange code. Status: ${response.status} ${text}`);
      }

      // shape: { access_token, id_token, refresh_token, expires_in, token_type }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error exchanging code:', error);
      throw error;
    }
  }

  redirectToLogin(): void {
    //window.location.href = environment.loginUrl;
    
      window.location.href = this.buildHostedUiUrl(this.router.url || '/');

  }

  login(): void {
    this.redirectToLogin();
  }

  // ---- USER HYDRATION ----

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

  // ---- BACKEND SYNC (ONCE) ----

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

  // ---- ROUTING HELPERS ----

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
    // 1) clear local state/tokens
    this.localSignOut();

    // 2) end Cognito Hosted UI session (so next login can choose another user)
    const logoutUrl = this.buildCognitoLogoutUrl();
    window.location.href = logoutUrl;
  }

  private localSignOut(): void {
    // remove saved tokens + timers
    this.tokenSvc.clear();

    // clear “synced to backend” flag for this user (optional)
    const sub = this.userContext.getCurrentUserValue?.()?.sub;
    if (sub) localStorage.removeItem(`userSynced:${sub}`);

    // clear user context if your service exposes a clear/reset method
    // (optional chaining in case it doesn’t exist)
    this.userContext.clearUser?.();

    // update navbar UI immediately
    this.username = null;
  }

  private buildCognitoLogoutUrl(): string {
    const domain = environment.cognitoDomain.replace(/\/+$/, ''); // trim trailing slash
    const clientId = encodeURIComponent(environment.clientId);
    const logoutUri = encodeURIComponent(environment.signOutRedirectUri || environment.redirectUri);

    // Standard Cognito Hosted UI logout
    return `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
  }

///////////////////////////////////////////////////////////////


  private buildHostedUiUrl(returnTo = '/'): string {
  const domain = environment.cognitoDomain.replace(/\/+$/, '');
  const clientId = encodeURIComponent(environment.clientId);
  const redirectUri = encodeURIComponent(environment.redirectUri);
  const scope = encodeURIComponent('openid email profile');

  // single button: just mark where to return after onboarding/login
  const state = encodeURIComponent(btoa(JSON.stringify({ returnTo })));

  // If you want the Hosted UI to open on the sign-up form preselected,
  // you can use the /signup path instead of /authorize (Cognito supports it).
  // Otherwise use /login; both still end at your same callback.
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


}

