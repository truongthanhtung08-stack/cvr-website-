"use client";

import { useEffect, useRef, useState } from "react";
import { centerOfArea } from "@/lib/geo";
import { MAP_KEY, loadMapsApi, onMapsAuthFailure, parseLatLng, type GMap, type GMarker, type LatLng } from "@/lib/googleMaps";

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
//   CHƯA có key / tải hỏng → tự quay về bản nhúng cũ, web không bao giờ trắng chỗ bản đồ.

// Tra địa chỉ → toạ độ. Nhớ lại trong phiên để khách xem đi xem lại một tin
// không gọi Google nhiều lần (tiết kiệm hạn mức).
//
// LÙI DẦN ĐỘ CHI TIẾT: địa chỉ đầy đủ tra không ra thì bỏ bớt phần đầu rồi tra
// lại theo phường/xã, cuối cùng là tỉnh/thành.
// ⚠️ ĐỪNG BỎ vòng lặp này: trước đây tra hỏng MỘT phát là rơi thẳng về bản đồ
// NHÚNG cũ — mà bản nhúng thì BẮT BUỘC hai ngón, đúng cái lỗi cần diệt. Tin nào
// địa chỉ Google không nhận ra (số nhà lạ, tên đường viết tắt) là khách lại phải
// dùng hai ngón, trong khi tin khác thì một ngón — rối và không giải thích được.
//
// Cờ coarse: ghim theo địa chỉ rút gọn thì phóng xa ra, không giả vờ chính xác.
async function geocode(query: string): Promise<(LatLng & { coarse: boolean }) | null> {
  const g = window.google;
  if (!g) return null;
  const parts = query.split(",").map((s) => s.trim()).filter(Boolean);
  const geocoder = new g.maps.Geocoder();

  for (let i = 0; i < parts.length; i++) {
    const address = parts.slice(i).join(", ");
    const cacheKey = "cvr-geo:" + address;
    try {
      const hit = sessionStorage.getItem(cacheKey);
      if (hit) return { ...(JSON.parse(hit) as LatLng), coarse: i > 0 };
    } catch {}
    try {
      const { results } = await geocoder.geocode({ address, region: "VN" });
      if (results?.length) {
        const loc = results[0].geometry.location;
        const point = { lat: loc.lat(), lng: loc.lng() };
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(point));
        } catch {}
        return { ...point, coarse: i > 0 };
      }
    } catch {}
  }
  return null;
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
  // Trạng thái khoá đọc qua ref: dựng bản đồ cần biết giá trị hiện tại, nhưng
  // KHÔNG được để nó nằm trong deps — mỗi lần khách mở/khoá mà dựng lại bản đồ
  // là tính thêm một lượt tải bản đồ với Google.
  const lockedRef = useRef(locked);
  // Chấm xanh "vị trí của bạn" — mọi bản đồ trên web đều phải cho khách biết
  // mình đang đứng ở đâu, rồi tự phóng / kéo tìm chỗ cần xem.
  const chamRef = useRef<GMarker | null>(null);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  // "js" = bản đồ tự vẽ (kéo 1 ngón) · "iframe" = bản nhúng cũ khi chưa có key / lỗi
  const [mode, setMode] = useState<"js" | "iframe">(MAP_KEY ? "js" : "iframe");

  useEffect(() => {
    if (mode !== "js") return;
    let huy = false;
    (async () => {
      try {
        await loadMapsApi();
        if (huy || !boxRef.current || !window.google) return;
        const g = window.google;

        // ── BƯỚC 1: VẼ BẢN ĐỒ NGAY, không chờ ai cả ──────────────────────────
        // ⚠️ ĐỪNG đưa việc tra địa chỉ lên trước bước này. Dịch vụ tra địa chỉ
        // của Google có lúc bị chặn (chưa bật đủ, hết hạn mức, lỗi mạng); chờ nó
        // là khách nhìn thấy một ô XÁM TRẮNG. Biết khu vực là vẽ được rồi.
        const pin = parseLatLng(query);
        const khuVuc = centerOfArea(query);
        const center: LatLng =
          pin ?? (khuVuc ? { lat: khuVuc[0], lng: khuVuc[1] } : { lat: 16.054, lng: 108.202 });

        const map = new g.maps.Map(boxRef.current, {
          center,
          // Chưa biết đúng điểm thì mở rộng cả khu vực, không giả vờ chính xác.
          zoom: pin ? zoom : Math.min(zoom, 13),
          // ĐÂY LÀ CHỖ CHO PHÉP KÉO MỘT NGÓN — mặc định của Google là "auto"
          // (điện thoại phải hai ngón).
          gestureHandling: lockedRef.current ? "none" : "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          keyboardShortcuts: false,
        });
        mapRef.current = map;

        // CANH CHỪNG: Google có thể từ chối vẽ (tài khoản chưa mở khoá Maps, hết
        // hạn mức, sai khoá) và để lại một Ô XÁM TRẮNG. Chờ vài giây, không thấy
        // bản đồ mọc ra thì lùi về bản nhúng — bản nhúng phải hai ngón, nhưng
        // KHÁCH VẪN THẤY BẢN ĐỒ, còn hơn nhìn ô trắng.
        setTimeout(() => {
          if (huy) return;
          if (!boxRef.current?.querySelector(".gm-style")) setMode("iframe");
        }, 3000);

        // Khách/admin đã tự ghim vị trí → CẮM GHIM ĐỎ, chắc chắn đúng điểm.
        if (pin) {
          new g.maps.Marker({ position: pin, map });
          return;
        }

        // ── BƯỚC 2: tra địa chỉ ở NỀN, ra kết quả thì dời bản đồ tới đúng chỗ ──
        // Tra được tới số nhà / tên đường → dời + cắm ghim đỏ.
        // Chỉ ra tới phường/tỉnh (hoặc tra hỏng) → giữ nguyên khung khu vực,
        // KHÔNG cắm ghim — cắm là chỉ sai nhà người ta.
        const found = await geocode(query);
        if (huy || !found || found.coarse) return;
        map.setCenter({ lat: found.lat, lng: found.lng });
        map.setOptions({ zoom });
        new g.maps.Marker({ position: { lat: found.lat, lng: found.lng }, map });
      } catch {
        if (!huy) setMode("iframe");
      }
    })();
    return () => {
      huy = true;
      mapRef.current = null;
    };
  }, [query, zoom, mode]);

  // Google từ chối khoá/tài khoản → lùi về bản nhúng NGAY, không đợi canh chừng.
  useEffect(() => onMapsAuthFailure(() => setMode("iframe")), []);

  // Mở/khoá bằng chính cử chỉ của Google, không chỉ dựa vào pointer-events:
  // "none" = bản đồ bỏ qua mọi cử chỉ (ngón tay lướt qua vẫn cuộn trang),
  // "greedy" = MỘT ngón kéo được ngay.
  useEffect(() => {
    lockedRef.current = locked;
    mapRef.current?.setOptions({ gestureHandling: locked ? "none" : "greedy" });
  }, [locked]);

  function viTriCuaToi() {
    const map = mapRef.current;
    const g = window.google;
    if (!map || !g || !navigator.geolocation) return;
    setDangDinhVi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDangDinhVi(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(p);
        map.setOptions({ zoom: 15 });
        if (chamRef.current) chamRef.current.setPosition(p);
        else
          chamRef.current = new g.maps.Marker({
            position: p,
            map,
            clickable: false,
            zIndex: 1,
            title: "Vị trí của bạn",
            // 0 = SymbolPath.CIRCLE — chấm tròn xanh viền trắng, neo đúng giữa
            icon: { path: 0, scale: 7, fillColor: "#0071e3", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 },
          });
      },
      () => setDangDinhVi(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

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

  return (
    <div className="relative">
      <div
        ref={boxRef}
        aria-label="Bản đồ vị trí"
        className={`${size} bg-cvr-surface ${locked ? "pointer-events-none" : ""}`}
      />
      {/* Nút "Vị trí của tôi" — bấm là biết mình đang ở đâu so với bất động sản,
          rồi tự phóng / kéo bản đồ tìm tiếp. Ẩn khi bản đồ đang khoá. */}
      {!locked && (
        <button
          type="button"
          onClick={viTriCuaToi}
          disabled={dangDinhVi}
          aria-label="Vị trí của tôi"
          className="absolute bottom-3 left-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-white/95 px-3 text-[13px] font-semibold text-cvr-body shadow-[0_1px_4px_rgba(0,0,0,0.3)] backdrop-blur transition hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          {dangDinhVi ? "Đang định vị…" : "Vị trí của tôi"}
        </button>
      )}
    </div>
  );
}

// Có key → bản đồ tự vẽ, kéo MỘT ngón. Chưa có key → còn dùng bản nhúng của
// Google, vẫn phải hai ngón; câu hướng dẫn dưới bản đồ đổi theo đúng sự thật.
export const MAP_KEO_MOT_NGON = Boolean(MAP_KEY);
