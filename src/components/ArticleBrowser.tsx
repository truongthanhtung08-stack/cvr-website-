"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import PagedArticleList from "@/components/PagedArticleList";
import { searchAny } from "@/lib/smartSearch";
import type { Article } from "@/lib/data";

// ── DANH SÁCH TIN TỨC 2 CỘT (dùng chung) ─────────────────────────────────────
// Trái: danh sách bài PHÂN TRANG · Phải: "Bài viết được quan tâm" (đánh số).
// Dùng ở trang /tin-tuc và ở khối Tin tức trang chủ khi bấm "Xem thêm" —
// hai chỗ dùng CHUNG component nên không bao giờ lệch cấu trúc.
export default function ArticleBrowser({ articles, boQua = 1 }: { articles: Article[]; boQua?: number }) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  // BỎ Ô TÌM BÀI VIẾT (chủ dự án 02/11/2026: "trang tin tức không cần bộ lọc, xoá đi") — danh sách giữ đúng thứ tự như khi ô trống
  const q = "";
  const hits = searchAny(articles, q, {
    ten: (a) => a.title,                                   // khớp ở tiêu đề ăn điểm cao nhất
    hay: (a) => `${a.title} ${a.excerpt} ${a.category}`,
  });
  const ketQua = hits.map((h) => h.item);

  if (articles.length === 0) return null;
  const rest = ketQua.slice(boQua);
  const danhSach = q.trim() ? ketQua : rest.length ? rest : articles;

  // BỎ CỘT "Bài viết được quan tâm" (anh 08/11/2026: "bỏ phần tin liên quan, đưa danh sách ra là được") — danh sách trải đủ bề ngang
  return <PagedArticleList articles={danhSach} />;
}
