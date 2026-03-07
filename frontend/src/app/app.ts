import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  // ── Display state ─────────────────────────────────────────────────────────
  currentScreen = signal<string>('');
  isFullscreen  = signal<boolean>(false);
  isDark        = signal<boolean>(false);
  isSharedLinkView = signal<boolean>(false);

  // ── Private upload (local only, not shareable) ────────────────────────────
  privateFile: File | null = null;
  customImageUrl = signal<string>('');

  // ── Public image display ──────────────────────────────────────────────────
  publicImageUrl = signal<string>('');

  // ── Public upload ─────────────────────────────────────────────────────────
  publicFile: File | null = null;
  publicPreviewUrl = signal<string>('');
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
      this.isSharedLinkView.set(false);
      this.showScreenOnly(screen);
    } else if (imageId && UUID_RE.test(imageId)) {
      // Public image shared via URL
      this.isSharedLinkView.set(true);
      this.publicImageUrl.set(this.api.mediaUrl(`/media/${imageId}.webp`));
      this.showScreenOnly('public-image');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.isSharedLinkView.set(false);
        this.currentScreen.set(this.currentScreen() || 'windows-bsod');
        setTimeout(() => this.enterFullscreen(), 100);
        return;
      }
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
    this.isSharedLinkView.set(false);
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
    if (this.publicPreviewUrl()) URL.revokeObjectURL(this.publicPreviewUrl());
    this.publicFile = file;
    this.publicPreviewUrl.set(URL.createObjectURL(file));
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
    if (this.publicPreviewUrl()) URL.revokeObjectURL(this.publicPreviewUrl());
    this.publicFile = null;
    this.publicPreviewUrl.set('');
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

  // ── Delete captcha flow ──────────────────────────────────────────────────
  deleteTarget = signal<GalleryItem | null>(null);
  deleteStep = signal<1 | 2 | 3 | 4>(1);
  deleteChallengeId = '';
  deleteCaptchaImage = signal<string>('');
  deleteMathQuestion = signal<string>('');
  deleteCaptchaInput = '';
  deleteMathInput: string | number = '';
  deleteTokenInput = '';
  deleteSliderTarget = signal<number>(0);
  deleteSliderValue = signal<number>(500);
  deleteError = signal<string>('');
  deleteCountdown = signal<number>(0);
  deleteLoading = signal<boolean>(false);
  private deleteTimer: ReturnType<typeof setInterval> | null = null;

  deleteItem(item: GalleryItem) {
    this.deleteTarget.set(item);
    this.deleteStep.set(1);
    this.deleteCaptchaInput = '';
    this.deleteMathInput = '';
    this.deleteTokenInput = '';
    this.deleteError.set('');
    this.deleteCaptchaImage.set('');
    this.deleteMathQuestion.set('');
    this.deleteSliderTarget.set(0);
    this.deleteSliderValue.set(50);
    this.deleteCountdown.set(0);
    this.deleteFinalConfirm.set(false);
    this.deleteLoading.set(true);

    this.api.getCaptcha().subscribe({
      next: (res) => {
        this.deleteChallengeId = res.challenge_id;
        this.deleteCaptchaImage.set(res.image);
        this.deleteMathQuestion.set(res.math_question);
        this.deleteLoading.set(false);
      },
      error: () => {
        this.deleteError.set('Failed to load captcha.');
        this.deleteLoading.set(false);
      },
    });
  }

  closeDelete() {
    this.deleteTarget.set(null);
    if (this.deleteTimer) { clearInterval(this.deleteTimer); this.deleteTimer = null; }
  }

  deleteNextStep() {
    const step = this.deleteStep();
    this.deleteError.set('');

    if (step === 1) {
      if (!this.deleteCaptchaInput.trim()) {
        this.deleteError.set('Please enter the captcha code.');
        return;
      }
      this.deleteStep.set(2);
    } else if (step === 2) {
      if (!String(this.deleteMathInput).trim()) {
        this.deleteError.set('Please solve the math problem.');
        return;
      }
      // Generate random slider target (10–90 to avoid edges)
      this.deleteSliderTarget.set(Math.floor(Math.random() * 81) + 10);
      this.deleteSliderValue.set(50);
      this.deleteStep.set(3);
    } else if (step === 3) {
      const diff = Math.abs(this.deleteSliderValue() - this.deleteSliderTarget());
      if (diff > 2) {
        this.deleteError.set('Not precise enough. Try again.');
        return;
      }
      this.deleteStep.set(4);
      this.deleteCountdown.set(10);
      this.deleteTimer = setInterval(() => {
        const c = this.deleteCountdown() - 1;
        this.deleteCountdown.set(c);
        if (c <= 0 && this.deleteTimer) { clearInterval(this.deleteTimer); this.deleteTimer = null; }
      }, 1000);
    }
  }

  deleteFinalConfirm = signal<boolean>(false);

  confirmDelete() {
    const target = this.deleteTarget();
    if (!target || this.deleteCountdown() > 0) return;

    if (!this.deleteFinalConfirm()) {
      this.deleteFinalConfirm.set(true);
      return;
    }

    this.deleteLoading.set(true);
    this.deleteError.set('');

    this.api.deleteUpload({
      id: target.id,
      challenge_id: this.deleteChallengeId,
      captcha_answer: this.deleteCaptchaInput.trim(),
      math_answer: String(this.deleteMathInput).trim(),
    }).subscribe({
      next: () => {
        this.closeDelete();
        this.loadGallery(this.galleryPage());
        this.showNotification('Image deleted.');
      },
      error: (err) => {
        this.deleteLoading.set(false);
        const msg = err?.error?.error ?? 'Deletion failed.';
        this.deleteError.set(msg);
        // If captcha expired or wrong, reload a new one and reset to step 1
        if (msg.includes('captcha') || msg.includes('Captcha') || msg.includes('Wrong')) {
          this.deleteStep.set(1);
          this.deleteCaptchaInput = '';
          this.deleteMathInput = '';
          this.deleteLoading.set(true);
          this.api.getCaptcha().subscribe({
            next: (res) => {
              this.deleteChallengeId = res.challenge_id;
              this.deleteCaptchaImage.set(res.image);
              this.deleteMathQuestion.set(res.math_question);
              this.deleteLoading.set(false);
            },
            error: () => this.deleteLoading.set(false),
          });
        }
      },
    });
  }

  showPublicImage(item: GalleryItem) {
    this.isSharedLinkView.set(false);
    this.publicImageUrl.set(this.api.mediaUrl(item.url));
    this.showScreen('public-image');
  }

  // ── Report ──────────────────────────────────────────────────────────────────
  reportItem = signal<GalleryItem | null>(null);
  reportStatus = signal<'idle' | 'sending' | 'done'>('idle');
  reportReason = '';
  reportDescription = '';
  reportEmail = '';

  openReport(item: GalleryItem) {
    this.reportItem.set(item);
    this.reportStatus.set('idle');
    this.reportReason = '';
    this.reportDescription = '';
    this.reportEmail = '';
  }

  closeReport() {
    this.reportItem.set(null);
  }

  submitReport(event: Event) {
    event.preventDefault();
    if (!this.reportReason || !this.reportItem()) return;
    this.reportStatus.set('sending');

    const item = this.reportItem()!;
    const imageUrl = `${window.location.origin}?image=${item.id}`;
    const reasons: Record<string, string> = {
      illegal: 'Illegal content',
      hate: 'Hateful / discriminatory content',
      nsfw: 'Pornographic content',
      copyright: 'Copyright infringement',
      personal: 'Exposed personal data',
      other: 'Other',
    };

    const fields = [
      { name: 'Image ID', value: `\`${item.id}\``, inline: true },
      { name: 'Reason', value: reasons[this.reportReason] ?? this.reportReason, inline: true },
      { name: 'Link', value: imageUrl, inline: false },
    ];
    if (this.reportDescription) {
      fields.push({ name: 'Description', value: this.reportDescription, inline: false });
    }
    if (this.reportEmail) {
      fields.push({ name: 'Contact email', value: this.reportEmail, inline: false });
    }

    const payload = {
      embeds: [{
        title: 'Image Report',
        color: 0xeab308,
        fields,
        thumbnail: { url: this.api.mediaUrl(item.url) },
        timestamp: new Date().toISOString(),
      }],
    };

    this.http.post(
      'https://discord.com/api/webhooks/1479879300667932846/-XuQVmUvOfSi7CFEM4mGst8NplxTaFhgeulkHmuM4k5SsyUFd8r1GXS-QkMAtQ72B0LK',
      payload
    ).subscribe({
      next: () => this.reportStatus.set('done'),
      error: () => {
        this.reportStatus.set('idle');
        this.showNotification('Failed to send report.');
      },
    });
  }

  // ── Cookies ────────────────────────────────────────────────────────────────
  cookieAccepted = signal<boolean>(localStorage.getItem('cookieAccepted') === 'true');

  acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
    this.cookieAccepted.set(true);
  }

  // ── Gallery image layout ──────────────────────────────────────────────────

  onGalleryImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    const ratio = img.naturalWidth / img.naturalHeight;
    const item = img.closest('.gallery-item') as HTMLElement;
    if (item) {
      item.style.flexGrow = String(ratio);
      item.style.flexBasis = `${180 * ratio}px`;
      item.style.aspectRatio = String(ratio);
    }
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

