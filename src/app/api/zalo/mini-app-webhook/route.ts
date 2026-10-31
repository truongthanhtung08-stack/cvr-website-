import { NextResponse } from "next/server";
import crypto from "crypto";
import { baoLoi } from "@/lib/baoLoi";

// ============================================================================
// WEBHOOK ZALO MINI APP — khai ở Quản lý Zalo App → Open APIs → Webhook URL:
//   https://coastalland.vn/api/zalo/mini-app-webhook
// Zalo bắt buộc có trước khi gửi duyệt Mini App (28/09/2026).
//
//   · user.revoke.consent   — khách rút lại sự đồng ý + yêu cầu xoá dữ liệu Mini App.
//     Mini App không lưu dữ liệu riêng theo userId Zalo (tài khoản gắn theo SỐ ĐIỆN
//     THOẠI, dùng chung web) → ghi sổ sự cố mức NẶNG để Coastal Land xử lý trong 30
//     ngày như đã cam kết ở /bao-mat.
//   · versions.review.done  — Zalo duyệt xong một phiên bản → ghi sổ để biết kết quả.
//
// Chữ ký: header X-ZEvent-Signature = sha256(giá trị các trường xếp A→Z + API key).
// API key lấy ở Quản lý Zalo App → Open APIs, cắm biến ZALO_MINIAPP_API_KEY trên Vercel.
// Chưa cắm khoá thì vẫn nhận (chỉ GHI SỔ, không làm gì phá huỷ) để Zalo kiểm tra URL được.
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function chuKy(data: Record<string, unknown>, khoa: string) {
  const noiDung = Object.keys(data)
    .sort()
    .map((k) => (typeof data[k] === "object" ? JSON.stringify(data[k]) : String(data[k])))
    .join("");
  return crypto.createHash("sha256").update(`${noiDung}${khoa}`).digest("hex");
}

export async function POST(req: Request) {
  const data = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const khoa = process.env.ZALO_MINIAPP_API_KEY;
  const ky = req.headers.get("x-zevent-signature") ?? "";
  const hopLe = !khoa || chuKy(data, khoa) === ky;
  if (!hopLe) return NextResponse.json({ ok: false, loi: "sai_chu_ky" }, { status: 401 });

  const suKien = String(data.event ?? "");
  if (suKien === "user.revoke.consent") {
    await baoLoi({
      noi: "zalo-mini-app",
      mucDo: "nang",
      tomTat: "Khách rút lại sự đồng ý và yêu cầu xoá dữ liệu Zalo Mini App",
      chiTiet: `userId Zalo ${data.userId} · appId ${data.appId}${khoa ? "" : " · (chưa cắm ZALO_MINIAPP_API_KEY — chưa xác thực chữ ký)"}`,
      hauQua: "Đã cam kết ở /bao-mat: xoá dữ liệu gắn với tài khoản Mini App trong 30 ngày.",
      canLam: "Tìm tài khoản đăng nhập bằng Mini App của khách này, xoá dữ liệu cá nhân theo yêu cầu, trả lời khách nếu có liên hệ.",
      khoa: `zalo-mini-app:revoke:${data.userId}`,
    });
  } else if (suKien === "versions.review.done") {
    // Trạng thái âm = BỊ TỪ CHỐI (đo 29/09: bản 27 bị từ chối, Zalo gửi -1). Kết quả xét duyệt
    // là việc admin phải xử lý → mức "nang" để có email về hòm thư công ty.
    const biTuChoi = Number(data.status) < 0;
    await baoLoi({
      noi: "zalo-mini-app",
      mucDo: "nang",
      tomTat: `Mini App phiên bản ${data.versionId} ${biTuChoi ? "BỊ ZALO TỪ CHỐI" : "đã được Zalo duyệt"} (trạng thái ${data.status})`,
      canLam: biTuChoi
        ? "Mở miniapp.zaloplatforms.com → Danh sách phiên bản / Quản lý xác thực để xem lý do, sửa rồi gửi lại."
        : "Mở miniapp.zaloplatforms.com để phát hành phiên bản.",
      chiTiet: String(data.description ?? ""),
      khoa: `zalo-mini-app:review:${data.versionId}`,
    });
  }
  return NextResponse.json({ ok: true });
}

// Zalo / trình duyệt gọi thử địa chỉ → trả lời sống.
export function GET() {
  return NextResponse.json({ ok: true, webhook: "zalo-mini-app" });
}
