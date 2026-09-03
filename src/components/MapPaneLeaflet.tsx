"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { docKhoangCach, khoangCachKm, layViTri, loiDinhVi } from "@/lib/dinhVi";
import { timToaDo, type MucDoChinhXac } from "@/lib/timToaDo";
import { centerOfArea } from "@/lib/geo";
import { parseLatLng } from "@/lib/googleMaps";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";

// ── BẢN ĐỒ TRONG TRANG TIN / TRANG DỰ ÁN ─────────────────────────────────────
//
// BẢN ĐỒ NÀY ĐỂ LÀM GÌ (chủ dự án chốt 03/09/2026):
//   Khách đang xem MỘT bất động sản. Bản đồ phải trả lời đúng hai câu:
//     1. "Cái này nằm ở đâu?"  → GHIM ĐỎ, luôn luôn có, càng đúng càng tốt
//     2. "Từ chỗ tôi tới đó thế nào?" → bấm định vị là vẽ đường TỪ CHỖ TÔI ĐẾN ĐÂY
//   Thiếu một trong hai thì bản đồ mất nửa ý nghĩa.
//
// GHIM ĐỎ LẤY Ở ĐÂU — ba mức, xem src/lib/timToaDo.ts:
//   · "ghim"    người đăng ghim tay → đúng tuyệt đối
//   · "duong"   tra tên đường ra toạ độ → đúng đoạn đường
//   · "khuVuc"  chỉ biết phường/xã → ghim giữa khu vực, và PHẢI nói rõ là tương đối
//   Không bao giờ để bản đồ trống ghim: khách nhìn vào không biết tin nằm ở đâu.
//
// VÌ SAO NỀN KHÔNG PHẢI GOOGLE: Google đóng cờ "prohibited territory" vào tài
// khoản thanh toán nên Maps JS không vẽ được, khối bản đồ tụt về bản nhúng — mà
// bản nhúng BẮT HAI NGÓN và không có nút định vị. Leaflet + OpenStreetMap kéo MỘT
// ngón, có định vị, không bao giờ trắng. Phần chỉ đường mở app thật vẫn là Google
// Maps (nút dưới khối này, xem src/lib/moGoogleMaps.ts).
//
// KHOÁ CỬ CHỈ: mặc định bản đồ không nhận thao tác để ngón tay lướt qua vẫn cuộn
// trang. Chạm một cái là mở khoá. Nhưng NÚT ĐỊNH VỊ LUÔN HIỆN kể cả lúc khoá —
// bản trước giấu nút khi khoá, khách mở tin ra không thấy nút nào, tưởng web hỏng.
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
  const LRef = useRef<typeof LType | null>(null);
  const chamRef = useRef<LType.CircleMarker | null>(null);
  const vongRef = useRef<LType.CircleMarker | null>(null);
  const duongRef = useRef<LType.Polyline | null>(null);
  const ghimRef = useRef<LType.Marker | null>(null);
  const vongKhuVucRef = useRef<LType.Circle | null>(null);
  const bdsRef = useRef<[number, number] | null>(null);

  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [loi, setLoi] = useState("");
  const [khoangCach, setKhoangCach] = useState("");
  const [mucDo, setMucDo] = useState<MucDoChinhXac | null>(null);

  const HTML_GHIM =
    "<svg width=\"30\" height=\"40\" viewBox=\"0 0 30 40\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M15 39C15 39 28 24.5 28 14.5A13 13 0 1 0 2 14.5C2 24.5 15 39 15 39Z\" fill=\"#e11d48\" stroke=\"#fff\" stroke-width=\"2.5\"/>" +
    "<circle cx=\"15\" cy=\"14.5\" r=\"4.5\" fill=\"#fff\"/></svg>";

  const GHI_NGUON = "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>";

  // ── DỰNG BẢN ĐỒ + CẮM GHIM ĐỎ ──────────────────────────────────────────────
  //
  // ⚠️ LUẬT: VẼ BẢN ĐỒ NGAY, KHÔNG CHỜ TRA ĐỊA CHỈ.
  // Đã mắc bẫy này một lần rồi: bắt bản đồ đợi dịch vụ tra địa chỉ trả lời mới vẽ
  // → dịch vụ chậm hoặc bị chặn là khách nhìn thấy ô trống. Nên: vẽ ngay bằng thứ
  // biết chắc (toạ độ ghim tay, hoặc tâm phường/xã tra trong bảng có sẵn của web),
  // rồi tra tên đường CHẠY NGẦM; tra xong mới dời ghim cho sát hơn.
  useEffect(() => {
    let huy = false;
    (async () => {
      const L = (await import("leaflet")) as unknown as typeof LType;
      if (huy || !boxRef.current || mapRef.current) return;
      LRef.current = L;

      const ghim = parseLatLng(query);
      const kv = centerOfArea(query);
      const tam: [number, number] = ghim ? [ghim.lat, ghim.lng] : kv ?? [16.054, 108.202];
      const mucBanDau: MucDoChinhXac | null = ghim ? "ghim" : kv ? "khuVuc" : null;

      const map = L.map(boxRef.current, {
        zoomControl: true,
        dragging: !locked,
        scrollWheelZoom: !locked,
        doubleClickZoom: !locked,
        touchZoom: !locked,
      }).setView(tam, ghim ? zoom : kv ? Math.min(zoom, 14) : 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: GHI_NGUON,
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      const icon = L.divIcon({ className: "", html: HTML_GHIM, iconSize: [30, 40], iconAnchor: [15, 39] });

      // Cắm ghim đỏ NGAY bằng thứ đang biết. Chỉ có tâm phường/xã thì khoanh thêm
      // vòng đỏ mờ cho thấy "quanh quanh đây", đỡ hiểu lầm là đúng số nhà.
      if (mucBanDau) {
        bdsRef.current = tam;
        setMucDo(mucBanDau);
        ghimRef.current = L.marker(tam, { icon }).addTo(map);
        if (mucBanDau === "khuVuc") {
          vongKhuVucRef.current = L.circle(tam, {
            radius: 900,
            color: "#e11d48",
            weight: 1.5,
            fillColor: "#e11d48",
            fillOpacity: 0.07,
            interactive: false,
          }).addTo(map);
        }
      }

      // Tự định vị nhẹ nhàng ngay khi mở: chỉ VẼ CHẤM và tính khoảng cách, KHÔNG
      // kéo bản đồ đi — khách đang muốn nhìn bất động sản, giật đi là hỏng.
      setTimeout(() => dinhVi(false), 500);

      // TRA TÊN ĐƯỜNG CHẠY NGẦM — bản đồ đã vẽ xong rồi, tra được thì ghim sát hơn,
      // tra không được cũng không sao.
      if (!ghim) {
        const diem = await timToaDo(query);
        if (huy || !mapRef.current || !diem || diem.mucDo !== "duong") return;
        bdsRef.current = [diem.lat, diem.lng];
        setMucDo("duong");
        vongKhuVucRef.current?.remove();
        vongKhuVucRef.current = null;
        if (ghimRef.current) ghimRef.current.setLatLng([diem.lat, diem.lng]);
        else ghimRef.current = L.marker([diem.lat, diem.lng], { icon }).addTo(map);
        map.setView([diem.lat, diem.lng], zoom);
      }
    })();

    return () => {
      huy = true;
      mapRef.current?.remove();
      mapRef.current = null;
      chamRef.current = null;
      vongRef.current = null;
      duongRef.current = null;
      ghimRef.current = null;
      vongKhuVucRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mở / khoá cử chỉ theo trạng thái bên ngoài
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!locked) {
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

  // Vẽ chấm xanh "tôi ở đây" + đường nối TỪ CHỖ TÔI ĐẾN BẤT ĐỘNG SẢN.
  // noiLai=true là lúc khách chủ động bấm nút: kéo khung nhìn cho thấy cả hai đầu.
  function veViTriToi(lat: number, lng: number, noiLai: boolean) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const toi: [number, number] = [lat, lng];

    if (vongRef.current) vongRef.current.setLatLng(toi);
    else
      vongRef.current = L.circleMarker(toi, {
        radius: 16,
        stroke: false,
        fillColor: "#0071e3",
        fillOpacity: 0.18,
        interactive: false,
      }).addTo(map);

    if (chamRef.current) chamRef.current.setLatLng(toi);
    else
      chamRef.current = L.circleMarker(toi, {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: "#0071e3",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);

    const bds = bdsRef.current;
    if (!bds) {
      if (noiLai) map.setView(toi, 15);
      return;
    }

    const km = khoangCachKm(toi, bds);
    setKhoangCach(docKhoangCach(km));

    // Đường đứt nối hai đầu — nhìn phát hiểu ngay "từ chỗ tôi tới đây".
    if (duongRef.current) duongRef.current.setLatLngs([toi, bds]);
    else
      duongRef.current = L.polyline([toi, bds], {
        color: "#0071e3",
        weight: 3,
        opacity: 0.85,
        dashArray: "7 7",
        interactive: false,
      }).addTo(map);

    if (noiLai) map.fitBounds(L.latLngBounds([toi, bds]), { padding: [55, 55], maxZoom: 16 });
  }

  // tuBam=true: khách chủ động bấm → ÉP máy đo lại vị trí (buộc bật GPS), và kéo
  // khung nhìn cho thấy trọn đường từ chỗ khách tới bất động sản.
  function dinhVi(tuBam: boolean) {
    setLoi("");
    if (tuBam) setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        veViTriToi(lat, lng, tuBam && !chinhXacHon);
      },
      (ma) => {
        setDangDinhVi(false);
        // ⚠️ Định vị TỰ ĐỘNG hỏng thì IM LẶNG. Khách vừa mở tin ra để xem bất động
        // sản, chưa hỏi mình đang ở đâu — bung khối hướng dẫn bật GPS lên che mất
        // bản đồ là phá. Chỉ nói khi khách TỰ BẤM nút.
        if (!tuBam) return;
        setLoi(loiDinhVi(ma));
      },
      tuBam,
    );
  }

  const size = "h-[260px] w-full sm:h-[320px]";

  return (
    <div className="relative">
      <div ref={boxRef} aria-label="Bản đồ vị trí" className={`${size} bg-cvr-surface`} />

      {/* NÚT ĐỊNH VỊ — LUÔN HIỆN, kể cả khi bản đồ đang khoá (xem ghi chú đầu tệp).
          Góc trên bên PHẢI: góc trái là nút phóng to của bản đồ, đáy giữa là lớp
          phủ "Chạm để xem bản đồ".
          z-index trên 800 vì Leaflet xếp marker 600 / popup 700, và phải trên cả
          lớp phủ khoá nằm ở khối cha. */}
      <button
        type="button"
        onClick={() => dinhVi(true)}
        disabled={dangDinhVi}
        className="absolute right-3 top-3 z-[1200] inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-cvr-blue px-3 text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition hover:bg-cvr-blue-ink disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        {dangDinhVi ? "Đang định vị…" : "Từ chỗ tôi đến đây"}
      </button>

      {/* Góc trên trái: đã biết khách đứng đâu thì nói luôn cách bao xa; chưa định
          vị được mà ghim chỉ ở mức khu vực thì nói thật là vị trí tương đối. */}
      {!loi && (khoangCach || mucDo === "khuVuc") && (
        <span className="absolute left-3 top-3 z-[1200] inline-flex max-w-[52%] items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-left text-[12px] font-semibold leading-snug text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
          {khoangCach ? (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cvr-blue ring-2 ring-white" />
              Cách anh/chị khoảng {khoangCach}
            </>
          ) : (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-600 ring-2 ring-white" />
              Vị trí tương đối trong khu vực
            </>
          )}
        </span>
      )}

      {loi && (
        <div className="absolute left-3 right-3 top-[52px] z-[1200] sm:max-w-[360px]">
          <NhacBatDinhVi
            loi={loi}
            onThuLai={() => dinhVi(true)}
            dangDinhVi={dangDinhVi}
            onDong={() => setLoi("")}
          />
        </div>
      )}
    </div>
  );
}

// Bản đồ này kéo MỘT ngón (Leaflet), không phụ thuộc khoá Google.
export const MAP_KEO_MOT_NGON = true;
