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
  // Chưa đủ để lập bảng thì nói thẳng, đừng để khối biến mất làm người xem tưởng
  // web thiếu chức năng.
  if (bang.length < 2) {
    const soTin = items.filter((x) => (x.purpose ?? "ban") === mucDich).length;
    if (soTin < 3) return null;
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-2.5 rounded-2xl border border-cvr-line bg-white px-5 py-4 shadow-lux">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
          </svg>
          <p className="text-[13px] leading-relaxed text-cvr-muted">
            <strong className="font-semibold text-cvr-ink">
              Chưa đủ tin để lập bảng giá tại {tenKhuVuc}.
            </strong>{" "}
            Mỗi loại hình cần ít nhất 3 tin mới đưa vào bảng — khu vực này đang có {soTin} tin, chia
            ra chưa loại nào đủ. Coastal Land để trống chứ không đưa con số chưa đủ căn cứ.
          </p>
        </div>
      </section>
    );
  }

  const laThue = mucDich === "thue";
  const max = Math.max(...bang.map((d) => d.trungVi));

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux sm:p-6">
        <h2 className="text-[17px] font-semibold tracking-tight text-cvr-ink sm:text-lg">
          {laThue ? "Giá thuê" : "Giá bán"} theo loại hình tại {tenKhuVuc}
        </h2>
        <p className="mt-1 text-[13px] text-cvr-muted">
          Giá mỗi m² — cột bên phải là số tin làm mẫu của từng dòng.
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

        <div className="mt-4 flex gap-2.5 rounded-xl bg-cvr-surface px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
          </svg>
          <p className="text-[12px] leading-relaxed text-cvr-muted">
            Số liệu tổng hợp từ <strong className="font-semibold text-cvr-body">tin đang đăng trên
            Coastal Land</strong>, là giá rao chứ không phải giá đã giao dịch. Trung vị và khoảng
            phổ biến tính sau khi bỏ 25% rẻ nhất và 25% đắt nhất. Tin nằm ngoài khoảng giá này thì
            nên hỏi kỹ và xác minh thêm trước khi giao dịch.
          </p>
        </div>
      </div>
    </section>
  );
}
