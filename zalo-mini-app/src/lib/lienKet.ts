import { authorize, getAccessToken, getSetting } from "zmp-sdk";
import { supabase } from "./supabase";

// LIÊN KẾT TÀI KHOẢN BẰNG ZALO — một chỗ cho màn Liên kết và nút ở đầu Hồ sơ (12/11/2026: bấm ở Hồ sơ là Zalo hỏi quyền ngay,
// không qua thêm một màn). Zalo hiện hộp cho phép dùng tên + ảnh (scope.userInfo) → máy chủ web tự hỏi Zalo id + tên + ảnh bằng mã
// truy cập (không nhận tên / ảnh do máy khách gửi) → cùng tài khoản với nút Zalo trên web (/api/auth/zalo-mini-app).
export async function lienKetZalo(): Promise<boolean> {
  try {
    await authorize({ scopes: ["scope.userInfo"] });
    const accessToken = await getAccessToken();
    if (!accessToken) return false;
    const r = await fetch("https://coastalland.vn/api/auth/zalo-mini-app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const j = await r.json();
    if (!j.ok) return false;
    const { error } = await supabase.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
    if (!error) try { localStorage.removeItem(DA_DANG_XUAT); } catch { /* không lưu được thì thôi */ }
    return !error;
  } catch {
    return false;
  }
}

// TỰ VÀO KHI ĐÃ CHO PHÉP TỪ TRƯỚC (anh 14/11/2026: "quét vào sao không đăng nhập vào luôn"): mở app mà chưa có phiên, khách đã từng
// cho phép tên + ảnh (getSetting scope.userInfo = true) và không tự bấm Đăng xuất → liên kết lại NGẦM, không hiện hộp hỏi quyền
// (Zalo chỉ hỏi khi chưa cho phép — chính sách 6.1 / 6.4 vẫn đúng: không xin quyền lúc vừa vào, không bắt liên kết).
export const DA_DANG_XUAT = "cl-da-dang-xuat";
export async function tuVaoNeuDaChoPhep(): Promise<void> {
  try {
    if (localStorage.getItem(DA_DANG_XUAT)) return;
    if ((await supabase.auth.getSession()).data.session) return;
    const { authSetting } = await getSetting();
    if (!(authSetting as Record<string, boolean> | undefined)?.["scope.userInfo"]) return;
    await lienKetZalo();
  } catch {
    /* ngoài Zalo (khung thử) không có getSetting — bỏ qua */
  }
}
