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
