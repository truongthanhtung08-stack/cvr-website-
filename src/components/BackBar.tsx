"use client";

import { useEffect, useState } from "react";
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

// ── KHU QUẢN LÝ CỦA KHÁCH (/tai-khoan) — ĐI THEO TẦNG (chủ dự án chốt 25/09/2026)
// TỔNG QUAN LÀ TRANG CHỦ của khu quản lý. Nút ‹ luôn đưa LÊN MỘT TẦNG, không
// lùi theo lịch sử bấm — bấm ở đâu cũng biết trước mình sẽ về đâu:
//
//   Website
//    └─ Tổng quan ............................. ‹ → về trang web đang xem trước khi vào
//        ├─ Tin đăng ........................... ‹ → Tổng quan
//        │   └─ Chi tiết tin .................. ‹ → Tin đăng
//        ├─ Khách hàng ......................... ‹ → Tổng quan
//        ├─ Tài khoản .......................... ‹ → Tổng quan
//        │   └─ Nạp tiền · Hóa đơn · Điểm · Cài đặt · Dự án ‹ → Tài khoản
//        │       └─ Dự án mới / Hồ sơ dự án ... ‹ → Dự án của tôi
//        └─ Đăng tin ........................... ‹ → Tổng quan
//
// Thanh luôn ghi TÊN TRANG ĐANG ĐỨNG (như mọi trang khác trên web).
const TAI_KHOAN_CON: Record<string, string> = {
  "tin-dang": "Tin đăng",
  "khach-hang": "Khách hàng",
  "ca-nhan": "Tài khoản",
  "tuong-tac": "Khách hàng",
  "hoa-don": "Hóa đơn của tôi",
  "nap-tien": "Nạp tiền",
  "hoi-vien": "Gói hội viên",
  "cai-dat": "Cài đặt tài khoản",
  "du-an": "Dự án của tôi",
};
const TAI_KHOAN_CHAU: Record<string, string> = {
  moi: "Đăng dự án mới",
  "ho-so": "Yêu cầu đăng dự án",
};

// Tầng cha trong khu quản lý (theo sơ đồ trên).
function chaTaiKhoan(doan: string[]): string {
  if (["tin-dang", "khach-hang", "ca-nhan", "tuong-tac"].includes(doan[1]) && !doan[2]) return "/tai-khoan";
  if (doan[1] === "tin-dang") return "/tai-khoan/tin-dang";
  if (doan[1] === "du-an" && doan[2]) return "/tai-khoan/du-an";
  return "/tai-khoan/ca-nhan";
}

const laKhuQuanLy = (p: string) => p.startsWith("/tai-khoan") || p.startsWith("/dang-tin");
const laTrangDangNhap = (p: string) => /^\/(dang-nhap|dang-ky|quen-mat-khau|auth)(\/|$)/.test(p);

// Ghi lại đường đi trong phiên (sessionStorage — Header gắn lại mỗi trang nên
// không giữ được trong bộ nhớ component).
function ghiDuongDi(pathname: string) {
  try {
    const hienTai = sessionStorage.getItem("cl_trang_hien");
    if (hienTai === pathname) return;
    if (hienTai) sessionStorage.setItem("cl_trang_truoc", hienTai);
    sessionStorage.setItem("cl_trang_hien", pathname);
    if (!laKhuQuanLy(pathname) && !laTrangDangNhap(pathname) && !pathname.startsWith("/admin")) {
      sessionStorage.setItem("cl_trang_web", pathname + location.search);
    }
  } catch { /* bị chặn bộ nhớ → dùng luật mặc định */ }
}
function docPhien(khoa: string): string {
  try { return sessionStorage.getItem(khoa) ?? ""; } catch { return ""; }
}

export default function BackBar() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  // TÊN TIN / TÊN DỰ ÁN ĐANG XEM — chữ "Chi tiết tin" chung chung không cho biết
  // mình đang ở đâu trong web. Lấy thẳng tiêu đề <h1> của trang: khách mở nhiều
  // tin liên tiếp vẫn biết đang đứng ở tin nào, và bấm Quay lại là về đúng danh
  // sách vừa rời (chủ dự án chốt 11/9/2026).
  const [tenTrang, setTenTrang] = useState("");
  useEffect(() => { ghiDuongDi(pathname); }, [pathname]);
  useEffect(() => {
    let con = true;
    const doc = () => {
      if (!con) return;
      const goc0 = pathname.split("/").filter(Boolean)[0] ?? "";
      const laTrangChiTiet = goc0 === "bat-dong-san" || goc0 === "du-an" || goc0 === "tin-tuc";
      setTenTrang(laTrangChiTiet ? (document.querySelector("h1")?.textContent?.trim() ?? "") : "");
    };
    // Đọc sau khi trang vẽ xong, rồi đọc lại một nhịp nữa cho nội dung vào muộn.
    const r = requestAnimationFrame(doc);
    const t = window.setTimeout(doc, 400);
    return () => {
      con = false;
      cancelAnimationFrame(r);
      window.clearTimeout(t);
    };
  }, [pathname]);

  if (pathname === "/") return null;

  const doan = pathname.split("/").filter(Boolean);
  const goc = doan[0] ?? "";
  const muc = MUC[goc];
  if (!muc) return null;

  // Tên hiển thị: ưu tiên tên trang con của khu tài khoản
  let ten = muc.ten;
  if (goc === "tai-khoan") {
    ten = !doan[1]
      ? "Tổng quan"
      : doan[1] === "tin-dang" && doan[2]
        ? "Chi tiết tin đăng"
        : (doan[2] && TAI_KHOAN_CHAU[doan[2]]) || TAI_KHOAN_CON[doan[1]] || muc.ten;
  }
  // Trang chi tiết (tin / dự án / bài viết) → hiện đúng tên đang xem
  if (doan.length > 1 && tenTrang) ten = tenTrang;

  // Trang cha (chỉ dùng khi KHÔNG có lịch sử để lùi):
  // trang con → chaCon (đường dẫn có thật) · trang gốc của mục → cha
  const cha = doan.length > 1 ? (muc.chaCon ?? `/${goc}`) : muc.cha;

  function quayLai() {
    // TRANG ĐĂNG TIN LUÔN LÙI VỀ TỔNG QUAN TÀI KHOẢN.
    // Khách vào đăng tin từ đủ chỗ: trang chủ, danh sách tin, nút trên menu…
    // Lùi thật thì mỗi lần rơi về một nơi khác nhau, còn bỏ dở giữa chừng mà bị
    // ném ra trang chủ thì không biết tin mình đang ở đâu. Về tài khoản là chỗ
    // quản lý tin, đúng nơi khách cần tới (chủ dự án chốt 11/9/2026).
    if (goc === "dang-tin") {
      router.push("/tai-khoan");
      return;
    }
    // KHU QUẢN LÝ — đi LÊN MỘT TẦNG (sơ đồ ở đầu tệp).
    if (goc === "tai-khoan") {
      // Tổng quan = trang chủ khu quản lý → ra lại trang web đang xem trước khi vào.
      if (!doan[1]) {
        router.push(docPhien("cl_trang_web") || "/");
        return;
      }
      const tangCha = chaTaiKhoan(doan);
      // Vừa từ đúng tầng cha bấm sang → lùi lịch sử (khỏi chồng trang);
      // còn lại → mở thẳng tầng cha.
      if (docPhien("cl_trang_truoc") === tangCha && window.history.length > 1) router.back();
      else router.push(tangCha);
      return;
    }
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
        // top = header 60px + lề trên thanh tìm 6px + 4px → nút THẲNG HÀNG với ô tìm
      // (ô tìm cao 44px, tâm ở 88px; nút cao 36px, tâm cũng 88px).
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
