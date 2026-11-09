import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { khoaPayos, maDonPayos, taiKhoanCoSo, taoDonPayos } from "@/lib/payos";

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

export async function POST(req: Request) {
  const khoa = khoaPayos();
  if (!khoa) {
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

  let body: { amount?: number; description?: string; buyerName?: string; buyerEmail?: string; buyerPhone?: string; ve?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount) || 0);
  if (amount < 10_000) {
    return NextResponse.json({ ok: false, message: "Số tiền tối thiểu là 10.000 ₫." }, { status: 400 });
  }

  // AI đang nạp — đọc từ phiên đăng nhập, KHÔNG lấy theo dữ liệu trình duyệt gửi
  // lên (nếu tin trình duyệt thì ai cũng khai được id người khác để nhận tiền).
  let nguoiNap: { id: string; email?: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) nguoiNap = { id: data.user.id, email: data.user.email ?? undefined };
  } catch {
    /* chưa cấu hình Supabase → vẫn tạo được link, đối soát tay */
  }

  // Mã đơn: số nguyên tăng dần theo thời gian (yêu cầu của PayOS)
  // SỐ ĐIỆN THOẠI LÀ BẮT BUỘC (chủ dự án 05/11/2026: "số điện thoại là cái để xác thực một tài khoản khi khách bấm đăng tin và nộp
  // tiền"): tài khoản chưa xác minh số chính chủ thì không tạo đơn nạp — trang Nạp tiền mở hộp xác minh (gộp một lần) rồi nạp tiếp.
  if (nguoiNap) {
    const admin = createAdminClient();
    // Chỉ hỏi DUY NHẤT khi tài khoản KHÔNG CÓ số (chủ dự án 05/11/2026 chốt) — có số thì nạp luôn
    if (admin && !(await taiKhoanCoSo(admin, nguoiNap.id))) {
      return NextResponse.json({ ok: false, code: "CAN_XAC_MINH_SDT", message: "Xác minh số điện thoại trước khi nạp tiền." }, { status: 403 });
    }
  }

  const orderCode = maDonPayos();
  // PayOS giới hạn mô tả 25 ký tự
  const description = (body.description || `Nap tien CL ${orderCode}`).slice(0, 25);

  const origin = new URL(req.url).origin;
  // Nạp từ gói tin (ve = form đăng tin / Tin của tôi): PayOS trả về kèm ve → trang nạp đưa khách về đúng chỗ (26/10/2026)
  const ve = typeof body.ve === "string" && /^\/(dang-tin|tai-khoan)(\/|\?|$)/.test(body.ve) ? `&ve=${encodeURIComponent(body.ve)}` : "";
  const returnUrl = `${origin}/tai-khoan/nap-tien?ket-qua=thanh-cong${ve}`;
  const cancelUrl = `${origin}/tai-khoan/nap-tien?ket-qua=huy${ve}`;

  const kq = await taoDonPayos(khoa, {
    orderCode,
    amount,
    description,
    returnUrl,
    cancelUrl,
    buyerName: body.buyerName ?? undefined,
    buyerEmail: body.buyerEmail ?? undefined,
    buyerPhone: body.buyerPhone ?? undefined,
  });
  if (!kq.ok) return NextResponse.json({ ok: false, message: kq.message, detail: kq.detail }, { status: 502 });
  const json = { data: kq.data as Record<string, string | undefined> };

  // ── GHI ĐƠN VÀO SỔ (payments, trạng thái "pending") ────────────────────
  // Bắt buộc: lát nữa PayOS báo "đã nhận tiền" thì webhook dò theo order_code
  // trong sổ này để biết cộng cho AI và cộng BAO NHIÊU. Không ghi ở đây thì
  // tiền về mà không biết của ai.
  // Ghi bằng khoá quản trị vì phiên khách không chắc còn sống lúc chuyển trang.
  const admin = createAdminClient();
  if (admin) {
    await admin.from("payments").insert({
      user_id: nguoiNap?.id ?? null,
      user_email: nguoiNap?.email ?? body.buyerEmail ?? null,
      order_code: String(orderCode),
      amount,
      kind: "topup",
      status: "pending",
      note: nguoiNap ? null : "Đơn tạo khi chưa đăng nhập — cần đối soát tay.",
    });
  }

  return NextResponse.json({
    ok: true,
    orderCode,
    amount,
    checkoutUrl: json.data.checkoutUrl as string,
    // MÃ QR NGAY TRÊN COASTALLAND.VN có logo Coastal Land (chủ dự án 26/10/2026 — trang PayOS chỉ cho logo payOS giữa mã)
    qrCode: json.data.qrCode as string | undefined,
    bin: json.data.bin as string | undefined,
    accountNumber: json.data.accountNumber as string | undefined,
    accountName: json.data.accountName as string | undefined,
    description: json.data.description as string | undefined,
    paymentLinkId: json.data.paymentLinkId as string | undefined,
  });
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
