import { createAdminClient } from "@/lib/supabase/admin";
import { giaChoLichSu, tenTinhChuan, tenPhuongChuan, coLichSuGia } from "@/lib/chiSoGia";
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

/** Như Batdongsan: có tin là ghi, kèm số tin (so_mau) để hiện cho người xem. */
const MAU_TOI_THIEU = 1;

type Dong = {
  province: string | null;
  ward: string | null;
  type: string | null;
  purpose: string | null;
  price_vnd: number | null;
  area_m2: number | null;
  built_area_m2: number | null;
  details: {
    dtSanUocTinh?: number | null;
    project?: string | null;
  } | null;
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

  // GOM THEO ĐÚNG PHÂN KHÚC + VỊ TRÍ (chủ dự án 03/10/2026), hai kiểu nhóm:
  //   · theo DỰ ÁN:  tỉnh + dự án + loại hình + bán/thuê
  //   · theo PHƯỜNG: tỉnh + phường + loại hình + bán/thuê
  // Không có nhóm "cả tỉnh" — số cả tỉnh chỉ nhận từ nguồn công bố, không tự gộp.
  const nhom = new Map<string, number[]>();
  const them = (key: string, v: number) => {
    const cu = nhom.get(key);
    if (cu) cu.push(v);
    else nhom.set(key, [v]);
  };
  for (const r of data as Dong[]) {
    // Tên chuẩn hệ mới — "An Hải" và "Phường An Hải" gom chung một dãy.
    const tinh = tenTinhChuan(r.province);
    const loai = (r.type ?? "").trim();
    if (!tinh || !coLichSuGia(loai)) continue;
    // Chỉ tin RAO BÁN / CHO THUÊ — tin cần mua, cần thuê là giá mong muốn, không phải giá rao.
    const mucDich = r.purpose === "thue" ? "thue" : r.purpose === "ban" || !r.purpose ? "ban" : "";
    if (!mucDich) continue;
    // BÁN: giá mỗi m² đúng luật loại hình (đất → m² đất · nhà → m² sàn · căn hộ →
    // m² căn). THUÊ: tổng tiền/tháng. Cùng một hàm với trang tin.
    const m2 = giaChoLichSu({
      type: loai,
      purpose: mucDich,
      priceVnd: r.price_vnd,
      areaM2: r.area_m2,
      builtAreaM2: r.built_area_m2,
      builtAreaM2Uoc: r.details?.dtSanUocTinh ?? null,
    } as Listing);
    if (m2 == null) continue;

    const duAn = (r.details?.project ?? "").trim();
    if (duAn) them([tinh, "", loai, mucDich, duAn].join("|"), m2);

    const phuong = tenPhuongChuan(tinh, r.ward);
    if (!phuong) continue;
    them([tinh, phuong, loai, mucDich, ""].join("|"), m2);
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
    const [tinh, phuong, loai, mucDich, duAn] = key.split("|");
    rows.push({
      thang: mocThang,
      tinh,
      phuong,
      du_an: duAn,
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
