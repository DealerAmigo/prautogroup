// ==========================================================
// DealerAmigo -- Agente de Recepción (Twilio)
// Missed-call text-back: cuando el carrier del dealer reenvía una
// llamada no contestada/ocupada a este número de Twilio, este modulo
// contesta la llamada con un TwiML breve y arranca la conversación de
// Camilo por SMS. Reutiliza el MISMO ai/ai.ts y el MISMO saveLead que
// ya usa el widget web -- solo cambia la capa de entrada/salida.
//
// ENV VARS necesarias (agregar en Cloud Run cuando compres el numero):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER   -- el numero de Twilio comprado (formato +1787...)
//
// CONFIGURACION EN LA CONSOLA DE TWILIO (mañana, cuando tengas el numero):
//   Voice & Fax -> A CALL COMES IN -> Webhook -> POST
//     https://<tu-cloud-run-o-dominio>/api/twilio/voice-missed
//   Messaging -> A MESSAGE COMES IN -> Webhook -> POST
//     https://<tu-cloud-run-o-dominio>/api/twilio/sms
// ==========================================================

import { Router } from "express";
import { processCamiloMessage } from "./ai/ai";

const router = Router();

// ----------------------------------------------------------
// Sesion por numero de telefono -- persistida en GAS (pestaña
// SMS_Sessions), NO en memoria. Esto sobrevive reinicios y
// escalado de Cloud Run (cada webhook de Twilio puede aterrizar
// en una instancia distinta). Tradeoff: agrega 1-2 llamadas a GAS
// por turno de SMS -- aceptable, ya la llamada a Claude toma mas
// tiempo que eso.
// ----------------------------------------------------------
type ChatTurn = { role: "user" | "assistant"; content: string };

async function loadHistory(phone: string): Promise<ChatTurn[]> {
  const leadsScriptUrl = process.env.LEADS_SCRIPT_URL;
  if (!leadsScriptUrl) return [];
  const proxyKey = process.env.PROXY_KEY || process.env.APPS_SCRIPT_TOKEN || "test_token";

  try {
    const response = await fetch(leadsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getSession", _token: proxyKey, proxyKey, telefono: phone })
    });
    const data = await response.json();
    return Array.isArray(data.history) ? data.history : [];
  } catch (err) {
    console.error("[TwilioAgent] Error cargando historial de GAS:", err);
    return [];
  }
}

async function persistHistory(phone: string, history: ChatTurn[]): Promise<void> {
  const leadsScriptUrl = process.env.LEADS_SCRIPT_URL;
  if (!leadsScriptUrl) return;
  const proxyKey = process.env.PROXY_KEY || process.env.APPS_SCRIPT_TOKEN || "test_token";

  try {
    await fetch(leadsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveSession", _token: proxyKey, proxyKey, telefono: phone, history })
    });
  } catch (err) {
    console.error("[TwilioAgent] Error guardando historial en GAS:", err);
  }
}

// ----------------------------------------------------------
// Inventario -- mismo GAS Inventario que ya usa el widget.
// Cache simple de 60s para no pegarle a GAS en cada SMS.
// ----------------------------------------------------------
let inventoryCache: { data: any[]; ts: number } | null = null;
const INVENTORY_CACHE_MS = 60_000;

async function fetchInventory(): Promise<any[]> {
  const now = Date.now();
  if (inventoryCache && now - inventoryCache.ts < INVENTORY_CACHE_MS) {
    return inventoryCache.data;
  }
  const inventoryUrl = process.env.INVENTORY_SCRIPT_URL;
  if (!inventoryUrl) return [];
  try {
    const response = await fetch(inventoryUrl);
    if (!response.ok) return [];
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.vehicles || [];
    inventoryCache = { data: list, ts: now };
    return list;
  } catch (err) {
    console.error("[TwilioAgent] Error obteniendo inventario:", err);
    return inventoryCache ? inventoryCache.data : [];
  }
}

// ----------------------------------------------------------
// Extraccion de tags -- mismo patron que src/App.tsx usa en el
// navegador para el widget web. Aqui se hace server-side porque
// SMS/WhatsApp no tienen un cliente de navegador que lo parsee.
// ----------------------------------------------------------
function extractTags(rawText: string) {
  let text = rawText;
  let leadData: any = null;
  let citaConfirmada: string | null = null;
  let handoffUrgente = false;

  const citaMatch = text.match(/CITA_CONFIRMADA:\s*(.+)$/m);
  if (citaMatch) {
    citaConfirmada = citaMatch[1].trim();
    text = text.replace(/CITA_CONFIRMADA:.*$/m, "").trim();
  }

  const handoffMatch = text.match(/HANDOFF_URGENTE:\s*(Si|Sí|true)/i);
  if (handoffMatch) {
    handoffUrgente = true;
    text = text.replace(/HANDOFF_URGENTE:.*$/m, "").trim();
  }

  const leadMatch = text.match(/LEAD_DATA:\s*(\{.*?\})/s);
  if (leadMatch) {
    try {
      leadData = JSON.parse(leadMatch[1]);
    } catch (e) {
      console.error("[TwilioAgent] Error parseando LEAD_DATA:", e);
    }
    text = text.replace(/LEAD_DATA:\s*\{.*?\}/s, "").trim();
  }

  // MOSTRAR_VEHICULO no aplica a SMS de texto plano (no hay carrusel de fotos) -- se limpia y se ignora.
  const vehicleMatch = text.match(/MOSTRAR_VEHICULO:\s*(.+)$/m);
  if (vehicleMatch) {
    text = text.replace(/MOSTRAR_VEHICULO:.*$/m, "").trim();
  }

  return { text, leadData, citaConfirmada, handoffUrgente };
}

// ----------------------------------------------------------
// Envio del lead a GAS -- mismo mapeo/payload que /api/leads en
// server.ts. Si mañana tocas ese mapeo, toca replicarlo aqui tambien
// (o mejor, extraerlo a una funcion compartida -- pendiente).
// ----------------------------------------------------------
async function sendLeadToGAS(lead: Record<string, any>) {
  const leadsScriptUrl = process.env.LEADS_SCRIPT_URL;
  if (!leadsScriptUrl) {
    console.error("[TwilioAgent] LEADS_SCRIPT_URL no configurado, no se guardo el lead.");
    return;
  }
  const proxyKey = process.env.PROXY_KEY || process.env.APPS_SCRIPT_TOKEN || "test_token";

  const payload = {
    action: "saveLead",
    _token: proxyKey,
    proxyKey: proxyKey,
    sheetId: "1nUrfRkkjXWcXgp68i17htYXcHukI4i4FKCsAHyaRyg0",
    nombre: lead.nombre || "",
    telefono: lead.telefono || "",
    email: lead.email || "",
    vehiculoInteres: lead.vehiculoInteres || "",
    creditTier: lead.creditTier || "",
    scoreInformado: lead.scoreInformado || "",
    tienePronto: lead.tienePronto || "",
    cantidadPronto: lead.cantidadPronto || "",
    tieneTradeIn: lead.tieneTradeIn || "",
    tradeAno: lead.tradeAno || "",
    tradeMarca: lead.tradeMarca || "",
    tradeModelo: lead.tradeModelo || "",
    estadoTrade: lead.estadoTrade || "",
    consentimiento: lead.consentimiento !== undefined ? lead.consentimiento : true,
    resumenIA: lead.resumenIA || "",
    fuente: lead.fuente || "missed_call",
    agendo_cita: lead.agendo_cita || false,
    fecha_cita: lead.fecha_cita || "",
    notas: lead.notas || "",
    eventType: lead.eventType || "nuevo_lead",
    metodoPago: lead.metodoPago || "",
    handoffUrgente: lead.handoffUrgente || false,
    conversationHistory: lead.conversationHistory || []
  };

  try {
    const gasResponse = await fetch(leadsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const gasData = await gasResponse.text();
    console.log("[TwilioAgent] GAS Response:", gasData);
  } catch (err) {
    console.error("[TwilioAgent] Error guardando lead en GAS:", err);
  }
}

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ----------------------------------------------------------
// Log de auditoria (pregunta + respuesta), un turno por fila, en la
// pestaña GT_Auto_Imports_Chat_Logs -- mismo mecanismo que ya usa
// /api/chat en server.ts para el widget web. Compartido aqui para
// no duplicar el fetch en cada canal.
// ----------------------------------------------------------
async function logChatTurn(userMessage: string, botReply: string): Promise<void> {
  const leadsScriptUrl = process.env.LEADS_SCRIPT_URL;
  if (!leadsScriptUrl) return;
  const proxyKey = process.env.PROXY_KEY || process.env.APPS_SCRIPT_TOKEN || "test_token";

  try {
    await fetch(leadsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logChat", _token: proxyKey, proxyKey, sheetId: "1nUrfRkkjXWcXgp68i17htYXcHukI4i4FKCsAHyaRyg0", userMessage, botReply })
    });
  } catch (err) {
    console.error("[TwilioAgent] Error guardando chat log de auditoria:", err);
  }
}

// ==========================================================
// POST /api/twilio/voice-missed
// El carrier del dealer reenvia aqui la llamada cuando no contesta
// o esta ocupado. Contestamos con un mensaje corto y colgamos --
// el resto de la conversacion sigue por SMS, no por voz.
// ==========================================================
router.post("/voice-missed", async (req, res) => {
  const from = String(req.body.From || "");
  console.log("[TwilioAgent] Llamada perdida reenviada desde:", from);

  // IMPORTANTE: el envio del SMS va ANTES de res.send(). Cloud Run puede
  // reducir el CPU del contenedor a casi cero apenas se responde la peticion
  // HTTP, asi que cualquier trabajo async despues de res.send() puede quedar
  // a medias y nunca completar. Por eso esperamos a que el SMS salga primero.
  if (from) {
    const welcomeMsg =
      "Hola, soy Camilo de GT Auto Imports 🚗 Vi que nos llamó y no pudimos contestar, disculpe la espera. ¿Qué tipo de vehículo está buscando?";
    const history: ChatTurn[] = [{ role: "assistant", content: welcomeMsg }];
    await persistHistory(from, history);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && twilioNumber) {
      try {
        const twilio = (await import("twilio")).default;
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: welcomeMsg,
          from: twilioNumber,
          to: from
        });
        console.log("[TwilioAgent] SMS de bienvenida enviado a:", from);
      } catch (err) {
        console.error("[TwilioAgent] Error enviando SMS de bienvenida:", err);
      }
    } else {
      console.error("[TwilioAgent] Faltan TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER en env.");
    }
  }

  // TwiML se responde AL FINAL, una vez el SMS ya se intento enviar --
  // esto garantiza que Cloud Run mantenga el CPU activo hasta que termine
  // ese trabajo, en vez de arriesgarnos a que quede a medias.
  res.type("text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Gracias por llamar a "GeeTee" Auto Imports. En un momento le enviamos un mensaje de texto para comunicarnos.</Say>
  <Hangup/>
</Response>`);
});

// ==========================================================
// POST /api/twilio/sms
// Mensajes entrantes (respuestas del cliente). Llama al MISMO
// motor de Camilo (processCamiloMessage) que usa el widget web.
// ==========================================================
router.post("/sms", async (req, res) => {
  const from = String(req.body.From || "");
  const body = String(req.body.Body || "").trim();

  if (!from || !body) {
    res.type("text/xml");
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }

  try {
    const history = await loadHistory(from);
    const inventory = await fetchInventory();

    const rawResponse = await processCamiloMessage(body, { inventory, history });
    let { text, leadData, citaConfirmada, handoffUrgente } = extractTags(rawResponse);

    // Si despues de limpiar los tags no queda texto visible, Camilo
    // respondio solo con metadata (LEAD_DATA, etc.) sin nada conversacional.
    // Nunca mandamos un SMS vacio -- usamos un mensaje de respaldo.
    if (!text || !text.trim()) {
      text = "Disculpe, ¿me puede repetir o darme más detalles de lo que busca?";
      console.error("[TwilioAgent] Respuesta de Claude vino vacia tras limpiar tags. Raw:", rawResponse);
    }

    history.push({ role: "user", content: body });
    history.push({ role: "assistant", content: text });
    await persistHistory(from, history);

    // Guardar lead si el mensaje trajo LEAD_DATA o confirmo cita.
    if (leadData || citaConfirmada) {
      const parts = citaConfirmada ? citaConfirmada.split("|") : [];
      await sendLeadToGAS({
        nombre: leadData?.nombre || parts[0] || "",
        telefono: from,
        vehiculoInteres: leadData?.vehiculoInteres || parts[3] || "",
        consentimiento: leadData?.consentimiento || "Si",
        metodoPago: leadData?.metodoPago || parts[2] || "",
        eventType: citaConfirmada ? "cita_confirmada" : (leadData?.eventType || "nuevo_lead"),
        agendo_cita: !!citaConfirmada,
        fecha_cita: leadData?.fecha_cita || parts[4] || "",
        notas: leadData?.notas || parts[5] || "",
        fuente: "missed_call_sms",
        handoffUrgente: handoffUrgente,
        resumenIA: text,
        conversationHistory: history
      });
    }

    // Log de auditoria del turno -- antes de responder, mismo motivo que
    // siempre: Cloud Run puede congelar el CPU apenas se envia la respuesta.
    await logChatTurn(body, text);

    res.type("text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${xmlEscape(text)}</Message>
</Response>`);
  } catch (err: any) {
    console.error("[TwilioAgent] Error procesando SMS:", err);
    res.type("text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Disculpe, tuvimos un problema técnico. Por favor intente de nuevo en un momento.</Message>
</Response>`);
  }
});

export default router;
