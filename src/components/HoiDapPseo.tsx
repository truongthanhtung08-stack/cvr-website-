import type { Listing } from "@/lib/data";
import { giaMoiM2 } from "@/lib/chiSoGia";
import { mauSoCuaLoaiHinh } from "@/lib/listingSpec";
import { phuongCuaTin, tieuDe, type DieuKien } from "@/lib/pseo";

// ============================================================================
// CÂU HỎI THƯỜNG GẶP CỦA TRANG pSEO (kế hoạch SEO mục 3 #17, 20/10/2026) — nội dung RIÊNG mỗi trang, tính từ
// chính các tin đang khớp trang: khoảng giá · giá mỗi m² ở mức giữa · phường nhiều tin. Không in số tin (chốt 11/09).
// Máy chủ vẽ sẵn (Google đọc được) + FAQPage JSON-LD trùng NGUYÊN VĂN chữ trên trang (Google bắt buộc).
// Câu chữ: chủ dự án duyệt nguyên văn. Dưới 3 tin thì không hiện (trang cũng không mở cho Google).
// Chi phí: tính trong lúc dựng trang đã có bộ nhớ đệm — không thêm truy vấn, không thêm hàm máy chủ.
// ============================================================================

const soVi = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const gia = (v: number) => (v >= 1e9 ? `${soVi(v / 1e9)} tỷ` : `${soVi(v / 1e6)} triệu`);
const giua = (ds: number[]) => {
  const s = [...ds].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function hoiDapPseo(dk: DieuKien, tin: Listing[]): { q: string; a: string }[] {
  if (tin.length < 3) return [];
  const thue = dk.muc === "thue";
  const cau = tieuDe(dk);
  const ds: { q: string; a: string }[] = [];

  const g = tin.map((l) => l.priceVnd ?? 0).filter((v) => v > 0);
  if (g.length) {
    const [a, b] = [gia(Math.min(...g)), gia(Math.max(...g))];
    const khoang = a === b ? a : `từ ${a} đến ${b}`;
    ds.push({ q: `${cau} giá bao nhiêu?`, a: `Theo các tin đang đăng trên Coastal Land, ${thue ? "giá thuê" : "giá"} ${khoang}${thue ? "/tháng" : ""}.` });
  }

  // Giá mỗi m² chỉ cho tin BÁN, theo đúng luật loại hình (đất → m² đất · nhà → m² sàn thật · căn hộ → m² căn) — giaMoiM2.
  if (!thue) {
    const m2 = tin.map(giaMoiM2).filter((v): v is number => v != null && v > 0);
    if (m2.length >= 3) {
      const san = tin.some((l) => mauSoCuaLoaiHinh(l.type) === "san");
      ds.push({ q: `${cau} giá bao nhiêu một m²?`, a: `Giá mỗi m²${san ? " sàn" : ""} ở mức giữa khoảng ${gia(giua(m2))}.` });
    }
  }

  // Phường nhiều tin — chỉ khi trang chưa khoanh sẵn một phường.
  if (!dk.phuong) {
    const dem = new Map<string, number>();
    for (const l of tin) { const p = phuongCuaTin(l); if (p) dem.set(p, (dem.get(p) ?? 0) + 1); }
    const top = [...dem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => p);
    // "Phường Sơn Trà, phường An Hải." — chỉ viết hoa chữ đầu câu
    const ke = top.map((p, i) => (i ? p.replace(/^(Phường|Xã|Đặc khu)(?=\s)/, (w) => w.toLowerCase()) : p)).join(", ");
    if (top.length) ds.push({ q: `${cau} ở khu vực nào nhiều tin?`, a: `${ke}.` });
  }
  return ds;
}

export default function HoiDapPseo({ hoiDap }: { hoiDap: { q: string; a: string }[] }) {
  if (!hoiDap.length) return null;
  return (
    <section aria-labelledby="hoi-dap" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: hoiDap.map((h) => ({ "@type": "Question", name: h.q, acceptedAnswer: { "@type": "Answer", text: h.a } })),
          }),
        }}
      />
      <h2 id="hoi-dap" className="text-[20px] font-normal tracking-tight text-cvr-ink sm:text-[22px]">Câu hỏi thường gặp</h2>
      <dl className="mt-4 max-w-[980px] space-y-4">
        {hoiDap.map((h) => (
          <div key={h.q}>
            <dt className="text-[16px] font-semibold text-cvr-ink">{h.q}</dt>
            <dd className="mt-1 text-[15px] leading-relaxed text-cvr-muted">{h.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
