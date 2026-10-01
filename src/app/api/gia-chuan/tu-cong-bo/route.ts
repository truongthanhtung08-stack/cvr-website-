import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { congBoTin, congBoHoiVien, docBillingLuu } from "@/lib/congBoGia";
import { baoLoi } from "@/lib/baoLoi";

// ════════════════════════════════════════════════════════════════════════════
// TỰ CÔNG BỐ LẠI GIÁ LÚC 0H GIỜ VN (vercel.json, chủ dự án chốt 01/10/2026)
// Chương trình khuyến mãi trong /admin/gia-chuan có ngày bắt đầu / kết thúc. Giá công
// bố tính % giảm TẠI LÚC công bố → không công bố lại thì hết khuyến mãi khách vẫn hưởng
// giá giảm (hoặc khuyến mãi tới ngày mà chưa áp). Mỗi ngày 0h tính lại từ bản nháp đã
// lưu, ĐÚNG hàm của nút Công bố. Chỉ công bố lại phần ĐANG được công bố (gỡ rồi thì thôi).
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const khoaCron = process.env.CRON_SECRET;
  if (khoaCron && request.headers.get("authorization") !== `Bearer ${khoaCron}`) {
    return NextResponse.json({ ok: false, loi: "Không có quyền" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, loi: "Thiếu khoá máy chủ" }, { status: 500 });

  const luu = await docBillingLuu(admin);
  const kq: Record<string, string> = {};
  if (luu.congBo) {
    const t = await congBoTin(admin);
    kq.tin = "loi" in t ? t.loi : "ok";
  }
  if (luu.hoiVien?.length) {
    const h = await congBoHoiVien(admin);
    kq.hoiVien = "loi" in h ? h.loi : "ok";
  }
  const hong = Object.entries(kq).filter(([, v]) => v !== "ok");
  if (hong.length) {
    await baoLoi({
      noi: "tu-cong-bo-gia",
      mucDo: "nang",
      tomTat: "Tự công bố lại giá lúc 0h bị lỗi",
      chiTiet: hong.map(([k, v]) => `${k}: ${v}`).join(" · "),
      hauQua: "Khuyến mãi có ngày bắt đầu / kết thúc có thể chưa áp đúng ngày.",
      canLam: "Vào /admin/gia-chuan bấm Công bố lại.",
      khoa: `tu-cong-bo-gia:${new Date().toISOString().slice(0, 10)}`,
    });
  }
  return NextResponse.json({ ok: hong.length === 0, ...kq });
}
