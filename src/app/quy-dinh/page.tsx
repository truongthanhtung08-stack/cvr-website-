import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";

export const metadata: Metadata = {
  alternates: { canonical: "/quy-dinh" },
  title: "Quy định đăng tin",
  description:
    "Quy định đăng tin bất động sản trên Coastal Land: điều kiện để tin được duyệt, yêu cầu về nội dung và hình ảnh, thời hạn hiển thị và cách gửi khiếu nại.",
};

export default function QuyDinhPage() {
  return (
    <TrangPhapLy
      title="Quy định đăng tin"
      capNhat="17/08/2026"
      moDau="Vài quy định để tin đăng trên coastalland.vn giữ được chất lượng — người mua tin tưởng thì tin của bạn mới có giá trị. Áp dụng cho tin bán, cho thuê và dự án."
    >
      <Muc so={1} title="Nguyên tắc chung">
        <p>
          Mọi tin đăng đều được Coastal Land xem qua trước khi hiển thị công khai. Tin gửi lên sẽ ở trạng thái chờ duyệt
          cho tới khi kiểm tra xong.
        </p>
        <p>Người đăng là chủ sở hữu, người được chủ sở hữu uỷ quyền, hoặc môi giới đang nhận bán / cho thuê bất động sản đó.</p>
      </Muc>

      <Muc so={2} title="Điều kiện để một tin được duyệt">
        <DanhSach
          items={[
            "Thông tin đúng sự thật: vị trí, diện tích, giá, số phòng, tình trạng pháp lý.",
            "Giá ghi đúng đơn vị và là mức giá đang chào bán thật.",
            "Địa chỉ xác định được tới cấp Phường/Xã theo đơn vị hành chính mới (2 cấp: Tỉnh/Thành phố → Phường/Xã).",
            "Ảnh là ảnh thật của chính bất động sản đang rao, còn mới, đủ sáng, thấy rõ hiện trạng.",
            "Tiêu đề mô tả đúng bất động sản, không viết hoa toàn bộ, không chèn ký tự trang trí.",
            "Loại hình và nhu cầu (bán / cho thuê) chọn đúng danh mục.",
            "Số điện thoại liên hệ là số đang dùng và người nghe nắm được thông tin bất động sản.",
          ]}
        />
      </Muc>

      <Muc so={3} title="Những nội dung chúng tôi không đăng">
        <DanhSach
          items={[
            "Tin không có thật, hoặc tin đã bán / đã cho thuê xong mà vẫn để lại.",
            "Cùng một bất động sản chia thành nhiều tin, hoặc đăng lại liên tục để đẩy lên đầu danh sách.",
            "Nội dung, hình ảnh của người khác khi chưa được họ đồng ý; ảnh còn logo hoặc số điện thoại của đơn vị khác.",
            "Số điện thoại, email, đường dẫn website ngoài đặt trong tiêu đề, mô tả hoặc trên hình ảnh.",
            "Thông tin chưa chính xác về quy hoạch, pháp lý hay tiến độ dự án.",
            "Nội dung trái quy định pháp luật hoặc thuần phong mỹ tục.",
            "Bất động sản đang tranh chấp hoặc chưa đủ điều kiện chuyển nhượng theo quy định.",
            "Nội dung không phải bất động sản, hoặc quảng cáo dịch vụ khác dưới dạng tin nhà đất.",
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

      <Muc so={6} title="Khi tin chưa đáp ứng quy định">
        <p>Tuỳ trường hợp, chúng tôi sẽ:</p>
        <DanhSach
          items={[
            "Gửi lại tin kèm lý do để bạn chỉnh sửa — đây là cách xử lý thường gặp nhất.",
            "Tạm ẩn tin đang hiển thị cho tới khi thông tin được cập nhật.",
            "Điều chỉnh thứ hạng hiển thị với tài khoản có nhiều tin chưa chính xác.",
            "Tạm dừng tài khoản nếu tình trạng lặp lại nhiều lần sau khi đã trao đổi.",
          ]}
        />
        <p>Phần thời gian tin đã hiển thị được tính là đã sử dụng dịch vụ.</p>
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
