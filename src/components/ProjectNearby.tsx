"use client";

import { useState } from "react";

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
  // KHOÁ CỬ CHỈ BẢN ĐỒ (mặc định) — khách lướt trang bằng MỘT ngón, ngón tay đi
  // ngang qua bản đồ không bị bản đồ "nuốt" mất. Chạm một cái vào bản đồ là mở
  // khoá, từ đó kéo / phóng to bằng MỘT ngón thoải mái; bấm "Khoá bản đồ" để
  // cuộn trang tiếp. Đây là cách Batdongsan / Zillow đang làm.
  const [mapOn, setMapOn] = useState(false);

  function directionsFromMe() {
    const dest = encodeURIComponent(mapQuery);
    if (!navigator.geolocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank", "noopener");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`, "_blank", "noopener");
      },
      () => {
        setLocating(false);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank", "noopener");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-4">
      {/* Bản đồ NHÚNG: chạm vào là phóng to / thu nhỏ / kéo xem NGAY TẠI TRANG,
          không nhảy đi đâu. Chỉ khi bấm nút "Mở Google Maps" mới mở app/web
          Google Maps ở TAB MỚI — xong bấm quay lại là về đúng tin đang xem. */}
      <div className="relative overflow-hidden rounded-xl border border-cvr-line">
        <iframe
          title="Bản đồ vị trí"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${zoom}&output=embed`}
          className={`h-[260px] w-full sm:h-[320px] ${mapOn ? "" : "pointer-events-none"}`}
          loading="lazy"
        />

        {/* Lớp phủ khi bản đồ đang KHOÁ — chạm là mở, không cần hai ngón */}
        {!mapOn && (
          <button
            type="button"
            onClick={() => setMapOn(true)}
            aria-label="Chạm để xem và kéo bản đồ"
            className="absolute inset-0 flex items-end justify-center bg-transparent pb-4 transition active:bg-black/5"
          >
            <span className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-[13px] font-semibold text-cvr-ink shadow-[0_2px_12px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-md">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5l6 2.4 5-2.4v14.4l-5 2.4-6-2.4-5 2.4V4.9l5-2.4v16.8" />
              </svg>
              Chạm để xem bản đồ
            </span>
          </button>
        )}

        {/* Đang mở khoá — nút trả bản đồ về trạng thái khoá để cuộn trang tiếp */}
        {mapOn && (
          <button
            type="button"
            onClick={() => setMapOn(false)}
            className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[12px] font-semibold text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-md"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Khoá bản đồ
          </button>
        )}
      </div>
      <p className="-mt-1 text-xs text-cvr-muted">
        {mapOn
          ? "Bản đồ đang mở — kéo bằng một ngón để xem xung quanh. Bấm “Khoá bản đồ” để cuộn trang tiếp."
          : "Chạm một cái vào bản đồ rồi kéo bằng một ngón để xem xung quanh — không cần hai ngón."}
      </p>

      <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <p className="flex items-start gap-1.5 text-sm leading-snug text-cvr-muted">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="min-w-0">{address}</span>
        </p>
        {/* Mở Google Maps: trên điện thoại có cài app sẽ bật APP, không thì mở WEB.
            Mở ở TAB MỚI nên đóng tab là quay lại đúng trang tin đang xem. */}
        <div className="grid grid-cols-2 gap-2.5 sm:contents">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 py-2 text-sm font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
          </svg>
          Mở Google Maps
        </a>
        <button
          type="button"
          onClick={directionsFromMe}
          disabled={locating}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-cvr-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" /></svg>
          {locating ? "Đang định vị…" : (<><span className="sm:hidden">Chỉ đường</span><span className="hidden sm:inline">Chỉ đường từ vị trí của bạn</span></>)}
        </button>
        </div>
      </div>

      {places.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {places.map((p, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-cvr-line bg-cvr-surface px-3.5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">{ICON[p.category] ?? "📍"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-cvr-ink">{p.name}</p>
                <p className="text-xs text-cvr-muted">{p.category}</p>
              </div>
              {p.distance && <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-cvr-body shadow-sm">{p.distance}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
