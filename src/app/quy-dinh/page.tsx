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
import { getQuyDinhGia } from "@/lib/siteContent";

export const metadata: Metadata = {
  alternates: { canonical: "/quy-dinh" },
  title: "Quy định đăng tin",
  description:
    "Quy định đăng tin bất động sản trên Coastal Land: điều kiện để tin được duyệt, yêu cầu về nội dung và hình ảnh, thời hạn hiển thị và cách gửi khiếu nại.",
};

export default async function QuyDinhPage() {
  // QUY ĐỊNH GÓI TIN + ĐẨY TIN THỐNG NHẤT MỘT CHỖ = trang này (chủ dự án 22/10/2026 tối: "quy định đăng tin đã có riêng ở
  // footer — chỉ đưa vào tên, bấm vào ra đây, thống nhất một cái"). Phần này đọc từ admin (Giá chuẩn → Quy định), cùng nguồn
  // với hộp "Quy định gói tin" ở bước chọn gói khi đăng tin. Trang Báo giá chỉ để chữ "Quy định" trỏ tới #quy-dinh-goi-tin,
  // #quy-dinh-day-tin. Chú thích (*) của bảng đặc điểm ở lại dưới bảng trong Báo giá.
  const qd = await getQuyDinhGia();
  const quyDinhGoiTin = [...qd.quyDinhGoiTin, ...qd.quyDinhChung.filter((x) => !/^\(\*+\)/.test(x.trim()))];
  return (
    <TrangPhapLy
      title="Quy định đăng tin"
      capNhat="17/08/2026"
      moDau="Những quy định để tin đăng trên coastalland.vn giữ được chất lượng và hiệu quả. Áp dụng cho tin mua bán, cho thuê và dự án."
    >
      <Muc so={1} title="Nguyên tắc chung">
        <p>
          Mọi tin đăng đều được Coastal Land kiểm duyệt trước khi hiển thị công khai. Tin gửi lên sẽ ở trạng thái chờ duyệt
          cho tới khi kiểm duyệt xong.
        </p>
        <p>Người đăng tin/ Thành viên là chủ sở hữu, người được chủ sở hữu uỷ quyền, hoặc đội ngũ chuyên gia, môi giới đang nhận bán / cho thuê bất động sản đó.</p>
      </Muc>

      <Muc so={2} title="Điều kiện để một tin đăng được duyệt">
        <DanhSach
          items={[
            "Thông tin đúng sự thật: vị trí, diện tích, giá, số phòng, tình trạng pháp lý.",
            "Giá ghi đúng đơn vị và là mức giá đang chào bán thật.",
            "Địa chỉ xác định được tới cấp Phường/Xã theo đơn vị hành chính mới (2 cấp: Tỉnh/Thành phố → Phường/Xã).",
            "Ảnh là ảnh thật của chính bất động sản đang rao bán, cho thuê, còn mới, đủ chất lượng, thấy rõ hiện trạng.",
            "Tiêu đề mô tả đúng bất động sản, không viết hoa toàn bộ, không chèn ký tự trang trí.",
            "Loại hình và nhu cầu (bán / cho thuê) chọn đúng danh mục.",
            "Số điện thoại liên hệ là số đang dùng, đã xác thực",
          ]}
        />
      </Muc>

      <Muc so={3} title="Những nội dung chúng tôi từ chối hiển thị trên website">
        <DanhSach
          items={[
            "Tin không có thật, hoặc tin đã bán / đã cho thuê xong mà vẫn để lại.",
            "Cùng một bất động sản chia thành nhiều tin, hoặc đăng lại liên tục để đẩy lên đầu danh sách.",
            "Nội dung, hình ảnh của người khác khi chưa được đồng ý; ảnh còn logo hoặc số điện thoại của đơn vị khác.",
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
            "Không dùng ảnh chụp màn hình, ảnh phối cảnh thay cho bất động sản mà không ghi chú rõ.",
            "Không chèn chữ quảng cáo, khung viền, số điện thoại lên ảnh.",
            "Ảnh phối cảnh, ảnh minh hoạ dự án phải được ghi chú rõ là phối cảnh.",
            "Video (tệp tải lên hoặc link YouTube) phải là của chính bất động sản đang rao bán/ cho thuê.",
          ]}
        />
      </Muc>

      <Muc so={5} title="Thời hạn, đăng lại và đẩy tin">
        {quyDinhGoiTin.length > 0 && (
          <div id="quy-dinh-goi-tin" className="scroll-mt-4">
            <h3 className="font-semibold text-cvr-ink">Gói đăng tin</h3>
            <div className="mt-1"><DanhSach items={quyDinhGoiTin} /></div>
          </div>
        )}
        {qd.quyDinhDayTin.length > 0 && (
          <div id="quy-dinh-day-tin" className="scroll-mt-4">
            <h3 className="font-semibold text-cvr-ink">Gói đẩy tin</h3>
            <div className="mt-1"><DanhSach items={qd.quyDinhDayTin} /></div>
          </div>
        )}
        <p>Bất động sản đã giao dịch xong, đề nghị gỡ tin ngay.</p>
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
          Nếu cho rằng tin bị từ chối không đúng lý do, bạn gửi khiếu nại kèm mã tin qua trang{" "}
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

      {/* Đọc hết quy định → về đúng gói trong trang Báo giá (chủ dự án 22/10/2026 tối: "phía dưới có Gói đăng tin, bấm vào ra
          mục menu Báo giá đăng tin — tất cả phần này phải có một liên kết theo logic"). Phần Quy định của mỗi gói trong Báo giá
          có liên kết ngược về trang này. */}
      <div className="flex flex-wrap gap-2.5 border-t border-cvr-line pt-6">
        {[
          { ten: "Gói đăng tin", href: "/bao-gia-dang-tin#bang-gia-tin" },
          { ten: "Gói đẩy tin", href: "/bao-gia-dang-tin#goi-day-tin" },
        ].map((g) => (
          <Link key={g.href} href={g.href} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-4 text-sm font-semibold text-cvr-ink no-underline transition hover:border-cvr-ink">
            {g.ten}
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        ))}
      </div>
    </TrangPhapLy>
  );
}
