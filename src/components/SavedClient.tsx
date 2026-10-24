"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ListingShowcase from "@/components/ListingShowcase";
import { useHomeSection } from "@/components/HomeExpand";
import { useSaved } from "@/lib/useSaved";
import type { Listing } from "@/lib/data";

// Tin đã lưu — CÙNG CẤU TRÚC khối "Bất động sản đã xem" (chủ dự án 25/10/2026): giữ tối đa 100 mã trên máy (useSaved, lưu thêm thì
// tin lưu cũ nhất tự rơi), xếp theo lưu gần nhất trước, giữ cả tin hết hạn (nhãn "Tin hết hạn"), chỉ tin đã gỡ hẳn mới mất.
// Hiện: dải trượt 8 tin + "Xem thêm" → danh sách theo trang ĐÚNG các tin đã lưu. Dữ liệu tin THẬT từ /api/danh-sach (CDN lưu sẵn).
export default function SavedClient() {
  const { ids, ready } = useSaved();
  const khoa = [...ids].reverse().join(",");
  const [items, setItems] = useState<Listing[] | null>(null);
  // Đang mở "Xem thêm": danh sách nằm sát đầu trang như mọi danh sách mở rộng, không chừa khoảng trên
  const { expanded } = useHomeSection("tin-da-luu");

  useEffect(() => {
    if (!khoa) { setItems([]); return; }
    let huy = false;
    Promise.all(["ban", "thue"].map((m) => fetch(`/api/danh-sach/${m}`).then((r) => (r.ok ? r.json() : { tin: [] })).catch(() => ({ tin: [] }))))
      .then((ds: { tin: Listing[]; hetHan?: Listing[] }[]) => {
        if (huy) return;
        const theoId = new Map(ds.flatMap((d) => [...d.tin, ...(d.hetHan ?? []).map((l) => ({ ...l, hetHan: true }))]).map((l) => [l.id, l]));
        setItems(khoa.split(",").map((id) => theoId.get(id)).filter((l): l is Listing => Boolean(l)));
      });
    return () => { huy = true; };
  }, [khoa]);

  if (!ready || items === null) {
    return <p className="mt-8 text-sm text-cvr-muted">Đang tải tin đã lưu…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-none border border-dashed border-cvr-line py-20 text-center">
        <svg className="mb-4 h-12 w-12 text-cvr-line" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        {/* Có id đã lưu nhưng không tra được tin nào = tin đã bị gỡ hoặc ngừng hiển thị */}
        <p className="text-cvr-body">{ids.length > 0 ? "Những tin bạn lưu không còn hiển thị." : "Bạn chưa lưu tin nào."}</p>
        <p className="mt-1 text-sm text-cvr-muted">
          {ids.length > 0
            ? "Tin có thể đã được gỡ hoặc hết hạn đăng."
            : "Bấm biểu tượng trái tim ❤ trên mỗi tin để lưu lại xem sau."}
        </p>
        <Link href="/mua-ban" className="mt-5 rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          Khám phá nhà đất
        </Link>
      </div>
    );
  }

  return (
    <div className={expanded ? undefined : "mt-6"}>
      <ListingShowcase items={items} sectionKey="tin-da-luu" heading="Tin đã lưu" relevance khoangTren="" />
    </div>
  );
}
