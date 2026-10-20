import { NextResponse } from "next/server";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { goiNheTin } from "@/lib/goiNhe";
import { emptyFilters, type Filters, type SortKey } from "@/lib/filters";
import { locDanhSach, diemTuTin } from "@/lib/locDanhSach";

// ============================================================================
// LỌC DANH SÁCH Ở MÁY CHỦ — chỉ gửi trang đang xem (#1b kế hoạch SEO, 17/10/2026)
// ----------------------------------------------------------------------------
// Trình duyệt gửi bộ lọc + sắp xếp + số trang → nhận 10 tin của trang đó, không tải cả kho.
// Dữ liệu tin lấy từ bộ nhớ đệm "listings" (1 giờ + xoá khi tin đổi thật) nên mỗi lần lọc
// không đọc lại Supabase. Chi phí (đã tính trước khi làm): ~30 ms CPU/lần lọc —
// 100.000 lượt lọc/tháng dưới 5.000 đ, nằm trong gói Vercel $20.
// ============================================================================

type YeuCau = {
  boLoc?: Partial<Filters>;
  sapXep?: SortKey;
  trang?: number;
  /** Khối "Tin tương tự": chỉ giữ đúng các tin này, đúng thứ tự máy chủ trang tin đã xếp */
  chiId?: string[];
  /** Trang chủ "Xem thêm": bỏ các tin đã hiện ở khối trên */
  boQuaId?: string[];
  /** Chế độ bản đồ: kèm điểm của MỌI tin khớp (bản nhẹ) */
  banDo?: boolean;
  /** Lần nạp đầu: kèm dữ liệu cho câu gợi ý trong ô tìm */
  goiY?: boolean;
};

const TOI_DA_GOI_Y = 300;

export async function POST(req: Request, { params }: { params: Promise<{ muc: string }> }) {
  const { muc } = await params;
  if (muc !== "ban" && muc !== "thue") return NextResponse.json({ loi: "muc" }, { status: 404 });
  const yc = (await req.json().catch(() => ({}))) as YeuCau;

  const [tatCa, hetHan] = await Promise.all([getListings(), getListingsHetHan()]);
  let tin = tatCa.filter((l) => ((l.purpose ?? "ban") === "thue" ? "thue" : "ban") === muc);
  if (yc.boQuaId?.length) {
    const bo = new Set(yc.boQuaId);
    tin = tin.filter((l) => !bo.has(l.id));
  }
  if (yc.chiId) {
    const theoId = new Map(tin.map((l) => [l.id, l]));
    tin = yc.chiId.map((id) => theoId.get(id)).filter((l): l is (typeof tin)[number] => Boolean(l));
  }

  const boLoc: Filters = { ...emptyFilters(), ...(yc.boLoc ?? {}) };
  const kq = locDanhSach(tin, hetHan, muc, boLoc, yc.sapXep ?? "moi", yc.trang ?? 1);

  return NextResponse.json({
    trang: goiNheTin(kq.trang),
    tong: kq.tong,
    soTrang: kq.soTrang,
    trangHienTai: kq.trangHienTai,
    tangDau: kq.tangDau,
    boiDam: kq.boiDam,
    tangTheoId: kq.tangTheoId,
    khuVuc: kq.khuVuc,
    // tỉnh máy hiểu từ câu gõ — trang cần để ghi đúng dòng "Gợi ý khác tại …" (thiếu thì tin đúng nơi khách tìm
    // bị ghi nhầm "Gợi ý ở địa phương khác" — lỗi 17/10/2026)
    tinhHieu: kq.tinhHieu,
    khoangRe: kq.khoangRe, // khách tìm "giá rẻ": khoảng giá của riêng phân khúc rẻ
    thongBao: kq.thongBao, // không có tin đúng nhu cầu: câu nói rõ
    ...(yc.banDo ? { diem: kq.ketQua.filter((l) => !l.banSao).map(diemTuTin) } : {}),
    ...(yc.goiY
      ? { goiY: tin.slice(0, TOI_DA_GOI_Y).map((l) => ({ purpose: l.purpose, type: l.type, location: l.location, badge: l.badge, price: l.price })) }
      : {}),
  });
}
