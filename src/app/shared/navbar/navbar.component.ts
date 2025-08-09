import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { NavigationService } from '../../shared/navigation/navigation.service';
import { LoadingOverlayService } from '../../shared/loading-overlay.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  static readonly insertUserToDBURL = 'https://65uloxgkusbas32clh3zf4o2zm0dmxdv.lambda-url.us-east-1.on.aws/'; //insert user to DB lambda function URL
  // top of NavbarComponent
  static readonly profileURL = 'https://5org75ldcmqj6zhgsat7gi6mia0qwnav.lambda-url.us-east-1.on.aws/'; // GET ?sub=...

  constructor(private router: Router, private userContext: UserContextService,   private navigationService: NavigationService,
  private overlay: LoadingOverlayService) {}
  username: string | null = null;
  searchText: string = '';
  loading: boolean = true;
  isComplete: boolean = false;

  /* async ngOnInit() {
      this.userContext.getUserObservable().subscribe(u => {
      this.username = u?.nickname ?? null;
      });

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      this.navigationService.homeRedirect$.subscribe(() => {
      this.router.navigate(['/']);
        });


      if (code) {
        try {
            const tokens = await this.exchangeCodeForTokens(code);
            if (tokens && tokens.id_token) {
              const userDetails = this.parseJwt(tokens.id_token);
              this.username = userDetails.nickname ?? null;

              // put user into context immediately (so the button can read it)
              if (userDetails.email && userDetails.nickname && userDetails.name && userDetails.sub) {
                  this.userContext.setUser(
                  userDetails.email,
                  userDetails.nickname,
                  userDetails.name,
                  userDetails.sub
                  );

                // wait for backend insert/check to set isComplete
                await this.sendDataToBackend();
                this.userContext.markReady();
              }

              console.log('User Details:', userDetails);

              if (userDetails.email && userDetails.nickname && userDetails.name && userDetails.sub)
                  {
                    this.userContext.setUser(userDetails.email, userDetails.nickname, userDetails.name, userDetails.sub);
                    await this.sendDataToBackend();
                    this.userContext.markReady();
                  }
              else {
                  console.error("Missing user details from token");
              }
            }
        }
            catch (error) {
              console.error('Error exchanging code for tokens:', error);
            }
            finally {
              this.loading = false; // enable the button
            }
      } else {
        this.userContext.markReady();
        this.loading = false;
      }
  } */

  async ngOnInit() {
    this.userContext.getUserObservable().subscribe(u => {
      this.username = u?.nickname ?? null;
    });

    this.navigationService.homeRedirect$.subscribe(() => this.router.navigate(['/']));

    const code = new URLSearchParams(window.location.search).get('code');

    if (code) {
      try {
        const tokens = await this.exchangeCodeForTokens(code);
        if (tokens?.id_token) {
          const u = this.parseJwt(tokens.id_token);

          if (u.email && u.nickname && u.name && u.sub) {
            this.userContext.setUser(u.email, u.nickname, u.name, u.sub);

            // ⬅️ one call only; this must set isComplete based on Lambda response
            await this.sendDataToBackend();
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



 /* async sendDataToBackend()
 {
    const currentUser = this.userContext.getCurrentUserValue();
    const lambdaUrl = NavbarComponent.insertUserToDBURL;

    if (!currentUser)
      {
      console.error('CRITICAL: User context is null or missing properties. Current User (from service):', currentUser);
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

    console.log('Payload to send:', payload);

   try {
     console.log('Sending request to Lambda with payload:', payload);
     const response = await fetch(lambdaUrl, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(payload)
     });

     const result = await response.json();
     console.log('Lambda response:', result);

     if (response.ok) {
        *//* if (result.userExists === true || result.created === true || result.isCompleted === true) {
          this.userContext.setUserCompleteStatus(true);
          console.log('User profile marked complete.');
        } else {
          console.log('User created but not marked complete.');
        } *//*
        const complete =
          result?.isCompleted === true ||
          result?.isComplete === true ||
          result?.profileCompleted === true;

        this.userContext.setUserCompleteStatus(!!complete);
        console.log('[UserContext] isComplete set to:', !!complete);
     } else {
       console.error('Lambda responded with error:', result);
     }
   } catch (err) {
     console.error('Error sending request to Lambda:', err);
   }
 }
 */

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


  /* async handleProtectedRoute(event: Event, targetRoute: string): Promise<void> {
    event.preventDefault();
    await this.waitAuthWithOverlay();
    const currentUser = this.userContext.getCurrentUserValue();
    if (!(currentUser?.isComplete)) {
      alert("Please complete your sign up information to access this page.");
      //this.router.navigate([targetRoute]);
       this.router.navigate(['/signup']);
    } else
    {
      this.router.navigate([targetRoute]);
      }
    }

     redirectToHome() {
      this.router.navigate(['/']);
  } */

  async handleProtectedRoute(event: Event, targetRoute: string): Promise<void> {
    event.preventDefault();

    // show overlay + wait only if auth isn't ready yet
    await this.waitAuthWithOverlay();

    const u = this.userContext.getCurrentUserValue();
    if (!u) { this.login(); return; }

    // only these routes require completed profile
    const requiresComplete = targetRoute === '/sitters' || targetRoute === '/dog-match';

    if (requiresComplete && !u.isComplete) {
      // no alert while waiting; once ready, just go to signup
      this.router.navigate(['/signup']);
      return;
    }

    this.router.navigate([targetRoute]);
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




}
