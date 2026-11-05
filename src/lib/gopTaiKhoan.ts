import { createClient as taoClient, type Session } from "@supabase/supabase-js";
import type { createAdminClient } from "@/lib/supabase/admin";
import { timTaiKhoan } from "@/lib/taiKhoanTheoSdt";

// ============================================================================
// GỘP TÀI KHOẢN — MỘT CHỖ (chủ dự án 05/11/2026: "gộp là trách nhiệm web làm", "mỗi lần gộp không bị lỗi nữa")
// ----------------------------------------------------------------------------
// Tài khoản bị gộp KHÔNG KHOÁ nữa: chỉ mang dấu app_metadata.gop_vao = tài khoản giữ lại. Khách vào bằng BẤT KỲ cửa nào
// của tài khoản cũ (Google, email + mật khẩu, số + mật khẩu, Zalo) → web tự mở phiên tài khoản giữ lại (useAuth gọi
// /api/xac-thuc/ve-tai-khoan-gop; Zalo đổi ngay ở máy chủ). Trước đây khoá (ban) → mọi cửa của tài khoản cũ báo lỗi.
// ⛔ Dấu nằm ở app_metadata (CHỈ máy chủ ghi được). KHÔNG dùng user_metadata: khách tự sửa được từ trình duyệt
// (supabase.auth.updateUser) → tự gắn "gộp vào <tài khoản người khác>" rồi Quên mật khẩu là chiếm tài khoản đó.
// Chi phí: chỉ chạy khi gộp / khi tài khoản mang dấu đăng nhập — vài lần mỗi tháng, không thêm cron, không xoá cache.
// ============================================================================

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

/** Tài khoản giữ lại cuối cùng (gộp nối nhau: A → B → C trả C). Không có dấu thì trả chính id. */
export async function taiKhoanGiu(admin: Admin, id: string): Promise<string> {
  let cur = id;
  for (let i = 0; i < 5; i++) {
    const { data } = await admin.auth.admin.getUserById(cur);
    const vao = (data?.user?.app_metadata as Record<string, unknown> | undefined)?.gop_vao;
    if (typeof vao !== "string" || !vao || vao === cur) return cur;
    cur = vao;
  }
  return cur;
}

/** Đánh dấu các tài khoản thừa đã gộp vào `vao` (không khoá; tài khoản đang khoá đời cũ được mở). */
export async function danhDauGop(admin: Admin, ids: string[], vao: string): Promise<void> {
  for (const id of ids) {
    if (id === vao) continue;
    await admin.auth.admin.updateUserById(id, { app_metadata: { gop_vao: vao }, ban_duration: "none" }).then(() => {}, () => {});
  }
}

/** TÀI KHOẢN BỊ KHOÁ ĐỜI CŨ (gộp trước 05/11/2026 khoá luôn, không ghi gộp vào đâu) — web TỰ SỬA khi khách đăng nhập:
 *  đủ điều kiện gộp (số đăng nhập của nó đã là số ĐÃ XÁC MINH của tài khoản khác, hoặc mã Zalo của nó đang gắn tài khoản khác)
 *  → đánh dấu gộp vào tài khoản đó, trả id tài khoản giữ lại; không đủ điều kiện → mở khoá, khách vào, xác minh số sẽ gộp
 *  theo quy trình (xac-minh-sdt). Không khoá thì không làm gì. Trả id tài khoản khách sẽ vào. */
export async function tuSuaTkKhoa(admin: Admin, id: string): Promise<string> {
  const giu = await taiKhoanGiu(admin, id);
  if (giu !== id) return giu;
  const { data } = await admin.auth.admin.getUserById(id);
  const u = data?.user;
  if (!u?.banned_until || new Date(u.banned_until).getTime() <= Date.now()) return id;
  // BỊ CẤM TỪ BẢN GỘP CŨ = ĐÃ ĐƯỢC GỘP (chủ dự án 06/11/2026: "tài khoản đã gộp thì phải có đủ"): tìm tài khoản chính theo
  // bằng chứng chắc — số đăng nhập của nó đã là số ĐÃ XÁC MINH của tài khoản khác, hoặc mã Zalo của nó đang gắn tài khoản khác
  // (không bao giờ là tài khoản quản trị) → đánh dấu gộp vào đó, khách vào thẳng tài khoản chính. Không tìm thấy → chỉ gỡ cấm,
  // khách vào bình thường; lần đầu đăng tin xác minh số thì web gộp theo quy trình.
  let dich: string | null = null;
  const sdt = u.phone ? `0${u.phone.replace(/^\+?84/, "")}` : null;
  if (sdt && /^0\d{9}$/.test(sdt)) {
    const t = await timTaiKhoan(admin, sdt, { boQuaAdmin: true });
    if (t && t !== "trung" && t.id !== id) dich = t.id;
  }
  const zid = /^zalo_(.+)@users\.coastalland\.vn$/.exec(u.email ?? "")?.[1];
  if (!dich && zid) {
    const { data: p } = await admin.from("profiles").select("id").eq("zalo_id", zid).neq("id", id).neq("role", "admin").limit(1).maybeSingle();
    if (p?.id) dich = p.id as string;
  }
  if (dich) {
    await danhDauGop(admin, [id], dich); // gỡ cấm + dấu gộp
    return taiKhoanGiu(admin, dich);
  }
  await admin.auth.admin.updateUserById(id, { ban_duration: "none" }).then(() => {}, () => {});
  return id;
}

/** Mở phiên đăng nhập cho một tài khoản (máy chủ). Chưa có email thì gắn email kỹ thuật `emailDuPhong`. */
export async function moPhienTaiKhoan(admin: Admin, id: string, emailDuPhong?: string): Promise<Session | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const { data: u } = await admin.auth.admin.getUserById(id);
  let email = u?.user?.email || null;
  if (!email) {
    if (!emailDuPhong) return null;
    const { error } = await admin.auth.admin.updateUserById(id, { email: emailDuPhong, email_confirm: true });
    if (error) return null;
    email = emailDuPhong;
  }
  const sb = taoClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hash = link?.properties?.hashed_token;
  if (!hash) return null;
  let phien = (await sb.auth.verifyOtp({ type: "email", token_hash: hash })).data.session;
  if (!phien) phien = (await sb.auth.verifyOtp({ type: "magiclink", token_hash: hash })).data.session;
  return phien;
}
