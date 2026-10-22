import { permanentRedirect } from "next/navigation";

// Trang Tra cứu dự án đã gộp vào /du-an (chủ dự án 22/10/2026) — link cũ, Google tự chuyển về trang Dự án.
export default function TraCuuDuAnPage() {
  permanentRedirect("/du-an");
}
