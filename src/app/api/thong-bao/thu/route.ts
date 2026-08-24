import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guiThongBao, type NoiDungThongBao } from "@/lib/thongBao";
import { vnd } from "@/lib/billing";

// ============================================================================
// GỬI THỬ THÔNG BÁO — để kiểm tra đường email/Zalo có thông không, KHÔNG cần
// nạp tiền thật hay duyệt tin thật.
//
// Dùng ở /admin/thanh-toan → khối "Gửi thử thông báo".
// Chỉ ADMIN gọi được (kiểm tra profiles.role ngay trong route, không tin client).
//
// Trả về kết quả TỪNG KÊNH kèm lý do hỏng — đây mới là thứ cần nhìn:
//   · "chưa cắm RESEND_API_KEY"        → thiếu khoá
//   · Resend 403 ... "domain not verified" → chưa xác minh coastalland.vn,
//     Resend chỉ cho gửi về email chủ tài khoản
//   · "chưa cắm ZALO_OA_ACCESS_TOKEN"  → chưa có Zalo OA
// ============================================================================
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: "Chưa đăng nhập" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,email,phone,full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Chỉ quản trị viên dùng được" }, { status: 403 });
  }

  let body: { email?: string; phone?: string; loai?: "nap_tien" | "duyet_tin" } = {};
  try {
    body = await request.json();
  } catch {
    // Không gửi gì thì gửi về chính admin đang đăng nhập.
  }

  const email = body.email?.trim() || profile.email || null;
  const phone = body.phone?.trim() || profile.phone || null;
  const loai = body.loai === "duyet_tin" ? "duyet_tin" : "nap_tien";

  // Chú kiểu rõ ràng: hai nhánh có bộ trường znsData khác nhau, không chú thì
  // TypeScript gộp union rồi báo lỗi index signature.
  const noiDung: Omit<NoiDungThongBao, "email" | "phone"> =
    loai === "nap_tien"
      ? {
          tieuDe: "[GỬI THỬ] Đã nhận tiền nạp vào ví",
          loiNhan: "Đây là thư gửi thử từ trang quản trị — không phải giao dịch thật.",
          cacDong: [
            { nhan: "Số tiền nạp", giaTri: vnd(5_000_000) },
            { nhan: "Số dư hiện tại", giaTri: vnd(7_200_000) },
            { nhan: "Mã giao dịch", giaTri: "GUI-THU" },
          ],
          znsTemplateId: process.env.ZALO_ZNS_TEMPLATE_NAP_TIEN,
          znsData: { so_tien: vnd(5_000_000), so_du: vnd(7_200_000) },
        }
      : {
          tieuDe: "[GỬI THỬ] Tin của bạn đã được duyệt",
          loiNhan: "Đây là thư gửi thử từ trang quản trị — không phải giao dịch thật.",
          cacDong: [
            { nhan: "Tin đăng", giaTri: "Villa biển 3 tầng mặt tiền Võ Nguyên Giáp" },
            { nhan: "Gói dịch vụ", giaTri: "CVR Diamond · 15 ngày" },
            { nhan: "Tiền dịch vụ", giaTri: vnd(2_100_000) },
            { nhan: "Thuế GTGT 8%", giaTri: vnd(168_000) },
            { nhan: "Đã trừ ví", giaTri: vnd(2_268_000) },
            { nhan: "Số dư còn lại", giaTri: vnd(4_932_000) },
          ],
          znsTemplateId: process.env.ZALO_ZNS_TEMPLATE_DUYET_TIN,
          znsData: { ten_tin: "Villa biển 3 tầng", so_tien: vnd(2_268_000), so_du: vnd(4_932_000) },
        };

  const ketQua = await guiThongBao({ email, phone, ...noiDung });

  return NextResponse.json({
    ok: true,
    guiToi: { email: email ?? "(không có)", phone: phone ?? "(không có)" },
    ketQua,
  });
}

// Xem nhanh kênh nào đã cắm khoá, chưa gửi gì cả.
export async function GET() {
  return NextResponse.json({
    email: {
      daCamKhoa: Boolean(process.env.RESEND_API_KEY),
      from: process.env.RESEND_FROM || "onboarding@resend.dev (chỉ gửi được về email chủ tài khoản Resend)",
      daXacMinhTenMien: Boolean(process.env.RESEND_FROM && !/resend\.dev/i.test(process.env.RESEND_FROM)),
    },
    zalo: {
      // Token tự làm mới qua App ID + Secret + refresh token (token sống 1 giờ,
      // không cắm cứng được). ZALO_OA_ACCESS_TOKEN chỉ để đè khi thử tay.
      daCamKhoa: Boolean(
        (process.env.ZALO_OA_APP_ID && process.env.ZALO_OA_APP_SECRET && process.env.ZALO_OA_REFRESH_TOKEN) ||
          process.env.ZALO_OA_ACCESS_TOKEN,
      ),
      mauOtp: Boolean(process.env.ZALO_ZNS_TEMPLATE_OTP),
      mauNapTien: Boolean(process.env.ZALO_ZNS_TEMPLATE_NAP_TIEN),
      mauDuyetTin: Boolean(process.env.ZALO_ZNS_TEMPLATE_DUYET_TIN),
    },
  });
}
