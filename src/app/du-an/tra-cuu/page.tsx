import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import TraCuuDuAn from "@/components/TraCuuDuAn";
import { getProjects } from "@/lib/contentDb";
import { getListings } from "@/lib/listingsDb";
import { dongTraCuu } from "@/lib/traCuuDuAn";

// TRA CỨU DỰ ÁN (chủ dự án 29/10/2026) — mục con menu Dự án, bên cạnh Dự án nổi bật (/du-an).
// Danh bạ chữ mọi dự án: có hồ sơ (kể cả hồ sơ cơ bản chưa ảnh) + dự án khách chọn khi đăng tin. Dùng chung bản đệm
// getProjects / getListings với trang dự án — không thêm truy vấn mới.
export const metadata: Metadata = {
  alternates: { canonical: "/du-an/tra-cuu" },
  title: "Tra cứu dự án",
  description: "Tra cứu dự án bất động sản: tên dự án, chủ đầu tư, loại hình, địa chỉ.",
};

export default async function TraCuuDuAnPage() {
  const [projects, listings] = await Promise.all([getProjects(), getListings()]);
  const ds = dongTraCuu(listings, projects);
  const duongDan = [{ name: "Dự án", href: "/du-an" }, { name: "Tra cứu dự án", href: "/du-an/tra-cuu" }];
  return (
    <>
      <BreadcrumbJsonLd items={duongDan} />
      <Header />
      <main className="flex-1 bg-white">
        <Breadcrumb items={duongDan} />
        <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
          <h1 className="mb-4 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tra cứu dự án</h1>
          <TraCuuDuAn ds={ds} />
        </div>
      </main>
      <Footer />
    </>
  );
}
