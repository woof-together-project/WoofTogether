import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class LoginService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<string> {
    const params = new HttpParams()
      .set('username', username)
      .set('password', password);

      return this.http.get('https://ui.dhz62hiqax4cs.amplifyapp.com/', {
        params,
        responseType: 'text' as const
      });
  }
}
