// ============================================================================
// NẠP DỰ ÁN HÀNG LOẠT — so với hồ sơ đã có trên web rồi mới ghi (31/10/2026, D42 + bài học D46)
// Dùng chung: Admin → Dự án → Nạp hàng loạt · sheet "Dự án" trong Đăng nhiều tin bằng file.
//   - Dự án MỚI → thêm vào "Chờ duyệt" (payload của csvDuAn.ts), mỗi dự án một lệnh: một dòng hỏng không kéo cả lô.
//   - Hồ sơ ĐÃ CÓ (trùng đường dẫn) → CHỈ ĐIỀN Ô ĐANG TRỐNG; ô web đã có giữ nguyên (kể cả khi tệp ghi khác);
//     KHÔNG đổi trạng thái đăng/duyệt, không đổi published_at, không xoá gì.
//   - Chặn dòng thiếu ảnh / thiếu trường bắt buộc; hồ sơ đã có thì chỉ chặn ô cả tệp lẫn web đều trống.
// Chi phí: chỉ chạy khi admin bấm Nạp — một lần đọc projects theo danh sách đường dẫn + một lệnh ghi mỗi dự án.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DongDuAn } from "@/lib/csvDuAn";
import { TEN_TRUONG, type TruongBatBuoc } from "@/lib/truongDuAn";

type Dong = Record<string, unknown>;
type MucQuyMo = { label: string; value: string };

export type KeHoachDuAn = {
  d: DongDuAn;
  loai: "moi" | "capNhat" | "khongDoi" | "chan";
  chan: string[];                        // lý do không nạp (báo đỏ)
  doi: { o: string; moi: string }[];     // hồ sơ đã có: ô sẽ được điền
  giuWeb: string[];                      // hồ sơ đã có: ô tệp ghi khác web — giữ bản trên web
  canAnh: boolean;                       // sẽ ghi ảnh (dự án mới, hoặc hồ sơ đã có chưa có ảnh)
  id?: string;
  patch?: Dong;
};

const coGiaTri = (x: unknown) =>
  Array.isArray(x) ? x.length > 0 : x !== null && x !== undefined && String(x).trim() !== "";

// Cột của projects được điền khi web đang trống
const COT: [string, string][] = [
  ["type", "loại hình"], ["status_text", "trạng thái"], ["developer", "chủ đầu tư"], ["province", "tỉnh/thành"],
  ["ward", "phường/xã"], ["price_from", "giá từ"], ["overview", "tổng quan"], ["amenities", "tiện ích"],
];
// Khoá trong details được điền khi web đang trống (không đụng tier, dangThe, purposes, priceMode)
const CHI_TIET: [string, string][] = [
  ["addressDetail", "địa chỉ"], ["mapPin", "toạ độ"], ["developmentUnit", "đơn vị phát triển"],
  ["nguon", "nguồn"], ["ngayCapNhat", "ngày cập nhật"],
];
// Trường bắt buộc (một nguồn truongDuAn.ts) → hồ sơ trên web đã có chưa
const TREN_WEB: Record<keyof TruongBatBuoc, (h: Dong) => boolean> = {
  ten: (h) => coGiaTri(h.name), diaChi: (h) => coGiaTri(h.province) && coGiaTri(h.ward),
  loaiHinh: (h) => coGiaTri(h.type), tinhTrang: (h) => coGiaTri(h.status_text), chuDauTu: (h) => coGiaTri(h.developer),
};

const ngan = (x: unknown) => { const s = Array.isArray(x) ? x.join("; ") : String(x); return s.length > 80 ? s.slice(0, 80) + "…" : s; };

// coAnh(d): dòng có ảnh dùng được (tệp chọn kèm khớp, hoặc link https) + tên tệp ghi trong cột mà không có tệp
export async function lapKeHoach(
  supabase: SupabaseClient,
  dong: DongDuAn[],
  coAnh: (d: DongDuAn) => { co: boolean; thieu: string[] },
): Promise<KeHoachDuAn[]> {
  const slugs = [...new Set(dong.filter((d) => d.payload).map((d) => d.slug))];
  const { data, error } = slugs.length
    ? await supabase.from("projects").select("id,slug,name,type,status_text,developer,province,ward,price_from,overview,amenities,images,scale,details").in("slug", slugs)
    : { data: [], error: null };
  if (error) throw new Error(error.message);
  const daCo = new Map(((data ?? []) as Dong[]).map((h) => [h.slug as string, h]));

  return dong.map((d): KeHoachDuAn => {
    const anh = coAnh(d);
    const chan = [...d.loi];
    if (anh.thieu.length) chan.push(`chưa chọn tệp ảnh: ${anh.thieu.join(", ")}`);
    const cu = d.payload ? daCo.get(d.slug) : undefined;

    if (!cu) {
      chan.push(...d.thieu.map((t) => `thiếu ${TEN_TRUONG[t]}`));
      if (!anh.co) chan.push("thiếu ảnh");
      return { d, loai: chan.length || !d.payload ? "chan" : "moi", chan, doi: [], giuWeb: [], canAnh: anh.co };
    }

    // Hồ sơ đã có: trường bắt buộc chỉ chặn khi cả tệp lẫn web đều trống
    chan.push(...d.thieu.filter((t) => !TREN_WEB[t](cu)).map((t) => `thiếu ${TEN_TRUONG[t]}`));
    const webCoAnh = coGiaTri(cu.images);
    if (!anh.co && !webCoAnh) chan.push("thiếu ảnh");
    if (chan.length) return { d, loai: "chan", chan, doi: [], giuWeb: [], canAnh: false };

    const p = d.payload!;
    const patch: Dong = {};
    const doi: { o: string; moi: string }[] = [];
    const giuWeb: string[] = [];
    for (const [k, nhan] of COT) {
      if (!coGiaTri(p[k])) continue;
      if (!coGiaTri(cu[k])) { patch[k] = p[k]; doi.push({ o: nhan, moi: ngan(p[k]) }); }
      else if (ngan(p[k]) !== ngan(cu[k])) giuWeb.push(nhan);
    }
    const ctCu = (cu.details ?? {}) as Dong;
    const ctMoi = (p.details ?? {}) as Dong;
    const ctThem: Dong = {};
    for (const [k, nhan] of CHI_TIET) {
      if (!coGiaTri(ctMoi[k])) continue;
      if (!coGiaTri(ctCu[k])) { ctThem[k] = ctMoi[k]; doi.push({ o: nhan, moi: ngan(ctMoi[k]) }); }
      else if (String(ctMoi[k]) !== String(ctCu[k])) giuWeb.push(nhan);
    }
    if (Object.keys(ctThem).length) patch.details = { ...ctCu, ...ctThem };
    // Bảng Tổng quan: thêm mục web chưa có, mục đã có giữ nguyên
    const qmCu = ((cu.scale ?? []) as MucQuyMo[]).filter((s) => s && s.label);
    const coNhan = new Set(qmCu.map((s) => s.label.trim().toLowerCase()));
    const qmThem = ((p.scale ?? []) as MucQuyMo[]).filter((s) => !coNhan.has(s.label.trim().toLowerCase()));
    if (qmThem.length) {
      patch.scale = [...qmCu, ...qmThem];
      for (const s of qmThem) doi.push({ o: s.label, moi: ngan(s.value) });
    }
    const canAnh = anh.co && !webCoAnh;
    if (canAnh) doi.push({ o: "ảnh tiêu biểu", moi: "ảnh trong tệp" });
    else if (anh.co) giuWeb.push("ảnh");
    return { d, loai: doi.length ? "capNhat" : "khongDoi", chan, doi, giuWeb, canAnh, id: cu.id as string, patch };
  });
}

// Ghi theo kế hoạch. layAnh(k) tải ảnh chọn kèm lên kho (hoặc trả link https) — chỉ gọi khi dòng cần ghi ảnh.
export async function thucHienNap(
  supabase: SupabaseClient,
  keHoach: KeHoachDuAn[],
  layAnh: (k: KeHoachDuAn) => Promise<{ urls: string[]; loi?: string }>,
): Promise<{ moi: string[]; capNhat: string[]; loi: string[] }> {
  const kq = { moi: [] as string[], capNhat: [] as string[], loi: [] as string[] };
  for (const k of keHoach) {
    if (k.loai !== "moi" && k.loai !== "capNhat") continue;
    let urls: string[] = [];
    if (k.canAnh) {
      const a = await layAnh(k);
      if (a.loi || !a.urls.length) { kq.loi.push(`${k.d.ten}: ${a.loi ?? "không tải được ảnh"}`); continue; }
      urls = a.urls;
    }
    const { error } = k.loai === "moi"
      ? await supabase.from("projects").insert({ ...k.d.payload!, images: urls })
      : await supabase.from("projects").update({ ...k.patch!, ...(k.canAnh ? { images: urls } : {}) }).eq("id", k.id!);
    if (error) kq.loi.push(`${k.d.ten}: ${error.message}`);
    else (k.loai === "moi" ? kq.moi : kq.capNhat).push(k.d.ten);
  }
  return kq;
}
