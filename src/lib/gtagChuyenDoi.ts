// ============================================================================
// BẮN CHUYỂN ĐỔI VỀ GOOGLE ADS + GOOGLE ANALYTICS 4
// ----------------------------------------------------------------------------
// Vì sao cần: thẻ Google trong Analytics.tsx mới chỉ đếm NGƯỜI VÀO WEB. Muốn
// Google Ads biết quảng cáo nào ra khách THẬT (đăng ký được, đăng tin được) thì
// phải bắn tín hiệu tại đúng lúc việc đó xảy ra — chính là hàm dưới đây.
//
// ⚠️ HAI ĐIỀU KHÔNG ĐƯỢC LÀM SAI, vì làm sai là đốt tiền quảng cáo:
//   1. KHÔNG bắn "khách bấm vào web" làm chuyển đổi. Google đã đếm sẵn lượt bấm
//      ở cột Clicks rồi. Đặt click làm chuyển đổi sẽ dạy Google đi tìm người
//      bấm-xong-thoát, và báo cáo đẹp giả (gần 100%) trong khi không ai đăng ký.
//   2. KHÔNG bắn "đăng nhập" làm chuyển đổi chính. Người đăng nhập là khách CŨ —
//      trả tiền quảng cáo để kéo khách cũ quay lại là lãng phí ngân sách.
//
// ── CẮM NHÃN CHUYỂN ĐỔI ─────────────────────────────────────────────────────
// Lấy nhãn: Google Ads → Mục tiêu → Chuyển đổi → Tóm tắt → chọn hành động →
// "Thiết lập thẻ" → "Tự cài đặt thẻ" → phần "Thẻ sự kiện" hiện chuỗi:
//        send_to: 'AW-18365884419/AbC-dEfGhIjKlMnOp'
// PHẦN SAU dấu gạch chéo (AbC-dEfGhIjKlMnOp) chính là nhãn — điền vào hai hằng
// số NHAN_*_MAC_DINH ngay bên dưới.
//
// Vì sao ghi thẳng vào code chứ không cắm biến trên Vercel: nhãn chuyển đổi
// KHÔNG phải khoá bí mật (nó lộ trong mã nguồn mọi trang có gắn thẻ Google),
// nên ghi ở đây là đủ — đỡ phải vào Vercel đặt biến rồi Redeploy. Vẫn giữ đường
// biến môi trường để đổi gấp mà không cần sửa code.
//
// CHƯA CẮM NHÃN THÌ SAO? Web vẫn chạy bình thường, vẫn bắn sự kiện sang GA4
// (sign_up / dang_tin_thanh_cong) — chỉ là Google Ads chưa nhận trực tiếp. Đây
// là cố ý: thà thiếu số liệu còn hơn bắn nhãn sai làm hỏng dữ liệu chiến dịch.
// ============================================================================

const ADS_ID = process.env.NEXT_PUBLIC_ADS_ID || "AW-18365884419";

export type TenChuyenDoi = "dang_ky" | "dang_tin";

// 👇 ĐIỀN NHÃN VÀO ĐÂY (xem cách lấy ở đầu file). Để trống là chưa bật.
const NHAN_DANG_KY_MAC_DINH = "";
const NHAN_DANG_TIN_MAC_DINH = "";

const NHAN_ADS: Record<TenChuyenDoi, string> = {
  dang_ky: process.env.NEXT_PUBLIC_ADS_NHAN_DANG_KY || NHAN_DANG_KY_MAC_DINH,
  dang_tin: process.env.NEXT_PUBLIC_ADS_NHAN_DANG_TIN || NHAN_DANG_TIN_MAC_DINH,
};

// Tên sự kiện gửi sang GA4. "sign_up" là tên chuẩn Google hiểu sẵn; tên tự đặt
// thì phải vào GA4 → Sự kiện → đánh dấu là lượt chuyển đổi mới dùng được.
const SU_KIEN_GA4: Record<TenChuyenDoi, string> = {
  dang_ky: "sign_up",
  dang_tin: "dang_tin_thanh_cong",
};

type GtagFn = (...args: unknown[]) => void;

export function banChuyenDoi(ten: TenChuyenDoi, thongTin?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return; // chặn quảng cáo / script chưa tải xong

  // 1) Sang GA4 — luôn bắn, không cần nhãn.
  gtag("event", SU_KIEN_GA4[ten], thongTin ?? {});

  // 2) Sang Google Ads — chỉ khi đã cắm nhãn thật.
  const nhan = NHAN_ADS[ten];
  if (nhan) gtag("event", "conversion", { send_to: `${ADS_ID}/${nhan}`, ...thongTin });
}

// ── CHỐNG ĐẾM TRÙNG ─────────────────────────────────────────────────────────
// Khách tải lại trang /tai-khoan mười lần thì vẫn chỉ là MỘT lượt đăng ký.
// Ghi dấu vào localStorage theo khoá riêng để lần sau không bắn lại nữa.
export function banChuyenDoiMotLan(khoa: string, ten: TenChuyenDoi, thongTin?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const k = `cl-cv-${khoa}`;
  try {
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, "1");
  } catch {
    /* trình duyệt chặn localStorage → vẫn bắn, thà trùng còn hơn mất */
  }
  banChuyenDoi(ten, thongTin);
}
