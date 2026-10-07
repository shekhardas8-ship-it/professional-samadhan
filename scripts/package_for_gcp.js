// scripts/package_for_gcp.js
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');

const rootDir = process.cwd();
const outputFile = path.join(rootDir, 'quinceca-gcp-deploy.tar.gz');

console.log('Packaging QuinceCA application for GCP e2-micro deployment...');

const output = fs.createWriteStream(outputFile);
const archive = archiver('tar', {
  gzip: true,
  gzipOptions: { level: 9 },
});

output.on('close', () => {
  const sizeMb = (archive.pointer() / (1024 * 1024)).toFixed(2);
  console.log(`✓ Deployment archive created successfully: quinceca-gcp-deploy.tar.gz (${sizeMb} MB)`);
  console.log('Ready to upload directly to GCP Cloud Shell or e2-micro instance!');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Exclude large or local unnecessary folders
const excludeDirs = new Set([
  'node_modules',
  '.git',
  '.agent',
  '.agents',
  'scratch',
  'synthetic_samples',
  'local_storage',
  'wa_auth_session',
  'dist',
]);

const excludeFiles = new Set([
  'quinceca-gcp-deploy.tar.gz',
  'samadhan-cloud-deploy.tar.gz',
  'samadhan-cloud-deploy.zip',
  'professional-samadhan---gst-collection-&-review.zip',
  'veers-gym-website-export.zip',
  'veers-gym-client-ready.html',
]);

function addDirectory(currentDir, relativePath = '') {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryRel = relativePath ? path.join(relativePath, entry.name) : entry.name;
    const entryFull = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) continue;
      addDirectory(entryFull, entryRel);
    } else {
      if (excludeFiles.has(entry.name) || entry.name.endsWith('.log')) continue;
      archive.file(entryFull, { name: entryRel.replace(/\\/g, '/') });
    }
  }
}

addDirectory(rootDir);
archive.finalize();
