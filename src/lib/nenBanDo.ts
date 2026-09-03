import type * as LType from "leaflet";

// ════════════════════════════════════════════════════════════════════════════
// ẢNH NỀN BẢN ĐỒ — dùng chung cho CẢ BA bản đồ trên web
//   · MapPickerLeaflet — ghim vị trí khi đăng tin
//   · MapPaneLeaflet   — xem vị trí ở trang tin / trang dự án
//   · MapView          — chế độ bản đồ ở ba tab danh sách
//
// ⚠️ ĐÃ ĐO THẬT TỪ VIỆT NAM 03/09/2026 — ĐỪNG THỬ LẠI MẤY NGUỒN ĐÃ LOẠI:
//     tile.openstreetmap.org     → ECONNREFUSED  (bị chặn)
//     tile.openstreetmap.de      → ETIMEDOUT
//     maps.wikimedia.org         → 403
//     basemaps.cartocdn.com      → 200 nhưng ĐÓNG DẤU "API KEY REQUIRED" đầy mặt
//     a.tile.opentopomap.org     → 200 nhưng gần 2 giây, ảnh rỗng
//     server.arcgisonline.com    → 200, 437 ms, sạch, không cần khoá  ✅
//
// Máy chủ ảnh của OpenStreetMap là hạ tầng thiện nguyện, họ nói rõ không dành cho
// web thương mại — và thực tế ở Việt Nam là chặn thẳng. Hậu quả đúng như chủ dự án
// báo: khung bản đồ Ô TRẮNG TRƠN, chỉ còn nút phóng to và dòng ghi nguồn. Leaflet
// chạy bình thường nhưng không có ảnh nào tải về, nên KHÔNG GHIM ĐƯỢC.
// ════════════════════════════════════════════════════════════════════════════

// Bắt buộc ghi nguồn — điều kiện dùng miễn phí.
export const GHI_NGUON_NEN = 'Ảnh nền © <a href="https://www.esri.com/">Esri</a>';

// ⚠️ CARTO ĐÃ BỊ LOẠI 03/09/2026. Họ vẫn trả ảnh nhưng ĐÓNG DẤU chằng chịt
// "API KEY REQUIRED · carto.com/basemaps/apikey" lên khắp mặt bản đồ — nhìn như
// web ăn cắp. Bản miễn phí không khoá coi như hết dùng được. Đừng quay lại.
const NEN_CHINH = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const NEN_DU_PHONG = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";

export function themNenBanDo(L: typeof LType, map: LType.Map): LType.TileLayer {
  const lop = L.tileLayer(NEN_CHINH, {
    attribution: GHI_NGUON_NEN,
    maxZoom: 19,
  }).addTo(map);

  // Nền chính hỏng → lùi sang bản đồ địa hình của cùng nhà, chỉ đổi MỘT lần.
  let daLui = false;
  lop.on("tileerror", () => {
    if (daLui) return;
    daLui = true;
    lop.setUrl(NEN_DU_PHONG);
  });

  return lop;
}

// ⚠️ CHỜ KHUNG CÓ KÍCH THƯỚC RỒI MỚI DỰNG BẢN ĐỒ — ĐỪNG BỎ.
// Đo thật trên coastalland.vn 03/09/2026: khung bản đồ ở trang tin có
// cao = 0, rộng = 0 vì nó nằm trong khối đang ẩn (mục chưa mở, ảnh phía trên
// còn đang tải). Dựng Leaflet vào một khung 0×0 thì nó tính ra cần 0 ô ảnh và
// không tải gì cả — để lại Ô TRẮNG vĩnh viễn, gọi invalidateSize sau cũng không
// cứu được vì lớp ảnh chưa từng được khởi tạo tử tế.
// Hàm này đợi tới khi khung có kích thước thật rồi mới cho dựng.
export function choKhungCoKichThuoc(khung: HTMLElement, toiDaMs = 1200): Promise<void> {
  if (khung.clientHeight > 0 && khung.clientWidth > 0) return Promise.resolve();
  return new Promise((xong) => {
    let da = false;
    const ket = () => {
      if (da) return;
      da = true;
      theoDoi?.disconnect();
      clearTimeout(hen);
      xong();
    };
    const theoDoi =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (khung.clientHeight > 0 && khung.clientWidth > 0) ket();
          })
        : null;
    theoDoi?.observe(khung);
    // ⚠️ ĐỢI NGẮN THÔI (1,2 giây). Hàm này chỉ để tránh dựng vào khung 0×0 lúc
    // trang mới tải; nó TUYỆT ĐỐI KHÔNG được biến thành thứ chặn bản đồ dựng.
    // Hết giờ thì cứ dựng, doLaiKhungBanDo() phía sau lo việc đo lại khi khung hiện.
    const hen = window.setTimeout(ket, toiDaMs);
  });
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
