"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/data";
import { coordOf } from "@/lib/geo";
import { parseLatLng } from "@/lib/googleMaps";
import { layViTri, loiDinhVi, quyenDinhVi } from "@/lib/dinhVi";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";

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
  // true  = toạ độ THẬT do người đăng ghim tay → marker đứng đúng chỗ
  // false = chỉ suy từ phường/xã → marker chỉ mang tính tương đối, popup phải nói
  //         rõ, không để người xem tưởng bất động sản nằm đúng điểm đó.
  // bỏ trống = không xét (dự án vốn là cả một khu, không có "đúng số nhà" để sai).
  chinhXac?: boolean;
};

export default function MapView({ items, diem }: { items?: Listing[]; diem?: DiemBanDo[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const chamRef = useRef<L.CircleMarker | null>(null);
  const vongRef = useRef<L.CircleMarker | null>(null);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [loi, setLoi] = useState("");

  // Gộp về MỘT dạng điểm: tin đăng thì lấy đơn giá làm nhãn, dự án dùng `diem` sẵn.
  const ds: DiemBanDo[] =
    diem ??
    (items ?? []).map((it) => {
      // ƯU TIÊN TOẠ ĐỘ NGƯỜI ĐĂNG GHIM TAY. Trước đây luôn suy từ tên phường/xã
      // rồi xê dịch ngẫu nhiên cho khỏi chồng marker — nghĩa là tin đã ghim đúng
      // vị trí vẫn bị ném ra một chỗ bịa. Người đăng ghim công cốc, người xem bấm
      // vào marker rồi tới nơi thì không thấy nhà đâu.
      const ghim = it.mapPin ? parseLatLng(it.mapPin) : null;
      const [lat, lng] = ghim ? [ghim.lat, ghim.lng] : coordOf(it.location, it.id);
      return {
        id: it.id,
        lat,
        lng,
        chinhXac: !!ghim,
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
            <span class="map-pop-loc">${d.loc}${d.chinhXac === false ? " · vị trí tương đối" : ""}</span>
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
    // ⚠️ CHỈ dời khung nhìn khi khách TỰ BẤM nút. Bản đồ này để XEM TIN Ở NHIỀU
    // KHU VỰC — tự động kéo về chỗ khách đang đứng là hất hết tin ra khỏi màn,
    // khách mở bản đồ ra thấy trống trơn. Lúc mở chỉ vẽ chấm làm mốc.
    if (doiTamNhin) map.setView(p, 13);
    // Vòng mờ bên ngoài — chấm 7px một mình lọt thỏm giữa rừng viên giá, khách
    // soi không ra. Có quầng xanh thì nhìn phát thấy ngay.
    if (vongRef.current) vongRef.current.setLatLng(p);
    else
      vongRef.current = L.circleMarker(p, {
        radius: 16,
        stroke: false,
        fillColor: "#0071e3",
        fillOpacity: 0.18,
        interactive: false,
      }).addTo(map);
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
  // tuBam=true (khách bấm nút): ép máy đo lại vị trí — tức buộc bật GPS — rồi dời
  // bản đồ về chỗ khách. Tự động lúc mở thì chỉ vẽ chấm, giữ nguyên khung nhìn
  // đang bao trọn các tin.
  function dinhVi(tuBam = true) {
    setLoi("");
    if (tuBam) setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        veCham(lat, lng, tuBam && !chinhXacHon);
      },
      (ma) => {
        setDangDinhVi(false);
        if (!tuBam && ma !== 1) return;
        setLoi(loiDinhVi(ma));
      },
      tuBam,
    );
  }

  // MỞ BẢN ĐỒ LÀ ĐỊNH VỊ LUÔN — khách thấy ngay mình đang ở đâu so với các bất
  // động sản, không phải bấm thêm nút nào.
  // ⚠️ Trình duyệt đã nhớ "từ chối" thì nó KHÔNG hỏi lại nữa, gọi định vị chỉ tổ
  // im re. Nên hỏi trạng thái quyền trước: đang bị chặn thì hiện luôn khối hướng
  // dẫn bật lại, khỏi để khách ngồi đợi cái chấm xanh không bao giờ tới.
  useEffect(() => {
    let huy = false;
    void (async () => {
      if ((await quyenDinhVi()) === "denied") {
        if (!huy) setLoi(loiDinhVi(1));
        return;
      }
      if (!huy) dinhVi(false);
    })();
    return () => {
      huy = true;
    };
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
        onClick={() => dinhVi(true)}
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

      {/* Hướng dẫn bật lại định vị — đặt NGAY TRÊN nút, không đè lên nút */}
      {loi && (
        <div className="absolute bottom-[68px] left-3 right-3 z-[1000] sm:max-w-[360px]">
          <NhacBatDinhVi loi={loi} onThuLai={() => dinhVi(true)} dangDinhVi={dangDinhVi} onDong={() => setLoi("")} />
        </div>
      )}
    </div>
  );
}
