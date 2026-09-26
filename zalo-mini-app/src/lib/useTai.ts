import { useEffect, useState } from "react";

// Tải dữ liệu một lần theo khoá — trả danh sách, trạng thái tải, lỗi.
export function useTai<T>(tai: () => Promise<T>, khoa: unknown[], macDinh: T) {
  const [data, setData] = useState<T>(macDinh);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string>();
  useEffect(() => {
    let huy = false;
    setDangTai(true);
    setLoi(undefined);
    tai()
      .then((d) => !huy && setData(d))
      .catch(() => !huy && setLoi("Chưa tải được tin. Kiểm tra mạng rồi thử lại."))
      .finally(() => !huy && setDangTai(false));
    return () => {
      huy = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, khoa);
  return { data, dangTai, loi };
}
