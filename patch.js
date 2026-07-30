import fs from 'fs';
let code = fs.readFileSync('ai/ai.ts', 'utf8');
code = code.replace(/const msg = error\?\.message \|\| String\(error\);\s*if \(msg\.includes\("429"\) \|\| msg\.includes\("quota"\)\) \{\s*return "Lo siento, el sistema está recibiendo demasiados mensajes y ha alcanzado su límite de cuota\. Por favor, espera un minuto y vuelve a intentar\.";\s*\}\s*return `Lo siento, estoy teniendo problemas de conexión\. Por favor, intenta nuevamente más tarde\.`;/g, 
  "const msg = error?.message || String(error);\n    return `[System Error] Claude failed with: ${msg}. If you are testing this on the Shared App URL, please 'Share' the app again to deploy the latest code (which uses a working Claude model), or test in the Dev preview.`"
);
fs.writeFileSync('ai/ai.ts', code);
