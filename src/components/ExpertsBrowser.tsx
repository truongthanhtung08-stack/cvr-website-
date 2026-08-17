"use client";

import { useState } from "react";
import ExpertCard from "@/components/ExpertCard";
import { experts, type City } from "@/lib/experts";

const TABS: ("Tất cả" | City)[] = ["Tất cả", "Đà Nẵng", "Huế"];

// Danh bạ chuyên gia có tab lọc theo thành phố. `initialCity` để các trang con
// (/chuyen-gia/da-nang, /chuyen-gia/hue) mở sẵn đúng tab.
export default function ExpertsBrowser({ initialCity }: { initialCity?: City }) {
  const [tab, setTab] = useState<"Tất cả" | City>(initialCity ?? "Tất cả");
  const list = tab === "Tất cả" ? experts : experts.filter((e) => e.city === tab);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
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
          <a
            href="/chuyen-gia/dang-ky"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-cvr-ink px-5 text-sm font-semibold text-white transition hover:bg-cvr-body"
          >
            Đăng ký làm chuyên gia
          </a>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-cvr-body">
            <span className="font-bold text-cvr-ink">{list.length}</span> chuyên gia
            {tab !== "Tất cả" ? ` tại ${tab}` : ""}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => <ExpertCard key={e.slug} e={e} />)}
          </div>
        </>
      )}
    </>
  );
}
