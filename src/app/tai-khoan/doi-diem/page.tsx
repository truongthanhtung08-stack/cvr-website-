import { redirect } from "next/navigation";

// Điểm thưởng đã BỎ 25/09/2026 — thay bằng Gói hội viên (voucher theo gói).
// Giữ đường dẫn cũ để link/bookmark cũ không ra trang lỗi.
export default function DoiDiemPage() {
  redirect("/tai-khoan/hoi-vien");
}
