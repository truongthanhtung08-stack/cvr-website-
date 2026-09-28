import { NextResponse } from "next/server";
import { createClient as taoClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { phatMa, kiemMa, guiMaQuaZalo } from "@/lib/maXacThuc";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { timTaiKhoan } from "@/lib/taiKhoanTheoSdt";

// ============================================================================
// POST /api/xac-thuc/xac-minh-sdt — TÀI KHOẢN ĐANG ĐĂNG NHẬP XÁC MINH SỐ CỦA MÌNH
// Quy tắc chủ dự án chốt 27/09/2026: mọi tài khoản BẮT BUỘC có số điện thoại đã xác
// minh (đăng ký bằng email / Google xong phải làm bước này trước khi đăng tin).
//   gui-ma   { sdt }      → gửi mã 6 số qua Zalo tới số đó
//   xac-nhan { sdt, ma }  → ghi số vào hồ sơ + ĐÃ XÁC MINH → tin đăng hộ mang số này tự về
// 1 SỐ = 1 TÀI KHOẢN: số đã là của tài khoản khác thì từ chối (muốn chung thì khách gộp).
// Header: Authorization: Bearer <access_token của khách>
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loi = (thongBao: string, status = 400) => NextResponse.json({ ok: false, loi: thongBao }, { status });

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const b = (await req.json().catch(() => ({}))) as { buoc?: string; sdt?: string; ma?: string };
  const sdt = chuanHoaSdt(b.sdt ?? "");
  if (!laSdtVN(sdt)) return loi("Số điện thoại chưa đúng (VD: 0905123456).");

  const admin = createAdminClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!admin || !url || !anon || !token) return loi("Vui lòng đăng nhập lại.", 401);
  const { data: u } = await admin.auth.getUser(token);
  const uid = u?.user?.id;
  if (!uid) return loi("Vui lòng đăng nhập lại.", 401);

  // ĐỒNG BỘ TÀI KHOẢN (chủ dự án chốt 28/09/2026): khách đăng ký bằng email/Google, lúc
  // nhập số (khi đăng tin) mà số đó ĐÃ CÓ tài khoản cũ (vd tài khoản Coastal Land tạo hộ,
  // đã có tin) → nhận đúng mã Zalo = cùng một người → GỘP tài khoản cũ vào tài khoản đang
  // đăng nhập: tin chuyển sang, số về đây, tài khoản cũ khoá lại. Tài khoản cũ còn TIỀN
  // trong ví hoặc gói hội viên còn hạn thì không tự gộp (tránh sai tiền) — mời liên hệ.
  const tim = await timTaiKhoan(admin, sdt);
  if (tim === "trung") return loi("Số này đang gắn với nhiều tài khoản. Vui lòng liên hệ Coastal Land.", 409);
  const idCu = tim && tim.id !== uid ? tim.id : null;
  if (idCu) {
    const [{ data: hs }, { data: hv }] = await Promise.all([
      admin.from("profiles").select("balance").eq("id", idCu).maybeSingle(),
      admin.from("hoi_vien").select("user_id").eq("user_id", idCu).gt("het_han", new Date().toISOString()).limit(1),
    ]);
    if (Number(hs?.balance ?? 0) > 0 || (hv ?? []).length)
      return loi("Số này thuộc một tài khoản còn số dư ví hoặc gói hội viên. Vui lòng liên hệ Coastal Land để gộp tài khoản.", 409);
  }

  if (b.buoc === "gui-ma") {
    const phat = await phatMa(sdt, "zalo", "xac-minh-sdt");
    if (!phat.ok) return loi(phat.loi, 429);
    const gui = await guiMaQuaZalo(sdt, phat.ma);
    if (!gui.ok) return loi("Chưa gửi được mã qua Zalo. Vui lòng thử lại sau ít phút.", 503);
    return NextResponse.json({ ok: true });
  }

  if (b.buoc !== "xac-nhan") return loi("Bước không hợp lệ.");
  const kiem = await kiemMa(sdt, "xac-minh-sdt", b.ma ?? "");
  if (!kiem.ok) return loi(kiem.loi);

  let soTinGop = 0;
  if (idCu) {
    // Gộp: tin của tài khoản cũ sang tài khoản này; tài khoản cũ nhả số rồi khoá đăng nhập.
    const { data: chuyen } = await admin.from("listings").update({ owner_id: uid }).eq("owner_id", idCu).select("id");
    soTinGop = (chuyen ?? []).length;
    await admin.from("profiles").update({ phone: null, phone_verified: false }).eq("id", idCu);
    // Supabase KHÔNG cho xoá trắng số đăng nhập (phone ""/null bị bỏ qua — đo 28/09/2026) →
    // đổi sang số giả đầu 8400… (không phải số di động VN nào) để nhả số thật cho tài khoản này.
    const soGia = "8400" + String(parseInt(idCu.replace(/-/g, "").slice(0, 10), 16)).slice(0, 9);
    await admin.auth.admin.updateUserById(idCu, { phone: soGia, phone_confirm: true, ban_duration: "876000h" }).then(() => {}, () => {});
  }

  const { error } = await admin.from("profiles").update({ phone: sdt, phone_verified: true }).eq("id", uid);
  if (error) return loi("Chưa lưu được số. Vui lòng thử lại.", 500);
  // Gắn số vào đăng nhập → lần sau vào bằng số + mật khẩu được luôn (hỏng thì bỏ qua).
  await admin.auth.admin.updateUserById(uid, { phone: `84${sdt.slice(1)}`, phone_confirm: true }).then(() => {}, () => {});
  // Tin Coastal Land đăng hộ mang số này tự về tài khoản.
  const sb = taoClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  await sb.rpc("tu_nhan_tin_theo_sdt").then(() => {}, () => {});

  return NextResponse.json({ ok: true, sdt, soTinGop });
}
