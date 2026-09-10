"use client";

import PhanTrang from "@/components/PhanTrang";

// Bộ chuyển trang dùng chung cho các danh sách "Xem thêm" xổ ra tại chỗ
// (tin trang chủ · dự án trang chủ · dự án liên quan).
//
// Ruột đã chuyển sang PhanTrang — bản dùng chung cho CẢ WEB, luôn gọn trong một
// hàng dù nhiều trang (trước đây in đủ số trang nên tràn ngang trên điện thoại,
// khách không bấm được). Giữ nguyên tên và props để mọi nơi đang gọi không phải sửa.
export default function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  // Bấm sang trang khác → hiện NGAY từ mục đầu tiên của trang đó
  // (nhảy thẳng lên đầu danh sách, khách không phải tự cuộn lên).
  const go = (p: number) => { onChange(p); window.scrollTo({ top: 0 }); };

  return <PhanTrang hienTai={page} tong={totalPages} doiTrang={go} className="mt-6" />;
}
