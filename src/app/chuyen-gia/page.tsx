import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExpertsBrowser from "@/components/ExpertsBrowser";
import { getChuyenGia } from "@/lib/chuyenGiaDb";

export const metadata: Metadata = {
  alternates: { canonical: "/chuyen-gia" },
  title: "Danh bạ chuyên gia bất động sản",
  // Câu chủ dự án duyệt 21/10/2026 (rà web: mô tả cũ 54 ký tự, chuẩn 120–160)
  description: "Danh bạ chuyên gia: hồ sơ, khu vực hoạt động và các bất động sản đang bán, cho thuê theo hồ sơ trên trang Coastal Land.",
};

export default async function ChuyenGiaPage() {
  // Danh bạ dựng từ TIN THẬT — xem src/lib/chuyenGiaDb.ts
  // Chỉ chuyên gia CÁ NHÂN — sàn/công ty ở /chuyen-gia/cong-ty (15/10/2026)
  const ds = (await getChuyenGia()).filter((cg) => !cg.laCongTy);
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-footer sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Danh bạ chuyên gia</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-cvr-muted">Danh bạ người bán, cho thuê nhà đất trên Coastal Land.</p>
            </div>
            <div className="flex gap-2.5">
              <Link href="/chuyen-gia/cong-ty" className="rounded-lg border border-cvr-line bg-white px-4 py-2.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">Sàn & công ty</Link>
              <Link href="/chuyen-gia/dang-ky" className="rounded-lg bg-cvr-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-body">Trở thành chuyên gia</Link>
            </div>
          </div>

          <ExpertsBrowser ds={ds} />
        </div>
      </main>
      <Footer />
    </>
  );
}
