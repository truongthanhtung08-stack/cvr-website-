// ════════════════════════════════════════════════════════════════════════════
// BẢN ĐỒ NỀN MỞ (MapLibre + OpenFreeMap) — nạp dùng chung cho mọi khối bản đồ
// KHÔNG phải trang chi tiết tin.
//
//   · Bản đồ BA TAB (Mua bán · Cho thuê · Dự án) — MapViewMo
//   · Ô GHIM vị trí khi đăng tin / sửa tin trong admin — MapPickerMo
//
// Vì sao không dùng Google ở đây: Google cấm Maps API với tài khoản Việt Nam
// (xem src/lib/googleMaps.ts), mà khung Google NHÚNG thì chỉ xem được — không
// bắt được cú chạm để ghim, cũng không cắm được nhiều ghim. Nền mở này miễn
// phí, không cần khoá, không tài khoản, và ĐỦ CHỨC NĂNG: bấm để ghim, kéo ghim,
// kéo bản đồ một ngón trên điện thoại.
//
// RANH GIỚI BA PHẦN — chủ dự án chốt 11/09/2026, ĐỪNG TRỘN LẠI:
//   · Trang CHI TIẾT TIN  → Google nhúng. Ở đó chỉ cần XEM, nền Google chi tiết
//     hơn hẳn ở Việt Nam.
//   · BA TAB + Ô GHIM      → nền mở (file này). Cần cắm nhiều ghim và bắt cú
//     chạm — hai việc khung Google nhúng không làm được.
//   · Nút CHỈ ĐƯỜNG        → luôn mở thẳng app Google Maps (src/lib/moGoogleMaps.ts).
//     Chỉ là đường dẫn thường: miễn phí, không khoá, không hạn mức. Đừng thay.
//
// ⛔ ĐÃ CÂN NHẮC VÀ BỎ: Goong (11/09/2026) — có tính tiền, chủ dự án không dùng.
// Đừng đề xuất lại. Nền mở này không khoá, không tài khoản, không hoá đơn.
// ════════════════════════════════════════════════════════════════════════════

export const STYLE_MO = "https://tiles.openfreemap.org/styles/liberty";

// ── NHÃN TIẾNG VIỆT ─────────────────────────────────────────────────────────
// Bản đồ nền mở mặc định ghi nhãn theo tên quốc tế: "Da Nang", "Vietnam",
// "Hue" — web tiếng Việt mà bản đồ tiếng Anh thì trông như hàng đi mượn.
// Dữ liệu OpenStreetMap có sẵn tên tiếng Việt ở trường `name:vi`, chỉ là style
// không dùng. Đổi lại từng lớp chữ: có tên tiếng Việt thì lấy, không có thì giữ
// nguyên tên gốc (đường nhỏ, ngõ hẻm phần lớn vốn đã là tiếng Việt).
export function vietHoaNhan(map: {
  getStyle(): { layers?: { id: string; layout?: Record<string, unknown> }[] };
  setLayoutProperty(id: string, ten: string, gt: unknown): void;
}): void {
  for (const lop of map.getStyle().layers ?? []) {
    if (!lop.layout || !("text-field" in lop.layout)) continue;
    try {
      map.setLayoutProperty(lop.id, "text-field", ["coalesce", ["get", "name:vi"], ["get", "name"]]);
    } catch {
      // Lớp chữ dựng theo kiểu khác (biển số đường, ký hiệu) — bỏ qua, không sao.
    }
  }
}

let dangNap: Promise<typeof import("maplibre-gl")> | null = null;

/** Nạp MapLibre (kèm CSS) đúng một lần cho cả trang, đã chỉ sẵn đường worker. */
export function napMapLibre(): Promise<typeof import("maplibre-gl")> {
  dangNap ??= (async () => {
    const ml = await import("maplibre-gl");
    await import("maplibre-gl/dist/maplibre-gl.css");
    // ⚠️ PHẢI CHỈ ĐƯỜNG WORKER TRƯỚC KHI DỰNG BẢN ĐỒ — nếu không, bản đồ TRẮNG TRƠN.
    // MapLibre giao việc tải ô bản đồ cho một worker riêng và tự đoán worker nằm
    // cạnh chính nó. Next gộp thư viện vào /_next/static/chunks/… nên nó đi tìm
    // /_next/static/chunks/maplibre-gl-worker.mjs → 404 → worker chết → không tải
    // được ô bản đồ nào mà cũng KHÔNG báo lỗi gì (đo trên web thật 11/09/2026:
    // style + sprite tải xong, canvas dựng xong, không một ô .pbf nào được gọi).
    // File dưới đây do scripts/chep-maplibre-worker.mjs chép ra public/maplibre/.
    ml.setWorkerUrl("/maplibre/maplibre-gl-worker.js");
    return ml;
  })();
  return dangNap;
}
