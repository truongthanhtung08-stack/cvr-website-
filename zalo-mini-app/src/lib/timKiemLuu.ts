import { supabase } from "./supabase";
import { giaTheo, dtTheo, loaiTheo, type BoLoc, type MucDich } from "./boLoc";

// TÌM KIẾM ĐÃ LƯU — CHUNG bảng tim_kiem_luu với web (src/components/LuuTimKiem.tsx, 0055): lưu bộ lọc theo ĐÚNG định dạng tham số của
// web (filtersToParams: kv · q · loai · giaMin/giaMax theo TỶ · dtMin/dtMax) → 8h sáng có tin mới khớp, máy chủ báo khách (như web).
export type DongLuu = { id: string; muc_dich: MucDich; tham_so: string; ten: string; bao_luc: string | null; created_at: string };

export function thamSoWeb(md: MucDich, b: BoLoc): URLSearchParams {
  const p = new URLSearchParams();
  if (b.tinh) p.set("kv", b.tinh);
  if (b.khuVuc) p.set("q", b.khuVuc);
  const loai = loaiTheo(md).find((l) => l.nhan === b.loai);
  if (loai) p.set("loai", loai.types.join(","));
  const gia = giaTheo(md).find((g) => g.nhan === b.gia);
  if (gia) { p.set("giaMin", String(gia.min / 1e9)); if (gia.max != null) p.set("giaMax", String(gia.max / 1e9)); }
  const dt = dtTheo(md).find((d) => d.nhan === b.dienTich);
  if (dt) { p.set("dtMin", String(dt.min)); if (dt.max != null) p.set("dtMax", String(dt.max)); }
  return p;
}

export async function luuTimKiem(uid: string, md: MucDich, b: BoLoc): Promise<string | null> {
  const ten = [b.khuVuc, b.tinh, b.loai, b.gia, b.dienTich].filter(Boolean).join(" · ").slice(0, 120) || (md === "ban" ? "Nhà đất bán" : "Nhà đất cho thuê");
  const { error } = await supabase.from("tim_kiem_luu").insert({ user_id: uid, muc_dich: md, tham_so: thamSoWeb(md, b).toString(), ten });
  if (!error) return null;
  return /tối đa 10/i.test(error.message) ? "Đã đủ 10 tìm kiếm" : "Chưa lưu được";
}

// Mở lại: tham số web → đường dẫn danh sách của Mini App (kv · loai · gia · dt theo nhãn mức).
export function duongMoLai(d: DongLuu): string {
  const p = new URLSearchParams(d.tham_so);
  const ra = new URLSearchParams();
  const kv = p.get("q") || p.get("kv")?.split(";")[0]?.split("/").filter(Boolean).pop();
  if (kv) ra.set("kv", kv);
  const loai = loaiTheo(d.muc_dich).find((l) => l.types.join(",") === p.get("loai"));
  if (loai) ra.set("loai", loai.nhan);
  const gMin = p.get("giaMin"); const gMax = p.get("giaMax");
  const gia = giaTheo(d.muc_dich).find((g) => String(g.min / 1e9) === gMin && String(g.max == null ? null : g.max / 1e9) === String(gMax));
  if (gia) ra.set("gia", gia.nhan);
  const dt = dtTheo(d.muc_dich).find((x) => String(x.min) === p.get("dtMin") && String(x.max) === String(p.get("dtMax")));
  if (dt) ra.set("dt", dt.nhan);
  return `/ds/${d.muc_dich}${ra.toString() ? `?${ra}` : ""}`;
}
