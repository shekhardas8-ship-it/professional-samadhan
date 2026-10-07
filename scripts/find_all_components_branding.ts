import fs from 'fs';
import path from 'path';

function searchComponents(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchComponents(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (/professional\s*samadhan/i.test(l)) {
          console.log(`${full}:${idx + 1} -> ${l.trim()}`);
        }
      });
    }
  }
}

searchComponents('src/components');
