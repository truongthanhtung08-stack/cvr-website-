"use client";

import { useState } from "react";
import { emptyFilters, filtersToParams } from "@/lib/filters";

// ============================================================================
// THANH TÌM KIẾM HERO — CHỈ TRANG CHỦ, CHỈ MÁY TÍNH.
// Bố cục giữ đúng như đã chốt: hàng tab (Mua bán · Cho thuê · Dự án) + MỘT thanh
// tìm theo từ khoá. Chỉ nâng phần nhìn theo UI mẫu trong tài liệu 03.08:
// thanh trắng bo tròn lớn nổi trên ảnh, bóng mềm, nút tìm nền đen bo tròn.
// Điện thoại không dùng component này (giữ nguyên bộ lọc đã duyệt).
// ============================================================================

const MODES = ["Mua bán", "Cho thuê", "Dự án"] as const;
type Mode = (typeof MODES)[number];

export default function HeroSearchBar({ defaultTab }: { defaultTab?: string }) {
  const [mode, setMode] = useState<Mode>(
    (MODES as readonly string[]).includes(defaultTab ?? "") ? (defaultTab as Mode) : "Mua bán",
  );
  const [keyword, setKeyword] = useState("");

  function search() {
    const f = emptyFilters();
    if (keyword.trim()) f.keyword = keyword.trim();
    const params = filtersToParams(f);
    params.set("mode", mode);
    window.location.href = mode === "Dự án" ? `/du-an?${params.toString()}` : `/tim-kiem?${params.toString()}`;
  }

  return (
    <div className="pointer-events-auto hidden w-full sm:block">
      {/* Hàng tab — giữ nguyên như bản đã duyệt */}
      <div className="mb-3 flex items-center gap-7">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`relative pb-2 text-[15px] font-semibold transition-colors [text-shadow:0_1px_10px_rgba(0,0,0,0.6)] ${
              mode === m ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            {m}
            {mode === m && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-cvr-blue-soft shadow-[0_1px_6px_rgba(0,0,0,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* MỘT thanh tìm kiếm từ khoá — trắng, bo tròn, bóng mềm (theo UI mẫu) */}
      <div className="flex items-center gap-2 rounded-full bg-white/97 p-2 pl-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur">
        <svg className="h-5 w-5 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          placeholder="Nhập khu vực, dự án hoặc loại bất động sản…"
          aria-label="Tìm kiếm bất động sản"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-cvr-ink placeholder-cvr-faint outline-none"
        />
        <button
          type="button"
          onClick={search}
          className="h-11 shrink-0 rounded-full bg-cvr-ink px-7 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.98]"
        >
          Tìm kiếm
        </button>
      </div>
    </div>
  );
}
