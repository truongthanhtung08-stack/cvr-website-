import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import ChuyenGiaCard from "@/components/ChuyenGiaCard";
import { getChuyenGia, getChuyenGiaTheoSlug } from "@/lib/chuyenGiaDb";
import { getListings } from "@/lib/listingsDb";

// ============================================================================
// HỒ SƠ MỘT CHUYÊN GIA — tên · liên hệ (qua cổng số) · toàn bộ tin đang đăng.
// Dữ liệu gom từ tin thật, không có bảng hồ sơ riêng và không có chỉ số bịa.
// ============================================================================

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ds = await getChuyenGia();
  const cg = ds.find((x) => x.slug === slug);
  if (!cg) return { title: "Không tìm thấy chuyên gia" };
  const kv = cg.khuVuc.join(", ");
  return {
    alternates: { canonical: `/chuyen-gia/${slug}` },
    title: `${cg.ten} — ${cg.soTin} tin bất động sản${kv ? ` tại ${kv}` : ""}`,
    description: `Xem ${cg.soTin} tin bất động sản đang đăng của ${cg.ten}${kv ? ` tại ${kv}` : ""} trên Coastal Land. Liên hệ trực tiếp người đăng.`,
  };
}

export default async function HoSoChuyenGiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tatCa = await getListings();
  const kq = await getChuyenGiaTheoSlug(slug, tatCa);
  if (!kq) notFound();
  const { cg, tin } = kq;

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-footer sm:px-6 lg:px-8">
          <Link href="/chuyen-gia" className="text-sm font-medium text-cvr-muted transition hover:text-cvr-ink">
            ← Danh bạ chuyên gia
          </Link>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            {/* Khối liên hệ — dính theo cuộn trên máy tính để lúc nào cũng gọi được */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ChuyenGiaCard cg={cg} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
                Tin đang đăng của {cg.ten}
              </h1>
              <p className="mt-1.5 text-sm text-cvr-muted">
                {tin.length > 0 ? cg.khuVuc.join(" · ") : "Hiện chưa có tin nào đang hiển thị."}
              </p>

              {tin.length > 0 && (
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {tin.map((l) => <PropertyCard key={l.id} item={l} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
