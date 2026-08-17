import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";

export const metadata: Metadata = {
  alternates: { canonical: "/quy-dinh" },
  title: "Quy định đăng tin",
  description:
    "Quy định đăng tin bất động sản trên Coastal Land: điều kiện tin được duyệt, nội dung và hình ảnh bị cấm, xử lý tin vi phạm và cách khiếu nại.",
};

export default function QuyDinhPage() {
  return (
    <TrangPhapLy
      title="Quy định đăng tin"
      capNhat="17/08/2026"
      moDau="Quy định này áp dụng cho mọi tin đăng bán, cho thuê và mọi dự án trên coastalland.vn. Đăng tin đồng nghĩa với việc bạn chấp nhận các quy định dưới đây."
    >
      <Muc so={1} title="Nguyên tắc chung">
        <p>
          <strong className="font-semibold text-cvr-ink">Mọi tin đăng đều phải được Coastal Land duyệt trước khi hiển thị công khai.</strong>{" "}
          Tin gửi lên nằm ở trạng thái chờ duyệt cho tới khi được kiểm tra.
        </p>
        <p>Người đăng phải là chủ sở hữu, người được chủ sở hữu uỷ quyền, hoặc môi giới đang thực sự nhận bán / cho thuê bất động sản đó.</p>
      </Muc>

      <Muc so={2} title="Điều kiện để một tin được duyệt">
        <DanhSach
          items={[
            "Thông tin đúng sự thật: vị trí, diện tích, giá, số phòng, tình trạng pháp lý.",
            "Giá ghi đúng đơn vị và là mức giá đang chào bán thật, không đăng giá thấp bất thường để dụ khách gọi.",
            "Địa chỉ xác định được tới cấp Phường/Xã theo danh mục hành chính của hệ thống.",
            "Ảnh là ảnh thật của chính bất động sản đang rao, còn mới, đủ sáng, thấy rõ hiện trạng.",
            "Tiêu đề mô tả đúng bất động sản, không viết hoa toàn bộ, không chèn ký tự trang trí.",
            "Loại hình và nhu cầu (bán / cho thuê) chọn đúng, không đặt nhầm danh mục để chiếm chỗ.",
            "Số điện thoại liên hệ là số đang dùng và người nghe nắm được thông tin bất động sản.",
          ]}
        />
      </Muc>

      <Muc so={3} title="Nội dung không được phép">
        <DanhSach
          items={[
            "Tin ảo, tin không có thật, tin đã bán / đã cho thuê nhưng vẫn giữ để nhận cuộc gọi.",
            "Đăng trùng: cùng một bất động sản chia thành nhiều tin, hoặc đăng lại liên tục để đẩy lên đầu.",
            "Sao chép nội dung, hình ảnh của người khác khi chưa được phép; ảnh có logo, số điện thoại của đơn vị khác.",
            "Chèn số điện thoại, email, đường dẫn website ngoài vào tiêu đề, mô tả hoặc hình ảnh.",
            "Nội dung sai sự thật về quy hoạch, pháp lý, tiến độ dự án nhằm gây hiểu nhầm.",
            "Nội dung vi phạm pháp luật, trái thuần phong mỹ tục, xúc phạm tổ chức hoặc cá nhân.",
            "Bất động sản đang tranh chấp, bị kê biên, hoặc bị cấm chuyển nhượng theo quy định pháp luật.",
            "Rao bán những thứ không phải bất động sản; quảng cáo dịch vụ trá hình dưới dạng tin nhà đất.",
          ]}
        />
      </Muc>

      <Muc so={4} title="Quy định về hình ảnh và video">
        <DanhSach
          items={[
            "Tối thiểu 1 ảnh; nên có từ 4 ảnh trở lên để tin được người mua bấm vào nhiều hơn.",
            "Không dùng ảnh chụp màn hình, ảnh phối cảnh thay cho hiện trạng thật mà không ghi rõ.",
            "Không chèn chữ quảng cáo, khung viền, số điện thoại lên ảnh.",
            "Ảnh phối cảnh, ảnh minh hoạ dự án phải được ghi chú rõ là phối cảnh.",
            "Video (tệp tải lên hoặc link YouTube) phải quay chính bất động sản đang rao.",
          ]}
        />
      </Muc>

      <Muc so={5} title="Thời hạn và gia hạn">
        <p>
          Mỗi tin hiển thị theo thời hạn của gói đã chọn (xem{" "}
          <Link href="/bao-gia-dang-tin" className="font-semibold text-cvr-blue-ink underline">
            Báo giá dịch vụ
          </Link>
          ). Hết hạn, tin tự ẩn khỏi danh sách; bạn có thể gia hạn hoặc đăng lại trong mục{" "}
          <Link href="/tai-khoan/tin-dang" className="font-semibold text-cvr-blue-ink underline">
            Tin đăng của tôi
          </Link>
          . Bất động sản đã giao dịch xong, đề nghị gỡ tin ngay.
        </p>
      </Muc>

      <Muc so={6} title="Xử lý vi phạm">
        <p>Tuỳ mức độ, Coastal Land áp dụng một hoặc nhiều biện pháp sau:</p>
        <DanhSach
          items={[
            "Từ chối duyệt và nêu lý do để người đăng sửa lại.",
            "Ẩn hoặc gỡ tin đang hiển thị.",
            "Hạ thứ hạng hiển thị đối với tài khoản nhiều lần đăng tin sai.",
            "Tạm khoá hoặc chấm dứt tài khoản với vi phạm nghiêm trọng, lặp lại, hoặc có dấu hiệu lừa đảo.",
          ]}
        />
        <p>
          Phí dịch vụ đã sử dụng cho tin vi phạm{" "}
          <strong className="font-semibold text-cvr-ink">không được hoàn lại</strong>.
        </p>
      </Muc>

      <Muc so={7} title="Khiếu nại quyết định kiểm duyệt">
        <p>
          Nếu cho rằng tin bị từ chối chưa đúng, bạn gửi khiếu nại kèm mã tin qua trang{" "}
          <Link href="/gop-y" className="font-semibold text-cvr-blue-ink underline">
            Góp ý, báo lỗi
          </Link>{" "}
          hoặc hotline{" "}
          <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">
            0377 985 036
          </a>
          . Chúng tôi kiểm tra lại và trả lời trong vòng 2 ngày làm việc.
        </p>
        <p>
          Quy định này là một phần của{" "}
          <Link href="/dieu-khoan" className="font-semibold text-cvr-blue-ink underline">
            Điều khoản thoả thuận
          </Link>{" "}
          và{" "}
          <Link href="/quy-che" className="font-semibold text-cvr-blue-ink underline">
            Quy chế hoạt động
          </Link>
          .
        </p>
      </Muc>
    </TrangPhapLy>
  );
}
