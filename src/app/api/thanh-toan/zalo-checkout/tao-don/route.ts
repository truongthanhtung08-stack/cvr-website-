import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nguoiGoi, optionsMiniApp, postMiniApp } from "@/lib/goiTuMiniApp";
import { khoaPayos, maDonPayos, taiKhoanCoSo, taoDonPayos } from "@/lib/payos";
import { khoaCheckout } from "@/lib/zaloCheckout";

// ============================================================================
// NẠP VÍ TRONG ZALO MINI APP — chuyển khoản ngân hàng qua Checkout Popup của Zalo (09/11/2026)
// Mini App gửi { soTien } kèm "Authorization: Bearer <phiên>" → tạo đơn PayOS (cùng sổ payments, cùng webhook với web) → trả
// mã VietQR (qrContent) để Mini App gọi Payment.openCheckoutPopup. Tiền vào ví khi PayOS báo về /api/thanh-toan/webhook;
// webhook báo trạng thái đơn cho Zalo (zaloCheckout.baoTrangThaiDonZalo). Thay luồng createOrder (ZaloPay) cũ — Mini App chưa
// khai ví điện tử nào trong Checkout.
// Chi phí: 1 lượt gọi PayOS + 2 lượt ghi Supabase mỗi lần nạp — không đáng kể so với gói Vercel / Supabase.
// ============================================================================
export const dynamic = "force-dynamic";

const TOI_THIEU = 10_000;
const TOI_DA = 50_000_000;
const loi = (loi: string, status = 400, code?: string) => NextResponse.json({ ok: false, loi, code }, { status });

export const OPTIONS = optionsMiniApp;
export const POST = postMiniApp(async (req) => {
  const khoa = khoaPayos();
  const admin = createAdminClient();
  if (!khoa || !admin || !khoaCheckout()) return loi("Thanh toán trong Zalo chưa được bật.", 503);

  const nguoi = await nguoiGoi(req);
  if (!nguoi) return loi("Bạn cần đăng nhập để nạp tiền.", 401);
  if (!(await taiKhoanCoSo(admin, nguoi.id))) return loi("Xác minh số điện thoại trước khi nạp tiền.", 403, "CAN_XAC_MINH_SDT");

  const { soTien } = (await req.json().catch(() => ({}))) as { soTien?: number };
  const amount = Math.round(Number(soTien));
  if (!Number.isFinite(amount) || amount < TOI_THIEU || amount > TOI_DA) return loi("Số tiền nạp từ 10.000 đ đến 50.000.000 đ.");

  const orderCode = maDonPayos();
  const description = `Nap tien CL ${orderCode}`.slice(0, 25);
  const ve = `https://coastalland.vn/tai-khoan/nap-tien`; // PayOS bắt buộc có đường về; Mini App không mở trang này
  const kq = await taoDonPayos(khoa, { orderCode, amount, description, returnUrl: `${ve}?ket-qua=thanh-cong`, cancelUrl: `${ve}?ket-qua=huy` });
  if (!kq.ok || !kq.data.qrCode) return loi(kq.ok ? "Cổng thanh toán chưa trả mã QR." : kq.message, 502);

  const { error } = await admin.from("payments").insert({
    user_id: nguoi.id,
    user_email: nguoi.email ?? null,
    order_code: String(orderCode),
    amount,
    kind: "topup",
    status: "pending",
    note: "Nạp ví qua Zalo Mini App (chuyển khoản, Checkout Popup)",
  });
  if (error) return loi("Không tạo được đơn nạp tiền.", 500);

  return NextResponse.json({ ok: true, maDon: String(orderCode), amount, qrContent: String(kq.data.qrCode), desc: `Nạp ví Coastal Land ${amount.toLocaleString("vi-VN")} đ` });
});

