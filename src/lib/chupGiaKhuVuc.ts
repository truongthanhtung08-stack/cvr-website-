import { createAdminClient } from "@/lib/supabase/admin";

// ════════════════════════════════════════════════════════════════════════════
// CHỤP ẢNH MẶT BẰNG GIÁ MỖI THÁNG — cỗ máy tích luỹ dữ liệu của Coastal Land.
//
// Chạy kèm việc định kỳ hằng ngày; mỗi tháng chỉ ghi một lần cho mỗi nhóm
// (khoá chính trùng thì ghi đè, nên chạy bao nhiêu lần cũng không sinh rác).
//
// Càng chạy lâu kho càng dày: sau 4–8 quý là web tự vẽ được đường giá của chính
// mình tới cấp phường, không phải mượn số của ai nữa.
// ════════════════════════════════════════════════════════════════════════════

/** Dưới mức này thì mẫu quá mỏng, ghi vào chỉ làm nhiễu kho. */
const MAU_TOI_THIEU = 3;

type Dong = {
  province: string | null;
  ward: string | null;
  type: string | null;
  purpose: string | null;
  price_vnd: number | null;
  area_m2: number | null;
};

function trungVi(ds: number[]): number {
  const s = [...ds].sort((a, b) => a - b);
  const g = Math.floor(s.length / 2);
  return s.length % 2 ? s[g] : Math.round((s[g - 1] + s[g]) / 2);
}

export async function chupGiaKhuVuc(): Promise<{ ghi: number; boQua: number } | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("listings")
    .select("province, ward, type, purpose, price_vnd, area_m2")
    .eq("status", "approved")
    .limit(20000);
  if (error || !data) return null;

  // Gom hai mức: theo PHƯỜNG và gộp cả TỈNH. Phường thì chi tiết nhưng mỏng,
  // tỉnh thì dày nhưng thô — giữ cả hai để về sau muốn vẽ mức nào cũng có.
  const nhom = new Map<string, number[]>();
  for (const r of data as Dong[]) {
    const tinh = (r.province ?? "").trim();
    const loai = (r.type ?? "").trim();
    if (!tinh || !loai) continue;
    const gia = r.price_vnd;
    const dt = r.area_m2;
    if (!gia || !dt || dt <= 0) continue;
    const m2 = gia / dt;
    // Chặn dữ liệu nhập sai: dưới 1 triệu hoặc trên 1 tỷ mỗi m².
    if (m2 < 1_000_000 || m2 > 1_000_000_000) continue;
    const mucDich = (r.purpose ?? "ban").trim();
    const phuong = (r.ward ?? "").trim();

    for (const key of [`${tinh}|${phuong}|${loai}|${mucDich}`, `${tinh}||${loai}|${mucDich}`]) {
      if (!phuong && key.includes("||") === false) continue;
      const cu = nhom.get(key);
      if (cu) cu.push(m2);
      else nhom.set(key, [m2]);
    }
  }

  const thang = new Date();
  thang.setDate(1);
  const mocThang = thang.toISOString().slice(0, 10);

  const rows: Record<string, unknown>[] = [];
  let boQua = 0;
  for (const [key, ds] of nhom) {
    if (ds.length < MAU_TOI_THIEU) {
      boQua++;
      continue;
    }
    const [tinh, phuong, loai, mucDich] = key.split("|");
    rows.push({
      thang: mocThang,
      tinh,
      phuong,
      loai_hinh: loai,
      muc_dich: mucDich,
      trung_vi: Math.round(trungVi(ds)),
      thap: Math.round(Math.min(...ds)),
      cao: Math.round(Math.max(...ds)),
      so_mau: ds.length,
    });
  }

  if (!rows.length) return { ghi: 0, boQua };

  // Ghi theo lô để không vượt giới hạn kích thước một lần gọi.
  let ghi = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const lo = rows.slice(i, i + 500);
    const { error: e } = await admin.from("gia_khu_vuc_thang").upsert(lo);
    if (!e) ghi += lo.length;
  }
  return { ghi, boQua };
}
