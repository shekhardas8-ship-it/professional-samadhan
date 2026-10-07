import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

// Interface for Drive upload result
export interface DriveUploadResult {
  fileId: string;
  storagePath: string;
  webViewLink?: string;
  webContentLink?: string;
  folderId?: string;
  isGoogleDrive: boolean;
}

class GoogleDriveService {
  private driveClient: any = null;
  private isConfigured: boolean = false;
  private rootFolderId: string = '';

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '';

      let auth: any = null;

      // 0. Check OAuth 2.0 credentials (Direct personal @gmail.com & Google Workspace)
      if (
        process.env.GOOGLE_DRIVE_CLIENT_ID &&
        process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
        process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      ) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_DRIVE_CLIENT_ID,
          process.env.GOOGLE_DRIVE_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
        });
        auth = oauth2Client;
        console.log('[GoogleDriveService] Initialized using OAuth 2.0 User Delegation.');
      }
      // 1. Check if raw JSON credentials provided
      else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
        let credentials: any;
        if (rawKey.startsWith('{')) {
          credentials = JSON.parse(rawKey);
        } else if (fs.existsSync(rawKey)) {
          credentials = JSON.parse(fs.readFileSync(rawKey, 'utf-8'));
        }

        if (credentials && credentials.client_email && credentials.private_key) {
          auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/drive'],
          });
        }
      } 
      // 2. Check individual environment variables
      else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        auth = new google.auth.JWT({
          email: process.env.GOOGLE_CLIENT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      }
      // 3. Fallback to default credentials file if exists in project root
      else {
        const defaultSaPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(defaultSaPath)) {
          const credentials = JSON.parse(fs.readFileSync(defaultSaPath, 'utf-8'));
          auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/drive'],
          });
        }
      }

      if (auth) {
        this.driveClient = google.drive({ version: 'v3', auth });
        this.isConfigured = true;
        console.log('[GoogleDriveService] Google Drive integration initialized successfully.');
      } else {
        console.log('[GoogleDriveService] No Google Service Account key found. Operating in local storage mode with Drive-ready API endpoints.');
      }
    } catch (err: any) {
      console.warn('[GoogleDriveService] Failed to initialize Google Drive client:', err.message);
      this.isConfigured = false;
    }
  }

  public isEnabled(): boolean {
    return this.isConfigured && !!this.driveClient;
  }

  /**
   * Finds an existing folder by name inside parentFolderId, or creates a new one.
   */
  private async getOrCreateFolder(parentFolderId: string, folderName: string): Promise<string> {
    if (!this.driveClient) throw new Error('Drive client not initialized');

    const cleanName = folderName.replace(/['"\\]/g, '');
    let q = `mimeType='application/vnd.google-apps.folder' and name='${cleanName}' and trashed=false`;
    if (parentFolderId) {
      q += ` and '${parentFolderId}' in parents`;
    }

    const res = await this.driveClient.files.list({
      q,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    // Folder doesn't exist, create it
    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const folder = await this.driveClient.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id;
  }

  /**
   * Uploads a document to Google Drive organized into:
   * [Root Folder] -> [Client: Name (GSTIN)] -> [Period: Month Year] -> filename
   */
  public async uploadDocument(params: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    clientName: string;
    clientGstin: string;
    reportingPeriod: string;
    localTempPath?: string;
  }): Promise<DriveUploadResult> {
    const { fileName, mimeType, buffer, clientName, clientGstin, reportingPeriod, localTempPath } = params;

    if (!this.isEnabled()) {
      // Local fallback mode: preserve local path
      return {
        fileId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        storagePath: localTempPath || '',
        isGoogleDrive: false,
      };
    }

    try {
      // 1. Resolve client folder: e.g. "sonu (07ABCDE1234F1Z2)"
      const clientFolderName = `${clientName.trim()} (${clientGstin.trim()})`;
      const clientFolderId = await this.getOrCreateFolder(this.rootFolderId, clientFolderName);

      // 2. Resolve reporting period folder: e.g. "August 2026"
      const periodFolderId = await this.getOrCreateFolder(clientFolderId, reportingPeriod.trim());

      // 3. Upload file stream
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null); // End of stream

      const driveRes = await this.driveClient.files.create({
        requestBody: {
          name: fileName,
          parents: [periodFolderId],
        },
        media: {
          mimeType: mimeType || 'application/octet-stream',
          body: stream,
        },
        fields: 'id, name, webViewLink, webContentLink, size',
      });

      const driveFile = driveRes.data;

      // 4. Safely delete local temporary file now that it's permanently stored on Google Drive
      if (localTempPath && fs.existsSync(localTempPath)) {
        try {
          fs.unlinkSync(localTempPath);
        } catch (e) {
          // ignore cleanup error
        }
      }

      return {
        fileId: driveFile.id,
        storagePath: `gdrive://${driveFile.id}`,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        folderId: periodFolderId,
        isGoogleDrive: true,
      };
    } catch (err: any) {
      console.error('[GoogleDriveService] Error uploading to Google Drive, falling back to local storage:', err.message);
      return {
        fileId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        storagePath: localTempPath || '',
        isGoogleDrive: false,
      };
    }
  }

  /**
   * Retrieves a readable download stream for a Google Drive file by ID.
   */
  public async getDownloadStream(fileId: string): Promise<NodeJS.ReadableStream> {
    if (!this.isEnabled()) {
      throw new Error('Google Drive integration is not active.');
    }

    const res = await this.driveClient.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return res.data;
  }

  /**
   * Gets metadata for a Google Drive file.
   */
  public async getFileMetadata(fileId: string) {
    if (!this.isEnabled()) return null;
    try {
      const res = await this.driveClient.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink',
      });
      return res.data;
    } catch (err) {
      return null;
    }
  }
}

export const googleDriveStorage = new GoogleDriveService();
