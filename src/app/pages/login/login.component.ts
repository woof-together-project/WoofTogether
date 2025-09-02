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

    return `https://${domain}/${oauthPath}`
      + `?response_type=${encodeURIComponent(responseType)}`
      + `&client_id=${encodeURIComponent(userPoolClientId)}`
      + `&redirect_uri=${encodeURIComponent(redirectSignIn[0])}`
      + `&scope=${encodeURIComponent(scopes.join(' '))}`
      + `&state=${encodeURIComponent(state)}`;
  }

}
