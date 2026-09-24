import { redirect } from "next/navigation";

// Trang "Tương tác" đã gộp vào "Khách hàng" (24/09/2026) — giữ đường dẫn cũ để
// link đã gửi đi / đánh dấu trên trình duyệt không bị hỏng.
export default function TuongTacCu() {
  redirect("/tai-khoan/khach-hang");
}
