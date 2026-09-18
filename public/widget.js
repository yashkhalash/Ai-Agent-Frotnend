/**
 * Aether Agent embeddable widget.
 *
 * Drop this into any site to add a floating chat launcher that opens the
 * agent in an iframe, with its own title bar (minimize / maximize / close).
 * Usage:
 *
 *   <script
 *     src="http://localhost:5173/widget.js"
 *     data-agent-url="http://localhost:5173"
 *   ></script>
 *
 * Optional attributes on the <script> tag:
 *   data-agent-url   Base URL where the frontend is hosted (required)
 *   data-width       Panel width in px (default 380)
 *   data-height      Panel height in px (default 600)
 *   data-position    "right" or "left" (default "right")
 *   data-title       Title shown in the panel header (default "Aether Agent")
 */
(function () {
  var scriptEl = document.currentScript;
  if (!scriptEl) return;

  var agentUrl = scriptEl.getAttribute("data-agent-url");
  if (!agentUrl) {
    console.error("[aether-agent-widget] missing data-agent-url attribute");
    return;
  }
  var width = parseInt(scriptEl.getAttribute("data-width") || "380", 10);
  var height = parseInt(scriptEl.getAttribute("data-height") || "600", 10);
  var side = scriptEl.getAttribute("data-position") === "left" ? "left" : "right";
  var title = scriptEl.getAttribute("data-title") || "Aether Agent";

  var open = false;
  var maximized = false;

  function svg(path) {
    return (
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      path +
      "</svg>"
    );
  }
  var ICON_MINIMIZE = svg('<path d="M5 12h14"></path>');
  var ICON_MAXIMIZE = svg(
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>' +
      '<path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>'
  );
  var ICON_RESTORE = svg(
    '<path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>' +
      '<path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>'
  );
  var ICON_CLOSE = svg('<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>');
  var ICON_CHAT = svg(
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>'
  );

  var launcher = document.createElement("button");
  launcher.setAttribute("aria-label", "Open chat");
  launcher.style.cssText = [
    "position:fixed",
    "bottom:20px",
    side + ":20px",
    "width:56px",
    "height:56px",
    "border-radius:9999px",
    "border:none",
    "cursor:pointer",
    "z-index:2147483000",
    "background:linear-gradient(135deg,#7c3aed,#d946ef)",
    "box-shadow:0 8px 24px rgba(124,58,237,0.4)",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "color:white",
    "transition:transform 0.15s ease",
  ].join(";");
  launcher.innerHTML = ICON_CHAT.replace('width="15" height="15"', 'width="24" height="24"');

  var panelWrap = document.createElement("div");
  panelWrap.style.cssText = [
    "position:fixed",
    "display:none",
    "flex-direction:column",
    "border-radius:16px",
    "overflow:hidden",
    "box-shadow:0 20px 60px rgba(0,0,0,0.45)",
    "z-index:2147483000",
    "background:#0b0c10",
    "border:1px solid rgba(255,255,255,0.08)",
    "transition:width 0.18s ease,height 0.18s ease",
  ].join(";");

  function applySize() {
    var normal = {
      bottom: "88px",
      side: "20px",
      width: width + "px",
      height: height + "px",
      maxWidth: "calc(100vw - 40px)",
      maxHeight: "calc(100vh - 120px)",
    };
    var big = {
      bottom: "20px",
      side: "20px",
      width: "min(720px, calc(100vw - 40px))",
      height: "min(85vh, 860px)",
      maxWidth: "calc(100vw - 40px)",
      maxHeight: "calc(100vh - 40px)",
    };
    var s = maximized ? big : normal;
    panelWrap.style.bottom = s.bottom;
    panelWrap.style[side] = s.side;
    panelWrap.style.width = s.width;
    panelWrap.style.maxWidth = s.maxWidth;
    panelWrap.style.height = s.height;
    panelWrap.style.maxHeight = s.maxHeight;
  }
  applySize();

  var header = document.createElement("div");
  header.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:space-between",
    "gap:8px",
    "padding:10px 12px",
    "background:rgba(255,255,255,0.03)",
    "border-bottom:1px solid rgba(255,255,255,0.08)",
    "flex-shrink:0",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  ].join(";");

  var headerTitle = document.createElement("div");
  headerTitle.style.cssText = [
    "display:flex",
    "align-items:center",
    "gap:8px",
    "color:#f5f5f7",
    "font-size:13px",
    "font-weight:600",
  ].join(";");
  var dot = document.createElement("span");
  dot.style.cssText =
    "width:8px;height:8px;border-radius:9999px;background:#34d399;box-shadow:0 0 6px #34d399;";
  headerTitle.appendChild(dot);
  var titleText = document.createElement("span");
  titleText.textContent = title;
  headerTitle.appendChild(titleText);

  var headerActions = document.createElement("div");
  headerActions.style.cssText = "display:flex;align-items:center;gap:2px;";

  function makeIconButton(html, label) {
    var btn = document.createElement("button");
    btn.setAttribute("aria-label", label);
    btn.title = label;
    btn.innerHTML = html;
    btn.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "width:26px",
      "height:26px",
      "border-radius:8px",
      "border:none",
      "background:transparent",
      "color:rgba(245,245,247,0.55)",
      "cursor:pointer",
      "transition:background 0.15s ease,color 0.15s ease",
    ].join(";");
    btn.addEventListener("mouseenter", function () {
      btn.style.background = "rgba(255,255,255,0.08)";
      btn.style.color = "#fff";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.background = "transparent";
      btn.style.color = "rgba(245,245,247,0.55)";
    });
    return btn;
  }

  function setOpen(next) {
    open = next;
    panelWrap.style.display = open ? "flex" : "none";
    launcher.style.transform = open ? "scale(0.92)" : "scale(1)";
  }

  var minimizeBtn = makeIconButton(ICON_MINIMIZE, "Minimize");
  minimizeBtn.addEventListener("click", function () {
    setOpen(false);
  });

  var maximizeBtn = makeIconButton(ICON_MAXIMIZE, "Maximize");
  maximizeBtn.addEventListener("click", function () {
    maximized = !maximized;
    applySize();
    maximizeBtn.innerHTML = maximized ? ICON_RESTORE : ICON_MAXIMIZE;
    maximizeBtn.title = maximized ? "Restore" : "Maximize";
  });

  var closeBtn = makeIconButton(ICON_CLOSE, "Close");
  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });

  headerActions.appendChild(minimizeBtn);
  headerActions.appendChild(maximizeBtn);
  headerActions.appendChild(closeBtn);

  header.appendChild(headerTitle);
  header.appendChild(headerActions);

  var iframe = document.createElement("iframe");
  iframe.title = "Aether Agent chat";
  iframe.style.cssText = "flex:1;width:100%;border:0;";
  iframe.src = agentUrl.replace(/\/$/, "") + "/?embed=1";

  panelWrap.appendChild(header);
  panelWrap.appendChild(iframe);

  launcher.addEventListener("click", function () {
    setOpen(!open);
  });

  window.addEventListener("resize", applySize);

  document.body.appendChild(panelWrap);
  document.body.appendChild(launcher);
})();
