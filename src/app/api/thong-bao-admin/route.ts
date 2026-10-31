import { NextResponse } from "next/server";

// ============================================================================
// THÔNG BÁO CHO ADMIN QUA EMAIL
// ----------------------------------------------------------------------------
// Có tin mới chờ duyệt · dự án mới chờ duyệt · yêu cầu khách mới → gửi email
// ngay cho chủ dự án, không phải vào admin ngồi canh.
//
// CÁCH CHẠY: Supabase gọi vào đây mỗi khi có dòng mới trong bảng
// (Database → Webhooks). Nhờ vậy KHÔNG phải sửa các form đăng tin/dự án đang
// chạy tốt, và bắt được cả tin tạo từ nơi khác (nhập hàng loạt, admin, API).
//
// BIẾN MÔI TRƯỜNG cần đặt trên Vercel:
//   RESEND_API_KEY   khoá gửi thư của Resend
//   ADMIN_EMAIL      hòm thư nhận thông báo (nhiều địa chỉ thì ngăn bằng dấu phẩy)
//   CL_HOOK_SECRET   chuỗi bí mật, phải trùng header x-cl-secret Supabase gửi lên
//   RESEND_FROM      (tuỳ chọn) người gửi. Chưa xác minh tên miền thì để trống,
//                    hệ thống dùng onboarding@resend.dev — chỉ gửi được về đúng
//                    email đã đăng ký Resend, đủ dùng cho thông báo nội bộ.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://coastalland.vn";

type HookPayload = {
  type?: string;
  table?: string;
  record?: Record<string, unknown> | null;
};

type Tin = { tieuDe: string; dong: string[]; link: string };

const chu = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");

const tienVnd = (v: unknown) =>
  typeof v === "number" && v > 0 ? `${v.toLocaleString("vi-VN")} đ` : "Thoả thuận";

const TEN_LOAI_YEU_CAU: Record<string, string> = {
  dang_du_an: "Đăng dự án",
  ho_tro: "Hỗ trợ",
  hop_tac: "Hợp tác",
  khac: "Khác",
};

// Dựng nội dung email theo từng bảng. Trả null = việc không cần báo
// (tin nháp khách chưa gửi, dự án admin tự tạo…) → bỏ qua, không làm phiền.
function dungTin(table: string, r: Record<string, unknown>): Tin | null {
  const status = chu(r.status);

  if (table === "listings") {
    if (status !== "pending") return null; // nháp / đã duyệt → không báo
    return {
      tieuDe: "Tin đăng mới chờ duyệt",
      dong: [
        `Tiêu đề: ${chu(r.title) || "(không có tiêu đề)"}`,
        `Giá: ${tienVnd(r.price_vnd)}`,
      ],
      link: `${SITE}/admin/tin-dang`,
    };
  }

  if (table === "projects") {
    if (status !== "pending") return null;
    return {
      tieuDe: "Dự án mới chờ duyệt",
      dong: [`Tên dự án: ${chu(r.name) || "(không có tên)"}`],
      link: `${SITE}/admin/du-an`,
    };
  }

  if (table === "customer_requests") {
    const loai = chu(r.loai) || "khac";
    return {
      tieuDe: "Yêu cầu khách hàng mới",
      dong: [
        `Loại: ${TEN_LOAI_YEU_CAU[loai] ?? loai}`,
        `Khách: ${chu(r.ten) || "(không tên)"}`,
        `Điện thoại: ${chu(r.dien_thoai) || "—"}`,
        `Email: ${chu(r.email) || "—"}`,
        `Nội dung: ${chu(r.noi_dung) || "—"}`,
      ],
      link: `${SITE}/admin/yeu-cau`,
    };
  }

  return null;
}

const thoat = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function dungHtml(t: Tin) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;color:#1d1d1f">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6e6e73">COASTAL LAND</p>
  <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;letter-spacing:-.02em">${thoat(t.tieuDe)}</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.6">
    ${t.dong
      .map(
        (d) =>
          `<tr><td style="padding:6px 0;border-bottom:1px solid #e5e5e7">${thoat(d)}</td></tr>`,
      )
      .join("")}
  </table>
  <p style="margin:22px 0 0">
    <a href="${t.link}" style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600">Mở trang quản trị</a>
  </p>
</div>`;
}

export async function POST(req: Request) {
  const secret = process.env.CL_HOOK_SECRET;
  if (!secret || req.headers.get("x-cl-secret") !== secret) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  }

  let payload: HookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không đọc được" }, { status: 400 });
  }

  if (payload.type !== "INSERT" || !payload.table || !payload.record) {
    return NextResponse.json({ boQua: "không phải dòng mới" });
  }

  const tin = dungTin(payload.table, payload.record);
  if (!tin) return NextResponse.json({ boQua: "không cần báo" });

  const key = process.env.RESEND_API_KEY;
  const nhan = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!key || nhan.length === 0) {
    // Chưa cắm khoá → không làm hỏng việc đăng tin của khách, chỉ ghi log.
    console.warn("[thong-bao-admin] Thiếu RESEND_API_KEY hoặc ADMIN_EMAIL");
    return NextResponse.json({ boQua: "chưa cấu hình email" });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "COASTAL LAND <onboarding@resend.dev>",
      to: nhan,
      subject: `[COASTAL LAND] ${tin.tieuDe}`,
      html: dungHtml(tin),
    }),
  });

  if (!res.ok) {
    const chiTiet = await res.text();
    console.error("[thong-bao-admin] Resend lỗi:", res.status, chiTiet);
    return NextResponse.json({ error: "Không gửi được email" }, { status: 502 });
  }

  return NextResponse.json({ daGui: true });
}
