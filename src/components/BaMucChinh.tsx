"use client";

import Link from "next/link";

// BA MẢNG CHÍNH Ở TRANG CHỦ ĐIỆN THOẠI — Mua bán · Cho thuê · Dự án (anh 08/11/2026: "logic và kết nối chuẩn cho 3 phần chính của trang
// web; trang chủ cần cấu trúc thêm mục Dự án: 3 cái menu dưới Header và trên mục Bất động sản nổi bật"). Chuẩn Batdongsan (đo trên
// batdongsan.com.vn bản điện thoại 08/11/2026): 3 ô Mua bán · Cho thuê · Dự án là LỐI VÀO THẲNG trang tổng (/nha-dat-ban…), không lọc
// tại chỗ. Đường dẫn thật cho Google; đánh dấu trang đi ra từ trang chủ → nút ‹ dính cạnh ô tìm (FilterBar veChoGo) về lại trang chủ.
// Kiểu nút = đúng nút tròn web đang dùng (khối tin, bộ lọc) — không vẽ kiểu mới. Máy tính đã có ba mục này trên menu đầu trang.
// Giao diện CHUẨN APPLE (anh 12/11/2026): ô nền xám Apple (#f5f5f7), không viền, biểu tượng nét mảnh trên chữ — kiểu hàng ô điều hướng
// của apple.com bản điện thoại. Không biểu tượng (anh 12/11/2026: "bỏ symbol trên trang chủ đi") — chỉ chữ.
const MUC = [
  { href: "/mua-ban", nhan: "Mua bán" },
  { href: "/cho-thue", nhan: "Cho thuê" },
  { href: "/du-an", nhan: "Dự án" },
] as const;

export default function BaMucChinh() {
  return (
    <nav
      aria-label="Ba mảng chính"
      className="grid grid-cols-3 gap-2 bg-white px-4 pb-1 pt-3 sm:hidden"
      // :active trên điện thoại chỉ hiện khi giữ ngón lâu (iPhone bỏ qua) → chạm là gắn "vua-bam" như thanh dưới (MobileTabBar), 10/11/2026
      onPointerDown={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        if (!a) return;
        a.classList.remove("vua-bam");
        void a.offsetWidth;
        a.classList.add("vua-bam");
        window.setTimeout(() => a.classList.remove("vua-bam"), 280);
      }}
    >
      {MUC.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          prefetch={false}
          onClick={() => { try { sessionStorage.setItem("cvr-kq-den", m.href); } catch { /* vẫn sang trang, chỉ không có nút ‹ */ } }}
          // press = hiệu ứng chạm chung của web (globals.css: nhấn mờ + thu nhẹ, nhả bật lại) — trước 10/11 ba nút này bấm không thấy gì
          className="press flex items-center justify-center rounded-2xl bg-cvr-surface py-3 text-[14px] font-semibold text-cvr-ink"
        >
          {m.nhan}
        </Link>
      ))}
    </nav>
  );
}
