import { NextResponse } from "next/server";
import { kiemMa } from "@/lib/maXacThuc";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt } from "@/lib/phone";

// ============================================================================
// POST /api/xac-thuc/doi-mat-khau — QUÊN MẬT KHẨU BẰNG MÃ 6 SỐ
//
// Body: { email, ma, matKhauMoi }
//
// Chủ dự án chốt: quên mật khẩu thì gửi MÃ qua email/gmail, KHÔNG gửi qua Zalo.
// Dùng mã thay cho "liên kết đặt lại" vì liên kết bắt khách rời trang, mở hộp
// thư, bấm vào đường dẫn lạ — đúng thứ khiến người ta ngại và nghi ngờ.
//
// AN TOÀN:
//   · Mã đã được kiểm ở kiemMa: đúng hạn, chưa dùng, chưa sai quá 5 lần.
//   · KHÔNG tiết lộ email đó có tài khoản hay không ở bước gửi mã — biết được
//     điều đó là biết ai đang dùng web (bước gửi mã nằm ở route gui-ma).
//   · Đổi mật khẩu xong thì các phiên đăng nhập cũ bị thu hồi: ai đó đang mở
//     sẵn tài khoản trên máy khác sẽ bị đá ra.
// ============================================================================

export const runtime = "nodejs";

export async function POST(req: Request) {
  let b: { email?: string; sdt?: string; ma?: string; matKhauMoi?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, loi: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const email = (b.email ?? "").trim().toLowerCase();
  const sdt = chuanHoaSdt(b.sdt ?? "");
  const ma = (b.ma ?? "").trim();
  const matKhauMoi = b.matKhauMoi ?? "";

  // Định danh có thể là EMAIL hoặc SỐ ĐIỆN THOẠI. Khách được đăng tin hộ nhiều
  // người chỉ có số điện thoại, không có email — bắt buộc email ở bước quên mật
  // khẩu là khoá luôn đường vào của họ.
  if (!email && !sdt) return NextResponse.json({ ok: false, loi: "Thiếu email hoặc số điện thoại." }, { status: 400 });
  if (matKhauMoi.length < 6)
    return NextResponse.json({ ok: false, loi: "Mật khẩu cần ít nhất 6 ký tự." }, { status: 400 });

  const kiem = await kiemMa(email || sdt, "quen-mat-khau", ma);
  if (!kiem.ok) return NextResponse.json({ ok: false, loi: kiem.loi }, { status: 400 });

  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, loi: "Hệ thống chưa sẵn sàng." }, { status: 503 });

  // Tìm tài khoản theo email. Supabase chưa có hàm "lấy user theo email" nên duyệt
  // danh sách — web đang ở quy mô vài nghìn tài khoản, một lần duyệt là đủ nhanh.
  const { data: ds, error: loiDs } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (loiDs) return NextResponse.json({ ok: false, loi: "Không tra được tài khoản." }, { status: 500 });

  const e164 = sdt ? `+84${sdt.slice(1)}` : "";
  const user = ds.users.find((u) =>
    email
      ? (u.email ?? "").toLowerCase() === email
      : chuanHoaSdt(u.phone ?? "") === sdt || (u.phone ?? "") === e164,
  );
  if (!user) {
    // Mã đúng nhưng email không có tài khoản → nói chung chung, không xác nhận
    // sự tồn tại của tài khoản nào cả.
    return NextResponse.json({ ok: false, loi: "Không đổi được mật khẩu. Vui lòng đăng ký tài khoản mới." }, { status: 404 });
  }

  const { error } = await db.auth.admin.updateUserById(user.id, { password: matKhauMoi });
  if (error) return NextResponse.json({ ok: false, loi: "Không đổi được mật khẩu." }, { status: 500 });

  // Thu hồi mọi phiên cũ — đổi mật khẩu là để cắt đường của người khác.
  await db.auth.admin.signOut(user.id, "global").catch(() => {});

  return NextResponse.json({ ok: true });
}
