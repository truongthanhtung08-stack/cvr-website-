// ============================================================================
// GIÁ CHUẨN (KHÔNG CÔNG BỐ) → CHƯƠNG TRÌNH GIẢM % → GIÁ CÔNG BỐ
// ----------------------------------------------------------------------------
// Chủ dự án chốt 24/09/2026:
//   · Giá chuẩn lấy nguồn từ Batdongsan, CHỈ nằm trong admin — không công bố.
//   · Mỗi chương trình / giai đoạn là một mức % giảm từ giá chuẩn.
//   · Chủ dự án xem trước rồi bấm "Công bố" thì khách mới thấy giá mới.
//   · Giá chuẩn gộp còn 2 bảng: BÁN và CHO THUÊ (khu vực, loại hình, giá trị
//     chỉ lệch ≤ ~12% nên dùng chung — "không chênh nhiều thì cho giống nhau").
//
// Chỗ lưu: bản nháp (giá chuẩn + chương trình) nằm ở bảng `bi_mat` key
// "gia_chuan" — bảng đó chỉ máy chủ đọc được. Bảng `site_content` thì AI CŨNG
// ĐỌC ĐƯỢC, nên nút Công bố chỉ ghi ra đó GIÁ ĐÃ TÍNH SẴN (billing.congBo).
//
// Mọi giá trong file này là giá CHƯA GTGT (giống toàn bộ billing.ts).
// ============================================================================

import type { Plan, PlanTerm, UpRow, GiaCongBo, CongBo, MucDichGia } from "@/lib/billing";
import type { TierId } from "@/lib/packages";

export const KHOA_GIA_CHUAN = "gia_chuan";

// Thứ tự cột của bảng Đẩy tin trên web — PHẢI khớp COT_UP trong billing.ts.
export const THU_TU_CAP: TierId[] = ["diamond", "gold", "silver", "basic"];

// Giá đẩy MỖI LƯỢT theo bậc số lượt mua (Batdongsan: 1–2 · 3–5 · từ 6 lượt).
export type BacDay = { tu: number; gia: number };

export type BangChuan = {
  plans: { tierId: TierId; terms: PlanTerm[] }[]; // mỗi cấp một bộ thời hạn riêng
  day: { tierId: TierId; bac: BacDay[] }[];
};

export type ChuongTrinh = {
  id: string;
  ten: string;              // "Ưu đãi ra mắt" — tên này khách nhìn thấy
  phanTram: number;         // 55 = giảm 55% so với giá chuẩn
  tu: string;               // "YYYY-MM-DD", rỗng = không giới hạn
  den: string;              // "YYYY-MM-DD", áp đến HẾT ngày này; rỗng = không giới hạn
  mucDich: "all" | MucDichGia;
  sanPham: "all" | "tin" | "day";
  tiers: TierId[];          // rỗng = mọi cấp tin
  bat: boolean;
};

export type GiaChuanNhap = {
  ban: BangChuan;
  thue: BangChuan;
  chuongTrinh: ChuongTrinh[];
  capNhat?: string;         // lần lưu nháp gần nhất (ISO)
  congBoLuc?: string;       // lần công bố gần nhất (ISO)
};

export const NHAP_TRONG: GiaChuanNhap = {
  ban: { plans: [], day: [] },
  thue: { plans: [], day: [] },
  chuongTrinh: [],
};

// ── Chương trình nào đang áp dụng cho một ô giá ─────────────────────────────
export function chuongTrinhDangChay(c: ChuongTrinh, homNay: string): boolean {
  if (!c.bat) return false;
  if (c.tu && homNay < c.tu) return false;
  if (c.den && homNay > c.den) return false;
  return true;
}

// Nhiều chương trình cùng khớp → lấy mức giảm lớn nhất (giống khuyến mãi cũ).
export function chuongTrinhApDung(
  ds: ChuongTrinh[],
  homNay: string,
  mucDich: MucDichGia,
  sanPham: "tin" | "day",
  tier: TierId,
): ChuongTrinh | null {
  return (
    ds
      .filter((c) => chuongTrinhDangChay(c, homNay))
      .filter((c) => c.mucDich === "all" || c.mucDich === mucDich)
      .filter((c) => c.sanPham === "all" || c.sanPham === sanPham)
      .filter((c) => c.tiers.length === 0 || c.tiers.includes(tier))
      .sort((a, b) => b.phanTram - a.phanTram)[0] ?? null
  );
}

const giam = (gia: number, c: ChuongTrinh | null) => gia * (1 - Math.min(100, Math.max(0, c?.phanTram ?? 0)) / 100);
// Tin đăng làm tròn nghìn đồng; đẩy tin rẻ (vài chục nghìn) làm tròn trăm đồng
// để không lệch quá nhiều so với giá chuẩn.
const tronNghin = (n: number) => Math.round(n / 1000) * 1000;
const tronTram = (n: number) => Math.round(n / 100) * 100;

// Giá đẩy mỗi lượt khi mua N lượt: bậc có `tu` lớn nhất mà ≤ N.
export function giaMoiLuot(bac: BacDay[], soLuot: number): number {
  const hop = [...bac].sort((a, b) => a.tu - b.tu).filter((b) => b.tu <= soLuot);
  return hop.length ? hop[hop.length - 1].gia : 0;
}

// "Up 7 lần (−30%)" → 7 · "Up ngay" → 1 (cùng quy tắc với billing.ts)
function soLuotTuNhan(label: string): number {
  const m = label.match(/(\d+)\s*lần/i);
  return m ? Number(m[1]) : 1;
}

// ── TÍNH GIÁ CÔNG BỐ cho MỘT mục đích ───────────────────────────────────────
// `plansHienTai` / `upHienTai`: bảng đang chạy trên web — lấy tên gói, ghi chú,
// số ảnh, và CÁC CỠ GÓI ĐẨY (1 · 3 · 7 · 13 · 27 lượt) từ đó để giữ nguyên
// những thứ chủ dự án đã duyệt; chỉ thay CON SỐ GIÁ.
export function tinhMotMucDich(
  bang: BangChuan,
  mucDich: MucDichGia,
  ds: ChuongTrinh[],
  homNay: string,
  plansHienTai: Plan[],
  upHienTai: UpRow[],
): GiaCongBo {
  const plans: Plan[] = THU_TU_CAP.flatMap((tierId) => {
    const chuan = bang.plans.find((p) => p.tierId === tierId);
    if (!chuan?.terms.length) return [];
    const ct = chuongTrinhApDung(ds, homNay, mucDich, "tin", tierId);
    const cu = plansHienTai.find((p) => p.tierId === tierId);
    return [{
      ...(cu ?? { name: tierId }),
      tierId,
      terms: [...chuan.terms]
        .sort((a, b) => a.days - b.days)
        .map((t) => ({ days: t.days, price: tronNghin(giam(t.price, ct)) })),
    }];
  });

  // Cỡ gói đẩy giữ như web đang bán; chưa có bảng nào thì dùng 1 · 3 · 6 lượt.
  const coGoi = upHienTai.length ? upHienTai.map((r) => soLuotTuNhan(r.label)) : [1, 3, 6];
  const giaCot = (tierId: TierId, n: number) => {
    const d = bang.day.find((x) => x.tierId === tierId);
    if (!d?.bac.length) return 0;
    const ct = chuongTrinhApDung(ds, homNay, mucDich, "day", tierId);
    return tronTram(giam(giaMoiLuot(d.bac, n), ct)) * n;
  };
  const coDay = bang.day.some((d) => d.bac.length);
  const up: UpRow[] = !coDay ? [] : coGoi.map((n) => {
    const values = THU_TU_CAP.map((tierId) => {
      const gia = giaCot(tierId, n);
      const goc = giaCot(tierId, 1) * n; // cùng số lượt nhưng mua lẻ từng lượt
      return goc > gia ? { giaGoc: goc, gia } : { gia };
    });
    // Nhãn tự sinh — không giữ chữ "(−20%)" cũ vì mức giảm đã đổi theo bảng mới.
    const ref = values.find((v) => v.giaGoc && v.gia);
    const pt = ref?.giaGoc ? Math.round((1 - ref.gia / ref.giaGoc) * 100) : 0;
    const label = n === 1 ? "Up ngay" : `Up ${n} lần${pt > 0 ? ` (−${pt}%)` : ""}`;
    return { label, values };
  });

  return { plans, up };
}

export function tinhCongBo(
  nhap: GiaChuanNhap,
  homNay: string,
  plansHienTai: Plan[],
  upHienTai: UpRow[],
): CongBo {
  const ban = tinhMotMucDich(nhap.ban, "ban", nhap.chuongTrinh, homNay, plansHienTai, upHienTai);
  const thue = tinhMotMucDich(nhap.thue, "thue", nhap.chuongTrinh, homNay, plansHienTai, upHienTai);
  const dangChay = nhap.chuongTrinh
    .filter((c) => chuongTrinhDangChay(c, homNay) && c.phanTram > 0)
    .sort((a, b) => b.phanTram - a.phanTram)[0];
  return { ban, thue, chuongTrinh: dangChay?.ten || undefined, luc: new Date().toISOString() };
}

// Chương trình sớm hết hạn nhất trong số đang chạy — admin cần biết để công bố lại.
export function hanChuongTrinhGanNhat(ds: ChuongTrinh[], homNay: string): string | null {
  const den = ds.filter((c) => chuongTrinhDangChay(c, homNay) && c.den).map((c) => c.den).sort();
  return den[0] ?? null;
}

// Kiểm dữ liệu gửi lên từ trang admin — chặn số âm, số không phải số, cấp lạ.
export function kiemNhap(x: unknown): GiaChuanNhap | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Partial<GiaChuanNhap>;
  const soDuong = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0;
  const capHopLe = (t: unknown) => THU_TU_CAP.includes(t as TierId);
  const bangHopLe = (b: unknown): b is BangChuan => {
    const bb = b as BangChuan;
    return !!bb && Array.isArray(bb.plans) && Array.isArray(bb.day) &&
      bb.plans.every((p) => capHopLe(p.tierId) && Array.isArray(p.terms) &&
        p.terms.every((t) => soDuong(t.days) && t.days > 0 && soDuong(t.price))) &&
      bb.day.every((d) => capHopLe(d.tierId) && Array.isArray(d.bac) &&
        d.bac.every((b2) => soDuong(b2.tu) && b2.tu >= 1 && soDuong(b2.gia)));
  };
  if (!bangHopLe(o.ban) || !bangHopLe(o.thue) || !Array.isArray(o.chuongTrinh)) return null;
  const ctHopLe = o.chuongTrinh.every((c) =>
    typeof c.id === "string" && typeof c.ten === "string" && soDuong(c.phanTram) && c.phanTram <= 100 &&
    typeof c.tu === "string" && typeof c.den === "string" &&
    ["all", "ban", "thue"].includes(c.mucDich) && ["all", "tin", "day"].includes(c.sanPham) &&
    Array.isArray(c.tiers) && c.tiers.every(capHopLe) && typeof c.bat === "boolean");
  if (!ctHopLe) return null;
  return { ban: o.ban, thue: o.thue, chuongTrinh: o.chuongTrinh, capNhat: o.capNhat, congBoLuc: o.congBoLuc };
}

// ── KIỂM TRA LOGIC GIÁ THEO HỆ SỐ X ─────────────────────────────────────────
// Hệ số X (X30 · X15 · X8 · 1x, packages.ts) là mức ƯU TIÊN HIỂN THỊ của từng
// cấp. Giá phải đi cùng chiều với nó, nếu không khách mua hạng cao lại thiệt hơn
// hạng thấp. Chủ dự án dặn 24/09: "lập bảng giá phải xem kỹ cơ chế X cho logic".
// Chạy cho cả giá chuẩn lẫn giá công bố — vì chương trình có thể giảm % khác
// nhau theo cấp làm đảo thứ tự.
export type DongX = {
  tierId: TierId;
  heSo: number;
  giaNgay: number;     // giá mỗi ngày ở mốc thời hạn ngắn nhất (chưa VAT)
  soVoiThuong: number; // giá mỗi ngày ÷ giá mỗi ngày của tin thường
  moiDonViX: number;   // soVoiThuong ÷ hệ số X — 1 = đúng tỉ lệ với tin thường
};

export function bangX(plans: { tierId: TierId; terms: PlanTerm[] }[], heSoCua: (t: TierId) => number): DongX[] {
  const giaNgay = (t: TierId) => {
    const terms = [...(plans.find((p) => p.tierId === t)?.terms ?? [])].sort((a, b) => a.days - b.days);
    return terms[0] ? terms[0].price / terms[0].days : 0;
  };
  const coSo = giaNgay("basic");
  return THU_TU_CAP.filter((t) => giaNgay(t) > 0).map((t) => {
    const g = giaNgay(t);
    const soVoi = coSo > 0 ? g / coSo : 0;
    return { tierId: t, heSo: heSoCua(t), giaNgay: g, soVoiThuong: soVoi, moiDonViX: heSoCua(t) ? soVoi / heSoCua(t) : 0 };
  });
}

export function canhBaoLogic(
  ban: { plans: { tierId: TierId; terms: PlanTerm[] }[]; up?: UpRow[] },
  thue: { plans: { tierId: TierId; terms: PlanTerm[] }[]; up?: UpRow[] },
  tenCap: (t: TierId) => string,
): string[] {
  const loi: string[] = [];
  const tungMucDich = (ten: string, b: typeof ban) => {
    // 1. Giá mỗi ngày tăng dần theo cấp: Basic < Silver < Gold < Diamond
    const ngay = (t: TierId) => {
      const terms = [...(b.plans.find((p) => p.tierId === t)?.terms ?? [])].sort((x, y) => x.days - y.days);
      return terms[0] ? terms[0].price / terms[0].days : 0;
    };
    const tuThapLenCao = [...THU_TU_CAP].reverse().filter((t) => ngay(t) > 0);
    for (let i = 1; i < tuThapLenCao.length; i++) {
      const duoi = tuThapLenCao[i - 1], tren = tuThapLenCao[i];
      if (ngay(tren) <= ngay(duoi)) {
        loi.push(`${ten}: ${tenCap(tren)} có giá mỗi ngày (${Math.round(ngay(tren)).toLocaleString("vi-VN")}đ) không cao hơn ${tenCap(duoi)} (${Math.round(ngay(duoi)).toLocaleString("vi-VN")}đ) — ngược hệ số X.`);
      }
    }
    // 2. Mua dài hơn không được đắt hơn tính theo ngày
    for (const p of b.plans) {
      const terms = [...p.terms].sort((x, y) => x.days - y.days);
      for (let i = 1; i < terms.length; i++) {
        const a = terms[i - 1], c = terms[i];
        if (a.days > 0 && c.days > 0 && c.price / c.days > a.price / a.days + 0.5) {
          loi.push(`${ten}: ${tenCap(p.tierId)} ${c.days} ngày đắt hơn ${a.days} ngày nếu tính theo ngày — khách mua dài bị thiệt.`);
        }
      }
    }
    // 3. Đẩy tin: cùng một hàng (cùng số lượt), cấp cao không rẻ hơn cấp thấp
    for (const r of b.up ?? []) {
      for (let i = 1; i < THU_TU_CAP.length; i++) {
        const tren = r.values[i - 1]?.gia ?? 0, duoi = r.values[i]?.gia ?? 0;
        if (tren > 0 && duoi > 0 && tren < duoi) {
          loi.push(`${ten}: "${r.label}" của ${tenCap(THU_TU_CAP[i - 1])} rẻ hơn ${tenCap(THU_TU_CAP[i])}.`);
        }
      }
    }
  };
  tungMucDich("Bán", ban);
  tungMucDich("Cho thuê", thue);
  // 4. Cho thuê không đắt hơn bán ở cùng cấp, cùng thời hạn
  for (const p of thue.plans) {
    for (const t of p.terms) {
      const bb = ban.plans.find((x) => x.tierId === p.tierId)?.terms.find((x) => x.days === t.days);
      if (bb && t.price > bb.price) loi.push(`${tenCap(p.tierId)} ${t.days} ngày: cho thuê đắt hơn bán.`);
    }
  }
  return loi;
}
