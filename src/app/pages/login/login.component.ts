import { Component } from '@angular/core';
import { amplifyCognitoConfig  } from '../../amplify.config';

type Intent = 'login' | 'signup';

@Component({
  selector: 'app-login',
  standalone: true,
  template: ` <button (click)="login()">Login with Cognito</button>
    <button (click)="signup()" style="margin-left:8px">Sign up with Cognito</button>
  `,
})

export class LoginComponent {
  // login() {
  //   const cognito = amplifyCognitoConfig.Auth?.Cognito;

  //   if (!cognito || !cognito.loginWith?.oauth) {
  //     console.error('❌ Missing Cognito OAuth configuration');
  //     return;
  //   }
  
  //   const {
  //     userPoolClientId,
  //     loginWith: {
  //       oauth: {
  //         domain,
  //         redirectSignIn,
  //         scopes,
  //         responseType
  //       }
  //     }
  //   } = cognito;
  
  //   const oauthUrl = `https://${domain}/oauth2/authorize` +
  //     `?response_type=${responseType}` +
  //     `&client_id=${userPoolClientId}` +
  //     `&redirect_uri=${encodeURIComponent(redirectSignIn[0])}` +
  //     `&scope=${encodeURIComponent(scopes.join(' '))}` +
  //     `&prompt=login`;
  
  //   console.log('Redirecting to Cognito UI:', oauthUrl);
  //   window.location.href = oauthUrl;

  // }

  login() {
    try {
      const state = this.buildState('login', window.location.pathname || '/');
      const url = this.getOauthBase('login', state);
      console.log('Redirecting to Cognito LOGIN:', url);
      window.location.href = url;
    } catch (e) {
      console.error(e);
    }
  }

  signup() {
    try {
      const state = this.buildState('signup', '/signup');
      const url = this.getOauthBase('signup', state); // use Hosted UI /signup
      console.log('Redirecting to Cognito SIGNUP:', url);
      window.location.href = url;
    } catch (e) {
      console.error(e);
    }
  }

   private buildState(intent: Intent, returnTo: string = '/'): string {
    // encode a tiny JSON object so we can route after redirect
    return btoa(JSON.stringify({ intent, returnTo }));
  }

  private getOauthBase(oauthPath: 'login' | 'signup', state: string): string {
    const cognito = amplifyCognitoConfig.Auth?.Cognito;

    if (!cognito || !cognito.loginWith?.oauth) {
      throw new Error('❌ Missing Cognito OAuth configuration');
    }

    const {
      userPoolClientId,
      loginWith: {
        oauth: { domain, redirectSignIn, scopes, responseType }
      }
    } = cognito;

    // NOTE: no &prompt=login → lets Cognito reuse its session
    return `https://${domain}/${oauthPath}`
      + `?response_type=${encodeURIComponent(responseType)}`
      + `&client_id=${encodeURIComponent(userPoolClientId)}`
      + `&redirect_uri=${encodeURIComponent(redirectSignIn[0])}`
      + `&scope=${encodeURIComponent(scopes.join(' '))}`
      + `&state=${encodeURIComponent(state)}`;
  }

}
