"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { filtersToParams, locationLabel, priceRangeText, type Filters } from "@/lib/filters";

// NÚT "NHẬN TIN MỚI" (Smart Search mục 7 — Tìm kiếm đã lưu, 02/10/2026).
// Lưu đúng bộ lọc đang xem; 8h sáng mỗi ngày có tin MỚI khớp thì báo khách
// (/api/thong-bao/dinh-ky). Chưa đăng nhập → đưa đi đăng nhập rồi quay lại đúng trang.
export default function LuuTimKiem({ purpose, filters }: { purpose: "ban" | "thue"; filters: Filters }) {
  const [trangThai, setTrangThai] = useState<"" | "dang" | "xong" | "loi">("");
  const [loi, setLoi] = useState("");

  async function luu() {
    setTrangThai("dang");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/dang-nhap?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    const thamSo = filtersToParams(filters).toString();
    const ten = [
      filters.keyword.trim(),
      ...filters.locations.map(locationLabel),
      filters.project,
      ...filters.types,
      priceRangeText(filters.priceMin, filters.priceMax),
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 120) || (purpose === "ban" ? "Nhà đất bán" : "Nhà đất cho thuê");
    const { error } = await supabase.from("tim_kiem_luu").insert({ user_id: user.id, muc_dich: purpose, tham_so: thamSo, ten });
    if (error) {
      setLoi(/tối đa 10/i.test(error.message) ? "Đã đủ 10 tìm kiếm" : "Chưa lưu được");
      setTrangThai("loi");
      return;
    }
    setTrangThai("xong");
  }

  return (
    // Điện thoại: chỉ biểu tượng chuông (hàng nút Bản đồ · Xoá lọc đã duyệt, không được xuống dòng);
    // từ sm trở lên hiện cả chữ. Đã lưu / lỗi thì hiện chữ ở mọi màn hình để khách biết kết quả.
    <button
      type="button"
      onClick={luu}
      disabled={trangThai === "dang" || trangThai === "xong"}
      aria-label="Nhận tin mới khớp bộ lọc này"
      title="Nhận tin mới khớp bộ lọc này"
      className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line px-2.5 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-70 sm:px-3"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
      </svg>
      {trangThai === "xong" ? "Đã lưu" : trangThai === "loi" ? loi : <span className="hidden sm:inline">Nhận tin mới</span>}
    </button>
  );
}
