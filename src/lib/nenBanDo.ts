import type * as LType from "leaflet";

// ════════════════════════════════════════════════════════════════════════════
// ẢNH NỀN BẢN ĐỒ — dùng chung cho CẢ BA bản đồ trên web
//   · MapPickerLeaflet — ghim vị trí khi đăng tin
//   · MapPaneLeaflet   — xem vị trí ở trang tin / trang dự án
//   · MapView          — chế độ bản đồ ở ba tab danh sách
//
// ⚠️ ĐỪNG QUAY LẠI tile.openstreetmap.org LÀM NỀN CHÍNH.
// Đo thật 03/09/2026 từ Việt Nam:
//     tile.openstreetmap.org   → fetch failed (không kết nối được)
//     basemaps.cartocdn.com    → 200, 381–650 ms
// Máy chủ ảnh của OpenStreetMap là hạ tầng thiện nguyện, chặn/chậm thất thường
// và họ nói rõ là không dành cho web thương mại. Hậu quả đúng như chủ dự án báo:
// khung bản đồ Ô TRẮNG TRƠN, chỉ còn nút phóng to và dòng ghi nguồn — Leaflet
// chạy bình thường nhưng không có ảnh nào tải về, nên KHÔNG GHIM ĐƯỢC.
//
// CARTO là CDN toàn cầu, dựng trên chính dữ liệu OpenStreetMap, không cần khoá,
// không cần thanh toán. Vẫn giữ OSM làm đường lùi phòng khi CARTO trục trặc.
// ════════════════════════════════════════════════════════════════════════════

// Bắt buộc ghi nguồn cả hai bên — điều kiện dùng miễn phí.
export const GHI_NGUON_NEN =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · ' +
  '© <a href="https://carto.com/attributions">CARTO</a>';

const NEN_CHINH = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const NEN_DU_PHONG = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function themNenBanDo(L: typeof LType, map: LType.Map): LType.TileLayer {
  const lop = L.tileLayer(NEN_CHINH, {
    attribution: GHI_NGUON_NEN,
    subdomains: "abcd",
    maxZoom: 20,
    // Màn hình điện thoại nét cao thì lấy ảnh @2x cho khỏi rỗ chữ.
    detectRetina: true,
  }).addTo(map);

  // Nền chính hỏng → lùi về OpenStreetMap, chỉ đổi MỘT lần rồi thôi.
  let daLui = false;
  lop.on("tileerror", () => {
    if (daLui) return;
    daLui = true;
    lop.setUrl(NEN_DU_PHONG);
  });

  return lop;
}

// ⚠️ PHẢI GỌI SAU KHI DỰNG BẢN ĐỒ — ĐỪNG BỎ.
// Leaflet đo kích thước khung ĐÚNG MỘT LẦN lúc dựng. Trong form đăng tin, khung
// bản đồ nằm sâu trong trang dài, phía trên còn ảnh và phông chữ đang tải nên
// lúc Leaflet đo thì chiều cao chưa đúng — nó tính ra cần 0 ô ảnh và không tải
// gì cả, để lại một ô trắng. Đo lại vài nhịp, và đo lại mỗi khi khung đổi kích
// thước (xoay ngang máy, bàn phím ảo bật lên, mở/đóng khối phía trên).
export function doLaiKhungBanDo(map: LType.Map, khung: HTMLElement | null): () => void {
  const doLai = () => map.invalidateSize();
  const hen = [0, 250, 800, 2000].map((ms) => window.setTimeout(doLai, ms));

  let theoDoi: ResizeObserver | null = null;
  if (khung && typeof ResizeObserver !== "undefined") {
    theoDoi = new ResizeObserver(doLai);
    theoDoi.observe(khung);
  }
  window.addEventListener("orientationchange", doLai);

  return () => {
    hen.forEach(clearTimeout);
    theoDoi?.disconnect();
    window.removeEventListener("orientationchange", doLai);
  };
}
