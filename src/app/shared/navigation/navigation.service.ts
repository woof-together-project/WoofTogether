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

  // Subject that emits a signal when a redirect to home should occur
  private homeRedirectSource = new Subject<void>();

  // Observable that components (like Navbar) can subscribe to
  homeRedirect$: Observable<void> = this.homeRedirectSource.asObservable();

  /**
   * Call this method from anywhere (e.g., SignupComponent)
   * to signal that the app should navigate to the home page.
   */
  requestHomeRedirect(): void {
    this.homeRedirectSource.next();
  }
}
