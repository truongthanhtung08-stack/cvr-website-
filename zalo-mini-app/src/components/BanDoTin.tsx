import React, { useEffect, useRef } from "react";
// ⚠️ WORKER của MapLibre (như web banDoMo.ts napMapLibre): thư viện tự đoán worker nằm cạnh nó — gộp vào gói thì đoán sai, worker
// chết, KHÔNG tải ô bản đồ nào (khung xám) mà không báo lỗi. Tệp worker chép NGUYÊN từ thư viện ra public/maplibre/ (như web
// scripts/chep-maplibre-worker.mjs; không cho Vite đóng lại — gói Mini App nhắm es2015, worker có số BigInt nên đóng gói báo lỗi).
// Nâng maplibre-gl thì chép lại 2 tệp: maplibre-gl-worker.mjs + maplibre-gl-shared.mjs → public/maplibre/*.js.

// BẢN ĐỒ VỊ TRÍ TRONG TRANG TIN — ĐÚNG bản đồ web (src/components/MapPaneMo.tsx + src/lib/banDoMo.ts, 12/11/2026):
// MapLibre + nền OpenFreeMap "liberty", nhãn tiếng Việt, dấu đỏ. Zalo chặn trang google.com nhúng (bản 58), không chặn MapLibre.
// Toạ độ: ghim người đăng (details.mapPin) → không có thì tra địa chỉ (Photon — gọi thẳng được từ Mini App; /api/dia-chi của web
// chưa mở cho Mini App) → không ra thì để tâm khu vực. Thư viện ~440 KB chỉ nạp khi khách cuộn gần tới khung (như web).
// Một ngón cuộn trang, hai ngón kéo / phóng trong khung (cooperativeGestures như web).
const STYLE_MO = "https://tiles.openfreemap.org/styles/liberty";

function docGhim(q: string): { lat: number; lng: number } | null {
  const m = q.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/) || q.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/) ||
    q.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/) || q.match(/[?&](?:q|query|ll)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

async function traDiaChi(cau: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(`https://photon.komoot.io/api/?limit=1&bbox=102,8,110,23.5&q=${encodeURIComponent(cau)}`);
    const c = ((await r.json()) as { features?: { geometry: { coordinates: [number, number] } }[] }).features?.[0]?.geometry.coordinates;
    return c ? { lat: c[1], lng: c[0] } : null;
  } catch {
    return null;
  }
}

export default function BanDoTin({ ghim, soNhaDuong, khuVuc }: { ghim?: string | null; soNhaDuong?: string | null; khuVuc: string }) {
  const hop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let huy = false;
    let banDo: { remove(): void } | null = null;
    const ve = async () => {
      const el = hop.current;
      if (!el) return;
      const ml = await import("maplibre-gl");
      // Đường tệp worker: chạy thử (dev) ở gốc /maplibre/; bản Zalo (www/assets/*.js) ở ../maplibre/ cạnh thư mục assets.
      // Ghép chuỗi để Vite không coi là tệp cần đóng gói.
      const tep = "maplibre/" + "maplibre-gl-worker.js";
      ml.setWorkerUrl(import.meta.env.DEV ? "/" + tep : new URL("../" + tep, import.meta.url).href);
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (huy) return;
      const g = ghim?.trim() ? docGhim(ghim) : null;
      const map = new ml.Map({
        container: el,
        style: STYLE_MO,
        center: g ? [g.lng, g.lat] : [108.202, 16.054],
        zoom: g ? 16 : 12,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
      banDo = map;
      map.on("load", () => {
        el.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"); // nguồn thu thành nút (i) như web
        // Nhãn tiếng Việt như web (vietHoaNhan): có name:vi thì lấy
        for (const lop of map.getStyle().layers ?? []) {
          if (!lop.layout || !("text-field" in lop.layout)) continue;
          try { map.setLayoutProperty(lop.id, "text-field", ["coalesce", ["get", "name:vi"], ["get", "name"]]); } catch { /* lớp chữ kiểu khác */ }
        }
      });
      const diem = g ?? (soNhaDuong?.trim() ? await traDiaChi(`${soNhaDuong.trim()}, ${khuVuc}`) : null) ?? (await traDiaChi(khuVuc));
      if (huy || !diem) return;
      const dung = !!g || !!soNhaDuong?.trim();
      map.jumpTo({ center: [diem.lng, diem.lat], zoom: dung ? 16 : 14 });
      new ml.Marker({ color: "#e11d48" }).setLngLat([diem.lng, diem.lat]).addTo(map);
    };
    const el = hop.current;
    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((ds) => { if (ds.some((d) => d.isIntersecting)) { io?.disconnect(); io = null; void ve().catch(() => {}); } }, { rootMargin: "400px 0px" });
      io.observe(el);
    } else void ve().catch(() => {});
    return () => { huy = true; io?.disconnect(); banDo?.remove(); };
  }, [ghim, soNhaDuong, khuVuc]);

  return <div ref={hop} className="ban-do-tin" />;
}
