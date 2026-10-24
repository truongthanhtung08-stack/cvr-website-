"use client";

import { useState } from "react";
import Link from "next/link";
import TheTinMobile from "@/components/TheTinMobile";
import PhanTrang from "@/components/PhanTrang";
import { useSaved } from "@/lib/useSaved";
import { useListingsByIds } from "@/lib/useListingsByIds";
import { tierRank } from "@/lib/packages";
import type { Listing } from "@/lib/data";

// Tin đã lưu (24/10/2026, theo quy tắc danh sách Mua bán / Cho thuê): cùng thứ tự cả web, 10 tin mỗi trang + phân trang
// dùng chung, CÙNG THẺ danh sách (điện thoại: thẻ tràn mép, khe xám · máy tính: thẻ hàng ngang bo 12px).
const MOI_TRANG = 10;

export default function SavedClient() {
  const { ids, ready } = useSaved();
  const [trang, setTrang] = useState(1);
  // Tin THẬT lấy từ Supabase theo id đã lưu (id nằm trong máy, tin nằm trên server) — tối đa 100 mã (useSaved), một lần tra.
  const { items: tra, loading } = useListingsByIds(ids);
  // MỘT THỨ TỰ CẢ WEB (chốt 23/10/2026, docs/THE-TIN-THEO-CAP.md mục 7.2): cấp trước, cùng cấp theo mốc gần nhất (đẩy / đăng)
  const ngay = (l: Listing) => Date.parse(l.bumpedAt ?? l.postedAt ?? "") || 0;
  const tatCa = [...tra].sort((a, b) => tierRank(a.badge) - tierRank(b.badge) || ngay(b) - ngay(a));
  const tong = Math.max(1, Math.ceil(tatCa.length / MOI_TRANG));
  const hienTai = Math.min(trang, tong);
  const items = tatCa.slice((hienTai - 1) * MOI_TRANG, hienTai * MOI_TRANG);

  if (!ready || loading) {
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

  const doiTrang = (p: number) => { setTrang(p); window.scrollTo({ top: 0 }); };

  return (
    <>
      <p className="mt-4 text-sm text-cvr-body">
        <span className="font-bold text-cvr-ink">{tatCa.length}</span> tin đã lưu
      </p>
      {/* ĐIỆN THOẠI: như danh sách Mua bán — thẻ tràn 2 mép, khe xám 10px */}
      <div className="-mx-4 mt-4 grid grid-cols-1 gap-2.5 bg-[#e5e5ea] sm:hidden">
        {items.map((item, i) => <TheTinMobile key={item.id} item={item} uuTien={i === 0} />)}
      </div>
      {/* MÁY TÍNH: như danh sách Mua bán — mỗi tin một hàng, khối bo 12px nền trắng, cách 20px */}
      <div className="mt-4 hidden sm:flex sm:flex-col sm:gap-5">
        {items.map((item, i) => (
          <div key={item.id} className="overflow-hidden rounded-xl bg-white shadow-lux"><TheTinMobile item={item} pc uuTien={i === 0} /></div>
        ))}
      </div>
      {tong > 1 && <PhanTrang hienTai={hienTai} tong={tong} doiTrang={doiTrang} className="mt-10" />}
    </>
  );
}
