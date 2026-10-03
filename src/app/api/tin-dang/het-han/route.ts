import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { quetTinHetHan } from "@/lib/hetHanTin";
import { baoLoi } from "@/lib/baoLoi";

// ════════════════════════════════════════════════════════════════════════════
// QUÉT TIN HẾT HẠN — MỖI PHÚT (vercel.json; 03/10/2026 chủ dự án: "đúng giờ đúng ngày là áp dụng")
// Trước đây chỉ quét kèm cron hoá đơn 2 lần/ngày → tin quá "Ngày hết hạn" vẫn hiện
// thêm tới ~12 tiếng. Nay mỗi giờ một lần: tin ngừng hiển thị chậm nhất 1 giờ sau mốc.
// Chạy lặp vô hại: tin đã hạ không khớp lại, tin đã nhắc có dấu trong details.
// Bảo mật: Vercel Cron tự gắn "Authorization: Bearer $CRON_SECRET".
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const khoaCron = process.env.CRON_SECRET;
  if (khoaCron && request.headers.get("authorization") !== `Bearer ${khoaCron}`) {
    return NextResponse.json({ ok: false, loi: "Không có quyền" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, loi: "Thiếu khoá máy chủ" }, { status: 500 });
  try {
    const kq = await quetTinHetHan(admin);
    // LÀM MỚI BẢN SAO DANH SÁCH TIN TỪ GỐC (03/10/2026): tin nào vừa đổi — DÙ ĐỔI TỪ ĐÂU
    // (nút trong web, trigger CSDL, sửa thẳng trong Supabase) — thì xoá bản lưu sẵn ngay.
    // trg_listings_updated_at luôn ghi updated_at nên đây là mốc tin cậy cho mọi đường đổi.
    const { count: vuaDoi } = await admin
      .from("listings")
      .select("id", { count: "exact", head: true })
      .gt("updated_at", new Date(Date.now() - 75_000).toISOString());
    if ((vuaDoi ?? 0) > 0) revalidateTag("listings", "max");
    return NextResponse.json({ ok: true, ...kq, lamMoi: vuaDoi ?? 0 });
  } catch (e) {
    await baoLoi({
      noi: "het-han-tin",
      mucDo: "nang",
      tomTat: "Quét tin hết hạn (mỗi giờ) bị lỗi",
      chiTiet: e instanceof Error ? e.message : String(e),
      hauQua: "Tin quá hạn vẫn hiển thị cho tới lần quét thành công kế tiếp.",
      canLam: "Xem log Vercel của /api/tin-dang/het-han.",
      khoa: `het-han-tin:${new Date().toISOString().slice(0, 13)}`,
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
