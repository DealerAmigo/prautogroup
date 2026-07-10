const fs = require('fs');
let code = fs.readFileSync('core/crmEngine.ts', 'utf8');

const targetStr = `2. NUNCA ofrezcas o sugieras una cita física para hoy mismo o para una hora en el pasado. De hecho, NO ofrezcas una cita física todavía porque faltan datos esenciales para pre-calificar al cliente. Primero obtén su nombre, teléfono/email, vehículo de interés, pronto pago, trade-in, y crédito.`;
const replacementStr = `2. Para enamorar al cliente, puedes ofrecerle desde ya la idea de que venga a ver el auto, probarlo y llevárselo a casa con alguna oferta. SIN EMBARGO, explícale de forma persuasiva que para poder darle las mejores ofertas y coordinar su prueba de manejo exitosamente, necesitas antes un par de detalles (nombre, teléfono/email, si tiene pronto, si tiene trade-in). Recopila estos datos de manera natural.`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('core/crmEngine.ts', code);
    console.log("Success 1");
} else {
    console.log("Target 1 not found");
}

const targetStr2 = `3. PROHIBIDO: NO ofrezcas, ni sugieras, ni preguntes por disponibilidad para una cita física en el dealer en este momento. La visita al dealer será DESPUÉS de que llene la aplicación.`;
const replacementStr2 = `3. Invita al cliente con mucho entusiasmo a venir a probar el vehículo, ver las ofertas y llevárselo a casa, indicando que el primer paso para apartarlo es llenar la aplicación online de inmediato.`;

if (code.includes(targetStr2)) {
    code = code.replace(targetStr2, replacementStr2);
    fs.writeFileSync('core/crmEngine.ts', code);
    console.log("Success 2");
} else {
    console.log("Target 2 not found");
}
