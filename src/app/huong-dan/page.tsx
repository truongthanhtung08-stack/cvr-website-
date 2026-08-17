import type { Metadata } from "next";
import Link from "next/link";
import TrangPhapLy, { Muc, DanhSach } from "@/components/TrangPhapLy";

export const metadata: Metadata = {
  alternates: { canonical: "/huong-dan" },
  title: "Hướng dẫn đăng tin",
  description:
    "Hướng dẫn từng bước đăng tin bán, cho thuê nhà đất trên Coastal Land: chuẩn bị thông tin, điền biểu mẫu, chọn gói tin, chờ duyệt và theo dõi hiệu quả tin.",
};

export default function HuongDanPage() {
  return (
    <TrangPhapLy
      title="Hướng dẫn đăng tin"
      moDau="Đăng một tin trên Coastal Land mất khoảng 10 phút nếu bạn đã chuẩn bị sẵn ảnh và thông tin. Làm theo các bước dưới đây, tin của bạn sẽ được duyệt nhanh và ít bị trả về."
    >
      <Muc so={1} title="Chuẩn bị trước khi ngồi vào máy">
        <p>Có sẵn những thứ này thì việc điền biểu mẫu diễn ra một mạch, không phải bỏ dở:</p>
        <DanhSach
          items={[
            "Ảnh thật của bất động sản — tối thiểu 4–5 tấm: mặt tiền, phòng khách, phòng ngủ, bếp, view. Chụp ngang, đủ sáng.",
            "Địa chỉ theo đơn vị hành chính MỚI (2 cấp): số nhà, tên đường — Phường/Xã — Tỉnh/Thành phố. Không còn cấp Quận/Huyện.",
            "Diện tích đất, diện tích xây dựng, số phòng ngủ, phòng tắm, hướng nhà.",
            "Giá bán hoặc giá thuê mỗi tháng. Chưa muốn công bố thì chọn “Thoả thuận”.",
            "Tình trạng pháp lý: sổ đỏ / sổ hồng, hợp đồng mua bán, đang chờ sổ…",
            "Số điện thoại người mua liên hệ trực tiếp.",
          ]}
        />
      </Muc>

      <Muc so={2} title="Đăng nhập tài khoản">
        <p>
          Tin đăng gắn với tài khoản của bạn để sau này còn sửa, gia hạn và xem lượt quan tâm. Chưa có tài khoản thì{" "}
          <Link href="/dang-ky" className="font-semibold text-cvr-blue-ink underline">
            đăng ký
          </Link>{" "}
          bằng email hoặc số điện thoại; có rồi thì{" "}
          <Link href="/dang-nhap" className="font-semibold text-cvr-blue-ink underline">
            đăng nhập
          </Link>
          .
        </p>
      </Muc>

      <Muc so={3} title="Điền biểu mẫu đăng tin">
        <p>
          Mở trang{" "}
          <Link href="/dang-tin" className="font-semibold text-cvr-blue-ink underline">
            Đăng tin
          </Link>{" "}
          và đi lần lượt qua các thẻ được đánh số:
        </p>
        <DanhSach
          items={[
            "Loại tin đăng — chọn Bán hay Cho thuê, rồi chọn loại hình (nhà riêng, căn hộ, đất nền, kho xưởng…). Danh mục loại hình của Bán và Cho thuê khác nhau.",
            "Địa chỉ — chọn theo danh mục hành chính mới (Tỉnh/Thành phố → Phường/Xã) để bộ lọc khu vực tìm ra tin của bạn.",
            "Thông tin chính — giá, diện tích, số phòng.",
            "Đặc điểm, Nội thất, Tiện ích — tick những mục thực sự có. Đây chính là dữ liệu để người mua lọc ra tin của bạn.",
            "Mô tả chi tiết — viết cho người đọc, không nhồi từ khoá (xem mục 4).",
            "Hình ảnh — tải ảnh đã chuẩn bị; ảnh đầu tiên là ảnh đại diện của tin.",
            "Chọn gói tin — quyết định thứ hạng hiển thị và thời gian đăng.",
            "Thông tin liên hệ — tên và số điện thoại hiển thị trên tin.",
          ]}
        />
        <p>
          Chưa xong có thể <strong className="font-semibold text-cvr-ink">Lưu nháp</strong> và quay lại hoàn thiện sau
          trong mục{" "}
          <Link href="/tai-khoan/tin-dang" className="font-semibold text-cvr-blue-ink underline">
            Tin đăng của tôi
          </Link>
          .
        </p>
      </Muc>

      <Muc so={4} title="Viết mô tả sao cho hiệu quả">
        <DanhSach
          items={[
            "Câu đầu tiên nói ngay điều đáng giá nhất: vị trí, view, hoặc mức giá so với khu vực.",
            "Viết thành đoạn ngắn, xuống dòng rõ ràng. Tránh viết hoa cả dòng và rải ký tự lạ.",
            "Nói rõ pháp lý và tình trạng bàn giao — đây là thứ người mua tìm đầu tiên.",
            "Nêu tiện ích xung quanh kèm khoảng cách thật (VD: “cách biển Mỹ Khê 600m”).",
            "Không ghi số điện thoại trong mô tả — hệ thống đã hiển thị riêng ở khối liên hệ.",
          ]}
        />
      </Muc>

      <Muc so={5} title="Chọn gói tin">
        <p>
          Gói tin quyết định tin của bạn nằm ở đâu trong danh sách và hiển thị bao lâu. Chi tiết từng hạng và mức giá xem
          tại{" "}
          <Link href="/bao-gia-dang-tin" className="font-semibold text-cvr-blue-ink underline">
            Báo giá dịch vụ
          </Link>
          .
        </p>
      </Muc>

      <Muc so={6} title="Gửi duyệt và chờ hiển thị">
        <p>
          Bấm gửi, tin chuyển sang trạng thái <strong className="font-semibold text-cvr-ink">Chờ duyệt</strong>. Mọi tin
          đều được Coastal Land kiểm duyệt trước khi hiển thị công khai — để lọc tin ảo, tin trùng và thông tin sai lệch.
          Tin đạt yêu cầu thường lên trong vòng vài giờ làm việc.
        </p>
        <p>Những lý do khiến tin bị trả về nhiều nhất:</p>
        <DanhSach
          items={[
            "Ảnh mờ, ảnh chụp màn hình, ảnh có đóng logo của đơn vị khác.",
            "Giá hoặc diện tích ghi sai đơn vị (VD: nhập 4 tỷ thành 4 triệu).",
            "Địa chỉ chung chung, không xác định được phường/xã.",
            "Một bất động sản đăng thành nhiều tin để chiếm chỗ.",
            "Mô tả sao chép từ tin khác, hoặc chèn số điện thoại, link ngoài.",
          ]}
        />
      </Muc>

      <Muc so={7} title="Theo dõi và chăm tin">
        <p>
          Vào{" "}
          <Link href="/tai-khoan/tin-dang" className="font-semibold text-cvr-blue-ink underline">
            Tin đăng của tôi
          </Link>{" "}
          để sửa nội dung, gia hạn hoặc gỡ tin khi đã bán. Bán xong mà quên gỡ, người mua vẫn gọi và tin của bạn bị đánh
          giá là tin ảo — nên gỡ ngay giúp chúng tôi.
        </p>
        <p>
          Cần hỗ trợ trong lúc đăng, gọi{" "}
          <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">
            0377 985 036
          </a>{" "}
          hoặc gửi yêu cầu tại trang{" "}
          <Link href="/lien-he" className="font-semibold text-cvr-blue-ink underline">
            Liên hệ
          </Link>
          .
        </p>
      </Muc>
    </TrangPhapLy>
  );
}
