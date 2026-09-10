"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { banChuyenDoiMotLan } from "@/lib/gtagChuyenDoi";

// ============================================================================
// ĐẾM "ĐĂNG KÝ THÀNH CÔNG" CHO GOOGLE ADS — đặt ở /tai-khoan.
// ----------------------------------------------------------------------------
// Vì sao đặt ở ĐÂY chứ không đặt trong form đăng ký: web có 4 đường tạo tài khoản
// (email + mật khẩu · Google · số điện thoại OTP · sau này Facebook/Zalo) và mỗi
// đường kết thúc một kiểu — đăng ký bằng email còn phải mở hộp thư bấm xác nhận
// rồi mới quay lại. Bắn ở từng form thì vừa sót đường, vừa dễ đếm trùng.
// Mọi đường đều đổ về /tai-khoan, nên đếm một chỗ này là đủ và không trùng.
//
// Thế nào là "vừa đăng ký": tài khoản được tạo cách đây dưới 10 phút. Khách cũ
// đăng nhập lại có created_at từ nhiều ngày trước → không tính (đúng nguyên tắc:
// không trả tiền quảng cáo cho khách cũ).
// Thêm một lớp chặn nữa: đã bắn cho tài khoản nào thì ghi dấu theo ID tài khoản,
// tải lại trang bao nhiêu lần cũng chỉ đếm một.
// ============================================================================
const NGUONG_MOI_MS = 10 * 60 * 1000; // 10 phút

export default function DoDangKyMoi() {
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user?.created_at) return;

        const tuoiTaiKhoan = Date.now() - new Date(user.created_at).getTime();
        if (tuoiTaiKhoan > NGUONG_MOI_MS) return; // khách cũ đăng nhập lại

        banChuyenDoiMotLan(`dangky-${user.id}`, "dang_ky", {
          method: user.app_metadata?.provider ?? "email",
        });
      } catch {
        /* chưa cấu hình Supabase / mất mạng → bỏ qua, không làm hỏng trang */
      }
    })();
  }, []);

  return null;
}
