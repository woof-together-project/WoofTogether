import { Component } from '@angular/core';
import { amplifyCognitoConfig  } from '../../amplify.config';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `<button (click)="login()">Login with Cognito</button>`,
})
export class LoginComponent {
  login() {
    const cognito = amplifyCognitoConfig.Auth?.Cognito;

    if (!cognito || !cognito.loginWith?.oauth) {
      console.error('❌ Missing Cognito OAuth configuration');
      return;
    }
  
    const {
      userPoolClientId,
      loginWith: {
        oauth: {
          domain,
          redirectSignIn,
          scopes,
          responseType
        }
      }
    } = cognito;
  
    const oauthUrl = `https://${domain}/oauth2/authorize` +
      `?response_type=${responseType}` +
      `&client_id=${userPoolClientId}` +
      `&redirect_uri=${encodeURIComponent(redirectSignIn[0])}` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&prompt=login`;
  
    console.log('🔗 Redirecting to Cognito UI:', oauthUrl);
    window.location.href = oauthUrl;
  }
}
