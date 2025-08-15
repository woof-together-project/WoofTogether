import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type TokenSet = {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;        // seconds (lifetime of access_token)
  token_type: 'Bearer';
  obtained_at: number;       // Date.now() when stored
};

const KEY = 'cognito_tokens';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private tokens: TokenSet | null = null;
  private refreshTimer: any;

  /** Load tokens from localStorage on app start */
  loadFromStorage(): void {
    const raw = localStorage.getItem(KEY);
    this.tokens = raw ? (JSON.parse(raw) as TokenSet) : null;
    if (this.tokens) this.scheduleRefresh();
  }

  /** Save tokens + start a refresh timer */
  setTokens(data: Omit<TokenSet, 'obtained_at'>): void {
    this.tokens = { ...data, obtained_at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(this.tokens));
    this.scheduleRefresh();
  }

  /** Clear everything (sign out locally) */
  clear(): void {
    this.tokens = null;
    localStorage.removeItem(KEY);
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }

  getIdToken(): string | null { return this.tokens?.id_token ?? null; }
  getAccessToken(): string | null { return this.tokens?.access_token ?? null; }
  getRefreshToken(): string | null { return this.tokens?.refresh_token ?? null; }

  /** Is the current access token expired? */
  isExpired(): boolean {
    if (!this.tokens) return true;
    const expiryMs = this.tokens.obtained_at + this.tokens.expires_in * 1000;
    return Date.now() >= expiryMs;
  }

  /** Schedule silent refresh ~60s before access_token expiry */
  private scheduleRefresh(): void {
    if (!this.tokens) return;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    const msLeft = this.tokens.obtained_at + this.tokens.expires_in * 1000 - Date.now();
    const when = Math.max(5_000, msLeft - 60_000); // refresh one minute before expiry
    this.refreshTimer = setTimeout(() => { void this.refreshIfPossible(); }, when);
  }

  /** Use refresh_token (if present) to renew access/id tokens */
  async refreshIfPossible(): Promise<void> {
    const rt = this.getRefreshToken();
    if (!rt) return; // nothing to refresh with

    const tokenUrl = `${environment.cognitoDomain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: environment.clientId,
      refresh_token: rt,
      // NOTE: redirect_uri not required for refresh, Cognito accepts without it
    });

    // You asked to keep using the clientSecret in the browser
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${environment.clientId}:${environment.clientSecret}`)
      },
      body
    });

    if (!res.ok) {
      console.error('Refresh failed:', res.status, await res.text());
      this.clear();
      return;
    }

    const data = await res.json();
    // Cognito may not return refresh_token on refresh; keep the old one
    const refresh_token = data.refresh_token ?? rt;
    this.setTokens({ ...data, refresh_token });
  }

  private decodeJwt<T = any>(jwt?: string | null): T | null {
  if (!jwt) return null;
  try {
    const [_, payload] = jwt.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch { return null; }
}

getAccessTokenExp(): number | null {
  const claims = this.decodeJwt(this.getAccessToken());
  return claims?.exp ? claims.exp * 1000 : null; // ms
}

getIdTokenExp(): number | null {
  const claims = this.decodeJwt(this.getIdToken());
  return claims?.exp ? claims.exp * 1000 : null; // ms
}

// Stronger status than just "isExpired"
getStatus(): 'NONE' | 'VALID' | 'EXPIRED_ACCESS_BUT_REFRESH' | 'EXPIRED' {
  const at = this.getAccessToken();
  const rt = this.getRefreshToken();
  if (!at) return 'NONE';
  const exp = this.getAccessTokenExp();
  const now = Date.now();
  if (exp && now < exp) return 'VALID';
  if (rt) return 'EXPIRED_ACCESS_BUT_REFRESH';
  return 'EXPIRED';
}
}
