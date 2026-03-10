import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from './services/admin.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, UpperCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  isAuthenticated = signal(false);
  loginError = signal('');
  loginLoading = signal(false);
  username = '';
  password = '';

  kpis = signal<any>(null);
  loading = signal(false);
  lastRefresh = signal<string>('');
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    if (this.admin.hasToken()) {
      this.isAuthenticated.set(true);
      this.loadDashboard();
      this.startAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  login(e: Event): void {
    e.preventDefault();
    this.loginError.set('');
    this.loginLoading.set(true);

    this.admin.login(this.username, this.password).subscribe({
      next: (res) => {
        this.admin.setToken(res.token);
        this.isAuthenticated.set(true);
        this.loginLoading.set(false);
        this.password = '';
        this.loadDashboard();
        this.startAutoRefresh();
      },
      error: (err) => {
        this.loginLoading.set(false);
        this.loginError.set(err.error?.error || 'Connection failed');
      },
    });
  }

  logout(): void {
    this.admin.clearToken();
    this.isAuthenticated.set(false);
    this.kpis.set(null);
    this.stopAutoRefresh();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.admin.getKpis().subscribe({
      next: (data) => {
        this.kpis.set(data);
        this.loading.set(false);
        this.lastRefresh.set(new Date().toLocaleTimeString());
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.logout();
        }
      },
    });
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.loadDashboard(), 30_000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleString();
  }

  formatDay(ts: number): string {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  ciLabel(type: string): string {
    const labels: Record<string, string> = {
      trivy: 'Trivy Scan',
      sonarqube: 'SonarQube',
      angular_tests: 'Angular Tests',
    };
    return labels[type] || type;
  }

  dailyBarHeight(count: number): number {
    const k = this.kpis();
    if (!k?.uploads?.daily) return 0;
    const max = Math.max(...k.uploads.daily.map((d: any) => d.count), 1);
    return Math.max((count / max) * 100, 2);
  }
}
