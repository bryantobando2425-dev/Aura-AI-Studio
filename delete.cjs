const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('function OldMundosManager'));
const end = lines.findIndex(l => l.includes('function ManualManager'));
if (start !== -1 && end !== -1) {
  fs.writeFileSync('src/App.tsx', lines.slice(0, start).concat(lines.slice(end)).join('\n'));
}
