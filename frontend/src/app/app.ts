import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, GalleryItem, UploadResult } from './services/api.service';

const VALID_SCREENS = [
  'windows-bsod', 'windows-working-bsod', 'macos-panic',
  'linux-panic-black', 'linux-panic-pink', 'linux-panic-purple',
  'macos-startup-apple', 'macos-startup-globe', 'macos-startup-prohibited',
  'macos-startup-exclamation', 'macos-startup-folder',
  'acpi-critical-error', 'wannacry', 'petya', 'retis',
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly api = inject(ApiService);

  // ── Display state ─────────────────────────────────────────────────────────
  currentScreen = signal<string>('');
  isFullscreen  = signal<boolean>(false);
  isDark        = signal<boolean>(false);

  // ── Private upload (local only, not shareable) ────────────────────────────
  privateFile: File | null = null;
  customImageUrl = signal<string>('');

  // ── Public image display ──────────────────────────────────────────────────
  publicImageUrl = signal<string>('');

  // ── Public upload ─────────────────────────────────────────────────────────
  publicFile: File | null = null;
  publicUploadStatus = signal<'idle' | 'uploading' | 'done' | 'error'>('idle');
  publicUploadResult = signal<UploadResult | null>(null);
  publicUploadError  = signal<string>('');

  // ── Public gallery ────────────────────────────────────────────────────────
  activeTab      = signal<'catalogue' | 'galerie'>(
    (sessionStorage.getItem('activeTab') as 'catalogue' | 'galerie') ?? 'catalogue'
  );
  galleryItems   = signal<GalleryItem[]>([]);
  galleryPage    = signal(1);
  galleryTotal   = signal(0);
  galleryLoading = signal(false);
  readonly galleryLimit = 24;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') this.isDark.set(true);
    this.syncBodyTheme();

    if (this.activeTab() === 'galerie') this.loadGallery(1);

    const params = new URLSearchParams(window.location.search);
    const screen  = params.get('screen');
    const imageId = params.get('image');

    if (screen && (VALID_SCREENS as readonly string[]).includes(screen)) {
      this.showScreenOnly(screen);
    } else if (imageId && UUID_RE.test(imageId)) {
      // Public image shared via URL
      this.publicImageUrl.set(this.api.mediaUrl(`/media/${imageId}.webp`));
      this.showScreenOnly('public-image');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'q' && this.isFullscreen()) this.exitFullscreen();
    });
  }

  // ── Theme ─────────────────────────────────────────────────────────────────

  toggleDarkMode() {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    this.syncBodyTheme();
  }

  private syncBodyTheme() {
    document.body.classList.toggle('dark', this.isDark());
  }

  // ── Predefined screens ────────────────────────────────────────────────────

  showScreen(type: string) {
    this.currentScreen.set(type);
    setTimeout(() => this.enterFullscreen(), 100);
  }

  showScreenOnly(type: string) {
    this.currentScreen.set(type);
  }

  copyScreenUrl(screen: string) {
    const url = `${window.location.origin}${window.location.pathname}?screen=${screen}`;
    navigator.clipboard.writeText(url).then(() => this.showNotification('Link copied!'));
  }

  // ── Private upload ────────────────────────────────────────────────────────

  onPrivateFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.showNotification('File too large (max 10 MB)');
      return;
    }
    this.privateFile = file;
  }

  uploadPrivate() {
    if (!this.privateFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.customImageUrl.set(e.target?.result as string);
      this.showScreen('custom');
    };
    reader.readAsDataURL(this.privateFile);
  }

  // ── Public upload ─────────────────────────────────────────────────────────

  onPublicFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.showNotification('File too large (max 10 MB)');
      return;
    }
    this.publicFile = file;
    this.publicUploadStatus.set('idle');
    this.publicUploadResult.set(null);
    this.publicUploadError.set('');
  }

  uploadPublic() {
    if (!this.publicFile) return;
    this.publicUploadStatus.set('uploading');
    this.api.uploadPublic(this.publicFile).subscribe({
      next: (result) => {
        this.publicUploadResult.set(result);
        this.publicUploadStatus.set('done');
        this.loadGallery(1);
      },
      error: (err) => {
        this.publicUploadError.set(err?.error?.error ?? 'Upload failed. Please try again.');
        this.publicUploadStatus.set('error');
      },
    });
  }


  copyPublicLink(result: UploadResult) {
    const url = `${window.location.origin}${window.location.pathname}?image=${result.id}`;
    navigator.clipboard.writeText(url).then(() => this.showNotification('Link copied!'));
  }

  resetPublicUpload() {
    this.publicFile = null;
    this.publicUploadStatus.set('idle');
    this.publicUploadResult.set(null);
    this.publicUploadError.set('');
  }

  // ── Legal ─────────────────────────────────────────────────────────────────

  legalPage = signal<string | null>(null);

  openLegal(page: string) { this.legalPage.set(page); }
  closeLegal() { this.legalPage.set(null); }

  // ── Public gallery ────────────────────────────────────────────────────────

  switchToTab(tab: 'catalogue' | 'galerie') {
    this.activeTab.set(tab);
    sessionStorage.setItem('activeTab', tab);
    if (tab === 'galerie' && this.galleryItems().length === 0) this.loadGallery(1);
  }

  loadGallery(page: number) {
    this.galleryLoading.set(true);
    this.galleryPage.set(page);
    this.api.getGallery(page, this.galleryLimit).subscribe({
      next: (res) => {
        this.galleryItems.set(res.items);
        this.galleryTotal.set(res.total);
        this.galleryLoading.set(false);
      },
      error: () => this.galleryLoading.set(false),
    });
  }

  get galleryTotalPages(): number {
    return Math.ceil(this.galleryTotal() / this.galleryLimit);
  }

  copyGalleryLink(item: GalleryItem) {
    const url = `${window.location.origin}${window.location.pathname}?image=${item.id}`;
    navigator.clipboard.writeText(url).then(() => this.showNotification('Link copied!'));
  }

  deleteItem(item: GalleryItem) {
    this.api.deleteUpload(item.id).subscribe({
      next: () => this.loadGallery(this.galleryPage()),
      error: () => this.showNotification('Delete failed.'),
    });
  }

  showPublicImage(item: GalleryItem) {
    this.publicImageUrl.set(this.api.mediaUrl(item.url));
    this.showScreen('public-image');
  }

  // ── Fullscreen ────────────────────────────────────────────────────────────

  enterFullscreen() {
    this.isFullscreen.set(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  enterFullscreenOnClick() {
    if (!this.isFullscreen()) this.enterFullscreen();
  }

  exitFullscreen() {
    this.isFullscreen.set(false);
    this.currentScreen.set('');
    if (document.fullscreenElement) document.exitFullscreen?.();
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  showNotification(message: string) {
    document.querySelector('.notification')?.remove();
    const el = document.createElement('div');
    el.className = 'notification';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}
