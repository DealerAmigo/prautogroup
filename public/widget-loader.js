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
  var LOGO_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAB0AHQDASIAAhEBAxEB/8QAHAAAAQUBAQEAAAAAAAAAAAAABQADBAYHCAIB/8QAQRAAAQMDAgMEBgcFBwUAAAAAAQIDBAAFERIhBjFRBxNBYRQiMnGBkRUjQlKhscEIYnLR4RYXJDNDgoM2RHPC8P/EABkBAAIDAQAAAAAAAAAAAAAAAAECAAMEBf/EACURAAICAgEEAgIDAAAAAAAAAAABAhEDBCESMUFRBRMiMhRCYf/aAAwDAQACEQMRAD8A5wZOnBoq+sustFB2Ud/KgzZ2Azzq5x0WFqC0C+246lAC8kjUrNSULaZfr7TwwnDxIHIeQ0nZacJHWjlomRorOtx5BUBrUM7k1FmmxOoYDAabLjw1FJPqoHP50SCeEWWg4SFke0gKJz/9mtGll/iSc4q2yv5fPL5THDFP8Yx8IpdymLnznpDp9ZasjyHhTTZAq/OQuEkMuEKaUsJwlIdO+TzJ61BvEawN29b8FpsrDukIDxJIzgfM1XJuTcmURSilFdkVlchmG2FSDlRGQkVCdumvJbCg34AJJ+FbL2U9msC5w2r1fcS0PElmMpPqJwcaldeXKtNk8LWVlH1NuhoOMeoykbViybSi3Ss6OLSlNJt0chrmsrVkA6gcjIxmtjZ4ki3vgC4KgOFuUxG0uM5wtBxjPmPOi3GHBlok9+Uw2mlaThSU43+FYlaWXoF1kMIWpJDToURyWkDJB6jA+eKbX2I5roq2daWBqyJZ7JKu0kpSoJyMlazmt77FbYm1wp8ZLneFC0kqxjcis/7PrcuVdQwhxtGUqGpew99a7wFbl26bd2HHG3DrQdTZyOVaKZkUuQX27kjgVQ+8+gfjXOtncVFukZ5CELUhWoJWMg+8V0T28/8ARaB1kornWEdM1pWM43qeBvJfXOOJpVvarZnyaP8AOlVVXJSVH1CKVU9C9D9T9jqeHroMD0Rde/oG5p5w3flT73HN8ZfcbDrWUKKfY6Gl/eBfx/qMn/jFXWyukQ3rZOj/AObGdGf3c0yI7+cd05n+E0UR2g3zGT6MoebVex2g3FWz0SEv/jxQtkpAdUd5I3aWP9tSWGnDBGhOFGQNiNzpQSPzozH47S+ytuTb2NRxhSSRip9wu9rbhQZDbYWpbisHVjTtggj5GgpPqpoLikrTNPav1z4d4atn0b6A20YiHUCQ246tzKQScIGwycUdXxLcnODlXNUdhuaohsJCVY1dcHfFE+FJECVwPZXXdwuM2lKB9rbAFDOLrvb2ISY+HEEPY0JbyAAOfmK5k3XCO/hiqtsz5Vyv0mT3cycVSF4IaNvKGjncDXmqTxclm08QuqDB+tjrBSk+yVjBPzzW+RJtsVay6lKESAjKgQMisA7RrmhPFaypoLQEoOk+IyTirdZ3k4M25DoxcuwhwLMMG4l0IS4lMfVhXI4ABrVuzG5m7fSsvukNZdSnSjlsmsa4akiQ7LcSjR/h3PV6ZOa1LsLTix3AnmZH6CuhycdJWOdvm3BzA6yU/ka53h7S055BNdBftAqI4ThjPOSPyNc+wgVSwEjUdOw60QkpSm88xSplyHJKzllY+FKloFk2/RUs3+5s6d0SFj3b0FcCkEpxg10rcOCbTc5SpUm3pU+4cqWNtRpxjs0sBb1fRiFEdSciiRI5kaCkqzjbxpzRn2fDrXSp7NrCcluA37qZX2d2TOPQG9vKhYaOcGkFC9x6po3w9NahzkelMtyYatnG1pzsdiR0OK1+7Wvs+4dbWxfre+5McBU0mMclI/eHhWbXG7WJJeFrsbYT7KFvrOST46Rtj40FyGq5N7sDNrk2a3QYD6mowbCo6m15UgdN855+NTbpHQxHEZ9bzsjT7YXoC/gE7ddjWG9ls9z+1VsjvvKCZDLjKcHAQSnUnSPDcVqHEt94hhMKAix5SANPehwpI8yMbfA1gyx+udHY1cvVjtoBX2bb+F4Tq5Tj7syScb/YTnJAGwGwxk771RJz8K/QblJMVpqZGbEgOL3cWhR9VKfAAeJ3O+2M0Zbgy7zMXMvKkugb6SMpGPfWcXuZ6Xe5b7RIQpWlOPujYflVmtTl/pm3JNxt8J9kH+ESMTDnlGNa/wBhu3Dk09ZJ/IVgdpuj0JLiUISrvUlslXgPKtk7F+JLTDtLsCZMbjSVvlaA96qVA9FHbPvrcu5zlwS/2hlY4Zt6esn/ANTWCQFqbl60HCkpyDW4/tDupXw/aShSVIW+SCk5BGk7g1hkBWmSpRxsnxokZZ7ZeXlxvrkalAkZxzpUKVdGxgd0lOBjbxpVLE6TdXePYYvMUQLoyLapv636vKkqz0NXq2cUWSeMN3+2BWQlIeCmlE/lXIyRmnmFllaXEkgoUFbHoc/pRQx2VcmRb0trlJJLuShTH1gUB47VnnGPHlvt9te+jXC5cCdCApOAg+Kj7ulH+KbhOtXAE+bYV65r0YEOk6lJSobkfCuYZLykBIUAk7LIBzzG/wAajiiKTPlymuzZSnX3FOOqUpSlKOSTg/zqA6MvMtjlnUT7tq+tqypW++efvp9DY9JJ8EhKR8s1CWPxJxg3GHLjuJ72O6l5OD0510BIkN3q3RpDadaHwFeqrY7fjXOhZSqO2oAAg74q08H8bT+FrfLjhoSmlpJZC9w05y1e7y6/Gsm1geSnHujbp7CxXGXZlx7Rbg3ZrSYDGEyXklOE8wPE/p76xxlvOpw7DwqRcpsy7zFypzi1uuK1KUo5Kj502GQlHMnHU1ZgwrFGinYzvNK/AmE7Zp0bkgcvGkRoTjxx/SvjZAyBvVxRZJmz5TtmRblulcVlwvNoJ9gkYOOgPSg7RI70j7tTlK1Z6fnUNhGVvJOcAY2qMYYyTzpU8Wk58aVCyUT07V7G4IPjtTYr0DRFRrkrj9H928aA2yRMkRTFKlK2CQNKle/pWRyDlRzkDw8q2fs1tttv3AqIdzjNuttvOJz7KkknOoEbg71VeNOzmTbe8fs8gTYo37teEup/RX4HyrNHbg5OEuGjXLSmoLJHlMzZpWiRgcjyog2r1ieu/wCFRI7bKVyjMDqXUpIaSBj1+p8v5082vHOtKZkY5nTGO3I00kHSokqwrA8q8yHMtaR1r0lWPV1bZ5edEATtEFqW6vvivSjSgIbxqUonl5e+jUqzWmFEafuT81hLyiltCAlajjmo+XSg9quiLel0Kt8OXrWFanwolOPAYI2P8qkvcQW55hDcjh+OtTaNAWJTwOeuCSPgMCmxNQk5SV+l4Ls845MEcMF0u+ZeWvS9AC4LaTLWIxcUx9grGFEZ2yB4022PV3zv05q/pXia61IuRWwz3DKl+o2FFWkdMnnUwhKPInxpbt2VJUqI6yRz+CRTIWltxRIIKhuQaJt2+W6kqZhyXE/eS0o/jih0xpbK9Lram1YxpUCD+NLaYyi0rodU2dileQRnPKlXtuO46gFBwBtSocBPgVX3lXnFfM7UwqNC7NbvKiW+e1GAWlLiXCnkdxjb5VIvfEz83XGZCwv7RI9kefnQLs3fCLlKaJH1rP4g/wBasVxt6+/ceaCXNQ3SMA1y5xis76ux14Tm9ZdHcpTlrW6olQJJPM0BXqQopVnKSUn3itc4Yswub+uU261HSSFJUdClH93nUqX2Z2Xvit16eNaitRC0jn/tIrY9mEeGYoaeTIupGMJJKhnkKcZOVZPWrRx/wzD4cLJhSZb6XVH/ADWxpSPDCgdzVTbXhJq6E1NXEz5MUscumQ6V4NMur2NfO8plStR2phEj1CSlyfHS4opSpxIJHgCa6isHD9ktccehQGA4P9VaQtavMqP6VzbbOH7pcSDEir0cw4v1U+/JrcrdcJzMVgP6NaUAOAHOTjfFc3en2UWdf47H3ckWa5SdKFDUcY5ZrHeO4Zu1yaQ2dK20LWFEe1jG1Wy/XrIISotrG4PgR0qpzbkuQ0h7IG5QoY5DxPvrFrqUJdSD8htRa+qIHjwjDjMtv6Q4pOsgb4yTSogmayU4wpWNgTvSrd98vRyFMpBc2ryV1HCx1paq6AaCdnnmDPQ8FYABB91XWLf0PtBTbgKvEZ5VR02W7egieLXPMIb+kejL7vH8WMfjURl4suhxrn08CKpyYlN2aMWZ41RqsPiRppHdoW44r7SW0kkUTicQKCVlBca8B3iiT8iTWWouxbbSFqUjI1YCeeacTeEnfVn+NX6VQ8CNK2mX6bPanMLafShxtwkqGdj8Krx4es5KlAvgD7Ic2HuoEm65SRrA+NfBfUt7DKj5VI4pR/VglmhP9lZZGeG7Krfu3T/E6alRbPaIbgW1HQVJ3BWSrHzqnpv6gNiR8DXw31w/aPyNR4sj7tkWXGuyRpibohoYJGahzb6nQQk1nirys5yo/KmFXNR+8aRao72yyXKctwBRzoUdsnfNCJUxJQW/WSCsKX5705b5yZERSH0AgK2B8K+OxYqwrSpxORg4Vmr44Ejm5Pyk2N9+0jYq5743OKVNGI0Ng85ge6lTfSL0gIGr/wBmTDEWzcXcRqjMSbhZITTsJMlsONIcceS33hQdlFIJKc5GdyDSpVcMgUrtB4wNy9N/tRefSdWdXpi8e7TnGPLGKK9pTTMyxcJcSejsR7jeYr65ojthtpxxp4thwIGyVKABVjAJ3wKVKgEpMv8A7f8A8Kf1qferc1Ct9nfaUtS5kYvOBWMA6iMDA5beOaVKoQEJPjtXvFKlUIIVNEVHo0NzKsvOFCh4AAgbfOlSoryKx6+wGre5HSypag4gqOsg7hah08qF0qVNkVSdAxu48hGzJ72UyyokIccSk457nFOvKUh5xAJISopGfIkUqVFfqT+wypxWedKlSpRj/9k=';
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
    "#da-bubble img{width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;}" +
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
