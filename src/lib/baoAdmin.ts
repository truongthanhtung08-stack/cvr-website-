// ════════════════════════════════════════════════════════════════════════════
// EMAIL BÁO ADMIN — chủ dự án chốt 02/10/2026: chỉ báo qua EMAIL CÔNG TY.
// Người nhận: ADMIN_EMAIL (nếu có cắm trên Vercel), không thì hotro@coastalland.vn.
// Không bao giờ ném lỗi — báo hỏng thì ghi log, việc đang chạy vẫn đi tiếp.
// ════════════════════════════════════════════════════════════════════════════
const SITE = "https://coastalland.vn";

export type KhoiBao = { tieuDe: string; dong: string[]; link?: string; nhanLink?: string };

const thoat = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function html(chuDe: string, khoi: KhoiBao[]) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;color:#1d1d1f">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6e6e73">COASTAL LAND · Quản trị</p>
  <h2 style="margin:0 0 18px;font-size:20px;font-weight:600;letter-spacing:-.02em">${thoat(chuDe)}</h2>
  ${khoi
    .map(
      (k) => `<h3 style="margin:18px 0 6px;font-size:15px;font-weight:600">${thoat(k.tieuDe)}</h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.6">${k.dong
    .map((d) => `<tr><td style="padding:5px 0;border-bottom:1px solid #e5e5e7">${thoat(d)}</td></tr>`)
    .join("")}</table>${
        k.link
          ? `<p style="margin:10px 0 0"><a href="${SITE}${k.link}" style="color:#0071e3;font-size:14px;font-weight:600;text-decoration:none">${thoat(k.nhanLink ?? "Mở trang quản trị")} →</a></p>`
          : ""
      }`,
    )
    .join("")}
</div>`;
}

export async function baoAdmin(chuDe: string, khoi: KhoiBao[]): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !khoi.length) return false;
  const nhan = (process.env.ADMIN_EMAIL || "hotro@coastalland.vn").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "COASTAL LAND <no-reply@coastalland.vn>",
        to: nhan,
        subject: `[COASTAL LAND] ${chuDe}`,
        html: html(chuDe, khoi),
      }),
    });
    if (!res.ok) console.error("[bao-admin] Resend lỗi:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[bao-admin]", e);
    return false;
  }
}
