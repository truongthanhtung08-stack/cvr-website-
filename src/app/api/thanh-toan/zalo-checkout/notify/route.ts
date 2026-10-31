import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/baoLoi";
import { khoaCheckout, macNotify } from "@/lib/zaloCheckout";

// ============================================================================
// NẠP VÍ TRONG ZALO MINI APP — khách chọn CHUYỂN KHOẢN NGÂN HÀNG (hoặc COD) trong Checkout.
// Zalo chỉ BÁO lựa chọn, chưa có tiền → trả returnCode 1 để Zalo cho khách đi tiếp,
// và ghi sổ sự cố để đối soát sao kê rồi cộng ví tay + cập nhật trạng thái đơn trên Zalo
// (Mini App → Checkout SDK → Lịch sử giao dịch). Khai ở Cấu hình chung → Notify URL:
//   https://coastalland.vn/api/thanh-toan/zalo-checkout/notify
// ============================================================================
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const khoa = khoaCheckout();
  if (!khoa) return NextResponse.json({ returnCode: 0, returnMessage: "chua_cau_hinh" });
  const body = (await req.json().catch(() => ({}))) as { data?: { appId: string; orderId: string; method: string }; mac?: string };
  const d = body.data;
  if (!d || !body.mac || macNotify(khoa, d) !== body.mac) return NextResponse.json({ returnCode: -1, returnMessage: "sai_mac" });

  await baoLoi({
    noi: "zalo-checkout",
    mucDo: "nang",
    tomTat: `Khách chọn ${d.method === "BANK" ? "chuyển khoản ngân hàng" : d.method} khi nạp ví trong Zalo Mini App`,
    chiTiet: `orderId Zalo ${d.orderId}`,
    hauQua: "Tiền chuyển khoản không tự vào ví — phải đối soát tay.",
    canLam: `Đối chiếu sao kê; nhận tiền rồi thì cộng ví tay và cập nhật đơn ${d.orderId} ở Mini App → Checkout SDK.`,
    khoa: `zalo-checkout:bank:${d.orderId}`,
  });
  return NextResponse.json({ returnCode: 1, returnMessage: "da_ghi_nhan" });
}
