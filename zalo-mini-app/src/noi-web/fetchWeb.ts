// NỐI WEB → MINI APP: mã web gọi máy chủ bằng đường tương đối "/api/…" (cùng tên miền). Trong Mini App mọi lệnh đó đi tới
// https://coastalland.vn/api/… kèm mã phiên Mini App (máy chủ web nhận Bearer — goiTuMiniApp). Gắn một lần khi mở form đăng tin.
import { supabase } from "../lib/supabase";
const WEB = "https://coastalland.vn";
let daGan = false;
export function ganFetchWeb() {
  if (daGan) return;
  daGan = true;
  const goc = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("/api/") && !url.startsWith("/ffmpeg/")) return goc(input, init);
    const { data } = await supabase.auth.getSession();
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    // Chỉ lệnh ghi (POST…) kèm mã phiên — GET để là lệnh "đơn giản", trình duyệt không hỏi trước (CORS)
    const ghi = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase() !== "GET";
    if (ghi && data.session?.access_token && url.startsWith("/api/") && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${data.session.access_token}`);
    return goc(WEB + url, { ...init, headers });
  };
}

// Ảnh / video của mã web dùng đường tương đối (/anh/…, /images/…, /logo/…) → trong Mini App trỏ về coastalland.vn
const doiDuong = (el: Element, thuoc: string) => {
  const v = el.getAttribute(thuoc);
  // CHỈ ảnh trong form web (.form-web) — ảnh riêng của Mini App (logo /logo/…) là tệp của Mini App, không đổi
  if (v && v.startsWith("/") && !v.startsWith("//") && el.closest(".form-web")) el.setAttribute(thuoc, WEB + v);
};
let daGanAnh = false;
export function ganAnhWeb() {
  if (daGanAnh) return;
  daGanAnh = true;
  const quet = (goc: ParentNode) => goc.querySelectorAll?.("img[src^='/'], video[src^='/'], source[src^='/'], video[poster^='/']").forEach((el) => { doiDuong(el, "src"); doiDuong(el, "poster"); });
  quet(document);
  new MutationObserver((ds) => {
    for (const d of ds) {
      if (d.type === "attributes" && d.target instanceof Element) { doiDuong(d.target, "src"); doiDuong(d.target, "poster"); }
      d.addedNodes.forEach((n) => { if (n instanceof Element) { doiDuong(n, "src"); quet(n); } });
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "poster"] });
}
