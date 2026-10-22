// ============================================================================
// ĐẾM ẢNH · VIDEO — MỘT KIỂU CHO CẢ WEB (chủ dự án 22/10/2026: "biểu tượng ảnh/video phải đồng nhất — trang chủ khác,
// mở lên khác, sao lại phải khác"). Thẻ tin (trang chủ, danh sách) và khung ảnh trang tin (điện thoại, máy tính) dùng
// chung đúng biểu tượng, thứ tự (ảnh trước, video sau) và nền này; mỗi nơi chỉ đặt vị trí qua className.
// ============================================================================

export const IconAnh = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-9 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconPlay = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
);

export default function DemAnhVideo({ soAnh, soVideo = 0, className }: { soAnh: number; soVideo?: number; className: string }) {
  return (
    <span className={`pointer-events-none flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[12px] font-semibold text-white ${className}`}>
      <IconAnh />{soAnh}
      {soVideo > 0 && <><span className="ml-1.5"><IconPlay /></span>{soVideo}</>}
    </span>
  );
}
