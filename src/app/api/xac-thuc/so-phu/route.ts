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
  // SỐ ĐANG Ở TÀI KHOẢN KHÁC → KHÔNG TỪ CHỐI (anh 26/11/2026: "khách muốn thêm số thì tài khoản phải ghi vào", "cấm hỏi và yêu cầu
  // lại"): nhận đúng mã tới số = chính chủ số → số ghi vào tài khoản đang dùng (số phụ ở tài khoản khác chuyển sang đây).
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
  const { data: dong, error } = soPhu
    ? await admin.from("sdt_nguoi_dung").update({ user_id: uid, da_xac_minh: true }).eq("sdt", sdt).select("id").single()
    : await admin.from("sdt_nguoi_dung").insert({ user_id: uid, sdt, da_xac_minh: true }).select("id").single();
  if (error) return loi("Chưa lưu được số. Vui lòng thử lại.", 500);
  return NextResponse.json({ ok: true, sdt, id: dong?.id }); // id thật → nút Bỏ xoá được ngay, không phải tải lại trang
}
