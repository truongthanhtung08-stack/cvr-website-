// THƯƠNG HIỆU — MỘT NGUỒN (anh 12/11/2026: "Branding SEO làm trước từ khoá"; "Coastal Land = Cổng thông tin bất động sản = Portal,
// không phải đất ven biển — như Apple không ra trái táo"; "để sheet riêng, nạp là lên luôn").
// Nguồn: sheet "Thương hiệu" của HE-THONG-TU-KHOA.xlsx → Admin → Từ khoá lõi → Tải tệp lên (cùng lần với sheet "Từ khoá lõi")
// → site_content "tu_khoa_loi".thuongHieu. Chưa nạp / ô trống → bản mặc định dưới đây (đúng chữ web đang chạy).
// Dùng ở: tiêu đề mặc định + mô tả (layout.tsx), trang chủ (tiêu đề, H1, mô tả), dữ liệu tổ chức (SiteJsonLd), /llms.txt,
// hỏi đáp thương hiệu (trang Giới thiệu). Đọc qua fetch có thẻ "noi-dung" — Admin tải tệp mới là trang dựng lại, không gọi lại mỗi lượt xem.

export type HoiDap = { hoi: string; dap: string };
export type ThuongHieu = {
  ten: string;          // COASTAL LAND
  cau1: string;         // Cổng thông tin bất động sản trực tuyến
  cau2: string;         // Cổng đăng tin mua bán, cho thuê nhà đất
  dinhNghia: string;    // câu định nghĩa tiếng Việt (AI trích)
  dinhNghiaEn: string;  // câu định nghĩa tiếng Anh (AI nước ngoài)
  cachGo: string[];     // cách gõ khác của TÊN (không phải câu mô tả)
  kenh: string[];       // link kênh chính thức (sameAs)
  hoiDap: HoiDap[];     // hỏi đáp về thương hiệu
};

export const THUONG_HIEU_MAC_DINH: ThuongHieu = {
  ten: "COASTAL LAND",
  cau1: "Cổng thông tin bất động sản trực tuyến",
  cau2: "Cổng đăng tin mua bán, cho thuê nhà đất",
  dinhNghia:
    "Coastal Land (coastalland.vn) là nền tảng công nghệ và cổng thông tin bất động sản, cung cấp giải pháp toàn diện cho người dùng trong việc tìm kiếm, đăng tin mua bán, cho thuê nhà đất và dự án bất động sản.",
  dinhNghiaEn: "",
  cachGo: ["Coastal Land", "Coastalland", "coastalland.vn", "Costalland", "Costal Land"],
  kenh: [
    "https://zalo.me/1928684637254080247",
    "https://zalo.me/s/1268705237708475790/",
    "https://www.facebook.com/profile.php?id=61595622503937",
    "https://www.youtube.com/@CoastalLandvn",
    "https://maps.google.com/?cid=4963426532946079372",
    "https://www.wikidata.org/wiki/Q142088915",
    "https://www.linkedin.com/company/coastalland",
  ],
  hoiDap: [],
};

/** Ghép bản nạp từ bảng lên bản mặc định: ô nào bảng có thì dùng bảng, ô trống giữ mặc định. */
export function ghepThuongHieu(nap: Partial<ThuongHieu> | null | undefined): ThuongHieu {
  const m = THUONG_HIEU_MAC_DINH;
  if (!nap) return m;
  const chu = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
  const ds = (v: unknown, d: string[]) => (Array.isArray(v) && v.length ? v.filter((x) => typeof x === "string" && x.trim()) : d);
  return {
    ten: chu(nap.ten, m.ten),
    cau1: chu(nap.cau1, m.cau1),
    cau2: chu(nap.cau2, m.cau2),
    dinhNghia: chu(nap.dinhNghia, m.dinhNghia),
    dinhNghiaEn: chu(nap.dinhNghiaEn, m.dinhNghiaEn),
    cachGo: ds(nap.cachGo, m.cachGo),
    kenh: ds(nap.kenh, m.kenh),
    hoiDap: Array.isArray(nap.hoiDap) ? nap.hoiDap.filter((h) => h?.hoi?.trim() && h?.dap?.trim()) : m.hoiDap,
  };
}

/** Bản thương hiệu đang chạy (máy chủ). Lỗi mạng / chưa nạp → bản mặc định. */
export async function layThuongHieu(): Promise<ThuongHieu> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return THUONG_HIEU_MAC_DINH;
  try {
    const res = await fetch(`${url}/rest/v1/site_content?key=eq.tu_khoa_loi&select=data&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      next: { tags: ["noi-dung"], revalidate: false },
    });
    if (!res.ok) return THUONG_HIEU_MAC_DINH;
    const th = ((await res.json()) as { data?: { thuongHieu?: Partial<ThuongHieu> } }[])[0]?.data?.thuongHieu;
    return ghepThuongHieu(th);
  } catch {
    return THUONG_HIEU_MAC_DINH;
  }
}

/** Tiêu đề thương hiệu: "COASTAL LAND – Cổng thông tin bất động sản trực tuyến" */
export const tieuDeThuongHieu = (t: ThuongHieu) => `${t.ten} – ${t.cau1}`;
