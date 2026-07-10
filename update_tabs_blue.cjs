const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `bg-white text-sky-600 shadow-lg shadow-sky-500/20`;
const replace1 = `bg-sky-500 text-white shadow-lg shadow-sky-500/30`;

code = code.replaceAll(target1, replace1);

fs.writeFileSync('src/App.tsx', code);
