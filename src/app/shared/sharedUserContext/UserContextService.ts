import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, filter, take } from 'rxjs';

export interface UserDetails {
  email: string | null;
  nickname: string | null;
  username: string | null;
  sub: string | null;
  isComplete?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private currentUser = new BehaviorSubject<UserDetails | null>(null);
  private _ready$ = new BehaviorSubject<boolean>(false);
  ready$ = this._ready$.asObservable();

  constructor() {}

  setUser(email: string | null, nickname: string | null, username: string | null, sub: string | null) {
  const user: UserDetails = { email, nickname, username, sub, isComplete: false };
  this.currentUser.next(user);
  console.log('[UserContextService] setUser called. Emitted:', user);
}

  getCurrentUserValue(): UserDetails | null {
    const user = this.currentUser.value;
    console.log('[UserContextService] getCurrentUserValue called. Current value:', user);
    return user;
  }

  getUserObservable() {
    return this.currentUser.asObservable();
  }

  getUserEmail(): string | null {
    const user = this.getCurrentUserValue();
    const email = user ? user.email : null;
    return email;
  }

  setUserCompleteStatus(isComplete: boolean) {
    const currentUser = this.getCurrentUserValue();
    if (currentUser) {
      const updatedUser: UserDetails = { ...currentUser, isComplete };
      this.currentUser.next(updatedUser);
      console.log('[UserContextService] setUserCompleteStatus called. Updated user:', updatedUser);
    } else {
      console.warn('[UserContextService] setUserCompleteStatus called but no current user found.');
    }
  }

  /** Signal that auth/init is finished (code exchange + DB check or no-code path). */
  markReady() {
    this._ready$.next(true);
  }

  /** (Optional) If you re-run login flow, call this first. */
  markNotReady() {
    this._ready$.next(false);
  }

  /** Guards / components can await this to avoid racing auth state. */
  async waitUntilReady(): Promise<void> {
    await firstValueFrom(this.ready$.pipe(filter(Boolean), take(1)));
  }

  isReady(): boolean {
    // add inside UserContextService
    return this._ready$.value;
  }

  clearUser(): void {
    this.currentUser.next(null);
    console.log('[UserContextService] clearUser called. User cleared.');
  }

  isAuthenticated(): boolean {
    const u = this.currentUser.value;
    return !!(u && u.sub && u.email);
  }
}
