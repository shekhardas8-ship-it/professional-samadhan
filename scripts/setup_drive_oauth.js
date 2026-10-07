// scripts/setup_drive_oauth.js
import readline from 'readline';
import fs from 'fs';
import path from 'path';

console.log('==================================================================');
console.log('    QUINCECA - GOOGLE DRIVE OAUTH 2.0 SETUP HELPER                ');
console.log('==================================================================\n');

console.log('To link your personal Google Drive (shekhardas8@gmail.com):');
console.log('1. Open Google Cloud Console: https://console.cloud.google.com/apis/credentials');
console.log('2. Click "+ CREATE CREDENTIALS" -> "OAuth client ID".');
console.log('   - Application type: "Web application"');
console.log('   - Name: "QuinceCA Drive"');
console.log('   - Authorized redirect URIs: Add "https://developers.google.com/oauthplayground"');
console.log('   - Click "CREATE". Copy your Client ID and Client Secret.\n');

console.log('3. Open: https://developers.google.com/oauthplayground');
console.log('   - Click the Gear icon ⚙ in the top right.');
console.log('   - Check "Use your own OAuth credentials".');
console.log('   - Paste your Client ID and Client Secret.');
console.log('   - In Step 1 on the left: find "Drive API v3" -> select "https://www.googleapis.com/auth/drive".');
console.log('   - Click "Authorize APIs" -> Sign in as shekhardas8@gmail.com -> Click "Continue" -> "Allow".');
console.log('   - In Step 2: Click "Exchange authorization code for tokens".');
console.log('   - Copy the "Refresh token".\n');
console.log('==================================================================\n');
