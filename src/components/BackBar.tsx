"use client";

import { useRouter, usePathname } from "next/navigation";

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

// Mỗi mục khai BA thứ:
//   ten     – tên hiển thị trên thanh
//   cha     – về đâu khi đang ở TRANG GỐC của mục (vd /mua-ban → trang chủ)
//   chaCon  – về đâu khi đang ở TRANG CON (vd /bat-dong-san/abc → /mua-ban)
// PHẢI khai chaCon bằng đường dẫn THẬT CÓ TRANG: /bat-dong-san, /tien-ich và
// /landing KHÔNG có trang gốc → lùi về đó là lỗi 404.
const MUC: Record<string, { ten: string; cha: string; chaCon?: string }> = {
  "mua-ban": { ten: "Mua bán", cha: "/" },
  "cho-thue": { ten: "Cho thuê", cha: "/" },
  "du-an": { ten: "Dự án", cha: "/", chaCon: "/du-an" },
  "tin-tuc": { ten: "Tin tức", cha: "/", chaCon: "/tin-tuc" },
  "chuyen-gia": { ten: "Chuyên gia", cha: "/", chaCon: "/chuyen-gia" },
  "tien-ich": { ten: "Tiện ích", cha: "/", chaCon: "/bao-gia-dang-tin" }, // không có trang gốc
  "bat-dong-san": { ten: "Chi tiết tin", cha: "/mua-ban", chaCon: "/mua-ban" }, // không có trang gốc
  "tim-kiem": { ten: "Kết quả tìm kiếm", cha: "/" },
  "so-sanh": { ten: "So sánh", cha: "/" },
  "tin-luu": { ten: "Tin đã lưu", cha: "/" },
  "dang-tin": { ten: "Đăng tin", cha: "/tai-khoan", chaCon: "/tai-khoan" },
  "bao-gia-dang-tin": { ten: "Bảng giá dịch vụ", cha: "/" },
  "gioi-thieu": { ten: "Giới thiệu", cha: "/" },
  "tai-khoan": { ten: "Tài khoản", cha: "/", chaCon: "/tai-khoan" },
  landing: { ten: "Trang giới thiệu", cha: "/", chaCon: "/" }, // không có trang gốc

  // ── Trang thông tin · hỗ trợ · pháp lý · tài khoản ────────────────────────
  // TRƯỚC ĐÂY THIẾU HẲN → trên điện thoại các trang này KHÔNG có nút quay lại,
  // khách vào rồi mắc kẹt. Nặng nhất là Liên hệ và Góp ý — đúng chỗ khách nhắn tin.
  "lien-he": { ten: "Liên hệ", cha: "/" },
  "gop-y": { ten: "Góp ý", cha: "/" },
  faq: { ten: "Câu hỏi thường gặp", cha: "/" },
  "huong-dan": { ten: "Hướng dẫn", cha: "/" },
  "quy-che": { ten: "Quy chế hoạt động", cha: "/" },
  "quy-dinh": { ten: "Quy định đăng tin", cha: "/" },
  "dieu-khoan": { ten: "Điều khoản thoả thuận", cha: "/" },
  "bao-mat": { ten: "Chính sách bảo mật", cha: "/" },
  "tuyen-dung": { ten: "Tuyển dụng", cha: "/" },
  "dang-nhap": { ten: "Đăng nhập", cha: "/", chaCon: "/dang-nhap" },
  "dang-ky": { ten: "Đăng ký", cha: "/" },
  "quen-mat-khau": { ten: "Quên mật khẩu", cha: "/dang-nhap" },
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

  // Trang cha (chỉ dùng khi KHÔNG có lịch sử để lùi):
  // trang con → chaCon (đường dẫn có thật) · trang gốc của mục → cha
  const cha = doan.length > 1 ? (muc.chaCon ?? `/${goc}`) : muc.cha;

  function quayLai() {
    // NÚT BACK = LÙI THẬT. Còn lịch sử thì lùi đúng trang vừa xem.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    // Chỉ khi KHÔNG có gì để lùi (mở thẳng từ link Zalo/Facebook trong tab mới)
    // mới đưa về trang cha — và trang cha luôn là đường dẫn CÓ THẬT.
    router.push(cha);
  }

  // ── RIÊNG TRANG DỰ ÁN (/du-an): NÚT TRÒN NỔI, không phải thanh ngang ───────
  // Trang này đầu màn hình đã có ô tìm + BANNER rất to, thêm một thanh Back cao
  // ~53px nữa là mất trọn một dòng. Ở đây nút back thành nút tròn `fixed` đè lên
  // nội dung → cả trang kéo lên 53px mà vẫn luôn có lối quay lại.
  // Nền trắng mờ + bóng để nổi rõ trên cả nền trắng lẫn ảnh banner tối.
  // z-40: dưới header (z-50) và drawer menu (z-[45]), trên nội dung trang.
  // CÁC TRANG KHÁC GIỮ NGUYÊN thanh Back cũ (trang chi tiết dự án còn có
  // ProjectNav dính theo mốc 113px = header + thanh back — bỏ thanh là lệch).
  if (pathname === "/du-an") {
    return (
      <button
        type="button"
        onClick={quayLai}
        aria-label={`Quay lại — ${ten}`}
        title={`Quay lại — ${ten}`}
        className="fixed left-2 top-[calc(60px+env(safe-area-inset-top)+10px)] z-40 flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/90 text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.18)] backdrop-blur-md transition active:scale-95 active:bg-white lg:hidden"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
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
