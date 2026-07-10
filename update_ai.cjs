const fs = require('fs');
let code = fs.readFileSync('src/lib/ai.ts', 'utf8');
code = code.replace('private history: any[] = [];', 'public history: any[] = [];');
fs.writeFileSync('src/lib/ai.ts', code);
