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
}: {
  mapQuery: string;
  address: string;
  places: Place[];
}) {
  const [locating, setLocating] = useState(false);

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
      <div className="overflow-hidden rounded-xl border border-cvr-line">
        <iframe
          title="Bản đồ dự án"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`}
          className="h-[190px] w-full grayscale-[0.25] sm:h-[240px]"
          loading="lazy"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <p className="flex items-center gap-1.5 text-sm text-cvr-muted">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {address}
        </p>
        {/* Mở Google Maps: trên điện thoại có cài app sẽ bật APP, không thì mở WEB.
            Mở ở TAB MỚI nên đóng tab là quay lại đúng trang tin đang xem. */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3.5 py-2 text-sm font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-cvr-blue px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" /></svg>
          {locating ? "Đang định vị…" : "Chỉ đường từ vị trí của bạn"}
        </button>
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
