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
      moDau="Website tốt lên nhờ người dùng nói thẳng. Thấy thông tin chưa đúng, ảnh không khớp, hay một nút bấm không chạy — bạn cho chúng tôi biết nhé."
    >
      <Muc title="Tin đăng có chỗ chưa ổn">
        <p>Bạn gửi cho chúng tôi khi gặp một trong các trường hợp sau:</p>
        <DanhSach
          items={[
            "Tin đã bán / đã cho thuê nhưng vẫn còn hiển thị.",
            "Giá, diện tích, vị trí hoặc pháp lý chưa khớp với thực tế.",
            "Ảnh không phải của bất động sản đó, hoặc là ảnh của người khác.",
            "Một bất động sản xuất hiện ở nhiều tin trùng nhau.",
            "Hoặc bất cứ điều gì khiến bạn thấy chưa yên tâm về tin đăng đó.",
          ]}
        />
        <p>
          Bạn gửi kèm <strong className="font-semibold text-cvr-ink">đường dẫn (link) của tin</strong> giúp chúng tôi
          kiểm tra nhanh hơn. Tin chưa đáp ứng sẽ được tạm ẩn hoặc gỡ theo{" "}
          <Link href="/quy-dinh" className="font-semibold text-cvr-blue-ink underline">
            Quy định đăng tin
          </Link>
          .
        </p>
      </Muc>

      <Muc title="Báo lỗi kỹ thuật">
        <p>Để chúng tôi tìm ra lỗi nhanh nhất, mô tả giúp 3 điều:</p>
        <DanhSach
          items={[
            "Bạn đang ở trang nào (dán link) và bấm vào đâu thì lỗi xảy ra.",
            "Bạn mong nó chạy thế nào, còn thực tế nó ra sao.",
            "Bạn dùng điện thoại hay máy tính, trình duyệt gì (Chrome, Safari, Zalo…).",
          ]}
        />
        <p>Có ảnh chụp màn hình thì càng tốt — gửi qua Zalo hoặc email giúp chúng tôi.</p>
      </Muc>

      <Muc title="Góp ý về nền tảng">
        <p>
          Bạn muốn có thêm bộ lọc nào, thiếu khu vực nào, hay thấy chỗ nào khó dùng — cứ viết ra. Coastal Land đang trong
          giai đoạn xây dựng, những góp ý này quyết định thứ tự việc chúng tôi làm tiếp.
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
          <a href="mailto:lienhe@coastalland.vn" className="font-semibold text-cvr-blue-ink underline">
            lienhe@coastalland.vn
          </a>
          .
        </p>
      </Muc>
    </TrangPhapLy>
  );
}
