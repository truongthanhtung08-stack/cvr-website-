"use client";

import { useEffect, useState } from "react";
import ListingShowcase from "@/components/ListingShowcase";
import type { Listing } from "@/lib/data";
import { useRecentlyViewed } from "@/lib/useRecentlyViewed";
import { useSaved } from "@/lib/useSaved";
import { useHomeSection } from "@/components/HomeExpand";
import ListingBrowser from "@/components/ListingBrowser";

// "BẤT ĐỘNG SẢN ĐÃ XEM" (chủ dự án 23/10/2026) — CÙNG CẤU TRÚC khối "Bất động sản tương tự": dải trượt 8 tin + "Xem thêm" → danh sách
// theo trang (ListingShowcase dùng chung). Trang tin: ngay dưới BĐS tương tự · trang chủ: dưới BĐS nổi bật. Chỉ hiện khi khách có lịch sử xem.
// Mã tin đã xem lưu trên máy khách (localStorage, tối đa 100 — useRecentlyViewed). Dữ liệu tin THẬT nạp từ /api/danh-sach (CDN đã lưu sẵn,
// không tốn thêm lượt gọi máy chủ). Bỏ tin đang xem; giữ cả tin bán, thuê và tin hết hạn (nhãn "Tin hết hạn"), chỉ tin đã gỡ hẳn mới mất; thứ tự = xem gần nhất trước.
export default function RecentlyViewed({ boQua, boCac, trangChu = false, boTinDaLuu = false }: { boQua?: string; boCac?: string[]; trangChu?: boolean; boTinDaLuu?: boolean }) {
  // Trang Tin đã lưu (chủ dự án 24/10/2026): tin đã nằm ở mục Lưu phía trên thì không lặp lại ở "đã xem";
  // khách bấm tim một tin ở đây → tin tự chuyển lên mục Lưu.
  const daLuu = useSaved().ids;
  // boCac: tin đang hiện ở khối khác trên cùng trang (dải Bất động sản tương tự) → không lặp lại
  const ids = useRecentlyViewed().filter((id) => id !== boQua && !boCac?.includes(id) && !(boTinDaLuu && daLuu.includes(id)));
  const khoa = ids.join(",");
  const [items, setItems] = useState<Listing[]>([]);
  // Khối khác trên trang chủ đang mở "Xem thêm" → bỏ cả khung, không chừa khoảng trống (23/10/2026)
  const { hidden, expanded } = useHomeSection("bds-da-xem");

  useEffect(() => {
    if (!khoa) return;
    let huy = false;
    Promise.all(["ban", "thue"].map((m) => fetch(`/api/danh-sach/${m}`).then((r) => (r.ok ? r.json() : { tin: [] })).catch(() => ({ tin: [] }))))
      .then((ds: { tin: Listing[]; hetHan?: Listing[] }[]) => {
        if (huy) return;
        // Tin hết hạn VẪN giữ (thẻ mờ + nhãn "Tin hết hạn") — đã xem thì khách cần tìm lại; chỉ tin đã gỡ hẳn mới mất
        const theoId = new Map(ds.flatMap((d) => [...d.tin, ...(d.hetHan ?? []).map((l) => ({ ...l, hetHan: true }))]).map((l) => [l.id, l]));
        setItems(khoa.split(",").map((id) => theoId.get(id)).filter((l): l is Listing => Boolean(l)));
      });
    return () => { huy = true; };
  }, [khoa]);

  if (!khoa || items.length === 0 || (trangChu && hidden)) return null;
  // Trang chủ, đã bấm "Xem thêm": ĐÚNG danh sách của "Xem thêm" khối Bất động sản nổi bật (cùng khung, cùng khoảng cách)
  if (trangChu && expanded) return <section className="section-edge bg-white"><ListingBrowser heading="Mua bán, cho thuê nhà đất" trangChu purpose="ban" nguon="ban" /></section>;
  const khoi = (
    <ListingShowcase
      items={items}
      sectionKey="bds-da-xem"
      title="Bất động sản đã xem"
      heading="Bất động sản đã xem"
      relevance
      daXem
      // Trang Tin đã lưu: cách khối Tin đã lưu phía trên đúng chuẩn giữa các khối (điện thoại 24 · máy tính 56)
      khoangTren={trangChu ? "" : boTinDaLuu ? "mt-6 sm:mt-14" : undefined}
    />
  );
  // Trang chủ: CÙNG khung + khoảng cách với các khối khác (section-edge · max-w-7xl · py-3/sm:py-4); không lịch sử thì không chừa chỗ trống
  return trangChu ? <section className="section-edge bg-white"><div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">{khoi}</div></section> : khoi;
}
