import { authorize, getAccessToken } from "zmp-sdk";
import { supabase } from "./supabase";

// VÀO TÀI KHOẢN BẰNG ZALO — CÁCH CỦA NỀN TẢNG ZALO (anh 14/11/2026: "trên Zalo không ai bắt khách bấm Liên kết tài khoản"):
// mở Mini App là khách đã ở trong tài khoản Coastal Land theo Zalo cá nhân của mình (mã Zalo đã gắn tài khoản thì vào đúng tài khoản đó,
// chưa có thì tạo mới), không hiện hộp nào, không có nút liên kết.
// Cơ sở (tài liệu Zalo, getAccessToken): "Từ SDK 2.35.0, ứng dụng mặc định có quyền truy xuất access token mà không cần người
// dùng xác nhận đồng ý" — token chỉ cho ra ID người dùng. Máy chủ web (/api/auth/zalo-mini-app) đã vào được chỉ bằng mã Zalo
// (hoiZaloMe "id") → cùng tài khoản với nút Zalo trên web. Tên + ảnh Zalo chỉ có khi khách bấm Cho phép trong hộp của Zalo
// (scope.userInfo) — hộp này KHÔNG hiện lúc mở app (Chính sách kiểm duyệt 6.1, bản 51 bị trả về vì hỏi ngay khi mở).
async function vaoBangToken(): Promise<boolean> {
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

// MỞ APP LÀ VÀO BẰNG ZALO CÁ NHÂN — KHÔNG CÓ BƯỚC LIÊN KẾT NÀO (anh 14/11/2026: "không có liên kết cái gì cả"): chưa có phiên → vào ngầm
// bằng mã Zalo; khách mới thì web tự tạo tài khoản theo Zalo. Khách bấm Đăng xuất (Hồ sơ) thì không tự vào lại tới khi bấm "Đăng nhập bằng Zalo".
export const DA_DANG_XUAT = "cl-da-dang-xuat"; // dấu đã đăng xuất — xoá khi vào được
export async function vaoNgay(): Promise<boolean> {
  try {
    return await vaoBangToken();
  } catch {
    return false;
  }
}
export async function tuVaoBangZalo(): Promise<void> {
  try {
    if ((await supabase.auth.getSession()).data.session) return;
    if (localStorage.getItem(DA_DANG_XUAT) === "1") return; // khách đã bấm Đăng xuất: không tự vào lại
    await vaoBangToken();
  } catch {
    /* ngoài Zalo (khung thử trên máy) không có getAccessToken — bỏ qua, khách vẫn xem tin được */
  }
}
