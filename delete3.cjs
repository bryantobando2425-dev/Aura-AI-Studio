const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('const compressImage = async'));
const end = lines.findIndex((l, i) => i > start && l.includes('};'));
if (start !== -1 && end !== -1) {
  lines[60] = "import { cn, compressImage } from './lib/utils';";
  fs.writeFileSync('src/App.tsx', lines.slice(0, start).concat(lines.slice(end + 1)).join('\n'));
}
