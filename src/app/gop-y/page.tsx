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
  alternates: { canonical: "/gop-y" },
  title: "Góp ý, báo lỗi",
  description:
    "Gửi góp ý, báo tin sai sự thật hoặc báo lỗi kỹ thuật trên Coastal Land. Mỗi phản ánh đều được xem xét và phản hồi.",
};

export default function GopYPage() {
  return (
    <TrangPhapLy
      title="Góp ý, báo lỗi"
      moDau="Website phát triển và được hoàn thiện sẽ nhờ người dùng góp ý. Khi phát hiện hoặc thấy thông tin chưa chính xác, hình ảnh không khớp, lỗi hiển thị, hay bất cứ vấn đề gì liên quan đến thao tác đăng tin và hiển thị... rất mong bạn hãy góp ý cho chúng tôi."
    >
      <Muc title="Tin đăng có chỗ chưa ổn">
        <p>Bạn gửi cho chúng tôi khi gặp một trong các trường hợp sau:</p>
        <DanhSach
          items={[
            "Tin đã bán / đã cho thuê nhưng vẫn còn hiển thị.",
            "Giá, diện tích, vị trí hoặc pháp lý chưa khớp với thực tế.",
            "Hình ảnh không phải của bất động sản đó, hoặc là ảnh của người khác.",
            "Một bất động sản xuất hiện ở nhiều tin trùng nhau.",
            "Hoặc bất cứ điều gì khiến bạn thấy chưa yên tâm về tin đăng.",
          ]}
        />
        <p>
          Bạn gửi kèm <strong className="font-semibold text-cvr-ink">đường dẫn (link) của tin</strong> để chúng tôi
          kiểm tra và khắc phục ngay. Tin chưa đáp ứng sẽ được tạm ẩn hoặc gỡ theo{" "}
          <Link href="/quy-dinh" className="font-semibold text-cvr-blue-ink underline">
            Quy định đăng tin
          </Link>
          .
        </p>
      </Muc>

      <Muc title="Báo lỗi kỹ thuật">
        <p>Để chúng tôi tìm ra lỗi nhanh nhất, mô tả giúp 3 điều sau:</p>
        <DanhSach
          items={[
            "Bạn đang ở trang nào (dán link) và bấm vào đâu thì lỗi xảy ra.",
            "Bạn mong muốn tin được xử lý theo hướng nào, thực trạng ra sao.",
            "Bạn dùng điện thoại hay máy tính, trình duyệt gì (Chrome, Safari, Zalo…).",
          ]}
        />
        <p>Có ảnh chụp màn hình thì càng tốt — gửi qua Zalo hoặc email giúp chúng tôi.</p>
      </Muc>

      <Muc title="Góp ý về nền tảng">
        <p>
        </p>
      </Muc>

      <Muc title="Gửi phản ánh">
        <YeuCauForm
          loai="khac"
          goiYNoiDung="Dán link trang / tin có vấn đề và mô tả ngắn gọn điều bạn gặp phải…"
          nhanNut="Gửi góp ý"
          loiNhanXong="Cảm ơn bạn. Chúng tôi đã nhận phản ánh và sẽ kiểm tra sớm nhất."
        />
        <p className="text-sm text-cvr-muted">
          Trường hợp gấp, gọi hotline{" "}
          <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">
            0377 985 036
          </a>{" "}
          hoặc email{" "}
          <a href="mailto:hotro@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">
            hotro@coastalland.vn
          </a>
          .
        </p>
      </Muc>
    </TrangPhapLy>
  );
}
