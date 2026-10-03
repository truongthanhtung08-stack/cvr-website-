import { createAdminClient } from "@/lib/supabase/admin";
import { giaMoiM2 } from "@/lib/chiSoGia";
import type { Listing } from "@/lib/data";

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
  built_area_m2: number | null;
  details: { dtSanUocTinh?: number | null } | null;
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
    .select("province, ward, type, purpose, price_vnd, area_m2, built_area_m2, details")
    .eq("status", "approved")
    .limit(20000);
  if (error || !data) return null;

  // Chỉ gom theo PHƯỜNG + LOẠI HÌNH (chủ dự án 03/10/2026): không có số "cả tỉnh" —
  // giá cả thành phố không được dùng nói thay cho một khu vực.
  const nhom = new Map<string, number[]>();
  for (const r of data as Dong[]) {
    const tinh = (r.province ?? "").trim();
    const loai = (r.type ?? "").trim();
    if (!tinh || !loai) continue;
    // Giá mỗi m² ĐÚNG LUẬT CỦA LOẠI HÌNH (đất → m² đất · nhà → m² sàn · căn hộ →
    // m² căn) — cùng một hàm với trang tin. Tin nhà chưa có m² sàn thì không góp.
    const m2 = giaMoiM2({
      type: loai,
      purpose: r.purpose,
      priceVnd: r.price_vnd,
      areaM2: r.area_m2,
      builtAreaM2: r.built_area_m2,
      builtAreaM2Uoc: r.details?.dtSanUocTinh ?? null,
    } as Listing);
    if (m2 == null) continue;
    const mucDich = (r.purpose ?? "ban").trim();
    const phuong = (r.ward ?? "").trim();

    // Tin không ghi phường thì không góp vào đâu cả.
    if (!phuong) continue;
    const key = `${tinh}|${phuong}|${loai}|${mucDich}`;
    const cu = nhom.get(key);
    if (cu) cu.push(m2);
    else nhom.set(key, [m2]);
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
