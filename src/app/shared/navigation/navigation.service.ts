import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * A shared service to coordinate navigation events (like redirecting to home)
 * across components that don’t directly communicate with each other.
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  private homeRedirectSource = new Subject<void>();

  homeRedirect$: Observable<void> = this.homeRedirectSource.asObservable();

  requestHomeRedirect(): void {
    this.homeRedirectSource.next();
  }
}
