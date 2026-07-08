export const SPREADSHEET_ID = '1nUrfRkkjXWcXgp68i17htYXcHukI4i4FKCsAHyaRyg0';

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  budget: string;
  vehicle: string;
  notes: string;
  contactMethod: string;
  source: string;
  appointmentScheduled: string;
  appointmentDate: string;
  dateStr: string;
}

export async function appendLeadToSheet(leadData: any, token: string): Promise<any> {
  const dateStr = leadData.dateStr || new Date().toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' });
  const rowValues = [
    leadData.id || Math.random().toString(36).substring(2, 9),
    leadData.name || leadData.nombre || "",
    leadData.phone || leadData.telefono || "",
    leadData.email || "",
    leadData.budget || leadData.presupuesto || leadData.presupuesto_mensual || leadData.monthlyBudget || "",
    leadData.vehicleInterest || leadData.vehiculo_interes || leadData.vehiculo || "",
    leadData.notes || leadData.notas || leadData.resumen || leadData.fullText || "",
    leadData.clientType || leadData.tipo_cliente || leadData.contactMethod || "",
    leadData.source || leadData.fuente || "Web Chat",
    leadData.appointmentScheduled || leadData.agendo_cita || (['ai_appointment_confirmation', 'appointment_booking_form', 'appointment'].includes(leadData.type) ? "Sí" : "No"),
    leadData.appointmentDate || leadData.fecha_cita || 
      (leadData.type === 'appointment_booking_form' ? `${leadData.date || ""} ${leadData.time || ""}`.trim() : "") ||
      (leadData.type === 'ai_appointment_confirmation' ? (leadData.notas || "") : "") || "",
    dateStr
  ];

  // We append to the first sheet (e.g. range A:L)
  const range = 'A:L';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Error appending to Google Sheet: ${err.error?.message || response.statusText}`);
  }

  return response.json();
}

export async function fetchLeadsFromSheet(token: string): Promise<any[]> {
  const range = 'A:L'; // Read columns A to L
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Error fetching from Google Sheet: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const rows = data.values;
  if (!rows || rows.length <= 1) return []; // Empty or only header

  // Assume row 0 might be a header. If we detect the first column is "ID" or "id" or starts with a header name, we skip it.
  const hasHeader = rows[0][0]?.toLowerCase().includes('id') || rows[0][1]?.toLowerCase().includes('nombre');
  const startIndex = hasHeader ? 1 : 0;

  const leads: any[] = [];
  for (let i = startIndex; i < rows.length; i++) {
    const r = rows[i];
    leads.push({
      id: r[0] || `sheet-${i}`,
      name: r[1] || '',
      phone: r[2] || '',
      email: r[3] || '',
      budget: r[4] || '',
      vehicle: r[5] || '',
      notes: r[6] || '',
      contactMethod: r[7] || '',
      source: r[8] || '',
      appointmentScheduled: r[9] || 'No',
      appointmentDate: r[10] || '',
      dateStr: r[11] || '',
      type: r[9] === 'Sí' ? 'appointment' : 'proposal_request',
      createdAt: r[11] || new Date().toISOString()
    });
  }

  // Return sorted by date (newest first)
  return leads.reverse();
}
