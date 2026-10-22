"use client";

import { useEffect, useState } from "react";
import { PER_PAGE, soTinMoiTrang } from "@/lib/soMoiTrang";

// Số tin mỗi trang cho thành phần trình duyệt (quy định chung ở lib/soMoiTrang): lần vẽ đầu = PER_PAGE (khớp bản máy
// chủ), mở xong đổi theo cỡ màn hình — PC 15 · điện thoại 10.
export function useSoMoiTrang(): number {
  const [n, setN] = useState(PER_PAGE);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc cỡ màn hình một lần lúc mở trang
  useEffect(() => setN(soTinMoiTrang()), []);
  return n;
}
