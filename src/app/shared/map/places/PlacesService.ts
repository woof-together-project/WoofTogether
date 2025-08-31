import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Prediction {
  description: string;
  place_id: string;
}

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private base = 'https://n66mcpvf5jjubyxt2srvj4s2lq0kovfu.lambda-url.us-east-1.on.aws/';

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
  ): Observable<{ predictions: Prediction[] }> {
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
    if (opts?.cityName) {
      params = params.set('cityName', opts.cityName);
    }

    return this.http
      .get<{ predictions: Prediction[] }>(this.base, { params })
      .pipe(
        map(res => {
          if (kind !== 'address') return res;

          const predictions = res.predictions ?? [];
          const city = (opts?.cityName || '').trim();
          const normalizedCity = this.norm(city);

          let list = predictions;
          if (normalizedCity) {
            list = predictions.filter(p => this.norm(p.description).includes(normalizedCity));
          }

          const seen = new Set<string>();
          const cleaned: Prediction[] = [];
          for (const p of list) {
            const streetOnly = (p.description.split(',')[0] || '').trim();
            if (streetOnly && !seen.has(streetOnly.toLowerCase())) {
              seen.add(streetOnly.toLowerCase());
              cleaned.push({ place_id: p.place_id, description: streetOnly });
            }
          }

          return { predictions: cleaned };
        })
      );
  }

  details(placeId: string, token: string) {
    const params = new HttpParams()
      .set('mode', 'details')
      .set('place_id', placeId)
      .set('token', token);

    return this.http.get<any>(this.base, { params });
  }

  private norm(s: string): string {
    return s.toLowerCase().replace(/[\s,\-]+/g, ' ').trim();
  }
}
