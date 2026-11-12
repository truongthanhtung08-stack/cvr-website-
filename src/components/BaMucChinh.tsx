"use client";

import Link from "next/link";

// BA MẢNG CHÍNH Ở TRANG CHỦ ĐIỆN THOẠI — Mua bán · Cho thuê · Dự án (anh 08/11/2026: "logic và kết nối chuẩn cho 3 phần chính của trang
// web; trang chủ cần cấu trúc thêm mục Dự án: 3 cái menu dưới Header và trên mục Bất động sản nổi bật"). Chuẩn Batdongsan (đo trên
// batdongsan.com.vn bản điện thoại 08/11/2026): 3 ô Mua bán · Cho thuê · Dự án là LỐI VÀO THẲNG trang tổng (/nha-dat-ban…), không lọc
// tại chỗ. Đường dẫn thật cho Google; đánh dấu trang đi ra từ trang chủ → nút ‹ dính cạnh ô tìm (FilterBar veChoGo) về lại trang chủ.
// Kiểu nút = đúng nút tròn web đang dùng (khối tin, bộ lọc) — không vẽ kiểu mới. Máy tính đã có ba mục này trên menu đầu trang.
// Giao diện CHUẨN APPLE (anh 12/11/2026): ô nền xám Apple (#f5f5f7), không viền, biểu tượng nét mảnh trên chữ — kiểu hàng ô điều hướng
// của apple.com bản điện thoại. Biểu tượng: nhà (Mua bán) · chìa khoá (Cho thuê) · toà nhà (Dự án).
const MUC = [
  { href: "/mua-ban", nhan: "Mua bán", icon: "M3 10.5 12 3l9 7.5M5 9v11h14V9M10 20v-6h4v6" },
  { href: "/cho-thue", nhan: "Cho thuê", icon: "M15.5 8.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM12 12v9m0-4h3m-3 2.5h2" },
  { href: "/du-an", nhan: "Dự án", icon: "M4 21V7l6-3v17M10 21V9l10 3v9M3 21h18M7 9v.01M7 12v.01M7 15v.01M14 14v.01M17 14v.01M14 17v.01M17 17v.01" },
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
          className="press flex flex-col items-center justify-center gap-1 rounded-2xl bg-cvr-surface py-2.5 text-[13px] font-semibold text-cvr-ink"
        >
          <svg className="h-[22px] w-[22px] text-cvr-ink" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d={m.icon} />
          </svg>
          {m.nhan}
        </Link>
      ))}
    </nav>
  );
}
