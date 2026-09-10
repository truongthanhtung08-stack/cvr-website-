"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ChuyenGiaCard from "@/components/ChuyenGiaCard";
import type { ChuyenGia } from "@/lib/chuyenGiaDb";

// Danh bạ chuyên gia — DỰNG TỪ TIN THẬT (xem src/lib/chuyenGiaDb.ts), không còn
// đọc bảng dữ liệu tay. Tab lọc theo tỉnh/thành sinh ra từ chính khu vực có tin,
// nên không bao giờ có tab trống. `initialCity` để các trang con
// (/chuyen-gia/da-nang, /chuyen-gia/hue) mở sẵn đúng tab.
export default function ExpertsBrowser({
  ds = [],
  initialCity,
}: {
  ds?: ChuyenGia[];
  initialCity?: string;
}) {
  const tabs = useMemo(() => {
    const dem = new Map<string, number>();
    for (const cg of ds) for (const kv of cg.khuVuc) dem.set(kv, (dem.get(kv) ?? 0) + 1);
    const top = [...dem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    return ["Tất cả", ...top];
  }, [ds]);

  const [tab, setTab] = useState<string>(initialCity ?? "Tất cả");
  const list = tab === "Tất cả" ? ds : ds.filter((e) => e.khuVuc.includes(tab));

  return (
    <>
      {ds.length > 0 && tabs.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                tab === t
                  ? "scale-105 bg-cvr-ink text-white shadow-lg shadow-black/10"
                  : "border border-black/15 text-cvr-body hover:border-black/40 hover:text-cvr-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Chưa có chuyên gia thật nào → KHÔNG hiện "0 chuyên gia" trống trơn mà
          nói rõ đang cập nhật + mời đăng ký. Xem lý do trong src/lib/experts.ts. */}
      {list.length === 0 ? (
        <div className="mt-6 rounded-none border border-cvr-line bg-cvr-surface px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-cvr-ink">Danh bạ đang được cập nhật</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cvr-muted">
            Coastal Land đang xác minh hồ sơ chuyên gia
            {tab !== "Tất cả" ? ` tại ${tab}` : " tại Đà Nẵng và Huế"}. Chỉ những hồ sơ
            đã kiểm chứng mới được đưa lên danh bạ.
          </p>
          <Link
            href="/chuyen-gia/dang-ky"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-cvr-ink px-5 text-sm font-semibold text-white transition hover:bg-cvr-body"
          >
            Đăng ký làm chuyên gia
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-cvr-body">
            <span className="font-bold text-cvr-ink">{list.length}</span> chuyên gia
            {tab !== "Tất cả" ? ` tại ${tab}` : ""}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((cg) => <ChuyenGiaCard key={cg.slug} cg={cg} />)}
          </div>
        </>
      )}
    </>
  );
}
