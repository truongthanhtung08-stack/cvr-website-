// ════════════════════════════════════════════════════════════════════════════
// THUẾ TNCN KHẤU TRỪ TẠI NGUỒN — MỘT CHỖ TÍNH DUY NHẤT
//
// Công ty trả lương / thù lao / hoa hồng cho cá nhân thì phải KHẤU TRỪ thuế TNCN
// trước khi trả, khai tờ khai 05/KK-TNCN theo quý và quyết toán 05/QTT-TNCN năm.
//
// ── CĂN CỨ (tra ngày 02/10/2026) ───────────────────────────────────────────
//   · Luật Thuế TNCN 109/2025/QH15 — áp dụng từ kỳ tính thuế năm 2026:
//       biểu lũy tiến 5 bậc (tháng): ≤10tr 5% · ≤30tr 10% · ≤60tr 20% · ≤100tr 30% · >100tr 35%
//       giảm trừ gia cảnh: bản thân 15,5 triệu/tháng · người phụ thuộc 6,2 triệu/tháng
//   · Cá nhân KHÔNG ký HĐLĐ hoặc HĐ dưới 3 tháng: khấu trừ 10% trên mỗi lần trả từ
//       5 triệu (Nghị định 253/2026/NĐ-CP, từ 01/7/2026) — trước 01/7/2026 là 2 triệu.
//   · Cá nhân KHÔNG cư trú: 20% trên thu nhập, không giảm trừ.
// ════════════════════════════════════════════════════════════════════════════

export type LoaiChiTra =
  /** Cư trú, HĐLĐ từ 3 tháng trở lên → lũy tiến từng phần, có giảm trừ gia cảnh */
  | "hdld"
  /** Cư trú, không HĐ hoặc HĐ dưới 3 tháng (cộng tác viên, hoa hồng, thù lao) → 10% */
  | "khong_hd"
  /** Không cư trú → 20% */
  | "khong_cu_tru";

export const NHAN_LOAI: Record<LoaiChiTra, string> = {
  hdld: "Có HĐLĐ từ 3 tháng (lương)",
  khong_hd: "Không HĐ / HĐ dưới 3 tháng (CTV, hoa hồng)",
  khong_cu_tru: "Cá nhân không cư trú",
};

export const GIAM_TRU_BAN_THAN = 15_500_000;
export const GIAM_TRU_NPT = 6_200_000;

/** Biểu lũy tiến THÁNG: [mức trần, thuế suất]. */
const BAC: [number, number][] = [
  [10_000_000, 0.05],
  [30_000_000, 0.1],
  [60_000_000, 0.2],
  [100_000_000, 0.3],
  [Infinity, 0.35],
];

/** Thuế lũy tiến từng phần. `soThang` = 12 để tính cho cả năm (nhân ngưỡng lên 12). */
export function thueLuyTien(thuNhapTinhThue: number, soThang = 1): number {
  let con = Math.max(0, thuNhapTinhThue);
  let truoc = 0;
  let thue = 0;
  for (const [tran, suat] of BAC) {
    const tranKy = tran * soThang;
    const phan = Math.min(con, tranKy - truoc);
    if (phan <= 0) break;
    thue += phan * suat;
    con -= phan;
    truoc = tranKy;
  }
  return Math.round(thue);
}

/** Ngưỡng khấu trừ 10% mỗi lần trả, theo ngày trả. */
export function nguongKhauTru10(ngayTra: string): number {
  return ngayTra >= "2026-07-01" ? 5_000_000 : 2_000_000;
}

export type ChiTra = {
  ngay_tra: string; // YYYY-MM-DD
  loai: LoaiChiTra;
  thu_nhap: number; // tổng thu nhập chịu thuế của lần trả (tháng lương)
  bao_hiem: number; // BHXH, BHYT, BHTN phần người lao động đóng
  so_npt: number;
};

export type KetQuaKhauTru = {
  giamTru: number;
  thuNhapTinhThue: number;
  thue: number;
  /** Thuộc diện phải khấu trừ (để đếm chỉ tiêu "số cá nhân bị khấu trừ"). */
  phaiKhauTru: boolean;
};

/** Thuế phải khấu trừ cho MỘT lần trả (với lương: một tháng). */
export function tinhKhauTru(c: ChiTra): KetQuaKhauTru {
  const tn = Math.max(0, Math.round(c.thu_nhap));
  if (c.loai === "khong_cu_tru") {
    return { giamTru: 0, thuNhapTinhThue: tn, thue: Math.round(tn * 0.2), phaiKhauTru: tn > 0 };
  }
  if (c.loai === "khong_hd") {
    const phai = tn >= nguongKhauTru10(c.ngay_tra);
    return { giamTru: 0, thuNhapTinhThue: tn, thue: phai ? Math.round(tn * 0.1) : 0, phaiKhauTru: phai };
  }
  const giamTru = GIAM_TRU_BAN_THAN + Math.max(0, c.so_npt) * GIAM_TRU_NPT + Math.max(0, Math.round(c.bao_hiem));
  const tntt = Math.max(0, tn - giamTru);
  const thue = thueLuyTien(tntt);
  return { giamTru, thuNhapTinhThue: tntt, thue, phaiKhauTru: thue > 0 };
}

// ── Tổng hợp cho tờ khai ────────────────────────────────────────────────────

export type DongChiTra = ChiTra & {
  id: string;
  ho_ten: string;
  ma_so: string | null;
  dien_giai: string | null;
  thue_khau_tru: number;
};

// ── Lưu trữ ────────────────────────────────────────────────────────────────
// Sổ chi trả nằm trong bảng `bi_mat` (đã có sẵn, CHỈ admin + máy chủ đọc được —
// lương là dữ liệu cá nhân, tuyệt đối không để ở site_content công khai). Dùng
// bảng có sẵn để KHÔNG phải chạy SQL gì thêm trong Supabase.
// Mỗi lần chi trả = một dòng, khóa "tncn:<ngày trả>:<id>" → lọc theo kỳ bằng khóa.

type Supa = { from: (bang: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

const TIEN_TO = "tncn:";

export async function napChiTra(supabase: Supa, tuNgay: string, denNgay: string): Promise<{ rows: DongChiTra[]; loi: string }> {
  const { data, error } = await supabase
    .from("bi_mat")
    .select("key,data")
    .gte("key", `${TIEN_TO}${tuNgay}`)
    .lte("key", `${TIEN_TO}${denNgay}~`)
    .order("key", { ascending: true });
  if (error) return { rows: [], loi: error.message };
  return { rows: ((data ?? []) as { data: DongChiTra }[]).map((d) => d.data), loi: "" };
}

export async function ghiChiTra(supabase: Supa, d: Omit<DongChiTra, "id">): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("bi_mat")
    .insert({ key: `${TIEN_TO}${d.ngay_tra}:${id}`, data: { ...d, id }, updated_at: new Date().toISOString() });
  return error ? error.message : "";
}

export async function xoaChiTra(supabase: Supa, d: Pick<DongChiTra, "id" | "ngay_tra">): Promise<string> {
  const { error } = await supabase.from("bi_mat").delete().eq("key", `${TIEN_TO}${d.ngay_tra}:${d.id}`);
  return error ? error.message : "";
}

/** Một người = mã số (MST/CCCD) nếu có, không thì họ tên. */
function khoaNguoi(d: { ma_so: string | null; ho_ten: string }): string {
  return (d.ma_so?.trim() || d.ho_ten.trim().toLowerCase());
}

/**
 * Chỉ tiêu tờ khai khấu trừ thuế TNCN mẫu 05/KK-TNCN (cũng là phần tổng hợp
 * của 05/QTT-TNCN khi truyền cả năm). Thứ tự chỉ tiêu theo mẫu Thông tư 80/2021.
 */
export function tongHop05(ds: DongChiTra[]) {
  const nguoi = new Set(ds.map(khoaNguoi));
  const nguoiHd = new Set(ds.filter((d) => d.loai === "hdld").map(khoaNguoi));
  const biKhauTru = ds.filter((d) => d.thue_khau_tru > 0);
  const kt = (loai: LoaiChiTra | "cu_tru") =>
    new Set(
      biKhauTru.filter((d) => (loai === "cu_tru" ? d.loai !== "khong_cu_tru" : d.loai === loai)).map(khoaNguoi),
    ).size;
  const tong = (loc: (d: DongChiTra) => boolean, k: "thu_nhap" | "thue_khau_tru") =>
    ds.filter(loc).reduce((s, d) => s + Number(d[k] || 0), 0);
  const la = (l: LoaiChiTra) => (d: DongChiTra) => d.loai === l;
  const thuocDien = (l: LoaiChiTra) => (d: DongChiTra) =>
    d.loai === l && (l === "hdld" ? d.thue_khau_tru > 0 : tinhKhauTru(d).phaiKhauTru);

  const c27 = tong(la("hdld"), "thu_nhap");
  const c28 = tong(la("khong_hd"), "thu_nhap");
  const c29 = tong(la("khong_cu_tru"), "thu_nhap");
  const c31 = tong(thuocDien("hdld"), "thu_nhap");
  const c32 = tong(thuocDien("khong_hd"), "thu_nhap");
  const c33 = tong(thuocDien("khong_cu_tru"), "thu_nhap");
  const c35 = tong(la("hdld"), "thue_khau_tru");
  const c36 = tong(la("khong_hd"), "thue_khau_tru");
  const c37 = tong(la("khong_cu_tru"), "thue_khau_tru");
  return {
    c21: nguoi.size,
    c22: nguoiHd.size,
    c23: kt("cu_tru") + kt("khong_cu_tru"),
    c24: kt("cu_tru"),
    c25: kt("khong_cu_tru"),
    c26: c27 + c28 + c29,
    c27,
    c28,
    c29,
    c30: c31 + c32 + c33,
    c31,
    c32,
    c33,
    c34: c35 + c36 + c37,
    c35,
    c36,
    c37,
  };
}

export type DongQuyetToan = {
  ho_ten: string;
  ma_so: string | null;
  thuNhap: number;
  baoHiem: number;
  giamTruBanThan: number;
  giamTruNpt: number;
  thuNhapTinhThue: number;
  daKhauTru: number;
  phaiNop: number;
  /** dương = còn phải nộp thêm · âm = nộp thừa */
  chenhLech: number;
};

/**
 * Bảng kê 05-1/BK-QTT-TNCN — quyết toán thay cho người có HĐLĐ từ 3 tháng.
 * Giảm trừ bản thân tính ĐỦ 12 tháng khi quyết toán; người phụ thuộc tính theo
 * số tháng thực có đăng ký (cộng từ các tháng lương đã nhập).
 * Chỉ đúng cho người ỦY QUYỀN công ty quyết toán (chỉ có thu nhập ở công ty).
 */
export function bangKe051(ds: DongChiTra[]): DongQuyetToan[] {
  const m = new Map<string, DongChiTra[]>();
  for (const d of ds.filter((x) => x.loai === "hdld")) {
    const k = khoaNguoi(d);
    m.set(k, [...(m.get(k) ?? []), d]);
  }
  return [...m.values()].map((dong) => {
    const thuNhap = dong.reduce((s, d) => s + Number(d.thu_nhap || 0), 0);
    const baoHiem = dong.reduce((s, d) => s + Number(d.bao_hiem || 0), 0);
    const giamTruBanThan = GIAM_TRU_BAN_THAN * 12;
    const giamTruNpt = dong.reduce((s, d) => s + Number(d.so_npt || 0) * GIAM_TRU_NPT, 0);
    const thuNhapTinhThue = Math.max(0, thuNhap - baoHiem - giamTruBanThan - giamTruNpt);
    const daKhauTru = dong.reduce((s, d) => s + Number(d.thue_khau_tru || 0), 0);
    const phaiNop = thueLuyTien(thuNhapTinhThue, 12);
    return {
      ho_ten: dong[0].ho_ten,
      ma_so: dong[0].ma_so,
      thuNhap,
      baoHiem,
      giamTruBanThan,
      giamTruNpt,
      thuNhapTinhThue,
      daKhauTru,
      phaiNop,
      chenhLech: phaiNop - daKhauTru,
    };
  });
}

/** Bảng kê 05-2/BK-QTT-TNCN — người không HĐ / HĐ dưới 3 tháng / không cư trú. */
export function bangKe052(ds: DongChiTra[]) {
  const m = new Map<string, { ho_ten: string; ma_so: string | null; khongCuTru: boolean; thuNhap: number; thuocDien: number; daKhauTru: number }>();
  for (const d of ds.filter((x) => x.loai !== "hdld")) {
    const k = khoaNguoi(d);
    const r = m.get(k) ?? { ho_ten: d.ho_ten, ma_so: d.ma_so, khongCuTru: d.loai === "khong_cu_tru", thuNhap: 0, thuocDien: 0, daKhauTru: 0 };
    r.thuNhap += Number(d.thu_nhap || 0);
    if (tinhKhauTru(d).phaiKhauTru) r.thuocDien += Number(d.thu_nhap || 0);
    r.daKhauTru += Number(d.thue_khau_tru || 0);
    m.set(k, r);
  }
  return [...m.values()];
}
