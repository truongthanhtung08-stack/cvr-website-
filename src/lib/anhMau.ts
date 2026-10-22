// ============================================================================
// ẢNH MẪU — ảnh thật, đẹp nhất trong kho (chủ dự án chọn kiểu 22/10/2026 tối: "lấy hình nào đẹp nhất — nhà, villa, nội thất";
// ⛔ không ảnh AI, không ảnh cầu Rồng) — thẻ "Mẫu tin hiển thị" (trang Báo giá + bước chọn gói). Xem trước tin khi khách chưa up
// ảnh dùng ANH_MAC_DINH ở cuối tệp. Chỉ để XEM — không lưu vào tin.
// ============================================================================

const KHO = "https://miyugmacyerqvzhgmbyd.supabase.co/storage/v1/object/public/listings/";

export const ANH_MAU = {
  // Biệt thự sân vườn — ảnh chính là nội thất
  bietThu: ["cfd50d885c07c23ec69ee0db-pt03-8.webp", "30979708f70da8cb6d9ffc1e-pt03-1.webp", "aba4393fdba99a79065ffe34-pt03-9.webp",
    "a72145548b8d84d9d80f4b5c-pt03-7.webp"].map((a) => KHO + a),
  // Nhà phố liền kề
  nhaPho: ["1788251822682-40179-pt03-7.webp", "1788251818846-50412-pt03-1.webp", "1788251819450-33583-pt03-2.webp",
    "1788251822113-184487-pt03-6.webp"].map((a) => KHO + a),
  // Căn hộ view biển
  canHo: [KHO + "1788789958242-233504-qnhon10-1.webp"],
  // Nhà mặt phố
  nhaMatPho: [KHO + "721b01b977d3c2b1d4811cdc-dn03-1210-1.webp"],
};


/** ẢNH MẶC ĐỊNH COASTAL LAND (chủ dự án 23/10/2026: "chưa có ảnh là lấy ảnh Coastal Land mặc định") — nền tối, logo trắng giữa.
 *  Xem trước tin khi khách chưa up ảnh: không dùng ảnh nhà mẫu (khách dễ tưởng là nhà thật của tin). */
export const ANH_MAC_DINH = "/images/anh-mac-dinh-coastal-land.svg";
