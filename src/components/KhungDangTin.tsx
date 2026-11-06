"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import PostListingForm from "@/components/PostListingForm";

// ĐANG SỬA TIN → BẤM "ĐĂNG TIN" (sang /dang-tin không có ?id=) = FORM TRẮNG (06/11/2026): Next giữ nguyên form cũ khi chỉ đổi
// tham số trên cùng trang → form mang nguyên nội dung tin đang sửa, bấm Đăng là sinh TIN TRÙNG (đo thật: 3 tin trùng).
// Chỉ làm mới khi rời chế độ sửa (có id → không id). KHÔNG làm mới khi form tự đổi sang ?id=<tin nháp> giữa luồng Nạp thêm
// (PostListingForm router.replace) — làm mới lúc đó là mất bước nạp đang chờ.
export default function KhungDangTin() {
  const id = useSearchParams().get("id");
  const [khoa, setKhoa] = useState(0);
  const truoc = useRef(id);
  useEffect(() => {
    if (truoc.current && !id) setKhoa((k) => k + 1);
    truoc.current = id;
  }, [id]);
  return <PostListingForm key={khoa} />;
}
