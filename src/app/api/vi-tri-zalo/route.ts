import { NextResponse } from "next/server";
import { hoiNominatim } from "@/lib/nominatim";
import { nguoiGoi, optionsMiniApp, postMiniApp } from "@/lib/goiTuMiniApp";
import { hoiZaloInfo } from "@/lib/taiKhoanZalo";

// ============================================================================
// VỊ TRÍ HIỆN TẠI CHO ZALO MINI APP — ĐĂNG TIN điền sẵn Tỉnh · Phường · đường (06/11/2026).
// Zalo getLocation (docs.zaloplatforms.com/docs/MA/api/location/getLocation): Mini App gửi token vị trí (1 lần, hết hạn 2 phút) +
// access token người dùng → đổi ra toạ độ qua graph.zalo.me/v2.0/me/info bằng khoá bí mật Zalo App → tra ngược địa chỉ bằng CÙNG
// dịch vụ web đang dùng khi khách ghim bản đồ (Nominatim, src/lib/nominatim.ts — có khai danh tính + nhớ kết quả).
// Đọc tỉnh / phường từ display_name như src/lib/timToaDo.ts (sau sáp nhập các trường lẻ của OSM hay sai).
// Chi phí: chỉ chạy khi khách bấm "Dùng vị trí hiện tại" lúc đăng tin — vài lượt/ngày.
// ============================================================================
export const dynamic = "force-dynamic";
export const POST = postMiniApp(xuLy);
export const OPTIONS = optionsMiniApp;

async function xuLy(req: Request) {
  const loi = (s: string, code = 400) => NextResponse.json({ ok: false, loi: s }, { status: code });
  if (!(await nguoiGoi(req))) return loi("Vui lòng đăng nhập lại.", 401);
  const b = (await req.json().catch(() => ({}))) as { tokenViTri?: string; zaloAccessToken?: string };
  if (!b.tokenViTri || !b.zaloAccessToken) return loi("Chưa lấy được vị trí.");
  let lat: string | undefined, lng: string | undefined;
  try {
    const j = await hoiZaloInfo(b.zaloAccessToken, b.tokenViTri); // qua trạm VN — Zalo chặn IP ngoài Việt Nam
    if (j.error === 0) { lat = j.data?.latitude; lng = j.data?.longitude; }
  } catch { /* trả lỗi bên dưới */ }
  if (!lat || !lng) return loi("Chưa lấy được vị trí.");

  const kq = (await hoiNominatim(`/reverse?format=json&zoom=18&accept-language=vi&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`).catch(() => null)) as
    | { display_name?: string; address?: { house_number?: string; road?: string; neighbourhood?: string } }
    | null;
  const manh = (kq?.display_name ?? "").split(",").map((s) => s.trim()).filter((s) => s && !/^\d+$/.test(s) && s !== "Việt Nam");
  const laPhuongXa = (s: string) => /^(phường|xã|thị trấn|đặc khu)\s/i.test(s);
  const tinh = manh.length ? manh[manh.length - 1] : "";
  const phuong = [...manh].reverse().find(laPhuongXa) ?? "";
  const a = kq?.address ?? {};
  const duong = [a.house_number, a.road || a.neighbourhood].filter(Boolean).join(" ");
  return NextResponse.json({ ok: true, lat: Number(lat), lng: Number(lng), tinh, phuong, duong });
}
