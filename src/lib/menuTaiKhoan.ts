// Các mục của nhóm "Tài khoản" — dùng chung cho menu trái (máy tính) và trang
// /tai-khoan/ca-nhan (nút "Tài khoản" ở thanh dưới cùng trên điện thoại).
// Sửa một chỗ là cả hai nơi đổi theo.
export type MucTaiKhoan = { label: string; href: string; icon: string };

export const MUC_TAI_KHOAN: MucTaiKhoan[] = [
  { label: "Ví & nạp tiền", href: "/tai-khoan/nap-tien", icon: "card" },
  { label: "Hóa đơn", href: "/tai-khoan/hoa-don", icon: "bill" },
  { label: "Điểm thưởng", href: "/tai-khoan/doi-diem", icon: "star" },
  { label: "Bảng giá dịch vụ", href: "/bao-gia-dang-tin", icon: "tag" },
  { label: "Dự án của tôi", href: "/tai-khoan/du-an", icon: "building" },
  { label: "Tin đã lưu", href: "/tin-luu", icon: "heart" },
  { label: "Cài đặt", href: "/tai-khoan/cai-dat", icon: "gear" },
];
