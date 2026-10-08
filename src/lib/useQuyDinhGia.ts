"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ghepQuyDinh, KHOA_QUY_DINH_GIA, type QuyDinhGia } from "@/lib/quyDinhGia";

// Quy định & quyền lợi ĐÃ DUYỆT (site_content "quy_dinh_gia") cho component phía trình duyệt.
// Chưa tải xong / chưa duyệt → rỗng → khối quy định ẩn.
export function useQuyDinhGia(): QuyDinhGia {
  const [qd, setQd] = useState<QuyDinhGia>(() => ghepQuyDinh(null));
  useEffect(() => {
    createClient().from("site_content").select("data").eq("key", KHOA_QUY_DINH_GIA).limit(1)
      .then(({ data }) => setQd(ghepQuyDinh(data?.[0]?.data as Partial<QuyDinhGia> | undefined)));
  }, []);
  return qd;
}
