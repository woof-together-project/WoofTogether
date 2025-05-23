import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserDetails {
  email: string | null;
  nickname: string | null;
  username: string | null;
  sub: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private currentUser = new BehaviorSubject<UserDetails | null>(null);

  constructor() {}

  setUser(email: string | null, nickname: string | null, username: string | null, sub: string | null) {
    const user: UserDetails = { email, nickname, username, sub };
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
}
