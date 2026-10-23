import "server-only";
import { chuanHoaSdt, tachNhieuSdt, maNguoiTuSdt } from "@/lib/phone";
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
// ("0905 123 •••", chỉ che 3 số cuối). Muốn xem đủ thì bấm nút → gọi RPC reveal_contact(tin) như
// trang chi tiết tin: người xem phải đăng nhập, và chuyên gia được ghi nhận một
// lead. Đưa số ra thẳng HTML là mất trắng cơ chế lead đó (và mất luôn lý do để
// khách trả tiền).
//
// Gộp NHIỀU SỐ CỦA MỘT NGƯỜI: môi giới hay dùng 2 số. Ở đây gom theo TÊN đã
// chuẩn hoá khi tên trùng khớp — tin của cả hai số về chung một thẻ, số nào cũng
// hiện. Không trùng tên thì để riêng, thà tách nhầm còn hơn nhập nhầm hai người.
// ============================================================================

// ── NGƯỠNG CHO GOOGLE LẬP CHỈ MỤC HỒ SƠ (chủ dự án chốt 18/09/2026) ─────────
// Hồ sơ có ÍT HƠN ngần này tin thì vẫn xem được bình thường nhưng KHÔNG cho vào
// chỉ mục Google và KHÔNG khai trong sitemap. Lý do: đo ngày 18/09/2026 thấy
// 29/40 hồ sơ chỉ có đúng một tin — trang như vậy chỉ chép lại một tin đã có
// trang riêng, Google chấm là "trang mỏng" + trùng lặp nội bộ, gom cả trăm trang
// thì kéo điểm cả tên miền xuống.
// Đăng thêm tin cho đủ ngưỡng là trang tự vào chỉ mục lại, không phải sửa code.
// Dùng CHUNG một hằng số này ở cả trang hồ sơ lẫn sitemap — đổi một chỗ là xong.
export const NGUONG_INDEX_HO_SO = 3;

export type ChuyenGia = {
  slug: string;
  ten: string;
  anh?: string;             // ảnh đại diện lấy từ tin (details.contact.avatar)
  soTin: number;
  khuVuc: string[];         // tỉnh/thành có tin, nhiều tin nhất trước
  loaiHinh: string[];       // loại hình đăng nhiều nhất (tối đa 3)
  sdtChe: string[];         // số đã che — chỉ để hiển thị
  tinDaiDien: string;       // id một tin đã duyệt → dùng cho nút "Hiện số"
  // Sàn / công ty (tên người đăng là tên doanh nghiệp) — tách khỏi chuyên gia cá nhân (15/10/2026)
  laCongTy: boolean;
  maNguoi: string;           // mã người đăng (băm SĐT) — khớp Listing.maNguoi để lấy đúng tin của người này
};

// Nhận biết tên doanh nghiệp từ tên người đăng. Hồ sơ sàn/công ty chưa có thông tin pháp nhân
// (MST, địa chỉ, giới thiệu) → KHÔNG cho Google lập chỉ mục ("không đạt thì không index").
export const laTenCongTy = (ten: string) =>
  /(công ty|cty|sàn|tnhh|jsc|group|realty|bđs|bất động sản|land)/i.test(ten);

type Row = {
  id: string;
  type: string;
  province: string | null;
  details: { contact?: { name?: string; phone?: string; avatar?: string } } | null;
};

// "0905123456" → "0905 123 •••" — chuẩn chung toàn web: số 10 chữ số, CHỈ che 3 số cuối
// (chủ dự án chốt 01/10/2026).
export function cheSdt(so: string): string {
  const d = chuanHoaSdt(so);
  if (d.length < 7) return "";
  return `${d.slice(0, 4)} ${d.slice(4, 7)} •••`;
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
    tinh: string[]; loai: string[]; cacTen: string[]; soChinh: string;
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
    // GOM THEO SỐ ĐIỆN THOẠI (15/10/2026): một số = một người. Trước đây gom theo TÊN nên cùng một
    // người ghi "Lê Duy Tài" / "BĐS Lê Tài" / "Công ty BĐS Lê Tài" thành 3 hồ sơ (14 số như vậy).
    // Số chính = số đầu của ô liên hệ (số hiển thị, cũng là số định danh tài khoản theo SĐT).
    const soChinh = chuanHoaSdt(so[0]);
    const khoa = soChinh || normalizeVi(ten);
    const g = theoNguoi.get(khoa) ?? { ten, tinIds: [], sdt: new Set<string>(), tinh: [], loai: [], cacTen: [], soChinh };
    g.cacTen.push(ten);
    g.tinIds.push(r.id);
    for (const s of so) g.sdt.add(chuanHoaSdt(s));
    if (r.province) g.tinh.push(r.province);
    if (r.type) g.loai.push(r.type);
    if (!g.anh && r.details?.contact?.avatar) g.anh = asset(r.details.contact.avatar);
    theoNguoi.set(khoa, g);
  }

  return [...theoNguoi.values()]
    .map((g) => {
      const soDau = g.soChinh || ([...g.sdt][0] ?? "");
      const ten = nhieuNhat(g.cacTen, 1)[0] ?? g.ten; // tên người này dùng nhiều nhất
      return {
        slug: slugTu(ten, soDau),
        ten,
        maNguoi: maNguoiTuSdt(soDau),
        ...(g.anh ? { anh: g.anh } : {}),
        soTin: g.tinIds.length,
        khuVuc: nhieuNhat(g.tinh, 3),
        loaiHinh: nhieuNhat(g.loai, 3),
        sdtChe: [...g.sdt].map(cheSdt).filter(Boolean),
        tinDaiDien: g.tinIds[0],
        laCongTy: laTenCongTy(ten),
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
        next: { tags: ["listings"], revalidate: 3600 },
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

// Tìm theo slug. Đường dẫn cũ (thời gom theo TÊN) → tìm theo 4 số cuối nếu chỉ khớp đúng một người;
// trang hồ sơ khai canonical về slug mới.
export function timChuyenGia(ds: ChuyenGia[], slug: string): ChuyenGia | undefined {
  const dung = ds.find((x) => x.slug === slug);
  if (dung) return dung;
  const duoi = slug.match(/-(d{4})$/)?.[1];
  const khop = duoi ? ds.filter((x) => x.slug.endsWith(`-${duoi}`)) : [];
  return khop.length === 1 ? khop[0] : undefined;
}

// Một chuyên gia theo slug + toàn bộ tin của họ (cho trang hồ sơ).
export async function getChuyenGiaTheoSlug(
  slug: string,
  tatCaTin: Listing[],
): Promise<{ cg: ChuyenGia; tin: Listing[] } | null> {
  const ds = await getChuyenGia();
  const cg = timChuyenGia(ds, slug);
  if (!cg) return null;
  // Tin của người này = tin có agentName trùng tên (rowToListing đã đưa tên
  // người đăng ra agentName, không kèm số điện thoại).
  return { cg, tin: tatCaTin.filter((t) => t.maNguoi === cg.maNguoi) };
}

// ── SÀN / CÔNG TY CÓ HỒ SƠ DOANH NGHIỆP (chủ dự án 23/10/2026) ───────────────────────────────
// Chỉ doanh nghiệp (profiles.role "company") đã điền đủ hồ sơ + đồng ý cho đăng (src/lib/hoSoDoanhNghiep.ts).
// Nối với danh bạ theo SĐT để biết số tin + trang hồ sơ. SĐT không ra HTML (cổng lead ở đầu tệp).
// Đọc bằng khoá máy chủ (profiles không mở công khai); bộ nhớ đệm 1 giờ như trang tin — không thêm chi phí.
export type CongTy = {
  ten: string;
  tenPhapNhan: string;
  mst: string;
  diaChi: string;
  gioiThieu: string;
  email?: string;
  website?: string;
  logo?: string;
  mangXaHoi: string[];
  hoSo?: ChuyenGia; // hồ sơ trong danh bạ (theo SĐT) nếu có tin
};

export async function getCongTy(): Promise<CongTy[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/profiles?select=*&role=eq.company&dn_dong_y_dang=eq.true&limit=500`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { tags: ["noi-dung"], revalidate: 3600 },
    });
    if (!res.ok) return []; // chưa chạy migration 0065 → chưa có cột → trang hiện như chưa có công ty
    const { thieuHoSoDn } = await import("@/lib/hoSoDoanhNghiep");
    const rows = ((await res.json()) as Record<string, string | null>[]).filter((p) => thieuHoSoDn(p).length === 0);
    const danhBa = rows.length ? await getChuyenGia() : [];
    return rows.map((p) => {
      const so = chuanHoaSdt(p.phone ?? "");
      return {
        ten: p.company_name!.trim(),
        tenPhapNhan: p.hd_ten_cong_ty!.trim(),
        mst: p.hd_mst!.trim(),
        diaChi: p.hd_dia_chi!.trim(),
        gioiThieu: p.dn_gioi_thieu!.trim(),
        email: p.hd_email?.trim() || undefined,
        website: p.dn_website?.trim() || undefined,
        logo: p.dn_logo?.trim() || undefined,
        mangXaHoi: (p.dn_mang_xa_hoi ?? "").split(/\s*\n\s*/).filter((x) => /^https?:\/\//.test(x)),
        hoSo: so ? danhBa.find((cg) => cg.maNguoi === maNguoiTuSdt(so)) : undefined,
      };
    });
  } catch {
    return [];
  }
}
