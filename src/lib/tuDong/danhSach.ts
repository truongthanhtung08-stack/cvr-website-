import { chupGiaKhuVuc } from "@/lib/chupGiaKhuVuc";
import { quetTinHetHan } from "@/lib/hetHanTin";
import { baoLoi } from "@/lib/baoLoi";
import { hanThueSuat, HAN_THUE_SUAT, THUE_SUAT_GTGT } from "@/lib/thue";
import { viecCanhDns } from "./canhDns";
import type { Viec } from "./soViec";

// ════════════════════════════════════════════════════════════════════════════
// DANH SÁCH VIỆC MÁY TỰ LÀM MỖI NGÀY
//
// Chạy hai lần/ngày kèm theo cron nhắc hoá đơn: 20:00 và 08:30 giờ VN.
// Chạy hai lần đều VÔ HẠI — việc nào cũng tự biết cái gì đã làm rồi thì thôi.
//
// THÊM VIỆC MỚI: viết một object Viec rồi thêm vào mảng dưới đây. KHÔNG tạo
// cron mới — gói Vercel đang dùng chỉ cho 2 suất và đã dùng hết; khai suất thứ
// ba là hỏng cả lần deploy.
//
// ĐIỀU KIỆN để một việc nằm được ở đây: chạy được TRÊN MÁY CHỦ, không cần người
// bấm, không cần tệp trên máy chủ dự án. Việc cần tệp ở ổ D hoặc cần người nhìn
// thì nằm ở bảng điều khiển chạy tay: `npm run viec`.
// ════════════════════════════════════════════════════════════════════════════

/** Chụp lại mặt bằng giá từng khu vực để vẽ biểu đồ lịch sử giá. */
const viecChupGia: Viec = {
  ma: "chup-gia-khu-vuc",
  ten: "Chụp mặt bằng giá khu vực",
  hauQua: "Biểu đồ lịch sử giá đứt quãng — mất dữ liệu của những ngày hỏng, không chụp bù lại được.",
  async chay() {
    const kq = await chupGiaKhuVuc();
    if (!kq) return { tomTat: "Chưa chụp (thiếu khoá máy chủ hoặc chưa tới kỳ)" };
    return { tomTat: `Ghi ${kq.ghi} khu vực, bỏ qua ${kq.boQua}`, soLieu: { ...kq } };
  },
};

/** Tin hết hạn gói thì hạ về tin thường; sắp hết hạn thì nhắc khách gia hạn. */
const viecHetHanTin: Viec = {
  ma: "quet-tin-het-han",
  ten: "Quét tin hết hạn gói",
  hauQua: "Khách mua gói 30 ngày vẫn giữ hạng VIP mãi mãi — mất toàn bộ doanh thu gia hạn.",
  async chay(admin) {
    const kq = await quetTinHetHan(admin);
    return { tomTat: `Hạ ${kq.daHa} tin hết hạn, nhắc ${kq.daNhac} tin sắp hết`, soLieu: { ...kq } };
  },
};

/**
 * Thuế suất GTGT 8% là chính sách CÓ THỜI HẠN. Qua hạn mà chưa ai sửa thì mọi
 * hoá đơn xuất ra đều sai thuế suất, kéo theo sai tờ khai — mà không có gì báo.
 * Nhắc từ 45 ngày trước, nhắc tiếp mỗi ngày cho tới khi được xử lý.
 */
const viecHanThueSuat: Viec = {
  ma: "han-thue-suat",
  ten: "Canh hạn thuế suất GTGT",
  hauQua: "Qua hạn mà không ai sửa thì hoá đơn xuất ra sai thuế suất, kéo theo sai tờ khai GTGT.",
  async chay() {
    const han = hanThueSuat();
    if (!han.canNhac) {
      return { tomTat: `Còn ${han.conLai} ngày tới hạn ${HAN_THUE_SUAT} — chưa cần nhắc` };
    }

    await baoLoi({
      noi: "hoa-don",
      mucDo: han.conHieuLuc ? "nang" : "chet",
      tomTat: han.conHieuLuc
        ? `Thuế suất GTGT ${(THUE_SUAT_GTGT * 100).toFixed(0)}% còn hiệu lực ${han.conLai} ngày`
        : `Thuế suất GTGT ${(THUE_SUAT_GTGT * 100).toFixed(0)}% ĐÃ HẾT HIỆU LỰC ${-han.conLai} ngày`,
      chiTiet: `Hạn cuối: ${HAN_THUE_SUAT} (Nghị quyết 204/2025/QH15).`,
      hauQua: han.conHieuLuc
        ? "Qua hạn mà chưa sửa thì mọi hóa đơn xuất ra sẽ sai thuế suất, kéo theo sai tờ khai GTGT."
        : "Hóa đơn đang xuất SAI THUẾ SUẤT — phải điều chỉnh với cơ quan thuế.",
      canLam:
        "Hỏi kế toán xem Quốc hội có gia hạn không. Còn 8% thì sửa HAN_THUE_SUAT sang mốc mới; quay lại 10% thì sửa THUE_SUAT_GTGT trong src/lib/thue.ts và đăng ký lại bên VNPT nếu cần.",
      // Mỗi ngày một cảnh báo riêng — không nuốt mất, ngày nào cũng thấy.
      khoa: `thue:han-thue-suat:${new Date().toISOString().slice(0, 10)}`,
    });

    return {
      tomTat: han.conHieuLuc
        ? `Đã nhắc: còn ${han.conLai} ngày tới hạn ${HAN_THUE_SUAT}`
        : `Đã báo GẤP: quá hạn ${-han.conLai} ngày`,
    };
  },
};

export const DANH_SACH_VIEC: Viec[] = [
  viecChupGia,
  viecHetHanTin,
  viecHanThueSuat,
  viecCanhDns,
];
