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

export const metadata: Metadata = {
  alternates: { canonical: "/tuyen-dung" },
  title: "Tuyển dụng",
  description:
    "Cơ hội cộng tác cùng Coastal Land — Cổng thông tin Bất động sản. Chuyên viên Sales and Marketing",
};

export default function TuyenDungPage() {
  return (
    <TrangPhapLy
      title="Tuyển dụng"
      moDau="Coastal Land vận hành theo mô hình start up Công nghệ và tự động hoá toàn bộ. Chúng tôi luôn khuyên khích và rộng mở với nhân sự am hiểu công nghệ và đam mê trong lĩnh vực bất động sản."
    >
      <Muc title="Vị trí đang tuyển">
        <p></p>
      </Muc>
      <Muc title="">
        <p></p>
        <DanhSach
          items={[
            <><strong className="font-semibold text-cvr-ink">Cộng tác viên khu vực</strong> (Đà Nẵng, Huế, Quảng Ngãi, Khánh Hoà…): kết nối chủ nhà, môi giới và sàn ở địa phương lên nền tảng, hỗ trợ đăng tin đúng chuẩn.</>,
            <><strong className="font-semibold text-cvr-ink">Biên tập nội dung bất động sản:</strong> viết tin thị trường, bài phân tích khu vực, chuẩn hoá mô tả tin đăng.</>,
            <><strong className="font-semibold text-cvr-ink">Kinh doanh dịch vụ đăng tin:</strong> tư vấn gói tin cho môi giới, sàn và chủ đầu tư.</>,
          ]}
        />
      </Muc>

      <Muc title="">
        <DanhSach
          items={[]}
        />
      </Muc>

      <Muc title="Gửi hồ sơ">
        <p>
          {" "}
          <a href="mailto:hotro@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">
            hotro@coastalland.vn
          </a>{" "}
          với tiêu đề “Ứng tuyển — [mảng bạn chọn]”.
        </p>
        <YeuCauForm
          loai="hop_tac"
          goiYNoiDung=""
          nhanNut="Gửi hồ sơ"
          loiNhanXong=""
        />
      </Muc>

      <Muc title="">
        <p>
          {" "}
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
