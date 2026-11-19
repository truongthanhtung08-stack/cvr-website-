// NỐI WEB → MINI APP: khung đăng nhập của form web → màn vào tài khoản bằng Zalo của Mini App (không ghi chữ "đăng nhập" —
// Zalo từ chối bản 52, chính sách 6.5).
import { useEffect } from "react";
import { useNavigate } from "zmp-ui";
export default function LoginForm() {
  const dieuHuong = useNavigate();
  useEffect(() => { dieuHuong("/dang-nhap?tiep=%2Fdang-tin", { replace: true }); }, [dieuHuong]);
  return null;
}
