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
//
// ── MẪU ĐÃ ĐĂNG KÝ VỚI ZALO (tạo 30/08/2026, OA Coastal Land · ZBS-311320) ──
//   630636  Tin đăng đã duyệt   → ten_tin, so_tien, so_du   → ZALO_ZNS_TEMPLATE_DUYET_TIN
//   630637  Nạp tiền vào ví     → so_tien, so_du            → ZALO_ZNS_TEMPLATE_NAP_TIEN
//   630638  Mã OTP đăng nhập    → otp                       → ZALO_ZNS_TEMPLATE_OTP
// Chưa tạo: mẫu tin bị từ chối (ten_tin, ly_do) · mẫu hóa đơn (so_hoa_don, so_tien).
//
// ⚠️ TÊN THAM SỐ Ở ĐÂY PHẢI KHỚP TỪNG CHỮ với mẫu bên Zalo. Sai một chữ là Zalo
// từ chối cả tin, mà hỏng lặng lẽ — khách không nhận được gì.
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
  // ── CÔNG TẮC TIẾT KIỆM ──────────────────────────────────────────────────
  // Mỗi tin ZNS tốn ~300–500đ, còn email qua Resend miễn phí tới 3.000 thư/tháng.
  // Nên THÔNG BÁO (nạp tiền, duyệt tin) mặc định chỉ gửi email. Muốn gửi kèm
  // Zalo thì đặt ZALO_THONG_BAO=1 trên Vercel.
  //
  // ⚠️ Công tắc này KHÔNG ảnh hưởng mã OTP đăng nhập — route /api/auth/sms-hook
  // gọi thẳng guiZns(), luôn gửi, vì đó là đường đăng nhập duy nhất của khách.
  if (process.env.ZALO_THONG_BAO !== "1") {
    return { kenh: "zalo", daGui: false, lyDo: "đang tắt để tiết kiệm (đặt ZALO_THONG_BAO=1 để bật)" };
  }
  if (!t.znsTemplateId) return { kenh: "zalo", daGui: false, lyDo: "chưa khai mã mẫu ZNS" };
  return guiZns(t.phone, t.znsTemplateId, t.znsData ?? {});
}

// ── GIỚI HẠN KÝ TỰ TỪNG THAM SỐ ────────────────────────────────────────────
// Mỗi tham số trong mẫu ZNS được khai một "Cài đặt kỹ thuật", và mỗi kiểu có
// giới hạn ký tự CỨNG. Gửi dài hơn → Zalo trả lỗi, tin không tới khách.
//
// Số dưới đây ĐỌC TRỰC TIẾP từ thuộc tính maxlength của ô nhập trên ZBS
// (kiểm chứng 30/08/2026), không phải phỏng đoán:
//   ten_tin  → kiểu "Tên sản phẩm / Thương hiệu"  = 200
//   ly_do    → kiểu "Tên sản phẩm / Thương hiệu"  = 200
//   so_tien  → kiểu "Số lượng / Số tiền"          =  20
//   so_du    → kiểu "Số lượng / Số tiền"          =  20
//   so_hoa_don → kiểu "Mã số"                     =  30
//   otp      → kiểu "OTP"                         =  10
//
// ⚠️ Đổi kiểu tham số bên ZBS thì phải sửa bảng này cho khớp.
const GIOI_HAN_THAM_SO: Record<string, number> = {
  ten_tin: 200,
  ly_do: 200,
  so_tien: 20,
  so_du: 20,
  so_hoa_don: 30,
  otp: 10,
};

/** Tham số Zalo đánh dấu "Loại dữ liệu: number" — phải giữ đúng dạng đã duyệt. */
const THAM_SO_TIEN = new Set(["so_tien", "so_du"]);

/**
 * Cắt cho vừa giới hạn, giữ đúng dạng tiền đã duyệt, và KHÔNG để tham số rỗng.
 *
 * · Chặn rỗng: Zalo bắt buộc mọi tham số khai trong mẫu đều phải có giá trị.
 *   Truyền chuỗi rỗng thì cả tin bị từ chối — mà hỏng lặng lẽ, khách không nhận
 *   được gì còn mình không biết. Thà hiện "—" còn hơn mất cả tin.
 *
 * · Dạng tiền: mẫu bên Zalo được duyệt với chữ "đ" thường (vd "2.268.000 đ") và
 *   ô đó Zalo ghi "Loại dữ liệu: number". Trong khi vnd() ở billing.ts sinh ra
 *   ký hiệu "₫" (U+20AB) — KHÁC ký tự. Không đổi vnd() vì nó dùng cho web và
 *   email vốn đã duyệt giao diện; chỉ nắn lại đúng tại cửa gửi ZNS.
 */
function chuanHoaThamSo(data: Record<string, string>): Record<string, string> {
  const ra: Record<string, string> = {};
  for (const [khoa, giaTri] of Object.entries(data)) {
    let s = (giaTri ?? "").toString().trim();
    if (THAM_SO_TIEN.has(khoa)) s = s.replace(/₫/g, "đ");
    const max = GIOI_HAN_THAM_SO[khoa];
    // Cắt ở ranh giới ký tự, thêm "…" để người đọc biết là còn nữa.
    const catGon = max && s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
    ra[khoa] = catGon || "—";
  }
  return ra;
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
      body: JSON.stringify({
        phone: so,
        template_id: templateId,
        template_data: chuanHoaThamSo(data),
      }),
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
