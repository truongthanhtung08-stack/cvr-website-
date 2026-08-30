import { NextResponse } from "next/server";
import crypto from "crypto";
import { guiZns } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";

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

export async function POST(request: Request) {
  const secret = process.env.SUPABASE_SMS_HOOK_SECRET;
  const templateId = process.env.ZALO_ZNS_TEMPLATE_OTP;

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
    await baoLoi({
      noi: "sms-hook",
      mucDo: "chet",
      tomTat: "Không gửi được mã OTP qua Zalo — khách đang không đăng nhập được",
      chiTiet: kq.lyDo,
      hauQua: "Zalo là đường đăng nhập bằng số điện thoại duy nhất đang chạy.",
      canLam: "Kiểm tra token Zalo OA và số dư ZNS. Trong lúc chờ, bảo khách đăng nhập bằng Google hoặc email.",
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

  return NextResponse.json({
    daCauHinh: Boolean(process.env.SUPABASE_SMS_HOOK_SECRET && process.env.ZALO_ZNS_TEMPLATE_OTP && process.env.ZALO_OA_ACCESS_TOKEN),
    thieu: [
      !process.env.SUPABASE_SMS_HOOK_SECRET && "SUPABASE_SMS_HOOK_SECRET",
      !process.env.ZALO_OA_ACCESS_TOKEN && "ZALO_OA_ACCESS_TOKEN",
      !process.env.ZALO_ZNS_TEMPLATE_OTP && "ZALO_ZNS_TEMPLATE_OTP",
    ].filter(Boolean),
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
