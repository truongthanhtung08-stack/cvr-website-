"use client";

import { useState } from "react";
// BẢN ĐỒ VỊ TRÍ — dùng bản Leaflet/OpenStreetMap: kéo MỘT ngón, có nút định vị.
// Bản chạy nền Google (components/MapPane.tsx) GIỮ LẠI để sau này Google thông
// thì đổi về, chỉ phải sửa đúng dòng import này.
import MapPane from "@/components/MapPaneGoogle";
import { chiDuong, xemTrenBanDo } from "@/lib/moGoogleMaps";

type Place = { category: string; name: string; distance: string };

// Biểu tượng theo nhóm tiện ích (đối chiếu Batdongsan) — dễ phân biệt bằng mắt.
const ICON: Record<string, string> = {
  "Sân bay": "✈️",
  "Trường học": "🏫",
  "Siêu thị": "🛒",
  "Công viên": "🌳",
  "Bệnh viện": "🏥",
  "Nhà hàng": "🍽️",
  "Trung tâm thương mại": "🏬",
  "Bến xe / Ga": "🚌",
  "Bãi biển": "🏖️",
  "Khác": "📍",
};

// Vị trí dự án: bản đồ Google + danh sách tiện ích xung quanh (có khoảng cách),
// và nút "Vị trí của bạn" → chỉ đường từ vị trí hiện tại của người xem tới dự án.
export default function ProjectNearby({
  mapQuery,
  address,
  places,
  zoom = 15,
}: {
  mapQuery: string;
  address: string;
  places: Place[];
  // Mức phóng bản đồ: 17 khi tin có toạ độ ghim / tên đường (thấy rõ đúng vị trí),
  // 15 khi chỉ biết phường/xã. Trang dự án không truyền → giữ 15 như cũ.
  zoom?: number;
}) {
  const [locating, setLocating] = useState(false);

  // CHỈ ĐƯỜNG TỪ VỊ TRÍ KHÁCH — mở thẳng APP bản đồ trên máy (Google Maps, iPhone
  // chưa cài thì Bản đồ Apple), không mở tab trình duyệt.
  // Định vị lấy NHANH: không bắt GPS chính xác cao (chờ bắt vệ tinh mất 5–15 giây),
  // dùng wifi/trạm phát sóng + vị trí cũ trong 5 phút là đủ cho điểm xuất phát.
  // Không lấy được vị trí thì vẫn mở app — app tự hỏi và tự lấy vị trí máy.
  function directionsFromMe() {
    if (!navigator.geolocation) {
      chiDuong(mapQuery);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        chiDuong(mapQuery, `${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {
        setLocating(false);
        chiDuong(mapQuery);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
    );
  }

  return (
    <div className="space-y-4">
      {/* Bản đồ NHÚNG: chạm vào là phóng to / thu nhỏ / kéo xem NGAY TẠI TRANG,
          không nhảy đi đâu. Chỉ khi bấm nút "Mở Google Maps" mới mở app/web
          Google Maps ở TAB MỚI — xong bấm quay lại là về đúng tin đang xem. */}
      <div className="relative overflow-hidden rounded-xl border border-cvr-line">
        {/* KHÔNG có lớp "Chạm để xem bản đồ" (chủ dự án 22/10/2026 tối: "vì sao phải có câu đó, lại bắt khách chạm"): bản đồ
            dùng được ngay — điện thoại kéo một ngón, phóng hai ngón; máy tính kéo chuột, nút +/−. */}
        <MapPane query={mapQuery} zoom={zoom} locked={false} />


        {/* Trên mặt bản đồ CHỈ có nút ⛶ xem toàn màn hình (chủ dự án 23/10/2026) — nằm trong MapPaneMo. Không thêm nút
            nổi nào khác (trước đây có chip "Khoá bản đồ" — đã bỏ, mặt bản đồ để trống cho dễ nhìn). */}
      </div>
      {/* HAI NÚT SÁT NGAY DƯỚI KHUNG BẢN ĐỒ, cỡ nhỏ — chủ dự án chốt bố cục này.
          Cả hai nút đều mở THẲNG APP BẢN ĐỒ trên máy khách: Google Maps nếu có cài
          (hầu như máy nào cũng có), iPhone chưa cài thì rơi về Bản đồ Apple.
          Xem chi tiết cách chuyển app ở src/lib/moGoogleMaps.ts. */}
      <div className="-mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => xemTrenBanDo(mapQuery)}
          className="inline-flex min-h-8 flex-1 items-center py-1 leading-tight text-center justify-center gap-1.5 rounded-lg border border-cvr-line bg-white px-2.5 text-[12px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink sm:flex-none"
        >
          {/* Cùng tên, cùng biểu tượng với nút trên bản đồ đăng tin (23/10/2026) */}
          <svg className="h-3.5 w-3.5 text-[#ea4335]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
          </svg>
          Google Maps
        </button>
        <button
          type="button"
          onClick={directionsFromMe}
          disabled={locating}
          className="inline-flex min-h-8 flex-1 items-center py-1 leading-tight text-center justify-center gap-1.5 rounded-lg bg-cvr-blue px-2.5 text-[12px] font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-60 sm:flex-none"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" /></svg>
          {locating ? "Đang định vị…" : "Chỉ đường"}
        </button>
      </div>

      {/* address rỗng = trang đã ghi địa chỉ ngay cạnh bản đồ (dự án tra cứu, 30/10/2026) → không lặp */}
      {address && (
      <p className="flex items-start gap-1.5 text-[14px] leading-relaxed text-cvr-muted">
        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span className="min-w-0">{address}</span>
      </p>
      )}

      {places.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {places.map((p, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-cvr-line bg-cvr-surface px-3.5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">{ICON[p.category] ?? "📍"}</span>
              {/* Tên chiếm TRỌN bề ngang; loại · thời gian xuống dòng dưới (chủ dự án 22/10/2026: ô thời gian dài "Trong vòng
                  10 phút" nằm bên phải ép tên thành cột chữ hẹp, gãy từng chữ). Loại "Khác" không nói gì thêm → không ghi. */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-cvr-ink">{p.name}</p>
                {(() => {
                  const loai = p.category && p.category !== "Khác" ? p.category : "";
                  if (!loai && !p.distance) return null;
                  return (
                    <p className="mt-0.5 text-xs text-cvr-muted">
                      {loai}
                      {loai && p.distance ? " · " : ""}
                      {p.distance && <span className="font-semibold text-cvr-body">{p.distance}</span>}
                    </p>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
