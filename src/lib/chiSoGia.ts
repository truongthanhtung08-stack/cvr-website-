import type { Listing } from "@/lib/data";
import { chuanTen } from "@/lib/locations";

// ════════════════════════════════════════════════════════════════════════════
// MẶT BẰNG GIÁ KHU VỰC — HAI NGUỒN, GHI RÕ NGUỒN NÀO RA SỐ NÀO.
//
//   1. TIN TRÊN CHÍNH WEB MÌNH — tự tính, không phụ thuộc ai, chi tiết tới từng
//      phường + loại hình. Web càng nhiều tin thì càng sát.
//   2. BÁO CÁO THỊ TRƯỜNG THEO QUÝ (Batdongsan · CBRE · Savills · DKRA) — chủ
//      dự án nhập tay mỗi quý một lần trong admin, dùng làm nền xu hướng.
//
// Nguyên tắc: KHÔNG BỊA. Bản cũ lấy giá tin nhân dãy hệ số cố định nên tin nào
// cũng ra "+22%" như nhau — khách mở hai tin cạnh nhau là lộ. Nay thiếu dữ liệu
// thì không hiện, chứ không chế số.
// ════════════════════════════════════════════════════════════════════════════

/** Dưới mức này thì mẫu quá ít, nói ra không có nghĩa gì. */
export const MAU_TOI_THIEU = 5;

export type MatBangGia = {
  /** Giá trung vị mỗi m² (đồng) */
  trungVi: number;
  thap: number;
  cao: number;
  /** Số tin dùng để tính */
  soMau: number;
  /** Phạm vi đã dùng: "phường" khi đủ mẫu, nếu không thì lùi ra "tỉnh" */
  pham: "phuong" | "tinh";
  tenPham: string;
};

function giaMoiM2(l: Listing): number | null {
  // Chuỗi giá đã định dạng sẵn để hiển thị nên không tin được; dùng số thô.
  const gia = l.priceVnd;
  const dt = l.areaM2;
  if (!gia || !dt || dt <= 0) return null;
  const v = gia / dt;
  // Chặn số vô lý: dưới 1 triệu hoặc trên 1 tỷ mỗi m² là dữ liệu nhập sai.
  return v >= 1_000_000 && v <= 1_000_000_000 ? v : null;
}

function trungVi(ds: number[]): number {
  const s = [...ds].sort((a, b) => a - b);
  const g = Math.floor(s.length / 2);
  return s.length % 2 ? s[g] : Math.round((s[g - 1] + s[g]) / 2);
}

/**
 * Mặt bằng giá của khu vực, tính từ các tin ĐANG ĐĂNG cùng loại hình.
 * Đủ mẫu ở cấp phường thì lấy phường; không đủ thì lùi ra cấp tỉnh; vẫn không
 * đủ thì trả null — nơi gọi sẽ không hiện gì.
 */
export function matBangGia(
  tin: Listing,
  tatCa: Listing[],
): MatBangGia | null {
  const loai = chuanTen(tin.type);
  const phuong = chuanTen(tin.diaGioi?.ward ?? "");
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  if (!tinh) return null;

  const cungLoai = tatCa.filter(
    (x) => x.id !== tin.id && chuanTen(x.type) === loai && x.purpose === tin.purpose,
  );

  const theo = (loc: (x: Listing) => boolean) =>
    cungLoai.filter(loc).map(giaMoiM2).filter((v): v is number => v !== null);

  if (phuong) {
    const ds = theo((x) => chuanTen(x.diaGioi?.ward ?? "") === phuong);
    if (ds.length >= MAU_TOI_THIEU)
      return {
        trungVi: trungVi(ds),
        thap: Math.min(...ds),
        cao: Math.max(...ds),
        soMau: ds.length,
        pham: "phuong",
        tenPham: tin.diaGioi?.ward ?? "",
      };
  }

  const dsTinh = theo((x) => chuanTen(x.diaGioi?.province ?? "") === tinh);
  if (dsTinh.length >= MAU_TOI_THIEU)
    return {
      trungVi: trungVi(dsTinh),
      thap: Math.min(...dsTinh),
      cao: Math.max(...dsTinh),
      soMau: dsTinh.length,
      pham: "tinh",
      tenPham: tin.diaGioi?.province ?? "",
    };

  return null;
}

// ── CHỈ SỐ GIÁ THEO QUÝ (chủ dự án nhập tay từ báo cáo thị trường) ──────────
// Lưu ở site_content key "chi_so_gia". Mỗi dòng là một quý của một khu vực.

export type MocQuy = {
  /** "2025-Q1" */
  quy: string;
  /** Giá trung bình mỗi m² (đồng) theo báo cáo */
  giaM2: number;
};

export type ChiSoKhuVuc = {
  /** Tên tỉnh/thành theo hệ mới, VD "Đà Nẵng" */
  tinh: string;
  /** Để trống = áp cho mọi loại hình */
  loaiHinh?: string;
  /** Ai công bố: Batdongsan.com.vn · CBRE · Savills · DKRA… */
  nguon: string;
  /** Ngày chủ dự án cập nhật, dạng 2026-09-11 */
  capNhat: string;
  moc: MocQuy[];
};

export type ChiSoGiaData = { items: ChiSoKhuVuc[] };

/** Lấy dãy quý hợp với tin này. Không có thì trả null — không vẽ biểu đồ. */
export function chiSoChoTin(tin: Listing, data: ChiSoGiaData | null): ChiSoKhuVuc | null {
  if (!data?.items?.length) return null;
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  const loai = chuanTen(tin.type);
  const hop = data.items.filter((x) => chuanTen(x.tinh) === tinh);
  if (!hop.length) return null;
  // Ưu tiên dòng khai đúng loại hình, không có thì lấy dòng chung.
  return (
    hop.find((x) => x.loaiHinh && chuanTen(x.loaiHinh) === loai) ??
    hop.find((x) => !x.loaiHinh) ??
    null
  );
}

/** Đổi đồng/m² sang chuỗi gọn: 78,5 triệu/m² */
export function vndM2(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(".", ",")} tỷ/m²`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(".", ",")} triệu/m²`;
  return `${Math.round(v / 1000).toLocaleString("vi-VN")} nghìn/m²`;
}

// ── SO SÁNH VỚI KHU VỰC LÂN CẬN ────────────────────────────────────────────
// Người mua luôn hỏi "chỗ này so với mấy phường bên cạnh thì sao". Đây là câu
// hỏi quyết định chọn chỗ, mà không sàn nào ở Miền Trung trả lời được vì họ
// không tách nổi dữ liệu tới cấp phường.

export type OSanh = { ten: string; trungVi: number; soMau: number; chinhNo: boolean };

export function soSanhKhuVuc(tin: Listing, tatCa: Listing[], toiDa = 5): OSanh[] {
  const loai = chuanTen(tin.type);
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  if (!tinh) return [];

  const nhom = new Map<string, number[]>();
  for (const x of tatCa) {
    if (chuanTen(x.type) !== loai || (x.purpose ?? "ban") !== (tin.purpose ?? "ban")) continue;
    if (chuanTen(x.diaGioi?.province ?? "") !== tinh) continue;
    const ph = x.diaGioi?.ward?.trim();
    if (!ph) continue;
    const v = giaMoiM2(x);
    if (v === null) continue;
    const cu = nhom.get(ph);
    if (cu) cu.push(v);
    else nhom.set(ph, [v]);
  }

  const cuaTin = chuanTen(tin.diaGioi?.ward ?? "");
  return [...nhom.entries()]
    .filter(([, ds]) => ds.length >= MAU_TOI_THIEU)
    .map(([ten, ds]) => ({
      ten,
      trungVi: trungVi(ds),
      soMau: ds.length,
      chinhNo: chuanTen(ten) === cuaTin,
    }))
    .sort((a, b) => b.trungVi - a.trungVi)
    .slice(0, toiDa);
}

// ── XU HƯỚNG TỪ KHO CỦA CHÍNH MÌNH ─────────────────────────────────────────
// Bảng gia_khu_vuc_thang chụp mặt bằng giá mỗi tháng và giữ lại vĩnh viễn. Khi
// kho đủ dày (mỗi quý có mẫu), web tự vẽ đường giá của mình và KHÔNG cần số
// mượn bên ngoài nữa — đây chính là cách Batdongsan làm, chỉ khác quy mô.
// Chưa đủ thì trả null, nơi gọi lùi về chỉ số nhập tay từ báo cáo.

export async function xuHuongCuaMinh(
  tinh: string,
  loaiHinh: string,
  mucDich: string,
  phuong = "",
): Promise<ChiSoKhuVuc | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !tinh || !loaiHinh) return null;

  const q =
    `${url}/rest/v1/gia_khu_vuc_thang` +
    `?select=thang,trung_vi,so_mau` +
    `&tinh=eq.${encodeURIComponent(tinh)}` +
    `&phuong=eq.${encodeURIComponent(phuong)}` +
    `&loai_hinh=eq.${encodeURIComponent(loaiHinh)}` +
    `&muc_dich=eq.${encodeURIComponent(mucDich)}` +
    `&order=thang.asc&limit=36`;

  try {
    const r = await fetch(q, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const ds = (await r.json()) as { thang: string; trung_vi: number; so_mau: number }[];
    if (!Array.isArray(ds) || ds.length < 2) return null;

    // Gom các tháng về QUÝ, lấy trung vị của các tháng trong quý.
    const theoQuy = new Map<string, number[]>();
    for (const d of ds) {
      const [nam, thang] = d.thang.split("-");
      const quy = `${nam}-Q${Math.floor((Number(thang) - 1) / 3) + 1}`;
      const cu = theoQuy.get(quy);
      if (cu) cu.push(d.trung_vi);
      else theoQuy.set(quy, [d.trung_vi]);
    }
    const moc: MocQuy[] = [...theoQuy.entries()]
      .map(([quy, vs]) => ({ quy, giaM2: Math.round(vs.reduce((t, v) => t + v, 0) / vs.length) }))
      .sort((a, b) => a.quy.localeCompare(b.quy));
    if (moc.length < 2) return null;

    const tongMau = ds.reduce((t, d) => t + d.so_mau, 0);
    return {
      tinh,
      loaiHinh,
      nguon: `tin đăng trên Coastal Land (${tongMau} lượt ghi nhận)`,
      capNhat: ds[ds.length - 1].thang,
      moc,
    };
  } catch {
    return null;
  }
}
