// BỘ BIỂU TƯỢNG THÔNG SỐ TRÊN THẺ TIN — CHỈ 3 cái (chủ dự án 23/10/2026: "chỉ còn 3 biểu tượng cho PN, phòng tắm, nội thất —
// chốt bộ nhận diện chuẩn nhất, nhìn là biết"). CHỦ DỰ ÁN CHỌN BỘ A — Lucide nét mảnh, kiểu Apple: giường nhìn ngang (đầu
// giường + gối) · bồn tắm có vòi · ghế sofa hai tay vịn — ba dáng khác hẳn nhau.
// Giá · diện tích · giá/m² đã có đơn vị nên KHÔNG có biểu tượng. Dùng chung thẻ điện thoại + máy tính (TheTinMobile, PropertyCard).

export type LoaiBieuTuong = "pn" | "wc" | "sofa";

export default function BieuTuongThe({ loai, className = "h-[17px] w-[17px]" }: { loai: LoaiBieuTuong; className?: string }) {
  return (
    <svg className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" role="img" aria-label={loai === "pn" ? "phòng ngủ" : loai === "wc" ? "phòng tắm" : "nội thất"}>
      {loai === "pn" && <><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></>}
      {loai === "wc" && <><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><path d="M10 5 8 7" /><path d="M2 12h20" /><path d="M7 19v2" /><path d="M17 19v2" /></>}
      {loai === "sofa" && <><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" /><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" /><path d="M4 18v2" /><path d="M20 18v2" /><path d="M12 4v9" /></>}
    </svg>
  );
}
