const fs = require('fs');
let code = fs.readFileSync('ai/ai.ts', 'utf8');

const targetStr = `REGLA DE HORARIO CRÍTICA: Nunca sugieras o confirmes una cita para hoy mismo o para una hora en el pasado. Si vas a sugerir una cita, ofrécela para el PRÓXIMO DÍA laborable (mañana o los próximos días).`;
const replacementStr = `REGLA DE HORARIO CRÍTICA: Nunca sugieras o confirmes una cita para hoy mismo o para una hora en el pasado. Si vas a sugerir una cita, ofrécela para el PRÓXIMO DÍA laborable (mañana o los próximos días).
REGLA DE VENTAS CRÍTICA: Tu objetivo principal como vendedor experto es SIEMPRE invitar de forma persuasiva y entusiasta al cliente al dealer. Ofrécele mencionar ofertas especiales, bonos, o facilidades para motivarlo a venir a verlo en persona, probarlo y enamorarse del vehículo para llevárselo a su casa.`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('ai/ai.ts', code);
    console.log("Success");
} else {
    console.log("Target not found");
}
