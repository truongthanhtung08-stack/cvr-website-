import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { vnd } from "@/lib/billing";
import { revalidateTag } from "next/cache";
import { xuLyUpCho } from "@/lib/upTin";
import { guiThongBao, MAU_NAP_TIEN } from "@/lib/thongBao";

// ============================================================================
// CỘNG VÍ TAY CHO KHÁCH (chỉ quản trị viên)
// ----------------------------------------------------------------------------
// VÌ SAO CẦN: khi PayOS báo tiền về mà không khớp đơn nào trong sổ (khách tạo
// đơn ở máy khác, hoặc chuyển khoản sai nội dung), hệ thống gửi cảnh báo bảo
// "vào /admin/thanh-toan cộng ví tay cho khách" — nhưng trước đây KHÔNG có chỗ
// nào làm việc đó. Tiền của khách nằm trong tài khoản ngân hàng mà ví vẫn bằng 0,
// chủ dự án phải mở thẳng cơ sở dữ liệu sửa tay.
//
// NGUYÊN TẮC:
//   · Chỉ admin gọi được.
//   · Cộng bằng hàm nguyên tử cong_vi (migration 0028) — không ghi đè số dư.
//   · MỖI LẦN CỘNG ĐỀU GHI MỘT DÒNG payments để còn đối soát, ghi rõ ai cộng và
//     vì sao. Cộng tay mà không để lại vết là sổ sách không bao giờ khớp.
// ============================================================================
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Chưa đăng nhập", 401);
  const { data: me } = await ssr.from("profiles").select("role,email").eq("id", user.id).single();
  if (me?.role !== "admin") return loi("Chỉ quản trị viên được cộng ví", 403);

  const { tim, soTien, lyDo } = (await request.json().catch(() => ({}))) as {
    tim?: string;
    soTien?: number;
    lyDo?: string;
  };
  const tienCong = Math.round(Number(soTien) || 0);
  if (tienCong <= 0) return loi("Số tiền phải lớn hơn 0.", 400);
  if (!tim?.trim()) return loi("Nhập email hoặc số điện thoại của khách.", 400);
  if (!lyDo?.trim()) return loi("Ghi rõ lý do cộng tay (mã đơn, nội dung chuyển khoản…).", 400);

  const admin = createAdminClient();
  if (!admin) return loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ.", 500);

  // Tìm khách theo email HOẶC số điện thoại — cộng nhầm người là mất tiền thật,
  // nên tìm ra nhiều hơn một hồ sơ thì DỪNG, bắt chọn lại cho chắc.
  const khoa = tim.trim();
  const { data: ds } = await admin
    .from("profiles")
    .select("id,email,phone,full_name,total_topup")
    .or(`email.eq.${khoa},phone.eq.${khoa}`)
    .limit(5);

  const tv = (ds ?? []) as { id: string; email: string | null; phone: string | null; full_name: string | null; total_topup: number | null }[];
  if (tv.length === 0) return loi(`Không tìm thấy khách hàng nào với "${khoa}".`, 404);
  if (tv.length > 1) return loi(`Có ${tv.length} tài khoản trùng "${khoa}". Dùng email chính xác để khỏi cộng nhầm người.`, 409);
  const kh = tv[0];

  // Hệ cấp theo tổng nạp + điểm thưởng đã BỎ 25/09/2026, thay bằng Gói hội viên (0040).
  const diemThuong = 0;

  const { data: viMoi, error: loiRpc } = await admin.rpc("cong_vi", {
    p_user: kh.id,
    p_tien: tienCong,
    p_cap: null,
    p_diem: diemThuong,
  });
  if (loiRpc) {
    return /function .* does not exist|schema cache|PGRST202/i.test(loiRpc.message)
      ? loi("Chưa chạy migration 0028 (hàm cong_vi) trong Supabase — chưa cộng ví được.", 503)
      : loi(loiRpc.message, 500);
  }
  const dong = (viMoi as { so_du?: number }[] | null)?.[0];
  if (!dong) return loi("Không cộng được — hồ sơ khách không tồn tại.", 404);

  // ĐỂ LẠI VẾT trong sổ giao dịch, ghi rõ ai cộng và vì sao.
  await admin.from("payments").insert({
    user_id: kh.id,
    user_email: kh.email,
    order_code: `TAY-${Date.now()}`,
    amount: tienCong,
    kind: "topup",
    status: "paid",
    note: `Cộng tay bởi ${me?.email ?? user.id} — ${lyDo.trim()}`,
  });

  await guiThongBao({
    email: kh.email,
    phone: kh.phone,
    tieuDe: "Đã nhận tiền nạp vào ví",
    loiNhan: `Coastal Land đã ghi nhận khoản nạp của ${kh.full_name || "quý khách"}.`,
    cacDong: [
      { nhan: "Số tiền nạp", giaTri: vnd(tienCong) },
      { nhan: "Số dư hiện tại", giaTri: vnd(Number(dong.so_du ?? 0)) },
      ...(diemThuong > 0 ? [{ nhan: "Điểm thưởng cộng thêm", giaTri: `${diemThuong} điểm` }] : []),
    ],
    znsTemplateId: MAU_NAP_TIEN,
    znsData: {
      ten_khach_hang: kh.full_name || "Quý khách",
      ma_giao_dich: `TAY-${Date.now()}`,
      so_tien: vnd(tienCong),
      so_du: vnd(Number(dong.so_du ?? 0)),
    },
  });

  // Tiền vào ví → tự Up các tin khách đang chờ nạp (giống webhook PayOS).
  const daUp = await xuLyUpCho(admin, kh.id);
  if (daUp > 0) revalidateTag("listings", "max");

  return NextResponse.json({
    ok: true,
    daUp,
    khach: kh.full_name || kh.email || kh.phone,
    soTien: tienCong,
    soDuMoi: Number(dong.so_du ?? 0),
    diemThuong,
  });
}

function loi(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}
