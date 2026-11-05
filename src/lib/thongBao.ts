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
//   630636  Tin đăng đã duyệt   → ten_khach_hang, ma_giao_dich, ten_tin, so_tien, so_du
//   630637  Nạp tiền vào ví     → ten_khach_hang, ma_giao_dich, so_tien, so_du
//   630638  Mã OTP đăng nhập    → otp   (ĐÃ DUYỆT 05/09/2026)
//
// Mã mẫu KHÔNG phải bí mật nên đặt cứng làm mặc định — khỏi cắm biến trên Vercel.
// Biến môi trường vẫn được ưu tiên, để đổi mẫu mà không cần sửa code.
// Chưa tạo: mẫu tin bị từ chối (ten_tin, ly_do) · mẫu hóa đơn (so_hoa_don, so_tien).
//
// ⚠️ TÊN THAM SỐ Ở ĐÂY PHẢI KHỚP TỪNG CHỮ với mẫu bên Zalo. Sai một chữ là Zalo
// từ chối cả tin, mà hỏng lặng lẽ — khách không nhận được gì.
// ════════════════════════════════════════════════════════════════════════════

import { createAdminClient } from "@/lib/supabase/admin";
import { laChuThat } from "@/lib/billing";

const ZNS_URL = "https://business.openapi.zalo.me/message/template";

/** Mã mẫu ZNS mặc định — xem bảng ở đầu file. Biến môi trường được ưu tiên hơn. */
export const MAU_NAP_TIEN = process.env.ZALO_ZNS_TEMPLATE_NAP_TIEN || "630637";
export const MAU_DUYET_TIN = process.env.ZALO_ZNS_TEMPLATE_DUYET_TIN || "630636";
// 8 mẫu ZBS gửi duyệt 25/09/2026 (nội dung + tham số: docs/MAU-ZBS-MOI.md). Mẫu chưa duyệt thì
// Zalo từ chối lặng lẽ, không tính tiền — duyệt xong là tự chạy, không phải sửa gì thêm.
export const MAU_DA_NHAN_TIN = process.env.ZALO_ZNS_TEMPLATE_DA_NHAN_TIN || "641611";
export const MAU_TU_CHOI = process.env.ZALO_ZNS_TEMPLATE_TU_CHOI || "641610";
export const MAU_CO_NGUOI_QUAN_TAM = process.env.ZALO_ZNS_TEMPLATE_QUAN_TAM || "641609";
export const MAU_SAP_HET_HAN = process.env.ZALO_ZNS_TEMPLATE_SAP_HET_HAN || "641608";
export const MAU_DA_HET_HAN = process.env.ZALO_ZNS_TEMPLATE_DA_HET_HAN || "641607";
export const MAU_THANH_TOAN = process.env.ZALO_ZNS_TEMPLATE_THANH_TOAN || "641606";
export const MAU_HOI_VIEN_SAP_HET = process.env.ZALO_ZNS_TEMPLATE_HOI_VIEN_SAP_HET || "641605";
export const MAU_BAO_CAO_TUAN = process.env.ZALO_ZNS_TEMPLATE_BAO_CAO_TUAN || "641604";
// Tag 3 Hậu mãi, gửi duyệt 02/10/2026 — tham số: ten_khach_hang, han_uu_dai.
export const MAU_UU_DAI_THANH_VIEN_MOI = process.env.ZALO_ZNS_TEMPLATE_UU_DAI_MOI || "644528";
// Tag 2 CSKH, soạn 02/10/2026 (khách dùng SĐT không có email vẫn phải nhận thông báo):
//   tin mới khớp tìm kiếm đã lưu → ten_khach_hang, so_tin, ten_tim_kiem, so_dien_thoai
//   nhắc tin nháp chưa gửi       → ten_khach_hang, ten_tin, so_dien_thoai
// Gửi duyệt 02/10/2026 — chưa duyệt thì Zalo từ chối, không tính tiền; duyệt xong tự chạy.
export const MAU_TIM_KIEM_MOI = process.env.ZALO_ZNS_TEMPLATE_TIM_KIEM_MOI || "644895";
export const MAU_TIN_NHAP = process.env.ZALO_ZNS_TEMPLATE_TIN_NHAP || "644885";

/** Mã tin hiện cho khách — giống dòng "Mã tin" trên trang tin (8 ký tự đầu của id, viết hoa). */
export const maTin = (id: string) => id.slice(0, 8).toUpperCase();

export type KetQuaKenh = {
  kenh: "email" | "zalo";
  daGui: boolean;
  lyDo?: string;
  /** Tài khoản đăng hộ, khách chưa tự vào đăng nhập → cố ý không nhắn (không phải lỗi, không báo admin). */
  dangHo?: boolean;
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
 * Gửi thông báo — CẢ EMAIL LẪN ZALO (chủ dự án 05/11/2026, thay chốt 25/09 "mỗi sự kiện một kênh"):
 *   · Khách có email thật → gửi email.
 *   · Khách có số điện thoại + sự kiện có mẫu ZBS → gửi Zalo. Có cả hai thì nhận cả hai.
 * Email kỹ thuật của khách đăng nhập Zalo (…@users.coastalland.vn) không tính là email.
 * Mã OTP không đi qua hàm này. Không bao giờ ném lỗi.
 */
export async function guiThongBao(t: NoiDungThongBao): Promise<KetQuaKenh[]> {
  // ⛔⛔ TIN ĐĂNG HỘ = CẤM MỌI TIN NHẮN TỰ ĐỘNG (chủ dự án 31/10/2026): tin admin đăng hộ đứng tên tài khoản đăng hộ
  // (tao_ho) — khách CHƯA tự vào đăng nhập → máy KHÔNG nhắn gì (Zalo lẫn email), không báo lỗi; chủ dự án tự nhắn
  // hàng loạt qua ZBS. KHÁCH TỰ VÀO ĐĂNG NHẬP (vao_chinh_thuc_luc có giá trị) thì mới áp dụng nhắn tự động.
  // Mã OTP không đi qua hàm này nên không bị chặn.
  if (await laDangHoChuaVao(t.email, t.phone)) {
    const lyDo = "tài khoản đăng hộ, khách chưa tự vào đăng nhập — không nhắn";
    return [{ kenh: "email", daGui: false, lyDo, dangHo: true }, { kenh: "zalo", daGui: false, lyDo, dangHo: true }];
  }
  // GỬI CẢ HAI KÊNH (chủ dự án 05/11/2026, thay chốt 25/09 "mỗi sự kiện một kênh"): khách có email → email; có số
  // điện thoại → Zalo ZBS. Có cả hai thì nhận cả hai. Chi phí: mỗi tin ZBS ~300–500đ theo số tin thật gửi đi.
  const emailThat = t.email && !/@users\.coastalland\.vn$/i.test(t.email) ? t.email : null;
  const ketQua = await Promise.all([guiEmail({ ...t, email: emailThat }), guiZalo(t)]);
  for (const k of ketQua) {
    if (!k.daGui && k.lyDo) console.warn(`[thong-bao] ${k.kenh}: ${k.lyDo}`);
  }
  // ZALO GỬI HỎNG (khách có số, sự kiện có mẫu) → GHI SỰ CỐ, hiện Admin → Tổng quan, KHÔNG email (06/11/2026: duyệt tin xong khách
  // không nhận Zalo mà không ai biết lý do — trước đây chỉ ghi khi CẢ HAI kênh hỏng). Cùng một lỗi gộp một dòng mỗi giờ (khoá).
  // EMAIL GỬI HỎNG (khách có email thật, Resend trả lỗi) → cũng ghi sự cố, cùng cách Zalo bên dưới — không để lỗi chìm
  const mail = ketQua.find((k) => k.kenh === "email");
  if (mail && !mail.daGui && emailThat && mail.lyDo) {
    const { baoLoi } = await import("@/lib/baoLoi");
    await baoLoi({
      noi: "thong-bao-email",
      mucDo: "nhe",
      tomTat: `Gửi email cho khách không được: ${t.tieuDe}`,
      chiTiet: mail.lyDo.slice(0, 300),
      hauQua: "Khách không nhận email (Zalo vẫn gửi nếu khách có số).",
      canLam: "Xem lỗi Resend ở dòng chi tiết (hết hạn mức, khoá sai, địa chỉ gửi chưa xác minh…).",
      khoa: `email:${mail.lyDo.slice(0, 40)}`,
    }).catch(() => {});
  }
  const zalo = ketQua.find((k) => k.kenh === "zalo");
  if (zalo && !zalo.daGui && t.phone && t.znsTemplateId && zalo.lyDo && !/đang tắt/.test(zalo.lyDo)) {
    const { baoLoi } = await import("@/lib/baoLoi");
    await baoLoi({
      noi: "thong-bao-zalo",
      mucDo: "nhe",
      tomTat: `Gửi Zalo cho khách không được: ${t.tieuDe}`,
      chiTiet: `Mẫu ${t.znsTemplateId} · ${zalo.lyDo}`,
      hauQua: "Khách không nhận tin Zalo (email vẫn gửi nếu khách có email).",
      canLam: "Xem mã lỗi Zalo ở dòng chi tiết; lỗi mẫu tin thì sửa tham số, lỗi tài khoản ZBS thì nạp tiền / cấp lại quyền.",
      khoa: `zalo:${t.znsTemplateId}:${zalo.lyDo.slice(0, 40)}`,
    }).catch(() => {});
  }
  return ketQua;
}

// Một lượt đọc profiles mỗi thông báo (vài chục lượt/ngày — trong hạn mức Supabase Pro). Không đọc được → coi như khách thường.
async function laDangHoChuaVao(email?: string | null, phone?: string | null): Promise<boolean> {
  const db = createAdminClient();
  if (!db || (!email && !phone)) return false;
  const q = db.from("profiles").select("tao_ho,vao_chinh_thuc_luc").limit(1);
  const { data } = await (email ? q.eq("email", email) : q.eq("phone", phone as string));
  return Boolean(data?.[0]) && !laChuThat(data?.[0]);
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
  // 05/09/2026 — ĐẢO MẶC ĐỊNH THÀNH BẬT: mã mẫu đã đặt cứng trong code (xem
  // MAU_NAP_TIEN / MAU_DUYET_TIN) nên không còn gì phải cắm trên Vercel; muốn
  // tắt gấp cho đỡ tốn thì đặt ZALO_THONG_BAO=0.
  //
  // ⚠️ Công tắc này KHÔNG ảnh hưởng mã OTP đăng nhập — route /api/auth/sms-hook
  // gọi thẳng guiZns(), luôn gửi, vì đó là đường đăng nhập duy nhất của khách.
  if (process.env.ZALO_THONG_BAO === "0") {
    return { kenh: "zalo", daGui: false, lyDo: "đang tắt để tiết kiệm (bỏ ZALO_THONG_BAO=0 để bật lại)" };
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
//   ten_khach_hang → kiểu "Tên khách hàng"        =  30
//   ma_giao_dich   → kiểu "Mã số"                 =  30
//
// ⚠️ Đổi kiểu tham số bên ZBS thì phải sửa bảng này cho khớp.
const GIOI_HAN_THAM_SO: Record<string, number> = {
  ten_tin: 200,
  ly_do: 200,
  so_tien: 20,
  so_du: 20,
  so_hoa_don: 30,
  ten_khach_hang: 30,
  ma_giao_dich: 30,
  otp: 10,
  // tham số của 8 mẫu gửi duyệt 25/09 (kiểu kỹ thuật khai trên ZBS — docs/MAU-ZBS-MOI.md)
  ma_tin: 30,
  ten_dich_vu: 200,
  goi_tin: 30,
  ten_goi: 30,
  thoi_gian: 20,
  ngay_het_han: 20,
  tu_ngay: 20,
  den_ngay: 20,
  so_ngay: 20,
  so_luot: 20,
  so_voucher: 20,
  so_tin: 20,
  luot_hien_thi: 20,
  luot_xem: 20,
  luot_xem_so: 20,
};

/** Tham số Zalo đánh dấu "Loại dữ liệu: number" — phải giữ đúng dạng đã duyệt. */
// Ô KIỂU SỐ (NUMBER) trong mẫu ZBS — đọc thẳng cấu hình mẫu trên Zalo 06/11/2026 (template/info): Zalo CHỈ NHẬN CHỮ SỐ.
// Gửi "64.800đ" / "0đ" → -1124 "so_tien has invalid format" (gửi thử thật 06/11/2026: "0đ" lỗi, "64.800đ" lỗi, "0" nhận) → khách
// nạp tiền, được duyệt tin, thanh toán đều KHÔNG nhận Zalo. Đổi kiểu ô bên ZBS thì sửa bảng này.
const THAM_SO_SO = new Set(["so_tien", "so_du", "so_luot", "so_ngay", "so_tin", "luot_hien_thi", "luot_xem", "luot_xem_so"]);

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
// ── CẤU HÌNH 13 MẪU ZBS — ĐỌC THẲNG TỪ ZALO 06/11/2026 (template/info/v2) ─────────────────────────────────────────────
// SỬA TẬN GỐC (chủ dự án 06/11/2026): web gửi ĐÚNG Y mẫu Zalo cho mọi tin, không phụ thuộc từng chỗ gọi — ô thiếu tự điền giá trị
// hợp lệ, ô thừa bỏ, ô kiểu số chỉ chữ số, cắt đúng giới hạn. Một ô sai là Zalo bỏ CẢ TIN (khách không nhận gì).
// Đổi / thêm mẫu bên ZBS → đọc lại template/info rồi sửa bảng này (tên ô : kiểu : dài tối đa).
const MAU_ZBS: Record<string, string> = {
  "630637": "so_tien:NUMBER:20 so_du:NUMBER:20 ten_khach_hang:STRING:30 ma_giao_dich:STRING:30",
  "630636": "ten_tin:STRING:200 so_tien:NUMBER:20 so_du:NUMBER:20 ten_khach_hang:STRING:30 ma_giao_dich:STRING:30",
  "641611": "ten_khach_hang:STRING:30 ma_tin:STRING:30 ten_tin:STRING:200 thoi_gian:DATE:20",
  "641610": "ten_khach_hang:STRING:30 ma_tin:STRING:30 ten_tin:STRING:200 ly_do:STRING:200",
  "641609": "ten_khach_hang:STRING:30 ten_tin:STRING:200 thoi_gian:DATE:20 so_luot:NUMBER:20 so_dien_thoai:STRING:15",
  "641608": "ten_khach_hang:STRING:30 so_ngay:NUMBER:20 ma_tin:STRING:30 ten_tin:STRING:200 goi_tin:STRING:30 ngay_het_han:DATE:20",
  "641607": "ten_khach_hang:STRING:30 ngay_het_han:DATE:20 ma_tin:STRING:30 ten_tin:STRING:200",
  "641606": "ten_khach_hang:STRING:30 ma_giao_dich:STRING:30 ten_dich_vu:STRING:200 so_tien:NUMBER:20 so_du:NUMBER:20 thoi_gian:DATE:20",
  "641605": "ten_khach_hang:STRING:30 so_ngay:NUMBER:20 ten_goi:STRING:200 ngay_het_han:DATE:20 so_dien_thoai:STRING:15",
  "641604": "ten_khach_hang:STRING:30 tu_ngay:DATE:20 den_ngay:DATE:20 so_tin:NUMBER:20 luot_hien_thi:NUMBER:20 luot_xem:NUMBER:20 luot_xem_so:NUMBER:20 so_dien_thoai:STRING:15",
  "644528": "ten_khach_hang:STRING:30 han_uu_dai:DATE:20",
  "644895": "ten_khach_hang:STRING:30 so_dien_thoai:STRING:15 so_tin:NUMBER:20 ten_tim_kiem:STRING:200",
  "644885": "ten_khach_hang:STRING:30 so_dien_thoai:STRING:15 ten_tin:STRING:200",
};

/** Khớp dữ liệu với ĐÚNG mẫu Zalo: đủ ô bắt buộc, bỏ ô thừa, đúng kiểu, đúng độ dài. Mẫu lạ (vd OTP) để nguyên. */
export function khopMauZbs(templateId: string, data: Record<string, string>, phone?: string | null): Record<string, string> {
  const mau = MAU_ZBS[templateId];
  if (!mau) return chuanHoaThamSo(data);
  const ra: Record<string, string> = {};
  const homNay = new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
  for (const o of mau.split(" ")) {
    const [ten, kieu, dai] = o.split(":");
    let v = String(data[ten] ?? "").trim();
    if (kieu === "NUMBER") { const so = v.replace(/[^\d]/g, ""); v = so ? String(Number(so)) : "0"; }
    else if (!v) v = ten === "ten_khach_hang" ? "Quý khách" : ten === "so_dien_thoai" ? (soDienThoaiHien(phone) || "—") : kieu === "DATE" ? homNay : "—";
    const max = Number(dai);
    ra[ten] = max && v.length > max ? v.slice(0, max).trimEnd() : v;
  }
  return ra;
}

/** Số hiện cho khách đọc (0905…) — dùng điền ô so_dien_thoai khi nơi gọi không truyền */
function soDienThoaiHien(phone?: string | null): string {
  const d = String(phone ?? "").replace(/\D/g, "");
  return d.startsWith("84") ? `0${d.slice(2)}` : d;
}

function chuanHoaThamSo(data: Record<string, string>): Record<string, string> {
  const ra: Record<string, string> = {};
  for (const [khoa, giaTri] of Object.entries(data)) {
    let s = (giaTri ?? "").toString().trim();
    // Tiền gửi ĐÚNG dạng mẫu khai trên ZBS: "64.800đ" — số có dấu chấm nghìn, "đ" liền sau, không khoảng trắng
    // (docs/MAU-ZBS-MOI.md). 26/10/2026 Zalo trả -1124 "so_tien has invalid format" với "0 đ" (tin miễn phí).
    if (THAM_SO_SO.has(khoa)) {
      const so = s.replace(/[^\d]/g, ""); // chỉ chữ số: "64.800 ₫" → "64800", "0 ₫" → "0"
      s = so ? String(Number(so)) : "0";
    }
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

  const goiZalo = async (accessToken: string) => {
    const res = await fetch(ZNS_URL, {
      method: "POST",
      headers: { access_token: accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: so,
        template_id: templateId,
        template_data: khopMauZbs(templateId, data, phone),
      }),
    });
    // Zalo trả HTTP 200 kèm error !== 0 khi hỏng → phải xem thân trả về, không xem status.
    return (await res.json()) as { error?: number; message?: string };
  };

  try {
    let kq = await goiZalo(token);

    // ── ZALO CHÊ TOKEN → LÀM MỚI RỒI THỬ LẠI ĐÚNG MỘT LẦN ───────────────────
    // Đo thật 12/09/2026: Zalo trả -124 "Access token invalid" trong khi kho vẫn
    // ghi token còn hạn 11 tiếng nữa. Token bị vô hiệu sớm hơn hạn đã lưu (cấp
    // quyền lại OA ở nơi khác, Zalo thu hồi…). Trước đây gặp vậy là bỏ cuộc luôn,
    // mà lần sau gọi lại vẫn lấy đúng token chết đó ra dùng — hỏng vĩnh viễn, khách
    // bấm gửi mã bao nhiêu lần cũng không nhận được, không ai biết vì sao.
    //   -124 access token invalid · -216 access token expired
    if (kq.error === -124 || kq.error === -216) {
      const { layAccessToken } = await import("@/lib/zaloOa");
      const tokenMoi = await layAccessToken(true); // bỏ qua hạn đang lưu, làm mới ngay
      if (tokenMoi && tokenMoi !== token) kq = await goiZalo(tokenMoi);
    }

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
