import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// TÊN + ẢNH ĐẠI DIỆN TÀI KHOẢN — MỘT HÀM CHO MỌI LỐI ĐĂNG NHẬP (chủ dự án chốt 26/10/2026).
//   1. Đăng nhập bằng Gmail · Zalo · Email → tên + ảnh MẶC ĐỊNH theo chính tài khoản đó
//      (Gmail: tên + ảnh Google · Zalo: tên + ảnh Zalo · Email: tên lúc đăng ký, không có ảnh).
//   2. Đăng nhập bằng số điện thoại → tên = số điện thoại, ảnh = ảnh mặc định (hình người xám).
//   CHUẨN: mặc định chỉ điền khi tài khoản CHƯA CÓ tên / ảnh. Đã có thì giữ nguyên — chỉ đổi khi khách bấm avatar
//   hoặc vào Cài đặt (cờ tu_dat). Tên tài khoản = tên hiện trên tin (khách gõ tên khác trong form thì tin hiện tên đó).
// Ghi CẢ hồ sơ (profiles — trang tài khoản, thẻ tin đọc) LẪN phiên (user_metadata — đầu trang đọc)
// → mọi chỗ hiện cùng một tên, một ảnh. Gọi TRƯỚC khi mở phiên, hoặc làm mới phiên sau khi gọi.
// Chạy 1 lần mỗi lần đăng nhập: 2 lệnh đọc + tối đa 2 lệnh ghi — không đáng kể với gói Supabase.
// ============================================================================

export type CachDangNhap = "google" | "zalo" | "email" | "sdt";

export async function datDaiDien(
  admin: SupabaseClient,
  uid: string,
  cach: CachDangNhap,
  nguon?: { ten?: string | null; anh?: string | null }, // Zalo: tên + ảnh Zalo · số điện thoại: số vừa đăng nhập
) {
  const { data } = await admin.auth.admin.getUserById(uid);
  const user = data?.user;
  if (!user) return;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { data: hs } = await admin.from("profiles").select("full_name,avatar_url,phone").eq("id", uid).maybeSingle();

  // Tên + ảnh MẶC ĐỊNH của cách vừa đăng nhập
  let tenMacDinh: string | null;
  let anhMacDinh: string | null = null;
  if (cach === "google") {
    const g = (user.identities ?? []).find((i) => i.provider === "google")?.identity_data ?? {};
    tenMacDinh = (g.full_name as string) || (g.name as string) || null;
    anhMacDinh = (g.avatar_url as string) || (g.picture as string) || null;
  } else if (cach === "zalo") {
    tenMacDinh = nguon?.ten?.trim() || null;
    anhMacDinh = nguon?.anh || null;
  } else if (cach === "email") {
    const e = (user.identities ?? []).find((i) => i.provider === "email")?.identity_data ?? {};
    tenMacDinh = (e.full_name as string) || user.email || null;
  } else {
    tenMacDinh = String(nguon?.ten || user.phone || meta.phone || hs?.phone || "").replace(/^\+?84/, "0") || null;
  }

  // CHUẨN: mặc định chỉ dùng khi tài khoản CHƯA CÓ. Tài khoản đã có tên / ảnh thì giữ nguyên — chỉ đổi trong Cài đặt.
  // Tên chỉ là số điện thoại (mặc định của đăng nhập bằng số) = chưa đặt tên, trừ khi khách tự đặt (cờ tu_dat).
  const tenCo = (hs?.full_name as string | null)?.trim() || "";
  const tenChuaDat = !tenCo || (!meta.tu_dat && /^[\d\s+.]+$/.test(tenCo));
  const ten = tenChuaDat ? tenMacDinh || tenCo || null : tenCo;
  const anh = (hs?.avatar_url as string | null) || (meta.avatar_url as string) || (meta.picture as string) || anhMacDinh;

  if (ten !== (hs?.full_name ?? null) || anh !== (hs?.avatar_url ?? null)) {
    await admin.from("profiles").update({ full_name: ten, avatar_url: anh }).eq("id", uid);
  }
  // picture cũng phải ghi: đầu trang đọc avatar_url rồi tới picture (Google tự ghi picture mỗi lần đăng nhập)
  if (ten !== (meta.full_name ?? null) || anh !== (meta.avatar_url ?? null) || (meta.picture ?? null) !== anh || meta.name) {
    await admin.auth.admin.updateUserById(uid, {
      user_metadata: { ...meta, full_name: ten, name: null, avatar_url: anh, picture: anh },
    });
  }
}
