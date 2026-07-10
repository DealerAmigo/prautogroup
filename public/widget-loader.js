/* ==========================================================
   DealerAmigo -- Widget embebible para gtautopr.com
   Uso: agregar en el sitio (footer o header, via plugin tipo
   "Insert Headers and Footers" o bloque HTML personalizado):

     <script src="https://TU-URL-AQUI/widget-loader.js" async></script>

   No requiere build, no requiere React, no requiere CORS.
   Vive dentro de un IIFE para no ensuciar el scope global de WP.
   ========================================================== */
(function () {
  "use strict";

  // ---- CAMBIAR SI CAMBIA LA URL DE CLOUD RUN O AL CONECTAR livechat.gtautopr.com ----
  var APP_URL = "https://gt-auto-imports-ia-salesforce-124591220471.us-east1.run.app";
  var AUTO_OPEN_DELAY_MS = 8000;
  var SESSION_KEY = "dealeramigo_widget_dismissed";
  // --------------------------------------------------------------------------------

  var isMobile = window.innerWidth <= 480;
  var isOpen = false;
  var hasAutoOpened = false;

  // ---- Estilos (inyectados una sola vez, sin depender de CSS externo) ----
  var style = document.createElement("style");
  style.textContent =
    "#da-bubble{position:fixed;bottom:20px;right:20px;z-index:2147483000;" +
    "width:116px;height:116px;border-radius:50%;background:#1a1a2e;border:4px solid #d4af37;" +
    "box-shadow:0 12px 34px rgba(0,0,0,0.45);cursor:pointer;display:flex;align-items:center;" +
    "justify-content:center;transition:transform .2s ease;animation:da-pump 2.2s ease-in-out infinite;" +
    "overflow:hidden;}" +
    "#da-bubble:hover{transform:scale(1.08);animation-play-state:paused;}" +
    "#da-bubble img{width:80%;height:80%;object-fit:contain;border-radius:50%;pointer-events:none;}" +
    "@keyframes da-pump{0%,100%{transform:scale(1);}50%{transform:scale(1.07);}}" +
    "#da-dot{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;" +
    "background:#4ade80;border:2px solid #1a1a2e;animation:da-pulse 1.8s ease-in-out infinite;}" +
    "@keyframes da-pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6);}70%{box-shadow:0 0 0 9px rgba(74,222,128,0);}100%{box-shadow:0 0 0 0 rgba(74,222,128,0);}}" +
    "#da-panel{position:fixed;bottom:20px;right:20px;z-index:2147483000;width:380px;height:600px;" +
    "max-height:80vh;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);" +
    "background:#000;display:none;}" +
    "#da-panel.open{display:block;}" +
    "#da-panel iframe{width:100%;height:100%;border:0;}" +
    "#da-close{position:absolute;top:8px;right:8px;z-index:2147483001;width:28px;height:28px;" +
    "border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:0;cursor:pointer;font-size:16px;" +
    "line-height:1;display:flex;align-items:center;justify-content:center;}" +
    (isMobile
      ? "#da-panel{width:calc(100vw - 24px);height:72vh;max-height:72vh;bottom:12px;right:12px;left:12px;border-radius:16px;}" +
        "#da-bubble{bottom:16px;right:16px;}"
      : "");
  document.head.appendChild(style);

  // ---- CAMBIAR si tienes otra version del logo -- hoy usa la misma URL que los emails ----
  var LOGO_URL = "https://gtautopr.com/wp-content/uploads/2024/10/logo_2576e84d24261a5b737ba93c581c5493-e1729735728852.png";

  // ---- Burbuja flotante ----
  var bubble = document.createElement("div");
  bubble.id = "da-bubble";
  bubble.setAttribute("role", "button");
  bubble.setAttribute("aria-label", "GT-CHAT -- Habla con Camilo, asistente de GT Auto Imports");
  bubble.title = "GT-CHAT";
  bubble.innerHTML =
    '<div id="da-dot"></div>' +
    '<img src="' + LOGO_URL + '" alt="GT-CHAT" />';

  // ---- Panel con el iframe ----
  var panel = document.createElement("div");
  panel.id = "da-panel";
  panel.innerHTML =
    '<button id="da-close" aria-label="Cerrar chat">&times;</button>' +
    '<iframe src="' + APP_URL + '" title="Camilo -- Asistente GT Auto Imports" loading="lazy"></iframe>';

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    bubble.style.display = "none";
  }

  function closePanel(remember) {
    isOpen = false;
    panel.classList.remove("open");
    bubble.style.display = "flex";
    if (remember) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
    }
  }

  bubble.addEventListener("click", function () {
    if (!isOpen) openPanel();
  });
  panel.querySelector("#da-close").addEventListener("click", function () {
    closePanel(true); // si cierra manualmente, no lo molestamos de nuevo esta sesion
  });

  // ---- Auto-abrir a los 8s, una sola vez por sesion ----
  var alreadyDismissed = false;
  try { alreadyDismissed = sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) {}

  if (!alreadyDismissed) {
    setTimeout(function () {
      if (!isOpen && !hasAutoOpened) {
        hasAutoOpened = true;
        openPanel();
      }
    }, AUTO_OPEN_DELAY_MS);
  }
})();
