import { createAdminClient } from "@/lib/supabase/admin";

// ════════════════════════════════════════════════════════════════════════════
// BÁO SỰ CỐ — LỖI NGUY HIỂM PHẢI GÀO LÊN
//
// Trước đây các chỗ chết người chỉ `console.error` rồi đi tiếp. Log Vercel thì
// không ai ngồi canh, nên tiền lệch sổ hay khách không đăng nhập được cũng phải
// đợi tới lúc có người phát hiện — thường là quá muộn.
//
// Gọi hàm này ở ĐÚNG những chỗ đó. Nó đi hai đường, phòng khi một đường chết:
//   1. Email ngay cho ADMIN_EMAIL.
//   2. Ghi bảng `su_co` → hiện đỏ ở trang /admin (cứu được cả khi email hỏng).
//
// LUẬT SỐNG CÒN: hàm này KHÔNG BAO GIỜ được ném lỗi và KHÔNG BAO GIỜ được làm
// chậm/hỏng việc đang chạy. Báo lỗi mà làm hỏng luồng tiền thì tệ hơn cả lỗi gốc.
//
// CHỐNG BẮN LIÊN TỤC: cùng một `khoa` chỉ gửi email tối đa 1 lần/giờ. Zalo sập
// thì trăm tin ZNS cùng hỏng — bắn trăm cái mail chỉ khiến người ta tắt thông báo,
// rồi lần sau lỗi thật cũng không ai đọc. Mọi lần hỏng vẫn được GHI SỔ đầy đủ.
//
// BIẾN MÔI TRƯỜNG: RESEND_API_KEY · ADMIN_EMAIL · RESEND_FROM (dùng chung với
// thông báo admin sẵn có) · SUPABASE_SERVICE_ROLE_KEY (để ghi sổ).
// ════════════════════════════════════════════════════════════════════════════

const CACH_NHAU_MS = 60 * 60 * 1000; // 1 giờ giữa hai email cùng khoá

/** chet = mất tiền / khách không dùng được web · nang = sai lệch dữ liệu · nhe = phiền */
export type MucDo = "chet" | "nang" | "nhe";

export type SuCo = {
  /** Nơi xảy ra, viết như tên route: "duyet-tin" · "payos-webhook" · "zalo-oa". */
  noi: string;
  /** Một câu tiếng Việt, đọc là hiểu ngay chuyện gì. */
  tomTat: string;
  mucDo: MucDo;
  /** Lỗi thô của máy — cắt bớt cho gọn, chỉ để tra cứu. */
  chiTiet?: string;
  /** Không sửa thì mất gì. */
  hauQua?: string;
  /** Việc phải làm tay để cứu. */
  canLam?: string;
  /**
   * Khoá gộp email. Mặc định = noi + tomTat. Truyền tay khi muốn tách riêng
   * từng đối tượng (vd mỗi đơn hàng một khoá) để lỗi này không nuốt mất lỗi kia.
   */
  khoa?: string;
};

/**
 * Ghi sổ + gửi email cho chủ dự án. Không bao giờ ném lỗi.
 * Nơi gọi KHÔNG cần await nếu đang trong luồng tiền — nhưng trên Vercel, hàm
 * không await có thể bị cắt khi response trả về, nên cứ await cho chắc.
 */
export async function baoLoi(t: SuCo): Promise<void> {
  const khoa = t.khoa ?? `${t.noi}:${t.tomTat}`;

  // Log vẫn giữ nguyên — đây là đường tra cứu cuối cùng khi cả hai đường kia hỏng.
  console.error(`[su-co][${t.mucDo}] ${t.noi} — ${t.tomTat}`, t.chiTiet ?? "");

  try {
    const daBaoGanDay = await ghiSo(khoa, t);
    // Lỗi 'nhẹ' chỉ ghi sổ, không làm phiền hòm thư.
    if (t.mucDo !== "nhe" && !daBaoGanDay) await guiMail(khoa, t);
  } catch (e) {
    console.error("[su-co] báo lỗi thất bại (bỏ qua để không hỏng việc đang chạy):", e);
  }
}

/**
 * Ghi một dòng vào sổ sự cố.
 * Trả về true nếu cùng khoá này ĐÃ gửi email trong vòng một giờ → lần này thôi.
 * Bảng chưa tạo (chưa chạy migration 0020) → coi như chưa báo, vẫn gửi email.
 */
async function ghiSo(khoa: string, t: SuCo): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("su_co")
    .select("bao_luc")
    .eq("khoa", khoa)
    .not("bao_luc", "is", null)
    .order("xay_ra_luc", { ascending: false })
    .limit(1);

  const lanCuoi = data?.[0]?.bao_luc as string | undefined;
  const conMoi = Boolean(lanCuoi && Date.now() - new Date(lanCuoi).getTime() < CACH_NHAU_MS);

  await admin.from("su_co").insert({
    khoa,
    noi: t.noi,
    muc_do: t.mucDo,
    tom_tat: t.tomTat,
    chi_tiet: t.chiTiet?.slice(0, 2000) ?? null,
    hau_qua: t.hauQua ?? null,
    can_lam: t.canLam ?? null,
    // Đánh dấu đã báo NGAY tại đây: có gửi mail hay không thì lần sau cũng phải
    // đợi hết giờ. Ghi sau khi gửi thì hai lỗi cùng lúc sẽ gửi hai mail.
    bao_luc: t.mucDo !== "nhe" && !conMoi ? new Date().toISOString() : null,
  });

  return conMoi;
}

async function guiMail(khoa: string, t: SuCo): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const nhan = (process.env.ADMIN_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!key || nhan.length === 0) {
    console.error("[su-co] KHÔNG gửi được email: thiếu RESEND_API_KEY hoặc ADMIN_EMAIL");
    return;
  }

  const nhanMucDo = { chet: "KHẨN", nang: "Cần xử lý", nhe: "Ghi nhận" }[t.mucDo];

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "COASTAL LAND <onboarding@resend.dev>",
      to: nhan,
      subject: `[${nhanMucDo}] Sự cố: ${t.tomTat}`,
      html: dungHtml(khoa, t),
    }),
  });
}

// Thư báo lỗi: nói NGAY việc phải làm, chi tiết máy móc để xuống dưới cùng.
function dungHtml(khoa: string, t: SuCo): string {
  const vien = t.mucDo === "chet" ? "#b91c1c" : "#b45309";
  const dong = (nhan: string, giaTri: string) =>
    `<tr>
       <td style="padding:9px 12px 9px 0;color:#6e6e73;font-size:14px;white-space:nowrap;vertical-align:top">${thoat(nhan)}</td>
       <td style="padding:9px 0;color:#1d1d1f;font-size:14px;line-height:1.6">${thoat(giaTri)}</td>
     </tr>`;

  return `<div style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border-top:4px solid ${vien};padding:28px">
    <div style="font-size:13px;font-weight:700;letter-spacing:.12em;color:${vien}">SỰ CỐ HỆ THỐNG</div>
    <h1 style="margin:12px 0 0;font-size:20px;font-weight:600;color:#1d1d1f">${thoat(t.tomTat)}</h1>
    <table style="width:100%;margin-top:18px;border-collapse:collapse;border-top:1px solid #e8e8ed">
      ${dong("Xảy ra ở", t.noi)}
      ${t.hauQua ? dong("Không sửa thì", t.hauQua) : ""}
      ${t.canLam ? dong("Cần làm", t.canLam) : ""}
      ${t.chiTiet ? dong("Máy báo", t.chiTiet.slice(0, 500)) : ""}
    </table>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#86868b">
      Mã gộp: ${thoat(khoa)} — cùng mã này chỉ báo tối đa 1 lần mỗi giờ.
      Xem đầy đủ tại coastalland.vn/admin.
    </p>
  </div>
</div>`;
}

function thoat(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
