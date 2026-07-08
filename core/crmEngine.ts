export const CRMEngine = {
  handle: async (event: string, payload: any) => {
    const { raw } = payload;
    let instructions = "";
    
    // Get exact current local time in Puerto Rico
    let prTimeStr = "";
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Puerto_Rico',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      };
      prTimeStr = new Intl.DateTimeFormat('es-PR', options).format(new Date());
    } catch (e) {
      prTimeStr = new Date().toLocaleString();
    }

    // Evaluate missing required pre-qualification data
    const missingFields = [];
    if (!raw?.name) missingFields.push("nombre");
    if (!raw?.phone && !raw?.email) missingFields.push("teléfono o email");
    if (!raw?.vehicleInterest) missingFields.push("vehículo de interés");
    if (raw?.tieneTradeIn === null || raw?.tieneTradeIn === undefined) missingFields.push("si tiene vehículo para trade-in");
    if (raw?.tienePronto === null || raw?.tienePronto === undefined) missingFields.push("si cuenta con dinero para pronto pago");
    if (!raw?.creditTier && !raw?.scoreInformado) missingFields.push("estado de crédito o puntuación aproximada");
    
    // Determine payment/financing type
    const isCash = raw?.metodoPago === "Cash" || raw?.intent?.toLowerCase().includes("cash") || raw?.intent?.toLowerCase().includes("contado");
    const wantsFinancing = raw?.wantsFinancingInfo || raw?.metodoPago === "Financiamiento" || raw?.intent?.toLowerCase().includes("financiamient") || raw?.intent?.toLowerCase().includes("credito") || raw?.intent?.toLowerCase().includes("préstamo");
    
    // Core logical routing based on customer status
    const hasVehicleInterest = !!raw?.vehicleInterest;

    if (!hasVehicleInterest) {
      // Fase de Descubrimiento y Necesidad Vehicular
      instructions = `Actualmente estás en la Fase de DESCUBRIMIENTO y NECESIDAD VEHICULAR. La hora local en Puerto Rico es: ${prTimeStr}.
Tu único objetivo actual es identificar la necesidad del cliente, su "dolor" o el tipo de vehículo que busca (ej. para familia espaciosa, para trabajo duro, para ahorrar gasolina, etc.) y proponerle una solución de nuestro inventario.
REGLAS CONVERSACIONALES OBLIGATORIAS:
1. NO hables de pre-cualificación, crédito, pronto pago, trade-in ni financiamiento de entrada.
2. NO envíes ni muestres el enlace de pre-aprobación (https://gtautopr.com/pre-aprobacion/) bajo ninguna circunstancia todavía.
3. Si el cliente menciona financiamiento o crédito de entrada, responde amigablemente indicando que con mucho gusto le ayudaremos con todas las facilidades de financiamiento, pero que primero debemos entender qué necesidad tiene o qué vehículo le interesa de nuestro inventario para así guiarle con la unidad y solución correcta.
4. Conoce su dolor/necesidad y ofrécele una solución (una unidad o alternativa del inventario). Mantén un tono cálido, humano y muy consultivo.
5. NO uses el tag LEAD_DATA en absoluto.`;
    } else if (missingFields.length > 0) {
      let financingRule = "3. Si el cliente menciona financiamiento en cualquier momento, puedes compartirle el enlace de pre-aprobación: https://gtautopr.com/pre-aprobacion/ para facilitarle el proceso.";
      if (wantsFinancing) {
        financingRule = "3. REGLA: El cliente ha indicado que necesita FINANCIAMIENTO. DEBES ofrecerle el enlace: https://gtautopr.com/pre-aprobacion/ y pedirle que lo vaya completando amigablemente mientras continúan con los detalles de contacto.";
      }

      // Phase 1: Pre-qualification information gathering (Vehicle Interest has been identified)
      instructions = `Actualmente estás en la Fase de PRE-CUALIFICACIÓN. La hora local en Puerto Rico es: ${prTimeStr}.
Ya se identificó el vehículo de interés (${raw?.vehicleInterest}). Ahora tu misión es recopilar amigablemente los campos que faltan: ${missingFields.filter(f => f !== "vehículo de interés").join(', ')}.
REGLAS DE CONVERSACIÓN DE PRE-CUALIFICACIÓN:
1. Haz preguntas amigables y muy conversacionales para obtener los datos de pre-cualificación que faltan de forma muy natural. NO hagas más de 1 o 2 preguntas por mensaje.
2. REGLA DE INTERÉS / TOQUE DE GRID: Como el cliente ha mostrado gran interés o ha seleccionado el vehículo (${raw?.vehicleInterest}), salúdale cálidamente con entusiasmo y pregúntale directamente cuándo le gustaría venir a verlo o probarlo a nuestro dealer (ej. "¿Cuándo le gustaría pasar a verlo por nuestro dealer en Dorado?"). Esto abre la conversación de forma amigable y natural, supliendo su necesidad y deseo directamente, en lugar de interrogarlo de entrada con financiamiento o crédito. A partir de allí, a medida que fluya la conversación, pídele su nombre, teléfono, pronto pago, trade-in, y crédito de manera natural.
3. NUNCA sugieras ni ofrezcas una hora que ya pasó en el reloj.
${financingRule}
5. NUNCA uses el tag LEAD_DATA ni envíes datos al CRM hasta que todos los campos requeridos de pre-cualificación estén completos.`;
    } else {
      // Phase 2: All qualification data gathered. Now we transition based on payment method.
      if (!isCash) {
        // Financing Flow: Must send the online pre-qualification link FIRST
        instructions = `¡EXCELENTE! Ya recopilaste toda la información básica de pre-cualificación del cliente.
La hora local en Puerto Rico es: ${prTimeStr}.
REGLA CRÍTICA PARA COMPRA FINANCIADA (FINANCIAMIENTO):
1. DEBES ofrecer SIEMPRE primero el link de pre-cualificación para financiamiento ANTES de coordinar o sugerir cualquier cita en persona. 
2. Proporciónale este enlace exacto: https://gtautopr.com/pre-aprobacion/ y dile que es el primer paso obligatorio.
3. PROHIBIDO: NO ofrezcas, ni sugieras, ni preguntes por disponibilidad para una cita física en el dealer en este momento. La visita al dealer será DESPUÉS de que llene la aplicación.
4. PROHIBIDO: NUNCA sugieras una hora en el pasado, y NUNCA sugieras una cita para "hoy".
5. Incluye el tag LEAD_DATA con toda la información al final:
LEAD_DATA: {"nombre":"${raw?.name || ''}","telefono":"${raw?.phone || ''}","email":"${raw?.email || ''}","vehiculoInteres":"${raw?.vehicleInterest || ''}","creditTier":"${raw?.creditTier || ''}","scoreInformado":"${raw?.scoreInformado || ''}","tienePronto":${raw?.tienePronto ? 'true' : 'false'},"cantidadPronto":"${raw?.cantidadPronto || ''}","tieneTradeIn":${raw?.tieneTradeIn ? 'true' : 'false'},"tradeAno":"${raw?.tradeAno || ''}","tradeMarca":"${raw?.tradeMarca || ''}","tradeModelo":"${raw?.tradeModelo || ''}","estadoTrade":"${raw?.estadoTrade || ''}","agendo_cita":false,"fecha_cita":""}`;
      } else {
        // Cash Flow: Can offer physical appointment for the NEXT business day
        instructions = `¡EXCELENTE! El cliente pagará Cash/Al contado y ya tenemos todos sus datos de pre-cualificación.
La hora local en Puerto Rico es: ${prTimeStr}.
REGLA CRÍTICA PARA PAGO CASH / AL CONTADO:
1. Ofrécele coordinar una cita física de inmediato para que venga a ver y probar la unidad.
2. REGLA ESTRICTA DE AGENDACIÓN: Ofrece la cita física SIEMPRE para el PRÓXIMO DÍA (mañana) o una fecha futura. PROHIBIDO ofrecer una cita para "hoy". NUNCA ofrezcas una hora que ya pasó en el reloj. Si son las 5:00 PM, no puedes ofrecer una cita a las 3:00 PM.
3. Comunícale los documentos obligatorios requeridos para la cita (Licencia de conducir vigente, Seguro Social, Comprobante de Residencia reciente -factura de agua o luz-, y comprobante de ingresos).
4. Incluye el tag LEAD_DATA al final:
LEAD_DATA: {"nombre":"${raw?.name || ''}","telefono":"${raw?.phone || ''}","email":"${raw?.email || ''}","vehiculoInteres":"${raw?.vehicleInterest || ''}","creditTier":"${raw?.creditTier || ''}","scoreInformado":"${raw?.scoreInformado || ''}","tienePronto":${raw?.tienePronto ? 'true' : 'false'},"cantidadPronto":"${raw?.cantidadPronto || ''}","tieneTradeIn":${raw?.tieneTradeIn ? 'true' : 'false'},"tradeAno":"${raw?.tradeAno || ''}","tradeMarca":"${raw?.tradeMarca || ''}","tradeModelo":"${raw?.tradeModelo || ''}","estadoTrade":"${raw?.estadoTrade || ''}","agendo_cita":true,"fecha_cita":"Próximo día laborable"}`;
      }
    }

    return {
      action: "REPLY_TO_USER",
      guidelines: instructions,
      extractedData: raw
    };
  }
};
