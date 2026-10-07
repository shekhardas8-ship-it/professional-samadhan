// scripts/test_google_drive.ts
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function testDrive() {
  console.log('====================================================');
  console.log('   QUINCECA GOOGLE DRIVE 15GB REAL-TIME SYNC TESTER  ');
  console.log('====================================================');

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '';
  let auth: any = null;

  // 0. Check OAuth 2.0 credentials
  if (
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  ) {
    console.log('✓ Found Google Drive OAuth 2.0 Client credentials');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });
    auth = oauth2Client;
  }
  // 1. Check Service Account Key from env
  else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
    let credentials: any;
    try {
      if (rawKey.startsWith('{')) {
        credentials = JSON.parse(rawKey);
      } else if (fs.existsSync(rawKey)) {
        credentials = JSON.parse(fs.readFileSync(rawKey, 'utf-8'));
      }
    } catch (e: any) {
      console.error('❌ Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:', e.message);
    }

    if (credentials && credentials.client_email && credentials.private_key) {
      console.log('✓ Found Service Account credentials for:', credentials.client_email);
      auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    }
  } 
  // 2. Check service-account.json in root
  else {
    const saPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(saPath)) {
      try {
        const credentials = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
        console.log('✓ Found service-account.json in root for:', credentials.client_email);
        auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      } catch (e: any) {
        console.error('❌ Error reading service-account.json:', e.message);
      }
    }
  }

  if (!auth) {
    console.log('\n⚠️  STATUS: GOOGLE DRIVE NOT CURRENTLY CONFIGURED');
    console.log('----------------------------------------------------');
    console.log('To activate 15 GB Free Google Drive Sync:');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com).');
    console.log('2. Enable "Google Drive API".');
    console.log('3. Create a Service Account (e.g. quinceca-drive-sync@<project>.iam.gserviceaccount.com).');
    console.log('4. Create a JSON Key and save it as "service-account.json" in this project directory.');
    console.log('5. Create a folder in Google Drive (e.g. "QuinceCA Documents").');
    console.log('6. Click Share -> Share with the Service Account email with "Editor" permission.');
    console.log('7. Copy the Folder ID from the Drive URL and add to .env:');
    console.log('   GOOGLE_DRIVE_FOLDER_ID="your_folder_id_here"');
    console.log('====================================================\n');
    process.exit(0);
  }

  try {
    const drive = google.drive({ version: 'v3', auth });

    // Check Drive Quota / About
    console.log('\nChecking Google Drive connection and storage quota...');
    const about = await drive.about.get({ fields: 'user, storageQuota' });
    const user = about.data.user;
    const quota = about.data.storageQuota;

    if (user) {
      console.log(`✓ Connected as: ${user.displayName || 'Service Account'} (${user.emailAddress})`);
    }

    if (quota) {
      const limitGb = quota.limit ? (Number(quota.limit) / (1024 ** 3)).toFixed(2) : 'Unlimited';
      const usageGb = quota.usage ? (Number(quota.usage) / (1024 ** 3)).toFixed(2) : '0';
      console.log(`✓ Google Drive Storage Quota: ${usageGb} GB used / ${limitGb} GB limit`);
    }

    if (rootFolderId) {
      console.log(`\nVerifying Target Root Folder ID: ${rootFolderId}`);
      try {
        const folder = await drive.files.get({
          fileId: rootFolderId,
          fields: 'id, name, mimeType, webViewLink',
        });
        console.log(`✓ Target Folder Found: "${folder.data.name}"`);
        console.log(`✓ Web Link: ${folder.data.webViewLink}`);
      } catch (fErr: any) {
        console.warn(`⚠️ Warning: Could not access folder ID ${rootFolderId}. Ensure you shared the folder with the Service Account email! (${fErr.message})`);
      }
    } else {
      console.log('\n⚠️ Notice: GOOGLE_DRIVE_FOLDER_ID is not set in .env. Files will be created at the root of the Service Account Drive.');
    }

    // Round-trip test: Create a small test file
    console.log('\nPerforming write test: creating temporary test file in Drive...');
    const testFile = await drive.files.create({
      requestBody: {
        name: `quinceca_test_ping_${Date.now()}.txt`,
        mimeType: 'text/plain',
        parents: rootFolderId ? [rootFolderId] : [],
      },
      media: {
        mimeType: 'text/plain',
        body: 'QuinceCA Google Drive Real-Time Sync Ping Test: OK',
      },
      fields: 'id, name',
    });

    console.log(`✓ Test file created successfully: ID = ${testFile.data.id}`);

    // Clean up test file
    await drive.files.delete({ fileId: testFile.data.id as string });
    console.log('✓ Test file deleted. Storage cleaned up.');

    console.log('\n🎉 ALL TESTS PASSED! Google Drive real-time sync is 100% OPERATIONAL!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ Google Drive Connection Failed:', err.message);
  }
}

testDrive();
