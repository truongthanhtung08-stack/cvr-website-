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
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "Câu hỏi thường gặp",
  description:
    "Giải đáp thắc mắc thường gặp khi dùng Coastal Land: tìm mua, tìm thuê, lưu tin, so sánh, đăng tin, chi phí và kiểm duyệt tin.",
};

type Hoi = { q: string; a: React.ReactNode };

const L = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="font-semibold text-cvr-blue-ink underline">
    {children}
  </Link>
);

// Câu hỏi chia theo nhóm — chỉ trả lời những gì website ĐANG làm được.
const NHOM: { ten: string; items: Hoi[] }[] = [
  {
    ten: "Dành cho người tìm mua, tìm thuê",
    items: [
      {
        q: "Tìm nhà trên Coastal Land có mất phí không?",
        a: (
          <p>
            Không. Bạn xem tin, tìm kiếm, lọc, lưu tin, so sánh và liên hệ người đăng thoải mái. Các dịch vụ đăng tin và
            quảng bá tin thì có bảng giá riêng, xem tại <L href="/bao-gia-dang-tin">Báo giá dịch vụ</L>.
          </p>
        ),
      },
      {
        q: "Có cần tài khoản mới xem được tin không?",
        a: <p>Không cần. Bạn xem và tìm kiếm thoải mái mà không phải đăng ký. Tài khoản chỉ cần khi bạn muốn đăng tin hoặc quản lý tin của mình.</p>,
      },
      {
        q: "Lưu tin yêu thích thế nào?",
        a: (
          <p>
            Bấm biểu tượng <strong className="font-semibold text-cvr-ink">trái tim ❤</strong> trên thẻ tin hoặc nút “Lưu tin”
            trong trang chi tiết. Toàn bộ tin đã lưu nằm ở mục <L href="/tin-luu">Tin đã lưu</L>. Danh sách này lưu ngay trên
            trình duyệt của bạn, nên xem bằng máy khác hoặc xoá dữ liệu duyệt web thì sẽ không còn.
          </p>
        ),
      },
      {
        q: "So sánh nhiều bất động sản cùng lúc được không?",
        a: (
          <p>
            Được, tối đa <strong className="font-semibold text-cvr-ink">4 tin</strong>. Bấm biểu tượng so sánh trên thẻ tin,
            thanh so sánh sẽ hiện ở cuối màn hình; bấm vào đó để mở bảng <L href="/so-sanh">So sánh</L> đặt song song giá,
            diện tích, giá/m², số phòng, loại hình và khu vực.
          </p>
        ),
      },
      {
        q: "Thông tin trong tin đăng có chính xác không?",
        a: (
          <p>
            Tin do người bán và môi giới cung cấp, được chúng tôi kiểm duyệt trước khi hiển thị. Dù vậy, trước khi giao
            dịch bạn vẫn nên <strong className="font-semibold text-cvr-ink">xem thực địa và đối chiếu giấy tờ pháp lý, quy hoạch</strong>{" "}
            — như với mọi giao dịch nhà đất. Thấy thông tin nào chưa khớp, bạn báo giúp chúng tôi tại{" "}
            <L href="/gop-y">Góp ý, báo lỗi</L>.
          </p>
        ),
      },
      {
        q: "Coastal Land có làm môi giới, có dẫn đi xem nhà không?",
        a: (
          <p>
            Không. Coastal Land là cổng thông tin: chúng tôi không mua bán, không phân phối, không ký gửi, không môi giới và
            không định giá. Bạn liên hệ trực tiếp người đăng tin qua số điện thoại hiển thị trên tin.
          </p>
        ),
      },
    ],
  },
  {
    ten: "Dành cho người đăng tin",
    items: [
      {
        q: "Làm sao để đăng một tin?",
        a: (
          <p>
            Đăng nhập rồi vào trang <L href="/dang-tin">Đăng tin</L> và điền lần lượt các bước. Xem chi tiết từng bước cùng
            mẹo để tin duyệt nhanh tại <L href="/huong-dan">Hướng dẫn đăng tin</L>.
          </p>
        ),
      },
      {
        q: "Đăng tin mất bao nhiêu tiền?",
        a: (
          <p>
            Tuỳ hạng tin và số ngày hiển thị — bảng giá công khai tại <L href="/bao-gia-dang-tin">Báo giá dịch vụ</L>. Cần tư
            vấn chọn gói, gọi hotline{" "}
            <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">
              0377 985 036
            </a>
            .
          </p>
        ),
      },
      {
        q: "Bao lâu thì tin của tôi hiển thị?",
        a: (
          <p>
            Mọi tin đều qua kiểm duyệt trước khi công khai — để lọc tin ảo, tin trùng và thông tin sai lệch. Tin điền đầy đủ,
            ảnh rõ ràng thường lên trong vòng vài giờ làm việc.
          </p>
        ),
      },
      {
        q: "Vì sao tin của tôi bị trả về?",
        a: (
          <p>
            Hay gặp nhất: ảnh mờ hoặc ảnh của đơn vị khác, giá/diện tích sai đơn vị, địa chỉ không rõ phường/xã, một bất động
            sản đăng thành nhiều tin, hoặc mô tả có chèn số điện thoại và link ngoài. Danh sách đầy đủ nằm trong{" "}
            <L href="/quy-dinh">Quy định đăng tin</L>.
          </p>
        ),
      },
      {
        q: "Bán xong rồi thì làm gì với tin?",
        a: (
          <p>
            Vào <L href="/tai-khoan/tin-dang">Tin đăng của tôi</L> để gỡ hoặc ẩn tin. Giữ tin đã bán khiến người mua gọi nhầm
            và làm tin của bạn bị đánh giá là tin ảo.
          </p>
        ),
      },
      {
        q: "Tôi là chủ đầu tư, muốn đăng cả dự án thì sao?",
        a: (
          <p>
            Gửi yêu cầu tại mục <L href="/tai-khoan/du-an">Dự án của tôi</L> hoặc liên hệ hotline. Dự án cũng được kiểm duyệt
            trước khi hiển thị.
          </p>
        ),
      },
    ],
  },
  {
    ten: "Tài khoản và kỹ thuật",
    items: [
      {
        q: "Quên mật khẩu thì lấy lại thế nào?",
        a: (
          <p>
            Vào trang <L href="/quen-mat-khau">Quên mật khẩu</L>, nhập email đã đăng ký, hệ thống gửi liên kết đặt lại mật
            khẩu cho bạn.
          </p>
        ),
      },
      {
        q: "Cài Coastal Land như một ứng dụng trên điện thoại được không?",
        a: (
          <p>
            Được. Mở coastalland.vn trên điện thoại rồi chọn “Thêm vào màn hình chính” (Safari) hoặc “Cài đặt ứng dụng”
            (Chrome). Website sẽ chạy như một app riêng, không có thanh địa chỉ.
          </p>
        ),
      },
      {
        q: "Tôi gặp lỗi khi dùng website?",
        a: (
          <p>
            Báo giúp chúng tôi tại <L href="/gop-y">Góp ý, báo lỗi</L>: dán link trang bị lỗi, mô tả thao tác và cho biết bạn
            dùng máy gì, trình duyệt nào. Có ảnh chụp màn hình thì càng nhanh.
          </p>
        ),
      },
      {
        q: "Còn thắc mắc khác?",
        a: (
          <p>
            Gọi{" "}
            <a href="tel:+84377985036" className="font-semibold text-cvr-blue-ink underline">
              0377 985 036
            </a>{" "}
            (có Zalo) hoặc gửi yêu cầu tại trang <L href="/lien-he">Liên hệ</L>.
          </p>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight text-cvr-ink sm:text-4xl">Câu hỏi thường gặp</h1>
          <p className="mt-5 text-[15px] leading-8 text-cvr-body">
            Những điều người dùng hỏi chúng tôi nhiều nhất. Bấm vào câu hỏi để xem trả lời.
          </p>

          <div className="mt-10 space-y-10">
            {NHOM.map((nhom) => (
              <section key={nhom.ten}>
                <h2 className="text-lg font-semibold tracking-tight text-cvr-ink">{nhom.ten}</h2>
                <div className="mt-3 divide-y divide-cvr-line border-y border-cvr-line">
                  {nhom.items.map((it) => (
                    <details key={it.q} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-cvr-ink transition hover:text-cvr-blue-ink">
                        {it.q}
                        <svg
                          className="h-5 w-5 shrink-0 text-cvr-faint transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                      </summary>
                      <div className="pb-5 pr-9 text-[15px] leading-8 text-cvr-body">{it.a}</div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
