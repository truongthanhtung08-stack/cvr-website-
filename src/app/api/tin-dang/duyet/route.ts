import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING_DEFAULT, quotePrice, vnd, type BillingData } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { guiThongBao, MAU_DUYET_TIN } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";
import type { TierId } from "@/lib/packages";

// ============================================================================
// DUYỆT TIN — TRỪ VÍ + GHI DOANH THU + BÁO KHÁCH
// ----------------------------------------------------------------------------
// Quy trình chủ dự án chốt: khách chọn gói và đăng tin thì CHƯA mất đồng nào.
// Chỉ khi admin duyệt và tin lên sóng mới trừ tiền — vì đó mới là lúc dịch vụ
// thật sự được cung cấp. Tin bị từ chối: không trừ, không hóa đơn.
//
// BẮT BUỘC CHẠY Ở MÁY CHỦ, không làm ở trình duyệt: số tiền phải do máy chủ tự
// tính từ bảng giá, không được nhận từ client (nhận từ client thì sửa được).
//
// CHỐNG TRỪ TIỀN HAI LẦN — hai lớp:
//   1. Cột listings.da_tru_vi: cập nhật có điều kiện `da_tru_vi = false`, ai
//      giành được mới đi tiếp. Bấm Duyệt hai lần chỉ trừ một lần.
//   2. Unique index uq_doanh_thu_listing: mỗi tin chỉ một bản ghi doanh thu.
// ============================================================================
export const dynamic = "force-dynamic";

type HoSo = {
  balance: number | null;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  member_level: string | null;
  xuat_hoa_don: boolean | null;
  hd_ten_cong_ty: string | null;
  hd_mst: string | null;
  hd_dia_chi: string | null;
  hd_email: string | null;
};

export async function POST(request: Request) {
  // ── 1. Chỉ admin ──────────────────────────────────────────────────────────
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Chưa đăng nhập", 401);
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return loi("Chỉ quản trị viên được duyệt tin", 403);

  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return loi("Thiếu mã tin", 400);

  // Khoá service_role bỏ qua RLS — bắt buộc phải có để trừ ví và ghi doanh thu.
  const admin = createAdminClient();
  if (!admin) return loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ — chưa duyệt tin được.", 500);

  // ── 2. Lấy tin ────────────────────────────────────────────────────────────
  const { data: tin, error: loiTin } = await admin
    .from("listings")
    .select("id,title,owner_id,status,tier_yeu_cau,tier_days,da_tru_vi,details")
    .eq("id", id)
    .single();
  if (loiTin || !tin) return loi("Không tìm thấy tin", 404);

  // Gói khách chọn nằm ở HAI chỗ tuỳ tin đăng lúc nào:
  //   · details.plan = { tier, days }  ← form đăng tin ghi vào đây từ trước tới nay
  //   · cột tier_yeu_cau / tier_days   ← cột riêng thêm ở migration 0017
  // Ưu tiên cột riêng, không có thì lấy trong details → tin CŨ vẫn duyệt và tính
  // tiền đúng, không phải sửa form khách (phần đã duyệt, không đụng).
  const plan = (tin.details as { plan?: { tier?: string; days?: number } } | null)?.plan;
  const goi = ((tin.tier_yeu_cau ?? plan?.tier ?? "basic") as TierId);
  const soNgay = Number(tin.tier_days ?? plan?.days) || 0;
  const mienPhi = goi === "basic" || soNgay <= 0;

  // ── 3. Tin miễn phí: duyệt thẳng, không dính tiền nong ────────────────────
  if (mienPhi) {
    const { error } = await admin
      .from("listings")
      .update({ status: "approved", published_at: new Date().toISOString(), tier: "basic" })
      .eq("id", id);
    if (error) return loi(error.message, 500);
    revalidateTag("listings", "max"); // tin vừa lên sóng → purge cache để hiện NGAY
    // Mẫu ZNS "tin đã duyệt" khai 3 tham số nên cả 3 đều PHẢI có giá trị —
    // trước đây chỗ này truyền so_du rỗng, Zalo từ chối cả tin. Tin miễn phí
    // không trừ tiền nên số dư giữ nguyên, vẫn đọc ra để báo cho đúng.
    const { data: viArr } = await admin
      .from("profiles")
      .select("balance")
      .eq("id", tin.owner_id)
      .limit(1);
    const soDuHienTai = Number(viArr?.[0]?.balance ?? 0);
    await baoKhach(admin, tin.owner_id, {
      tieuDe: "Tin của bạn đã được duyệt",
      cacDong: [
        { nhan: "Tin đăng", giaTri: tin.title },
        { nhan: "Gói dịch vụ", giaTri: "Tin thường (miễn phí)" },
      ],
      znsTemplateId: MAU_DUYET_TIN,
      znsData: {
        ma_giao_dich: String(tin.id),
        ten_tin: tin.title,
        so_tien: vnd(0),
        so_du: vnd(soDuHienTai),
      },
    });
    return NextResponse.json({ ok: true, mienPhi: true });
  }

  // ── 4. Tính tiền — máy chủ tự tính từ bảng giá, KHÔNG nhận từ client ──────
  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const luu = sc?.[0]?.data as Partial<BillingData> | undefined;
  const bang: BillingData = { ...BILLING_DEFAULT, ...(luu ?? {}) };

  const { data: hsArr } = await admin
    .from("profiles")
    .select("balance,email,phone,full_name,member_level,xuat_hoa_don,hd_ten_cong_ty,hd_mst,hd_dia_chi,hd_email")
    .eq("id", tin.owner_id)
    .limit(1);
  const hs = hsArr?.[0] as HoSo | undefined;
  if (!hs) return loi("Tin không có chủ sở hữu hợp lệ", 400);

  const bao = quotePrice({
    data: bang,
    tierId: goi,
    days: soNgay,
    today: new Date().toISOString().slice(0, 10),
    levelId: hs.member_level ?? undefined,
  });
  const tien = tachThue(bao.total);

  const soDu = Number(hs.balance ?? 0);
  if (soDu < tien.tongTra) {
    return loi(
      `Ví khách không đủ: cần ${vnd(tien.tongTra)}, còn ${vnd(soDu)}. Nhắc khách nạp thêm rồi duyệt lại.`,
      400,
    );
  }

  // ── 5. GIÀNH QUYỀN TRỪ TIỀN (chống bấm Duyệt hai lần) ─────────────────────
  const { data: gianh, error: loiGianh } = await admin
    .from("listings")
    .update({ da_tru_vi: true })
    .eq("id", id)
    .eq("da_tru_vi", false)
    .select("id");
  if (loiGianh) return loi(loiGianh.message, 500);
  if (!gianh || gianh.length === 0) {
    return NextResponse.json({ ok: true, boQua: "Tin này đã được trừ tiền trước đó" });
  }

  // ── 6. Trừ ví ─────────────────────────────────────────────────────────────
  const { error: loiVi } = await admin
    .from("profiles")
    .update({ balance: soDu - tien.tongTra })
    .eq("id", tin.owner_id);
  if (loiVi) {
    await admin.from("listings").update({ da_tru_vi: false }).eq("id", id); // trả lại quyền
    return loi("Trừ ví thất bại: " + loiVi.message, 500);
  }

  // ── 7. Ghi sổ doanh thu (nguồn lập tờ khai thuế) ──────────────────────────
  const canHoaDon = Boolean(hs.xuat_hoa_don);
  const { error: loiSo } = await admin.from("doanh_thu").insert({
    user_id: tin.owner_id,
    listing_id: id,
    mo_ta: `${tenGoi(bang, goi)} ${soNgay} ngày — ${tin.title}`,
    tien_hang: tien.tienHang,
    tien_thue: tien.tienThue,
    thue_suat: THUE_SUAT_GTGT,
    tong_tra: tien.tongTra,
    yeu_cau_hoa_don: canHoaDon,
    // Cần hóa đơn công ty → xuất riêng. Không → gom hóa đơn tổng cuối ngày.
    hoa_don_loai: canHoaDon ? "rieng" : "tong",
    ten_nguoi_mua: canHoaDon ? hs.hd_ten_cong_ty : hs.full_name,
    mst_nguoi_mua: canHoaDon ? hs.hd_mst : null,
    dia_chi_nguoi_mua: canHoaDon ? hs.hd_dia_chi : null,
    email_nguoi_mua: (canHoaDon ? hs.hd_email : null) || hs.email,
  });
  // Ghi sổ hỏng thì KHÔNG dừng: tiền đã trừ, tin phải lên sóng — thà lệch sổ một
  // dòng còn hơn khách mất tiền mà tin không đăng. NHƯNG phải gào lên ngay: tiền
  // đã vào túi mình mà không có trong sổ là sai tờ khai thuế, không ai tự biết.
  if (loiSo) {
    await baoLoi({
      noi: "duyet-tin",
      mucDo: "chet",
      tomTat: "Đã trừ tiền khách nhưng KHÔNG ghi được sổ doanh thu",
      chiTiet: `Tin ${id} — ${loiSo.message}`,
      hauQua: "Tờ khai thuế quý này thiếu một khoản thu, và khách sẽ không được xuất hóa đơn.",
      canLam: `Vào /admin/hoa-don-thue → ghi tay khoản ${vnd(tien.tongTra)} của tin "${tin.title}".`,
      khoa: `duyet-tin:doanh-thu:${id}`, // mỗi tin một cảnh báo riêng, không nuốt của nhau
    });
  }

  // ── 8. Cho tin lên sóng ───────────────────────────────────────────────────
  const hetHan = new Date(Date.now() + soNgay * 86_400_000).toISOString();
  const { error: loiLen } = await admin
    .from("listings")
    .update({
      status: "approved",
      published_at: new Date().toISOString(),
      tier: goi,
      tier_expires_at: hetHan,
      gia_chua_thue: tien.tienHang,
      tien_thue: tien.tienThue,
      thue_suat: THUE_SUAT_GTGT,
    })
    .eq("id", id);
  if (loiLen) return loi("Đã trừ tiền nhưng không đăng được tin: " + loiLen.message, 500);

  revalidateTag("listings", "max"); // tin trả phí vừa lên sóng → purge cache để hiện NGAY

  // ── 9. BÁO KHÁCH (bắt buộc) ───────────────────────────────────────────────
  const kq = await baoKhach(admin, tin.owner_id, {
    tieuDe: "Tin của bạn đã được duyệt và lên sóng",
    loiNhan: `Cảm ơn ${hs.full_name || "quý khách"} đã sử dụng dịch vụ của Coastal Land.`,
    cacDong: [
      { nhan: "Tin đăng", giaTri: tin.title },
      { nhan: "Gói dịch vụ", giaTri: `${tenGoi(bang, goi)} · ${soNgay} ngày` },
      { nhan: "Tiền dịch vụ", giaTri: vnd(tien.tienHang) },
      { nhan: `Thuế GTGT ${(THUE_SUAT_GTGT * 100).toFixed(0)}%`, giaTri: vnd(tien.tienThue) },
      { nhan: "Đã trừ ví", giaTri: vnd(tien.tongTra) },
      { nhan: "Số dư còn lại", giaTri: vnd(soDu - tien.tongTra) },
      { nhan: "Hiển thị đến", giaTri: new Date(hetHan).toLocaleDateString("vi-VN") },
    ],
    znsTemplateId: MAU_DUYET_TIN,
    znsData: {
      ma_giao_dich: String(tin.id),
      ten_tin: tin.title,
      so_tien: vnd(tien.tongTra),
      so_du: vnd(soDu - tien.tongTra),
    },
  }, hs);

  return NextResponse.json({
    ok: true,
    daTru: tien.tongTra,
    soDuMoi: soDu - tien.tongTra,
    hoaDon: canHoaDon ? "xuất riêng" : "gom hóa đơn tổng cuối ngày",
    thongBao: kq,
  });
}

// ── Phụ trợ ─────────────────────────────────────────────────────────────────
function loi(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

function tenGoi(bang: BillingData, tierId: TierId): string {
  return bang.plans.find((p) => p.tierId === tierId)?.name ?? "Gói tin";
}

// Gửi thông báo — không bao giờ để lỗi gửi làm hỏng việc đã xong ở trên.
async function baoKhach(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  ownerId: string | null,
  noiDung: Parameters<typeof guiThongBao>[0],
  hoSo?: HoSo,
) {
  try {
    let email = hoSo?.email ?? null;
    let phone = hoSo?.phone ?? null;
    let ten = hoSo?.full_name ?? null;
    if (!hoSo && ownerId) {
      const { data } = await admin.from("profiles").select("email,phone,full_name").eq("id", ownerId).limit(1);
      email = (data?.[0]?.email as string | null) ?? null;
      phone = (data?.[0]?.phone as string | null) ?? null;
      ten = (data?.[0]?.full_name as string | null) ?? null;
    }
    // Mẫu ZNS bắt buộc có tên khách; điền ở đây để mọi lối gọi đều đủ tham số.
    const znsData = noiDung.znsData && { ten_khach_hang: ten || "Quý khách", ...noiDung.znsData };
    const kq = await guiThongBao({ ...noiDung, znsData, email, phone });

    // Không kênh nào tới được khách = khách đã bị trừ tiền mà không biết tin đã
    // lên sóng. Im lặng ở đây là mất khách, nên báo ngay cho chủ dự án gọi tay.
    if (!kq.some((k) => k.daGui)) {
      await baoLoi({
        noi: "duyet-tin",
        mucDo: "nang",
        tomTat: "Duyệt tin xong nhưng KHÔNG báo được cho khách",
        chiTiet: kq.map((k) => `${k.kenh}: ${k.lyDo ?? "không rõ"}`).join(" · "),
        hauQua: "Khách bị trừ tiền mà không biết tin đã lên sóng.",
        canLam: `Gọi hoặc nhắn cho khách${email ? ` (${email})` : ""} để báo tin đã đăng.`,
        khoa: `duyet-tin:bao-khach:${ownerId ?? "khong-ro"}`,
      });
    }
    return kq;
  } catch (e) {
    await baoLoi({
      noi: "duyet-tin",
      mucDo: "nang",
      tomTat: "Gửi thông báo duyệt tin cho khách bị lỗi",
      chiTiet: String(e),
      hauQua: "Khách bị trừ tiền mà không biết tin đã lên sóng.",
      canLam: "Liên hệ khách bằng tay, rồi xem lại khoá Resend / Zalo.",
    });
    return [];
  }
}
