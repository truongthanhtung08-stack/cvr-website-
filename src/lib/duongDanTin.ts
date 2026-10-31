// ĐƯỜNG DẪN TIN ĐĂNG CHI TIẾT chuẩn Google "Sử dụng URL mang tính mô tả" (chủ dự án chốt 31/10/2026):
//   /bat-dong-san/<tiêu đề không dấu>-<8 ký tự đầu mã tin>
//   vd /bat-dong-san/ban-can-ho-2pn-ph-nha-trang-view-bien-sohong-rieng-59140f1a
// Đường cũ /bat-dong-san/<mã đầy đủ> và đường có tiêu đề cũ (khách sửa tiêu đề) → trang tin chuyển hướng
// vĩnh viễn sang đường này. MỌI link tới trang tin (thẻ, sitemap, canonical, dữ liệu Google) dùng hàm này.

const MAX_CHU = 80; // phần chữ tối đa — Google đọc được đủ ý, đường dẫn không quá dài

export function chuKhongDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const maNgan = (id: string) => id.slice(0, 8).toLowerCase();

export function duongDanTin(l: { id: string; title?: string | null }): string {
  let chu = chuKhongDau(l.title ?? "");
  if (chu.length > MAX_CHU) chu = chu.slice(0, MAX_CHU).replace(/-[^-]*$/, "");
  return `/bat-dong-san/${chu ? `${chu}-` : ""}${maNgan(l.id)}`;
}

// Phần cuối đường dẫn → mã tin đầy đủ (dạng cũ) hoặc mã ngắn 8 ký tự (dạng mới)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function tachMaTin(doan: string): { id: string } | { ma: string } | null {
  const s = decodeURIComponent(doan).toLowerCase();
  if (UUID.test(s)) return { id: s };
  const m = s.match(/(?:^|-)([0-9a-f]{8})$/);
  return m ? { ma: m[1] } : null;
}
