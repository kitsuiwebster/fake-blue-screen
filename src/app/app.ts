import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fake-blue-screen');
  
  currentScreen = signal<string>('');
  isFullscreen = signal<boolean>(false);
  selectedFile: File | null = null;
  customImageUrl = signal<string>('');
  shareUrl = signal<string>('');

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    const screen = urlParams.get('screen');
    const imageUrl = urlParams.get('image');
    
    if (screen && ['windows-bsod', 'windows-working-bsod', 'macos-panic', 'linux-panic-black', 'linux-panic-pink', 'linux-panic-purple'].includes(screen)) {
      this.showScreenOnly(screen);
    } else if (imageUrl) {
      this.customImageUrl.set(decodeURIComponent(imageUrl));
      this.showScreenOnly('custom');
    }


  }

  showScreen(type: string) {
    this.currentScreen.set(type);
    this.generateShareUrl();
    setTimeout(() => this.enterFullscreen(), 100);
  }

  showScreenOnly(type: string) {
    this.currentScreen.set(type);
    this.generateShareUrl();
  }

  uploadCustom() {
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.customImageUrl.set(e.target?.result as string);
        this.showScreen('custom');
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onFileSelect(event: any) {
    this.selectedFile = event.target.files[0];
  }

  enterFullscreen() {
    this.isFullscreen.set(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen not available:', err);
      });
    }
  }

  enterFullscreenOnClick() {
    if (!this.isFullscreen()) {
      this.enterFullscreen();
    }
  }

  exitFullscreen() {
    this.isFullscreen.set(false);
    this.currentScreen.set('');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  generateShareUrl() {
    const baseUrl = window.location.origin + window.location.pathname;
    const screen = this.currentScreen();
    
    if (screen === 'custom' && this.customImageUrl()) {
      this.shareUrl.set(`${baseUrl}?image=${encodeURIComponent(this.customImageUrl())}`);
    } else if (screen !== 'custom') {
      this.shareUrl.set(`${baseUrl}?screen=${screen}`);
    }
  }

  generateUrl(screen: string) {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?screen=${screen}`;
    this.shareUrl.set(url);
  }

  copyScreenUrl(screen: string) {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?screen=${screen}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showNotification('Link copied to clipboard!');
    });
  }

  showNotification(message: string) {
    // Supprimer toute notification existante
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
    
    // Créer une nouvelle notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animer l'entrée
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 10);
    
    // L'enlever après 2 secondes
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 2000);
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.shareUrl()).then(() => {
      alert('URL copied to clipboard!');
    });
  }

}