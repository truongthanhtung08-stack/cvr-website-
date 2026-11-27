import Link from "next/link";
import DanhSachThuGon from "@/components/DanhSachThuGon";
import type { TuKhoaTrang } from "@/lib/pseo";

// KHỐI "TÌM KIẾM PHỔ BIẾN" (anh 27/11/2026: "câu lõi, câu longtail không đưa lên web thì Google đọc kiểu gì mà cho lên top"):
// mọi câu khách gõ / Google gợi ý của nhóm từ khoá hiện ngay trên trang tổng của nhóm. Câu đã có trang riêng (giá rẻ, gần biển, dưới X tỷ,
// phường…) là link sang trang đó; còn lại là chữ trên trang. Hiện 24 câu, phần còn lại thu gọn nhưng vẫn nằm trong HTML (Google đọc).
export default function TuKhoaPhoBien({ loi, ds }: { loi: string; ds: TuKhoaTrang[] }) {
  if (!ds.length) return null;
  const o = "inline-flex items-center rounded-full border border-cvr-line bg-cvr-surface px-3 py-1.5 text-sm text-cvr-body";
  return (
    <section aria-labelledby="tim-kiem-pho-bien" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <h2 id="tim-kiem-pho-bien" className="text-[20px] font-normal tracking-tight text-cvr-ink sm:text-[22px]">Tìm kiếm phổ biến: {loi}</h2>
      <DanhSachThuGon the="ul" anBangCss soHien={24} className="mt-4 flex flex-wrap gap-2">
        {ds.map((t) => (
          <li key={t.cau}>
            {t.href ? <Link href={t.href} className={`${o} transition hover:border-cvr-ink hover:text-cvr-ink`}>{t.cau}</Link> : <span className={o}>{t.cau}</span>}
          </li>
        ))}
      </DanhSachThuGon>
    </section>
  );
}
