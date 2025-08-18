import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, filter, take } from 'rxjs';

export interface UserDetails {
  email: string | null;
  nickname: string | null;
  username: string | null;
  sub: string | null;
  isComplete?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly STORAGE_KEY = 'wt_user';

  private currentUser = new BehaviorSubject<UserDetails | null>(null);
  private _ready$ = new BehaviorSubject<boolean>(false);
  readonly ready$ = this._ready$.asObservable();

  constructor() {
    // Hydrate from localStorage so a refresh keeps the session + completion flag
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as UserDetails;
        this.currentUser.next(parsed);
      } catch {
        // bad JSON → clear
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  /** Set user from ID token claims; keeps previous isComplete value if present. */
  setUser(email: string | null, nickname: string | null, username: string | null, sub: string | null) {
    const prev = this.currentUser.value;
    const user: UserDetails = {
      email, nickname, username, sub,
      isComplete: prev?.isComplete ?? false
    };
    this.currentUser.next(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    console.log('[UserContextService] setUser called. Emitted:', user);
  }

  /** Update only the completion flag (e.g., from backend status on boot or after signup). */
  setUserCompleteStatus(isComplete: boolean) {
    const cur = this.currentUser.value;
    const next: UserDetails = cur
      ? { ...cur, isComplete }
      : { email: null, nickname: null, username: null, sub: null, isComplete }; // safe fallback
    this.currentUser.next(next);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    console.log('[UserContextService] setUserCompleteStatus called. Updated user:', next);
  }

  /** Clear all user state (e.g., on logout). */
  clearUser(): void {
    this.currentUser.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[UserContextService] clearUser called. User cleared.');
  }

  // ------- Getters / helpers -------

  getUserObservable() {
    return this.currentUser.asObservable();
  }

  getCurrentUserValue(): UserDetails | null {
    const user = this.currentUser.value;
    console.log('[UserContextService] getCurrentUserValue called. Current value:', user);
    return user;
  }

  getUserEmail(): string | null {
    return this.currentUser.value?.email ?? null;
  }

  isAuthenticated(): boolean {
    const u = this.currentUser.value;
    return !!(u && u.sub && u.email);
  }

  // ------- Readiness (useful to avoid auth races in guards/components) -------

  /** Signal that auth/init is finished (e.g., after code exchange + DB check). */
  markReady() { this._ready$.next(true); }

  /** If you re-run login flow, call this first. */
  markNotReady() { this._ready$.next(false); }

  async waitUntilReady(): Promise<void> {
    await firstValueFrom(this.ready$.pipe(filter(Boolean), take(1)));
  }

  isReady(): boolean { return this._ready$.value; }
}
