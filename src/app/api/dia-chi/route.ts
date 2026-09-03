import { NextResponse } from "next/server";

// ============================================================================
// TRA ĐỊA CHỈ — GỌI QUA MÁY CHỦ CỦA MÌNH, KHÔNG GỌI THẲNG TỪ TRÌNH DUYỆT
//
// ⚠️ VÌ SAO PHẢI CÓ ROUTE NÀY — ĐỪNG BỎ ĐI GỌI THẲNG NHƯ CŨ:
// Nominatim (dịch vụ tra địa chỉ của OpenStreetMap) CHẶN mọi lượt gọi không khai
// báo danh tính: trả thẳng **403 Access denied**. Trình duyệt thì không cho phép
// đặt User-Agent — đó là header bị cấm sửa. Nên gọi từ trình duyệt là hỏng, mà
// hỏng LẶNG LẼ: hàm tra trả về null, ô Quận/Huyện và Phường/Xã đứng im, người
// đăng tưởng web hỏng. Đây đúng là lỗi chủ dự án báo 03/09/2026:
//   "chọn tỉnh, ghim một vị trí, cả hệ mới lẫn hệ cũ không hiện quận/huyện/phường".
//
// Máy chủ thì đặt User-Agent thoải mái → 200. Thêm hai cái lợi:
//   · NHỚ KẾT QUẢ: cùng một chỗ tra lại là trả ngay, không phiền Nominatim.
//     Chính sách của họ là tối đa 1 lượt/giây — web nhiều người dùng cùng lúc mà
//     gọi thẳng thì kiểu gì cũng bị chặn.
//   · Đổi nhà cung cấp sau này (Google, Mapbox…) chỉ sửa đúng file này.
//
// Dữ liệu ở đây là địa danh công khai, KHÔNG có gì riêng tư, nên cho phép lưu đệm.
// (Khác với nội dung admin — chỗ đó vẫn no-store để "sửa là hiện ngay".)
// ============================================================================

const NOMINATIM = "https://nominatim.openstreetmap.org";
// Nominatim yêu cầu khai báo ứng dụng + cách liên hệ. Khai đúng thì họ không chặn.
const UA = "CoastalLand/1.0 (+https://coastalland.vn; lienhe@coastalland.vn)";

// Nhớ trong bộ nhớ máy chủ. Đủ cho nhu cầu hiện tại; hết đời tiến trình thì thôi.
const nho = new Map<string, unknown>();
const MOC_NHO = 500;

async function hoiNominatim(duong: string): Promise<unknown> {
  if (nho.has(duong)) return nho.get(duong);
  const r = await fetch(NOMINATIM + duong, { headers: { "User-Agent": UA, "Accept-Language": "vi" } });
  if (!r.ok) throw new Error(`Nominatim ${r.status}`);
  const kq = await r.json();
  // Quá đầy thì bỏ bớt cái cũ nhất, khỏi phình bộ nhớ.
  if (nho.size >= MOC_NHO) nho.delete(nho.keys().next().value as string);
  nho.set(duong, kq);
  return kq;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const viec = u.searchParams.get("viec") ?? "";
  const q = (u.searchParams.get("q") ?? "").trim();
  const lat = u.searchParams.get("lat");
  const lng = u.searchParams.get("lng");

  let duong = "";
  if (viec === "nguoc") {
    if (!lat || !lng) return NextResponse.json({ loi: "thieu lat/lng" }, { status: 400 });
    duong = `/reverse?format=json&zoom=18&accept-language=vi&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  } else if (viec === "tim") {
    if (!q) return NextResponse.json([], { status: 200 });
    duong = `/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(q)}`;
  } else if (viec === "goiy") {
    if (q.length < 3) return NextResponse.json([], { status: 200 });
    duong = `/search?format=json&addressdetails=1&limit=6&countrycodes=vn&accept-language=vi&q=${encodeURIComponent(q)}`;
  } else {
    return NextResponse.json({ loi: "viec khong hop le" }, { status: 400 });
  }

  try {
    const kq = await hoiNominatim(duong);
    return NextResponse.json(kq, {
      // Địa danh gần như không đổi — cho trình duyệt và CDN giữ một ngày.
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch {
    // Hỏng thì trả rỗng ĐÚNG KIỂU dữ liệu nơi gọi đang chờ, để phía web tự lùi về
    // bảng khu vực có sẵn thay vì vỡ.
    return NextResponse.json(viec === "nguoc" ? {} : [], { status: 200 });
  }
}
