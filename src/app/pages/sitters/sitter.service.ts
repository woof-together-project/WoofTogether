// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { Sitter } from './sitter.model';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class SitterService {
//   private apiUrl = 'https://your-api-url.com/api/sitters'; // replace with real URL
//
//   constructor(private http: HttpClient) {}
//
//   getSittersByLocation(location: string): Observable<Sitter[]> {
//     return this.http.get<Sitter[]>(`${this.apiUrl}?location=${location}`);
//   }
//
//   getSittersByCriteria(filters: any): Observable<Sitter[]> {
//     return this.http.post<Sitter[]>(`${this.apiUrl}/filter`, filters);
//   }
// }
