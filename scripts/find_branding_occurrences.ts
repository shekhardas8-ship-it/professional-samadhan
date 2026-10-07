import fs from 'fs';
import path from 'path';

const roots = ['src', 'scripts', 'server.ts', 'index.html', 'package.json', 'Dockerfile'];
const matches: Array<{ file: string; line: number; text: string }> = [];

function search(dirOrFile: string) {
  if (!fs.existsSync(dirOrFile)) return;
  const stat = fs.statSync(dirOrFile);
  if (stat.isDirectory()) {
    if (dirOrFile.includes('node_modules') || dirOrFile.includes('.git') || dirOrFile.includes('dist')) return;
    for (const f of fs.readdirSync(dirOrFile)) {
      search(path.join(dirOrFile, f));
    }
  } else {
    if (dirOrFile.endsWith('.pdf') || dirOrFile.endsWith('.jpg') || dirOrFile.endsWith('.png')) return;
    const content = fs.readFileSync(dirOrFile, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
      if (/professional[\s_-]?samadhan/i.test(l)) {
        matches.push({ file: dirOrFile, line: idx + 1, text: l.trim() });
      }
    });
  }
}

for (const r of roots) search(r);

console.log(`Total occurrences found: ${matches.length}`);
for (const m of matches) {
  console.log(`${m.file}:${m.line} -> ${m.text}`);
}
