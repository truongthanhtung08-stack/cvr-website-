import { getTinXetTrang } from "@/lib/listingsDb";
import { tieuDe, trangIndex, type Muc } from "@/lib/pseo";
import TabTimKiemPhoBien, { type TabLienKet } from "@/components/TabTimKiemPhoBien";

// KHỐI "TÌM KIẾM PHỔ BIẾN" — kế hoạch Airbnb giai đoạn A (docs/KE-HOACH-AIRBNB.md, 16/10/2026).
// Học khối "Gợi ý cho chuyến đi" cuối trang Airbnb: tab theo loại hình, mỗi tab một lưới link tới
// trang khu vực. Chỉ link tới trang ĐÃ QUA CỔNG CHẤT LƯỢNG (trangIndex — ≥ 3 tin đạt chuẩn), chữ link
// chính là từ khoá người tìm gõ. Mọi tab nằm sẵn trong HTML máy chủ để Google đọc được.
export default async function TimKiemPhoBien({ muc, trangChu }: { muc?: Muc; trangChu?: boolean }) {
  const tin = await getTinXetTrang(); // cổng đếm cả tin hết hạn (29/10/2026)
  const theoNhom = new Map<string, { href: string; nhan: string; n: number }[]>();
  for (const p of trangIndex(tin)) {
    if ((muc && p.dk.muc !== muc) || !p.dk.cat) continue;
    const ten = p.dk.cat.tuKhoa ?? p.dk.cat.h1;
    (theoNhom.get(ten) ?? theoNhom.set(ten, []).get(ten)!).push({ href: p.path, nhan: tieuDe(p.dk), n: p.n });
  }
  const tabs: TabLienKet[] = [...theoNhom.entries()]
    .map(([ten, ds]) => ({ ten, tong: ds.reduce((a, x) => a + x.n, 0), links: ds.sort((a, b) => b.n - a.n).slice(0, 24).map(({ href, nhan }) => ({ href, nhan })) }))
    .sort((a, b) => b.tong - a.tong)
    .map(({ ten, links }) => ({ ten, links }));
  if (tabs.length === 0) return null;
  return <TabTimKiemPhoBien tabs={tabs} trangChu={trangChu} />;
}
