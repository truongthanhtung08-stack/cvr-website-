"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAP_KEY,
  loadMapsApi,
  soatVeDuoc,
  onMapsAuthFailure,
  parseLatLng,
  type GMap,
  type GMarker,
  type LatLng,
} from "@/lib/googleMaps";
import { centerOfArea } from "@/lib/geo";
import { timToaDo } from "@/lib/timToaDo";
import { layViTri, loiDinhVi, quyenDinhVi } from "@/lib/dinhVi";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";

// ════════════════════════════════════════════════════════════════════════════
// BẢN ĐỒ XEM VỊ TRÍ — trang chi tiết tin và trang chi tiết dự án. NỀN GOOGLE.
//
// Khác hẳn bản đồ GHIM ở form đăng tin: đây là bản đồ cho NGƯỜI MUA, chỉ để xem.
// Không ghim, không sửa gì — chỉ trả lời đúng một câu hỏi "cái nhà này nằm ở đâu".
//
// THỨ TỰ TÌM ĐIỂM ĐẶT GHIM ĐỎ, chắc chắn nhất trước:
//   1. Toạ độ người đăng GHIM TAY  → ghim đỏ, đúng tuyệt đối
//   2. Tra được tới tên đường       → ghim đỏ
//   3. Chỉ biết khu vực             → mở rộng cả khu vực, KHÔNG cắm ghim
//      (cắm ghim giữa phường là chỉ sai nhà người ta)
// Bảng tâm khu vực nằm sẵn trong src/lib/geo.ts nên bước 3 không cần mạng —
// bản đồ luôn hiện đúng vùng ngay lập tức, rồi mới chỉnh lại cho sát.
// ════════════════════════════════════════════════════════════════════════════

export default function MapPaneGoogle({
  query,
  zoom,
  locked,
}: {
  query: string;
  zoom: number;
  // Khách chưa chạm vào bản đồ → khoá cử chỉ để ngón tay lướt qua vẫn cuộn trang.
  locked: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const ghimRef = useRef<GMarker | null>(null);
  const chamRef = useRef<GMarker | null>(null);
  const lockedRef = useRef(locked);

  const [sanSang, setSanSang] = useState(false);
  const [hong, setHong] = useState(!MAP_KEY);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [loi, setLoi] = useState("");
  const [tuongDoi, setTuongDoi] = useState(false);

  useEffect(() => {
    lockedRef.current = locked;
    mapRef.current?.setOptions({ gestureHandling: locked ? "none" : "greedy" });
  }, [locked]);

  useEffect(() => {
    if (!MAP_KEY) return;
    let huy = false;
    (async () => {
      try {
        await loadMapsApi();
        if (huy || !boxRef.current || !window.google) return;
        const g = window.google;

        const ghim = parseLatLng(query);
        const kv = centerOfArea(query);
        const tam: LatLng = ghim ?? (kv ? { lat: kv[0], lng: kv[1] } : { lat: 16.054, lng: 108.202 });

        const map = new g.maps.Map(boxRef.current, {
          center: tam,
          zoom: ghim ? zoom : Math.min(zoom, 13),
          gestureHandling: lockedRef.current ? "none" : "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          keyboardShortcuts: false,
        });
        mapRef.current = map;
        setSanSang(true);
        // Google nhận khoá nhưng không vẽ thì cũng phải biết mà lùi về dự phòng.
        soatVeDuoc(boxRef.current, () => {
          if (!huy) setHong(true);
        });

        if (ghim) {
          ghimRef.current = new g.maps.Marker({ position: ghim, map });
          return;
        }

        // Chưa ghim tay → tra địa chỉ ở NỀN. Bản đồ đã hiện sẵn khu vực rồi nên
        // khách không phải nhìn ô trắng trong lúc chờ.
        const kq = await timToaDo(query);
        if (huy || !kq || !mapRef.current) return;
        if (kq.mucDo === "khuVuc") {
          // Chỉ tới được khu vực: dời khung cho đúng vùng, KHÔNG cắm ghim.
          mapRef.current.setCenter({ lat: kq.lat, lng: kq.lng });
          setTuongDoi(true);
          return;
        }
        mapRef.current.setCenter({ lat: kq.lat, lng: kq.lng });
        mapRef.current.setOptions({ zoom });
        ghimRef.current = new g.maps.Marker({ position: { lat: kq.lat, lng: kq.lng }, map: mapRef.current });
      } catch {
        if (!huy) setHong(true);
      }
    })();
    return () => {
      huy = true;
      mapRef.current = null;
      ghimRef.current = null;
      chamRef.current = null;
    };
  }, [query, zoom]);

  useEffect(() => onMapsAuthFailure(() => setHong(true)), []);

  // Chấm xanh "vị trí của bạn" — để khách áng chừng mình cách chỗ này bao xa.
  function veCham(p: LatLng, doiTamNhin: boolean) {
    const g = window.google;
    const map = mapRef.current;
    if (!g || !map) return;
    if (doiTamNhin) map.setCenter(p);
    if (chamRef.current) chamRef.current.setPosition(p);
    else
      chamRef.current = new g.maps.Marker({
        position: p,
        map,
        clickable: false,
        zIndex: 1,
        title: "Vị trí của bạn",
        icon: { path: 0, scale: 7, fillColor: "#0071e3", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
      });
  }

  function dinhVi(tuBam: boolean) {
    setLoi("");
    if (tuBam) setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        veCham({ lat, lng }, tuBam && !chinhXacHon);
      },
      (ma) => {
        setDangDinhVi(false);
        // Tự động lúc mở trang thì im lặng, chỉ khách tự bấm mới báo.
        if (!tuBam && ma !== 1) return;
        if (tuBam) setLoi(loiDinhVi(ma));
      },
      tuBam,
    );
  }

  // Mở trang là vẽ chấm xanh sẵn, nhưng LẶNG LẼ và không kéo bản đồ đi đâu —
  // khách vào đây để xem CÁI NHÀ, không phải xem chỗ mình đang đứng.
  useEffect(() => {
    let huy = false;
    void (async () => {
      if (huy || (await quyenDinhVi()) === "denied") return;
      if (!huy && sanSang) dinhVi(false);
    })();
    return () => {
      huy = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanSang]);

  const cao = "h-[260px] w-full sm:h-[320px]";

  return (
    <div className="relative">
      <div ref={boxRef} aria-label="Bản đồ vị trí" className={`${cao} bg-cvr-surface`} />

      {!sanSang && !hong && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-medium text-cvr-muted">
          Đang mở bản đồ…
        </span>
      )}
      {hong && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] font-medium text-cvr-muted">
          Chưa mở được bản đồ. Anh/chị bấm “Mở Google Maps” bên dưới để xem vị trí.
        </span>
      )}

      {/* Chỉ tra được tới khu vực thì NÓI THẲNG, đừng để khách tưởng ghim đúng nhà */}
      {tuongDoi && sanSang && (
        <span className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-md bg-white/92 px-2.5 py-1.5 text-[11.5px] font-medium text-cvr-body shadow-sm backdrop-blur-sm">
          Vị trí tương đối theo khu vực — tin này chưa ghim điểm chính xác.
        </span>
      )}

      {sanSang && !locked && (
        <button
          type="button"
          onClick={() => dinhVi(true)}
          disabled={dangDinhVi}
          className="absolute bottom-3 right-3 z-10 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-cvr-blue px-3 text-[12.5px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition hover:bg-cvr-blue-ink disabled:opacity-60"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          {dangDinhVi ? "Đang định vị…" : "Vị trí của tôi"}
        </button>
      )}

      {loi && (
        <div className="absolute bottom-14 left-3 right-3 z-10">
          <NhacBatDinhVi loi={loi} onThuLai={() => dinhVi(true)} dangDinhVi={dangDinhVi} onDong={() => setLoi("")} />
        </div>
      )}
    </div>
  );
}
