import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { agencies } from "@/lib/experts";
import ExpertsBrowser from "@/components/ExpertsBrowser";
import { getChuyenGia, getCongTy, type CongTy } from "@/lib/chuyenGiaDb";

// Google chỉ lập chỉ mục khi có ít nhất một doanh nghiệp đủ hồ sơ pháp nhân (MST, địa chỉ, giới thiệu) và đồng ý
// cho đăng — chủ dự án 15/10/2026: "không đạt thì không index"; hồ sơ điền ở Admin → Khách hàng → Doanh nghiệp (23/10).
export async function generateMetadata(): Promise<Metadata> {
  const coHoSo = (await getCongTy()).length > 0;
  return {
    alternates: { canonical: "/chuyen-gia/cong-ty" },
    title: "Sàn giao dịch & công ty bất động sản",
    description: "Danh sách sàn giao dịch và công ty bất động sản đối tác của Coastal Land.",
    robots: { index: coHoSo, follow: true },
  };
}

// Dữ liệu Organization cho Google — chỉ trường có thật trong hồ sơ, không SĐT (cổng lead, xem chuyenGiaDb.ts).
function jsonLd(ds: CongTy[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ds.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Organization",
        name: c.ten,
        legalName: c.tenPhapNhan,
        taxID: c.mst,
        address: { "@type": "PostalAddress", streetAddress: c.diaChi, addressCountry: "VN" },
        description: c.gioiThieu,
        ...(c.email ? { email: c.email } : {}),
        ...(c.website ? { url: c.website } : {}),
        ...(c.logo ? { logo: c.logo } : {}),
        ...(c.mangXaHoi.length ? { sameAs: c.mangXaHoi } : {}),
      },
    })),
  };
}

export default async function CongTyPage() {
  // Sàn / công ty lấy từ TIN THẬT (tên người đăng là tên doanh nghiệp) — src/lib/chuyenGiaDb.ts
  const congTy = (await getChuyenGia()).filter((cg) => cg.laCongTy);
  const coHoSo = await getCongTy();
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-footer sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Sàn giao dịch & công ty BĐS</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-cvr-muted">Các sàn giao dịch, công ty bất động sản đối tác của Coastal Land.</p>

          {/* Chưa có sàn/công ty đối tác thật nào → nói rõ đang cập nhật. Trước đây
              chỗ này liệt kê 4 công ty bịa kèm số chuyên gia và năm thành lập tự
              nghĩ ra, trong đó có 2 "chi nhánh Coastal Land" không tồn tại.
              Lý do đầy đủ: src/lib/experts.ts */}
          {coHoSo.length > 0 && (
            <>
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(coHoSo)) }} />
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {coHoSo.map((c) => (
                  <div key={c.mst} className="flex gap-4 rounded-none border border-cvr-line bg-white p-5">
                    {c.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo} alt={c.ten} loading="lazy" className="h-14 w-14 shrink-0 object-contain" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-cvr-ink">{c.ten}</h2>
                      <p className="mt-0.5 text-xs text-cvr-muted">{c.tenPhapNhan} · Mã số doanh nghiệp {c.mst}</p>
                      <p className="mt-0.5 text-xs text-cvr-muted">{c.diaChi}</p>
                      <p className="mt-2 text-sm leading-relaxed text-cvr-body">{c.gioiThieu}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {c.hoSo && <Link href={`/chuyen-gia/${c.hoSo.slug}`} className="font-medium text-cvr-blue-ink">Xem {c.hoSo.soTin} bất động sản</Link>}
                        {c.website && <a href={c.website} target="_blank" rel="noopener nofollow" className="text-cvr-blue-ink">Website</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {congTy.length > 0 && <ExpertsBrowser ds={congTy} />}

          {agencies.length === 0 && congTy.length === 0 && (
            <div className="mt-6 rounded-none border border-cvr-line bg-cvr-surface px-6 py-12 text-center">
              <p className="text-[15px] font-semibold text-cvr-ink">
                Sàn giao dịch, công ty bất động sản
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cvr-muted">
                Hợp tác cùng Coastal Land để tiếp cận khách hàng.
              </p>
              <Link
                href="/chuyen-gia/dang-ky"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-cvr-ink px-5 text-sm font-semibold text-white transition hover:bg-cvr-body"
              >
                Đăng ký hợp tác
              </Link>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {agencies.map((a) => {
              const initials = a.name.replace(/^Sàn |^Coastal Land.*/, "S").trim().split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
              return (
                <div key={a.slug} className="shadow-lux flex items-center gap-4 rounded-none border border-cvr-line bg-white p-5 transition hover:-translate-y-1 hover:border-cvr-blue/40">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-cvr-ink text-lg font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-cvr-ink">{a.name}</h3>
                    <p className="mt-0.5 text-xs text-cvr-muted">{a.address} · Từ {a.established}</p>
                    <p className="mt-1 text-xs font-medium text-cvr-gold-ink">{a.agents} chuyên gia · {a.city}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
