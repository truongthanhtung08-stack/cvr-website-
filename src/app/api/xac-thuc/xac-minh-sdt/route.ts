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

  // PHÂN TÀI KHOẢN THEO CÁCH ĐĂNG NHẬP (chủ dự án chốt 01/10/2026):
  //   · Nhóm SĐT (Zalo + Số điện thoại): định danh = số. Tài khoản sinh từ Zalo (web không
  //     lấy được số) khai số ĐÃ CÓ tài khoản → GỘP vào tài khoản của số, Zalo gắn sang đó.
  //   · Nhóm Email (Email + Google): định danh = email, GIỮ RIÊNG. Khai số đã thuộc tài khoản
  //     khác → nhận mã = số của mình → ghi là SỐ LIÊN HỆ ĐÃ XÁC MINH (0050), không gộp, không
  //     khoá ai, không giành số của tài khoản SĐT.
  const tim = await timTaiKhoan(admin, sdt);
  if (tim === "trung") return loi("Số này đang gắn với nhiều tài khoản. Vui lòng liên hệ Coastal Land.", 409);
  const idCu = tim && tim.id !== uid ? tim.id : null;
  const laTkZalo = /^zalo_.+@users\.coastalland\.vn$/.test(u.user?.email ?? "");

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

  // TÀI KHOẢN SINH RA TỪ ZALO (email kỹ thuật zalo_…) mà số này đã có tài khoản cũ → gộp
  // NGƯỢC: tài khoản Zalo nhập vào tài khoản cũ, Zalo gắn sang tài khoản cũ (0049), mở
  // phiên tài khoản cũ. Không cửa đăng nhập nào bị mất (Gmail/số + mật khẩu của tài khoản
  // cũ vẫn vào được; bấm Zalo lần sau tìm theo zalo_id → ra tài khoản cũ).
  if (idCu && laTkZalo) {
    const [{ data: hsMoi }, { data: hvMoi }] = await Promise.all([
      admin.from("profiles").select("balance,zalo_id").eq("id", uid).maybeSingle(),
      admin.from("hoi_vien").select("user_id").eq("user_id", uid).gt("het_han", new Date().toISOString()).limit(1),
    ]);
    if (Number(hsMoi?.balance ?? 0) > 0 || (hvMoi ?? []).length)
      return loi("Tài khoản Zalo này còn số dư ví hoặc gói hội viên. Vui lòng liên hệ Coastal Land để gộp tài khoản.", 409);
    const { data: hsCu } = await admin.from("profiles").select("zalo_id").eq("id", idCu).maybeSingle();
    const zaloId = hsMoi?.zalo_id ?? u.user!.email!.replace(/^zalo_|@users\.coastalland\.vn$/g, "");
    if (hsCu?.zalo_id && hsCu.zalo_id !== zaloId)
      return loi("Số này đã gắn với một tài khoản Zalo khác. Vui lòng liên hệ Coastal Land.", 409);

    const { data: chuyen } = await admin.from("listings").update({ owner_id: idCu }).eq("owner_id", uid).select("id");
    soTinGop = (chuyen ?? []).length;
    // Nhả zalo_id ở tài khoản Zalo trước (cột duy nhất) rồi gắn sang tài khoản cũ.
    await admin.from("profiles").update({ zalo_id: null }).eq("id", uid);
    await admin.from("profiles").update({ zalo_id: zaloId, phone: sdt, phone_verified: true }).eq("id", idCu);
    await admin.auth.admin.updateUserById(uid, { ban_duration: "876000h" }).then(() => {}, () => {});

    // Mở phiên cho tài khoản cũ (chưa có email thì gắn email kỹ thuật theo số).
    const { data: uCu } = await admin.auth.admin.getUserById(idCu);
    let emailCu = uCu?.user?.email ?? null;
    if (!emailCu) {
      emailCu = `sdt_${sdt}@users.coastalland.vn`;
      const { error } = await admin.auth.admin.updateUserById(idCu, { email: emailCu, email_confirm: true });
      if (error) return loi("Đã gộp nhưng chưa mở được phiên. Vui lòng đăng nhập lại bằng Zalo.", 500);
    }
    const sbMo = taoClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: emailCu });
    const hash = link?.properties?.hashed_token;
    let phien = hash ? (await sbMo.auth.verifyOtp({ type: "email", token_hash: hash })).data.session : null;
    if (!phien && hash) phien = (await sbMo.auth.verifyOtp({ type: "magiclink", token_hash: hash })).data.session;
    if (!phien) return loi("Đã gộp nhưng chưa mở được phiên. Vui lòng đăng nhập lại bằng Zalo.", 500);

    const sbCu = taoClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${phien.access_token}` } },
    });
    await sbCu.rpc("tu_nhan_tin_theo_sdt").then(() => {}, () => {});
    return NextResponse.json({
      ok: true, sdt, soTinGop,
      doiTaiKhoan: { id: idCu, access_token: phien.access_token, refresh_token: phien.refresh_token },
    });
  }

  if (idCu) {
    // Nhóm Email: số đã thuộc tài khoản khác → chỉ là SỐ LIÊN HỆ ĐÃ XÁC MINH của tài khoản
    // email này (được đăng tin). Không gộp, không khoá, không đụng tài khoản của số đó.
    const { error } = await admin.from("profiles")
      .update({ phone: sdt, phone_verified: false, sdt_lien_he_xac_minh: true }).eq("id", uid);
    if (error) return loi("Chưa lưu được số. Vui lòng thử lại.", 500);
    return NextResponse.json({ ok: true, sdt, soTinGop: 0 });
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
