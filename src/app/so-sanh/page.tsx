"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { asset } from "@/lib/asset";
import { listingSummary, type Listing } from "@/lib/data";
import { tierFromBadge, getTier } from "@/lib/packages";
import { useCompare } from "@/lib/useCompare";
import { useListingsByIds } from "@/lib/useListingsByIds";

// Trang SO SÁNH bất động sản (III.2) — bảng song song thông số.
export default function ComparePage() {
  const { ids, ready, remove, clear } = useCompare();
  // Tin THẬT lấy từ Supabase theo id đang so sánh (id lưu trong máy).
  const { items, loading } = useListingsByIds(ids);

  const rows: { label: string; get: (l: Listing) => string }[] = [
    { label: "Mức giá", get: (l) => l.price },
    { label: "Diện tích", get: (l) => l.area },
    { label: "Giá / m²", get: (l) => l.pricePerM2 ?? "—" },
    { label: "Phòng ngủ", get: (l) => (l.beds ? `${l.beds}` : "—") },
    { label: "Phòng tắm", get: (l) => (l.baths ? `${l.baths}` : "—") },
    { label: "Loại hình", get: (l) => l.type },
    { label: "Nhu cầu", get: (l) => ((l.purpose ?? "ban") === "thue" ? "Cho thuê" : "Mua bán") },
    { label: "Khu vực", get: (l) => l.location },
    { label: "Mô tả", get: (l) => l.desc?.trim() || listingSummary(l) },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">So sánh bất động sản</h1>
            {ids.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
              >
                Xoá tất cả
              </button>
            )}
          </div>

          {!ready || loading ? (
            <p className="py-20 text-center text-sm text-cvr-muted">Đang tải bất động sản để so sánh…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-cvr-line py-20 text-center">
              {/* Có id nhưng không tra được tin = tin đã gỡ hoặc ngừng hiển thị */}
              <p className="text-cvr-body">
                {ids.length > 0 ? "Những tin bạn chọn không còn hiển thị." : "Chưa có bất động sản nào để so sánh."}
              </p>
              <p className="mt-1 text-sm text-cvr-muted">Bấm nút so sánh trên thẻ tin để thêm (tối đa 4 tin).</p>
              <Link href="/mua-ban" className="mt-5 rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-body">
                Xem danh sách bất động sản
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className="w-32 border-b border-cvr-line p-3 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-cvr-faint">
                      Tiêu chí
                    </th>
                    {items.map((l) => {
                      const tier = l.badge ? getTier(tierFromBadge(l.badge)) : null;
                      return (
                        <th key={l.id} className="border-b border-cvr-line p-3 align-top" style={{ width: `${72 / items.length}%` }}>
                          <div className="relative">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-cvr-surface">
                              <Image src={asset(l.image)} alt={l.title} fill sizes="200px" className="object-cover" />
                              {tier && (
                                <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white" style={{ backgroundColor: tier.accent }}>
                                  {tier.short}
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label="Bỏ khỏi so sánh"
                                onClick={() => remove(l.id)}
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/80"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                            <Link href={`/bat-dong-san/${l.id}`} className="mt-2 line-clamp-2 block text-left text-sm font-semibold text-cvr-ink hover:text-cvr-blue-ink">
                              {l.title}
                            </Link>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.label} className={i % 2 ? "bg-cvr-surface/50" : ""}>
                      <td className="border-b border-cvr-line p-3 align-top text-xs font-medium text-cvr-muted">{r.label}</td>
                      {items.map((l) => (
                        <td key={l.id} className="border-b border-cvr-line p-3 align-top text-sm text-cvr-ink">
                          {r.get(l)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-3" />
                    {items.map((l) => (
                      <td key={l.id} className="p-3 align-top">
                        <Link href={`/bat-dong-san/${l.id}`} className="inline-block rounded-lg bg-cvr-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-cvr-body">
                          Xem chi tiết
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
