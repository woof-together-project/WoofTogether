import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
}
