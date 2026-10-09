// src/services/firebaseCrashlytics.ts
/**
 * QuinceCA - Firebase Crashlytics & Bug Scrub Architecture
 * Professional Web Crash Reporting, Unhandled Exception Telemetry,
 * User Breadcrumbs Recording & Bug Scrubbing Management.
 */

import { analytics } from '../lib/firebase.ts';
import { logEvent } from 'firebase/analytics';

export interface Breadcrumb {
  timestamp: string;
  category: 'ui' | 'network' | 'navigation' | 'auth' | 'system';
  message: string;
  level: 'info' | 'warn' | 'error';
  data?: Record<string, any>;
}

export interface CrashReport {
  id: string;
  timestamp: string;
  lastSeen: string;
  message: string;
  name: string;
  stack?: string;
  componentStack?: string;
  fatal: boolean;
  type: 'UNHANDLED_ERROR' | 'PROMISE_REJECTION' | 'REACT_RENDER' | 'NETWORK_FAILURE' | 'MANUAL_RECORD';
  fingerprint: string;
  url: string;
  userAgent: string;
  viewport: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  breadcrumbs: Breadcrumb[];
  customKeys: Record<string, any>;
  status: 'new' | 'triaged' | 'resolved' | 'ignored';
  scrubNotes?: string;
  occurrences: number;
}

const STORAGE_KEY = 'quinceca_crashlytics_reports';
const BREADCRUMBS_KEY = 'quinceca_crashlytics_breadcrumbs';
const MAX_BREADCRUMBS = 40;
const MAX_STORED_CRASHES = 50;

class FirebaseCrashlyticsService {
  private isInitialized = false;
  private isCollectionEnabled = true;
  private breadcrumbsRing: Breadcrumb[] = [];
  private customKeys: Record<string, any> = {};
  private currentUserId?: string;
  private currentUserEmail?: string;
  private currentUserRole?: string;

  constructor() {
    this.loadCachedBreadcrumbs();
  }

  /**
   * Initializes global error listeners and crash handlers
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Restore cached user session if available
    try {
      const storedUser = localStorage.getItem('ps_auth_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        this.currentUserId = u.id || u.uid;
        this.currentUserEmail = u.email;
        this.currentUserRole = u.role;
      }
    } catch (_) {}

    // Global Unhandled Error listener
    window.addEventListener('error', (event: ErrorEvent) => {
      this.handleGlobalError(event);
    });

    // Global Unhandled Promise Rejection listener
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.handleUnhandledRejection(event);
    });

    // Navigation & Click Breadcrumb auto-tracking
    this.setupAutoBreadcrumbs();

    this.isInitialized = true;
    this.log('Firebase Crashlytics initialized & monitoring active', 'system', 'info');
  }

  /**
   * Enables or disables crash collection
   */
  public setCrashlyticsCollectionEnabled(enabled: boolean): void {
    this.isCollectionEnabled = enabled;
  }

  /**
   * Sets current user identity for error reports
   */
  public setUserId(userId: string, email?: string, role?: string): void {
    this.currentUserId = userId;
    if (email) this.currentUserEmail = email;
    if (role) this.currentUserRole = role;
    this.log(`User session set: ${userId} (${email || 'No email'})`, 'auth', 'info');
  }

  /**
   * Sets a custom attribute key-value pair
   */
  public setCustomKey(key: string, value: any): void {
    this.customKeys[key] = value;
  }

  /**
   * Records a user action / breadcrumb in the session timeline
   */
  public log(
    message: string,
    category: Breadcrumb['category'] = 'ui',
    level: Breadcrumb['level'] = 'info',
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbsRing.push(breadcrumb);
    if (this.breadcrumbsRing.length > MAX_BREADCRUMBS) {
      this.breadcrumbsRing.shift();
    }
    this.saveCachedBreadcrumbs();
  }

  /**
   * Primary Crashlytics method to record caught or uncaught exceptions
   */
  public recordError(
    error: Error | string,
    fatal = false,
    context?: {
      componentStack?: string;
      type?: CrashReport['type'];
      customKeys?: Record<string, any>;
    }
  ): CrashReport | null {
    if (!this.isCollectionEnabled) return null;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const message = errorObj?.message || String(error);
    const name = errorObj?.name || 'Error';
    const stack = errorObj?.stack || '';
    const componentStack = context?.componentStack;
    const type = context?.type || (fatal ? 'REACT_RENDER' : 'MANUAL_RECORD');

    // Generate stable fingerprint for deduplication
    const fingerprint = this.computeFingerprint(name, message, stack);

    const report: CrashReport = {
      id: `crash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      message,
      name,
      stack,
      componentStack,
      fatal,
      type,
      fingerprint,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '1920x1080',
      userId: this.currentUserId,
      userEmail: this.currentUserEmail,
      userRole: this.currentUserRole,
      breadcrumbs: [...this.breadcrumbsRing],
      customKeys: { ...this.customKeys, ...(context?.customKeys || {}) },
      status: 'new',
      occurrences: 1,
    };

    // 1. Save locally to browser ring-buffer
    this.saveReportLocally(report);

    // 2. Dispatch to backend API
    this.dispatchReportToBackend(report);

    // 3. Send to Firebase Analytics exception stream (if available)
    if (analytics) {
      try {
        logEvent(analytics, 'exception', {
          description: `${name}: ${message}`.slice(0, 100),
          fatal,
          error_name: name,
        });
      } catch (_) {}
    }

    // 4. Notify UI via custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quinceca_crashlytics_new_report', { detail: report }));
    }

    return report;
  }

  /**
   * Triggers a safe test crash to test and verify Crashlytics & Bug Scrub pipeline
   */
  public triggerTestCrash(fatal = false): CrashReport | null {
    this.log('User manually triggered a test crash simulation', 'system', 'warn');
    const testError = new Error(
      fatal
        ? 'Firebase Crashlytics Simulated Fatal Crash: Unhandled NullPointer in Practice Engine'
        : 'Firebase Crashlytics Simulated Non-Fatal Exception: Reconcile Warning u/s 143(1)'
    );
    testError.name = fatal ? 'FatalEngineException' : 'StatutoryReconciliationWarning';
    return this.recordError(testError, fatal, {
      type: fatal ? 'UNHANDLED_ERROR' : 'MANUAL_RECORD',
      customKeys: { isSimulation: true, triggeredAt: new Date().toISOString() },
    });
  }

  /**
   * Retrieves all crashes from local browser storage
   */
  public getStoredCrashes(): CrashReport[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  /**
   * Clears stored local crashes
   */
  public clearLocalCrashes(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Updates a crash status locally
   */
  public updateCrashStatusLocally(id: string, status: CrashReport['status'], notes?: string): void {
    const list = this.getStoredCrashes();
    const updated = list.map(c => {
      if (c.id === id) {
        return { ...c, status, scrubNotes: notes !== undefined ? notes : c.scrubNotes };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // --- Private Helpers ---

  private handleGlobalError(event: ErrorEvent): void {
    const error = event.error || new Error(event.message || 'Unknown Global Window Error');
    this.recordError(error, true, {
      type: 'UNHANDLED_ERROR',
      customKeys: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    let message = 'Unhandled Promise Rejection';
    let stack = '';
    let name = 'UnhandledRejection';

    if (event.reason instanceof Error) {
      message = event.reason.message;
      stack = event.reason.stack || '';
      name = event.reason.name;
    } else if (typeof event.reason === 'string') {
      message = event.reason;
    } else if (typeof event.reason === 'object' && event.reason !== null) {
      try {
        message = JSON.stringify(event.reason);
      } catch (_) {
        message = String(event.reason);
      }
    }

    const err = new Error(message);
    err.name = name;
    if (stack) err.stack = stack;

    this.recordError(err, false, {
      type: 'PROMISE_REJECTION',
    });
  }

  private setupAutoBreadcrumbs(): void {
    if (typeof window === 'undefined') return;

    // Track user clicks on buttons and links
    window.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const clickable = target.closest('button, a, input[type="submit"]');
      if (clickable) {
        const text = (clickable.textContent || '').trim().slice(0, 30);
        const tag = clickable.tagName.toLowerCase();
        const id = clickable.id ? `#${clickable.id}` : '';
        this.log(`Clicked <${tag}${id}> "${text}"`, 'ui', 'info');
      }
    }, { passive: true });

    // Track URL popstate navigation
    window.addEventListener('popstate', () => {
      this.log(`Navigated to ${window.location.pathname}`, 'navigation', 'info');
    });
  }

  private computeFingerprint(name: string, message: string, stack?: string): string {
    let cleanStackLine = '';
    if (stack) {
      const lines = stack.split('\n');
      if (lines.length > 1) {
        cleanStackLine = lines[1].trim().replace(/\(.*?\)/, '').slice(0, 80);
      }
    }
    const raw = `${name}:${message.slice(0, 60)}@${cleanStackLine}`;
    return raw.replace(/[^a-zA-Z0-9:@._-]/g, '_');
  }

  private saveReportLocally(report: CrashReport): void {
    try {
      const current = this.getStoredCrashes();
      // Check if report with same fingerprint exists
      const existingIdx = current.findIndex(c => c.fingerprint === report.fingerprint);
      if (existingIdx >= 0) {
        current[existingIdx].occurrences = (current[existingIdx].occurrences || 1) + 1;
        current[existingIdx].lastSeen = report.timestamp;
        current[existingIdx].breadcrumbs = report.breadcrumbs;
        if (report.status === 'resolved') current[existingIdx].status = 'new'; // Reopened
      } else {
        current.unshift(report);
      }

      if (current.length > MAX_STORED_CRASHES) {
        current.length = MAX_STORED_CRASHES;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (_) {}
  }

  private dispatchReportToBackend(report: CrashReport): void {
    try {
      const payload = JSON.stringify(report);
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry/crash-report', blob);
      } else {
        fetch('/api/telemetry/crash-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (_) {}
  }

  private loadCachedBreadcrumbs(): void {
    try {
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem(BREADCRUMBS_KEY);
        if (raw) this.breadcrumbsRing = JSON.parse(raw);
      }
    } catch (_) {}
  }

  private saveCachedBreadcrumbs(): void {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(BREADCRUMBS_KEY, JSON.stringify(this.breadcrumbsRing));
      }
    } catch (_) {}
  }
}

export const firebaseCrashlytics = new FirebaseCrashlyticsService();
