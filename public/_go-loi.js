// TẠM — chỉ trên máy thử, xoá trước khi Push. Ghi sự kiện focus / blur / bàn phím ra màn hình để chụp từ điện thoại.
(function () {
  if (!/go-loi=1/.test(location.search)) return;
  var b = document.createElement("pre");
  b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;max-height:38vh;overflow:auto;margin:0;padding:4px 6px;background:rgba(0,0,0,.85);color:#0f0;font:11px/1.3 monospace;pointer-events:none;white-space:pre-wrap";
  if (document.body) document.body.appendChild(b); else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(b); });
  var t0 = Date.now();
  function ten(e) { if (!e || !e.tagName) return String(e); return e.tagName + (e.id ? "#" + e.id : "") + (e.getAttribute && e.getAttribute("contenteditable") ? "[ce]" : "") + (e.placeholder ? "(" + e.placeholder.slice(0, 12) + ")" : ""); }
  function ghi(s) { var vv = window.visualViewport; b.textContent = ((Date.now() - t0) + "ms " + s + " | ih=" + innerHeight + " vv=" + (vv ? Math.round(vv.height) : "-") + " y=" + Math.round(scrollY) + "\n" + b.textContent).slice(0, 3000); }
  ["focusin", "focusout"].forEach(function (k) { document.addEventListener(k, function (e) { ghi(k + " " + ten(e.target) + (k === "focusout" ? " -> " + ten(e.relatedTarget) : "")); }, true); });
  ["pointerdown", "touchstart", "touchend", "click"].forEach(function (k) { document.addEventListener(k, function (e) { ghi(k + " " + ten(e.target) + (e.defaultPrevented ? " PREVENTED" : "")); }, true); window.addEventListener(k, function (e) { if (e.defaultPrevented) ghi(k + " bị huỷ (preventDefault) " + ten(e.target)); }, false); });
  if (window.visualViewport) visualViewport.addEventListener("resize", function () { ghi("vv resize"); });
  window.addEventListener("resize", function () { ghi("win resize"); });
})();
