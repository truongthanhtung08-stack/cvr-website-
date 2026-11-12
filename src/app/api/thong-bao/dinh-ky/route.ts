import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiThongBao, MAU_BAO_CAO_TUAN, MAU_HOI_VIEN_SAP_HET, MAU_UU_DAI_THANH_VIEN_MOI, MAU_TIM_KIEM_MOI, MAU_TIN_NHAP } from "@/lib/thongBao";
import { docBillingLuu, homNayVn } from "@/lib/congBoGia";
import { freeDangChay, ngayVn } from "@/lib/billing";
import { baoLoi } from "@/lib/baoLoi";
import { SU_CO } from "@/lib/chuThongBao";
import { chuanHoaSdt } from "@/lib/phone";
import { getListings } from "@/lib/listingsDb";
import { filtersFromParams } from "@/lib/filters";
import { smartFilter, smartSearch } from "@/lib/smartSearch";
import { getTier } from "@/lib/packages";

// ============================================================================
// THÔNG BÁO ĐỊNH KỲ — cron 8h sáng giờ VN mỗi ngày (vercel.json: 0 1 * * * UTC)
// ----------------------------------------------------------------------------
// 1) GÓI HỘI VIÊN SẮP HẾT HẠN (mẫu ZBS 641605): gói có hạn rơi vào khoảng
//    [còn 2 ngày, còn 3 ngày) tính từ lúc chạy. Cron chạy MỖI NGÀY MỘT LẦN nên
//    khoảng 24 giờ đó bảo đảm mỗi gói được nhắc đúng một lần — không cần cột
//    đánh dấu, không cần migration.
// 2) TÓM TẮT TƯƠNG TÁC (mẫu ZBS 641604): MỖI TIN MỘT LẦN, một ngày trước tin "sắp hết hạn"
//    (thay báo cáo tuần — anh 12/11/2026). Số cộng dồn từ khi tin lên web, đúng bảng đo thật.
// 3) ƯU ĐÃI THÀNH VIÊN MỚI (mẫu ZBS 644528, tag 3 Hậu mãi — chủ dự án duyệt 02/10/2026):
//    người mở tài khoản trong 24 giờ trước lúc chạy → mỗi người đúng MỘT tin. Chỉ gửi khi
//    chương trình "free" trong admin Giá & quy định đang chạy, đúng diện thành viên mới,
//    gói CVR Basic — tin nhắn không bao giờ hứa điều web không áp dụng. Hạn ưu đãi của
//    từng người = ngày thành viên + free.days (kể cả sau ngày kết thúc chương trình — luật 03/10).
//    Cron 8h sáng nằm trong khung 7h–22h Zalo cho phép tag 3 (từ 15/10/2026).
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
  let uuDai = 0;
  let timKiem = 0;
  let nhap = 0;

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
          // Zalo 28/09/2026: bắt cặp TÊN + SỐ ĐIỆN THOẠI (CT_13); nhắc voucher là hậu mãi,
          // không được ở tag chăm sóc khách hàng (CT_32) → mẫu Zalo bỏ voucher, email vẫn giữ.
          ten_khach_hang: n?.full_name || "Quý khách",
          so_dien_thoai: chuanHoaSdt(n?.phone ?? ""),
          so_ngay: String(soNgay),
          ngay_het_han: ngayVN(new Date(g.het_han)),
          ten_goi: g.ten_goi,
        },
      });
      hoiVien++;
    }
  } catch (e) {
    await baoLoi({ noi: "thong-bao-dinh-ky", mucDo: "nhe", tomTat: SU_CO.dinhKy.hoiVienSapHet, chiTiet: String(e) });
  }

  // ── 3) Ưu đãi thành viên mới ───────────────────────────────────────────
  try {
    const free = (await docBillingLuu(admin)).free;
    if (free && freeDangChay(free, homNayVn()) && free.audience === "new" && free.tierId === "basic") {
      const bayGio = Date.now();
      const { data: moi } = await admin
        .from("profiles")
        // Thành viên mới tính từ NGÀY THÀNH VIÊN (0058): tự đăng ký = ngày tạo tài khoản;
        // tài khoản tạo hộ = lần đầu chính chủ vào — cùng mốc với huongKhuyenMai / so_ngay_hien_thi.
        .select("id,email,phone,full_name,role,created_at:ngay_thanh_vien")
        .gte("ngay_thanh_vien", new Date(bayGio - 86_400_000).toISOString())
        .lt("ngay_thanh_vien", new Date(bayGio).toISOString())
        // Tài khoản TẠO HỘ chưa được chính chủ vào → chưa là thành viên, chưa nhắn (nhắn lúc họ vào lần đầu).
        .or("tao_ho.eq.false,vao_chinh_thuc_luc.not.is.null");
      for (const n of (moi ?? []) as (Nguoi & { created_at: string })[]) {
        if (n.role === "admin") continue;
        const hetUuDai = new Date(new Date(n.created_at).getTime() + free.days * 86_400_000 + 7 * 3_600_000).toISOString().slice(0, 10);
        // Hạn = ngày thành viên + free.days — KỂ CẢ sau ngày kết thúc chương trình (luật chốt 03/10/2026,
        // huongKhuyenMai): vào trong thời gian chương trình là được đủ số ngày.
        const han = ngayVn(hetUuDai);
        await guiThongBao({
          email: n.email,
          phone: n.phone,
          tieuDe: "Đăng tin miễn phí cho thành viên mới",
          loiNhan: "Coastal Land là cổng đăng tin mua bán, cho thuê nhà đất. Người bán và người mua kết nối trực tiếp với nhau, nhanh chóng và hiệu quả. Coastal Land hỗ trợ thành viên mới đăng tin miễn phí. Đăng tin tại coastalland.vn/dang-tin.",
          cacDong: [
            { nhan: "Ưu đãi", giaTri: `Tin ${getTier(free.tierId).name} miễn phí` },
            { nhan: "Hiển thị", giaTri: `${free.hienThi ?? free.days} ngày từ ngày duyệt tin` },
            { nhan: "Hạn ưu đãi", giaTri: han },
          ],
          znsTemplateId: MAU_UU_DAI_THANH_VIEN_MOI,
          znsData: { ten_khach_hang: n.full_name || "Quý khách", han_uu_dai: han },
        });
        uuDai++;
      }
    }
  } catch (e) {
    await baoLoi({ noi: "thong-bao-dinh-ky", mucDo: "nhe", tomTat: SU_CO.dinhKy.uuDaiMoi, chiTiet: String(e) });
  }

  // ── 4) Tìm kiếm đã lưu — tin MỚI ĐĂNG khớp ĐỦ bộ lọc khách lưu (0055) ─────
  // Lọc bằng CHÍNH lõi của trang danh sách (smartFilter tầng 1 + smartSearch tầng 1) →
  // tin báo khách là tin khách bấm link sẽ thấy ngay đầu trang. Mốc = lần báo trước
  // (chưa báo lần nào = lúc lưu) → mỗi tin báo một lần.
  try {
    const { data: luu } = await admin.from("tim_kiem_luu").select("id,user_id,muc_dich,tham_so,ten,bao_luc,created_at");
    const ds = (luu ?? []) as { id: string; user_id: string; muc_dich: "ban" | "thue"; tham_so: string; ten: string; bao_luc: string | null; created_at: string }[];
    if (ds.length) {
      const tin = await getListings();
      const nguoi = await layNguoi(ds.map((d) => d.user_id));
      for (const d of ds) {
        const moc = Date.parse(d.bao_luc ?? d.created_at);
        const f = filtersFromParams(new URLSearchParams(d.tham_so));
        const moi = tin.filter((l) => (l.purpose ?? "ban") === d.muc_dich && Date.parse(l.postedAt ?? "") > moc);
        const day = smartFilter(moi, { ...f, keyword: "" }).filter((h) => h.tier === 1).map((h) => h.item);
        const khop = smartSearch(day, f.keyword).hits.filter((h) => h.tier === 1).map((h) => h.item);
        if (!khop.length) continue;
        const n = nguoi.get(d.user_id);
        const link = `coastalland.vn/${d.muc_dich === "ban" ? "mua-ban" : "cho-thue"}${d.tham_so ? `?${d.tham_so}` : ""}`;
        await guiThongBao({
          email: n?.email,
          phone: n?.phone,
          tieuDe: `${khop.length} tin mới khớp tìm kiếm của bạn`,
          loiNhan: `Có ${khop.length} tin mới khớp tìm kiếm "${d.ten}" bạn đã lưu. Xem tại ${link}`,
          cacDong: khop.slice(0, 5).map((l) => ({ nhan: l.price, giaTri: l.title.slice(0, 80) })),
          znsTemplateId: MAU_TIM_KIEM_MOI,
          znsData: {
            ten_khach_hang: n?.full_name || "Quý khách",
            so_tin: String(khop.length),
            ten_tim_kiem: d.ten.slice(0, 100),
            so_dien_thoai: chuanHoaSdt(n?.phone ?? ""),
          },
        });
        await admin.from("tim_kiem_luu").update({ bao_luc: new Date().toISOString() }).eq("id", d.id);
        timKiem++;
      }
    }
  } catch (e) {
    await baoLoi({ noi: "thong-bao-dinh-ky", mucDo: "nhe", tomTat: SU_CO.dinhKy.timKiemDaLuu, chiTiet: String(e) });
  }

  // ── 5) Nhắc tin nháp chưa gửi — nháp để yên từ 24 đến 48 giờ trước (mỗi nháp 1 lần) ─
  try {
    const bayGio = Date.now();
    const { data: nhapRaw } = await admin
      .from("listings")
      .select("id,owner_id,title")
      .eq("status", "draft")
      .not("owner_id", "is", null)
      .gte("updated_at", new Date(bayGio - 48 * 3_600_000).toISOString())
      .lt("updated_at", new Date(bayGio - 24 * 3_600_000).toISOString());
    const dsNhap = (nhapRaw ?? []) as { id: string; owner_id: string; title: string | null }[];
    const nguoi = await layNguoi(dsNhap.map((t) => t.owner_id));
    for (const t of dsNhap) {
      const n = nguoi.get(t.owner_id);
      if (!n || n.role === "admin") continue;
      await guiThongBao({
        email: n.email,
        phone: n.phone,
        tieuDe: "Tin nháp của bạn chưa được gửi",
        loiNhan: "Tin đăng của bạn đang lưu nháp, chưa gửi duyệt nên chưa hiển thị. Hoàn tất và gửi tin tại coastalland.vn/tai-khoan/tin-dang.",
        cacDong: [{ nhan: "Tin nháp", giaTri: (t.title ?? "(chưa có tiêu đề)").slice(0, 80) }],
        znsTemplateId: MAU_TIN_NHAP,
        znsData: {
          ten_khach_hang: n.full_name || "Quý khách",
          ten_tin: (t.title ?? "Tin chưa có tiêu đề").slice(0, 100),
          so_dien_thoai: chuanHoaSdt(n.phone ?? ""),
        },
      });
      nhap++;
    }
  } catch (e) {
    await baoLoi({ noi: "thong-bao-dinh-ky", mucDo: "nhe", tomTat: SU_CO.dinhKy.tinNhap, chiTiet: String(e) });
  }

  // ── 2) TÓM TẮT TƯƠNG TÁC — MỖI TIN MỘT LẦN (anh 12/11/2026: "1 tin báo 1 lần", "ngày trước khi báo hết hạn",
  //    bỏ báo cáo tuần). Tin còn hạn trong khoảng (3 ngày, 4 ngày] lúc cron 8h chạy → đúng một ngày trước tin "sắp hết
  //    hạn" (nhắc khi còn ≤ 3 ngày). Cron mỗi ngày một lần + khoảng 24 giờ → mỗi kỳ hiển thị của tin gửi đúng một lần,
  //    không cần cột đánh dấu. Số liệu CỘNG DỒN từ khi tin lên web (cùng số trang Tài khoản → Khách hàng).
  //    Nhiều tin của một khách cùng ngày → gộp một tin nhắn. Mẫu ZBS 641604 (đã duyệt).
  {
    try {
      const bayGio = Date.now();
      const { data: tin } = await admin
        .from("listings")
        .select("id,owner_id,title,view_count,published_at,tier_expires_at")
        .eq("status", "approved")
        .not("owner_id", "is", null)
        .gt("tier_expires_at", new Date(bayGio + 3 * 86_400_000).toISOString())
        .lte("tier_expires_at", new Date(bayGio + 4 * 86_400_000).toISOString())
        .limit(1000);
      type T = { id: string; owner_id: string; title: string; view_count: number | null; published_at: string | null; tier_expires_at: string };
      const theoChu = new Map<string, T[]>();
      for (const t of (tin ?? []) as T[]) theoChu.set(t.owner_id, [...(theoChu.get(t.owner_id) ?? []), t]);
      const nguoi = await layNguoi([...theoChu.keys()]);

      for (const [chu, ds] of theoChu) {
        const n = nguoi.get(chu);
        if (!n || n.role === "admin") continue; // tin admin tự nhập không phải khách
        const ids = ds.map((t) => t.id);
        const { data: ht } = await admin.from("listing_impression_daily").select("luot").in("listing_id", ids);
        const hienThi = ((ht ?? []) as { luot: number }[]).reduce((s2, r) => s2 + (Number(r.luot) || 0), 0);
        const xem = ds.reduce((s2, t) => s2 + Number(t.view_count ?? 0), 0);
        const { count: xemSo } = await admin.from("listing_leads").select("id", { count: "exact", head: true }).in("listing_id", ids);
        const tuChu = ngayVN(new Date(Math.min(...ds.map((t) => Date.parse(t.published_at ?? "") || bayGio))));
        const denChu = ngayVN(new Date(bayGio));
        await guiThongBao({
          email: n.email,
          phone: n.phone,
          tieuDe: ds.length > 1 ? `Kết quả ${ds.length} tin của bạn trên Coastal Land` : "Kết quả tin của bạn trên Coastal Land",
          loiNhan: `Kết quả tin của bạn từ ${tuChu} đến ${denChu}. Xem chi tiết tại coastalland.vn/tai-khoan/khach-hang.`,
          cacDong: [
            ...ds.map((t) => ({ nhan: "Tin", giaTri: t.title })),
            { nhan: "Lượt hiển thị", giaTri: hienThi.toLocaleString("vi-VN") },
            { nhan: "Lượt xem tin", giaTri: xem.toLocaleString("vi-VN") },
            { nhan: "Lượt xem số điện thoại", giaTri: String(xemSo ?? 0) },
          ],
          znsTemplateId: MAU_BAO_CAO_TUAN,
          znsData: {
            ten_khach_hang: n.full_name || "Quý khách",
            so_dien_thoai: chuanHoaSdt(n.phone ?? ""), // cặp định danh Zalo bắt buộc (CT_13)
            tu_ngay: tuChu,
            den_ngay: denChu,
            so_tin: String(ds.length),
            luot_hien_thi: hienThi.toLocaleString("vi-VN"),
            luot_xem: xem.toLocaleString("vi-VN"),
            luot_xem_so: String(xemSo ?? 0),
          },
        });
        baoCao++;
      }
    } catch (e) {
      await baoLoi({ noi: "thong-bao-dinh-ky", mucDo: "nhe", tomTat: SU_CO.dinhKy.baoCaoTuan, chiTiet: String(e) });
    }
  }

  return NextResponse.json({ ok: true, hoiVien, baoCao, uuDai, timKiem, nhap });
}
