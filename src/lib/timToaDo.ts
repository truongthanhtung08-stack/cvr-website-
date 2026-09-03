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
export type DiaChiTra = {
  // Đúng phần điền vào ô "Địa chỉ cụ thể": số nhà + tên đường. Không kèm phường,
  // quận, tỉnh vì mấy mục đó có ô CHỌN riêng — trả về ở hai trường dưới.
  ngan: string;
  // Câu đầy đủ để người đăng đọc mà kiểm: "123, Mê Linh, Phường Nha Trang, Khánh Hòa"
  day: string;
  // Để form tự chọn đúng mục trong các ô địa giới. Trả về CẢ Quận/Huyện vì web
  // đang chạy song song hai hệ: hệ CŨ 3 cấp (Tỉnh → Quận/Huyện → Phường/Xã) và
  // hệ MỚI 2 cấp sau sáp nhập (Tỉnh → Phường/Xã). Người đăng chọn hệ nào cũng
  // phải điền được.
  tinh: string;
  quan: string;
  phuong: string;
  // Ghim tới mức nào — để nói cho người đăng biết địa chỉ đã đủ chính xác chưa.
  mucDo: "soNha" | "duong" | "khuVuc";
};

const daTraNguoc = new Map<string, DiaChiTra | null>();

export async function traDiaChi(lat: number, lng: number): Promise<DiaChiTra | null> {
  // Làm tròn 5 số lẻ (~1 m) để nhích ghim vài xăng-ti-mét không phải gọi lại.
  const khoa = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (daTraNguoc.has(khoa)) return daTraNguoc.get(khoa) ?? null;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&accept-language=vi&lat=${lat}&lon=${lng}`,
    );
    const kq = (await r.json()) as {
      display_name?: string;
      address?: {
        house_number?: string; road?: string; neighbourhood?: string; suburb?: string;
        amenity?: string; building?: string; shop?: string; residential?: string;
        quarter?: string; village?: string; town?: string; hamlet?: string;
        city_district?: string; county?: string; district?: string;
        city?: string; state?: string; province?: string;
      };
    };
    const a = kq.address ?? {};
    const duong = a.road || a.neighbourhood || "";
    // Ghim vào chỗ CHƯA CÓ TÊN ĐƯỜNG — đất nền, lô trong dự án, đường mới mở —
    // thì lấy tên địa điểm/khu dân cư gần nhất, chứ để ô địa chỉ trống trơn là
    // người đăng tưởng ghim hỏng.
    const moc = a.amenity || a.building || a.shop || a.residential || "";
    const ngan = [a.house_number, duong || moc].filter(Boolean).join(" ").trim();
    // OpenStreetMap xếp phường/xã và quận/huyện vào nhiều khoá khác nhau tuỳ nơi,
    // phải dò lần lượt. Tách RIÊNG quận/huyện với phường/xã: hệ địa chỉ CŨ cần cả
    // hai, hệ MỚI (sau sáp nhập) chỉ dùng phường/xã.
    const phuong = a.quarter || a.suburb || a.village || a.town || a.hamlet || "";
    const quan = a.city_district || a.county || a.district || "";
    const tinh = a.city || a.province || a.state || "";
    // display_name có cả "Việt Nam" và mã bưu chính ở cuối — cắt bớt cho gọn.
    const day = kq.display_name
      ? kq.display_name.split(",").map((s) => s.trim()).slice(0, 4).join(", ")
      : "";
    const mucDo: DiaChiTra["mucDo"] = a.house_number ? "soNha" : duong ? "duong" : "khuVuc";
    const ten: DiaChiTra | null =
      ngan || day ? { ngan, day: day || ngan, tinh, quan, phuong, mucDo } : null;
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

  // ⚠️ VẪN PHẢI TRA kể cả khi chưa gõ tên đường. Bảng khu vực có sẵn trong web chỉ
  // liệt kê được vài chục nơi; người đăng chọn "Phường Hoà Xuân, Đà Nẵng" mà bảng
  // không có là bản đồ đứng im, họ không nhận ra mình đang xem chỗ nào.
  // Nominatim tra tên phường/xã Việt Nam khá tốt, cứ hỏi rồi lấy bảng làm dự phòng.
  try {
    const r = await fetch(
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=" +
        encodeURIComponent(chuoi),
    );
    const ds = (await r.json()) as { lat: string; lon: string }[];
    // Có tên đường mới gọi là "duong" (đủ chính xác để tự ghim). Mới chọn tới
    // phường/xã thì vẫn là "khuVuc" — đưa bản đồ tới cho nhìn, nhưng KHÔNG tự ghim,
    // vì ghim giữa phường là ghim sai.
    const kq: ToaDoTim | null = ds[0]
      ? { lat: Number(ds[0].lat), lng: Number(ds[0].lon), mucDo: coTenDuong(chuoi) ? "duong" : "khuVuc" }
      : duPhong;
    daTra.set(chuoi, kq);
    return kq;
  } catch {
    daTra.set(chuoi, duPhong);
    return duPhong;
  }
}
