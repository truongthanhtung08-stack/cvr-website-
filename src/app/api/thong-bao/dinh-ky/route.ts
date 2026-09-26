import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiThongBao, MAU_BAO_CAO_TUAN, MAU_HOI_VIEN_SAP_HET } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";

// ============================================================================
// THÔNG BÁO ĐỊNH KỲ — cron 8h sáng giờ VN mỗi ngày (vercel.json: 0 1 * * * UTC)
// ----------------------------------------------------------------------------
// 1) GÓI HỘI VIÊN SẮP HẾT HẠN (mẫu ZBS 641605): gói có hạn rơi vào khoảng
//    [còn 2 ngày, còn 3 ngày) tính từ lúc chạy. Cron chạy MỖI NGÀY MỘT LẦN nên
//    khoảng 24 giờ đó bảo đảm mỗi gói được nhắc đúng một lần — không cần cột
//    đánh dấu, không cần migration.
// 2) BÁO CÁO TUẦN (mẫu ZBS 641604): chỉ sáng THỨ HAI (giờ VN), cho khách đang có
//    tin hiển thị. Số liệu lấy đúng bảng đo thật của 7 ngày trước — không làm
//    tròn lên, không bịa.
// Bảo mật: Vercel Cron tự gắn "Authorization: Bearer $CRON_SECRET".
// ============================================================================
export const dynamic = "force-dynamic";

type Nguoi = { id: string; email: string | null; phone: string | null; full_name: string | null; role: string | null };
const ngayVN = (d: Date) => d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

export async function GET(request: Request) {
  const khoaCron = process.env.CRON_SECRET;
  if (khoaCron && request.headers.get("authorization") !== `Bearer ${khoaCron}`) {
    return NextResponse.json({ ok: false, message: "Không có quyền" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Thiếu SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

  const layNguoi = async (ids: string[]) => {
    if (!ids.length) return new Map<string, Nguoi>();
    const { data } = await admin.from("profiles").select("id,email,phone,full_name,role").in("id", [...new Set(ids)]);
    return new Map(((data ?? []) as Nguoi[]).map((n) => [n.id, n]));
  };

  let hoiVien = 0;
  let baoCao = 0;

  // ── 1) Gói hội viên sắp hết hạn ─────────────────────────────────────────
  try {
    const bayGio = Date.now();
    const { data: goi } = await admin
      .from("hoi_vien")
      .select("id,user_id,ten_goi,het_han")
      .gte("het_han", new Date(bayGio + 2 * 86_400_000).toISOString())
      .lt("het_han", new Date(bayGio + 3 * 86_400_000).toISOString());
    const ds = (goi ?? []) as { id: number; user_id: string; ten_goi: string; het_han: string }[];
    const nguoi = await layNguoi(ds.map((g) => g.user_id));
    for (const g of ds) {
      const { data: vc } = await admin
        .from("hoi_vien_voucher")
        .select("con_lai")
        .eq("hoi_vien_id", g.id)
        .gt("den", new Date().toISOString());
      const soVoucher = ((vc ?? []) as { con_lai: number }[]).reduce((s, v) => s + v.con_lai, 0);
      const n = nguoi.get(g.user_id);
      const soNgay = Math.ceil((new Date(g.het_han).getTime() - bayGio) / 86_400_000);
      await guiThongBao({
        email: n?.email,
        phone: n?.phone,
        tieuDe: "Gói hội viên của bạn sắp hết hạn",
        loiNhan: `Gói hội viên của bạn còn ${soNgay} ngày nữa là hết hạn. Các voucher chưa sử dụng sẽ hết hiệu lực cùng thời điểm này. Xem tại coastalland.vn/tai-khoan/hoi-vien.`,
        cacDong: [
          { nhan: "Gói hội viên", giaTri: g.ten_goi },
          { nhan: "Hết hạn", giaTri: ngayVN(new Date(g.het_han)) },
          { nhan: "Voucher còn lại", giaTri: String(soVoucher) },
        ],
        znsTemplateId: MAU_HOI_VIEN_SAP_HET,
        znsData: {
          ten_khach_hang: n?.full_name || "Quý khách",
          so_ngay: String(soNgay),
          ngay_het_han: ngayVN(new Date(g.het_han)),
          ten_goi: g.ten_goi,
          so_voucher: String(soVoucher),
        },
      });
      hoiVien++;
    }
  } catch (e) {
    await baoLoi({ noi: "thong-bao-dinh-ky", mucDo: "nhe", tomTat: "Nhắc gói hội viên sắp hết hạn bị lỗi", chiTiet: String(e) });
  }

  // ── 2) Báo cáo tuần — chỉ sáng Thứ Hai giờ VN ──────────────────────────
  const homNayVN = new Date(Date.now() + 7 * 3_600_000);
  if (homNayVN.getUTCDay() === 1) {
    try {
      const den = new Date(Date.UTC(homNayVN.getUTCFullYear(), homNayVN.getUTCMonth(), homNayVN.getUTCDate())); // 0h hôm nay (lịch VN)
      const tu = new Date(den.getTime() - 7 * 86_400_000);
      const ngayChu = (d: Date) => d.toISOString().slice(0, 10);

      const { data: tin } = await admin.from("listings").select("id,owner_id").eq("status", "approved").not("owner_id", "is", null);
      const theoChu = new Map<string, string[]>();
      for (const t of (tin ?? []) as { id: string; owner_id: string }[]) theoChu.set(t.owner_id, [...(theoChu.get(t.owner_id) ?? []), t.id]);
      const nguoi = await layNguoi([...theoChu.keys()]);

      const tong = async (bang: string, ids: string[]) => {
        const { data } = await admin.from(bang).select("luot").in("listing_id", ids).gte("ngay", ngayChu(tu)).lt("ngay", ngayChu(den));
        return ((data ?? []) as { luot: number }[]).reduce((s, r) => s + r.luot, 0);
      };

      for (const [chu, ids] of theoChu) {
        const n = nguoi.get(chu);
        if (!n || n.role === "admin") continue; // tin admin tự nhập không phải khách
        const [hienThi, xem] = await Promise.all([tong("listing_impression_daily", ids), tong("listing_view_daily", ids)]);
        const { count: xemSo } = await admin
          .from("listing_leads")
          .select("id", { count: "exact", head: true })
          .in("listing_id", ids)
          .gte("created_at", new Date(tu.getTime() - 7 * 3_600_000).toISOString())
          .lt("created_at", new Date(den.getTime() - 7 * 3_600_000).toISOString());
        const tuChu = ngayVN(new Date(tu.getTime() - 7 * 3_600_000 + 12 * 3_600_000));
        const denChu = ngayVN(new Date(den.getTime() - 7 * 3_600_000 - 12 * 3_600_000));
        await guiThongBao({
          email: n.email,
          phone: n.phone,
          tieuDe: "Báo cáo tin đăng tuần qua",
          loiNhan: `Kết quả tin đăng của bạn trên Coastal Land từ ${tuChu} đến ${denChu}. Xem chi tiết tại coastalland.vn/tai-khoan/tuong-tac.`,
          cacDong: [
            { nhan: "Tin đang hiển thị", giaTri: String(ids.length) },
            { nhan: "Lượt hiển thị", giaTri: hienThi.toLocaleString("vi-VN") },
            { nhan: "Lượt xem tin", giaTri: xem.toLocaleString("vi-VN") },
            { nhan: "Lượt xem số điện thoại", giaTri: String(xemSo ?? 0) },
          ],
          znsTemplateId: MAU_BAO_CAO_TUAN,
          znsData: {
            ten_khach_hang: n.full_name || "Quý khách",
            tu_ngay: tuChu,
            den_ngay: denChu,
            so_tin: String(ids.length),
            luot_hien_thi: hienThi.toLocaleString("vi-VN"),
            luot_xem: xem.toLocaleString("vi-VN"),
            luot_xem_so: String(xemSo ?? 0),
          },
        });
        baoCao++;
      }
    } catch (e) {
      await baoLoi({ noi: "thong-bao-dinh-ky", mucDo: "nhe", tomTat: "Gửi báo cáo tuần bị lỗi", chiTiet: String(e) });
    }
  }

  return NextResponse.json({ ok: true, hoiVien, baoCao });
}
