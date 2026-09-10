import "server-only";
import { createHash, randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// MÃ XÁC THỰC (OTP) — PHÁT MÃ · GỬI · KIỂM MÃ
//
// Dùng cho: đăng ký bằng số điện thoại · đăng ký bằng email · quên mật khẩu ·
// xác minh số điện thoại thứ hai.
//
// Đường gửi: EMAIL trước (Resend — web đã có khoá, không giới hạn ngặt nghèo),
// Zalo là dự phòng cho khách không có email. Chủ dự án chốt thứ tự này vì rất
// nhiều môi giới lớn tuổi không dùng email, nhưng ai cũng có Zalo.
//
// ⚠ CHỈ CHẠY Ở MÁY CHỦ. Mã và khoá service_role không được lọt xuống trình duyệt.
// Cần bảng của migration 0025_ma_xac_thuc.sql.
// ============================================================================

const SONG_PHUT = 10;      // mã sống 10 phút
const SAI_TOI_DA = 5;      // nhập sai quá số này là huỷ mã
const CHO_GIUA_2_LAN = 60; // giây — chặn bấm "gửi lại" liên tục

export type Kenh = "email" | "zalo";
export type Viec = "dang-ky" | "quen-mat-khau" | "xac-minh-sdt";

const bam = (ma: string) => createHash("sha256").update(ma).digest("hex");

// Mã 6 chữ số, sinh bằng bộ ngẫu nhiên AN TOÀN của hệ điều hành.
// KHÔNG dùng Math.random(): đoán được dãy số là đoán được mã của người khác.
function sinhMa(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type KetQuaPhat = { ok: true; ma: string } | { ok: false; loi: string };

// Phát một mã mới cho (định danh + việc). Trả về mã THÔ để nơi gọi đem đi gửi —
// mã thô không bao giờ được ghi xuống cơ sở dữ liệu hay log.
export async function phatMa(dinhDanh: string, kenh: Kenh, viec: Viec): Promise<KetQuaPhat> {
  const db = createAdminClient();
  if (!db) return { ok: false, loi: "Hệ thống xác thực chưa sẵn sàng." };

  // Chặn spam: vừa gửi cách đây chưa tới 60 giây thì thôi.
  const { data: ganDay } = await db
    .from("ma_xac_thuc")
    .select("created_at")
    .eq("dinh_danh", dinhDanh)
    .eq("viec", viec)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ganDay?.created_at) {
    const cach = (Date.now() - new Date(ganDay.created_at).getTime()) / 1000;
    if (cach < CHO_GIUA_2_LAN) {
      return { ok: false, loi: `Vui lòng đợi ${Math.ceil(CHO_GIUA_2_LAN - cach)} giây rồi gửi lại.` };
    }
  }

  const ma = sinhMa();
  const { error } = await db.from("ma_xac_thuc").insert({
    dinh_danh: dinhDanh,
    kenh,
    viec,
    ma_bam: bam(ma),
    het_han_luc: new Date(Date.now() + SONG_PHUT * 60_000).toISOString(),
  });
  if (error) return { ok: false, loi: "Không tạo được mã xác thực." };

  // Dọn mã cũ ngay tại đây — Vercel Hobby chỉ cho 2 cron và đã dùng hết.
  await db.rpc("don_ma_xac_thuc_cu");

  return { ok: true, ma };
}

export type KetQuaKiem = { ok: true } | { ok: false; loi: string };

// Kiểm mã. Đúng thì đánh dấu ĐÃ DÙNG ngay trong lượt này — một mã không bao giờ
// dùng được hai lần.
export async function kiemMa(dinhDanh: string, viec: Viec, ma: string): Promise<KetQuaKiem> {
  const db = createAdminClient();
  if (!db) return { ok: false, loi: "Hệ thống xác thực chưa sẵn sàng." };

  const { data: dong } = await db
    .from("ma_xac_thuc")
    .select("id,ma_bam,het_han_luc,so_lan_sai,da_dung")
    .eq("dinh_danh", dinhDanh)
    .eq("viec", viec)
    .eq("da_dung", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dong) return { ok: false, loi: "Chưa có mã nào đang chờ. Bấm gửi mã rồi thử lại." };
  if (new Date(dong.het_han_luc).getTime() < Date.now())
    return { ok: false, loi: "Mã đã hết hạn. Bấm gửi lại mã mới." };
  if (dong.so_lan_sai >= SAI_TOI_DA)
    return { ok: false, loi: "Nhập sai quá nhiều lần. Bấm gửi lại mã mới." };

  if (dong.ma_bam !== bam((ma ?? "").trim())) {
    await db.from("ma_xac_thuc").update({ so_lan_sai: dong.so_lan_sai + 1 }).eq("id", dong.id);
    const con = SAI_TOI_DA - dong.so_lan_sai - 1;
    return { ok: false, loi: con > 0 ? `Mã không đúng. Còn ${con} lần thử.` : "Nhập sai quá nhiều lần. Bấm gửi lại mã mới." };
  }

  await db.from("ma_xac_thuc").update({ da_dung: true }).eq("id", dong.id);
  return { ok: true };
}

// ─── GỬI MÃ QUA ZALO (ZNS) ──────────────────────────────────────────────────
// Mẫu 630638 "Mã OTP đăng nhập" (Zalo duyệt 05/09/2026), tham số: otp.
//
// Đây là đường dành cho khách CHỈ CÓ SỐ ĐIỆN THOẠI — nhóm đông nhất của web, rất
// nhiều môi giới không dùng email. Số điện thoại mới là định danh chính.
//
// Hiện ZNS chưa gửi được vì số dư ZBS = 0đ; hàm vẫn gọi thật và trả lý do thật
// để nơi gọi xử lý đàng hoàng. Ngày chủ dự án nạp tiền là chạy ngay, KHÔNG phải
// sửa một dòng nào ở đây.
export async function guiMaQuaZalo(sdt: string, ma: string): Promise<{ ok: boolean; loi?: string }> {
  try {
    const { guiZns } = await import("@/lib/thongBao");
    const kq = await guiZns(sdt, MAU_OTP, { otp: ma });
    return kq.daGui ? { ok: true } : { ok: false, loi: kq.lyDo || "Không gửi được mã qua Zalo." };
  } catch {
    return { ok: false, loi: "Không gửi được mã qua Zalo." };
  }
}

export const MAU_OTP = process.env.ZALO_ZNS_TEMPLATE_OTP || "630638";

// ─── GỬI MÃ QUA EMAIL (Resend) ──────────────────────────────────────────────
// Thư ngắn, nói đúng việc: mã là gì, sống bao lâu, và câu nhắc không đưa mã cho
// ai. Không thêm quảng cáo, không thêm liên kết — thư có liên kết lạ dễ bị nhà
// cung cấp mail xếp vào thư rác, mà đây là thư khách đang chờ từng giây.
export async function guiMaQuaEmail(email: string, ma: string, viec: Viec): Promise<{ ok: boolean; loi?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "COASTAL LAND <no-reply@coastalland.vn>";
  if (!key) return { ok: false, loi: "Chưa cắm khoá gửi email." };

  const tieuDe =
    viec === "quen-mat-khau" ? `${ma} là mã đặt lại mật khẩu Coastal Land` : `${ma} là mã xác thực Coastal Land`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#1d1d1f">
        ${viec === "quen-mat-khau" ? "Mã đặt lại mật khẩu" : "Mã xác thực"} tài khoản Coastal Land của bạn:
      </p>
      <p style="margin:0 0 16px;font-size:34px;font-weight:700;letter-spacing:8px;color:#1d1d1f">${ma}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#6e6e73">Mã có hiệu lực trong ${SONG_PHUT} phút.</p>
      <p style="margin:0;font-size:14px;color:#6e6e73">
        Nhân viên Coastal Land không bao giờ hỏi mã này. Không đưa mã cho bất kỳ ai.
      </p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: tieuDe, html }),
    });
    if (!res.ok) return { ok: false, loi: "Không gửi được email. Kiểm tra lại địa chỉ email." };
    return { ok: true };
  } catch {
    return { ok: false, loi: "Không gửi được email." };
  }
}
