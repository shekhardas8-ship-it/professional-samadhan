// src/services/baileysService.ts
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import QRCode from 'qrcode';
import { createPool } from '../db/index.ts';

// Dynamic imports to handle ESM/CJS compatibility cleanly
let makeWASocket: any;
let DisconnectReason: any;
let useMultiFileAuthState: any;
let fetchLatestBaileysVersion: any;

export interface WhatsAppSessionStatus {
  status: 'connected' | 'connecting' | 'qr_ready' | 'disconnected' | 'error';
  qrCodeDataUrl?: string | null;
  connectedPhone?: string | null;
  connectedName?: string | null;
  lastConnectedAt?: string | null;
  errorMessage?: string | null;
  authSessionPath: string;
}

class BaileysWhatsAppManager {
  private sock: any = null;
  private qrCodeDataUrl: string | null = null;
  private status: 'connected' | 'connecting' | 'qr_ready' | 'disconnected' | 'error' = 'disconnected';
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private lastConnectedAt: string | null = null;
  private errorMessage: string | null = null;
  private sessionDir = path.resolve(process.cwd(), 'wa_auth_session');
  private isInitializing = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  private async loadBaileysModules() {
    if (!makeWASocket) {
      const baileys = await import('@whiskeysockets/baileys');
      makeWASocket = baileys.default || baileys.makeWASocket;
      DisconnectReason = baileys.DisconnectReason;
      useMultiFileAuthState = baileys.useMultiFileAuthState;
      fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
    }
  }

  private async restoreSessionFromDb(): Promise<void> {
    try {
      const pool = createPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_sessions (
          key text PRIMARY KEY,
          data jsonb NOT NULL,
          updated_at timestamp DEFAULT now()
        );
      `);
      const res = await pool.query(`SELECT data FROM system_sessions WHERE key = 'baileys_auth_session' LIMIT 1;`);
      if (res.rows.length > 0 && res.rows[0].data) {
        const filesMap = res.rows[0].data as Record<string, string>;
        if (!fs.existsSync(this.sessionDir)) {
          fs.mkdirSync(this.sessionDir, { recursive: true });
        }
        for (const [filename, content] of Object.entries(filesMap)) {
          const filePath = path.join(this.sessionDir, filename);
          fs.writeFileSync(filePath, content, 'utf-8');
        }
        console.log(`[WhatsApp Auth] Restored ${Object.keys(filesMap).length} auth keys from cloud database.`);
      }
    } catch (e: any) {
      console.warn('[WhatsApp Auth] Failed to restore session from DB:', e?.message || e);
    }
  }

  private async backupSessionToDb(): Promise<void> {
    try {
      if (!fs.existsSync(this.sessionDir)) return;
      const fileNames = fs.readdirSync(this.sessionDir);
      const filesMap: Record<string, string> = {};
      for (const fn of fileNames) {
        if (fn.endsWith('.json')) {
          const fullPath = path.join(this.sessionDir, fn);
          try {
            filesMap[fn] = fs.readFileSync(fullPath, 'utf-8');
          } catch (_) {}
        }
      }
      if (Object.keys(filesMap).length > 0) {
        const pool = createPool();
        await pool.query(`
          CREATE TABLE IF NOT EXISTS system_sessions (
            key text PRIMARY KEY,
            data jsonb NOT NULL,
            updated_at timestamp DEFAULT now()
          );
          INSERT INTO system_sessions (key, data, updated_at)
          VALUES ('baileys_auth_session', $1, now())
          ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = now();
        `, [JSON.stringify(filesMap)]);
      }
    } catch (e: any) {
      console.warn('[WhatsApp Auth] Failed to backup session to DB:', e?.message || e);
    }
  }

  private async clearDbSession(): Promise<void> {
    try {
      const pool = createPool();
      await pool.query(`DELETE FROM system_sessions WHERE key = 'baileys_auth_session';`);
    } catch (_) {}
  }

  public async initialize(): Promise<void> {
    if (this.isConnected()) {
      return;
    }
    if (this.isInitializing) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isInitializing = true;
    this.status = 'connecting';
    this.errorMessage = null;

    // Cleanly terminate previous socket if any
    if (this.sock) {
      try {
        this.sock.ev?.removeAllListeners?.();
        this.sock.end?.();
      } catch (_) {}
      this.sock = null;
    }

    try {
      await this.loadBaileysModules();
      await this.restoreSessionFromDb();

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
      let version = [2, 3000, 1015901307];
      try {
        const v = await fetchLatestBaileysVersion();
        if (v && v.version) version = v.version;
      } catch (_) {}

      const socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Professional Samadhan', 'Chrome', '120.0.0'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      this.sock = socket;

      // Save credentials on updates
      socket.ev.on('creds.update', async () => {
        await saveCreds();
        await this.backupSessionToDb();
      });

      // Handle connection lifecycle
      socket.ev.on('connection.update', async (update: any) => {
        // If this event is from an obsolete socket instance, ignore
        if (this.sock !== socket) return;

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 320,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            this.status = 'qr_ready';
            console.log('[WhatsApp Open-Source] 📱 New QR code generated. Ready for scan from phone.');
          } catch (err: any) {
            console.error('[WhatsApp Open-Source] Failed to render QR code:', err);
          }
        }

        if (connection === 'connecting') {
          if (!this.qrCodeDataUrl && this.status !== 'connected') {
            this.status = 'connecting';
          }
        } else if (connection === 'open') {
          this.status = 'connected';
          this.qrCodeDataUrl = null;
          this.reconnectAttempts = 0;
          this.lastConnectedAt = new Date().toISOString();
          this.errorMessage = null;

          const rawId = socket?.user?.id || '';
          const phoneDigits = rawId.split(':')[0] || rawId.split('@')[0];
          this.connectedPhone = phoneDigits ? `+${phoneDigits}` : '+91 98738 75138';
          this.connectedName = socket?.user?.name || 'Professional Samadhan Official';

          console.log(`[WhatsApp Open-Source] 🎉 Successfully connected to WhatsApp as ${this.connectedPhone} (${this.connectedName})! 1-time setup active.`);
          await this.backupSessionToDb();
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          console.log(`[WhatsApp Open-Source] Connection closed with status code: ${statusCode}`);

          if (statusCode === DisconnectReason?.loggedOut || statusCode === 401) {
            this.status = 'disconnected';
            this.connectedPhone = null;
            this.connectedName = null;
            this.qrCodeDataUrl = null;
            this.sock = null;
            this.clearSessionFolder();
            console.log('[WhatsApp Open-Source] Device unlinked / logged out from phone. Session cleared.');
          } else if (statusCode === DisconnectReason?.connectionReplaced || statusCode === 440) {
            console.log('[WhatsApp Open-Source] Socket session replaced by another connection.');
            this.status = 'disconnected';
            this.sock = null;
          } else {
            // Transient disconnect (e.g. 515 restartRequired, 408 timeout, 428 connectionClosed)
            this.status = 'connecting';
            this.sock = null;
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              const delayMs = this.reconnectAttempts * 3000;
              console.log(`[WhatsApp Open-Source] Reconnecting in ${delayMs / 1000}s (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              this.reconnectTimer = setTimeout(() => {
                this.isInitializing = false;
                this.initialize();
              }, delayMs);
            } else {
              this.status = 'disconnected';
              this.errorMessage = 'WhatsApp connection interrupted. Click "Reconnect" or generate a new QR code.';
            }
          }
        }
      });
    } catch (err: any) {
      console.error('[WhatsApp Open-Source] Initialization error:', err);
      this.status = 'error';
      this.errorMessage = err.message || 'Failed to initialize WhatsApp engine';
    } finally {
      this.isInitializing = false;
    }
  }

  public async requestPairingCode(phone: string): Promise<string> {
    const cleanDigits = phone.replace(/\D/g, '');
    const targetPhone = cleanDigits.length === 10 ? '91' + cleanDigits : cleanDigits;

    if (!this.sock) {
      await this.initialize();
    }

    if (this.sock?.requestPairingCode) {
      const code = await this.sock.requestPairingCode(targetPhone);
      return code;
    }
    throw new Error('Pairing code not supported by this WhatsApp engine version');
  }

  public getStatus(): WhatsAppSessionStatus {
    return {
      status: this.status,
      qrCodeDataUrl: this.qrCodeDataUrl,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      lastConnectedAt: this.lastConnectedAt,
      errorMessage: this.errorMessage,
      authSessionPath: this.sessionDir,
    };
  }

  public isConnected(): boolean {
    return this.status === 'connected' && !!this.sock;
  }

  private normalizeToJid(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      clean = '91' + clean;
    }
    return `${clean}@s.whatsapp.net`;
  }

  public async sendTextMessage(to: string, messageText: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConnected()) {
      return { success: false, error: 'WhatsApp is not currently connected. Please link device first.' };
    }

    try {
      const jid = this.normalizeToJid(to);
      const res = await this.sock.sendMessage(jid, { text: messageText });
      return {
        success: true,
        messageId: res?.key?.id || `wa_${Date.now()}`,
      };
    } catch (err: any) {
      console.error(`[WhatsApp Open-Source] Failed to send message to ${to}:`, err);
      return { success: false, error: err.message || 'Failed to send WhatsApp message' };
    }
  }

  public async sendDocument(
    to: string,
    fileBuffer: Buffer,
    fileName: string,
    caption?: string,
    mimetype = 'application/pdf'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConnected()) {
      return { success: false, error: 'WhatsApp is not currently connected. Please link device first.' };
    }

    try {
      const jid = this.normalizeToJid(to);
      const res = await this.sock.sendMessage(jid, {
        document: fileBuffer,
        fileName,
        caption: caption || fileName,
        mimetype,
      });
      return {
        success: true,
        messageId: res?.key?.id || `wa_doc_${Date.now()}`,
      };
    } catch (err: any) {
      console.error(`[WhatsApp Open-Source] Failed to send document to ${to}:`, err);
      return { success: false, error: err.message || 'Failed to send WhatsApp document' };
    }
  }

  public async logout(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      if (this.sock) {
        this.sock.ev?.removeAllListeners?.();
        await this.sock.logout?.();
        this.sock.end?.();
      }
    } catch (_) {}

    this.clearSessionFolder();
    this.status = 'disconnected';
    this.connectedPhone = null;
    this.connectedName = null;
    this.qrCodeDataUrl = null;
    this.sock = null;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
  }

  private clearSessionFolder() {
    this.clearDbSession().catch(() => {});
    try {
      if (fs.existsSync(this.sessionDir)) {
        const files = fs.readdirSync(this.sessionDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.sessionDir, file));
        }
      }
    } catch (err) {
      console.error('[WhatsApp Open-Source] Failed to clear session files:', err);
    }
  }
}

export const baileysWhatsAppManager = new BaileysWhatsAppManager();

