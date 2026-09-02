"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { centerOfArea } from "@/lib/geo";
import { parseLatLng } from "@/lib/googleMaps";

// ── BẢN ĐỒ VỊ TRÍ TRONG TRANG TIN / TRANG DỰ ÁN ──────────────────────────────
//
// VÌ SAO KHÔNG DÙNG NỀN GOOGLE (chốt 02/09/2026): Google đóng cờ "prohibited
// territory" vào tài khoản thanh toán (do bật VPN hôm 30/08) nên Maps JS không
// vẽ được, khối bản đồ tụt về BẢN NHÚNG của Google — mà bản nhúng thì BẮT HAI
// NGÓN mới kéo được và không có nút định vị. Leaflet + OpenStreetMap kéo MỘT
// ngón, có định vị, không cần khoá và không bao giờ trắng.
//
// Phần CHỈ ĐƯỜNG vẫn là Google Maps thật (nút bên dưới khối này, mở thẳng app).
//
// KHOÁ CỬ CHỈ: mặc định bản đồ KHÔNG nhận thao tác, để ngón tay lướt qua vẫn cuộn
// trang bình thường. Chạm một cái là mở khoá, từ đó kéo/phóng bằng MỘT ngón.
export default function MapPaneLeaflet({
  query,
  zoom,
  locked,
}: {
  query: string;
  zoom: number;
  locked: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const chamRef = useRef<LType.CircleMarker | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [loi, setLoi] = useState("");

  const HTML_GHIM =
    "<svg width=\"30\" height=\"40\" viewBox=\"0 0 30 40\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M15 39C15 39 28 24.5 28 14.5A13 13 0 1 0 2 14.5C2 24.5 15 39 15 39Z\" fill=\"#e11d48\" stroke=\"#fff\" stroke-width=\"2.5\"/>" +
    "<circle cx=\"15\" cy=\"14.5\" r=\"4.5\" fill=\"#fff\"/></svg>";

  const GHI_NGUON = "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>";

  // Dựng bản đồ một lần
  useEffect(() => {
    let huy = false;
    (async () => {
      const L = (await import("leaflet")) as unknown as typeof LType;
      if (huy || !boxRef.current || mapRef.current) return;
      LRef.current = L;

      // Toạ độ ghim tay (details.mapPin) chính xác tuyệt đối; không có thì lấy tâm
      // khu vực — nói đúng "đây là giữa khu vực", không giả vờ đúng căn nhà.
      const ghim = parseLatLng(query);
      const kv = centerOfArea(query);
      const tam: [number, number] = ghim ? [ghim.lat, ghim.lng] : kv ? [kv[0], kv[1]] : [16.054, 108.202];

      const map = L.map(boxRef.current, {
        zoomControl: true,
        // Khoá lúc đầu → ngón tay lướt qua bản đồ vẫn cuộn được trang
        dragging: !locked,
        scrollWheelZoom: !locked,
        doubleClickZoom: !locked,
        touchZoom: !locked,
      }).setView(tam, ghim ? zoom : Math.min(zoom, 14));

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: GHI_NGUON,
        maxZoom: 19,
      }).addTo(map);

      // Chỉ ghim khi biết ĐÚNG điểm — chỉ có tâm khu vực thì không cắm ghim để
      // khách khỏi tưởng đó là đúng địa chỉ căn nhà.
      if (ghim) {
        const icon = L.divIcon({ className: "", html: HTML_GHIM, iconSize: [30, 40], iconAnchor: [15, 39] });
        L.marker([ghim.lat, ghim.lng], { icon }).addTo(map);
      }

      mapRef.current = map;
    })();

    return () => {
      huy = true;
      mapRef.current?.remove();
      mapRef.current = null;
      chamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mở / khoá cử chỉ theo trạng thái bên ngoài
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const bat = !locked;
    if (bat) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    }
  }, [locked]);

  // ĐỊNH VỊ HAI CHẶNG CHO NHANH — chặng 1 lấy theo wifi/trạm phát sóng (dưới 1
  // giây), chặng 2 GPS chính xác chạy ngầm rồi tự chỉnh lại.
  function veCham(lat: number, lng: number, doiTamNhin: boolean) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (doiTamNhin) map.setView([lat, lng], 15);
    if (chamRef.current) chamRef.current.setLatLng([lat, lng]);
    else
      chamRef.current = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: "#0071e3",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
  }

  function dinhVi() {
    if (!navigator.geolocation) {
      setLoi("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    setLoi("");
    setDangDinhVi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDangDinhVi(false);
        veCham(pos.coords.latitude, pos.coords.longitude, true);
        navigator.geolocation.getCurrentPosition(
          (sat) => veCham(sat.coords.latitude, sat.coords.longitude, false),
          () => {},
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      },
      (e) => {
        setDangDinhVi(false);
        setLoi(
          e.code === 1
            ? "Anh/chị đang CHẶN định vị. Bấm ổ khoá 🔒 cạnh địa chỉ web → Vị trí → Cho phép, rồi bấm lại."
            : e.code === 2
              ? "Máy CHƯA BẬT GPS. Vào Cài đặt điện thoại → Vị trí, bật lên rồi bấm lại."
              : "Định vị lâu quá, bấm lại giúp em.",
        );
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 },
    );
  }

  const size = "h-[260px] w-full sm:h-[320px]";

  return (
    <div className="relative">
      <div ref={boxRef} aria-label="Bản đồ vị trí" className={`${size} bg-cvr-surface`} />

      {/* NÚT VỊ TRÍ — chỉ hiện khi bản đồ đã mở khoá, để lúc cuộn trang không vướng.
          z-index phải trên 800 vì Leaflet xếp marker 600 / popup 700. */}
      {!locked && (
        <button
          type="button"
          onClick={dinhVi}
          disabled={dangDinhVi}
          className="absolute bottom-3 left-3 z-[1000] inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-cvr-blue px-3.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition hover:bg-cvr-blue-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          {dangDinhVi ? "Đang định vị…" : "Vị trí của tôi"}
        </button>
      )}

      {loi && !locked && (
        <p className="absolute bottom-[60px] left-3 right-3 z-[1000] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] font-medium leading-snug text-amber-900 shadow-lg">
          {loi}
        </p>
      )}
    </div>
  );
}

// Bản đồ này kéo MỘT ngón (Leaflet), không phụ thuộc khoá Google.
export const MAP_KEO_MOT_NGON = true;
