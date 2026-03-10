import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResult {
  id: string;
  url: string;
  delete_token: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  created_at: number;
}

export interface GalleryResponse {
  items: GalleryItem[];
  page: number;
  limit: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  mediaUrl(path: string): string {
    return path.startsWith('http') ? path : `${this.base}${path}`;
  }

  uploadPublic(file: File): Observable<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadResult>(`${this.base}/api/uploads`, form);
  }

  getGallery(page = 1, limit = 24): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(
      `${this.base}/api/gallery?page=${page}&limit=${limit}`
    );
  }

  getCaptcha(): Observable<{ challenge_id: string; image: string; math_question: string }> {
    return this.http.get<{ challenge_id: string; image: string; math_question: string }>(
      `${this.base}/api/captcha`
    );
  }

  deleteUpload(data: {
    id: string;
    challenge_id: string;
    captcha_answer: string;
    math_answer: string;
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/api/delete`, data);
  }

  reportImage(id: string, data: { reason: string; description: string; email: string }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/api/report`, { id, ...data });
  }
}
