import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { GiaTheoNhomPseo } from "@/components/HoiDapPseo";
import { getTinXetTrang } from "@/lib/listingsDb";
import { khuVucTrongDiem, slugKhuVuc, timKhuVuc } from "@/lib/khuVuc";
import { baoCaoThiTruong } from "@/lib/baoCaoThiTruong";
import { tieuDeGoogle } from "@/lib/thang";
import { homNayVn } from "@/lib/gioVn";

// ============================================================================
// /bao-cao-thi-truong/<tỉnh> — "Báo cáo thị trường bất động sản Đà Nẵng tháng 11/2026" (anh 12/11/2026, form chuẩn Coastal Land).
// Số liệu + cổng: src/lib/baoCaoThiTruong.ts (dựng trên trang Giá nhà đất). Tỉnh chưa đủ số (< 2 phân khúc có giá) → xem được, noindex.
// ============================================================================

export function generateStaticParams() {
  return khuVucTrongDiem.map((t) => ({ tinh: slugKhuVuc(t) }));
}

export async function generateMetadata({ params }: { params: Promise<{ tinh: string }> }): Promise<Metadata> {
  const { tinh } = await params;
  const kv = timKhuVuc(tinh);
  if (!kv) return { title: "Không tìm thấy", robots: { index: false, follow: true } };
  const b = baoCaoThiTruong(kv, await getTinXetTrang());
  const path = `/bao-cao-thi-truong/${kv.slug}`;
  const moTa = `${b.tieuDe}: ${b.soBan} tin chào bán, ${b.soThue} tin cho thuê; giá chào theo loại hình và khu vực, tổng hợp từ tin đăng trên Coastal Land.`;
  return {
    title: tieuDeGoogle(b.tieuDe),
    description: moTa,
    alternates: { canonical: path },
    openGraph: { title: b.tieuDe, description: moTa, url: path, type: "article" },
    ...(b.index ? {} : { robots: { index: false, follow: true } }),
  };
}

const ngayVn = (iso: string) => iso.split("-").reverse().join("/");

export default async function BaoCaoTinh({ params }: { params: Promise<{ tinh: string }> }) {
  const { tinh } = await params;
  const kv = timKhuVuc(tinh);
  if (!kv) notFound();
  const b = baoCaoThiTruong(kv, await getTinXetTrang());
  if (!b.ban.length && !b.thue.length) notFound();
  const ngay = ngayVn(homNayVn());
  const H2 = "text-[20px] font-semibold tracking-tight text-cvr-ink sm:text-[22px]";
  const SEC = "mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <BreadcrumbJsonLd items={[{ name: "Báo cáo thị trường BĐS", href: "/tien-ich/bao-cao-thi-truong-bds" }, { name: kv.name, href: `/bao-cao-thi-truong/${kv.slug}` }]} />
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{b.tieuDe}</h1>
          <p className="mt-2 max-w-[980px] text-[15px] leading-relaxed text-cvr-muted">
            {b.tenCu.length > 0 && <>Khu vực gồm {b.tenCu.join(", ")} cũ · </>}Số liệu đến ngày {ngay}
          </p>
        </div>

        {/* 1. Tổng quan */}
        <section className={SEC}>
          <h2 className={H2}>Tổng quan</h2>
          <div className="mt-4 grid max-w-[980px] grid-cols-3 gap-3">
            {[["Tin chào bán", b.soBan], ["Tin cho thuê", b.soThue], ["Tin mới trong tháng", b.soMoi]].map(([t, n]) => (
              <div key={t as string} className="rounded-2xl border border-cvr-line p-4">
                <div className="text-[24px] font-semibold tabular-nums text-cvr-ink">{(n as number).toLocaleString("vi-VN")}</div>
                <div className="mt-0.5 text-[13px] text-cvr-muted">{t}</div>
              </div>
            ))}
          </div>
          {b.tongQuan.length > 0 && (
            <div className="mt-5 max-w-[980px] overflow-x-auto">
              <table className="w-full min-w-[560px] text-[14px]">
                <thead>
                  <tr className="border-b border-cvr-line text-left text-[13px] text-cvr-muted">
                    <th className="py-2 pr-3 font-medium">Loại hình</th><th className="py-2 pr-3 text-right font-medium">Số tin</th>
                    <th className="py-2 pr-3 font-medium">Khoảng giá chào</th><th className="py-2 font-medium">Khu vực nhiều tin</th>
                  </tr>
                </thead>
                <tbody>
                  {b.tongQuan.map((d) => (
                    <tr key={d.muc + d.ten} className="border-b border-cvr-line/60 align-top">
                      <td className="py-2 pr-3 text-cvr-ink">{d.muc === "thue" ? `Thuê ${d.ten.toLowerCase()}` : d.ten}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{d.so}</td>
                      <td className="py-2 pr-3">{d.khoang}</td>
                      <td className="py-2 text-cvr-body">{d.khuNhieu.map((k) => `${k.ten} ${k.so}`).join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 2. Mua bán theo phân khúc · 3. Cho thuê — cùng khối giá theo khu vực của trang Giá nhà đất */}
        {b.ban.length > 0 && <div className={SEC}><h2 className={H2}>Thị trường mua bán</h2></div>}
        {b.ban.map((x) => <GiaTheoNhomPseo key={`ban-${x.dk.cat!.slug}`} g={x.g} lienKet={x.lienKet} id={`ban-${x.dk.cat!.slug}`} />)}
        {b.thue.length > 0 && <div className={SEC}><h2 className={H2}>Thị trường cho thuê</h2></div>}
        {b.thue.map((x) => <GiaTheoNhomPseo key={`thue-${x.dk.cat!.slug}`} g={x.g} lienKet={x.lienKet} id={`thue-${x.dk.cat!.slug}`} />)}

        {/* 4. Kết luận theo số */}
        {b.ketLuan.length > 0 && (
          <section className={SEC}>
            <h2 className={H2}>Kết luận</h2>
            <ul className="mt-3 max-w-[980px] space-y-2 text-[15px] leading-relaxed text-cvr-body">
              {b.ketLuan.map((k) => <li key={k} className="flex gap-2.5"><span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cvr-ink" />{k}</li>)}
            </ul>
          </section>
        )}

        {/* Ghi nguồn + lối đi tiếp */}
        <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
          <p className="max-w-[980px] text-[13px] leading-relaxed text-cvr-muted">
            Số liệu tổng hợp từ tin đăng trên coastalland.vn đến ngày {ngay}; giá là giá chào, không phải giá giao dịch.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[15px] font-medium">
            <Link href={`/mua-ban/${kv.slug}`} className="text-cvr-ink underline underline-offset-4">Nhà đất bán {kv.name}</Link>
            <Link href={`/cho-thue/${kv.slug}`} className="text-cvr-ink underline underline-offset-4">Nhà đất cho thuê {kv.name}</Link>
            <Link href={`/gia-nha-dat/${kv.slug}`} className="text-cvr-ink underline underline-offset-4">Giá nhà đất {kv.name}</Link>
            <Link href="/tien-ich/gia-nha-dat" className="text-cvr-ink underline underline-offset-4">Giá đất Nhà nước</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
