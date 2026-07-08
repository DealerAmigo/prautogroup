import { getAccessToken } from './googleAuth';

export interface EmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
}

/**
 * Encodes a string into Base64URL safe format, fully supporting UTF-8/Unicode.
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using the Gmail API with the authenticated user's token.
 */
export async function sendGmail(params: EmailParams, providedToken?: string): Promise<any> {
  const token = providedToken || await getAccessToken();

  if (!token) {
    console.warn("Gmail send skipped: No access token available.");
    return { skipped: true, message: "Gmail sync skipped (Auth required)" };
  }

  // Construct RFC 822 raw email string
  const emailLines = [
    `To: ${params.to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.bodyHtml
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedMessage = base64UrlEncode(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedMessage
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Gmail API error: ${error.error?.message || response.statusText}`);
  }

  console.log("Gmail sent successfully.");
  return response.ok;
}

/**
 * Sends a lead capture notification to the dealer owner.
 */
export async function sendNewLeadNotification(lead: any, ownerEmail: string, token: string) {
  const subject = `🔥 Nuevo Lead: ${lead.name || lead.nombre || 'Interesado'}`;
  
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #fcfcfc;">
      <h2 style="color: #e11d48; margin-bottom: 5px; font-style: italic; text-transform: uppercase;">¡Nuevo Lead de GT Auto Imports!</h2>
      <p style="color: #666; font-size: 14px; margin-top: 0;">Capturado por Camilo (Asistente Virtual de Ventas)</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; width: 180px;">Nombre:</td>
          <td style="padding: 10px;">${lead.name || lead.nombre || 'No provisto'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Teléfono:</td>
          <td style="padding: 10px;">${lead.phone || lead.telefono || 'No provisto'}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold;">Email:</td>
          <td style="padding: 10px;">${lead.email || 'No provisto'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Vehículo de Interés:</td>
          <td style="padding: 10px; color: #e11d48; font-weight: bold;">${lead.vehicleInterest || lead.vehiculo_interes || lead.vehicle || 'Consulta General'}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold;">Calificación de Crédito:</td>
          <td style="padding: 10px;">${lead.creditTier || 'No calificado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Pronto Pago / Trade-in:</td>
          <td style="padding: 10px;">
            Pronto: ${lead.amountPronto || (lead.tienePronto === 'sí' ? 'Sí' : 'No')} <br/>
            Trade-in: ${lead.tieneTrade === 'sí' ? `Sí (${lead.tradeAno || ''} ${lead.tradeMarca || ''} ${lead.tradeModelo || ''})` : 'No'}
          </td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold;">Método de contacto:</td>
          <td style="padding: 10px; text-transform: uppercase;">${lead.contactMethod || lead.tipo_cliente || 'Chat'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Origen:</td>
          <td style="padding: 10px;">${lead.source || 'Asistente Chat'}</td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 8px;">
        <h4 style="color: #be123c; margin: 0 0 8px 0; text-transform: uppercase;">Notas / Resumen de Camilo:</h4>
        <p style="color: #333; font-size: 13px; line-height: 1.5; margin: 0;">${lead.notes || lead.notas || lead.resumen || lead.fullText || 'Sin notas adicionales.'}</p>
      </div>
      
      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #999;">
        <p>Este es un reporte automático de GT Auto Imports. Nos encontramos en PR-2 km 26.1, Dorado, PR 00646.</p>
      </div>
    </div>
  `;

  return sendGmail({ to: ownerEmail, subject, bodyHtml }, token);
}

/**
 * Sends a booking confirmation email to the customer.
 */
export async function sendCustomerConfirmation(lead: any, token: string) {
  if (!lead.email) return;

  const subject = `📅 Cita Confirmada en GT Auto Imports - ${lead.name || lead.nombre}`;
  
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e11d48; margin: 0; font-style: italic; text-transform: uppercase; font-size: 26px;">GT Auto Imports</h1>
        <p style="color: #666; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">PR-2 km 26.1, Dorado, Puerto Rico</p>
      </div>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h3 style="color: #15803d; margin: 0 0 5px 0; text-transform: uppercase; text-align: center;">¡Su Cita está Confirmada!</h3>
        <p style="color: #166534; font-size: 13px; margin: 0; text-align: center;">Hola ${lead.name || lead.nombre || 'amigo'}, nos alegra confirmarle su espacio.</p>
      </div>

      <h4 style="color: #333; text-transform: uppercase; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px;">Detalles de la Cita:</h4>
      
      <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Fecha y Hora:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #111;">${lead.appointmentDate || lead.fecha_cita || 'Coordinada en chat'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Vehículo de Interés:</td>
          <td style="padding: 8px 0; color: #e11d48; font-weight: bold;">${lead.vehicleInterest || lead.vehiculo_interes || lead.vehicle || 'Consulta General'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Dirección de Encuentro:</td>
          <td style="padding: 8px 0; color: #111;">PR-2 km 26.1, Dorado, PR 00646</td>
        </tr>
      </table>

      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h4 style="color: #b45309; margin: 0 0 8px 0; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">⚠️ Documentos Requeridos para su Cita:</h4>
        <p style="color: #78350f; font-size: 12px; margin: 0; line-height: 1.6;">
          Para pre-calificarlo en minutos y que salga guiando hoy mismo, es indispensable traer:
          <ul style="margin: 5px 0 0 15px; padding: 0;">
            <li>Licencia de conducir vigente (o un acompañante con licencia válida).</li>
            <li>Tarjeta de Seguro Social original.</li>
            <li>Comprobante de residencia reciente (factura de agua, luz, o lease agreement).</li>
            <li>Comprobante de ingresos:
              <br/>• Si es empleado: W2 o talonarios de pago recientes.
              <br/>• Si trabaja por su cuenta: planillas y registro de comerciante.
            </li>
          </ul>
        </p>
      </div>

      <p style="color: #666; font-size: 13px; line-height: 1.5; text-align: center;">
        ¿Tiene alguna pregunta antes de venir? Puede responder directamente a este correo o llamarnos. ¡Nos vemos en Dorado!
      </p>

      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 25px 0;" />
      
      <div style="text-align: center; font-size: 11px; color: #999;">
        <p>© ${new Date().getFullYear()} GT Auto Imports. Todos los derechos reservados.</p>
        <p>Este correo electrónico fue enviado automáticamente tras la confirmación de su cita.</p>
      </div>
    </div>
  `;

  return sendGmail({ to: lead.email, subject, bodyHtml }, token);
}
