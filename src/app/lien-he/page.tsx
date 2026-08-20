// ════════════════════════════════════════════════════════════════════════════
// 📝 SỬA CHỮ CỦA TRANG NÀY NGAY TẠI ĐÂY (VS Code) — Admin KHÔNG quản trang này,
//    nên sửa xong là lên web (sau khi push). Không phải vào /admin.
//
//    CÁCH SỬA AN TOÀN:
//    · Chỉ đổi phần chữ tiếng Việt NẰM GIỮA HAI DẤU NHÁY "..."
//    · Giữ nguyên dấu phẩy, dấu ngoặc và các thẻ <p> <Muc> <DanhSach> <Link>
//    · Thêm một gạch đầu dòng: chép cả một dòng "..." rồi dán xuống dưới, sửa chữ
//    · Bỏ một gạch đầu dòng: xoá trọn dòng "...", kể cả dấu phẩy cuối dòng
//    · Sửa xong: Ctrl+S → xem http://localhost:3000 → ưng thì nhắn "Push"
//
//    Lỡ hỏng: Ctrl+Z liên tục để hoàn tác về lúc còn chạy được.
//    Hướng dẫn đầy đủ: HUONG-DAN-SUA-NOI-DUNG-VA-ANH.md (mục 4.4)
// ════════════════════════════════════════════════════════════════════════════
import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";
import YeuCauForm from "@/components/YeuCauForm";
import { PHAP_LY } from "@/lib/phapLy";

export const metadata: Metadata = {
  alternates: { canonical: "/lien-he" },
  title: "Liên hệ",
  description:
    "Liên hệ Coastal Land — hotline, Zalo, email hỗ trợ đăng tin và giải đáp thắc mắc về cổng thông tin bất động sản Duyên hải Miền Trung.",
};

// Thông tin liên hệ chuẩn (trùng với footer + trang Điều khoản).
const HOTLINE = "0377 985 036";
const HOTLINE_TEL = "+84377985036";
const EMAIL = "lienhe@coastalland.vn";
// Địa chỉ lấy từ src/lib/phapLy.ts — MỘT nguồn duy nhất, khớp giấy ĐKKD và footer.
const DIA_CHI = PHAP_LY.diaChiDayDu;

export default function LienHePage() {
  return (
    <TrangPhapLy
      title="Liên hệ"
      moDau="Bạn cần hỗ trợ đăng tin, có thắc mắc về dịch vụ hoặc muốn hợp tác? Gọi hotline để được trả lời ngay, hoặc để lại yêu cầu bên dưới — chúng tôi liên hệ lại trong giờ làm việc."
    >
      <Muc title="Kênh liên hệ">
        <DanhSach
          items={[
            // Pháp nhân vận hành — lấy từ src/lib/phapLy.ts, ô trống thì dòng tự ẩn.
            ...(PHAP_LY.tenCongTy
              ? [<>Đơn vị chủ quản: <strong className="font-semibold text-cvr-ink">{PHAP_LY.tenCongTy}</strong>{PHAP_LY.maSoThue ? ` — MSDN ${PHAP_LY.maSoThue}` : ""}</>]
              : []),
            <>
              Hotline / Zalo:{" "}
              <a href={`tel:${HOTLINE_TEL}`} className="font-semibold text-cvr-blue-ink underline">
                {HOTLINE}
              </a>{" "}
              — nhanh nhất, hỗ trợ trực tiếp.
            </>,
            <>
              Email:{" "}
              <a href={`mailto:${EMAIL}`} className="font-semibold text-cvr-blue-ink underline">
                {EMAIL}
              </a>{" "}
              — dành cho yêu cầu cần gửi kèm tài liệu, hình ảnh.
            </>,
            <>
              Văn phòng:{" "}
              <strong className="font-semibold text-cvr-ink">{DIA_CHI}</strong>. Vui lòng gọi trước khi đến để chúng tôi
              bố trí người tiếp.
            </>,
            <>Khu vực hoạt động: Đà Nẵng · Huế và các tỉnh Duyên hải Miền Trung.</>,
            <>Giờ làm việc: 8:00 – 18:00, Thứ Hai đến Thứ Bảy. Ngoài giờ, vui lòng nhắn Zalo hoặc để lại yêu cầu.</>,
          ]}
        />
      </Muc>

      <Muc title="Bạn đang cần gì?">
        <DanhSach
          items={[
            <>
              Muốn đăng tin bán / cho thuê →{" "}
              <Link href="/dang-tin" className="font-semibold text-cvr-blue-ink underline">
                Đăng tin
              </Link>{" "}
              hoặc xem{" "}
              <Link href="/huong-dan" className="font-semibold text-cvr-blue-ink underline">
                hướng dẫn đăng tin
              </Link>
              .
            </>,
            <>
              Muốn biết chi phí →{" "}
              <Link href="/bao-gia-dang-tin" className="font-semibold text-cvr-blue-ink underline">
                Báo giá dịch vụ
              </Link>
              .
            </>,
            <>
              Thắc mắc chung →{" "}
              <Link href="/faq" className="font-semibold text-cvr-blue-ink underline">
                Câu hỏi thường gặp
              </Link>
              .
            </>,
            <>
              Phát hiện tin sai, tin ảo hoặc lỗi kỹ thuật →{" "}
              <Link href="/gop-y" className="font-semibold text-cvr-blue-ink underline">
                Góp ý, báo lỗi
              </Link>
              .
            </>,
          ]}
        />
      </Muc>

      <Muc title="Gửi yêu cầu cho chúng tôi">
        <p>Để lại thông tin, bộ phận hỗ trợ sẽ gọi lại cho bạn.</p>
        <YeuCauForm
          loai="ho_tro"
          goiYNoiDung="Bạn cần hỗ trợ việc gì? (VD: cần đăng tin bán nhà tại Đà Nẵng, cần tư vấn gói tin…)"
          nhanNut="Gửi liên hệ"
          loiNhanXong="Đã nhận liên hệ của bạn. Coastal Land sẽ gọi lại trong giờ làm việc."
        />
      </Muc>

      <Muc title="Đôi điều để bạn nắm">
        <p>
          Coastal Land là <strong className="font-semibold text-cvr-ink">cổng thông tin bất động sản</strong> — nơi
          người có nhà đất và người đang tìm gặp nhau. Chúng tôi không mua bán, không phân phối, không ký gửi, không môi
          giới và không định giá. Việc thoả thuận, đặt cọc và thanh toán là giữa bạn với người đăng tin.
        </p>
        <p>
          Việc đặt cọc, thanh toán bạn làm trực tiếp với người bán hoặc môi giới của họ — Coastal Land không đứng ra thu
          hộ khoản nào. Có gì chưa rõ, bạn{" "}
          <Link href="/gop-y" className="font-semibold text-cvr-blue-ink underline">
            nhắn cho chúng tôi
          </Link>{" "}
          nhé.
        </p>
      </Muc>
    </TrangPhapLy>
  );
}
