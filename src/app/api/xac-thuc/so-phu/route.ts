import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { phatMa, kiemMa, guiMaQuaZalo } from "@/lib/maXacThuc";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// THÊM SỐ ĐIỆN THOẠI KHÁC — MỘT ĐƯỜNG DUY NHẤT (chủ dự án 05/11/2026: "khách có nhiều số, muốn thêm số chỉ một con đường — dẫn
// khách vào Cài đặt và xác thực"): Tài khoản → Cài đặt → Số điện thoại khác → mã Zalo tới đúng số đó → đúng mã mới thêm, ĐÃ XÁC MINH.
// Trước đây thêm số không cần mã, nằm "chờ xác minh" chờ Coastal Land duyệt.
//   gui-ma   { sdt }       → gửi mã 6 số qua Zalo của số đó
//   xac-nhan { sdt, ma }   → lưu vào sdt_nguoi_dung, da_xac_minh = true
// Số đang ở tài khoản khác: nhận đúng mã là ghi vào tài khoản đang dùng (26/11/2026).
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loi = (thongBao: string, status = 400) => NextResponse.json({ ok: false, loi: thongBao }, { status });

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createAdminClient();
  if (!admin || !token) return loi("Vui lòng đăng nhập lại.", 401);
  const { data: u } = await admin.auth.getUser(token);
  const uid = u?.user?.id;
  if (!uid) return loi("Vui lòng đăng nhập lại.", 401);

  const b = (await req.json().catch(() => ({}))) as { buoc?: string; sdt?: string; ma?: string };
  const sdt = chuanHoaSdt(b.sdt ?? "");
  if (!laSdtVN(sdt)) return loi("Số điện thoại chưa đúng (VD: 0905123456).");

  // Số chính của chính tài khoản → không thêm lại
  const { data: hs } = await admin.from("profiles").select("phone").eq("id", uid).maybeSingle();
  if (chuanHoaSdt(hs?.phone ?? "") === sdt) return loi("Đây là số chính của tài khoản.");
  // SỐ ĐANG Ở TÀI KHOẢN KHÁC → KHÔNG TỪ CHỐI, KHÔNG ĐỤNG TÀI KHOẢN KIA (anh 26/11/2026: "một khách có thể có 2, 3, 4 tài khoản",
  // "không gộp vì liên quan đến tiền", "xác thực số ở tài khoản nào thì số đi với tài khoản đó"): bảng sdt_nguoi_dung khoá mỗi số một
  // dòng → số đang là số phụ của tài khoản khác thì ghi vào hồ sơ tài khoản đang dùng (user_metadata.so_them).
  const { data: soPhu } = await admin.from("sdt_nguoi_dung").select("user_id").eq("sdt", sdt).maybeSingle();

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
  if (soPhu && soPhu.user_id !== uid) {
    const meta = (u.user?.user_metadata ?? {}) as Record<string, unknown>;
    const soThem = [...new Set([...(Array.isArray(meta.so_them) ? (meta.so_them as string[]) : []), sdt])];
    const { error: e2 } = await admin.auth.admin.updateUserById(uid, { user_metadata: { ...meta, so_them: soThem } });
    if (e2) return loi("Chưa lưu được số. Vui lòng thử lại.", 500);
    return NextResponse.json({ ok: true, sdt, id: `meta:${sdt}` });
  }
  const { data: dong, error } = soPhu
    ? await admin.from("sdt_nguoi_dung").update({ da_xac_minh: true }).eq("sdt", sdt).eq("user_id", uid).select("id").single()
    : await admin.from("sdt_nguoi_dung").insert({ user_id: uid, sdt, da_xac_minh: true }).select("id").single();
  if (error) return loi("Chưa lưu được số. Vui lòng thử lại.", 500);
  return NextResponse.json({ ok: true, sdt, id: dong?.id }); // id thật → nút Bỏ xoá được ngay, không phải tải lại trang
}
