import "server-only";
import { chuanHoaSdt, tachNhieuSdt } from "@/lib/phone";
import { normalizeVi } from "@/lib/filters";
import { asset } from "@/lib/asset";
import type { Listing } from "@/lib/data";

// ============================================================================
// DANH BẠ CHUYÊN GIA — DỰNG TỪ TIN THẬT, KHÔNG BỊA MỘT CHỮ NÀO
//
// Web đã có tin thật của môi giới thật (nhiều tin do chủ dự án đăng hộ). Danh bạ
// chuyên gia vì vậy KHÔNG cần bảng dữ liệu riêng và tuyệt đối không được điền tay
// — cứ gom theo SỐ ĐIỆN THOẠI trong tin đã duyệt là ra đúng người thật, đúng số
// tin thật. Xem lý do cấm dữ liệu mẫu trong src/lib/experts.ts.
//
// ⚠️ CỔNG SỐ ĐIỆN THOẠI — KHÔNG ĐƯỢC PHÁ:
// Số đầy đủ TUYỆT ĐỐI không đi ra HTML công khai. Trang chỉ nhận số đã che
// ("0905 *** 456"). Muốn xem đủ thì bấm nút → gọi RPC reveal_contact(tin) như
// trang chi tiết tin: người xem phải đăng nhập, và chuyên gia được ghi nhận một
// lead. Đưa số ra thẳng HTML là mất trắng cơ chế lead đó (và mất luôn lý do để
// khách trả tiền).
//
// Gộp NHIỀU SỐ CỦA MỘT NGƯỜI: môi giới hay dùng 2 số. Ở đây gom theo TÊN đã
// chuẩn hoá khi tên trùng khớp — tin của cả hai số về chung một thẻ, số nào cũng
// hiện. Không trùng tên thì để riêng, thà tách nhầm còn hơn nhập nhầm hai người.
// ============================================================================

export type ChuyenGia = {
  slug: string;
  ten: string;
  anh?: string;             // ảnh đại diện lấy từ tin (details.contact.avatar)
  soTin: number;
  khuVuc: string[];         // tỉnh/thành có tin, nhiều tin nhất trước
  loaiHinh: string[];       // loại hình đăng nhiều nhất (tối đa 3)
  sdtChe: string[];         // số đã che — chỉ để hiển thị
  tinDaiDien: string;       // id một tin đã duyệt → dùng cho nút "Hiện số"
};

type Row = {
  id: string;
  type: string;
  province: string | null;
  details: { contact?: { name?: string; phone?: string; avatar?: string } } | null;
};

// "0905123456" → "0905 *** 456". Đủ để người quen nhận ra số của mình mà người
// lạ không lấy được số để gọi rác.
export function cheSdt(so: string): string {
  const d = chuanHoaSdt(so);
  if (d.length < 7) return "";
  return `${d.slice(0, 4)} *** ${d.slice(-3)}`;
}

function slugTu(ten: string, so: string): string {
  const ten4 = normalizeVi(ten).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chuyen-gia";
  return `${ten4}-${chuanHoaSdt(so).slice(-4)}`;
}

// Xếp theo số lần xuất hiện, nhiều nhất trước.
function nhieuNhat(ds: string[], lay: number): string[] {
  const dem = new Map<string, number>();
  for (const x of ds) if (x) dem.set(x, (dem.get(x) ?? 0) + 1);
  return [...dem.entries()].sort((a, b) => b[1] - a[1]).slice(0, lay).map(([k]) => k);
}

// Gom tin đã duyệt thành danh sách chuyên gia. Tin không ghi tên hoặc không ghi
// số thì BỎ QUA — thẻ chuyên gia không tên/không liên hệ được thì vô nghĩa.
export function gomChuyenGia(rows: Row[]): ChuyenGia[] {
  type Gom = {
    ten: string; anh?: string; tinIds: string[]; sdt: Set<string>;
    tinh: string[]; loai: string[];
  };
  const theoNguoi = new Map<string, Gom>();

  for (const r of rows) {
    const ten = (r.details?.contact?.name ?? "").trim();
    const oSo = r.details?.contact?.phone ?? "";
    if (!ten || !oSo) continue;

    // Một ô có thể ghi 2 số — lấy hết.
    const so = tachNhieuSdt(oSo).filter(Boolean);
    if (so.length === 0) continue;

    // Khoá gom = TÊN chuẩn hoá. Cùng người dùng 2 số vẫn về một thẻ.
    const khoa = normalizeVi(ten);
    const g = theoNguoi.get(khoa) ?? { ten, tinIds: [], sdt: new Set<string>(), tinh: [], loai: [] };
    g.tinIds.push(r.id);
    for (const s of so) g.sdt.add(chuanHoaSdt(s));
    if (r.province) g.tinh.push(r.province);
    if (r.type) g.loai.push(r.type);
    if (!g.anh && r.details?.contact?.avatar) g.anh = asset(r.details.contact.avatar);
    theoNguoi.set(khoa, g);
  }

  return [...theoNguoi.values()]
    .map((g) => {
      const soDau = [...g.sdt][0] ?? "";
      return {
        slug: slugTu(g.ten, soDau),
        ten: g.ten,
        ...(g.anh ? { anh: g.anh } : {}),
        soTin: g.tinIds.length,
        khuVuc: nhieuNhat(g.tinh, 3),
        loaiHinh: nhieuNhat(g.loai, 3),
        sdtChe: [...g.sdt].map(cheSdt).filter(Boolean),
        tinDaiDien: g.tinIds[0],
      };
    })
    .sort((a, b) => b.soTin - a.soTin || a.ten.localeCompare(b.ten, "vi"));
}

// Đọc tin đã duyệt (chỉ các cột cần cho danh bạ) rồi gom.
// Lỗi kết nối / chưa cấu hình → trả rỗng: trang tự hiện "đang cập nhật",
// KHÔNG độn dữ liệu mẫu.
export async function getChuyenGia(): Promise<ChuyenGia[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/listings?select=id,type,province,details&status=eq.approved&order=created_at.desc&limit=1000`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { tags: ["listings"], revalidate: 60 },
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Row[];
    // Tin mẫu thời dev có id dạng số — loại như mọi trang khác.
    return gomChuyenGia(rows.filter((r) => !/^\d+$/.test(r.id)));
  } catch {
    return [];
  }
}

// Một chuyên gia theo slug + toàn bộ tin của họ (cho trang hồ sơ).
export async function getChuyenGiaTheoSlug(
  slug: string,
  tatCaTin: Listing[],
): Promise<{ cg: ChuyenGia; tin: Listing[] } | null> {
  const ds = await getChuyenGia();
  const cg = ds.find((x) => x.slug === slug);
  if (!cg) return null;
  // Tin của người này = tin có agentName trùng tên (rowToListing đã đưa tên
  // người đăng ra agentName, không kèm số điện thoại).
  const ten = normalizeVi(cg.ten);
  return { cg, tin: tatCaTin.filter((t) => normalizeVi(t.agentName ?? "") === ten) };
}
