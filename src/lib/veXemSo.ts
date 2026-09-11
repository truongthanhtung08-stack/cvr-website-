import crypto from "crypto";

// ════════════════════════════════════════════════════════════════════════════
// VÉ XEM SỐ — xác thực MỘT LẦN, dùng cho mọi tin sau đó
// ----------------------------------------------------------------------------
// Bắt nhập lại mã ở từng tin thì không ai chịu nổi: khách đang so ba bốn tin,
// mỗi lần muốn gọi lại phải chờ mã một lần nữa. Các sàn lớn đều nhớ lần xác thực
// đầu tiên trong một thời gian.
//
// Vé là một chuỗi tự chứng minh, KHÔNG cần lưu bảng nào trong CSDL:
//     <sdt>.<hết hạn>.<chữ ký HMAC-SHA256 của hai phần trên>
// Máy chủ ký bằng khoá bí mật, nên khách không tự chế được vé mang số người khác.
// Đổi khoá là mọi vé cũ hết hiệu lực ngay.
//
// Vé chỉ nói "số này đã xác thực", KHÔNG phải phiên đăng nhập: nó không mở được
// tài khoản, không đọc được ví, không đăng được tin.
// ════════════════════════════════════════════════════════════════════════════

const HAN_NGAY = 30;

// Khoá ký: dùng khoá quản trị sẵn có trên máy chủ. Thiếu thì không phát vé —
// thà bắt nhập mã mỗi lần còn hơn phát ra thứ ai cũng giả được.
function khoa(): string | null {
  return process.env.VE_XEM_SO_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

function ky(phan: string, k: string): string {
  return crypto.createHmac("sha256", k).update(phan).digest("base64url");
}

/** Phát vé cho một số đã xác thực xong. Không có khoá ký → trả null. */
export function phatVe(sdt: string): string | null {
  const k = khoa();
  if (!k) return null;
  const han = Date.now() + HAN_NGAY * 86_400_000;
  const phan = `${sdt}.${han}`;
  return `${phan}.${ky(phan, k)}`;
}

/** Đọc vé, trả về số điện thoại nếu vé thật và còn hạn. Sai/hết hạn → null. */
export function docVe(ve: string | undefined | null): string | null {
  const k = khoa();
  if (!k || !ve) return null;

  const phan = ve.split(".");
  if (phan.length !== 3) return null;
  const [sdt, hanStr, chuKy] = phan;

  const han = Number(hanStr);
  if (!Number.isFinite(han) || Date.now() > han) return null;

  // So chữ ký theo kiểu chống dò thời gian.
  const dung = ky(`${sdt}.${hanStr}`, k);
  const a = Buffer.from(chuKy);
  const b = Buffer.from(dung);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return sdt;
}
