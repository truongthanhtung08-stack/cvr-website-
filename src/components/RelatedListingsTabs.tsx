"use client";

import { useState } from "react";
import type { Listing } from "@/lib/data";
import ListingShowcase from "@/components/ListingShowcase";
import { useHomeSection } from "@/components/HomeExpand";

const SECTION_KEY = "tin-du-an";

// Tin BÁN / CHO THUÊ của dự án — tab chuyển giữa 2 nhóm.
// Dùng THẺ TIN THẬT dạng hàng ngang (ảnh trái – nội dung phải), đầy đủ cấu trúc
// theo cấp VIP: huy hiệu cấp · tiêu đề đổi màu/VIẾT HOA · mô tả ·
// giá – diện tích – đơn giá · địa chỉ · người đăng.
// (Trước đây dùng ListingList: ảnh chỉ 160px và mất hết phân cấp VIP.)
// the: đặt GIỮA trang dự án (sau Tổng quan — 22/10/2026) → khung xám, tiêu đề cùng cỡ các mục khác của trang.
// tenDuAn: tiêu đề danh sách khi bấm "Xem thêm" mang TÊN dự án (chủ dự án 22/10/2026 — không để "Tin … tại dự án" trơn).
export default function RelatedListingsTabs({ ban, thue, title, the = false, tenDuAn }: { ban: Listing[]; thue: Listing[]; title?: string; the?: boolean; tenDuAn?: string }) {
  const hasBan = ban.length > 0;
  const hasThue = thue.length > 0;
  const [tab, setTab] = useState<"ban" | "thue">(hasBan ? "ban" : "thue");
  // Bấm "Xem thêm" → danh sách xổ ra có tiêu đề riêng: ẩn tiêu đề + tab ở đây
  // để không lặp chữ và không chừa khoảng trống trên đầu.
  const { expanded, hidden } = useHomeSection(SECTION_KEY);

  const items = tab === "ban" ? ban : thue;

  // Khối khác (Dự án liên quan) đang mở danh sách → khối này ẩn
  if (hidden) return null;

  return (
    <div className={expanded ? undefined : the ? "mt-5 rounded-2xl bg-cvr-surface p-4 sm:p-5" : "mt-10"}>
      {!expanded && title && (
        <h2 className={the ? "mb-4 text-[19px] font-semibold tracking-tight text-cvr-ink sm:text-[22px]" : "mb-5 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl"}>{title}</h2>
      )}
      {/* Đang mở danh sách → ẩn hẳn hàng tab (trước để chung "inline-flex hidden" nên inline-flex thắng, tab vẫn lơ lửng
          trên đầu danh sách — sửa 22/10/2026) */}
      <div className={expanded ? "hidden" : "mb-4 inline-flex rounded-lg border border-cvr-line bg-white p-1"}>
        {hasBan && (
          <button
            type="button"
            onClick={() => setTab("ban")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === "ban" ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"}`}
          >
            Bán ({ban.length})
          </button>
        )}
        {hasThue && (
          <button
            type="button"
            onClick={() => setTab("thue")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === "thue" ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"}`}
          >
            Cho thuê ({thue.length})
          </button>
        )}
      </div>
      {items.length > 0 ? (
        /* Slide mặc định · "Xem thêm" → đổ ra list phân trang */
        <ListingShowcase
          items={items}
          sectionKey={SECTION_KEY}
          purpose={tab}
          relevance
          heading={tenDuAn ? `${tab === "thue" ? "Cho thuê" : "Mua bán"} tại ${tenDuAn}` : tab === "thue" ? "Tin cho thuê tại dự án" : "Tin mua bán tại dự án"}
        />
      ) : (
        <p className="rounded-xl border border-cvr-line bg-cvr-surface px-4 py-6 text-center text-sm text-cvr-muted">
          Dự án chưa có tin {tab === "ban" ? "bán" : "cho thuê"}.
        </p>
      )}
    </div>
  );
}
