"use client";

import { useEffect, useRef, useState } from "react";

// ── KHUNG BẢN ĐỒ VỊ TRÍ (dùng chung: chi tiết tin + chi tiết dự án) ────────────
//
// VÌ SAO KHÔNG DÙNG IFRAME NHÚNG NỮA:
//   Bản đồ nhúng của Google (maps.google.com/...&output=embed) BẮT BUỘC hai ngón
//   mới kéo được trên điện thoại. Đó là quy định bên trong iframe của Google,
//   phía mình không tắt được. Dùng Google Maps JavaScript API với
//   gestureHandling: "greedy" thì kéo MỘT ngón chạy đúng như khách mong đợi.
//
// CẦN BIẾN MÔI TRƯỜNG: NEXT_PUBLIC_GOOGLE_MAPS_KEY (Vercel → Environment Variables).
//   Key phải bật 2 API: "Maps JavaScript API" và "Geocoding API".
//   CHƯA có key / tải hỏng / không tra được địa chỉ → tự quay về bản nhúng cũ,
//   web không bao giờ trắng chỗ bản đồ.

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

type LatLng = { lat: number; lng: number };
type GLatLng = { lat(): number; lng(): number };
type GMap = { setOptions(o: Record<string, unknown>): void };
type GMaps = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
  Marker: new (opts: Record<string, unknown>) => unknown;
  Geocoder: new () => {
    geocode(req: { address: string; region?: string }): Promise<{ results: { geometry: { location: GLatLng } }[] }>;
  };
};

declare global {
  interface Window {
    google?: { maps: GMaps };
  }
}

// Admin có thể ghim tay bằng TOẠ ĐỘ hoặc dán LINK Google Maps → lấy thẳng số,
// khỏi tốn một lượt tra địa chỉ (và ghim đúng tuyệt đối).
function parseLatLng(q: string): LatLng | null {
  const m =
    q.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/) ||
    q.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/) ||
    q.match(/[?&]q=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// Nạp thư viện Google Maps ĐÚNG MỘT LẦN cho cả trang (nhiều khối bản đồ vẫn chỉ 1 script).
let mapsPromise: Promise<void> | null = null;
function loadMapsApi(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    const cb = "__cvrGoogleMapsReady";
    (window as unknown as Record<string, unknown>)[cb] = () => resolve();
    const s = document.createElement("script");
    s.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(KEY) +
      "&language=vi&region=VN&loading=async&callback=" +
      cb;
    s.async = true;
    s.onerror = () => reject(new Error("Không tải được Google Maps"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

// Tra địa chỉ → toạ độ. Nhớ lại trong phiên để khách xem đi xem lại một tin
// không gọi Google nhiều lần (tiết kiệm hạn mức).
async function geocode(query: string): Promise<LatLng | null> {
  const cacheKey = "cvr-geo:" + query;
  try {
    const hit = sessionStorage.getItem(cacheKey);
    if (hit) return JSON.parse(hit) as LatLng;
  } catch {}
  const g = window.google;
  if (!g) return null;
  const { results } = await new g.maps.Geocoder().geocode({ address: query, region: "VN" });
  if (!results?.length) return null;
  const loc = results[0].geometry.location;
  const point = { lat: loc.lat(), lng: loc.lng() };
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(point));
  } catch {}
  return point;
}

export default function MapPane({
  query,
  zoom,
  // Bản đồ đang KHOÁ (khách chưa chạm vào) → không nhận cử chỉ, để ngón tay lướt
  // qua bản đồ vẫn cuộn trang bình thường.
  locked,
}: {
  query: string;
  zoom: number;
  locked: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  // "js" = bản đồ tự vẽ (kéo 1 ngón) · "iframe" = bản nhúng cũ khi chưa có key / lỗi
  const [mode, setMode] = useState<"js" | "iframe">(KEY ? "js" : "iframe");

  useEffect(() => {
    if (mode !== "js") return;
    let huy = false;
    (async () => {
      try {
        await loadMapsApi();
        const center = parseLatLng(query) ?? (await geocode(query));
        if (huy || !center || !boxRef.current || !window.google) {
          if (!huy && !center) setMode("iframe");
          return;
        }
        const g = window.google;
        const map = new g.maps.Map(boxRef.current, {
          center,
          zoom,
          // ĐÂY LÀ CHỖ CHO PHÉP KÉO MỘT NGÓN — mặc định của Google là "auto"
          // (điện thoại phải hai ngón).
          gestureHandling: "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          keyboardShortcuts: false,
        });
        new g.maps.Marker({ position: center, map });
        mapRef.current = map;
      } catch {
        if (!huy) setMode("iframe");
      }
    })();
    return () => {
      huy = true;
      mapRef.current = null;
    };
  }, [query, zoom, mode]);

  const size = "h-[260px] w-full sm:h-[320px]";

  if (mode === "iframe") {
    return (
      <iframe
        title="Bản đồ vị trí"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`}
        className={`${size} ${locked ? "pointer-events-none" : ""}`}
        loading="lazy"
      />
    );
  }

  return <div ref={boxRef} aria-label="Bản đồ vị trí" className={`${size} bg-cvr-surface ${locked ? "pointer-events-none" : ""}`} />;
}

// Có key → bản đồ tự vẽ, kéo MỘT ngón. Chưa có key → còn dùng bản nhúng của
// Google, vẫn phải hai ngón; câu hướng dẫn dưới bản đồ đổi theo đúng sự thật.
export const MAP_KEO_MOT_NGON = Boolean(KEY);
