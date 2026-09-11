import type { Listing } from "@/lib/data";
import { bangGiaTheoLoai, vndM2 } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// MẶT BẰNG GIÁ CỦA MỘT KHU VỰC — đặt ở trang /mua-ban/da-nang, /cho-thue/hue…
//
// Khách vào trang "nhà đất Đà Nẵng" thì câu hỏi đầu tiên là mỗi loại hình đang
// bao nhiêu một mét vuông. Trả lời ngay đầu trang, trước cả danh sách tin.
//
// Hai thứ đặt web mình trên các sàn khác, đều là chuyện minh bạch chứ không phải
// kỹ thuật: ghi rõ SỐ TIN LÀM MẪU của từng dòng, và ghi rõ số này tính từ tin
// đang đăng chứ không phải giá giao dịch. Loại hình nào dưới 3 tin thì không
// đưa vào bảng.
// ════════════════════════════════════════════════════════════════════════════

export default function BangGiaKhuVuc({
  items,
  tenKhuVuc,
  mucDich = "ban",
}: {
  items: Listing[];
  tenKhuVuc: string;
  mucDich?: "ban" | "thue";
}) {
  const bang = bangGiaTheoLoai(items, mucDich).slice(0, 8);
  if (bang.length < 2) return null;

  const laThue = mucDich === "thue";
  const max = Math.max(...bang.map((d) => d.trungVi));

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux sm:p-6">
        <h2 className="text-[17px] font-semibold tracking-tight text-cvr-ink sm:text-lg">
          {laThue ? "Giá thuê" : "Giá bán"} theo loại hình tại {tenKhuVuc}
        </h2>
        <p className="mt-1 text-[13px] text-cvr-muted">
          Giá mỗi m² tính từ tin đang đăng trên Coastal Land — cột bên phải là số tin làm mẫu.
        </p>

        <div className="mt-4 space-y-3">
          {bang.map((d) => (
            <div key={d.loai} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="w-full text-[13px] font-medium text-cvr-ink sm:w-52 sm:shrink-0">
                {d.loai}
              </span>
              <span
                className="h-2.5 min-w-[6px] rounded-full bg-cvr-gold"
                style={{ width: `${Math.max(6, (d.trungVi / max) * 55)}%` }}
                aria-hidden
              />
              <span className="text-[13px] font-semibold text-cvr-ink">
                {vndM2(d.trungVi, laThue)}
              </span>
              <span className="text-[12px] text-cvr-faint">
                phổ biến {vndM2(d.thap, laThue).replace("/m²", "")} – {vndM2(d.cao, laThue)}
              </span>
              <span className="ml-auto text-[12px] text-cvr-faint">{d.soMau} tin</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-cvr-faint">
          Đây là giá rao trên tin đăng, không phải giá giao dịch đã chốt. Con số lấy trung vị và
          khoảng phổ biến (bỏ 25% rẻ nhất và 25% đắt nhất) nên không bị một tin lệch kéo đi.
        </p>
      </div>
    </section>
  );
}
