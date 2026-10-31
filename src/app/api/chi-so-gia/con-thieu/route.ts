import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { soNhapHopLe, type ChiSoGiaData } from "@/lib/chiSoGia";
import { dongConThieu, COT_MAU, type TinCan, type DongKho } from "@/lib/lichSuGiaConThieu";
import { noiDungCsv } from "@/lib/xuatCsv";

// ════════════════════════════════════════════════════════════════════════════
// COWORK TỰ LẤY DANH SÁCH LỊCH SỬ GIÁ CÒN THIẾU — không ai phải tải tay.
//   GET /api/chi-so-gia/con-thieu?ma=<MA_NOP_SO_LIEU>  → tệp CSV đúng khuôn mẫu
// Điền xong thì nộp thẳng lại qua /api/chi-so-gia/nop (cùng mã).
// ════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const maDung = process.env.MA_NOP_SO_LIEU;
  if (!maDung) return NextResponse.json({ ok: false, loi: "Chưa đặt MA_NOP_SO_LIEU trong Vercel." }, { status: 503 });
  if (new URL(req.url).searchParams.get("ma") !== maDung)
    return NextResponse.json({ ok: false, loi: "Mã không đúng." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, loi: "Máy chủ thiếu khoá." }, { status: 503 });

  const tin: TinCan[] = [];
  for (let tu = 0; ; tu += 1000) {
    const { data } = await admin.from("listings").select("province,ward,type,purpose,details").eq("status", "approved").range(tu, tu + 999);
    if (!data?.length) break;
    tin.push(...(data as TinCan[]));
    if (data.length < 1000) break;
  }
  const kho: DongKho[] = [];
  for (let tu = 0; ; tu += 1000) {
    const { data } = await admin.from("gia_khu_vuc_thang").select("thang,tinh,phuong,du_an,loai_hinh,muc_dich").range(tu, tu + 999);
    if (!data?.length) break;
    kho.push(...(data as DongKho[]));
    if (data.length < 1000) break;
  }
  const { data: nd } = await admin.from("site_content").select("data").eq("key", "chi_so_gia").limit(1);
  const items = soNhapHopLe((nd?.[0]?.data as ChiSoGiaData | undefined)?.items);

  const dong = dongConThieu(tin, kho, items);
  return new NextResponse(noiDungCsv([...COT_MAU], dong), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lich-su-gia-con-thieu.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
