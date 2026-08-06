import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================================
// CỔNG THANH TOÁN PayOS — tạo link thanh toán cho một đơn nạp tiền / mua gói.
// ----------------------------------------------------------------------------
// KHOÁ KẾT NỐI để trong biến môi trường (KHÔNG bao giờ để ở phía trình duyệt):
//   PAYOS_CLIENT_ID      — Client ID
//   PAYOS_API_KEY        — API Key
//   PAYOS_CHECKSUM_KEY   — Checksum Key
// Lấy 3 khoá này trong trang quản trị PayOS (my.payos.vn) → dán vào .env.local
// khi chạy máy và vào Vercel → Settings → Environment Variables khi chạy web.
// Chưa có khoá: hệ thống trả thông báo rõ ràng, phần còn lại của web vẫn chạy.
// ============================================================================

const PAYOS_ENDPOINT = "https://api-merchant.payos.vn/v2/payment-requests";

export async function POST(req: Request) {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "CHUA_CAU_HINH",
        message:
          "Cổng thanh toán chưa được cấu hình. Cần điền PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY.",
      },
      { status: 503 },
    );
  }

  let body: { amount?: number; description?: string; buyerName?: string; buyerEmail?: string; buyerPhone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount) || 0);
  if (amount < 10_000) {
    return NextResponse.json({ ok: false, message: "Số tiền tối thiểu là 10.000 ₫." }, { status: 400 });
  }

  // Mã đơn: số nguyên tăng dần theo thời gian (yêu cầu của PayOS)
  const orderCode = Number(String(Date.now()).slice(-10));
  // PayOS giới hạn mô tả 25 ký tự
  const description = (body.description || `Nap tien CL ${orderCode}`).slice(0, 25);

  const origin = new URL(req.url).origin;
  const returnUrl = `${origin}/tai-khoan/nap-tien?ket-qua=thanh-cong`;
  const cancelUrl = `${origin}/tai-khoan/nap-tien?ket-qua=huy`;

  // Chữ ký theo đúng thứ tự PayOS quy định
  const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  const signature = crypto.createHmac("sha256", checksumKey).update(raw).digest("hex");

  try {
    const res = await fetch(PAYOS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        orderCode,
        amount,
        description,
        returnUrl,
        cancelUrl,
        signature,
        buyerName: body.buyerName ?? undefined,
        buyerEmail: body.buyerEmail ?? undefined,
        buyerPhone: body.buyerPhone ?? undefined,
      }),
    });

    const json = await res.json();
    if (json?.code !== "00" || !json?.data?.checkoutUrl) {
      return NextResponse.json(
        { ok: false, message: json?.desc || "Cổng thanh toán từ chối đơn hàng.", detail: json },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      orderCode,
      amount,
      checkoutUrl: json.data.checkoutUrl as string,
      qrCode: json.data.qrCode as string | undefined,
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Không kết nối được cổng thanh toán." }, { status: 502 });
  }
}

// Kiểm tra nhanh: đã cắm khoá chưa (dùng cho trang admin Thanh toán).
export async function GET() {
  return NextResponse.json({
    daCauHinh: Boolean(
      process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY,
    ),
    thieu: [
      !process.env.PAYOS_CLIENT_ID && "PAYOS_CLIENT_ID",
      !process.env.PAYOS_API_KEY && "PAYOS_API_KEY",
      !process.env.PAYOS_CHECKSUM_KEY && "PAYOS_CHECKSUM_KEY",
    ].filter(Boolean),
  });
}
