import Link from "next/link";
import type { NhomLienKet } from "@/lib/pseo";

// Khối liên kết nội bộ của hệ pSEO (Template 1 — "Contextual internal linking hub").
// Chỉ liệt kê trang ĐÃ QUA CỔNG CHẤT LƯỢNG (src/lib/pseo.ts) — không dẫn khách vào trang thưa tin.
// Cùng kiểu thẻ với KhuVucLinks để giao diện đồng bộ.
export default function LienKetPseo({ nhom }: { nhom: NhomLienKet[] }) {
  if (nhom.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="space-y-5 rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        {nhom.map((g) => (
          <div key={g.tieuDe}>
            <h2 className="text-base font-semibold tracking-tight text-cvr-ink sm:text-lg">{g.tieuDe}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center rounded-full border border-cvr-line bg-cvr-surface px-3.5 py-1.5 text-sm text-cvr-ink transition hover:border-cvr-blue hover:text-cvr-blue-ink"
                >
                  {l.nhan}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
