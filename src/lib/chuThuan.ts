// ── GỠ KÝ HIỆU SOẠN THẢO, TRẢ VỀ CHỮ TRƠN ────────────────────────────────────
//
// Nội dung admin nhập được lưu kèm ký hiệu định dạng (xem components/RichContent.tsx):
//   ::center:: ::right:: ::justify::   canh lề, đặt ở đầu dòng
//   **đậm**  *nghiêng*
//   ![](url)  @[video](url)            ảnh / video chèn giữa bài
//
// Ở TRANG CHI TIẾT thì RichContent dịch mấy ký hiệu này thành định dạng thật.
// Nhưng chỗ nào chỉ lấy VÀI DÒNG ĐẦU làm mô tả ngắn (thẻ dự án, thẻ tin, danh
// sách bài viết) thì lại in thẳng chuỗi thô ra — thành ra khách đọc thấy
// "Căn hộ cao cấp · ::justify:: S-Light Tower là…" ngay trên thẻ dự án.
//
// Mọi chỗ cắt mô tả ngắn PHẢI đi qua hàm này.
export function chuThuan(text: string | null | undefined): string {
  return (text ?? "")
    .replace(/::(center|right|justify)::/gi, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/@\[video\]\([^)]*\)/gi, " ")
    .replace(/\*{1,3}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
