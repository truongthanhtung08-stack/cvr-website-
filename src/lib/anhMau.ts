// ============================================================================
// ẢNH MẪU — ảnh thật, đẹp nhất trong kho (chủ dự án chọn kiểu 22/10/2026 tối: "lấy hình nào đẹp nhất — nhà, villa, nội thất";
// ⛔ không ảnh AI, không ảnh cầu Rồng) — thẻ "Mẫu tin hiển thị" (trang Báo giá + bước chọn gói). Xem trước tin khi khách chưa up
// ảnh dùng ANH_MAC_DINH ở cuối tệp. Chỉ để XEM — không lưu vào tin.
// ============================================================================

const KHO = "https://miyugmacyerqvzhgmbyd.supabase.co/storage/v1/object/public/listings/";

// Chọn lại 12/11/2026 (anh: "chọn hình đẹp thay vào cho cả 2 bản, nhiều loại hình, ảnh đẹp") — mỗi hạng một loại hình:
// Diamond biệt thự (mặt tiền + nội thất) · Gold căn hộ view sông · Silver nhà phố (phòng khách) · Basic đất nền dự án (ảnh trên cao)
export const ANH_MAU = {
  bietThu: ["791bb4fced6511a531aaf8f8-BTQTT__9_.webp", "55a84def9e25a1f67640b8a2-BTQTT__4_.webp", "6eb77903dba7b34f2346a0f1-BTQTT__5_.webp",
    "bd9cc4d1b1f62efcfe45c120-1789715708645_5829999480055530350_5829999480055530350_65a51589f83e2785da78f8b6fddd422b.webp"].map((a) => KHO + a),
  canHo: ["a7a12ec59f7d0dca8f22726d-dn07-0611-01.webp", "9725016a01b819d8fde4a0e8-dn07-0611-03.webp", "e57319bf76839b98bdb439a0-dn07-0611-05.webp",
    "6f9cad70c4c3e6b55a5bcbd1-dn07-0611-06.webp"].map((a) => KHO + a),
  nhaPho: [KHO + "203ee62dd469967fef647073-qngai01-0611-02.webp"],
  datNen: [KHO + "da1bde6290a39ad7ae6c553d-dn15-2010-05.webp"],
};


/** ẢNH MẶC ĐỊNH COASTAL LAND (chủ dự án 23/10/2026: "chưa có ảnh là lấy ảnh Coastal Land mặc định") — nền tối, logo trắng giữa.
 *  Xem trước tin khi khách chưa up ảnh: không dùng ảnh nhà mẫu (khách dễ tưởng là nhà thật của tin). */
export const ANH_MAC_DINH = "/images/anh-mac-dinh-coastal-land.svg";
