// Hình người mặc định cho avatar khi KHÔNG có ảnh và tên KHÔNG có chữ (khách đăng nhập bằng số, chưa đổi tên —
// tên tài khoản = số điện thoại). Chủ dự án 26/10/2026: không hiện vòng tròn chữ số "0". Tên có chữ thì vẫn chữ cái đầu.
export const tenKhongCoChu = (ten?: string | null) => !/\p{L}/u.test(ten ?? "");

export default function AvatarMacDinh({ className = "h-[62%] w-[62%]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} opacity-60`} fill="currentColor" aria-hidden>
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.6-8 5.8V21h16v-1.2c0-3.2-3.6-5.8-8-5.8Z" />
    </svg>
  );
}
