import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../tokenService';

function buildHostedUiLoginUrl(returnTo: string = '/'): string {
  const domain = environment.cognitoDomain.replace(/\/+$/, '');
  const clientId = encodeURIComponent(environment.clientId);
  const redirectUri = encodeURIComponent(environment.redirectUri);
  const scope = encodeURIComponent('openid email profile');
  const state = encodeURIComponent(btoa(JSON.stringify({ returnTo })));
  return `${domain}/login?client_id=${clientId}`
       + `&redirect_uri=${redirectUri}`
       + `&response_type=code&scope=${scope}&state=${state}`;
}

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private tokenSvc: TokenService) {}

  canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const status = this.tokenSvc.getStatus?.() ?? (this.tokenSvc.isExpired() ? 'EXPIRED' : 'VALID');
    const loggedIn = status === 'VALID' && !!this.tokenSvc.getIdToken();

    if (!loggedIn) {
      window.location.href = buildHostedUiLoginUrl(state.url);
      return false;
    }
    return true;
  }
}