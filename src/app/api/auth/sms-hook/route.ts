import { NextResponse } from "next/server";
import crypto from "crypto";
import { guiZns } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// SUPABASE "SEND SMS HOOK" — GỬI MÃ OTP ĐĂNG NHẬP QUA ZALO
// ----------------------------------------------------------------------------
// Khách nhập số điện thoại ở /dang-nhap/so-dien-thoai → Supabase sinh mã OTP
// rồi GỌI VÀO ĐÂY thay vì gửi SMS. Route này đẩy mã đó sang Zalo ZNS.
//
// VÌ SAO KHÔNG TỰ VIẾT OTP: sinh mã, đặt hạn, chặn dò mã, chặn spam, tạo phiên
// đăng nhập đều là phần dễ sai và nguy hiểm nếu sai. Supabase lo hết; ở đây chỉ
// làm đúng một việc là CHUYỂN mã đi.
//
// VÌ SAO ZALO CHỨ KHÔNG SMS:
//   · SMS Twilio về VN ~1.300đ/tin, hay bị nhà mạng chặn vì chưa đăng ký brandname
//   · ZNS ~300–500đ/tin, không bị chặn, gần như người Việt nào cũng có Zalo
//   · ZNS là API máy chủ-gọi-máy chủ nên KHÔNG dính lỗi chặn IP như đăng nhập
//     Zalo OAuth (lỗi -501) → không phải mua hosting PHP đặt tại Việt Nam
//
// CÀI ĐẶT (chủ dự án làm 1 lần):
//   1. Supabase → Authentication → Providers → bật Phone
//      (KHÔNG cần cắm Twilio — hook thay thế hoàn toàn phần gửi)
//   2. Supabase → Authentication → Hooks → Send SMS Hook
//      URI: https://coastalland.vn/api/auth/sms-hook
//      Copy chuỗi bí mật Supabase sinh ra (dạng v1,whsec_...)
//   3. Vercel → Environment Variables:
//      SUPABASE_SMS_HOOK_SECRET  = chuỗi vừa copy
//      ZALO_OA_ACCESS_TOKEN      = token Zalo OA
//      ZALO_ZNS_TEMPLATE_OTP     = mã mẫu tin OTP đã được Zalo duyệt
//   4. Redeploy
// ============================================================================
export const dynamic = "force-dynamic";

/** Mẫu ZNS "Mã OTP đăng nhập" Zalo đã duyệt — mã mẫu không phải bí mật. */
const MAU_OTP_MAC_DINH = "630638";

/**
 * Chuỗi bí mật hook nằm trong bảng `bi_mat` (giống cách token Zalo OA được giữ),
 * nên không phải cắm thêm biến môi trường mỗi lần Supabase xoay khoá.
 */
async function layHookSecret(): Promise<string | undefined> {
  const admin = createAdminClient();
  if (!admin) return undefined;
  const { data } = await admin.from("bi_mat").select("data").eq("key", "sms_hook_secret").limit(1);
  return (data?.[0]?.data as { secret?: string } | undefined)?.secret;
}

export async function POST(request: Request) {
  const secret = process.env.SUPABASE_SMS_HOOK_SECRET || (await layHookSecret());
  const templateId = process.env.ZALO_ZNS_TEMPLATE_OTP || MAU_OTP_MAC_DINH;

  // Thiếu cấu hình → trả lỗi RÕ RÀNG. Không im lặng nuốt, vì im lặng nghĩa là
  // khách bấm gửi mã mà mãi không nhận được, không ai biết vì sao.
  if (!secret) return loi("Máy chủ chưa cắm SUPABASE_SMS_HOOK_SECRET");
  if (!templateId) return loi("Máy chủ chưa cắm ZALO_ZNS_TEMPLATE_OTP");

  const raw = await request.text();

  // ── Kiểm chữ ký (chuẩn Standard Webhooks của Supabase) ────────────────────
  // Không kiểm thì bất kỳ ai cũng gọi được route này để bắt hệ thống gửi ZNS
  // — vừa tốn tiền vừa bị Zalo khoá OA vì spam.
  if (!chuKyHopLe(request, raw, secret)) {
    return NextResponse.json({ error: { message: "Chữ ký không hợp lệ" } }, { status: 401 });
  }

  let payload: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return loi("Nội dung gửi lên không đọc được");
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phone || !otp) return loi("Thiếu số điện thoại hoặc mã OTP");

  // Tên tham số phải KHỚP mẫu tin đã đăng ký với Zalo. Mẫu xác thực của Zalo
  // (ZBS 630638 "Mã OTP đăng nhập") dùng đúng chữ `otp` — trước đây chỗ này ghi
  // `ma_otp` nên Zalo sẽ trả lỗi thiếu tham số và khách không đăng nhập được.
  const kq = await guiZns(phone, templateId, { otp });

  if (!kq.daGui) {
    // Gửi mã hỏng = khách KHÔNG đăng nhập được. Gộp mọi lần hỏng vào một khoá:
    // khi Zalo sập thì cả trăm người cùng hỏng, chỉ cần một tiếng chuông.
    // LỖI ĐÃ BIẾT thì chỉ ghi sổ, KHÔNG gửi mail. Zalo chỉ cho gửi ZNS qua API từ
    // gói OA "Tăng trưởng" trở lên, nên chừng nào chưa nâng gói thì mã -120 còn
    // trả về mỗi lần khách bấm gửi mã — báo mail mỗi lần chỉ tổ đầy hòm thư và ăn
    // hết hạn mức thư trong ngày, trong khi hạn mức đó phải để dành gửi mã cho khách.
    const daBiet = /-120|permission|not have permission|-124|-201/i.test(kq.lyDo ?? "");
    await baoLoi({
      noi: "sms-hook",
      mucDo: daBiet ? "nhe" : "chet",
      tomTat: daBiet
        ? "Zalo chưa cho gửi ZNS (gói OA chưa đủ) — khách không nhận được mã qua Zalo"
        : "Không gửi được mã OTP qua Zalo — khách đang không đăng nhập được",
      chiTiet: kq.lyDo,
      hauQua: "Khách đăng nhập bằng số điện thoại sẽ không nhận được mã.",
      canLam: daBiet
        ? "Zalo chỉ cho gửi ZNS qua API từ gói OA Tăng trưởng (2,5 triệu/năm). Hoặc chuyển mã sang SMS/email — xem ghi chú trong tệp này."
        : "Kiểm tra token Zalo OA và số dư ZNS. Trong lúc chờ, bảo khách đăng nhập bằng Google hoặc email.",
    });
    // Trả lỗi để Supabase báo ngược cho khách "không gửi được mã", thay vì để
    // khách ngồi chờ một tin nhắn không bao giờ tới.
    return loi(`Không gửi được mã qua Zalo: ${kq.lyDo ?? ""}`);
  }

  return NextResponse.json({});
}

// Xem nhanh route sống chưa và đã cắm đủ khoá chưa (không gửi gì cả).
//
// Thêm ?kiem-tra-ip=1 để hỏi thẳng Zalo xem máy chủ này (Vercel, đặt ở Mỹ) có
// bị chặn theo IP không — câu hỏi sống còn của cả phương án OTP qua Zalo.
// Gọi bằng token GIẢ nên không gửi tin, không tốn tiền, không cần OA.
// Cách đọc kết quả:
//   · "Access token invalid" (-124) → Zalo chỉ chê token, KHÔNG chặn IP → chạy được
//   · lỗi nhắc tới IP / Vietnam      → bị chặn → phải có máy chủ trung chuyển tại VN
// Gọi từ máy đặt tại Việt Nam để đối chiếu thì cũng ra -124.
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("kiem-tra-ip")) {
    try {
      const res = await fetch("https://business.openapi.zalo.me/message/template", {
        method: "POST",
        headers: { access_token: "token_gia_de_thu", "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "84900000000", template_id: "000000", template_data: {} }),
        cache: "no-store",
      });
      return NextResponse.json({
        zaloTraVe: await res.json(),
        ghiChu: "Chỉ chê token = KHÔNG chặn IP. Nhắc tới IP/Vietnam = bị chặn.",
      });
    } catch (e) {
      return NextResponse.json({ loiGoi: String(e) });
    }
  }

  // ?kiem-tra-token=1 — TOKEN THẬT còn sống không, mà KHÔNG gửi tin, không tốn tiền.
  //
  // Khác hẳn ?kiem-tra-ip=1 ở trên: chỗ đó cố ý dùng token GIẢ để dò xem Zalo có
  // chặn IP máy chủ không, nên nó LUÔN trả -124 — đừng nhìn -124 ở đó rồi kết luận
  // token hỏng (đã nhầm đúng kiểu này ngày 12/09/2026).
  //
  // Ở đây lấy token thật rồi hỏi Zalo thông tin OA (getoa) — đọc thông tin thì
  // miễn phí, không đụng tới hạn mức ZNS.
  //   · error 0            → token sống, đường gửi mã OK
  //   · -124 / -216        → token chết mà web không tự làm mới được → phải cấp quyền lại OA
  //   · thiếu token        → chưa cắm ZALO_OA_APP_ID / ZALO_OA_APP_SECRET, hoặc mất refresh token
  if (new URL(request.url).searchParams.get("kiem-tra-token")) {
    try {
      const { layAccessToken } = await import("@/lib/zaloOa");
      const token = await layAccessToken();
      if (!token) return NextResponse.json({ token: "KHÔNG lấy được", canLam: "Cấp quyền lại OA ở developers.zalo.me rồi cắm ZALO_OA_REFRESH_TOKEN" });
      const res = await fetch("https://openapi.zalo.me/v2.0/oa/getoa", {
        headers: { access_token: token },
        cache: "no-store",
      });
      const kq = (await res.json()) as { error?: number; message?: string; data?: { name?: string } };
      return NextResponse.json({
        tokenLayDuoc: token.slice(0, 8) + "…",
        zaloTraVe: { error: kq.error, message: kq.message, tenOA: kq.data?.name },
        ketLuan: kq.error === 0 ? "✅ Token SỐNG — đường gửi mã qua Zalo dùng được" : "❌ Token hỏng — cần cấp quyền lại OA",
      });
    } catch (e) {
      return NextResponse.json({ loiGoi: String(e) });
    }
  }

  const secret = process.env.SUPABASE_SMS_HOOK_SECRET || (await layHookSecret());
  return NextResponse.json({
    daCauHinh: Boolean(secret),
    mauOtp: process.env.ZALO_ZNS_TEMPLATE_OTP || MAU_OTP_MAC_DINH,
    nguonBiMat: process.env.SUPABASE_SMS_HOOK_SECRET ? "bien-moi-truong" : secret ? "bang-bi_mat" : "chua-co",
  });
}

function loi(message: string) {
  // Supabase đọc đúng khuôn { error: { message } } để hiện lại cho khách.
  return NextResponse.json({ error: { message } }, { status: 500 });
}

/**
 * Chữ ký Standard Webhooks: HMAC-SHA256 của "<id>.<timestamp>.<body>",
 * khoá là phần sau "whsec_" giải mã base64.
 * Header webhook-signature có thể chứa NHIỀU chữ ký cách nhau bằng dấu cách
 * (lúc Supabase xoay khoá) — khớp một cái là hợp lệ.
 */
function chuKyHopLe(request: Request, raw: string, secret: string): boolean {
  const id = request.headers.get("webhook-id");
  const ts = request.headers.get("webhook-timestamp");
  const sig = request.headers.get("webhook-signature");
  if (!id || !ts || !sig) return false;

  // Chặn phát lại tin cũ: lệch quá 5 phút thì bỏ.
  const lech = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(lech) || lech > 300) return false;

  const khoa = Buffer.from(secret.replace(/^v1,\s*/, "").replace(/^whsec_/, ""), "base64");
  const mong = crypto.createHmac("sha256", khoa).update(`${id}.${ts}.${raw}`).digest("base64");

  return sig
    .split(" ")
    .map((p) => p.split(",").pop() ?? "")
    .some((v) => v.length === mong.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(mong)));
}
