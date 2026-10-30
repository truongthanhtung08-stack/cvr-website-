import { permanentRedirect } from "next/navigation";

// Tra cứu dự án nằm TRONG trang Dự án (/du-an — chủ dự án 29/10/2026: bấm menu Dự án là có cả Tra cứu + Dự án nổi bật).
// Link cũ tự về đúng phần Tra cứu.
export default function TraCuuDuAnPage() {
  permanentRedirect("/du-an#tra-cuu");
}
