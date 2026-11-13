import { authorize, getAccessToken } from "zmp-sdk";
import { supabase } from "./supabase";

// VÀO TÀI KHOẢN BẰNG ZALO — CÁCH CỦA NỀN TẢNG ZALO (anh 14/11/2026: "trên Zalo không ai bắt khách bấm Liên kết tài khoản"):
// mở Mini App là khách đã ở trong tài khoản Coastal Land theo Zalo của mình — CHỈ khi mã Zalo đó đã gắn một tài khoản (khách đăng
// nhập bằng Zalo, hoặc tài khoản chính của khách là Zalo: profiles.zalo_id). Khách dùng số / email / Google: không tự vào.
// Cơ sở (tài liệu Zalo, getAccessToken): "Từ SDK 2.35.0, ứng dụng mặc định có quyền truy xuất access token mà không cần người
// dùng xác nhận đồng ý" — token chỉ cho ra ID người dùng. Máy chủ web (/api/auth/zalo-mini-app) đã vào được chỉ bằng mã Zalo
// (hoiZaloMe "id") → cùng tài khoản với nút Zalo trên web. Tên + ảnh Zalo chỉ có khi khách bấm Cho phép trong hộp của Zalo
// (scope.userInfo) — hộp này KHÔNG hiện lúc mở app (Chính sách kiểm duyệt 6.1, bản 51 bị trả về vì hỏi ngay khi mở).
async function vaoBangToken(chiCoSan = false): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;
  const r = await fetch("https://coastalland.vn/api/auth/zalo-mini-app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, chiCoSan }),
  });
  const j = await r.json();
  if (!j.ok) return false;
  const { error } = await supabase.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
  if (!error) try { localStorage.removeItem(DA_DANG_XUAT); } catch { /* không lưu được thì thôi */ }
  return !error;
}

// Khách bấm nút (Hồ sơ sau khi Đăng xuất, hoặc lấy tên + ảnh Zalo): Zalo hỏi cho dùng tên + ảnh → vào lại / cập nhật tên, ảnh.
export async function lienKetZalo(): Promise<boolean> {
  try {
    await authorize({ scopes: ["scope.userInfo"] });
    return await vaoBangToken();
  } catch {
    return false;
  }
}

// MỞ APP LÀ VÀO — CHỈ KHÁCH ĐĂNG NHẬP BẰNG ZALO (anh 14/11/2026): mã Zalo đã có tài khoản thì vào ngầm (không hiện hộp hỏi quyền);
// chưa có thì không tạo — khách dùng số / email / Google tự chọn ở Hồ sơ (Liên kết tài khoản / Liên kết bằng số điện thoại).
export const DA_DANG_XUAT = "cl-da-dang-xuat";
export async function tuVaoBangZalo(): Promise<void> {
  try {
    if (localStorage.getItem(DA_DANG_XUAT)) return;
    if ((await supabase.auth.getSession()).data.session) return;
    await vaoBangToken(true);
  } catch {
    /* ngoài Zalo (khung thử trên máy) không có getAccessToken — bỏ qua, khách vẫn xem tin được */
  }
}
