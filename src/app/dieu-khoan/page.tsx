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
import { PHAP_LY, DONG_GIAY_PHEP } from "@/lib/phapLy";

export const metadata: Metadata = {
  alternates: { canonical: "/dieu-khoan" },
  title: "Điều khoản thoả thuận",
  description:
    "Điều khoản sử dụng cổng thông tin bất động sản Coastal Land — vai trò của nền tảng, quy định đăng tin, trách nhiệm của người dùng và giới hạn trách nhiệm.",
};

export default function DieuKhoanPage() {
  return (
    <TrangPhapLy
      title="Điều khoản thoả thuận"
      capNhat="15/08/2026"
      moDau="Khi truy cập và sử dụng coastalland.vn, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng website."
    >
      <Muc so={1} title="Coastal Land là gì — và KHÔNG phải là gì">
        <p>
          Coastal Land là <strong className="font-semibold text-cvr-ink">cổng thông tin bất động sản</strong>. Chúng tôi đăng tải, kiểm duyệt và sắp xếp thông tin do người bán, người mua và môi giới gửi lên, giúp các bên tìm thấy nhau.
        </p>
        <p>Coastal Land <strong className="font-semibold text-cvr-ink">không</strong>:</p>
        <DanhSach
          items={[
            "Không mua bán, không phân phối, không ký gửi bất kỳ bất động sản nào.",
            "Không làm môi giới và không nhận hoa hồng từ giao dịch giữa các bên.",
            "Không định giá bất động sản.",
            "Không đứng ra thực hiện, làm chứng hay bảo lãnh cho giao dịch.",
            "Không thực hiện thủ tục công chứng, sang tên — đó là việc của môi giới và hai bên giao dịch.",
          ]}
        />
        <p>
          Mọi thoả thuận, đặt cọc, thanh toán và chuyển nhượng là việc giữa người mua và người bán (hoặc môi giới của họ), diễn ra ngoài nền tảng.
        </p>
      </Muc>

      <Muc so={2} title="Tài khoản">
        <DanhSach
          items={[
            "Bạn giữ thông tin đăng ký chính xác và phụ trách các hoạt động diễn ra dưới tài khoản của mình.",
            "Mỗi người dùng một tài khoản riêng, đăng ký đúng tên của mình hoặc tổ chức mình đại diện.",
            "Tài khoản không đáp ứng điều khoản này có thể được tạm dừng sau khi chúng tôi đã trao đổi với bạn.",
          ]}
        />
      </Muc>

      <Muc so={3} title="Quy định đăng tin">
        <p>
          Mọi tin đăng và dự án đều được Coastal Land xem qua trước khi hiển thị công khai. Tin gửi lên sẽ ở trạng thái
          chờ duyệt.
        </p>
        <p>Khi đăng tin, bạn cho biết rằng:</p>
        <DanhSach
          items={[
            "Thông tin đúng thực tế: vị trí, diện tích, giá, tình trạng pháp lý.",
            "Bạn có quyền rao bán, cho thuê bất động sản đó, hoặc được chủ sở hữu uỷ quyền.",
            "Hình ảnh là ảnh thật của bất động sản; ảnh của người khác thì đã được họ đồng ý.",
            "Mỗi bất động sản đăng một tin, không tách thành nhiều tin trùng nhau.",
            "Nội dung phù hợp quy định pháp luật và thuần phong mỹ tục.",
          ]}
        />
        <p>
          Với tin chưa đáp ứng các điều kiện trên, Coastal Land có thể gửi lại để bạn chỉnh sửa, hoặc tạm ẩn tin. Phần
          thời gian tin đã hiển thị được tính là đã sử dụng dịch vụ.
        </p>
      </Muc>

      <Muc so={4} title="Phí dịch vụ">
        <DanhSach
          items={[
            <>Dịch vụ đăng tin và quảng bá tin có <Link href="/bao-gia-dang-tin" className="font-semibold text-cvr-blue-ink underline">bảng giá</Link> công bố trên website.</>,
            "Tin đã hiển thị đủ thời hạn của gói thì phí dịch vụ được xem là đã sử dụng.",
            "Bảng giá có thể thay đổi; thay đổi chỉ áp dụng cho các giao dịch phát sinh sau thời điểm công bố.",
          ]}
        />
      </Muc>

      <Muc so={5} title="Nội dung và bản quyền">
        <p>
          Bạn giữ quyền đối với nội dung và hình ảnh mình đăng lên. Khi đăng, bạn cho phép Coastal Land hiển thị, lưu trữ và quảng bá nội dung đó trên website cùng các kênh truyền thông của Coastal Land, nhằm phục vụ chính việc tiếp thị tin của bạn.
        </p>
        <p>
          Giao diện, mã nguồn, logo và thương hiệu Coastal Land thuộc quyền sở hữu của chúng tôi. Không sao chép, thu thập dữ liệu tự động (crawl, scrape) hay sử dụng lại khi chưa có văn bản đồng ý.
        </p>
      </Muc>

      <Muc so={6} title="Giới hạn trách nhiệm">
        <p>
          Thông tin trên website do người dùng cung cấp. Chúng tôi <strong className="font-semibold text-cvr-ink">nỗ lực xác thực</strong> trước khi đăng, nhưng không thể bảo đảm tuyệt đối tính chính xác, đầy đủ hay cập nhật của mọi tin đăng.
        </p>
        <p>
          Như với mọi giao dịch nhà đất, trước khi giao dịch bạn nên <strong className="font-semibold text-cvr-ink">xem thực địa, đối chiếu giấy tờ pháp lý và quy hoạch</strong>, và tham khảo ý kiến đơn vị chuyên môn. Giao dịch diễn ra giữa bạn và người đăng tin, nên Coastal Land không tham gia và không chịu trách nhiệm về kết quả của giao dịch đó.
        </p>
        <p>
          Website có thể tạm gián đoạn để bảo trì hoặc do sự cố ngoài tầm kiểm soát. Chúng tôi không chịu trách nhiệm về thiệt hại phát sinh từ việc gián đoạn đó.
        </p>
      </Muc>

      <Muc so={7} title="Dữ liệu cá nhân">
        <p>
          Việc thu thập và xử lý dữ liệu cá nhân được nêu tại{" "}
          <Link href="/bao-mat" className="font-semibold text-cvr-blue-ink underline">
            Chính sách bảo mật
          </Link>
          , là một phần không tách rời của điều khoản này.
        </p>
      </Muc>

      <Muc so={8} title="Thay đổi điều khoản">
        <p>
          Chúng tôi có thể cập nhật điều khoản này. Bản mới có hiệu lực kể từ khi đăng trên trang này. Việc bạn tiếp tục sử dụng website sau thời điểm đó được xem là đã chấp nhận nội dung mới.
        </p>
      </Muc>

      <Muc so={9} title="Luật áp dụng">
        <p>
          Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp phát sinh sẽ được ưu tiên giải quyết bằng thương lượng; nếu không đạt kết quả, sẽ do toà án có thẩm quyền tại Việt Nam giải quyết.
        </p>
      </Muc>

      <Muc so={10} title="Liên hệ">
        <DanhSach
          items={[
            // Pháp nhân vận hành website — lấy từ src/lib/phapLy.ts, ô trống thì dòng tự ẩn.
            ...(PHAP_LY.tenCongTy ? [<>Đơn vị chủ quản: <strong className="font-semibold text-cvr-ink">{PHAP_LY.tenCongTy}</strong></>] : []),
            ...(DONG_GIAY_PHEP ? [<>{DONG_GIAY_PHEP}</>] : []),
            <>Địa chỉ: {PHAP_LY.diaChiDayDu}</>,
            <>Email: <a href="mailto:lienhe@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">lienhe@coastalland.vn</a></>,
            <>Hotline / Zalo: <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">0377 985 036</a></>,
            "Website: coastalland.vn",
          ]}
        />
      </Muc>
    </TrangPhapLy>
  );
}
