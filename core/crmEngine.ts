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
    if (missingFields.length > 0) {
      let financingRule = "3. Si el cliente menciona financiamiento en cualquier momento, DEBES darle inmediatamente el enlace de pre-aprobación: https://gtautopr.com/pre-aprobacion/";
      if (wantsFinancing) {
        financingRule = "3. REGLA CRÍTICA: El cliente ha indicado que necesita FINANCIAMIENTO. DEBES darle inmediatamente este enlace: https://gtautopr.com/pre-aprobacion/ y pedirle que lo vaya llenando, mientras continúas pidiendo amigablemente los datos que faltan.";
      }

      // Phase 1: Pre-qualification information gathering
      instructions = `Actualmente estás en la fase de PRE-CUALIFICACIÓN. La hora local en Puerto Rico es: ${prTimeStr}.
Todavía te falta recopilar los siguientes campos esenciales: ${missingFields.join(', ')}.
REGLAS DE CONVERSACIÓN DE PRE-CUALIFICACIÓN:
1. Haz preguntas amigables y conversacionales para obtener los datos que faltan. NO hagas más de 1 o 2 preguntas por mensaje de forma muy natural.
2. Para enamorar al cliente, puedes ofrecerle desde ya la idea de que venga a ver el auto, probarlo y llevárselo a casa con alguna oferta. SIN EMBARGO, explícale de forma persuasiva que para poder darle las mejores ofertas y coordinar su prueba de manejo exitosamente, necesitas antes un par de detalles (nombre, teléfono/email, si tiene pronto, si tiene trade-in). Recopila estos datos de manera natural.
${financingRule}
4. NUNCA uses el tag LEAD_DATA ni envíes datos al CRM hasta que todos los campos requeridos de pre-cualificación estén completos.`;
    } else {
      // Phase 2: All qualification data gathered. Now we transition based on payment method.
      if (!isCash) {
        // Financing Flow: Must send the online pre-qualification link FIRST
        instructions = `¡EXCELENTE! Ya recopilaste toda la información básica de pre-cualificación del cliente.
La hora local en Puerto Rico es: ${prTimeStr}.
REGLA CRÍTICA PARA COMPRA FINANCIADA (FINANCIAMIENTO):
1. DEBES ofrecer SIEMPRE primero el link de pre-cualificación para financiamiento ANTES de coordinar o sugerir cualquier cita en persona. 
2. Proporciónale este enlace exacto: https://gtautopr.com/pre-aprobacion/ y dile que es el primer paso obligatorio.
3. Invita al cliente con mucho entusiasmo a venir a probar el vehículo, ver las ofertas y llevárselo a casa, indicando que el primer paso para apartarlo es llenar la aplicación online de inmediato.
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
