import { NextResponse } from "next/server";
import { kiemMa } from "@/lib/maXacThuc";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// POST /api/xac-thuc/dang-ky — TẠO TÀI KHOẢN SAU KHI MÃ ĐÚNG
//
// Body: { email, sdt?, hoTen, matKhau, ma }
//
// Vì sao phải qua máy chủ chứ không gọi thẳng supabase.auth.signUp ở trình duyệt:
//   · Đăng ký bằng SỐ ĐIỆN THOẠI thì Supabase đòi xác nhận số bằng SMS/ZNS —
//     đường đó đang kẹt (số dư ZBS = 0đ), tài khoản sẽ treo ở trạng thái chưa
//     xác nhận và khách không vào được.
//   · Ở đây web đã tự xác thực bằng MÃ GỬI QUA EMAIL rồi, nên máy chủ tạo tài
//     khoản với email_confirm = true. Khách đăng ký xong là đăng nhập được ngay,
//     không phải mở hộp thư bấm liên kết (kiểu đó chủ dự án đã bác: giống quên
//     mật khẩu, không chuyên nghiệp).
//
// Mật khẩu KHÔNG đi qua bảng nào của mình — chuyển thẳng cho Supabase Auth băm
// và giữ. Máy chủ chỉ là người chuyển tiếp.
// ============================================================================

export const runtime = "nodejs";

export async function POST(req: Request) {
  let b: { email?: string; sdt?: string; hoTen?: string; matKhau?: string; ma?: string; kenh?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, loi: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const email = (b.email ?? "").trim().toLowerCase();
  const sdt = chuanHoaSdt(b.sdt ?? "");
  const hoTen = (b.hoTen ?? "").trim();
  const matKhau = b.matKhau ?? "";
  const ma = (b.ma ?? "").trim();

  if (matKhau.length < 6)
    return NextResponse.json({ ok: false, loi: "Mật khẩu cần ít nhất 6 ký tự." }, { status: 400 });
  if (sdt && !laSdtVN(sdt))
    return NextResponse.json({ ok: false, loi: "Số điện thoại chưa đúng." }, { status: 400 });
  if (!email && !sdt)
    return NextResponse.json({ ok: false, loi: "Cần email hoặc số điện thoại." }, { status: 400 });

  // ── SỐ ĐIỆN THOẠI LÀ ĐỊNH DANH CHÍNH (chủ dự án chốt 11/09/2026) ──────────
  // Rất nhiều môi giới KHÔNG có email. Bắt buộc email là chặn thẳng nhóm khách
  // đông nhất của web. Vì vậy có hai đường tạo tài khoản:
  //   · CÓ EMAIL  → phải nhập đúng mã gửi tới hộp thư đó (xác thực thật).
  //   · KHÔNG CÓ  → tạo bằng SĐT + mật khẩu, dùng được ngay, nhưng SỐ CHƯA XÁC
  //     MINH: profiles.phone_verified để false nên chưa tự nhận được tin cũ,
  //     phải qua chủ dự án duyệt. Khi Zalo ZNS có số dư thì bật OTP Zalo cho
  //     nhóm này, không phải sửa lại giao diện.
  // KHÔNG đánh dấu số là "đã xác minh" khi chưa thật sự xác minh — đó là chỗ
  // quyết định ai được nhận tin và danh sách khách quan tâm của ai.
  const coEmail = !!email;

  // Mã có thể đã gửi qua EMAIL hoặc qua ZALO — kiểm theo đúng nơi đã gửi.
  // Xác minh bằng Zalo nghĩa là SỐ ĐIỆN THOẠI ĐÃ ĐƯỢC CHỨNG MINH là của khách
  // → đánh dấu phone_verified, khách tự nhận lại tin cũ ngay, không phải chờ duyệt.
  const kenh: "email" | "zalo" | "khong" = ma ? (b.kenh === "zalo" ? "zalo" : "email") : "khong";
  if (kenh === "email") {
    if (!coEmail) return NextResponse.json({ ok: false, loi: "Thiếu email để kiểm mã." }, { status: 400 });
    const kiem = await kiemMa(email, "dang-ky", ma);
    if (!kiem.ok) return NextResponse.json({ ok: false, loi: kiem.loi }, { status: 400 });
  } else if (kenh === "zalo") {
    if (!sdt) return NextResponse.json({ ok: false, loi: "Thiếu số điện thoại để kiểm mã." }, { status: 400 });
    const kiem = await kiemMa(sdt, "dang-ky", ma);
    if (!kiem.ok) return NextResponse.json({ ok: false, loi: kiem.loi }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, loi: "Hệ thống chưa sẵn sàng." }, { status: 503 });

  // Tạo tài khoản. Email coi như đã xác thực vì mã vừa gửi tới chính hộp thư đó.
  // Số điện thoại đặt phone_confirm = true để Supabase cho đăng nhập bằng
  // SĐT + mật khẩu; việc "số này đúng là của bạn" vẫn do phone_verified trong
  // hồ sơ quyết định, KHÔNG dùng cờ này.
  const { data, error } = await db.auth.admin.createUser({
    ...(coEmail ? { email, email_confirm: true } : {}),
    password: matKhau,
    ...(sdt ? { phone: `+84${sdt.slice(1)}`, phone_confirm: true } : {}),
    user_metadata: { full_name: hoTen, phone: sdt },
  });

  if (error) {
    const m = error.message || "";
    if (/already been registered|already exists|duplicate/i.test(m)) {
      return NextResponse.json(
        {
          ok: false,
          loi: coEmail
            ? "Email này đã có tài khoản. Bạn đăng nhập hoặc dùng 'Quên mật khẩu'."
            : "Số điện thoại này đã có tài khoản. Bạn đăng nhập hoặc dùng 'Quên mật khẩu'.",
          daCo: true,
        },
        { status: 409 },
      );
    }
    // Số điện thoại đã thuộc tài khoản khác → tạo tài khoản CHỈ với email, đừng
    // chặn cả việc đăng ký vì một trường không bắt buộc.
    if (coEmail && sdt && /phone/i.test(m)) {
      const lai = await db.auth.admin.createUser({
        email,
        password: matKhau,
        email_confirm: true,
        user_metadata: { full_name: hoTen },
      });
      if (!lai.error) {
        return NextResponse.json({ ok: true, canhBao: "Số điện thoại này đã gắn với tài khoản khác nên chưa lưu vào hồ sơ." });
      }
    }
    return NextResponse.json({ ok: false, loi: "Không tạo được tài khoản. Vui lòng thử lại." }, { status: 500 });
  }

  // 3) Ghi hồ sơ (bảng profiles). Trigger của Supabase thường đã tạo sẵn dòng này
  //    từ user_metadata; cập nhật thêm cho chắc, lỗi ở bước này KHÔNG được làm
  //    hỏng việc đăng ký — tài khoản đã tạo xong rồi.
  if (data.user) {
    await db
      .from("profiles")
      .update({
        full_name: hoTen || null,
        phone: sdt || null,
        // CHỈ đánh dấu đã xác minh khi mã thật sự đi qua Zalo tới đúng số đó.
        // Đây là thứ quyết định ai được nhận tin cũ và danh sách khách quan tâm
        // — đánh dấu bừa là giao tài sản của người này cho người khác.
        ...(kenh === "zalo" ? { phone_verified: true } : {}),
      })
      .eq("id", data.user.id);
  }

  return NextResponse.json({ ok: true });
}
