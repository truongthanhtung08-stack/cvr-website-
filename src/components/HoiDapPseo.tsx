import Link from "next/link";
import type { Listing } from "@/lib/data";
import { giaMoiM2 } from "@/lib/chiSoGia";
import { phuongCuaTin, tieuDe, type DieuKien } from "@/lib/pseo";
import { thangHienTai } from "@/lib/thang";

// ============================================================================
// CÂU HỎI THƯỜNG GẶP CỦA TRANG pSEO (kế hoạch SEO mục 3 #17, 20/10/2026) — nội dung RIÊNG mỗi trang, tính từ
// chính các tin đang khớp trang: khoảng giá · giá mỗi m² ở mức giữa. Không in số tin (chốt 11/09).
// Máy chủ vẽ sẵn (Google đọc được) + FAQPage JSON-LD trùng NGUYÊN VĂN chữ trên trang (Google bắt buộc).
// Câu chữ: chủ dự án duyệt nguyên văn. Dưới 3 tin thì không hiện (trang cũng không mở cho Google).
// Chi phí: tính trong lúc dựng trang đã có bộ nhớ đệm — không thêm truy vấn, không thêm hàm máy chủ.
// ============================================================================

const soVi = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const gia = (v: number) => (v >= 1e9 ? `${soVi(v / 1e9)} tỷ` : `${soVi(v / 1e6)} triệu`);

// ── THAM KHẢO GIÁ THEO KHU VỰC / DỰ ÁN (24/10/2026 — chủ dự án: "nghiên cứu web top đầu họ nói gì, cứ thế áp dụng").
// Khuôn câu đo trên Google 24/10: Batdongsan "Giá đất ở Đà Nẵng tháng 5/2026? … có giá từ 48,7 triệu/m² - 86,1 triệu/m²",
// "Tham khảo giá bán căn hộ chung cư Đà Nẵng · Khu vực có nhiều căn hộ: Hải Châu 54,4 - 282,2 tr/m²"; Nhà Tốt "Top 5 khu
// vực … Thuê chung cư Quận Liên Chiểu: 5,5 triệu - 15 triệu"; khung AI của Google "Mức giá thuê căn hộ theo khu vực".
// → BÁN tính theo m² (giaMoiM2: đất → m² đất · nhà → m² sàn thật · căn hộ → m² căn), THUÊ theo tháng. Mọi trang pSEO
// dùng chung, số tự tính từ chính tin của trang; ≥ 2 khu vực / dự án mới hiện. Tên dự án: chữ trong tin bỏ đuôi tên tỉnh
// ("Nera Garden Huế" = "Nera Garden") — hồ sơ dự án tên chuẩn do Cowork làm.
const khoangTu = (ds: number[], f: (n: number) => string) => {
  const a = f(Math.min(...ds)), b = f(Math.max(...ds));
  if (a === b) return a;
  const [x, dx] = a.split(" "), [, db] = b.split(" ");
  return dx && dx === db ? `từ ${x} đến ${b}` : `từ ${a} đến ${b}`; // "từ 33 đến 48 triệu/m²" — cùng đơn vị ghi một lần
};
const trieu = (donVi: string) => (n: number) => `${soVi(n / 1e6)} ${donVi}`;
function giaNhom(xs: Listing[], thue: boolean): string {
  if (thue) { const g = xs.map((l) => l.priceVnd ?? 0).filter((v) => v > 0); return g.length ? khoangTu(g, trieu("triệu/tháng")) : ""; }
  const g = xs.map(giaMoiM2).filter((v): v is number => v != null && v > 0);
  return g.length ? khoangTu(g, trieu("triệu/m²")) : "";
}
const TINH_DUOI = /\s+(Huế|Đà Nẵng|Quảng Ngãi|Quảng Trị|Nha Trang|Khánh Hòa|Gia Lai|Quy Nhơn|Lâm Đồng|Phan Thiết)$/i;
function nhomTheo(tin: Listing[], khoa: (l: Listing) => string | undefined, thue: boolean) {
  const m = new Map<string, Listing[]>();
  for (const l of tin) { const k = khoa(l)?.trim(); if (k) m.set(k, [...(m.get(k) ?? []), l]); }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 5)
    .map(([ten, xs]) => ({ ten, gia: giaNhom(xs, thue) })).filter((x) => x.gia);
}
// MÓN (condotel, căn hộ 2 phòng ngủ…) + NƠI (Đà Nẵng; Sơn Trà, Đà Nẵng; đường …) — để đặt câu tự nhiên, không ghép máy
function monNoi(dk: DieuKien) {
  const noi = dk.duong ? `đường ${dk.duong}, ${dk.tinh.name}` : dk.thanhPho ? `${dk.thanhPho.name}, ${dk.tinh.name}` : dk.phuong ? `${dk.phuong}, ${dk.tinh.name}` : dk.tinh.name;
  const mon = tieuDe(dk).replace(noi, " ").replace(/^(Bán|Cho thuê|Mua bán)\s+/i, "").replace(/\s+/g, " ").trim() || "nhà đất";
  // CỤM NGẮN khách gõ (chủ dự án 24/10/2026: "kết hợp ngắn vào long tail" — gợi ý Google: "chung cư huế giá", "căn hộ đà nẵng")
  const ngan = mon.replace(/^căn hộ chung cư/, "chung cư").replace(/^nhà riêng/, "nhà").replace(/^đất nền( dự án)?/, "đất");
  return { mon, noi, ngan };
}
export type GiaNhom = { hoi: string; tong: string; tieuDe: string; veTinh: { href: string; nhan: string }; duAn: { ten: string; gia: string }[]; khuVuc: { ten: string; gia: string }[] };
export function giaTheoNhom(dk: DieuKien, tin: Listing[]): GiaNhom | null {
  if (tin.length < 3) return null; // cùng cổng trang mở cho Google
  // Trang gộp nhiều loại hình ("nhà đất …") KHÔNG tính giá: luật chủ dự án 03/10 + 16/10/2026 — giá đúng khu vực, đúng loại
  // hình (đất ÷ m² đất · căn hộ ÷ m² căn · nhà ÷ m² sàn); trộn đất với căn hộ ra một khoảng giá là sai.
  if (!dk.cat) return null;
  const thue = dk.muc === "thue";
  const { mon, noi, ngan } = monNoi(dk);
  const tong = giaNhom(tin, thue);
  const thang = thangHienTai(), thueChu = thue ? "thuê " : "";
  const duAn = nhomTheo(tin, (l) => l.projectName?.replace(TINH_DUOI, ""), thue);
  const khuVuc = dk.phuong || dk.duong ? [] : nhomTheo(tin, (l) => phuongCuaTin(l) || undefined, thue);
  return {
    // Hỏi theo cụm ngắn khách gõ; đáp ghi cả cụm ngắn lẫn tên đầy đủ: "Giá chung cư Huế, căn hộ chung cư tại Huế tháng 10/2026 từ …"
    hoi: `Giá ${thueChu}${ngan} ${noi} ${thang}?`,
    tong: !tong ? "" : ngan !== mon ? `Giá ${thueChu}${ngan} ${noi}, ${mon} tại ${noi} ${thang} ${tong}.` : `Giá ${thueChu}${mon} ${noi} ${thang} ${tong}.`,
    veTinh: { href: `/${thue ? "cho-thue" : "mua-ban"}/${dk.tinh.slug}`, nhan: `Xem thêm nhà đất ${thue ? "cho thuê " : ""}${dk.tinh.name}` },
    tieuDe: `Tham khảo giá ${thue ? "thuê" : "bán"} ${mon} ${noi}`,
    duAn: duAn.length >= 2 ? duAn : [],
    khuVuc: khuVuc.length >= 2 ? khuVuc : [],
  };
}

export function GiaTheoNhomPseo({ g }: { g: GiaNhom | null }) {
  if (!g || (!g.duAn.length && !g.khuVuc.length)) return null;
  const bang = (tieu: string, ds: { ten: string; gia: string }[]) => ds.length ? (
    <div className="mt-4">
      <h3 className="text-[16px] font-semibold text-cvr-ink">{tieu}</h3>
      <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-cvr-muted">
        {ds.map((x) => <li key={x.ten}><span className="font-medium text-cvr-ink">{x.ten}:</span> {x.gia}</li>)}
      </ul>
    </div>
  ) : null;
  return (
    <section aria-labelledby="gia-theo-nhom" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <h2 id="gia-theo-nhom" className="text-[20px] font-normal tracking-tight text-cvr-ink sm:text-[22px]">{g.tieuDe}</h2>
      <div className="max-w-[980px]">
        {g.tong && <p className="mt-3 text-[15px] leading-relaxed text-cvr-muted">{g.tong}</p>}
        {bang("Theo khu vực", g.khuVuc)}
        {bang("Theo dự án", g.duAn)}
        <Link href={g.veTinh.href} className="mt-4 inline-block text-[15px] font-medium text-cvr-ink underline underline-offset-4">{g.veTinh.nhan}</Link>
      </div>
    </section>
  );
}

export function hoiDapPseo(dk: DieuKien, tin: Listing[]): { q: string; a: string }[] {
  if (tin.length < 3) return [];
  const thue = dk.muc === "thue";
  // CÂU HỎI THEO LỜI NGƯỜI MUA (chủ dự án 21/10/2026: bỏ kiểu ghép máy móc; bỏ hẳn câu "khu vực nào nhiều tin").
  const { mon, noi } = monNoi(dk);
  const ds: { q: string; a: string }[] = [];
  // ① Khuôn Batdongsan Google đang lấy làm mô tả (24/10/2026): "Giá … tháng 10/2026?" — bán theo m², thuê theo tháng
  const g = giaTheoNhom(dk, tin);
  if (g?.tong) ds.push({ q: g.hoi, a: g.tong });
  // ② Giá cả căn — câu chủ dự án duyệt 21/10/2026 (chỉ tin bán; tin thuê ① đã là giá theo tháng)
  const tien = tin.map((l) => l.priceVnd ?? 0).filter((v) => v > 0);
  if (!thue && tien.length) {
    const [a, b] = [gia(Math.min(...tien)), gia(Math.max(...tien))];
    ds.push({ q: `Giá bán ${mon} ở ${noi} khoảng bao nhiêu?`, a: `Theo thông tin mua bán trên thị trường, giá ${a === b ? a : `từ ${a} đến ${b}`}.` });
  }
  // ③ "Có những dự án nào" — câu Google gợi trong "Mọi người cũng hỏi"; ≥ 2 dự án mới hỏi
  if (g?.duAn.length) ds.push({ q: `Có những dự án ${mon} nào ở ${noi}?`, a: `${g.duAn.map((x) => `${x.ten} (${x.gia})`).join("; ")}.` });
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
