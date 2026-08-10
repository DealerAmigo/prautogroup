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
  var LOGO_URL = APP_URL + "/cam1lo.jpg";
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
    "#da-bubble img{width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;}" +
    "@keyframes da-pump{0%,100%{transform:scale(1);}50%{transform:scale(1.07);}}" +
    "#da-dot{position:absolute;top:2px;right:2px;width:28px;height:28px;border-radius:50%;" +
    "background:radial-gradient(circle at 32% 28%,#a7f3c9 0%,#4ade80 42%,#16a34a 78%,#14532d 100%);" +
    "border:2.5px solid #0d1b0f;" +
    "box-shadow:0 3px 8px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.15) inset,inset -2px -3px 4px rgba(0,60,20,.5),inset 2px 3px 3px rgba(255,255,255,.55);" +
    "animation:da-pulse 1.8s ease-in-out infinite;}" +
    "@keyframes da-pulse{0%{box-shadow:0 3px 8px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.15) inset,inset -2px -3px 4px rgba(0,60,20,.5),inset 2px 3px 3px rgba(255,255,255,.55),0 0 0 0 rgba(74,222,128,.6);}" +
    "70%{box-shadow:0 3px 8px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.15) inset,inset -2px -3px 4px rgba(0,60,20,.5),inset 2px 3px 3px rgba(255,255,255,.55),0 0 0 10px rgba(74,222,128,0);}" +
    "100%{box-shadow:0 3px 8px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.15) inset,inset -2px -3px 4px rgba(0,60,20,.5),inset 2px 3px 3px rgba(255,255,255,.55),0 0 0 0 rgba(74,222,128,0);}}" +
    "#da-tooltip{position:fixed;bottom:150px;right:20px;z-index:2147482999;background:#fff;color:#000;padding:12px 16px;border-radius:12px;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transform:translateY(10px);transition:all 0.3s ease;pointer-events:none;max-width:220px;}" +
    "#da-tooltip.show{opacity:1;transform:translateY(0);pointer-events:auto;cursor:pointer;}" +
    "#da-tooltip::after{content:'';position:absolute;bottom:-8px;right:45px;border-width:8px 8px 0;border-style:solid;border-color:#fff transparent transparent transparent;display:block;width:0;}" +
    "#da-tooltip-close{position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;border:none;box-shadow:0 2px 4px rgba(0,0,0,0.2);}" +
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

  // ---- Tooltip de saludo ----
  var tooltip = document.createElement("div");
  tooltip.id = "da-tooltip";
  tooltip.innerHTML = 
    '¡Hola! Le habla Camilo, su asesor virtual. ¿En qué le puedo ayudar hoy? 👋' + 
    '<button id="da-tooltip-close" aria-label="Cerrar">&times;</button>';

  document.body.appendChild(bubble);
  document.body.appendChild(tooltip);
  document.body.appendChild(panel);

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    bubble.style.display = "none";
    tooltip.classList.remove("show");
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

  tooltip.addEventListener("click", function (e) {
    if (e.target.id === 'da-tooltip-close') {
      tooltip.classList.remove("show");
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (err) {}
    } else {
      openPanel();
    }
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
        tooltip.classList.add("show");
      }
    }, AUTO_OPEN_DELAY_MS);
  }
})();
