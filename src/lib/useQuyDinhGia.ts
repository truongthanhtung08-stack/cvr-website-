"use client";

import { useEffect, useState } from "react";
import { docRest } from "@/lib/supabase/nap";
import { ghepQuyDinh, KHOA_QUY_DINH_GIA, type QuyDinhGia } from "@/lib/quyDinhGia";

// Quy định & quyền lợi ĐÃ DUYỆT (site_content "quy_dinh_gia") cho component phía trình duyệt.
// Chưa tải xong / chưa duyệt → rỗng → khối quy định ẩn.
export function useQuyDinhGia(): QuyDinhGia {
  const [qd, setQd] = useState<QuyDinhGia>(() => ghepQuyDinh(null));
  useEffect(() => {
    // Đọc thẳng API bằng khoá công khai (docRest) — nội dung công khai, không cần thư viện Supabase ~58 KB nén (27/10/2026:
    // trang Bảng giá tải cả thư viện chỉ để đọc dòng này).
    docRest<{ data: Partial<QuyDinhGia> }[]>(`site_content?select=data&key=eq.${encodeURIComponent(KHOA_QUY_DINH_GIA)}&limit=1`)
      .then((rows) => setQd(ghepQuyDinh(rows?.[0]?.data)), () => {});
  }, []);
  return qd;
}
