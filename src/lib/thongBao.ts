// ════════════════════════════════════════════════════════════════════════════
// THÔNG BÁO CHO KHÁCH — MỘT HÀM, HAI KÊNH (Email + Zalo ZNS)
//
// Dùng cho các mốc BẮT BUỘC phải báo khách:
//   · Nạp tiền thành công        → số tiền + số dư mới
//   · Tin được duyệt, lên sóng   → gói, kỳ hạn, tiền đã trừ, số dư còn lại
//
// NGUYÊN TẮC SỐNG CÒN: hàm này KHÔNG BAO GIỜ được làm hỏng luồng tiền.
// Kênh nào chưa cắm khoá thì lặng lẽ bỏ qua; gửi lỗi thì ghi log rồi đi tiếp.
// Tiền đã vào ví của khách rồi thì không thể vì "gửi mail hỏng" mà báo lỗi ngược
// cho PayOS được — sẽ thành cộng ví hai lần.
//
// BIẾN MÔI TRƯỜNG (cắm ở Vercel → Settings → Environment Variables):
//   RESEND_API_KEY              khoá Resend (ĐÃ CÓ, dùng chung với thông báo admin)
//   RESEND_FROM                 vd "COASTAL LAND <no-reply@coastalland.vn>"
//                               ⚠️ Còn để onboarding@resend.dev thì CHỈ gửi được về
//                               email đã đăng ký Resend — khách KHÔNG nhận được.
//                               Phải xác minh tên miền coastalland.vn trong Resend.
//   ZALO_OA_ACCESS_TOKEN        access token của Zalo OA (không phải app đăng nhập Zalo)
//   ZALO_ZNS_TEMPLATE_NAP_TIEN  mã mẫu tin ZNS "nạp tiền thành công" (Zalo duyệt trước)
//   ZALO_ZNS_TEMPLATE_DUYET_TIN mã mẫu tin ZNS "tin đã lên sóng"
// ════════════════════════════════════════════════════════════════════════════

const ZNS_URL = "https://business.openapi.zalo.me/message/template";

export type KetQuaKenh = {
  kenh: "email" | "zalo";
  daGui: boolean;
  lyDo?: string;
};

export type NoiDungThongBao = {
  email?: string | null;
  phone?: string | null;
  /** Tiêu đề thư — cũng là dòng đầu trong thân thư. */
  tieuDe: string;
  /** Các dòng "Nhãn: giá trị" hiện trong bảng, vd { nhan: "Số dư", giaTri: "7.200.000đ" } */
  cacDong: { nhan: string; giaTri: string }[];
  /** Câu dẫn phía trên bảng. */
  loiNhan?: string;
  /** Mã mẫu tin ZNS đã được Zalo duyệt. Không truyền → bỏ qua kênh Zalo. */
  znsTemplateId?: string;
  /** Dữ liệu điền vào mẫu ZNS — tên trường phải khớp mẫu đã đăng ký với Zalo. */
  znsData?: Record<string, string>;
};

/** Số điện thoại VN → dạng Zalo yêu cầu (84xxxxxxxxx). Không hợp lệ → null. */
export function soDienThoaiZalo(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const so = phone.replace(/[^\d]/g, "");
  if (so.startsWith("84") && so.length >= 11) return so;
  if (so.startsWith("0") && so.length >= 10) return `84${so.slice(1)}`;
  if (so.length === 9) return `84${so}`;
  return null;
}

/**
 * Gửi thông báo qua mọi kênh đang cắm khoá. Không bao giờ ném lỗi.
 * Trả về kết quả từng kênh để nơi gọi ghi log.
 */
export async function guiThongBao(t: NoiDungThongBao): Promise<KetQuaKenh[]> {
  const ketQua = await Promise.all([guiEmail(t), guiZalo(t)]);
  for (const k of ketQua) {
    if (!k.daGui && k.lyDo) console.warn(`[thong-bao] ${k.kenh}: ${k.lyDo}`);
  }
  return ketQua;
}

// ── EMAIL (Resend) ──────────────────────────────────────────────────────────
async function guiEmail(t: NoiDungThongBao): Promise<KetQuaKenh> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { kenh: "email", daGui: false, lyDo: "chưa cắm RESEND_API_KEY" };
  if (!t.email) return { kenh: "email", daGui: false, lyDo: "khách không có email" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "COASTAL LAND <onboarding@resend.dev>",
        to: [t.email],
        subject: `[COASTAL LAND] ${t.tieuDe}`,
        html: dungHtml(t),
      }),
    });
    if (!res.ok) return { kenh: "email", daGui: false, lyDo: `Resend ${res.status}: ${await res.text()}` };
    return { kenh: "email", daGui: true };
  } catch (e) {
    return { kenh: "email", daGui: false, lyDo: String(e) };
  }
}

// ── ZALO ZNS ────────────────────────────────────────────────────────────────
// LƯU Ý: đây là Zalo OA + ZNS, KHÁC HẲN app đăng nhập Zalo (ZALO_APP_ID).
// Mẫu tin phải được Zalo duyệt trước; mỗi tin tốn ~300–500đ.
async function guiZalo(t: NoiDungThongBao): Promise<KetQuaKenh> {
  if (!t.znsTemplateId) return { kenh: "zalo", daGui: false, lyDo: "chưa khai mã mẫu ZNS" };
  return guiZns(t.phone, t.znsTemplateId, t.znsData ?? {});
}

/**
 * Gửi một tin ZNS bất kỳ. Dùng chung cho thông báo VÀ cho mã OTP đăng nhập
 * (route /api/auth/sms-hook gọi hàm này).
 */
export async function guiZns(
  phone: string | null | undefined,
  templateId: string,
  data: Record<string, string>,
): Promise<KetQuaKenh> {
  // Access token Zalo OA chỉ sống 1 giờ nên KHÔNG cắm cứng — layAccessToken()
  // tự làm mới và tự lưu bản mới. Vẫn cho phép đè bằng ZALO_OA_ACCESS_TOKEN
  // khi cần thử tay.
  const { layAccessToken } = await import("@/lib/zaloOa");
  const token = process.env.ZALO_OA_ACCESS_TOKEN || (await layAccessToken());
  if (!token) return { kenh: "zalo", daGui: false, lyDo: "chưa lấy được access token Zalo OA" };

  const so = soDienThoaiZalo(phone);
  if (!so) return { kenh: "zalo", daGui: false, lyDo: "số điện thoại không hợp lệ" };

  try {
    const res = await fetch(ZNS_URL, {
      method: "POST",
      headers: { access_token: token, "Content-Type": "application/json" },
      body: JSON.stringify({ phone: so, template_id: templateId, template_data: data }),
    });
    const kq = (await res.json()) as { error?: number; message?: string };
    // Zalo trả HTTP 200 kèm error !== 0 khi hỏng → phải xem thân trả về, không xem status.
    if (kq.error && kq.error !== 0) {
      return { kenh: "zalo", daGui: false, lyDo: `ZNS lỗi ${kq.error}: ${kq.message ?? ""}` };
    }
    return { kenh: "zalo", daGui: true };
  } catch (e) {
    return { kenh: "zalo", daGui: false, lyDo: String(e) };
  }
}

// ── MẪU THƯ ─────────────────────────────────────────────────────────────────
// Thư đơn sắc, không ảnh, không script — để không rơi vào hộp thư rác.
function dungHtml(t: NoiDungThongBao): string {
  const dong = t.cacDong
    .map(
      (d) =>
        `<tr>
           <td style="padding:9px 0;color:#6e6e73;font-size:14px">${thoat(d.nhan)}</td>
           <td style="padding:9px 0;color:#1d1d1f;font-size:14px;font-weight:600;text-align:right">${thoat(d.giaTri)}</td>
         </tr>`,
    )
    .join("");

  return `<div style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
    <div style="font-size:13px;font-weight:700;letter-spacing:.12em;color:#6e6e73">COASTAL LAND</div>
    <h1 style="margin:12px 0 0;font-size:20px;font-weight:600;color:#1d1d1f">${thoat(t.tieuDe)}</h1>
    ${t.loiNhan ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#6e6e73">${thoat(t.loiNhan)}</p>` : ""}
    <table style="width:100%;margin-top:18px;border-collapse:collapse;border-top:1px solid #e8e8ed">${dong}</table>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#86868b">
      Thư tự động từ coastalland.vn — vui lòng không trả lời thư này.
    </p>
  </div>
</div>`;
}

function thoat(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
