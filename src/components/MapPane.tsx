"use client";

import { useEffect, useRef, useState } from "react";
import { centerOfArea } from "@/lib/geo";
import { MAP_KEY, loadMapsApi, parseLatLng, type GMap, type LatLng } from "@/lib/googleMaps";

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
  // "js" = bản đồ tự vẽ (kéo 1 ngón) · "iframe" = bản nhúng cũ khi chưa có key / lỗi
  const [mode, setMode] = useState<"js" | "iframe">(MAP_KEY ? "js" : "iframe");

  useEffect(() => {
    if (mode !== "js") return;
    let huy = false;
    (async () => {
      try {
        await loadMapsApi();
        const pin = parseLatLng(query);
        // Thứ tự: toạ độ admin ghim tay → Google tra địa chỉ → bảng tâm khu vực
        // của chính mình (src/lib/geo.ts).
        // ⚠️ BƯỚC BA LÀ BẮT BUỘC: dịch vụ tra địa chỉ của Google có lúc bị chặn
        // (chưa bật đủ, hết hạn mức, lỗi mạng). Trước đây hỏng là rơi về bản đồ
        // NHÚNG — mà bản nhúng thì BẮT BUỘC hai ngón. Nay hỏng thì vẫn là bản đồ
        // tự vẽ, ghim giữa khu vực, KÉO MỘT NGÓN như mọi nơi khác.
        const doTay = pin ? { ...pin, coarse: false } : await geocode(query);
        const khuVuc = centerOfArea(query);
        const found =
          doTay ?? (khuVuc ? { lat: khuVuc[0], lng: khuVuc[1], coarse: true } : null);
        if (huy) return;
        // Chỉ lùi về bản nhúng khi không biết nổi khu vực nằm ở đâu.
        if (!found || !boxRef.current || !window.google) {
          if (!found) setMode("iframe");
          return;
        }
        const g = window.google;
        const map = new g.maps.Map(boxRef.current, {
          center: { lat: found.lat, lng: found.lng },
          // Ghim theo địa chỉ rút gọn → lùi mức phóng, tránh chỉ sai vào một căn nhà cụ thể.
          zoom: found.coarse ? Math.min(zoom, 14) : zoom,
          // ĐÂY LÀ CHỖ CHO PHÉP KÉO MỘT NGÓN — mặc định của Google là "auto"
          // (điện thoại phải hai ngón).
          gestureHandling: lockedRef.current ? "none" : "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          keyboardShortcuts: false,
        });
        // Địa chỉ chỉ tra được tới phường/tỉnh thì KHÔNG cắm ghim — cắm là chỉ sai nhà người ta.
        if (!found.coarse) new g.maps.Marker({ position: { lat: found.lat, lng: found.lng }, map });
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

  // Mở/khoá bằng chính cử chỉ của Google, không chỉ dựa vào pointer-events:
  // "none" = bản đồ bỏ qua mọi cử chỉ (ngón tay lướt qua vẫn cuộn trang),
  // "greedy" = MỘT ngón kéo được ngay.
  useEffect(() => {
    lockedRef.current = locked;
    mapRef.current?.setOptions({ gestureHandling: locked ? "none" : "greedy" });
  }, [locked]);

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
    <div
      ref={boxRef}
      aria-label="Bản đồ vị trí"
      className={`${size} bg-cvr-surface ${locked ? "pointer-events-none" : ""}`}
    />
  );
}

// Có key → bản đồ tự vẽ, kéo MỘT ngón. Chưa có key → còn dùng bản nhúng của
// Google, vẫn phải hai ngón; câu hướng dẫn dưới bản đồ đổi theo đúng sự thật.
export const MAP_KEO_MOT_NGON = Boolean(MAP_KEY);
