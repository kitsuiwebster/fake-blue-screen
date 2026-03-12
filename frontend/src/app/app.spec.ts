import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { App } from './app';
import { ApiService, GalleryItem, UploadResult } from './services/api.service';

describe('App', () => {
  let api: jasmine.SpyObj<ApiService>;
  let originalUrl: string;

  const galleryItem: GalleryItem = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    url: '/media/123e4567-e89b-42d3-a456-426614174000.webp',
    created_at: 0,
  };

  beforeEach(async () => {
    originalUrl = window.location.href;
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'mediaUrl',
      'uploadPublic',
      'getGallery',
      'getCaptcha',
      'deleteUpload',
      'reportImage',
    ]);
    api.mediaUrl.and.callFake((path: string) => `http://localhost:5000${path}`);
    api.getGallery.and.returnValue(of({ items: [], page: 1, limit: 24, total: 0 }));
    api.getCaptcha.and.returnValue(
      of({ challenge_id: 'c1', image: 'data:image/png;base64,abc', math_question: '1+1' })
    );

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalUrl);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render tabs', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tabs')?.textContent).toContain('Catalogue');
  });

  it('should parse screen query parameter on init', () => {
    window.history.replaceState({}, '', '/?screen=petya');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(app.currentScreen()).toBe('petya');
    expect(app.isSharedLinkView()).toBeFalse();
  });

  it('should parse public image query parameter on init', () => {
    window.history.replaceState({}, '', '/?image=123e4567-e89b-42d3-a456-426614174000');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(api.mediaUrl).toHaveBeenCalledWith('/media/123e4567-e89b-42d3-a456-426614174000.webp');
    expect(app.isSharedLinkView()).toBeTrue();
    expect(app.currentScreen()).toBe('public-image');
    expect(app.publicImageUrl()).toBe(
      'http://localhost:5000/media/123e4567-e89b-42d3-a456-426614174000.webp'
    );
  });

  it('should upload public image and refresh gallery on success', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const result: UploadResult = {
      id: '123e4567-e89b-42d3-a456-426614174000',
      url: '/media/123e4567-e89b-42d3-a456-426614174000.webp',
      delete_token: 'delete-token',
    };
    const file = new File(['data'], 'screen.webp', { type: 'image/webp' });
    app.publicFile = file;
    api.uploadPublic.and.returnValue(of(result));
    spyOn(app, 'loadGallery').and.stub();

    app.uploadPublic();

    expect(api.uploadPublic).toHaveBeenCalledWith(file);
    expect(app.publicUploadStatus()).toBe('done');
    expect(app.publicUploadResult()).toEqual(result);
    expect(app.loadGallery).toHaveBeenCalledWith(1);
  });

  it('should surface upload error on failed public upload', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.publicFile = new File(['data'], 'screen.webp', { type: 'image/webp' });
    api.uploadPublic.and.returnValue(throwError(() => ({ error: { error: 'Bad file' } })));

    app.uploadPublic();

    expect(app.publicUploadStatus()).toBe('error');
    expect(app.publicUploadError()).toBe('Bad file');
  });

  it('should initialize delete flow by loading captcha', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.deleteItem(galleryItem);

    expect(api.getCaptcha).toHaveBeenCalled();
    expect(app.deleteTarget()).toEqual(galleryItem);
    expect(app.deleteStep()).toBe(1);
    expect(app.deleteChallengeId).toBe('c1');
    expect(app.deleteCaptchaImage()).toBe('data:image/png;base64,abc');
    expect(app.deleteMathQuestion()).toBe('1+1');
    expect(app.deleteLoading()).toBeFalse();
  });

  it('should reject delete step 1 when captcha input is empty', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.deleteStep.set(1);
    app.deleteCaptchaInput = '   ';

    app.deleteNextStep();

    expect(app.deleteStep()).toBe(1);
    expect(app.deleteError()).toBe('Please enter the captcha code.');
  });

  it('should delete image on confirm when final confirmation is set', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    api.deleteUpload.and.returnValue(of({ success: true }));
    spyOn(app, 'loadGallery').and.stub();
    spyOn(app, 'showNotification').and.stub();

    app.deleteTarget.set(galleryItem);
    app.deleteCountdown.set(0);
    app.deleteFinalConfirm.set(true);
    app.galleryPage.set(3);
    app.deleteChallengeId = 'c1';
    app.deleteCaptchaInput = '  42  ';
    app.deleteMathInput = ' 2 ';

    app.confirmDelete();

    expect(api.deleteUpload).toHaveBeenCalledWith({
      id: galleryItem.id,
      challenge_id: 'c1',
      captcha_answer: '42',
      math_answer: '2',
    });
    expect(app.loadGallery).toHaveBeenCalledWith(3);
    expect(app.showNotification).toHaveBeenCalledWith('Image deleted.');
  });

  it('should reload captcha after deletion failure linked to captcha', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    api.deleteUpload.and.returnValue(
      throwError(() => ({ error: { error: 'Wrong captcha answer' } }))
    );
    api.getCaptcha.and.returnValue(
      of({ challenge_id: 'c2', image: 'data:image/png;base64,new', math_question: '2+2' })
    );

    app.deleteTarget.set(galleryItem);
    app.deleteCountdown.set(0);
    app.deleteFinalConfirm.set(true);
    app.deleteChallengeId = 'c1';
    app.deleteCaptchaInput = 'abcd';
    app.deleteMathInput = '3';

    app.confirmDelete();

    expect(api.getCaptcha).toHaveBeenCalled();
    expect(app.deleteStep()).toBe(1);
    expect(app.deleteCaptchaInput).toBe('');
    expect(app.deleteMathInput).toBe('');
    expect(app.deleteChallengeId).toBe('c2');
    expect(app.deleteLoading()).toBeFalse();
  });
});
