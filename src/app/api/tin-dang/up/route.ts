import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING_DEFAULT, bangTheoMucDich, freeDangChay, loaiVoucherTin, quotePrice, vnd, type BillingData } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { baoLoi } from "@/lib/baoLoi";
import type { TierId } from "@/lib/packages";

// ============================================================================
// UP TIN = GIA HẠN GÓI TIN (chủ dự án chốt 25/09/2026)
// ----------------------------------------------------------------------------
//   · Được Up BẤT CỨ LÚC NÀO: tin đang đăng hoặc đã hết hạn ('expired').
//   · Ngày đăng, mốc lên đầu và hạn gói TÍNH LẠI TỪ HÔM NAY — ngày còn dư của
//     gói cũ BỎ (reset từ đầu, không cộng dồn).
//   · Giá tính y như ĐĂNG TIN MỚI: bảng theo mục đích (Bán/Thuê), chương trình
//     miễn phí thành viên mới, voucher gói hội viên. Máy chủ tự tính — không
//     nhận số tiền từ trình duyệt.
//   · Nội dung không đổi → không phải duyệt lại.
// Khác ĐẨY TIN (/api/tin-dang/day): đẩy chỉ đưa tin lên đầu, không đổi hạn gói.
// ============================================================================
export const dynamic = "force-dynamic";

const HANG: TierId[] = ["basic", "silver", "gold", "diamond"];

function loi(thongBao: string, code = 400) {
  return NextResponse.json({ ok: false, loi: thongBao }, { status: code });
}

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Bạn cần đăng nhập.", 401);

  const { id, tier, soNgay } = (await request.json().catch(() => ({}))) as { id?: string; tier?: string; soNgay?: number };
  if (!id || !tier || !HANG.includes(tier as TierId) || !Number.isInteger(soNgay)) return loi("Thiếu tin, hạng hoặc thời hạn.");
  const goi = tier as TierId;

  const admin = createAdminClient();
  if (!admin) return loi("Máy chủ chưa cấu hình đủ.", 500);

  const { data: tin } = await admin.from("listings").select("id,title,owner_id,status,purpose").eq("id", id).single();
  if (!tin) return loi("Không tìm thấy tin.", 404);
  if (tin.owner_id !== user.id) return loi("Tin này không phải của bạn.", 403);
  if (tin.status !== "approved" && tin.status !== "expired") return loi("Chỉ Up được tin đang đăng hoặc đã hết hạn.");

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang: BillingData = bangTheoMucDich({ ...BILLING_DEFAULT, ...((sc?.[0]?.data as Partial<BillingData>) ?? {}) }, tin.purpose);
  if (!bang.plans.find((p) => p.tierId === goi)?.terms.some((t) => t.days === soNgay)) {
    return loi("Hạng tin hoặc thời hạn này hiện không bán.");
  }

  const { data: hsArr } = await admin
    .from("profiles")
    .select("created_at,role,free_quota,email,full_name,xuat_hoa_don,hd_ten_cong_ty,hd_mst,hd_dia_chi,hd_email")
    .eq("id", user.id)
    .limit(1);
  const hs = hsArr?.[0];
  if (!hs) return loi("Không tìm thấy tài khoản.", 404);

  // ── Giá: y như đăng mới ──────────────────────────────────────────────────
  const homNay = new Date().toISOString().slice(0, 10);
  const soNgayMoTk = hs.created_at ? (Date.now() - new Date(hs.created_at).getTime()) / 86_400_000 : Number.POSITIVE_INFINITY;
  const bao = quotePrice({ data: bang, tierId: goi, days: soNgay!, today: homNay, isNewMember: soNgayMoTk <= bang.free.days });
  let tien = tachThue(bao.total);

  // Chương trình miễn phí thành viên mới — cùng điều kiện với duyệt tin.
  const f = bang.free;
  const hopDoiTuong = f.audience === "all" || (f.audience === "new" && soNgayMoTk <= f.days) || f.audience === (hs.role ?? "buyer");
  let mienPhi = freeDangChay(f, homNay) && goi === f.tierId && hopDoiTuong && (f.quota === 0 || Number(hs.free_quota ?? 0) > 0);
  if (mienPhi && f.quota !== 0) {
    const { data: luot } = await admin.rpc("dung_luot_mien_phi", { p_user: user.id });
    mienPhi = Boolean(luot && (luot as unknown[]).length);
  }
  if (mienPhi) tien = tachThue(0);

  // Voucher gói hội viên (0040) — chỉ khi thật sự có tiền phải trả.
  let voucher: { id: number; giam: number } | null = null;
  if (tien.tienHang > 0) {
    const { data: vc } = await admin.rpc("dung_voucher", { p_user: user.id, p_loai: loaiVoucherTin(goi) });
    const v = (vc as { id: number; giam: number }[] | null)?.[0];
    if (v) {
      voucher = { id: v.id, giam: Math.min(Number(v.giam), tien.tienHang) };
      tien = tachThue(tien.tienHang - voucher.giam);
    }
  }

  // ── Up: trừ ví + đặt lại ngày trong MỘT hàm CSDL (0041) ──────────────────
  const { data: kq, error } = await admin.rpc("up_tin", {
    p_listing: id, p_user: user.id, p_tier: goi, p_so_ngay: soNgay, p_tien: tien.tongTra,
  });
  if (error) {
    if (voucher) await admin.rpc("hoan_voucher", { p_id: voucher.id });
    if (/VI_KHONG_DU/.test(error.message)) {
      const { data: vi } = await admin.from("profiles").select("balance").eq("id", user.id).limit(1);
      return loi(`Ví không đủ: cần ${vnd(tien.tongTra)}, còn ${vnd(Number(vi?.[0]?.balance ?? 0))}. Nạp thêm rồi Up lại.`);
    }
    return loi(error.message, 500);
  }
  const d = (kq as { so_du: number; het_han: string }[] | null)?.[0];

  // ── Ghi sổ doanh thu (chỉ khi có thu tiền) ───────────────────────────────
  if (tien.tongTra > 0) {
    const canHoaDon = Boolean(hs.xuat_hoa_don);
    const tenGoi = bang.plans.find((p) => p.tierId === goi)?.name ?? "Gói tin";
    const { error: loiSo } = await admin.from("doanh_thu").insert({
      user_id: user.id,
      listing_id: id,
      loai: "up_tin",
      mo_ta: `Up tin ${tenGoi} ${soNgay} ngày — ${tin.title}${voucher ? ` (voucher hội viên −${vnd(voucher.giam)})` : ""}`,
      tien_hang: tien.tienHang,
      tien_thue: tien.tienThue,
      thue_suat: THUE_SUAT_GTGT,
      tong_tra: tien.tongTra,
      yeu_cau_hoa_don: canHoaDon,
      hoa_don_loai: canHoaDon ? "rieng" : "tong",
      ten_nguoi_mua: canHoaDon ? hs.hd_ten_cong_ty : hs.full_name,
      mst_nguoi_mua: canHoaDon ? hs.hd_mst : null,
      dia_chi_nguoi_mua: canHoaDon ? hs.hd_dia_chi : null,
      email_nguoi_mua: (canHoaDon ? hs.hd_email : null) || hs.email,
    });
    if (loiSo) {
      await baoLoi({
        noi: "up-tin",
        mucDo: "chet",
        tomTat: "Đã trừ tiền Up tin nhưng KHÔNG ghi được sổ doanh thu",
        chiTiet: `Tin ${id} — ${loiSo.message}`,
        hauQua: "Tờ khai thuế thiếu một khoản thu, khách cũng không được xuất hóa đơn khoản này.",
        canLam: `Vào /admin/hoa-don-thue → ghi tay khoản ${vnd(tien.tongTra)} (Up tin "${tin.title}").`,
        khoa: `up-tin:doanh-thu:${id}:${homNay}`,
      });
    }
  }

  revalidateTag("listings", "max"); // tin vừa Up → lên đầu, hiện lại NGAY
  return NextResponse.json({ ok: true, daTru: tien.tongTra, mienPhi, soDu: d?.so_du, hetHan: d?.het_han });
}
