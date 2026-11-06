import { NextResponse } from "next/server";
import { getListingDetail } from "@/lib/listingsDb";
import { getChiSoGia } from "@/lib/siteContent";
import { laTinThue, mauSoCuaLoaiHinh } from "@/lib/listingSpec";
import { chiSoChoTin, coDuLichSuGia, giaChoLichSu, khoCuaMinh, luiMotNam, soKyLienMach, soNhapHopLe, tenPhamVi, vndM2 } from "@/lib/chiSoGia";
import { corsMiniApp } from "@/lib/goiTuMiniApp";

// ============================================================================
// LỊCH SỬ GIÁ CỦA MỘT TIN CHO ZALO MINI APP (06/11/2026 — "dữ liệu lịch sử giá đâu").
// CÙNG SỐ với khối Lịch sử giá trang tin web: chép đúng dayTheoMuc trong src/app/bat-dong-san/[id]/page.tsx (kho tự tính +
// số Cowork nhập, bộ chọn 4 bậc chiSoChoTin). Sửa luật ở trang tin thì sửa cả ở đây.
// GET ?id=<mã tin> → { macDinh, ban, thue } mỗi mục đích: tieuDe · co (đủ số để vẽ) · moc (1 năm liền mạch gần nhất) · số tóm tắt.
// Chi phí: đọc từ bộ nhớ đệm sẵn có của web; CDN giữ kết quả 1 giờ → mỗi tin vài lượt chạy hàm mỗi giờ.
// ============================================================================
const DEM = { "Cache-Control": "public, max-age=300", "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export function OPTIONS(req: Request) {
  const h = corsMiniApp(req);
  if (h["Access-Control-Allow-Methods"]) h["Access-Control-Allow-Methods"] = "GET, OPTIONS";
  return new NextResponse(null, { status: 204, headers: h });
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const d = id ? await getListingDetail(id) : null;
  if (!d) return NextResponse.json({ ok: false }, { status: 404, headers: corsMiniApp(req) });
  const l = d.listing;
  const nhapTay = await getChiSoGia();
  const mucTin: "ban" | "thue" = laTinThue(l.purpose) ? "thue" : "ban";
  const tenLoai = l.type.split(" / ")[0].toLowerCase();
  const san = mauSoCuaLoaiHinh(l.type) === "san";
  const giaTin = giaChoLichSu(l);

  const dayTheoMuc = async (muc: "ban" | "thue") => {
    const items = [...(await khoCuaMinh(l.diaGioi?.province ?? "", l.type, muc)), ...soNhapHopLe(nhapTay?.items)];
    const chiSo = chiSoChoTin({ ...l, purpose: muc }, { items }, { duAn: d.projectName, diaChi: d.addressDetail, giaTin: muc === mucTin ? giaTin : null });
    const noi = chiSo?.duAn && chiSo.duAn === l.projectSlug && d.projectName ? d.projectName : chiSo ? tenPhamVi(chiSo) : "";
    const tieuDe = `Lịch sử giá ${muc === "thue" ? "thuê" : "bán"} ${tenLoai} tại ${noi || d.projectName || l.location}`;
    if (!coDuLichSuGia(chiSo)) return { tieuDe, co: false };
    // Số tóm tắt — cùng cách tính khối KhoiGia (src/components/PriceHistory.tsx), mốc 1 năm.
    const laThue = muc === "thue";
    const tong = laThue && !chiSo!.mauSo;
    const gia = (v: number) => tong
      ? `${v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(".0", "").replace(".", ",")} triệu` : `${Math.round(v / 1000).toLocaleString("vi-VN")} nghìn`}/tháng`
      : vndM2(v).replace("/m²", san ? "/m² sàn" : "/m²") + (laThue ? "/tháng" : "");
    const caDay = chiSo!.moc.filter((m) => m.giaM2 > 0);
    const theoThang = /^\d{4}-\d{2}$/.test(caDay[caDay.length - 1].quy);
    const moiNam = theoThang ? 12 : 4;
    const moc = caDay.slice(-Math.min(soKyLienMach(chiSo), moiNam + 1));
    const cuoi = moc[moc.length - 1];
    const namTruoc = caDay.find((m) => m.quy === luiMotNam(cuoi.quy));
    const nhan = (q: string) => {
      const t = q.match(/^(\d{4})-(\d{2})$/);
      if (t) return `T${Number(t[2])}/${t[1].slice(2)}`;
      const k = q.match(/^(\d{4})-?Q([1-4])$/i);
      return k ? `Q${k[2]}/${k[1].slice(2)}` : q;
    };
    return {
      tieuDe,
      co: true,
      moc: moc.map((m) => ({ nhan: nhan(m.quy), giaM2: m.giaM2, gia: gia(m.giaM2) })),
      doiMotNam: namTruoc ? ((cuoi.giaM2 - namTruoc.giaM2) / namTruoc.giaM2) * 100 : null,
      giaTin: muc === mucTin && giaTin ? gia(giaTin) : null,
    };
  };
  const [ban, thue] = await Promise.all([dayTheoMuc("ban"), dayTheoMuc("thue")]);
  return NextResponse.json({ ok: true, macDinh: mucTin, ban, thue }, { headers: { ...corsMiniApp(req), ...DEM } });
}
