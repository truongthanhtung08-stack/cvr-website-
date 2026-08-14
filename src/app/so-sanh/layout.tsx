import type { Metadata } from "next";

// Trang So sánh là CÔNG CỤ: nội dung sinh từ danh sách khách tự chọn (lưu trong
// máy khách). Googlebot vào chỉ thấy trang rỗng → "nội dung mỏng", vào chỉ mục
// chỉ làm loãng chất lượng cả site. Cho khách dùng bình thường, nhưng không index.
// (Trang này là client component nên metadata phải khai ở layout.)
export const metadata: Metadata = {
  title: "So sánh bất động sản",
  description: "So sánh các bất động sản bạn đã chọn tại Coastal Land.",
  robots: { index: false, follow: true },
};

export default function SoSanhLayout({ children }: { children: React.ReactNode }) {
  return children;
}
