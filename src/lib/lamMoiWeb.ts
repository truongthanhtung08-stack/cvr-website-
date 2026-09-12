// ════════════════════════════════════════════════════════════════════════════
// BÁO WEB XOÁ CACHE SAU KHI ADMIN SỬA NỘI DUNG
//
// Các trang admin ghi THẲNG vào Supabase từ trình duyệt (nhanh, ít code), nên
// máy chủ không hề biết có thay đổi. Gọi hàm này ngay sau khi lưu thành công thì
// web bỏ bản cũ, lượt sau đã là bản mới — giữ đúng nguyên tắc "sửa là hiện NGAY"
// mà vẫn cho phép cache cho khách lạ (xem src/app/api/lam-moi/route.ts).
//
// Lỗi mạng thì im lặng bỏ qua: dữ liệu ĐÃ lưu rồi, cùng lắm chậm 5 phút mới hiện
// (lưới an toàn revalidate), không đáng để báo lỗi doạ người dùng.
// ════════════════════════════════════════════════════════════════════════════
export async function lamMoiWeb(the: "noi-dung" | "listings" = "noi-dung") {
  try {
    await fetch("/api/lam-moi", { method: "POST", body: JSON.stringify({ the }) });
  } catch {
    /* mạng lỗi — bỏ qua, lưới an toàn 5 phút sẽ tự làm mới */
  }
}
