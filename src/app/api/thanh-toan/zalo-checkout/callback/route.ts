import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { vnd } from "@/lib/billing";
import { guiThongBao, MAU_NAP_TIEN } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";
import { xuLyUpCho } from "@/lib/upTin";
import { khoaCheckout, macCallback, type DuLieuCallback } from "@/lib/zaloCheckout";

// ============================================================================
// NẠP VÍ TRONG ZALO MINI APP — BƯỚC 2: Zalo báo kết quả (ZaloPay / MoMo / VNPay / PayMe)
// Khai ở Mini App → Checkout SDK → Cấu hình chung → Callback URL:
//   https://coastalland.vn/api/thanh-toan/zalo-checkout/callback
// Làm y quy tắc của webhook PayOS: kiểm MAC → số tiền lấy theo ĐƠN GỐC trong sổ →
// GIÀNH QUYỀN cộng (pending → paid, chỉ một lệnh thắng) → cong_vi → báo khách → tự Up tin chờ nạp.
// Trả Zalo: returnCode 1 = xong · 2 = đơn đã cộng trước đó · khác = lỗi (Zalo không gọi lại).
// ============================================================================
export const dynamic = "force-dynamic";

const tra = (returnCode: number, returnMessage: string) => NextResponse.json({ returnCode, returnMessage });

export async function POST(req: Request) {
  const khoa = khoaCheckout();
  const admin = createAdminClient();
  if (!khoa || !admin) return tra(0, "chua_cau_hinh");

  const body = (await req.json().catch(() => ({}))) as { data?: DuLieuCallback; mac?: string };
  const d = body.data;
  if (!d || !body.mac || macCallback(khoa, d) !== body.mac) return tra(-1, "sai_mac");

  let maDon = "";
  try {
    maDon = JSON.parse(decodeURIComponent(d.extradata ?? ""))?.maDon ?? "";
  } catch {
    /* extradata hỏng → không biết đơn nào */
  }
  const { data: rows } = await admin.from("payments").select("id,user_id,amount,status").eq("order_code", maDon).limit(1);
  const don = rows?.[0] as { id: string; user_id: string | null; amount: number; status: string } | undefined;
  if (!don) {
    if (Number(d.resultCode) === 1) {
      await baoLoi({
        noi: "zalo-checkout",
        mucDo: "chet",
        tomTat: "Zalo báo đã thu tiền nhưng KHÔNG tìm thấy đơn nạp — ví chưa được cộng",
        chiTiet: `orderId Zalo ${d.orderId}, transId ${d.transId}, số tiền ${d.amount}`,
        hauQua: "Khách mất tiền mà ví vẫn bằng 0.",
        canLam: `Tra đơn ${d.orderId} ở Mini App → Checkout SDK → Lịch sử giao dịch rồi cộng ví tay.`,
        khoa: `zalo-checkout:mat-don:${d.orderId}`,
      });
    }
    return tra(-1, "khong_thay_don");
  }
  if (don.status === "paid") return tra(2, "da_xu_ly");
  if (Number(d.resultCode) !== 1) {
    await admin.from("payments").update({ status: "cancelled", note: `Zalo: ${d.message}` }).eq("id", don.id).eq("status", "pending");
    return tra(1, "da_ghi_that_bai");
  }
  // Số tiền phải khớp đơn gốc (tài liệu Zalo bắt buộc kiểm).
  if (Number(d.amount) !== Number(don.amount)) return tra(-1, "lech_so_tien");

  // Giành quyền cộng — Zalo gọi lại sát nhau thì chỉ một lần cộng.
  const { data: gianh } = await admin
    .from("payments")
    .update({ status: "paid", note: `Zalo Checkout ${d.method ?? ""} · orderId ${d.orderId} · transId ${d.transId}` })
    .eq("id", don.id)
    .eq("status", "pending")
    .select("id");
  if (!gianh?.length) return tra(2, "da_xu_ly");

  const soTien = Number(don.amount) || 0;
  if (don.user_id && soTien > 0) {
    const { data: viMoi, error: loiVi } = await admin.rpc("cong_vi", { p_user: don.user_id, p_tien: soTien, p_cap: null, p_diem: 0 });
    if (loiVi) {
      await baoLoi({
        noi: "zalo-checkout",
        mucDo: "chet",
        tomTat: "Đơn Zalo đã ghi ĐÃ THANH TOÁN nhưng cộng ví thất bại",
        chiTiet: `Đơn ${don.id} — ${loiVi.message}`,
        hauQua: "Khách đã trả tiền mà số dư không tăng.",
        canLam: `Cộng tay ${vnd(soTien)} vào ví khách.`,
        khoa: `zalo-checkout:cong-vi:${don.id}`,
      });
      return tra(1, "da_nhan_cho_doi_soat");
    }
    const soDu = Number((viMoi as { so_du?: number }[] | null)?.[0]?.so_du ?? 0);
    const { data: hs } = await admin.from("profiles").select("email,phone,full_name").eq("id", don.user_id).limit(1);
    const ho = hs?.[0] as { email: string | null; phone: string | null; full_name: string | null } | undefined;
    await guiThongBao({
      email: ho?.email,
      phone: ho?.phone,
      tieuDe: "Đã nhận tiền nạp vào ví",
      loiNhan: `Coastal Land đã nhận được khoản nạp của ${ho?.full_name || "quý khách"}.`,
      cacDong: [
        { nhan: "Số tiền nạp", giaTri: vnd(soTien) },
        { nhan: "Số dư hiện tại", giaTri: vnd(soDu) },
        { nhan: "Mã giao dịch", giaTri: String(don.id) },
      ],
      znsTemplateId: MAU_NAP_TIEN,
      znsData: { ten_khach_hang: ho?.full_name || "Quý khách", ma_giao_dich: String(don.id), so_tien: vnd(soTien), so_du: vnd(soDu) },
    });
    if ((await xuLyUpCho(admin, don.user_id)) > 0) revalidateTag("listings", "max");
  }
  return tra(1, "thanh_cong");
}
