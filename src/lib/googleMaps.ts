// ════════════════════════════════════════════════════════════════════════════
// GOOGLE MAPS — phần dùng chung cho MỌI khối bản đồ trên web
//   · MapPane   — bản đồ XEM ở trang chi tiết tin / dự án
//   · MapPicker — bản đồ GHIM ở form đăng tin (khách & admin)
//
// Vì sao không dùng bản đồ nhúng (iframe): bản nhúng của Google BẮT BUỘC hai
// ngón mới kéo được trên điện thoại. Dùng thư viện JavaScript với
// gestureHandling: "greedy" thì kéo MỘT ngón.
//
// CẦN BIẾN MÔI TRƯỜNG: NEXT_PUBLIC_GOOGLE_MAPS_KEY (Vercel → Environment Variables).
// ════════════════════════════════════════════════════════════════════════════

export const MAP_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

export type LatLng = { lat: number; lng: number };
type GLatLng = { lat(): number; lng(): number };

export type GMap = {
  setOptions(o: Record<string, unknown>): void;
  setCenter(p: LatLng): void;
  getCenter(): GLatLng;
  addListener(ev: string, fn: (e: { latLng?: GLatLng }) => void): unknown;
};
export type GMarker = {
  setPosition(p: LatLng): void;
  setMap(m: GMap | null): void;
  getPosition(): GLatLng | undefined;
  addListener(ev: string, fn: () => void): unknown;
};
export type GMaps = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
  Marker: new (opts: Record<string, unknown>) => GMarker;
  Geocoder: new () => {
    geocode(req: { address: string; region?: string }): Promise<{ results: { geometry: { location: GLatLng } }[] }>;
  };
};

declare global {
  interface Window {
    google?: { maps: GMaps };
  }
}

// Toạ độ ghim tay: "16.05, 108.22" hoặc link Google Maps có @lat,lng / q=lat,lng.
export function parseLatLng(q: string): LatLng | null {
  const m =
    q.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/) ||
    q.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/) ||
    q.match(/[?&]q=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// Ghi toạ độ ra chuỗi lưu vào details.mapPin — 6 số lẻ ≈ sai số 0,1 m, quá đủ.
export function formatLatLng(p: LatLng): string {
  return `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`;
}

// Nạp thư viện Google Maps ĐÚNG MỘT LẦN cho cả trang (nhiều khối bản đồ vẫn chỉ 1 script).
let mapsPromise: Promise<void> | null = null;
export function loadMapsApi(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    const cb = "__cvrGoogleMapsReady";
    (window as unknown as Record<string, unknown>)[cb] = () => resolve();
    const s = document.createElement("script");
    s.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(MAP_KEY) +
      "&language=vi&region=VN&loading=async&callback=" +
      cb;
    s.async = true;
    s.onerror = () => reject(new Error("Không tải được Google Maps"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}
