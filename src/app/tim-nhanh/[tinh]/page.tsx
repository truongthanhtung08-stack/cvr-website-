import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { getTinXetTrang } from "@/lib/listingsDb";
import { khuVucTrongDiem, slugKhuVuc, timKhuVuc } from "@/lib/khuVuc";
import { trangIndex, tieuDe, type Muc, type TrangPseo } from "@/lib/pseo";
import { tieuDeGoogle } from "@/lib/thang";

// ============================================================================
// /tim-nhanh/<tỉnh> — TRANG TỔNG HỢP MỘT KHU VỰC (anh 21/11/2026: "cần cấu trúc web để khi index là Google đọc được nhiều trang",
// "1 trang web đọc nhiều trang"). Liệt kê MỌI trang pSEO đang mở cho Google của tỉnh (lõi loại hình, thành phố, mức giá, đặc điểm),
// Mua bán trước Cho thuê, nhóm theo loại hình; chữ liên kết = đúng tiêu đề trang đích (câu longtail). Xin index 1 trang này → Google
// đi theo liên kết tới các trang con. Chỉ đọc danh sách trang có sẵn (trangIndex — cùng cổng với sitemap), không đổi trang nào khác.
// ============================================================================

export function generateStaticParams() {
  return khuVucTrongDiem.map((t) => ({ tinh: slugKhuVuc(t) }));
}

const chuTieuDe = (ten: string) => `Tìm nhanh nhà đất ${ten}`;
const chuMoTa = (ten: string) => `Mua bán, cho thuê nhà đất ${ten} theo loại hình, mức giá và đặc điểm.`;

async function trangCuaTinh(slug: string) {
  const ds = trangIndex(await getTinXetTrang()).filter((p) => p.dk.tinh.slug === slug);
  const nhom = (muc: Muc) => {
    const m = new Map<string, TrangPseo[]>();
    for (const p of ds.filter((x) => x.dk.muc === muc)) {
      const k = p.dk.cat?.label ?? "Nhà đất";
      (m.get(k) ?? m.set(k, []).get(k)!).push(p);
    }
    // trong mỗi loại hình: trang lõi (đường ngắn nhất) trước, rồi trang nhiều tin trước
    for (const v of m.values()) v.sort((a, b) => a.path.split("/").length - b.path.split("/").length || b.n - a.n);
    // "Nhà đất" (cả tỉnh) đứng đầu, các loại hình xếp theo số trang
    return [...m.entries()].sort((a, b) => (a[0] === "Nhà đất" ? -1 : b[0] === "Nhà đất" ? 1 : b[1].length - a[1].length));
  };
  return { tong: ds.length, ban: nhom("ban"), thue: nhom("thue") };
}

export async function generateMetadata({ params }: { params: Promise<{ tinh: string }> }): Promise<Metadata> {
  const { tinh } = await params;
  const kv = timKhuVuc(tinh);
  if (!kv) return { title: "Không tìm thấy", robots: { index: false, follow: true } };
  const { tong } = await trangCuaTinh(kv.slug);
  const path = `/tim-nhanh/${kv.slug}`;
  return {
    title: tieuDeGoogle(chuTieuDe(kv.name)),
    description: chuMoTa(kv.name),
    alternates: { canonical: path },
    openGraph: { title: chuTieuDe(kv.name), description: chuMoTa(kv.name), url: path, type: "website" },
    ...(tong ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function TimNhanhTinh({ params }: { params: Promise<{ tinh: string }> }) {
  const { tinh } = await params;
  const kv = timKhuVuc(tinh);
  if (!kv) notFound();
  const { tong, ban, thue } = await trangCuaTinh(kv.slug);
  if (!tong) notFound();
  const Khoi = ({ ten, nhom }: { ten: string; nhom: [string, TrangPseo[]][] }) =>
    nhom.length ? (
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-cvr-ink">{ten}</h2>
        <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {nhom.map(([loai, ds]) => (
            <div key={loai}>
              <h3 className="text-[15px] font-semibold text-cvr-ink">{loai}</h3>
              <ul className="mt-2 space-y-1.5">
                {ds.map((p) => (
                  <li key={p.path}>
                    <Link href={p.path} className="text-[15px] text-cvr-body hover:text-cvr-ink hover:underline">{tieuDe(p.dk)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    ) : null;
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <BreadcrumbJsonLd items={[{ name: kv.name, href: `/mua-ban/${kv.slug}` }, { name: "Tìm nhanh", href: `/tim-nhanh/${kv.slug}` }]} />
        <div className="mx-auto max-w-7xl px-4 pb-footer pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{chuTieuDe(kv.name)}</h1>
          <p className="mt-2 max-w-[980px] text-[15px] leading-relaxed text-cvr-muted">{chuMoTa(kv.name)}</p>
          <Khoi ten="Mua bán" nhom={ban} />
          <Khoi ten="Cho thuê" nhom={thue} />
        </div>
      </main>
      <Footer />
    </>
  );
}
