import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should build media URL for relative path', () => {
    expect(service.mediaUrl('/media/a.webp')).toBe('http://localhost:5000/media/a.webp');
  });

  it('should keep absolute media URL unchanged', () => {
    expect(service.mediaUrl('https://cdn.example.com/a.webp')).toBe('https://cdn.example.com/a.webp');
  });

  it('should upload public file with form data', () => {
    const file = new File(['img'], 'test.webp', { type: 'image/webp' });
    const expected = { id: 'id-1', url: '/media/id-1.webp', delete_token: 'token' };

    service.uploadPublic(file).subscribe((res) => {
      expect(res).toEqual(expected);
    });

    const req = httpMock.expectOne('http://localhost:5000/api/uploads');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush(expected);
  });

  it('should request gallery with page and limit', () => {
    const expected = { items: [], page: 2, limit: 10, total: 0 };

    service.getGallery(2, 10).subscribe((res) => {
      expect(res).toEqual(expected);
    });

    const req = httpMock.expectOne('http://localhost:5000/api/gallery?page=2&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush(expected);
  });

  it('should request captcha challenge', () => {
    const expected = { challenge_id: 'c1', image: 'img', math_question: '1+1' };

    service.getCaptcha().subscribe((res) => {
      expect(res).toEqual(expected);
    });

    const req = httpMock.expectOne('http://localhost:5000/api/captcha');
    expect(req.request.method).toBe('GET');
    req.flush(expected);
  });

  it('should post delete payload', () => {
    const payload = {
      id: 'id-1',
      challenge_id: 'c1',
      captcha_answer: 'abcd',
      math_answer: '2',
    };

    service.deleteUpload(payload).subscribe((res) => {
      expect(res).toEqual({ success: true });
    });

    const req = httpMock.expectOne('http://localhost:5000/api/delete');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true });
  });

  it('should post report payload with image id', () => {
    const report = { reason: 'illegal', description: 'details', email: 'a@b.com' };

    service.reportImage('id-1', report).subscribe((res) => {
      expect(res).toEqual({ success: true });
    });

    const req = httpMock.expectOne('http://localhost:5000/api/report');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id: 'id-1', ...report });
    req.flush({ success: true });
  });
});
