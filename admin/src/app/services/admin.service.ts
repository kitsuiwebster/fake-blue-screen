import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  hasToken(): boolean {
    return !!localStorage.getItem('admin_token');
  }

  setToken(token: string): void {
    localStorage.setItem('admin_token', token);
  }

  clearToken(): void {
    localStorage.removeItem('admin_token');
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.base}/api/admin/login`, {
      username,
      password,
    });
  }

  getKpis(): Observable<any> {
    return this.http.get(`${this.base}/api/admin/kpis`, {
      headers: this.authHeaders(),
    });
  }
}
