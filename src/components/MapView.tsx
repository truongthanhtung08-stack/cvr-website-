"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/data";
import { coordOf } from "@/lib/geo";

// Chế độ Bản đồ (Leaflet + OpenStreetMap) — marker là viên chữ: ĐƠN GIÁ với tin
// đăng, TÊN DỰ ÁN với dự án. Bấm ra popup thẻ mini dẫn tới trang chi tiết.
// ⚠️ Chỉ render phía client — nơi dùng phải import qua next/dynamic với ssr:false.
//
// Kéo MỘT ngón là mặc định của Leaflet, không phải cấu hình gì.

// Một điểm trên bản đồ — dùng chung cho tin đăng và dự án.
export type DiemBanDo = {
  id: string;
  lat: number;
  lng: number;
  nhan: string;   // chữ trên viên marker: đơn giá (tin) hoặc tên dự án (dự án)
  title: string;
  phu: string;    // dòng phụ trong popup: "7 tỷ · 85 m²" hoặc "Đang mở bán"
  loc: string;
  image: string;
  href: string;
};

export default function MapView({ items, diem }: { items?: Listing[]; diem?: DiemBanDo[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const chamRef = useRef<L.CircleMarker | null>(null);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [loi, setLoi] = useState("");

  // Gộp về MỘT dạng điểm: tin đăng thì lấy đơn giá làm nhãn, dự án dùng `diem` sẵn.
  const ds: DiemBanDo[] =
    diem ??
    (items ?? []).map((it) => {
      const [lat, lng] = coordOf(it.location, it.id);
      return {
        id: it.id,
        lat,
        lng,
        nhan: it.price,
        title: it.title,
        phu: `${it.price} · ${it.area}`,
        loc: it.location,
        image: it.image,
        href: `/bat-dong-san/${it.id}`,
      };
    });

  // Khởi tạo bản đồ 1 lần
  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;
    const map = L.map(boxRef.current).setView([16.05, 108.22], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      chamRef.current = null;
    };
  }, []);

  // Vẽ lại marker mỗi khi kết quả lọc đổi + tự khớp khung nhìn
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (ds.length === 0) return;

    const bounds = L.latLngBounds([]);
    for (const d of ds) {
      bounds.extend([d.lat, d.lng]);
      const marker = L.marker([d.lat, d.lng], {
        icon: L.divIcon({ className: "map-pin", html: `<span class="map-pill">${d.nhan}</span>`, iconSize: [0, 0] }),
      }).addTo(layer);
      marker.bindPopup(
        `<a class="map-pop" href="${d.href}">
          <img src="${d.image}" alt="" loading="lazy" />
          <span class="map-pop-body">
            <span class="map-pop-title">${d.title}</span>
            <span class="map-pop-price">${d.phu}</span>
            <span class="map-pop-loc">${d.loc}</span>
          </span>
        </a>`,
        { closeButton: false, offset: L.point(0, -14) },
      );
    }
    map.fitBounds(bounds.pad(0.15), { maxZoom: 14 });
    // ds dựng lại mỗi lần render nên so theo nội dung, không so tham chiếu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ds.map((d) => d.id + d.lat + d.lng))]);

  // ── VỊ TRÍ CỦA TÔI ─────────────────────────────────────────────────────────
  // Khách cần biết mình đang đứng đâu so với các bất động sản, rồi mới tự phóng
  // và kéo bản đồ tìm tiếp. GPS tắt thì báo rõ, không im lặng.
  // Vẽ / dời chấm xanh vị trí khách
  function veCham(lat: number, lng: number, doiTamNhin: boolean) {
    const map = mapRef.current;
    if (!map) return;
    const p: [number, number] = [lat, lng];
    if (doiTamNhin) map.setView(p, 14);
    if (chamRef.current) chamRef.current.setLatLng(p);
    else
      chamRef.current = L.circleMarker(p, {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: "#0071e3",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
  }

  // ĐỊNH VỊ HAI CHẶNG CHO NHANH:
  //   Chặng 1 — enableHighAccuracy: FALSE + nhận vị trí cũ trong 10 phút. Máy lấy
  //     theo wifi/trạm phát sóng nên thường có NGAY DƯỚI 1 GIÂY. Chấm xanh hiện
  //     lập tức, khách không phải ngồi chờ.
  //   Chặng 2 — enableHighAccuracy: TRUE chạy ngầm, có kết quả sát hơn thì tự dời
  //     chấm cho đúng. Khách không thấy độ trễ nào.
  // Bật cờ enableHighAccuracy ngay từ đầu là sai lầm cũ: máy chờ bắt được GPS thật
  // mới trả về, ngoài trời cũng mất 5–15 giây, trong nhà thì treo luôn.
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
        // Chặng 2: tinh chỉnh ngầm, không hiện "đang định vị" nữa
        navigator.geolocation.getCurrentPosition(
          (chinhXac) => veCham(chinhXac.coords.latitude, chinhXac.coords.longitude, false),
          () => {},
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      },
      (e) => {
        setDangDinhVi(false);
        setLoi(
          e.code === 1
            ? "Anh/chị đang CHẶN định vị. Bấm ổ khoá 🔒 cạnh địa chỉ web → Vị trí → Cho phép, rồi bấm lại nút này."
            : e.code === 2
              ? "Máy CHƯA BẬT GPS. Vào Cài đặt điện thoại → Vị trí, bật lên rồi bấm lại nút này."
              : "Định vị lâu quá. Bật GPS rồi bấm lại giúp em.",
        );
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 },
    );
  }

  // MỞ BẢN ĐỒ LÀ ĐỊNH VỊ LUÔN — khách thấy ngay mình đang ở đâu so với các bất
  // động sản, không phải bấm thêm nút nào. Chặn định vị thì lời nhắc hiện lên.
  useEffect(() => {
    const t = setTimeout(dinhVi, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={boxRef} aria-label="Bản đồ bất động sản" className="h-full w-full" />

      {/* NÚT VỊ TRÍ — nổi trên bản đồ, góc dưới trái.
          ⚠️ z-index phải TRÊN 800: Leaflet xếp lớp marker ở 600 và popup ở 700, để
          z-500 thì nút bị marker che mất, bấm không trúng. Nút phóng to của Leaflet
          nằm góc trên trái nên không đụng nhau. */}
      <button
        type="button"
        onClick={dinhVi}
        disabled={dangDinhVi}
        className="absolute bottom-4 left-3 z-[1000] inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-cvr-blue px-3.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition hover:bg-cvr-blue-ink disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        {dangDinhVi ? "Đang định vị…" : "Vị trí của tôi"}
      </button>

      {/* Lời nhắc bật GPS — đặt NGAY TRÊN nút, không đè lên nút như trước */}
      {loi && (
        <p className="absolute bottom-[68px] left-3 right-3 z-[1000] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] font-medium leading-snug text-amber-900 shadow-lg">
          {loi}
        </p>
      )}
    </div>
  );
}
