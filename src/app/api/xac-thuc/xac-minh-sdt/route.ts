import { NextResponse } from "next/server";
import { createClient as taoClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { phatMa, kiemMa, guiMaQuaZalo } from "@/lib/maXacThuc";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { timTaiKhoan } from "@/lib/taiKhoanTheoSdt";
import { danhDauGop } from "@/lib/gopTaiKhoan";
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
// tin đăng mang số đó. Khách không phải liên hệ, không phải làm gì.
// ⛔ KHÔNG GỬI EMAIL BÁO CHỦ DỰ ÁN (chủ dự án 06/11/2026: "CẤM gửi cho tôi lúc khách đăng tin") — CHỈ HIỆN TRONG ADMIN
// ("trang admin cần phải có thông báo … những gì khách cần"): baoLoi KHÔNG cờ khach = ghi sổ su_co, hiện Admin → Tổng quan, không email.
async function choAdminGop(admin: NonNullable<ReturnType<typeof createAdminClient>>, uid: string, sdt: string, ids: string[]) {
  await admin.from("profiles").update({ sdt_lien_he_xac_minh: true }).eq("id", uid);
  // Nhớ số trên tài khoản đang dùng (user_metadata.sdt_lien_he) → đăng tin / nạp tiền lần sau không hỏi lại, tin mang số này
  const { data: uu } = await admin.auth.admin.getUserById(uid);
  await admin.auth.admin.updateUserById(uid, { user_metadata: { ...(uu?.user?.user_metadata ?? {}), sdt_lien_he: sdt } }).then(() => {}, () => {});
  await baoLoi({
    noi: "gop-tai-khoan",
    mucDo: "nhe",
    tomTat: "Khách có tài khoản khác cùng số điện thoại — chưa gộp",
    chiTiet: `Số ${sdt} (khách đã xác minh) · tài khoản đang dùng ${uid} · tài khoản khác cùng số ${ids.join(", ")}`,
    hauQua: "Khách vẫn đăng tin, nạp tiền bình thường bằng tài khoản đang dùng; tin, tiền, gói ở tài khoản kia giữ nguyên.",
    canLam: "Anh quyết: gộp thì vào Admin → Khách hàng, đối chiếu ví, gói, voucher; không gộp thì để nguyên.",
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
  // MỘT QUY TẮC (chủ dự án 06/11/2026: "khách làm cái đó qua Cài đặt thì lấy cái đó"; còn lại lấy của TÀI KHOẢN TẠO ĐẦU TIÊN):
  // xếp các tài khoản: khách TỰ ĐẶT trong Cài đặt (tu_dat) trước — tài khoản giữ lại trước nếu nhiều cái tự đặt — rồi theo ngày
  // tạo tài khoản sớm nhất. Tên = tên đầu tiên theo thứ tự đó (bỏ tên chỉ là số điện thoại, trừ khi khách tự đặt); ảnh = ảnh
  // đầu tiên theo thứ tự đó. Không phụ thuộc khách đăng nhập bằng gì, vào trước hay vào sau.
  const { data: ds } = await admin.from("profiles").select("id,full_name,avatar_url").in("id", [giu, ...tu]);
  const hsGiu = (ds ?? []).find((p) => p.id === giu);
  // Tự đặt TÊN và tự đặt ẢNH là hai dấu riêng (tu_dat_ten · tu_dat_anh — Cài đặt / DoiAnhDaiDien, 06/11/2026). Tài khoản đời
  // cũ chỉ có dấu chung tu_dat (không biết khách đổi cái nào) → coi như tự đặt cả hai.
  const nguoi = await Promise.all((ds ?? []).map(async (p) => {
    const { data: x } = await admin.auth.admin.getUserById(p.id as string);
    const m = (x?.user?.user_metadata ?? {}) as Record<string, unknown>;
    const cu = !!m.tu_dat && !m.tu_dat_ten && !m.tu_dat_anh;
    return { p, tuDatTen: !!m.tu_dat_ten || cu, tuDatAnh: !!m.tu_dat_anh || cu, tao: new Date(x?.user?.created_at ?? Date.now()).getTime() };
  }));
  const xep = (dau: "tuDatTen" | "tuDatAnh") => [...nguoi].sort((a, b) => Number(b[dau]) - Number(a[dau])
    || (a[dau] && b[dau] ? Number(b.p.id === giu) - Number(a.p.id === giu) : 0) || a.tao - b.tao);
  const { data: uGiu } = await admin.auth.admin.getUserById(giu);
  const meta = (uGiu?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const laSo = (t: string) => /^[\d\s+.]+$/.test(t);
  const ten = xep("tuDatTen").map((n) => ({ t: String(n.p.full_name ?? "").trim(), tuDat: n.tuDatTen })).find((x) => x.t && (x.tuDat || !laSo(x.t)))?.t
    || String(hsGiu?.full_name ?? "").trim() || null;
  // Ảnh = ảnh khách tự đặt; không có thì ảnh của tài khoản CÓ ẢNH tạo sớm nhất (Zalo / Google — cái nào có trước), giữ tới khi
  // khách tự đổi ảnh (chủ dự án 06/11/2026: "tuỳ cái nào có trước, lấy cái đó cho đến khi khách tự thay đổi ảnh đại diện")
  const anh = xep("tuDatAnh").map((n) => n.p.avatar_url as string | null).find(Boolean) || null;
  if (ten === (hsGiu?.full_name ?? null) && anh === (hsGiu?.avatar_url ?? null)) return;
  await admin.from("profiles").update({ full_name: ten, avatar_url: anh }).eq("id", giu);
  await admin.auth.admin.updateUserById(giu, { user_metadata: { ...meta, full_name: ten, avatar_url: anh, picture: anh } }).then(() => {}, () => {});
}

// ZALO MINI APP gọi thẳng đường này (xác minh số khi đăng tin, 06/11/2026) → mở CORS cho đúng tên miền của Zalo + máy thử;
// trang web cùng tên miền không cần. Chỉ thêm tiêu đề, không đổi xử lý.
function choPhep(req: Request): Record<string, string> {
  const nguon = req.headers.get("origin") ?? "";
  const hopLe = /^https:\/\/([a-z0-9-]+\.)*(zdn\.vn|zalo\.me|zaloapp\.com|zaloplatforms\.com)$/i.test(nguon) || /^http:\/\/(localhost|192\.168\.\d+\.\d+):\d+$/.test(nguon);
  return hopLe
    ? { "Access-Control-Allow-Origin": nguon, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", Vary: "Origin" }
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

// SỐ ĐIỆN THOẠI ZALO (Zalo Mini App getPhoneNumber — docs.zaloplatforms.com/docs/MA/api/user/user-information/getPhoneNumber):
// Mini App gửi token số (dùng 1 lần, hết hạn 2 phút) + access token người dùng; máy chủ đổi ra số qua graph.zalo.me/v2.0/me/info bằng
// khoá bí mật Zalo App. Số này là số của chính tài khoản Zalo đang dùng, khách vừa bấm đồng ý chia sẻ → coi như ĐÃ XÁC MINH (như nhập
// đúng mã gửi tới chính số đó), đi tiếp đúng đường "xac-nhan" bên dưới (gộp tài khoản, đánh dấu đã xác minh…).
async function soTuZalo(accessToken?: string, code?: string): Promise<string | null> {
  const secret = process.env.ZALO_APP_SECRET;
  if (!accessToken || !code || !secret) return null;
  try {
    const r = await fetch("https://graph.zalo.me/v2.0/me/info", { headers: { access_token: accessToken, code, secret_key: secret } });
    const j = (await r.json()) as { error?: number; data?: { number?: string } };
    const so = j.error === 0 ? j.data?.number : undefined;
    return so ? so.replace(/\D/g, "").replace(/^84/, "0") : null;
  } catch {
    return null;
  }
}

async function xuLy(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const b = (await req.json().catch(() => ({}))) as { buoc?: string; sdt?: string; ma?: string; dangTin?: boolean; zaloAccessToken?: string; tokenSo?: string };
  const soZalo = b.buoc === "so-zalo";
  if (soZalo) {
    const so = await soTuZalo(b.zaloAccessToken, b.tokenSo);
    if (!so) return loi("Chưa lấy được số từ Zalo. Vui lòng thử lại.");
    b.sdt = so;
  }
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
  // SỐ ĐANG GẮN NHIỀU TÀI KHOẢN: khách vừa nhận đúng mã ở số này = chính chủ → web gộp HẾT các tài khoản đó về tài khoản đang
  // dùng (khối gộp bên dưới). Trước đây chặn, bắt khách liên hệ — chủ dự án 06/11/2026: "CẤM tuyệt đối hỏi hay yêu cầu khách gộp".
  const trung = tim === "trung";
  const idCu = tim && tim !== "trung" && tim.id !== uid ? tim.id : null;
  const laTkZalo = /^zalo_.+@users\.coastalland\.vn$/.test(u.user?.email ?? "");

  // ⛔ 06/11/2026: trước đây mã xác minh số gửi CẢ email (05/11) — mã email không chứng minh số: ai cũng gõ số người khác, nhận
  // mã ở email của mình là chiếm được tài khoản của chủ số (lỗ hổng). Nay chỉ gửi tới chính số đó.
  if (b.buoc === "gui-ma") {
    // XÁC MINH SỐ = MÃ TỚI CHÍNH SỐ ĐÓ (chủ dự án 06/11/2026: "khách chưa gõ số thì khi đăng tin BUỘC phải xác minh số"): chỉ
    // gửi qua Zalo của số đó (sau này thêm SMS cho số không có Zalo). KHÔNG gửi qua email — mã email không chứng minh số.
    const phat = await phatMa(sdt, "zalo", "xac-minh-sdt");
    if (!phat.ok) return loi(phat.loi, 429);
    const gui = await guiMaQuaZalo(sdt, phat.ma);
    if (!gui.ok) return loi("Chưa gửi được mã qua Zalo tới số này. Vui lòng thử lại sau ít phút.", 503);
    return NextResponse.json({ ok: true, quaZalo: true, quaEmail: null });
  }

  if (b.buoc !== "xac-nhan" && !soZalo) return loi("Bước không hợp lệ.");
  if (!soZalo) {
    const kiem = await kiemMa(sdt, "xac-minh-sdt", b.ma ?? "");
    if (!kiem.ok) return loi(kiem.loi);
  }

  let soTinGop = 0;

  // ⛔ CHỦ DỰ ÁN CHỐT ĐIỀU KIỆN GỘP (06/11/2026): "tất cả TK trên web để nguyên. Chỉ gộp cho những trường hợp: KHÁCH ĐANG ĐĂNG NHẬP
  // VÀO BẰNG CHÍNH HỌ và có đủ điều kiện là xác minh số điện thoại và đã đăng tin" · "gộp phải CHUẨN: tên TK, ảnh đại diện, số điện
  // thoại, email, tin đăng của khách" · KHÔNG hỏi / yêu cầu khách gì · không khoá đăng nhập ở bất kỳ trường hợp nào.
  //   Đang đăng nhập bằng chính họ = phiên của khách (token) gọi đường này · xác minh số = mã vừa đúng · đã đăng tin = xác minh ngay
  //   trong lúc đăng tin (dangTin, form đăng tin) hoặc tài khoản đã có tin. Thiếu điều kiện / dính tiền → không gộp (choAdminGop:
  //   khách vẫn đăng tin, nạp tiền bình thường bằng tài khoản đang dùng; email báo chủ dự án). Tắt hẳn tự gộp → đặt cờ này false.
  const WEB_TU_GOP = true;
  // CHỈ GỘP TRONG LÚC ĐĂNG TIN (06/11/2026: "mọi thứ khác khách tự thay đổi trong Cài đặt, kể cả thêm số thì cứ thêm") — Cài đặt / nạp tiền không gộp
  const duDieuKienGop = WEB_TU_GOP && b.dangTin === true;

  // TÀI KHOẢN SINH RA TỪ ZALO (email kỹ thuật zalo_…) mà số này đã có tài khoản cũ → gộp
  // NGƯỢC: tài khoản Zalo nhập vào tài khoản cũ, Zalo gắn sang tài khoản cũ (0049), mở
  // phiên tài khoản cũ. Không cửa đăng nhập nào bị mất (Gmail/số + mật khẩu của tài khoản
  // cũ vẫn vào được; bấm Zalo lần sau tìm theo zalo_id → ra tài khoản cũ).
  if (idCu && laTkZalo) {
    if (!duDieuKienGop) return await choAdminGop(admin, uid, sdt, [idCu]);
    const [{ data: hsMoi }, { data: hvMoi }] = await Promise.all([
      admin.from("profiles").select("balance,zalo_id").eq("id", uid).maybeSingle(),
      admin.from("hoi_vien").select("user_id").eq("user_id", uid).gt("het_han", new Date().toISOString()).limit(1),
    ]);
    if (Number(hsMoi?.balance ?? 0) > 0 || (hvMoi ?? []).length || (await dinhTien(admin, [uid])))
      return await choAdminGop(admin, uid, sdt, [idCu]);
    const { data: hsCu } = await admin.from("profiles").select("zalo_id").eq("id", idCu).maybeSingle();
    const zaloId = hsMoi?.zalo_id ?? u.user!.email!.replace(/^zalo_|@users\.coastalland\.vn$/g, "");
    // Tài khoản cũ ĐÃ CÓ một mã Zalo khác (Zalo cấp mã riêng cho mỗi ứng dụng — cùng một người vẫn có 2 mã): số đã xác minh =
    // đủ điều kiện → VẪN GỘP (trước đây từ chối, bắt khách liên hệ — chủ dự án 06/11/2026: "đã xác minh thì gộp", "cấm hỏi khách
    // chuyện gộp"). Tài khoản cũ giữ Zalo của nó; mã Zalo này ở lại tài khoản bị gộp → bấm Zalo vẫn vào, tự về tài khoản cũ (gop_vao).
    const chuyenZalo = !hsCu?.zalo_id || hsCu.zalo_id === zaloId;

    const { data: chuyen } = await admin.from("listings").update({ owner_id: idCu }).eq("owner_id", uid).select("id");
    soTinGop = (chuyen ?? []).length;
    // Nhả zalo_id ở tài khoản Zalo trước (cột duy nhất) rồi gắn sang tài khoản cũ.
    if (chuyenZalo) await admin.from("profiles").update({ zalo_id: null }).eq("id", uid);
    await admin.from("profiles").update({ ...(chuyenZalo ? { zalo_id: zaloId } : {}), phone: sdt, phone_verified: true }).eq("id", idCu);
    // Tài khoản bị gộp KHÔNG KHOÁ — mang dấu gộp vào idCu (lib/gopTaiKhoan): mọi cửa đăng nhập cũ tự về tài khoản giữ lại
    await danhDauGop(admin, [uid], idCu);

    await giuNgayThanhVienSomNhat(admin, idCu, [uid]);
    await layBuTenAnh(admin, idCu, [uid]); // tên + ảnh: giữ của tài khoản cũ, ô trống lấy bù từ Zalo
    // Mở phiên cho tài khoản cũ (chưa có email thì gắn email kỹ thuật theo số).
    const { data: uCu } = await admin.auth.admin.getUserById(idCu);
    let emailCu = uCu?.user?.email ?? null;
    if (!emailCu) {
      emailCu = `sdt_${sdt}@users.coastalland.vn`;
      const { error } = await admin.auth.admin.updateUserById(idCu, { email: emailCu, email_confirm: true });
      if (error) return loi("Chưa mở được phiên đăng nhập. Vui lòng đăng nhập lại.", 500);
    }
    const sbMo = taoClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: emailCu });
    const hash = link?.properties?.hashed_token;
    let phien = hash ? (await sbMo.auth.verifyOtp({ type: "email", token_hash: hash })).data.session : null;
    if (!phien && hash) phien = (await sbMo.auth.verifyOtp({ type: "magiclink", token_hash: hash })).data.session;
    if (!phien) return loi("Chưa mở được phiên đăng nhập. Vui lòng đăng nhập lại.", 500);

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
  const { data: cungSo } = await admin.from("profiles").select("id,email,role,balance,zalo_id,phone_verified")
    .or(`phone.eq.${sdt},phone.eq.${so84g},phone.eq.+${so84g}`).neq("id", uid);
  const gopTu = (cungSo ?? []).filter((p) => p.role !== "admin"
    && (p.id === idCu || (trung && p.phone_verified) || /^zalo_.+@users\.coastalland\.vn$/.test(String(p.email ?? ""))));
  if (idCu && !gopTu.some((p) => p.id === idCu)) {
    const { data: pCu } = await admin.from("profiles").select("id,email,role,balance,zalo_id,phone_verified").eq("id", idCu).maybeSingle();
    if (pCu) gopTu.push(pCu);
  }
  if (gopTu.length) {
    const ids = gopTu.map((p) => p.id as string);
    if (!duDieuKienGop) return await choAdminGop(admin, uid, sdt, ids);
    const { data: hv } = await admin.from("hoi_vien").select("user_id").in("user_id", ids).gt("het_han", new Date().toISOString()).limit(1);
    if (gopTu.some((p) => Number(p.balance ?? 0) > 0) || (hv ?? []).length || (await dinhTien(admin, ids)))
      return await choAdminGop(admin, uid, sdt, ids);

    const { data: chuyen } = await admin.from("listings").update({ owner_id: uid }).in("owner_id", ids).select("id");
    soTinGop = (chuyen ?? []).length;
    // Zalo đăng nhập web: ưu tiên mã Zalo của tài khoản sinh từ Zalo (đúng cửa "Tiếp tục với Zalo"), không có thì lấy mã đã gắn.
    // Tài khoản đang dùng ĐÃ CÓ Zalo riêng → giữ nguyên, không ghi đè (ghi đè làm mã Zalo cũ mất cửa vào → bấm Zalo đẻ tài
    // khoản trùng). Mã Zalo nào không chuyển thì ở lại tài khoản bị gộp: bấm Zalo vẫn tìm ra theo zalo_id → tự về tài khoản này.
    const { data: hsDang } = await admin.from("profiles").select("zalo_id").eq("id", uid).maybeSingle();
    const zaloGiu = hsDang?.zalo_id ? null
      : (gopTu.find((p) => /^zalo_/.test(String(p.email ?? "")) && p.zalo_id) ?? gopTu.find((p) => p.zalo_id))?.zalo_id ?? null;
    // Nhả số ở các tài khoản thừa (và đúng mã Zalo sẽ chuyển) trước (cột duy nhất), rồi gắn sang tài khoản đang dùng.
    await admin.from("profiles").update({ phone: null, phone_verified: false }).in("id", ids);
    if (zaloGiu) await admin.from("profiles").update({ zalo_id: null }).in("id", ids).eq("zalo_id", zaloGiu);
    await admin.from("sdt_nguoi_dung").update({ user_id: uid }).in("user_id", ids).eq("sdt", sdt).then(() => {}, () => {});
    for (const id of ids) await admin.auth.admin.updateUserById(id, { phone: "" }).then(() => {}, () => {});
    const { error } = await admin.from("profiles")
      .update({ phone: sdt, phone_verified: true, ...(zaloGiu ? { zalo_id: zaloGiu } : {}) }).eq("id", uid);
    if (error) return loi("Chưa lưu được số. Vui lòng thử lại.", 500);
    // Số thành cửa đăng nhập của tài khoản đang dùng (hỏng thì bỏ qua — vẫn đăng nhập được bằng email/Google).
    await admin.auth.admin.updateUserById(uid, { phone: so84g, phone_confirm: true }).then(() => {}, () => {});
    await danhDauGop(admin, ids, uid); // không khoá — mang dấu gộp, mọi cửa đăng nhập cũ tự về tài khoản này (lib/gopTaiKhoan)
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
