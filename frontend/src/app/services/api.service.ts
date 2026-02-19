import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  uploadPublic(file: File): Observable<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadResult>('/api/uploads', form);
  }

  getGallery(page = 1, limit = 24): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(`/api/gallery?page=${page}&limit=${limit}`);
  }

  deleteUpload(id: string, deleteToken: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('/api/delete', {
      id,
      delete_token: deleteToken,
    });
  }
}
