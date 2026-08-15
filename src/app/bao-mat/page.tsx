import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";

export const metadata: Metadata = {
  alternates: { canonical: "/bao-mat" },
  title: "Chính sách bảo mật",
  description:
    "Coastal Land thu thập, sử dụng và bảo vệ dữ liệu cá nhân của người dùng như thế nào — và cách bạn yêu cầu xem, sửa hoặc xoá dữ liệu của mình.",
};

export default function BaoMatPage() {
  return (
    <TrangPhapLy
      title="Chính sách bảo mật"
      capNhat="15/08/2026"
      moDau="Coastal Land (coastalland.vn) là cổng thông tin bất động sản. Trang này nói rõ chúng tôi thu thập dữ liệu gì của bạn, dùng để làm gì, chia sẻ với ai và bạn có quyền gì đối với dữ liệu đó. Bằng việc sử dụng website, bạn đồng ý với chính sách này."
    >
      <Muc so={1} title="Chúng tôi thu thập dữ liệu gì">
        <p><strong className="font-semibold text-cvr-ink">Khi bạn tạo tài khoản hoặc đăng nhập:</strong></p>
        <DanhSach
          items={[
            "Địa chỉ email, họ tên và ảnh đại diện — nếu bạn đăng nhập bằng Google, các thông tin này do Google cung cấp. Chúng tôi không bao giờ nhận được mật khẩu Google của bạn.",
            "Số điện thoại, tên công ty, khu vực hoạt động — nếu bạn tự điền vào hồ sơ.",
          ]}
        />
        <p className="pt-2"><strong className="font-semibold text-cvr-ink">Khi bạn đăng tin:</strong></p>
        <DanhSach
          items={[
            "Thông tin bất động sản: vị trí, diện tích, giá, hình ảnh, mô tả.",
            <>
              Thông tin liên hệ bạn nhập vào tin (tên, số điện thoại, email).{" "}
              <strong className="font-semibold text-cvr-ink">
                Những thông tin này hiển thị CÔNG KHAI trên tin đăng
              </strong>{" "}
              để người mua liên hệ với bạn — đó là mục đích của việc đăng tin. Đừng nhập vào đây thông tin bạn không muốn công khai.
            </>,
          ]}
        />
        <p className="pt-2"><strong className="font-semibold text-cvr-ink">Lưu ngay trên trình duyệt của bạn:</strong></p>
        <DanhSach
          items={[
            "Tin bạn đã lưu, tin đang so sánh, tin đã xem gần đây, lịch sử từ khoá tìm kiếm, và một vài tuỳ chọn hiển thị.",
            "Các dữ liệu này nằm trong bộ nhớ trình duyệt (localStorage) trên chính máy bạn, KHÔNG được gửi về máy chủ của chúng tôi. Xoá dữ liệu duyệt web là chúng biến mất.",
          ]}
        />
      </Muc>

      <Muc so={2} title="Dùng để làm gì">
        <DanhSach
          items={[
            "Tạo và quản lý tài khoản của bạn.",
            "Hiển thị tin đăng của bạn tới người đang tìm mua, tìm thuê.",
            "Kiểm duyệt tin trước khi công bố, nhằm giữ chất lượng thông tin cho cả người mua lẫn người bán.",
            "Liên hệ lại với bạn khi bạn gửi yêu cầu hỗ trợ, hoặc để hướng dẫn đăng tin.",
            "Cải thiện chức năng tìm kiếm và trải nghiệm sử dụng.",
          ]}
        />
      </Muc>

      <Muc so={3} title="Chia sẻ với ai">
        <p>
          Chúng tôi <strong className="font-semibold text-cvr-ink">không bán, không trao đổi</strong> dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo.
        </p>
        <p>Dữ liệu chỉ được xử lý bởi các nhà cung cấp hạ tầng cần thiết để website hoạt động:</p>
        <DanhSach
          items={[
            "Supabase — lưu trữ cơ sở dữ liệu và xác thực đăng nhập.",
            "Vercel — vận hành và phân phối website.",
            "Google — chỉ khi bạn chọn đăng nhập bằng tài khoản Google.",
          ]}
        />
        <p>
          Ngoài ra, chúng tôi có thể cung cấp thông tin khi cơ quan nhà nước có thẩm quyền yêu cầu theo quy định pháp luật Việt Nam.
        </p>
      </Muc>

      <Muc so={4} title="Thông tin hiển thị công khai">
        <p>
          Tin đăng đã được duyệt — bao gồm hình ảnh, mô tả và thông tin liên hệ bạn nhập — sẽ hiển thị công khai trên website và có thể được các công cụ tìm kiếm như Google lập chỉ mục. Bạn có thể ẩn hoặc xoá tin của mình bất cứ lúc nào trong mục{" "}
          <Link href="/tai-khoan/tin-dang" className="font-semibold text-cvr-blue-ink underline">
            Tin đã đăng
          </Link>
          . Lưu ý: nội dung đã được công cụ tìm kiếm lưu lại có thể cần thêm thời gian để biến mất khỏi kết quả tìm kiếm.
        </p>
      </Muc>

      <Muc so={5} title="Quyền của bạn">
        <DanhSach
          items={[
            "Xem và sửa thông tin cá nhân bất cứ lúc nào trong mục Cài đặt tài khoản.",
            "Ẩn hoặc xoá tin đăng của bạn.",
            "Yêu cầu xoá toàn bộ tài khoản và dữ liệu liên quan.",
            "Rút lại sự đồng ý — bằng cách ngừng sử dụng dịch vụ và yêu cầu xoá tài khoản.",
          ]}
        />
        <p>
          Để yêu cầu <strong className="font-semibold text-cvr-ink">xoá tài khoản và dữ liệu</strong>, gửi email từ chính địa chỉ bạn đã đăng ký tới{" "}
          <a href="mailto:lienhe@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">
            lienhe@coastalland.vn
          </a>{" "}
          với tiêu đề &ldquo;Yêu cầu xoá tài khoản&rdquo;. Chúng tôi xử lý trong vòng 30 ngày làm việc và sẽ báo lại cho bạn khi hoàn tất.
        </p>
      </Muc>

      <Muc so={6} title="Lưu trữ và bảo mật">
        <p>
          Dữ liệu tài khoản được lưu trong suốt thời gian bạn còn sử dụng dịch vụ. Khi bạn yêu cầu xoá tài khoản, chúng tôi xoá dữ liệu cá nhân, trừ phần buộc phải giữ lại theo quy định pháp luật (ví dụ chứng từ giao dịch, nếu có).
        </p>
        <p>
          Kết nối tới website được mã hoá bằng HTTPS. Mật khẩu không bao giờ được lưu dưới dạng đọc được. Dù vậy, không có hệ thống nào an toàn tuyệt đối — bạn nên đặt mật khẩu mạnh và không chia sẻ tài khoản.
        </p>
      </Muc>

      <Muc so={7} title="Trẻ em">
        <p>
          Dịch vụ không dành cho người dưới 16 tuổi. Chúng tôi không cố ý thu thập dữ liệu của trẻ em. Nếu phát hiện, chúng tôi sẽ xoá ngay khi được thông báo.
        </p>
      </Muc>

      <Muc so={8} title="Thay đổi chính sách">
        <p>
          Khi có thay đổi, chúng tôi cập nhật nội dung trên trang này và đổi ngày &ldquo;Cập nhật lần cuối&rdquo; ở đầu trang. Thay đổi quan trọng sẽ được thông báo thêm qua email hoặc thông báo trên website.
        </p>
      </Muc>

      <Muc so={9} title="Liên hệ">
        <p>
          Mọi thắc mắc về dữ liệu cá nhân, vui lòng liên hệ:
        </p>
        <DanhSach
          items={[
            <>Email: <a href="mailto:lienhe@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">lienhe@coastalland.vn</a></>,
            <>Hotline / Zalo: <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">0377 985 036</a></>,
            "Website: coastalland.vn",
          ]}
        />
      </Muc>
    </TrangPhapLy>
  );
}
