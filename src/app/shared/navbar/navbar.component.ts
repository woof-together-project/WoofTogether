import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { NavigationService } from '../../shared/navigation/navigation.service';
import { LoadingOverlayService } from '../../shared/loading-overlay.service';
import { TokenService } from '../../shared/auth/tokenService';

type Intent = 'login' | 'signup';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  static readonly insertUserToDBURL =
    'https://65uloxgkusbas32clh3zf4o2zm0dmxdv.lambda-url.us-east-1.on.aws/'; // insert user to DB lambda
    // static readonly insertUserToDBURL = 'https://og3trfcczul4fjn5hsachnn7ma0lijfq.lambda-url.us-east-1.on.aws/'; //insert user to DB lambda function URL in final user
  static readonly profileURL = 'https://5org75ldcmqj6zhgsat7gi6mia0qwnav.lambda-url.us-east-1.on.aws/'; // GET ?sub=...
  constructor(
  private router: Router,
  private userContext: UserContextService,
  private navigationService: NavigationService,
  private overlay: LoadingOverlayService,
  private tokenSvc: TokenService
  ) {}
  username: string | null = null;
  searchText: string = '';
  loading: boolean = true;
  isComplete: boolean = false;

  async ngOnInit() {
    this.navigationService.homeRedirect$.subscribe(() => this.router.navigate(['/']));
    this.tokenSvc.loadFromStorage();
    this.userContext.getUserObservable().subscribe(u => {
      this.username = u?.nickname ?? null;
    });
    this.navigationService.homeRedirect$.subscribe(() => this.router.navigate(['/']));
    // ✅ Only hydrate if token is still valid. Do NOT refresh on boot.
    const status = this.tokenSvc.getStatus?.() ?? (this.tokenSvc.isExpired() ? 'EXPIRED' : 'VALID');
    console.log('Token status on boot:', status);
    const code = new URLSearchParams(window.location.search).get('code');

    if (status === 'VALID') {
      this.hydrateFromIdToken(this.tokenSvc.getIdToken());
    } else {
      // show as signed out until user actively logs in
      this.username = null;
    }

    // --- handle OAuth callback (unchanged) ---
    const url = new URL(window.location.href);
    /*const code = url.searchParams.get('code');
    const rawState = url.searchParams.get('state');

    let intent: Intent = 'login';
    let returnTo = '/';

    if (rawState) {
      try {
        const obj = JSON.parse(atob(rawState));
        intent = (obj.intent === 'signup' ? 'signup' : 'login') as Intent;
        returnTo = obj.returnTo || '/';
      } catch {}
    } */

    if (code) {
      try {
        const tokens = await this.exchangeCodeForTokens(code);
        if (tokens?.id_token) {
          const u = this.parseJwt(tokens.id_token);
          this.tokenSvc.setTokens(tokens); //amit
          this.hydrateFromIdToken(tokens.id_token); //amit

          if (u.email && u.nickname && u.name && u.sub) {
            this.userContext.setUser(u.email, u.nickname, u.name, u.sub);

            // ⬅️ one call only; this must set isComplete based on Lambda response
            await this.sendDataToBackend();

            /* if (intent === 'signup') {
              await this.router.navigate(['/signup']);
            } else {
              await this.router.navigate([returnTo || '/']);
            } */
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            window.history.replaceState({}, '', url.toString());
          } else {
            console.error('Missing user details from token');
          }
        }
      } catch (e) {
        console.error('Error exchanging code for tokens:', e);
      } finally {
        this.loading = false;
        this.userContext.markReady();          // ⬅️ ready after DB check path finishes
      }
    } else {
      this.loading = false;
      this.userContext.markReady();            // ⬅️ ready on no-code path
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
    window.location.href = environment.loginUrl; // still works if you use it elsewhere
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


 private async fetchCompletionFromProfile(sub: string): Promise<boolean | null> {
  try {
    const url = `${NavbarComponent.profileURL}?sub=${encodeURIComponent(sub)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    // expect { user: { IsCompleted: true/false, ... }, ... }
    const completed = data?.user?.IsCompleted;
    return typeof completed === 'boolean' ? completed : null;
  } catch {
    return null;
  }
}

async sendDataToBackend() {
  const currentUser = this.userContext.getCurrentUserValue();
  const lambdaUrl = NavbarComponent.insertUserToDBURL;

  if (!currentUser) {
    console.error('No current user in context');
    return;
  }

  const payload = {
    user: {
      name: currentUser.username,
      email: currentUser.email,
      nickname: currentUser.nickname,
      provider: 'COGNITO',
      providerId: currentUser.sub,
    }
  };

  try {
    const resp = await fetch(NavbarComponent.insertUserToDBURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await resp.json();
    console.log('[insertUser Lambda] result:', result);

    if (!resp.ok) {
      console.error('Lambda responded with error:', result);
      return;
    }

    // 1) Prefer explicit completion flags if present
    let complete: boolean | null = null;
    if (typeof result?.isCompleted === 'boolean') complete = result.isCompleted;
    else if (typeof result?.isComplete === 'boolean') complete = result.isComplete;
    else if (typeof result?.profileCompleted === 'boolean') complete = result.profileCompleted;

    // 2) If not provided, check profile endpoint (authoritative Users.IsCompleted)
    if (complete === null && currentUser.sub) {
      complete = await this.fetchCompletionFromProfile(currentUser.sub);
    }

    // 3) Set the flag (fallback to false if still unknown)
    this.userContext.setUserCompleteStatus(!!complete);
    console.log('[UserContext] isComplete set to:', !!complete);

  } catch (err) {
    console.error('Error sending request to Lambda:', err);
  }
}


  async handleProtectedRoute(event: Event, targetRoute: string): Promise<void> {
    event.preventDefault();

    // show overlay + wait only if auth isn't ready yet
    await this.waitAuthWithOverlay();

    const u = this.userContext.getCurrentUserValue();
    if (!u) { this.login(); return; }

    // only these routes require completed profile
    const requiresComplete = targetRoute === '/sitters' || targetRoute === '/dog-match';

    if (requiresComplete && !u.isComplete) {
      alert("Please complete your sign up information to access this page.");
      this.router.navigate(['/signup']);
      return;
    }

    this.router.navigate([targetRoute]);
  }

  redirectToHome() {
    this.router.navigate(['/']);
  }

  private async waitAuthWithOverlay(): Promise<void> {
    if (!this.userContext.isReady()) this.overlay.show();    // show overlay only if not ready
    try {
      await this.userContext.waitUntilReady();               // ⏳ wait for auth to finish
    } finally {
      this.overlay.hide();
    }
  }

  // Hello {name}
  async goToProfile(event?: Event): Promise<void> {
    event?.preventDefault();

    // Wait for auth; shows overlay if needed
    await this.waitAuthWithOverlay();

    const u = this.userContext.getCurrentUserValue();
    if (!u) { this.login(); return; }

    // If we don't know, or it's false, confirm from profile endpoint
    let complete = u.isComplete ?? null;
    if (complete !== true && u.sub) {
      complete = await this.fetchCompletionFromProfile(u.sub); // same helper used in sendDataToBackend
      if (complete !== null) this.userContext.setUserCompleteStatus(!!complete);
    }

    this.router.navigate([complete ? '/user-management' : '/signup']);
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
}
