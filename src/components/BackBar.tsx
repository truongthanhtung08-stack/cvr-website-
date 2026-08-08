"use client";

import { useRouter, usePathname } from "next/navigation";
import { haptic } from "@/lib/haptic";

// ============================================================================
// NÚT QUAY LẠI — CHỈ TRÊN ĐIỆN THOẠI (< lg)
// ----------------------------------------------------------------------------
// Web nhiều mục, khách dùng điện thoại đủ loại (nhiều máy Android không có nút
// back cứng, hoặc cử chỉ vuốt cạnh dễ bấm nhầm) → mọi trang trong web đều phải
// có lối quay lại rõ ràng ngay trên màn hình.
//
// Cách hoạt động:
//   · Dính ngay dưới header (60px) nên cuộn tới đâu cũng thấy.
//   · Có lịch sử trong web → quay lại đúng trang trước.
//   · Vào thẳng từ link Zalo/Facebook (không có lịch sử) → về TRANG CHA hợp lý
//     của mục đang xem, không bao giờ đưa khách ra khỏi web.
//   · Kèm TÊN MỤC đang xem để khách biết mình đang ở đâu.
// Trang chủ không hiện (không có gì để quay lại).
// ============================================================================

// Mục cha + tên hiển thị theo đoạn đầu của đường dẫn
const MUC: Record<string, { ten: string; cha: string }> = {
  "mua-ban": { ten: "Mua bán", cha: "/" },
  "cho-thue": { ten: "Cho thuê", cha: "/" },
  "du-an": { ten: "Dự án", cha: "/" },
  "tin-tuc": { ten: "Tin tức", cha: "/" },
  "chuyen-gia": { ten: "Chuyên gia", cha: "/" },
  "tien-ich": { ten: "Tiện ích", cha: "/" },
  "bat-dong-san": { ten: "Chi tiết tin", cha: "/mua-ban" },
  "tim-kiem": { ten: "Kết quả tìm kiếm", cha: "/" },
  "so-sanh": { ten: "So sánh", cha: "/" },
  "tin-luu": { ten: "Tin đã lưu", cha: "/" },
  "dang-tin": { ten: "Đăng tin", cha: "/tai-khoan" },
  "bao-gia-dang-tin": { ten: "Bảng giá dịch vụ", cha: "/" },
  "gioi-thieu": { ten: "Giới thiệu", cha: "/" },
  "tai-khoan": { ten: "Tài khoản", cha: "/" },
  landing: { ten: "Trang giới thiệu", cha: "/" },
};

// Tên riêng cho các trang con của khu tài khoản (admin của khách hàng)
const TAI_KHOAN_CON: Record<string, string> = {
  "tin-dang": "Tin đã đăng",
  "nap-tien": "Nạp tiền",
  "doi-diem": "Đổi điểm",
  "cai-dat": "Cài đặt",
  "du-an": "Dự án của tôi",
};

export default function BackBar() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  if (pathname === "/") return null;

  const doan = pathname.split("/").filter(Boolean);
  const goc = doan[0] ?? "";
  const muc = MUC[goc];
  if (!muc) return null;

  // Tên hiển thị: ưu tiên tên trang con của khu tài khoản
  let ten = muc.ten;
  if (goc === "tai-khoan" && doan[1]) ten = TAI_KHOAN_CON[doan[1]] ?? muc.ten;

  // Trang cha: trang con lùi về trang gốc của mục, trang gốc lùi theo bảng trên
  const cha = doan.length > 1 ? `/${goc}` : muc.cha;

  function quayLai() {
    haptic();
    // Có lịch sử trong chính web này → lùi đúng trang trước đó
    if (typeof window !== "undefined" && window.history.length > 1 && document.referrer.includes(window.location.host)) {
      router.back();
      return;
    }
    router.push(cha); // vào thẳng từ link ngoài → về trang cha hợp lý
  }

  return (
    <div className="sticky top-[calc(60px+env(safe-area-inset-top))] z-30 border-b border-cvr-line bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={quayLai}
          aria-label="Quay lại"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-ink transition active:bg-cvr-surface"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-cvr-ink">{ten}</span>
      </div>
    </div>
  );
}
