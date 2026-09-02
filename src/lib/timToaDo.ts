import { centerOfArea } from "@/lib/geo";
import { parseLatLng } from "@/lib/googleMaps";

// ── TRA ĐỊA CHỈ RA TOẠ ĐỘ ────────────────────────────────────────────────────
//
// Dùng Nominatim của OpenStreetMap: miễn phí, không cần khoá, không cần thanh toán.
// (Geocoding của Google thì phải nạp tiền và đang bị Google chặn tài khoản — xem
// ghi chú đầu MapPaneLeaflet.tsx.)
//
// VÌ SAO CẦN: tin nào cũng phải có GHIM ĐỎ trên bản đồ. Chỉ khoảng một phần nhỏ
// tin được người đăng ghim tay; số còn lại chỉ có chuỗi địa chỉ. Có tên đường thì
// tra ra đúng đoạn đường, đó đã là ghim dùng được. Không tra ra mới lùi về tâm
// phường/xã — và khi đó phải NÓI RÕ là vị trí tương đối, không được để khách
// tưởng ghim đúng căn nhà.

export type MucDoChinhXac = "ghim" | "duong" | "khuVuc";

export type ToaDoTim = {
  lat: number;
  lng: number;
  mucDo: MucDoChinhXac;
};

// Tra rồi thì nhớ luôn — khách chuyển qua lại giữa các tin không phải tra lại,
// và Nominatim có giới hạn 1 lượt/giây nên càng gọi ít càng tốt.
const daTra = new Map<string, ToaDoTim | null>();

export function coTenDuong(diaChi: string): boolean {
  const dau = diaChi.split(",")[0]?.trim() ?? "";
  return dau.length >= 3;
}

// ── CHIỀU NGƯỢC LẠI: TỪ TOẠ ĐỘ RA ĐỊA CHỈ ────────────────────────────────────
// Người đăng bấm ghim lên bản đồ thì phải thấy mình vừa ghim vào ĐÂU. Chỉ hiện
// một dấu đỏ trơ trọi thì họ không biết đúng hay sai, không kiểm được.
const daTraNguoc = new Map<string, string | null>();

export async function traDiaChi(lat: number, lng: number): Promise<string | null> {
  // Làm tròn 5 số lẻ (~1 m) để nhích ghim vài xăng-ti-mét không phải gọi lại.
  const khoa = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (daTraNguoc.has(khoa)) return daTraNguoc.get(khoa) ?? null;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&accept-language=vi&lat=${lat}&lon=${lng}`,
    );
    const kq = (await r.json()) as { display_name?: string };
    // Nominatim trả cả "Việt Nam" và mã bưu chính ở cuối — cắt bớt cho gọn, giữ
    // 4 phần đầu là đủ đọc: số nhà / đường / phường / quận.
    const ten = kq.display_name
      ? kq.display_name.split(",").map((s) => s.trim()).slice(0, 4).join(", ")
      : null;
    daTraNguoc.set(khoa, ten);
    return ten;
  } catch {
    daTraNguoc.set(khoa, null);
    return null;
  }
}

export async function timToaDo(diaChi: string): Promise<ToaDoTim | null> {
  const chuoi = diaChi.trim();
  if (!chuoi) return null;

  // Người đăng đã ghim tay → toạ độ nằm ngay trong chuỗi, khỏi tra.
  const ghim = parseLatLng(chuoi);
  if (ghim) return { lat: ghim.lat, lng: ghim.lng, mucDo: "ghim" };

  if (daTra.has(chuoi)) return daTra.get(chuoi) ?? null;

  const tamKhuVuc = centerOfArea(chuoi);
  const duPhong: ToaDoTim | null = tamKhuVuc
    ? { lat: tamKhuVuc[0], lng: tamKhuVuc[1], mucDo: "khuVuc" }
    : null;

  // Không có tên đường thì tra cũng chỉ ra tâm phường, khỏi tốn lượt gọi.
  if (!coTenDuong(chuoi)) {
    daTra.set(chuoi, duPhong);
    return duPhong;
  }

  try {
    const r = await fetch(
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=" +
        encodeURIComponent(chuoi),
    );
    const ds = (await r.json()) as { lat: string; lon: string }[];
    const kq: ToaDoTim | null = ds[0]
      ? { lat: Number(ds[0].lat), lng: Number(ds[0].lon), mucDo: "duong" }
      : duPhong;
    daTra.set(chuoi, kq);
    return kq;
  } catch {
    daTra.set(chuoi, duPhong);
    return duPhong;
  }
}
