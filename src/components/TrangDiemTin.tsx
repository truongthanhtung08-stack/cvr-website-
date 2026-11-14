import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import BaoCaoThiTruong from "@/components/BaoCaoThiTruong";
import { getBaoCaoThiTruong, getChiSoGia } from "@/lib/siteContent";
import { soNhapHopLe } from "@/lib/chiSoGia";
import { VUNG_BAO_CAO, soLieuVung, quyVuaXong } from "@/lib/baoCaoThiTruong";

// ĐIỂM TIN THỊ TRƯỜNG = MENU RIÊNG (anh 14/11/2026: "đây là 1 menu riêng", "link phải đúng theo cấu trúc Menu"):
//   /diem-tin-thi-truong            → báo cáo, mở khu vực đủ số đầu tiên
//   /diem-tin-thi-truong/<khu vực>  → mở đúng khu vực (da-nang · quy-nhon · nha-trang) — cùng mục con trong menu
// Link cũ /tien-ich/bao-cao-thi-truong-bds chuyển 301 về đây (next.config.ts). Số = bảng Cowork lọc, nạp ở Admin → Điểm tin thị trường.

// Số của 3 khu vực — dùng chung cho trang + sitemap (khu vực chưa đủ số: không có trang, không vào sitemap)
export async function soVungDiemTin() {
  return (await duLieuDiemTin()).soVung;
}
async function duLieuDiemTin() {
  const baoCao = await getBaoCaoThiTruong();
  // Giá thứ cấp của báo cáo lấy từ Lịch sử giá đã có trên web (anh 13/11/2026)
  const lichSu = soNhapHopLe((await getChiSoGia())?.items);
  const soVungDu = VUNG_BAO_CAO.map((v) => soLieuVung(v, baoCao, baoCao?.quyBaoCao || quyVuaXong(), lichSu));
  // Nguồn trên trang = Coastal Land (anh 14/11/2026) — bỏ ô nguon / link của từng dòng trước khi gửi xuống trình duyệt (không lộ trong mã trang)
  const soVung: typeof soVungDu = JSON.parse(JSON.stringify(soVungDu, (k, v) => (k === "nguon" || k === "link" ? undefined : v)));
  return { soVung, capNhat: baoCao?.capNhat ?? "" };
}

export default async function TrangDiemTin({ vung }: { vung?: string }) {
  const { soVung, capNhat } = await duLieuDiemTin();
  const kv = VUNG_BAO_CAO.find((v) => v.id === vung);
  if (vung && !kv) notFound();
  // Khu vực chưa đủ số (menu vẫn có mục con): trang báo đang cập nhật, không index (generateMetadata) — không mượn số khu vực khác
  const chuaCo = kv && !soVung.some((x) => x.vung.id === kv.id && x.du);
  return (
    <>
      {/* Google đọc báo cáo (anh 14/11/2026: "số liệu báo cáo đã có, làm luôn cho Google đọc"): Article của MỘT tổ chức #to-chuc */}
      {!chuaCo && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "Article",
          headline: `Điểm tin thị trường ${(kv ?? VUNG_BAO_CAO.find((v) => soVung.some((x) => x.vung.id === v.id && x.du)) ?? VUNG_BAO_CAO[0]).ten}`,
          inLanguage: "vi-VN", ...(capNhat ? { dateModified: capNhat } : {}),
          mainEntityOfPage: `https://coastalland.vn/diem-tin-thi-truong${kv ? `/${kv.id}` : ""}`,
          author: { "@id": "https://coastalland.vn/#to-chuc" }, publisher: { "@id": "https://coastalland.vn/#to-chuc" },
          about: "Thị trường bất động sản",
        }) }} />
      )}
      <BreadcrumbJsonLd items={[{ name: "Điểm tin thị trường", href: "/diem-tin-thi-truong" }, ...(kv ? [{ name: kv.nut, href: `/diem-tin-thi-truong/${kv.id}` }] : [])]} />
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-footer sm:px-6 lg:px-8">
          {chuaCo ? (
            <>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-cvr-ink sm:text-[32px]">Điểm tin thị trường {kv.ten}</h1>
              <p className="mt-3 text-base text-cvr-muted">Báo cáo đang được cập nhật.</p>
            </>
          ) : (
            <BaoCaoThiTruong vung={soVung} vungDau={kv?.id} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
