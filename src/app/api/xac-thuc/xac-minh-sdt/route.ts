import { NextResponse } from "next/server";
import { createClient as taoClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { phatMa, kiemMa, guiMaQuaZalo, guiMaQuaEmail } from "@/lib/maXacThuc";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { timTaiKhoan } from "@/lib/taiKhoanTheoSdt";
import { baoLoi } from "@/lib/baoLoi";

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

// GỘP CHẠM TỚI TIỀN (chủ dự án 05/11/2026: "vì nó liên quan đến TIỀN"): tài khoản bị gộp mà có BẤT CỨ thứ gì dính tiền — số dư
// ví, đã từng nạp (total_topup / payments đã trả), doanh thu, lượt đẩy còn lại, gói hội viên còn hạn, voucher còn lượt, tin chờ nạp
// (up_cho) — thì KHÔNG tự gộp, báo khách liên hệ Coastal Land (admin gộp tay, đối chiếu tiền). Tiền = một nguồn Admin (CLAUDE.md 0.1).
async function dinhTien(admin: NonNullable<ReturnType<typeof createAdminClient>>, ids: string[]): Promise<boolean> {
  if (!ids.length) return false;
  const bay = new Date().toISOString();
  const [hs, pay, dt, hv, vc, uc] = await Promise.all([
    admin.from("profiles").select("balance,total_topup,bump_credits").in("id", ids),
    admin.from("payments").select("user_id").in("user_id", ids).eq("status", "paid").limit(1),
    admin.from("doanh_thu").select("user_id").in("user_id", ids).limit(1),
    admin.from("hoi_vien").select("user_id").in("user_id", ids).gt("het_han", bay).limit(1),
    admin.from("hoi_vien_voucher").select("user_id").in("user_id", ids).gt("con_lai", 0).limit(1),
    admin.from("up_cho").select("user_id").in("user_id", ids).eq("trang_thai", "cho").limit(1),
  ]);
  if ([hs, pay, dt, hv, vc, uc].some((x) => x.error)) return true; // đọc lỗi → coi như có tiền, không tự gộp
  return (hs.data ?? []).some((p) => Number(p.balance ?? 0) > 0 || Number(p.total_topup ?? 0) > 0 || Number(p.bump_credits ?? 0) > 0)
    || [pay, dt, hv, vc, uc].some((x) => (x.data ?? []).length > 0);
}

// GỘP LÀ VIỆC CỦA WEB, KHÔNG BẮT KHÁCH (chủ dự án 05/11/2026): tài khoản cần gộp mà dính tiền → web KHÔNG tự gộp nhưng cũng KHÔNG
// chặn khách: số vừa xác minh ghi là số liên hệ đã xác minh của tài khoản đang dùng (sdt_lien_he_xac_minh — được đăng tin, nạp tiền),
// tin đăng mang số đó; Coastal Land nhận email báo việc để gộp tay, đối chiếu tiền. Khách không phải liên hệ, không phải làm gì.
async function choAdminGop(admin: NonNullable<ReturnType<typeof createAdminClient>>, uid: string, sdt: string, ids: string[]) {
  await admin.from("profiles").update({ sdt_lien_he_xac_minh: true }).eq("id", uid);
  // Nhớ số trên tài khoản đang dùng (user_metadata.sdt_lien_he) → đăng tin / nạp tiền lần sau không hỏi lại, tin mang số này
  const { data: uu } = await admin.auth.admin.getUserById(uid);
  await admin.auth.admin.updateUserById(uid, { user_metadata: { ...(uu?.user?.user_metadata ?? {}), sdt_lien_he: sdt } }).then(() => {}, () => {});
  await baoLoi({
    noi: "gop-tai-khoan",
    mucDo: "nang",
    tomTat: "Cần gộp tay tài khoản cùng số (dính tiền)",
    chiTiet: `Số ${sdt} · tài khoản đang dùng ${uid} · tài khoản cần gộp ${ids.join(", ")}`,
    hauQua: "Khách đang dùng 2 tài khoản cùng số; tiền / gói nằm ở tài khoản kia.",
    canLam: "Vào Admin → Khách hàng, đối chiếu ví, gói, voucher rồi gộp tay về một tài khoản.",
    khoa: `gop-tay:${sdt}`,
  }).catch(() => {});
  return NextResponse.json({ ok: true, sdt, soTinGop: 0, choAdminGop: true });
}

// Ngày thành viên của tài khoản giữ lại = ngày SỚM NHẤT trong các tài khoản gộp — gộp không làm khách thành "thành viên mới" lại
// để hưởng ưu đãi lần nữa (ưu đãi = tiền).
async function giuNgayThanhVienSomNhat(admin: NonNullable<ReturnType<typeof createAdminClient>>, giu: string, tu: string[]) {
  const { data } = await admin.from("profiles").select("id,ngay_thanh_vien").in("id", [giu, ...tu]);
  const ngay = (data ?? []).map((p) => p.ngay_thanh_vien as string | null).filter(Boolean).sort()[0];
  const cua = (data ?? []).find((p) => p.id === giu)?.ngay_thanh_vien as string | null;
  if (ngay && ngay !== cua) await admin.from("profiles").update({ ngay_thanh_vien: ngay }).eq("id", giu);
}

// GỘP TÊN + ẢNH (chủ dự án 05/11/2026: "tên, số, ảnh hai nguồn khác nhau thì gộp vào sẽ ra sao") — chuẩn: GIỮ của tài khoản
// được giữ lại; ô nào TRỐNG (chưa có ảnh, tên chỉ là số điện thoại) thì lấy bù từ tài khoản bị gộp. Ghi cả hồ sơ lẫn phiên
// (user_metadata) như datDaiDien để đầu trang hiện đúng. Khách đã tự đặt tên (cờ tu_dat) thì giữ nguyên.
async function layBuTenAnh(admin: NonNullable<ReturnType<typeof createAdminClient>>, giu: string, tu: string[]) {
  if (!tu.length) return;
  const { data: ds } = await admin.from("profiles").select("id,full_name,avatar_url").in("id", [giu, ...tu]);
  const hsGiu = (ds ?? []).find((p) => p.id === giu);
  const khac = (ds ?? []).filter((p) => p.id !== giu);
  const { data: uGiu } = await admin.auth.admin.getUserById(giu);
  const meta = (uGiu?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const laSo = (t: string) => /^[\d\s+.]+$/.test(t);
  const tenCo = String(hsGiu?.full_name ?? "").trim();
  const tenBu = khac.map((p) => String(p.full_name ?? "").trim()).find((t) => t && !laSo(t));
  const ten = (!tenCo || (!meta.tu_dat && laSo(tenCo))) && tenBu ? tenBu : tenCo || null;
  const anh = (hsGiu?.avatar_url as string | null) || khac.map((p) => p.avatar_url as string | null).find(Boolean) || null;
  if (ten === (hsGiu?.full_name ?? null) && anh === (hsGiu?.avatar_url ?? null)) return;
  await admin.from("profiles").update({ full_name: ten, avatar_url: anh }).eq("id", giu);
  await admin.auth.admin.updateUserById(giu, { user_metadata: { ...meta, full_name: ten, avatar_url: anh, picture: anh } }).then(() => {}, () => {});
}

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
  //   · Nhóm Email (Email + Google): (05/11/2026, thay chốt cũ "giữ riêng") xác thực số đã có tài khoản → GỘP mọi
  //     tài khoản của số đó (tài khoản SĐT + tài khoản Zalo ghi số đó) về tài khoản email đang dùng — xem khối gộp bên dưới.
  const tim = await timTaiKhoan(admin, sdt, { boQuaAdmin: true });
  if (tim === "trung") return loi("Số này đang gắn với nhiều tài khoản. Vui lòng liên hệ Coastal Land.", 409);
  const idCu = tim && tim.id !== uid ? tim.id : null;
  const laTkZalo = /^zalo_.+@users\.coastalland\.vn$/.test(u.user?.email ?? "");

  if (b.buoc === "gui-ma") {
    const phat = await phatMa(sdt, "zalo", "xac-minh-sdt");
    if (!phat.ok) return loi(phat.loi, 429);
    // MÃ GỬI CẢ ZALO LẪN EMAIL (chủ dự án 05/11/2026: "khách nhập số đt, có mã qua cả email và Zalo để xác thực và gộp tài
    // khoản" · "có cả 2 nếu khách có email"): Zalo về đúng số đó + email thật của tài khoản đang dùng (email kỹ thuật
    // …@users.coastalland.vn không tính). Một mã, nhận ở kênh nào cũng nhập được. Một kênh tới là đủ.
    const emailTk = u.user?.email && !/@users\.coastalland\.vn$/i.test(u.user.email) ? u.user.email : null;
    const [gui, guiEmail] = await Promise.all([
      guiMaQuaZalo(sdt, phat.ma),
      emailTk ? guiMaQuaEmail(emailTk, phat.ma, "xac-minh-sdt") : Promise.resolve({ ok: false }),
    ]);
    if (!gui.ok && !guiEmail.ok) return loi("Chưa gửi được mã. Vui lòng thử lại sau ít phút.", 503);
    return NextResponse.json({ ok: true, quaZalo: gui.ok, quaEmail: guiEmail.ok ? emailTk : null });
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
    if (Number(hsMoi?.balance ?? 0) > 0 || (hvMoi ?? []).length || (await dinhTien(admin, [uid])))
      return await choAdminGop(admin, uid, sdt, [idCu]);
    const { data: hsCu } = await admin.from("profiles").select("zalo_id").eq("id", idCu).maybeSingle();
    const zaloId = hsMoi?.zalo_id ?? u.user!.email!.replace(/^zalo_|@users\.coastalland\.vn$/g, "");
    if (hsCu?.zalo_id && hsCu.zalo_id !== zaloId)
      return loi("Số này đã gắn với một tài khoản Zalo khác. Vui lòng liên hệ Coastal Land.", 409);

    const { data: chuyen } = await admin.from("listings").update({ owner_id: idCu }).eq("owner_id", uid).select("id");
    soTinGop = (chuyen ?? []).length;
    // Nhả zalo_id ở tài khoản Zalo trước (cột duy nhất) rồi gắn sang tài khoản cũ.
    await admin.from("profiles").update({ zalo_id: null }).eq("id", uid);
    await admin.from("profiles").update({ zalo_id: zaloId, phone: sdt, phone_verified: true }).eq("id", idCu);
    // gop_vao: tài khoản bị gộp nhớ đã gộp vào đâu — Quên mật khẩu / đăng nhập bằng cửa cũ dẫn về đúng tài khoản (05/11/2026)
    await admin.auth.admin.updateUserById(uid, { ban_duration: "876000h", user_metadata: { gop_vao: idCu } }).then(() => {}, () => {});

    await giuNgayThanhVienSomNhat(admin, idCu, [uid]);
    await layBuTenAnh(admin, idCu, [uid]); // tên + ảnh: giữ của tài khoản cũ, ô trống lấy bù từ Zalo
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

  // TÀI KHOẢN EMAIL / GOOGLE xác thực số → GỘP MỌI TÀI KHOẢN CỦA CÙNG SỐ về MỘT (chủ dự án 05/11/2026: "gộp đồng bộ về
  // một nơi" · "khách nhập đúng số trước khi đăng tin — số này là số của Zalo"; thay chốt 01/10 "nhóm Email giữ riêng").
  // Mã đã đi qua Zalo tới đúng số đó = chính chủ số. Gộp về TÀI KHOẢN ĐANG DÙNG (email/Google) để khách không đổi phiên,
  // không mất đăng nhập email/Google. Gộp: tài khoản đang giữ số (đã xác thực) + tài khoản Zalo đang ghi số đó (Zalo web
  // không đưa số, khách tự ghi) — chuyển tin, số đăng nhập, Zalo sang; khoá các tài khoản thừa. Không gộp tài khoản quản trị.
  // Tài khoản thừa còn tiền ví / gói hội viên → DỪNG, không tự chuyển tiền (giống luật gộp Zalo ở trên).
  const so84g = `84${sdt.slice(1)}`;
  const { data: cungSo } = await admin.from("profiles").select("id,email,role,balance,zalo_id")
    .or(`phone.eq.${sdt},phone.eq.${so84g},phone.eq.+${so84g}`).neq("id", uid);
  const gopTu = (cungSo ?? []).filter((p) => p.role !== "admin"
    && (p.id === idCu || /^zalo_.+@users\.coastalland\.vn$/.test(String(p.email ?? ""))));
  if (idCu && !gopTu.some((p) => p.id === idCu)) {
    const { data: pCu } = await admin.from("profiles").select("id,email,role,balance,zalo_id").eq("id", idCu).maybeSingle();
    if (pCu) gopTu.push(pCu);
  }
  if (gopTu.length) {
    const ids = gopTu.map((p) => p.id as string);
    const { data: hv } = await admin.from("hoi_vien").select("user_id").in("user_id", ids).gt("het_han", new Date().toISOString()).limit(1);
    if (gopTu.some((p) => Number(p.balance ?? 0) > 0) || (hv ?? []).length || (await dinhTien(admin, ids)))
      return await choAdminGop(admin, uid, sdt, ids);

    const { data: chuyen } = await admin.from("listings").update({ owner_id: uid }).in("owner_id", ids).select("id");
    soTinGop = (chuyen ?? []).length;
    // Zalo đăng nhập web: ưu tiên mã Zalo của tài khoản sinh từ Zalo (đúng cửa "Tiếp tục với Zalo"), không có thì lấy mã đã gắn.
    const zaloGiu = (gopTu.find((p) => /^zalo_/.test(String(p.email ?? "")) && p.zalo_id) ?? gopTu.find((p) => p.zalo_id))?.zalo_id ?? null;
    // Nhả số + Zalo ở các tài khoản thừa trước (cột duy nhất), rồi gắn sang tài khoản đang dùng.
    await admin.from("profiles").update({ phone: null, phone_verified: false, zalo_id: null }).in("id", ids);
    await admin.from("sdt_nguoi_dung").update({ user_id: uid }).in("user_id", ids).eq("sdt", sdt).then(() => {}, () => {});
    for (const id of ids) await admin.auth.admin.updateUserById(id, { phone: "" }).then(() => {}, () => {});
    const { error } = await admin.from("profiles")
      .update({ phone: sdt, phone_verified: true, ...(zaloGiu ? { zalo_id: zaloGiu } : {}) }).eq("id", uid);
    if (error) return loi("Chưa lưu được số. Vui lòng thử lại.", 500);
    // Số thành cửa đăng nhập của tài khoản đang dùng (hỏng thì bỏ qua — vẫn đăng nhập được bằng email/Google).
    await admin.auth.admin.updateUserById(uid, { phone: so84g, phone_confirm: true }).then(() => {}, () => {});
    for (const id of ids) await admin.auth.admin.updateUserById(id, { ban_duration: "876000h", user_metadata: { gop_vao: uid } }).then(() => {}, () => {});
    await giuNgayThanhVienSomNhat(admin, uid, ids);
    await layBuTenAnh(admin, uid, ids); // tên + ảnh: giữ của tài khoản đang dùng, ô trống lấy bù từ tài khoản bị gộp
    return NextResponse.json({ ok: true, sdt, soTinGop });
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
