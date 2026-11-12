import { authorize, getAccessToken } from "zmp-sdk";
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
    return !error;
  } catch {
    return false;
  }
}
