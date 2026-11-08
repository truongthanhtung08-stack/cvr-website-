"use client";

import Link from "next/link";

// BA MẢNG CHÍNH Ở TRANG CHỦ ĐIỆN THOẠI — Mua bán · Cho thuê · Dự án (anh 08/11/2026: "logic và kết nối chuẩn cho 3 phần chính của trang
// web; trang chủ cần cấu trúc thêm mục Dự án: 3 cái menu dưới Header và trên mục Bất động sản nổi bật"). Chuẩn Batdongsan (đo trên
// batdongsan.com.vn bản điện thoại 08/11/2026): 3 ô Mua bán · Cho thuê · Dự án là LỐI VÀO THẲNG trang tổng (/nha-dat-ban…), không lọc
// tại chỗ. Đường dẫn thật cho Google; đánh dấu trang đi ra từ trang chủ → nút ‹ dính cạnh ô tìm (FilterBar veChoGo) về lại trang chủ.
// Kiểu nút = đúng nút tròn web đang dùng (khối tin, bộ lọc) — không vẽ kiểu mới. Máy tính đã có ba mục này trên menu đầu trang.
const MUC = [
  { href: "/mua-ban", nhan: "Mua bán" },
  { href: "/cho-thue", nhan: "Cho thuê" },
  { href: "/du-an", nhan: "Dự án" },
] as const;

export default function BaMucChinh() {
  return (
    <nav aria-label="Ba mảng chính" className="flex gap-2 bg-white px-4 pb-1 pt-3 sm:hidden">
      {MUC.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          prefetch={false}
          onClick={() => { try { sessionStorage.setItem("cvr-kq-den", m.href); } catch { /* vẫn sang trang, chỉ không có nút ‹ */ } }}
          className="flex-1 whitespace-nowrap rounded-full border border-black/15 py-1.5 text-center text-sm font-medium text-cvr-body"
        >
          {m.nhan}
        </Link>
      ))}
    </nav>
  );
}
