import Link from "next/link";
import type { Listing } from "@/lib/data";

// ============================================================================
// KHUNG CHỜ CỦA TRANG DANH MỤC — kiêm luôn NỘI DUNG CHO GOOGLE ĐỌC
// ----------------------------------------------------------------------------
// VẤN ĐỀ NÓ GIẢI (đo ngày 18/09/2026): `ListingBrowser` là component chạy ở
// trình duyệt và dùng `useSearchParams`, nên Next KHÔNG dựng nó ở máy chủ. Tải
// HTML thô của /mua-ban về thì thấy: 0 thẻ H1, 0 đường dẫn tin nào — 493 KB kia
// toàn là gói dữ liệu nằm trong thẻ <script>. Khách không hề hấn gì (trình duyệt
// dựng xong trong chớp mắt), nhưng:
//   · Google phải xếp hàng chạy JavaScript mới thấy nội dung → nhóm từ khoá đông
//     nhất ngành ("nhà đất Đà Nẵng", "cho thuê căn hộ Huế") lại là nhóm Google
//     đọc chậm nhất.
//   · Bot kiểm trang đích của Google Ads chấm "mức độ liên quan" thấy trang ít
//     chữ → điểm chất lượng thấp → GIÁ MỖI LƯỢT BẤM ĐẮT HƠN cho cùng vị trí.
//
// CÁCH GIẢI: đây là `fallback` của <Suspense>, mà fallback thì MÁY CHỦ DỰNG SẴN
// và nằm trong HTML thô. Nên chỗ này vừa là khung chờ, vừa là bản tóm tắt trang
// cho Google. Khi trình duyệt dựng xong `ListingBrowser`, cả khối này biến mất
// và khách thấy đúng giao diện cũ — KHÔNG đổi một pixel nào.
//
// ⚠️ VÌ SAO DÙNG `sr-only` MÀ KHÔNG PHẢI CHE GIẤU NỘI DUNG:
// nội dung ở đây TRÙNG với thứ khách nhìn thấy sau khi trang dựng xong (cùng
// tiêu đề, cùng danh sách tin), chỉ khác là hiện sớm hơn vài trăm mili giây.
// Đây không phải "cloaking" — cloaking là đưa Google nội dung KHÁC với khách.
// Giữ `sr-only` để khung chờ trông y hệt như trước, không nhấp nháy chữ.
//
// ⛔ ĐỪNG bỏ thẻ <h1> ở đây trừ khi `ListingBrowser` được dựng ở máy chủ: đó là
// H1 DUY NHẤT của trang trong HTML thô.
// ============================================================================

export default function KhungChoDanhMuc({
  heading,
  moTa,
  items,
}: {
  /** Tiêu đề trang — PHẢI trùng với `heading` truyền cho ListingBrowser. */
  heading: string;
  /** Một hai câu tả trang này bán gì, ở đâu. */
  moTa: string;
  /** Tin của đúng trang này (đã lọc mục đích/khu vực). Chỉ lấy 24 tin đầu. */
  items: Listing[];
}) {
  const tin = items.slice(0, 24);

  return (
    // Chiều cao 104px giữ NGUYÊN như khung chờ cũ: đúng bằng thanh lọc thật, để
    // lúc trang đang tải không phình ra một mảng trắng dưới header.
    <div className="mx-auto h-[104px] max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="sr-only">
        <h1>{heading}</h1>
        <p>{moTa}</p>
        {tin.length > 0 && (
          <ul>
            {tin.map((l) => (
              <li key={l.id}>
                <Link href={`/bat-dong-san/${l.id}`}>
                  {l.title} — {l.price} · {l.area} · {l.location}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
