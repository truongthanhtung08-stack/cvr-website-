import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";
import { PHAP_LY } from "@/lib/phapLy";

export const metadata: Metadata = {
  alternates: { canonical: "/quy-che" },
  title: "Quy chế hoạt động",
  description:
    "Quy chế hoạt động của cổng thông tin bất động sản Coastal Land — nguyên tắc chung, quy trình đăng và kiểm duyệt tin, quyền và nghĩa vụ các bên, giải quyết tranh chấp.",
};

export default function QuyChePage() {
  return (
    <TrangPhapLy
      title="Quy chế hoạt động"
      capNhat="17/08/2026"
      moDau="Quy chế này mô tả cách cổng thông tin coastalland.vn vận hành: ai được tham gia, tin đăng đi qua những bước nào, mỗi bên có quyền và nghĩa vụ gì. Quy chế áp dụng cho toàn bộ thành viên và khách truy cập."
    >
      <Muc so={1} title="Nguyên tắc chung">
        <p>
          Coastal Land (coastalland.vn) là <strong className="font-semibold text-cvr-ink">cổng thông tin bất động sản</strong>:
          nơi người có nhà đất đăng thông tin và người tìm mua, tìm thuê tra cứu, kết nối trực tiếp với nhau.
        </p>
        <p>Coastal Land không mua bán, không phân phối, không ký gửi, không môi giới, không định giá và không đứng ra thực hiện giao dịch. Chúng tôi không thu hoa hồng từ giao dịch giữa các bên.</p>
        <p>Cổng thông tin hoạt động theo pháp luật Việt Nam. Nội dung tin đăng do thành viên cung cấp và thuộc trách nhiệm của thành viên đó.</p>
      </Muc>

      <Muc so={2} title="Các bên tham gia">
        <DanhSach
          items={[
            <><strong className="font-semibold text-cvr-ink">Người truy cập:</strong> tra cứu, tìm kiếm, so sánh và lưu tin. Không bắt buộc đăng ký tài khoản.</>,
            <><strong className="font-semibold text-cvr-ink">Thành viên đăng tin:</strong> chủ nhà đất, người được uỷ quyền, môi giới hoặc chủ đầu tư — đăng ký tài khoản, đăng tin theo gói dịch vụ.</>,
            <><strong className="font-semibold text-cvr-ink">Ban quản trị:</strong> Coastal Land — kiểm duyệt nội dung, vận hành hệ thống và hỗ trợ thành viên.</>,
          ]}
        />
      </Muc>

      <Muc so={3} title="Quy trình đăng và kiểm duyệt tin">
        <DanhSach
          items={[
            "Thành viên đăng nhập và điền biểu mẫu đăng tin (loại hình, địa chỉ, giá, diện tích, đặc điểm, ảnh, liên hệ).",
            "Thành viên chọn gói tin tương ứng với thứ hạng hiển thị và thời hạn đăng.",
            "Tin chuyển sang trạng thái chờ duyệt. Ban quản trị kiểm tra tính hợp lệ theo Quy định đăng tin.",
            "Tin đạt yêu cầu được hiển thị công khai; tin chưa đạt bị trả về kèm lý do để thành viên sửa và gửi lại.",
            "Trong thời gian hiển thị, thành viên có thể sửa, ẩn hoặc gỡ tin trong khu vực tài khoản.",
            "Hết thời hạn của gói, tin tự ẩn; thành viên có thể gia hạn hoặc đăng lại.",
          ]}
        />
        <p>
          Chi tiết điều kiện duyệt và những nội dung chúng tôi không đăng, xem tại{" "}
          <Link href="/quy-dinh" className="font-semibold text-cvr-blue-ink underline">
            Quy định đăng tin
          </Link>
          .
        </p>
      </Muc>

      <Muc so={4} title="Quyền và nghĩa vụ của thành viên đăng tin">
        <p>Quyền:</p>
        <DanhSach
          items={[
            "Đăng tin và quảng bá bất động sản theo gói dịch vụ đã chọn.",
            "Sửa, ẩn, gỡ tin của mình bất kỳ lúc nào.",
            "Được hỗ trợ kỹ thuật trong quá trình đăng tin.",
            "Khiếu nại khi cho rằng quyết định kiểm duyệt chưa thoả đáng.",
          ]}
        />
        <p>Nghĩa vụ:</p>
        <DanhSach
          items={[
            "Cung cấp thông tin đúng sự thật và cập nhật khi có thay đổi.",
            "Có quyền rao bán, cho thuê bất động sản hoặc được chủ sở hữu uỷ quyền.",
            "Chịu trách nhiệm về nội dung, hình ảnh mình đăng và về mọi thoả thuận với khách.",
            "Gỡ tin ngay khi bất động sản đã giao dịch xong.",
            "Không dùng nền tảng để đăng tin không có thật hoặc thông tin sai lệch.",
          ]}
        />
      </Muc>

      <Muc so={5} title="Quyền và nghĩa vụ của Ban quản trị">
        <DanhSach
          items={[
            "Duyệt tin, gửi lại tin kèm lý do để thành viên chỉnh sửa, hoặc tạm ẩn tin chưa đáp ứng quy định.",
            "Tạm dừng tài khoản nếu tình trạng lặp lại nhiều lần sau khi đã trao đổi.",
            "Bảo đảm hệ thống vận hành ổn định; thông báo trước khi bảo trì theo kế hoạch.",
            "Bảo mật thông tin thành viên theo Chính sách bảo mật.",
            "Tiếp nhận và trả lời khiếu nại, phản ánh của thành viên và người truy cập.",
          ]}
        />
      </Muc>

      <Muc so={6} title="Phí dịch vụ và thanh toán">
        <DanhSach
          items={[
            <>Các dịch vụ đăng tin và quảng bá tin có <Link href="/bao-gia-dang-tin" className="font-semibold text-cvr-blue-ink underline">bảng giá</Link> công bố công khai trên website.</>,
            "Tin đã hiển thị đủ thời hạn của gói thì phí dịch vụ được xem là đã sử dụng.",
            "Bảng giá có thể thay đổi; thay đổi chỉ áp dụng cho giao dịch phát sinh sau thời điểm công bố.",
          ]}
        />
      </Muc>

      <Muc so={7} title="Bảo vệ thông tin cá nhân">
        <p>
          Việc thu thập, sử dụng và bảo vệ dữ liệu cá nhân được nêu tại{" "}
          <Link href="/bao-mat" className="font-semibold text-cvr-blue-ink underline">
            Chính sách bảo mật
          </Link>
          . Thông tin liên hệ hiển thị trên tin đăng là do chính thành viên chủ động công bố để người mua liên lạc.
        </p>
      </Muc>

      <Muc so={8} title="Giải quyết tranh chấp, khiếu nại">
        <DanhSach
          items={[
            "Tranh chấp phát sinh trong giao dịch mua bán, thuê là việc giữa các bên giao dịch. Coastal Land không phải một bên trong giao dịch đó.",
            "Với khiếu nại liên quan tới nội dung tin đăng hoặc dịch vụ của cổng thông tin, gửi về hotline hoặc trang Góp ý, báo lỗi.",
            "Chúng tôi tiếp nhận và phản hồi trong vòng 2 ngày làm việc; trường hợp phức tạp cần xác minh sẽ thông báo tiến độ.",
            "Tranh chấp không tự thương lượng được sẽ do toà án có thẩm quyền tại Việt Nam giải quyết.",
          ]}
        />
      </Muc>

      <Muc so={9} title="Sửa đổi quy chế">
        <p>
          Coastal Land có thể cập nhật quy chế này. Bản mới có hiệu lực kể từ khi đăng trên trang này. Việc tiếp tục sử
          dụng website sau thời điểm đó được xem là đã chấp nhận nội dung mới.
        </p>
      </Muc>

      <Muc so={10} title="Đầu mối liên hệ">
        <DanhSach
          items={[
            <>Hotline / Zalo: <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">0377 985 036</a></>,
            <>Email: <a href="mailto:lienhe@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">lienhe@coastalland.vn</a></>,
            <>Địa chỉ: {PHAP_LY.diaChiDayDu}</>,
            <>Trang <Link href="/lien-he" className="font-semibold text-cvr-blue-ink underline">Liên hệ</Link> — gửi yêu cầu trực tuyến.</>,
            // Các dòng dưới CHỜ GIẤY ĐKKD — điền tại src/lib/phapLy.ts, chưa có thì tự ẩn.
            ...(PHAP_LY.dangKyKinhDoanh ? [<>{PHAP_LY.dangKyKinhDoanh}</>] : []),
            ...(PHAP_LY.maSoThue ? [<>Mã số thuế: {PHAP_LY.maSoThue}</>] : []),
            ...(PHAP_LY.chiuTrachNhiemNoiDung
              ? [<>Chịu trách nhiệm nội dung: {PHAP_LY.chiuTrachNhiemNoiDung}</>]
              : []),
          ]}
        />
      </Muc>
    </TrangPhapLy>
  );
}
