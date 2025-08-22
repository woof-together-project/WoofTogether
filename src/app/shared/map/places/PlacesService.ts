import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private base = 'https://si2ancz2kzrnbpv2luhwwodgci0gyuay.lambda-url.us-east-1.on.aws/';

  constructor(private http: HttpClient) {}

  autocomplete(
    q: string,
    token: string,
    kind: 'city' | 'address',
    opts?: {
      cityCenter?: { lat: number; lng: number };
      cityRect?: { sw: { lat: number; lng: number }, ne: { lat: number; lng: number } };
      cityName?: string;
    }
  ): Observable<{ predictions: { description: string; place_id: string }[] }> {
    let params = new HttpParams()
      .set('mode', 'autocomplete')
      .set('q', q)
      .set('token', token)
      .set('kind', kind);

    if (opts?.cityRect) {
      params = params
        .set('rectSw', `${opts.cityRect.sw.lat},${opts.cityRect.sw.lng}`)
        .set('rectNe', `${opts.cityRect.ne.lat},${opts.cityRect.ne.lng}`);
    } else if (opts?.cityCenter) {
      params = params.set('cityCenter', `${opts.cityCenter.lat},${opts.cityCenter.lng}`);
    }
    if (opts?.cityName) params = params.set('cityName', opts.cityName);

    return this.http.get<{ predictions: { description: string; place_id: string }[] }>(this.base, { params });
  }

  details(placeId: string, token: string) {
    const params = new HttpParams()
      .set('mode', 'details')
      .set('place_id', placeId)
      .set('token', token);
    return this.http.get<any>(this.base, { params }); // `any` is fine here
  }
}
