"use client";

import { useState } from "react";
import FilterBar from "@/components/FilterBar";
import { emptyFilters, filtersToParams, typeGroupsFor, type Filters } from "@/lib/filters";
import { saleCategories, rentCategories, nhomPseo } from "@/lib/categories";
import type { HintMode, TinGoiY } from "@/lib/searchHints";
import { duongDanSach, duongDanTuCau } from "@/lib/duongDanTim";
import Link from "next/link";

// NHÓM LOẠI HÌNH (chuẩn thống nhất 17/10/2026): đọc THẲNG từ nguồn chung typeGroupsFor — tên nhóm, link
// trang nhóm tự theo. Mỗi ô là link thật tới trang nhóm, Google lần theo được. Đổi theo tab Mua bán / Cho thuê.
const ICON: Record<string, string> = {
  "can-ho-chung-cu": "M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 9h4a1 1 0 011 1v11M8 8h3M8 12h3M8 16h3M3 21h18",
  nha: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5",
  dat: "M3 18l4-4 3 2 5-5 6 6M3 18h18v2H3zM15 7a2 2 0 100-4 2 2 0 000 4",
  "nghi-duong": "M12 21v-7M12 14c-4 0-6-3-6-6 3 0 6 2 6 6zM12 14c4 0 6-3 6-6-3 0-6 2-6 6zM4 21h16",
  "kho-nha-xuong": "M3 21V10l5-3v3l5-3v3l5-3v14M3 21h18M7 21v-4h3v4M14 15h3",
  "phong-tro": "M4 20V10a2 2 0 012-2h12a2 2 0 012 2v10M4 15h16M8 12h2M3 20h18",
  "van-phong-mat-bang": "M4 21V3h11v18M15 8h5v13M7 7h2M11 7h2M7 11h2M11 11h2M7 15h2M11 15h2M3 21h18",
};
function nhomTrangChu(muc: "ban" | "thue") {
  const trang = [...(muc === "thue" ? rentCategories : saleCategories), ...nhomPseo(muc)];
  return typeGroupsFor(muc)
    .filter((g) => g.label !== "Khác") // "Khác" chỉ chọn trong Lọc thêm (chuẩn thống nhất)
    .map((g) => ({ nhan: g.label, trang: trang.find((c) => c.types.length === g.items.length && g.items.every((t) => c.types.includes(t))) }))
    .filter((x): x is { nhan: string; trang: (typeof trang)[number] } => !!x.trang);
}

const tabs = ["Mua bán", "Cho thuê", "Dự án"];

// Khối tìm kiếm trang chủ (tab + bộ lọc) — nằm trên banner Hero.
// CHỨC NĂNG bộ lọc GIỮ NGUYÊN 100% (FilterBar dùng chung với các trang danh sách):
// tìm từ khoá, khu vực đa chọn, dự án, loại hình, khoảng giá, diện tích…
// Chỉ phần NHÌN của hàng tab trên máy tính được làm lại theo UI mẫu:
// viên thuốc nền tối mờ, mục đang chọn nền trắng chữ đen.
// dauTrang (17/10/2026, bỏ Hero): bộ lọc là KHỐI ĐẦU trang chủ trên nền trắng, hiện ĐỦ các ô lọc như
// trang danh sách (khu vực, dự án, loại hình, giá, diện tích, lọc thêm) + nút Tìm kiếm.
export default function HomeSearch({ defaultTab, items, dauTrang = false }: { defaultTab?: string; items?: TinGoiY[]; dauTrang?: boolean }) {
  const [tab, setTab] = useState(defaultTab && tabs.includes(defaultTab) ? defaultTab : tabs[0]);
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  // Trang ĐÍCH theo đúng tab đang chọn — bấm mục nào thì tìm trong mục đó:
  //   Dự án   → /du-an     (tìm trong danh sách DỰ ÁN)
  //   Mua bán → /mua-ban   · Cho thuê → /cho-thue  (tìm trong TIN đúng mục đích)
  // Trước đây mọi tab đều đổ về /tim-kiem nên bấm "Dự án" lại ra tin bán/thuê.
  // #ket-qua: khi bấm search, trình duyệt tự cuộn tới khối KẾT QUẢ (bỏ qua banner Hero
  // rất to ở trang Dự án) — khỏi phải cuộn tay. Trang không có mốc này thì bỏ qua.
  function trangDich(params: URLSearchParams): string {
    if (tab === "Dự án") return `/du-an?${params.toString()}#ket-qua`;
    if (tab === "Cho thuê") return `/cho-thue?${params.toString()}#ket-qua`;
    return `/mua-ban?${params.toString()}#ket-qua`;
  }

  // Kiểu Google: ra kết quả ngay. `searchFilters` = bộ lọc truyền kèm khi bấm gợi ý/lịch sử
  // (đảm bảo đúng lựa chọn vừa chọn); không truyền → dùng bộ lọc hiện tại (nút search / Enter).
  function handleSearch(searchFilters?: Filters) {
    // Khớp đúng một trang sạch đang lên Google (loại hình · tỉnh · mức giá) → về trang đó
    if (tab !== "Dự án") {
      const f = searchFilters ?? filters;
      const muc = tab === "Cho thuê" ? "thue" : "ban";
      // Ô TÌM THÔNG MINH: chỉ có câu gõ → máy tách câu ra loại hình · thành phố/tỉnh · giá
      const chiCau = f.keyword.trim() && !f.types.length && !f.locations.length && f.priceMax == null && f.priceMin == null;
      const sach = chiCau ? duongDanTuCau(muc, f.keyword) : duongDanSach(muc, f);
      if (sach) { window.location.href = sach; return; }
    }
    const params = filtersToParams(searchFilters ?? filters);
    params.set("mode", tab);
    window.location.href = trangDich(params);
  }

  // Mở trang kết quả ở chế độ bản đồ (bản đồ sẽ hiển thị khi xây xong).
  function handleMap() {
    const params = filtersToParams(filters);
    params.set("mode", tab);
    params.set("view", "map");
    window.location.href = trangDich(params);
  }

  // Tab "Cho thuê" → danh mục loại hình cho thuê; còn lại (Mua bán/Dự án) → mua bán
  const purpose: "ban" | "thue" = tab === "Cho thuê" ? "thue" : "ban";
  // Câu gợi ý chạy trong ô tìm phải SÁT tab đang chọn. Tab Dự án có bộ riêng —
  // không suy ra được từ purpose (Dự án cũng mang purpose "ban").
  const hintMode: HintMode = tab === "Dự án" ? "duan" : tab === "Cho thuê" ? "thue" : "ban";

  const tabBar = (
    <>
      {/* ĐIỆN THOẠI: giữ nguyên kiểu gạch chân đã duyệt */}
      <div className="flex items-center gap-7 sm:hidden">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            // MOBILE: thanh tìm nằm trên nền TRẮNG (phía trên Hero) nên chữ phải
            // ĐEN — trước đây để chữ trắng theo kiểu đè lên ảnh, đưa xuống nền
            // trắng là mất chữ.
            className={`relative pb-1.5 text-[15px] font-semibold transition-colors ${
              tab === t ? "text-cvr-ink" : "text-cvr-muted"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-cvr-blue" />}
          </button>
        ))}
      </div>

      {/* MÁY TÍNH: menu nằm TRONG lớp kính — chữ trắng, mục đang chọn viên trắng */}
      <div className="hidden items-center gap-1 sm:inline-flex">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-[13.5px] font-semibold tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              tab === t
                ? "bg-white text-cvr-ink shadow-[0_1px_6px_rgba(0,0,0,0.2)]"
                : "text-white/85 hover:bg-white/15 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );

  const tabTrang = (
    <div className="flex items-center gap-7">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`relative pb-1.5 text-[15px] font-semibold transition-colors duration-300 ${tab === t ? "text-cvr-ink" : "text-cvr-muted hover:text-cvr-ink"}`}
        >
          {t}
          {tab === t && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-cvr-blue" />}
        </button>
      ))}
    </div>
  );

  if (dauTrang) {
    return (
      <div className="mx-auto w-full max-w-5xl" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <div className="mb-3">{tabTrang}</div>
        {/* MỘT Ô TÌM THÔNG MINH (gợi ý khu vực · loại hình · dự án khi gõ) — không dàn hàng ô lọc;
            lọc chi tiết nằm ở trang kết quả (chủ dự án 17/10/2026) */}
        <FilterBar value={filters} onChange={setFilters} onSearch={handleSearch} onMap={handleMap} compact purpose={purpose} hintMode={hintMode} hintItems={items} overlayLeading={tabTrang} nenSang />
        {tab !== "Dự án" && (
          <nav aria-label="Loại hình bất động sản" className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {nhomTrangChu(purpose).map((n) => (
              <Link key={n.trang.slug} href={`${purpose === "thue" ? "/cho-thue" : "/mua-ban"}/${n.trang.slug}`} className="group flex w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition hover:bg-white">
                <svg className="h-7 w-7 text-cvr-muted transition group-hover:text-cvr-ink" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d={ICON[n.trang.slug] ?? ICON.nha} /></svg>
                <span className="text-[12px] font-medium leading-tight text-cvr-body group-hover:text-cvr-ink">{n.nhan}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-2xl"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {/* MỘT KHỐI TRẮNG DUY NHẤT (chỉ máy tính): menu và ô tìm nằm chung một nền,
          không lồng khối. Điện thoại giữ nguyên như đã duyệt. */}
      <div className="sm:rounded-[22px] sm:bg-black/15 sm:p-2.5 sm:shadow-2xl sm:shadow-black/25 sm:ring-1 sm:ring-inset sm:ring-white/25 sm:backdrop-blur-xl sm:backdrop-saturate-150">
        <FilterBar value={filters} onChange={setFilters} onSearch={handleSearch} onMap={handleMap} compact leading={tabBar} purpose={purpose} hintMode={hintMode} hintItems={items} />
      </div>
    </div>
  );
}
