import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";
import YeuCauForm from "@/components/YeuCauForm";

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
// Địa chỉ ghi theo đơn vị hành chính MỚI 2025 (Tỉnh/Thành → Phường/Xã)
const DIA_CHI = "220 Nguyễn Mậu Tài, phường Hòa Xuân, thành phố Đà Nẵng";

export default function LienHePage() {
  return (
    <TrangPhapLy
      title="Liên hệ"
      moDau="Bạn cần hỗ trợ đăng tin, có thắc mắc về dịch vụ hoặc muốn hợp tác? Gọi hotline để được trả lời ngay, hoặc để lại yêu cầu bên dưới — chúng tôi liên hệ lại trong giờ làm việc."
    >
      <Muc title="Kênh liên hệ">
        <DanhSach
          items={[
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
              . Người tìm mua, tìm thuê dùng website miễn phí.
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

      <Muc title="Lưu ý quan trọng">
        <p>
          Coastal Land là <strong className="font-semibold text-cvr-ink">cổng thông tin bất động sản</strong>. Chúng tôi
          không mua bán, không phân phối, không ký gửi, không môi giới và không định giá bất động sản. Mọi thoả thuận,
          đặt cọc và thanh toán là việc giữa bạn và người đăng tin, diễn ra ngoài nền tảng.
        </p>
        <p>
          Nhân viên Coastal Land <strong className="font-semibold text-cvr-ink">không bao giờ</strong> yêu cầu bạn chuyển
          tiền đặt cọc mua bán bất động sản vào tài khoản cá nhân. Nếu gặp trường hợp như vậy, hãy{" "}
          <Link href="/gop-y" className="font-semibold text-cvr-blue-ink underline">
            báo ngay cho chúng tôi
          </Link>
          .
        </p>
      </Muc>
    </TrangPhapLy>
  );
}
