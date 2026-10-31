// ════════════════════════════════════════════════════════════════════════════
// MỘT NGUỒN CHỮ CHO MỌI THÔNG BÁO GỬI ADMIN — Tổng quan, sổ sự cố, email, hộp báo nút, màn nạp hàng loạt.
// Chủ dự án 31/10/2026: "chuẩn hoá lại thông báo theo đúng nội dung của nó làm tiêu đề" · "chủ đề đúng công việc".
//
// LUẬT ĐẶT CHỮ (mọi thông báo cùng một kiểu):
//   1. Tiêu đề = VIỆC PHẢI LÀM + đối tượng (+ số) — vd "Duyệt tin khách đăng", "Chưa cộng ví: đơn nạp PayOS đã thanh toán".
//   2. Viết hoa chữ đầu, không IN HOA cả câu, không tên kỹ thuật (ZNS, token, hàm…) trong tiêu đề — để ở "Chi tiết lỗi".
//   3. Sự cố luôn 3 dòng: Hậu quả · Cần làm · Chi tiết lỗi.
//   4. Email: "[COASTAL LAND] <tiêu đề>"; sự cố thêm mức "Khẩn" / "Cần xử lý" trước tiêu đề.
// Đổi chữ thông báo → sửa ở đây, không viết rải rác. Bảng chữ cũ → mới: side-session-notes THONG-BAO-ADMIN-CHUAN-HOA-31-10.md.
// ════════════════════════════════════════════════════════════════════════════

const TIEN_TO = "[COASTAL LAND]";

/** Chủ đề email gửi admin. `muc` chỉ dùng cho sự cố. */
export const chuDeEmail = (tieuDe: string, muc?: "khan" | "can") =>
  `${TIEN_TO} ${muc === "khan" ? "Khẩn · " : muc === "can" ? "Cần xử lý · " : ""}${tieuDe}`;

// ── VIỆC CẦN LÀM (Tổng quan + email việc) — số đứng riêng, chữ không lặp số ──────────────
export const VIEC = {
  tinKhach: "Duyệt tin khách đăng",
  tinNap: "Duyệt tin nạp hàng loạt",
  tuKiem: "Sửa lỗi Tự kiểm tin",
  chuaChuanSeo: "Sửa tin chưa đạt chuẩn SEO",
  duAn: "Duyệt dự án",
  duAnKhach: "Duyệt dự án khách gửi",
  hoSoDuAn: "Duyệt hồ sơ đăng dự án",
  tinSua: "Kiểm tin khách vừa sửa",
  yeuCau: "Liên hệ lại khách gửi yêu cầu",
  taiKhoan: "Duyệt tài khoản khách",
  khongCon: "Không còn việc chờ xử lý.",
  xuLy: "Xử lý →",
} as const;

/** "Duyệt tin khách đăng · 2" — tiêu đề có số cho email / khối. */
export const kemSo = (viec: string, n: number, them?: string) => `${viec} · ${n}${them ? ` ${them}` : ""}`;

// ── KHỐI Ở TỔNG QUAN ───────────────────────────────────────────────────────────
export const KHOI = {
  suCo: (n: number) => `Sự cố cần xử lý · ${n}`,
  tuDong: (tot: number, tong: number) => `Việc tự động · ${tot}/${tong} chạy tốt`,
  tuDongNgung: "Việc tự động không chạy hơn 36 giờ. Cần làm: kiểm tra lịch chạy (Cron Jobs) trên Vercel.",
  chuaChuanSeo: (n: number) => `Tin chưa đạt chuẩn SEO · ${n}`,
} as const;

export const NHAN_SU_CO = {
  khan: "Khẩn",
  canXuLy: "Cần xử lý",
  noi: "Xảy ra ở",
  hauQua: "Hậu quả",
  canLam: "Cần làm",
  chiTiet: "Chi tiết lỗi",
  xong: "Đã xử lý",
  moTin: "Mở tin",
} as const;

// ── TIÊU ĐỀ + HẬU QUẢ SỰ CỐ (baoLoi) ─────────────────────────────────────────────
const HQ_VI = "Khách đã trả tiền mà ví chưa có.";
const HQ_DOANH_THU = "Tờ khai thuế thiếu khoản thu; khách chưa có hoá đơn khoản này.";
export const SU_CO = {
  payosKhongRoDon: { tomTat: "Chưa cộng ví: tiền nạp PayOS về không rõ của khách nào", hauQua: HQ_VI },
  payosCongVi: { tomTat: "Chưa cộng ví: đơn nạp PayOS đã thanh toán", hauQua: HQ_VI },
  zaloKhongRoDon: { tomTat: "Chưa cộng ví: tiền nạp qua Zalo không khớp đơn nào", hauQua: HQ_VI },
  zaloCongVi: { tomTat: "Chưa cộng ví: đơn nạp Zalo đã thanh toán", hauQua: HQ_VI },
  zaloChuyenKhoan: { tomTat: (cach: string) => `Đối soát tay: khách nạp ví bằng ${cach} (Zalo)`, hauQua: "Tiền chuyển khoản không tự vào ví." },
  doanhThuDuyetTin: { tomTat: "Chưa ghi doanh thu: phí đăng tin đã trừ ví", hauQua: HQ_DOANH_THU },
  doanhThuDayTin: { tomTat: "Chưa ghi doanh thu: phí đẩy tin đã trừ ví", hauQua: HQ_DOANH_THU },
  doanhThuGoiDay: { tomTat: "Chưa ghi doanh thu: gói đẩy tin đã trừ ví", hauQua: HQ_DOANH_THU },
  doanhThuHoiVien: { tomTat: "Chưa ghi doanh thu: gói hội viên đã trừ ví", hauQua: HQ_DOANH_THU },
  baoKhachDuyet: {
    tomTat: "Chưa báo khách: tin đã duyệt lên web",
    hauQua: (daTru: boolean) => (daTru ? "Khách đã bị trừ tiền mà không biết tin đã lên web." : "Khách không biết tin đã lên web."),
  },
  baoKhachTuChoi: { tomTat: "Chưa báo khách: tin bị từ chối", hauQua: "Khách vẫn xem được lý do trong trang tin của mình." },
  guiDuyetSauNap: { tomTat: "Chưa gửi duyệt: tin của khách vừa nạp tiền", hauQua: "Khách đã nạp tiền mà tin chưa vào hàng chờ duyệt." },
  tuDay: { tomTat: (n: number) => `Chưa đẩy tin: ${n} tin khách đã mua lượt`, hauQua: "Khách đã mua lượt mà hôm nay tin không được đẩy." },
  maDangNhap: { tomTat: "Khách không nhận được mã đăng nhập qua Zalo", hauQua: "Khách đăng nhập bằng số điện thoại không vào được." },
  maDangNhapGoiOa: { tomTat: "Khách không nhận được mã đăng nhập: gói Zalo OA chưa đủ", hauQua: "Khách đăng nhập bằng số điện thoại không vào được." },
  zaloOaMat: { tomTat: "Zalo OA mất kết nối: mã đăng nhập và tin nhắn Zalo ngừng gửi", hauQua: "Khách không nhận được mã đăng nhập và mọi tin nhắn Zalo." },
  zaloOaSapMat: { tomTat: "Zalo OA sắp mất kết nối: không lưu được khoá mới", hauQua: "Trong một giờ, mã đăng nhập và tin nhắn Zalo sẽ ngừng." },
  xoaDuLieuMiniApp: { tomTat: "Xoá dữ liệu khách theo yêu cầu (Zalo Mini App)", hauQua: "Đã cam kết ở trang Bảo mật: xoá trong 30 ngày." },
  miniAppDuyet: (ban: string, tuChoi: boolean) => (tuChoi ? `Zalo từ chối Mini App bản ${ban}` : `Zalo đã duyệt Mini App bản ${ban}`),
  xuatHoaDon: { tomTat: (n: number) => `Chưa xuất hoá đơn: ${n} tờ trong ngày`, hauQua: "Quá hạn trong ngày thì VNPT khoá phát hành, phải gọi tổng đài xin mở." },
  thueSuat: (phanTram: string, conHieuLuc: boolean, soNgay: number) =>
    conHieuLuc ? `Thuế suất GTGT ${phanTram}% còn ${soNgay} ngày` : `Thuế suất GTGT ${phanTram}% đã hết hạn ${soNgay} ngày`,
  tenMien: (n: number) => `Tên miền sai cài đặt: ${n} bản ghi`,
  tinHetHanVanHien: { tomTat: "Tin hết hạn vẫn hiện trên web", hauQua: "Tin quá hạn vẫn hiện miễn phí — không công bằng với người đang trả tiền." },
  quetHetHan: { tomTat: "Chưa hạ tin hết hạn (lượt quét hỏng)", hauQua: "Tin quá hạn còn hiện, khách chưa được nhắc." },
  congBoGia: { tomTat: "Chưa áp giá mới lúc 0h", hauQua: "Khuyến mãi theo ngày chưa áp đúng ngày." },
  viecTuDong: (ten: string) => `Việc tự động hỏng: ${ten}`,
  baoViec: "Chưa gửi được email việc cần làm",
  dinhKy: {
    hoiVienSapHet: "Chưa gửi: nhắc gói hội viên sắp hết hạn",
    uuDaiMoi: "Chưa gửi: ưu đãi thành viên mới",
    timKiemDaLuu: "Chưa gửi: tin mới theo tìm kiếm đã lưu",
    tinNhap: "Chưa gửi: nhắc tin nháp",
    baoCaoTuan: "Chưa gửi: báo cáo tuần",
  },
} as const;

// ── EMAIL VIỆC (bao-viec mỗi giờ, webhook, khách hỏi tin) ───────────────────────────
export const EMAIL = {
  nhieuViec: (n: number) => `${n} việc cần làm`,
  moiDeDuyet: "Mở để duyệt",
  moiDeKiem: "Mở để kiểm",
  moTrang: "Mở trang quản trị",
  xemTin: "Xem tin",
  tinKhachMoi: (n: number, dangCho: number) => `${VIEC.tinKhach} · ${n} mới (đang chờ ${dangCho})`,
  khachHoiTin: (maTin: string) => `Liên hệ lại khách hỏi tin ${maTin} (tin đã hết hạn)`,
  dauTrang: "COASTAL LAND · Quản trị",
} as const;

// ── HỘP BÁO NÚT (admin) ──────────────────────────────────────────────────────────
export const HOP_BAO = {
  chuaLuu: (loi: string) => `Chưa lưu được: ${loi}`,
  hetPhien: "Chưa lưu được: phiên đăng nhập đã hết. Tải lại trang, đăng nhập rồi bấm lại.",
  chuaDuyet: (loi: string) => `Chưa duyệt được tin: ${loi}`,
  loiSeo: (n: number, ds: string) => `Tin còn ${n} lỗi chuẩn SEO:\n· ${ds}\n\nBấm OK để mở tin sửa, xong bấm Duyệt.`,
  daLenWeb: (daTru: string, soDu: string, hoaDon: string) => `Tin đã lên web.\n\nĐã trừ ví: ${daTru}\nSố dư: ${soDu}\nHoá đơn: ${hoaDon}`,
  hetHanSauDuyet: "Đã duyệt nội dung, nhưng tin đã hết hạn — tin chuyển sang Hết hạn, khách cần bấm Đăng lại.",
  chuaDoiTrangThai: (loi: string) => `Chưa đổi được trạng thái tin: ${loi}`,
  chuaGhiLyDo: "Ghi lý do từ chối rồi bấm lại.",
  chuaTuChoi: (loi: string) => `Chưa từ chối được tin: ${loi}`,
  daTuChoi: (baoKhach: "da" | "dangHo" | "chua", kenhHong: string) =>
    "Đã từ chối tin.\n\n" +
    (baoKhach === "da" ? "Đã báo khách." : baoKhach === "dangHo" ? "Tin đăng hộ — không nhắn khách." : "Chưa báo được khách — cần gọi hoặc nhắn tay.") +
    (kenhHong ? `\n\nKênh không gửi được:\n${kenhHong}` : ""),
  chuaXoaNhieu: (loi: string) => `Chưa xoá được tin nào: ${loi}`,
  chuaXoa: (loi: string) => `Chưa xoá được tin: ${loi}`,
  chuaKhoiPhuc: (loi: string) => `Chưa khôi phục được tin: ${loi}`,
  chuaGanVideo: (loi: string, daGan: string) => `Chưa gắn được video: ${loi}${daGan ? `\n\nĐã gắn:\n${daGan}` : ""}`,
  daGanVideo: (n: number, ds: string) => `Đã gắn video cho ${n} tin, đã lên web:\n${ds}`,
  khongVideoMoi: "Không có video mới để gắn. Video phải để Công khai và tên có mã tin (vd dn20-2410).",
} as const;

// ── MÀN NẠP HÀNG LOẠT (tin + dự án) ──────────────────────────────────────────────
export const NAP = {
  dongCanSua: "Sửa các dòng sau trong tệp rồi tải lại:",
  chuaChuanSeo: "Nên sửa cho đạt chuẩn SEO (vẫn đăng được):",
  maTrungDotKhac: (n: number) => `Kiểm ${n} mã tin trùng mã đợt ngày khác — vẫn đăng thành tin mới, không đụng tin cũ:`,
  khongKetNoi: "Chưa nạp được: không kết nối được cơ sở dữ liệu.",
  napLoi: (loi: string) => `Chưa nạp được: ${loi}`,
  dangLoiGiuaChung: (xong: number, loi: string) => `Đã đăng ${xong} tin, dừng vì lỗi: ${loi}`,
  dangLoiGiuaChungCapNhat: (xong: number, capNhat: number, loi: string) => `Đã đăng ${xong} tin, cập nhật ${capNhat} tin, dừng vì lỗi: ${loi}`,
} as const;
