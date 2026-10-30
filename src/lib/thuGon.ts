// "THU GỌN" CHUẨN CHUNG (chủ dự án 30/10/2026: "bấm xem thêm hiện thế nào, thu gọn thu thế nào"): "Xem thêm" mở ra ngay tại chỗ;
// "Thu gọn" đóng lại rồi đưa màn hình về ĐẦU KHỐI vừa đọc (nằm ngay dưới thanh dính trên đầu) — không để khách đứng giữa khoảng
// trống phía dưới sau khi nội dung co lại. Đầu khối còn trong màn hình thì đứng yên.
export function veDauKhoi(nut: HTMLElement) {
  const khoi = (nut.closest("section") ?? nut.parentElement) as HTMLElement | null;
  if (!khoi) return;
  requestAnimationFrame(() => {
    const tren = khoi.getBoundingClientRect().top;
    if (tren < 0) window.scrollTo({ top: window.scrollY + tren - 130 });
  });
}

// CHỖ CẮT KHI THU GỌN — MỘT LUẬT CHO CẢ WEB (chủ dự án 31/10/2026: "không cắt ngang ảnh / bản đồ", "làm là code cả hệ thống"):
// đường cắt `khung` px rơi vào một KHỐI KHÔNG PHẢI CHỮ (ảnh, bản đồ, video, khung nhúng, bảng, lưới ảnh… — mọi khối gần như không có
// chữ mà cao) thì dời đường cắt ra ngoài khối đó: khối nằm gần đầu (bắt đầu trước nửa khung) → lấy trọn, cắt ngay dưới; còn lại cắt ngay trên.
// Trả về { cat (px tính từ đầu khối thu gọn), sauKhoi (true = cắt ngay dưới một khối → không phủ vệt mờ đè lên khối) }.
const THE_KHOI = new Set(["IMG", "PICTURE", "FIGURE", "VIDEO", "IFRAME", "CANVAS", "svg", "SVG", "TABLE", "OBJECT", "EMBED"]);
export function diemCat(goc: HTMLElement, khung: number): { cat: number; sauKhoi: boolean } {
  const tren0 = goc.getBoundingClientRect().top;
  let khoi: { tren: number; duoi: number } | null = null;
  for (const e of goc.querySelectorAll<HTMLElement>("*")) {
    const r = e.getBoundingClientRect();
    const tren = r.top - tren0, duoi = r.bottom - tren0;
    if (!(tren < khung && duoi > khung) || r.height < 60) continue;
    const laKhoi = THE_KHOI.has(e.tagName) || (e.innerText ?? "").trim().length < 40;
    // Lấy khối NGOÀI CÙNG (cao nhất) cắt qua đường — vd khung bản đồ chứ không phải ô gạch bên trong
    if (laKhoi && (!khoi || duoi - tren > khoi.duoi - khoi.tren)) khoi = { tren, duoi };
  }
  if (!khoi) return { cat: khung, sauKhoi: false };
  if (khoi.tren < khung / 2) return { cat: khoi.duoi + 16, sauKhoi: true };
  // Cắt trên khối: tiêu đề mục nằm sát trên (≤ 100 px) thì cắt luôn trên tiêu đề — không để tiêu đề treo một mình
  let cat = khoi.tren - 16;
  for (const h of goc.querySelectorAll<HTMLElement>("h2, h3, h4")) {
    const r = h.getBoundingClientRect();
    const duoi = r.bottom - tren0;
    if (duoi <= khoi.tren && khoi.tren - duoi <= 100) cat = Math.min(cat, r.top - tren0 - 16);
  }
  return { cat: Math.max(cat, 0), sauKhoi: false };
}
