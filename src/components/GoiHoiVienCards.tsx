import Link from "next/link";
import { giaTra, TEN_VOUCHER, type GoiHoiVien } from "@/lib/billing";
import { tachThue } from "@/lib/thue";

// ============================================================================
// THẺ GÓI HỘI VIÊN — dùng chung cho trang Bảng giá và trang Tài khoản → Gói
// hội viên, để hai nơi luôn cùng một con số (đều đọc billing.hoiVien đã công bố).
// Cách bày theo Batdongsan: "Từ X đ/tháng" (kỳ dài nhất quy ra tháng) + tiết kiệm
// tối đa khi dùng hết voucher + danh sách voucher. Mọi số khách thấy ĐÃ GỒM GTGT.
// KHÔNG tự gắn nhãn "Bán chạy nhất" — chưa có số liệu bán thì không được ghi.
// ============================================================================

const dongVN = (n: number) => Math.round(n).toLocaleString("vi-VN") + " đ";
const gomThue = (n: number) => tachThue(n).tongTra;

export function giaTriVoucher(g: GoiHoiVien): number {
  return g.voucher.reduce((s, v) => s + v.giam * v.soLuong, 0);
}

// Kỳ rẻ nhất tính theo tháng (thường là kỳ dài nhất).
export function reNhatMoiThang(g: GoiHoiVien): number {
  return Math.min(...g.thoiHan.map((t) => t.price / t.thang));
}

export default function GoiHoiVienCards({
  goi,
  hrefMua = (id: string) => `/tai-khoan/hoi-vien?goi=${id}`,
  dangDung,
}: {
  goi: GoiHoiVien[];
  hrefMua?: (id: string) => string;
  dangDung?: string | null; // id gói khách đang dùng → thẻ đó ghi "Đang dùng"
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {goi.map((g) => {
        const moiThang = reNhatMoiThang(g);
        const tietKiem = gomThue(giaTriVoucher(g)) - gomThue(moiThang);
        return (
          <article key={g.id} className="flex flex-col rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
            <h3 className="text-lg font-semibold tracking-tight text-cvr-ink">{g.ten}</h3>
            <p className="mt-3 text-xs text-cvr-muted">Từ</p>
            <p className="text-[28px] font-semibold leading-none tracking-tight text-cvr-ink">
              {dongVN(gomThue(moiThang))}<span className="text-sm font-medium text-cvr-muted">/tháng</span>
            </p>
            {tietKiem > 0 && (
              <p className="mt-2 text-[13px] font-medium text-cvr-gold-ink">Tiết kiệm đến {dongVN(tietKiem)}/tháng khi dùng hết voucher</p>
            )}

            <ul className="mt-4 space-y-1.5 border-t border-cvr-line pt-4 text-sm">
              {g.thoiHan.map((t) => (
                <li key={t.thang} className="flex items-baseline justify-between gap-3">
                  <span className="text-cvr-body">{t.thang} tháng</span>
                  <span className="text-right tabular-nums">
                    {t.giaGoc ? <span className="mr-1.5 text-xs text-cvr-faint line-through">{giaTra(t.giaGoc)}</span> : null}
                    <b className="font-semibold text-cvr-ink">{giaTra(t.price)}</b>
                    {t.thang > 1 && <span className="block text-[11px] text-cvr-muted">≈ {dongVN(gomThue(t.price / t.thang))}/tháng</span>}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Voucher mỗi 30 ngày</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {g.voucher.map((v) => (
                <li key={v.loai} className="flex items-baseline justify-between gap-3">
                  <span className="text-cvr-body">Giảm {dongVN(gomThue(v.giam))}/lần {TEN_VOUCHER[v.loai]}</span>
                  <b className="shrink-0 font-semibold text-cvr-ink">× {v.soLuong}</b>
                </li>
              ))}
              {g.quyenLoi.map((q) => (
                <li key={q} className="text-cvr-body">✓ {q}</li>
              ))}
            </ul>

            <div className="mt-auto pt-5">
              {dangDung === g.id ? (
                <span className="flex h-11 items-center justify-center rounded-full bg-cvr-surface text-sm font-semibold text-cvr-muted">Đang dùng</span>
              ) : (
                <Link href={hrefMua(g.id)} className="flex h-11 items-center justify-center rounded-full bg-cvr-ink text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
                  Mua gói
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

// Điều kiện dùng gói — chữ lấy từ admin (quyDinhGia.dieuKienHoiVien).
export function DieuKienHoiVien({ dong }: { dong: string[] }) {
  if (!dong.length) return null;
  return (
    <ul className="mt-4 space-y-1 text-[13px] leading-relaxed text-cvr-muted">
      {dong.map((d) => <li key={d}>· {d}</li>)}
    </ul>
  );
}
