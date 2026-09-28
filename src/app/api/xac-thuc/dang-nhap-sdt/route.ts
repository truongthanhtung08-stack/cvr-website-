import { NextResponse } from "next/server";
import { createClient as taoClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { timTaiKhoan } from "@/lib/taiKhoanTheoSdt";
import { phatMa, kiemMa, guiMaQuaZalo } from "@/lib/maXacThuc";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI — SỐ NÀO CỦA KHÁCH CŨNG VÀO ĐÚNG MỘT TÀI KHOẢN
// ----------------------------------------------------------------------------
// Chủ dự án chốt 27/09/2026: 1 SỐ = 1 TÀI KHOẢN. Email là cửa phụ vào CÙNG tài khoản
// của số đó (tài khoản email có khai số → vào bằng số là ra tài khoản email ấy, không đẻ
// tài khoản thứ hai). Số phụ chỉ vào chung khi đã xác minh (khách tự gộp tài khoản).
//
// Trước đây đường này dùng OTP của Supabase: mã đúng nhưng số KHÔNG được đánh dấu
// "đã xác minh" → tin đăng hộ không tự về tài khoản (đo thật 27/09). Nay tự làm:
//   gui-ma   { sdt }            → gửi mã 6 số qua Zalo (mẫu OTP 630638)
//   xac-nhan { sdt, ma }        → mã đúng = số này đúng là của khách
//                                  → tìm tài khoản đang giữ số (chưa có thì tạo)
//                                  → đánh dấu số ĐÃ XÁC MINH → mở phiên đăng nhập
//   mat-khau { sdt, matKhau }   → số thứ hai / tài khoản email: dò đúng tài khoản rồi
//                                  đăng nhập bằng mật khẩu của tài khoản đó
//
// AN TOÀN: chỉ mở tài khoản khi CẢ HAI phía khớp — chủ tài khoản đã tự khai số này,
// và người đang đăng nhập nhận được mã gửi tới đúng số đó. Một số mà khai ở 2 tài
// khoản khác nhau thì KHÔNG đoán — từ chối và mời liên hệ hỗ trợ.
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loi = (thongBao: string, status = 400) => NextResponse.json({ ok: false, loi: thongBao }, { status });

const TRUNG = "Số này đang gắn với nhiều tài khoản. Vui lòng liên hệ Coastal Land để được hỗ trợ.";

function clientThuong() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return taoClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Zalo Mini App (chạy ở *.zdn.vn / zalo.me…) gọi chung đường này để đăng nhập bằng mã —
// cho phép đúng các nguồn đó (giống /api/auth/zalo-mini-app), web thì cùng nguồn sẵn.
function choPhep(req: Request): Record<string, string> {
  const nguon = req.headers.get("origin") ?? "";
  const hopLe = /^https:\/\/([a-z0-9-]+\.)*(zdn\.vn|zalo\.me|zaloapp\.com|zaloplatforms\.com)$/i.test(nguon) || /^http:\/\/(localhost|192\.168\.\d+\.\d+):\d+$/.test(nguon);
  return hopLe
    ? { "Access-Control-Allow-Origin": nguon, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}
export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: choPhep(req) });
}
export async function POST(req: Request) {
  const res = await xuLy(req);
  for (const [k, v] of Object.entries(choPhep(req))) res.headers.set(k, v);
  return res;
}

async function xuLy(req: Request) {
  let b: { buoc?: string; sdt?: string; ma?: string; matKhau?: string };
  try {
    b = await req.json();
  } catch {
    return loi("Dữ liệu không hợp lệ.");
  }
  const sdt = chuanHoaSdt(b.sdt ?? "");
  if (!laSdtVN(sdt)) return loi("Số điện thoại chưa đúng.");

  const admin = createAdminClient();
  const sb = clientThuong();
  if (!admin || !sb) return loi("Hệ thống chưa sẵn sàng.", 503);

  // ── 1. GỬI MÃ ─────────────────────────────────────────────────────────────
  if (b.buoc === "gui-ma") {
    const phat = await phatMa(sdt, "zalo", "dang-nhap");
    if (!phat.ok) return loi(phat.loi, 429);
    const gui = await guiMaQuaZalo(sdt, phat.ma);
    if (!gui.ok) return loi("Chưa gửi được mã qua Zalo. Vui lòng thử lại sau ít phút.", 503);
    return NextResponse.json({ ok: true });
  }

  // ── 2. ĐĂNG NHẬP BẰNG MẬT KHẨU (số thứ hai / tài khoản email có khai số) ────
  if (b.buoc === "mat-khau") {
    const tim = await timTaiKhoan(admin, sdt);
    if (tim === "trung") return loi(TRUNG, 409);
    if (!tim) return loi("Số điện thoại hoặc mật khẩu chưa đúng.", 401);
    const { data: u } = await admin.auth.admin.getUserById(tim.id);
    const user = u?.user;
    if (!user) return loi("Số điện thoại hoặc mật khẩu chưa đúng.", 401);
    const { data, error } = user.phone
      ? await sb.auth.signInWithPassword({ phone: `+${user.phone.replace(/^\+/, "")}`, password: b.matKhau ?? "" })
      : await sb.auth.signInWithPassword({ email: user.email ?? "", password: b.matKhau ?? "" });
    if (error || !data.session) return loi("Số điện thoại hoặc mật khẩu chưa đúng.", 401);
    return NextResponse.json({ ok: true, access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  }

  // ── 3. XÁC NHẬN MÃ → MỞ PHIÊN ─────────────────────────────────────────────
  if (b.buoc !== "xac-nhan") return loi("Bước không hợp lệ.");
  const kiem = await kiemMa(sdt, "dang-nhap", b.ma ?? "");
  if (!kiem.ok) return loi(kiem.loi);

  const so84 = `84${sdt.slice(1)}`;
  const emailKt = `sdt_${sdt}@users.coastalland.vn`; // email kỹ thuật (thongBao bỏ qua đuôi này)
  const tim = await timTaiKhoan(admin, sdt);
  if (tim === "trung") return loi(TRUNG, 409);

  let userId: string;
  if (tim) {
    userId = tim.id;
    // Mã đã tới đúng số chính → số này ĐÃ XÁC MINH (để tin đăng hộ tự về). Số phụ thì
    // timTaiKhoan chỉ trả khi đã xác minh sẵn, không phải ghi gì thêm.
    if (tim.tu === "ho-so") await admin.from("profiles").update({ phone_verified: true }).eq("id", userId);
  } else {
    const { data: moi, error } = await admin.auth.admin.createUser({
      email: emailKt,
      email_confirm: true,
      phone: so84,
      phone_confirm: true,
      user_metadata: { phone: sdt },
    });
    if (error || !moi.user) return loi("Chưa tạo được tài khoản. Vui lòng liên hệ Coastal Land.", 409);
    userId = moi.user.id;
    await admin.from("profiles").update({ phone: sdt, phone_verified: true }).eq("id", userId);
  }

  // Mở phiên bằng liên kết một lần (không gửi email nào). Tài khoản chưa có email thì
  // gắn email kỹ thuật — cùng cách đăng nhập Zalo Mini App đang dùng.
  const { data: u } = await admin.auth.admin.getUserById(userId);
  let email = u?.user?.email ?? null;
  if (!email) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email: emailKt, email_confirm: true });
    if (error) return loi("Chưa mở được phiên đăng nhập. Vui lòng thử lại.", 500);
    email = emailKt;
  }
  const { data: link, error: loiLink } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hash = link?.properties?.hashed_token;
  if (loiLink || !hash) return loi("Chưa mở được phiên đăng nhập. Vui lòng thử lại.", 500);
  let { data: phien, error: loiPhien } = await sb.auth.verifyOtp({ type: "email", token_hash: hash });
  if (loiPhien) ({ data: phien, error: loiPhien } = await sb.auth.verifyOtp({ type: "magiclink", token_hash: hash }));
  if (loiPhien || !phien.session) return loi("Chưa mở được phiên đăng nhập. Vui lòng thử lại.", 500);

  // Khách vào là việc của mình (chủ dự án chốt 27/09/2026): tin đăng hộ mang số vừa xác
  // minh TỰ VỀ tài khoản ngay, không bắt khách bấm thêm gì. Hỏng thì màn tài khoản vẫn
  // còn khối "tin của bạn đã có sẵn" để nhận lại.
  await sb.rpc("tu_nhan_tin_theo_sdt").then(() => {}, () => {});

  return NextResponse.json({ ok: true, access_token: phien.session.access_token, refresh_token: phien.session.refresh_token });
}
