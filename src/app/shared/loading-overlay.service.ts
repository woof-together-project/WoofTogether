import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private _visible$ = new BehaviorSubject<boolean>(false);
  visible$ = this._visible$.asObservable();

  show() { this._visible$.next(true); }
  hide() { this._visible$.next(false); }
}
