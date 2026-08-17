import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";
import YeuCauForm from "@/components/YeuCauForm";

export const metadata: Metadata = {
  alternates: { canonical: "/tuyen-dung" },
  title: "Tuyển dụng",
  description:
    "Cơ hội cộng tác cùng Coastal Land — cổng thông tin bất động sản Duyên hải Miền Trung. Gửi hồ sơ cộng tác viên nội dung, kinh doanh, kỹ thuật.",
};

export default function TuyenDungPage() {
  return (
    <TrangPhapLy
      title="Tuyển dụng"
      moDau="Coastal Land vận hành theo mô hình tinh gọn: đội ngũ nhỏ, công nghệ và tự động hoá làm phần nặng. Chúng tôi không tuyển ồ ạt, nhưng luôn mở với người làm được việc và hiểu thị trường Miền Trung."
    >
      <Muc title="Vị trí đang tuyển">
        <p>
          Hiện <strong className="font-semibold text-cvr-ink">chưa có vị trí toàn thời gian nào đang mở</strong>. Chúng tôi
          sẽ đăng công khai tại đây ngay khi có nhu cầu — kèm mô tả công việc và mức thu nhập cụ thể, không chung chung.
        </p>
      </Muc>

      <Muc title="Cộng tác viên — nhận hồ sơ thường xuyên">
        <p>Những mảng chúng tôi luôn cần thêm người, làm theo dự án hoặc bán thời gian:</p>
        <DanhSach
          items={[
            <><strong className="font-semibold text-cvr-ink">Cộng tác viên khu vực</strong> (Đà Nẵng, Huế, Quảng Ngãi, Khánh Hoà…): kết nối chủ nhà, môi giới và sàn ở địa phương lên nền tảng, hỗ trợ họ đăng tin đúng chuẩn.</>,
            <><strong className="font-semibold text-cvr-ink">Biên tập nội dung bất động sản:</strong> viết tin thị trường, bài phân tích khu vực, chuẩn hoá mô tả tin đăng.</>,
            <><strong className="font-semibold text-cvr-ink">Nhiếp ảnh — quay dựng:</strong> chụp và quay bất động sản tại Đà Nẵng, Huế.</>,
            <><strong className="font-semibold text-cvr-ink">Kinh doanh dịch vụ đăng tin:</strong> tư vấn gói tin cho môi giới, sàn và chủ đầu tư.</>,
          ]}
        />
      </Muc>

      <Muc title="Chúng tôi tìm người thế nào">
        <DanhSach
          items={[
            "Làm được việc quan trọng hơn bằng cấp — hãy gửi thứ bạn đã làm ra.",
            "Hiểu thị trường Miền Trung là lợi thế lớn, khó thay thế bằng kinh nghiệm nơi khác.",
            "Trung thực với dữ liệu: nền tảng này sống bằng niềm tin của người mua, tin ảo là thứ chúng tôi loại bỏ.",
            "Chủ động và tự chạy được việc, vì đội ngũ mỏng và làm việc từ xa là chính.",
          ]}
        />
      </Muc>

      <Muc title="Gửi hồ sơ">
        <p>
          Điền thông tin bên dưới, ghi rõ mảng bạn muốn cộng tác và kinh nghiệm liên quan. Có hồ sơ, portfolio hoặc bài viết
          mẫu thì gửi kèm link, hoặc email về{" "}
          <a href="mailto:lienhe@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">
            lienhe@coastalland.vn
          </a>{" "}
          với tiêu đề “Ứng tuyển — [mảng bạn chọn]”.
        </p>
        <YeuCauForm
          loai="hop_tac"
          goiYNoiDung="Bạn muốn cộng tác mảng nào? Kinh nghiệm liên quan? Link hồ sơ / sản phẩm đã làm…"
          nhanNut="Gửi hồ sơ"
          loiNhanXong="Đã nhận hồ sơ của bạn. Chúng tôi sẽ liên hệ nếu có vị trí phù hợp."
        />
      </Muc>

      <Muc title="Bạn là môi giới hoặc sàn giao dịch?">
        <p>
          Bạn không cần ứng tuyển — hãy{" "}
          <Link href="/dang-ky" className="font-semibold text-cvr-blue-ink underline">
            tạo tài khoản
          </Link>{" "}
          và đăng tin trực tiếp. Xem trước chi phí tại{" "}
          <Link href="/bao-gia-dang-tin" className="font-semibold text-cvr-blue-ink underline">
            Báo giá dịch vụ
          </Link>{" "}
          và cách làm tại{" "}
          <Link href="/huong-dan" className="font-semibold text-cvr-blue-ink underline">
            Hướng dẫn đăng tin
          </Link>
          .
        </p>
      </Muc>
    </TrangPhapLy>
  );
}
