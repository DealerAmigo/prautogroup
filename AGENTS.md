# Reglas y Directrices para el Agente (DealerAmigo)

Este archivo contiene las directrices del proyecto y restricciones que el agente de IA debe respetar estrictamente en cada iteración de código.

## 1. Configuración de Google Sheets (Leads e Inventario)
- **ID del Sheet de Leads:** El ID del documento para guardar leads es estrictamente `"1nUrfRkkjXWcXgp68i17htYXcHukI4i4FKCsAHyaRyg0"`.
- **ID del Sheet de Inventario:** El ID del documento de inventario es `"1eP8zbvY5Ifsno2g2AsJoc5YV4q-PxNxzQaM6SSNy-dk"`.
- El Google Apps Script (GAS) tiene hardcodeados internamente estos IDs, por lo que el payload enviado desde Node.js/Express puede incluirlos de forma informativa, pero no debe depender de que el cliente decida cuál usar de manera dinámica si rompe la consistencia.

## 2. Payload y Parámetros de Envío a GAS
- Para registrar un Lead en la hoja de cálculo, el payload de Node.js enviado a la macro de Google Apps Script **DEBE** incluir obligatoriamente el campo `"action": "saveLead"`.
- Los datos del lead deben ser mapeados con los nombres exactos esperados por el script (`nombre`, `telefono`, `email`, `vehiculoInteres`, `creditTier`, `scoreInformado`, `tienePronto`, `cantidadPronto`, `tieneTradeIn`, `tradeAno`, `tradeMarca`, `tradeModelo`, `estadoTrade`, `consentimiento`, `resumenIA`, `estadoLead`, `fuente`, `agendo_cita`, `fecha_cita`, `notas`).

## 3. URLs de Google Apps Script y Variables de Entorno
- **Estricto Uso de Variables de Entorno:** No utilices URLs de respaldo (fallbacks) quemadas en el código (hardcoded) para `INVENTORY_SCRIPT_URL` ni para `LEADS_SCRIPT_URL`. Ambas URLs deben provenir estrictamente de las variables de entorno:
  - `INVENTORY_SCRIPT_URL`
  - `LEADS_SCRIPT_URL`
- Si estas variables no están definidas en el entorno (`.env`), el servidor debe lanzar un error explícito solicitando su configuración en la sección de Secretos, en vez de usar macros genéricas de fallback que apunten a entornos anteriores.

## 4. Token de Seguridad (PROXY_KEY / APPS_SCRIPT_TOKEN)
- El token de validación de seguridad enviado a las macros de Google Apps Script debe enviarse como `_token` y como `proxyKey` dentro del cuerpo o parámetros del endpoint para asegurar compatibilidad total con la validación de tokens de GAS.
