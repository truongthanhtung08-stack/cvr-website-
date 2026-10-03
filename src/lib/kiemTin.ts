import type { SupabaseClient } from "@supabase/supabase-js";
import { ghepBillingLuu, bangTheoMucDich, huongKhuyenMai, type BillingData } from "@/lib/billing";
import type { TierId } from "@/lib/packages";

// ============================================================================
// TỰ KIỂM TIN — chủ dự án chốt 02/10/2026 sau nhiều lần lỗi lặp lại.
// Up tin xong bấm một nút ở /admin/tin-dang → rà TOÀN BỘ tin theo đúng luật đang chạy:
//   LỖI (đỏ)  · tin đang hiển thị thiếu hạn hiển thị
//             · tin đang hiển thị thiếu mốc xếp hạng bumped_at (tin chìm — bẫy 20/09)
//             · số ngày hiển thị sai chương trình (tin lên sóng từ 01/10, ngày luật một nguồn)
//             · cùng một ảnh nằm ở 2 tin khác nhau (bẫy up hàng loạt 10/09)
//             · tin không có số điện thoại liên hệ
//   CHÚ Ý     · tin đã qua giờ hết hạn, chờ cron mỗi giờ tắt (web đã tự ẩn rồi)
// Chỉ ĐỌC, không sửa gì. Số ngày dùng đúng huongKhuyenMai + bảng giá công bố như lúc duyệt.
// ============================================================================

type Tin = {
  id: string;
  title: string | null;
  status: string;
  tier: TierId;
  purpose: string | null;
  owner_id: string | null;
  images: string[] | null;
  published_at: string | null;
  bumped_at: string | null;
  tier_expires_at: string | null;
  details: { contact?: { phone?: string } } | null;
};
type Chu = { id: string; phone: string | null; created_at: string | null; role: string | null; free_quota: number | null };
export type Muc = { id: string; ma: string; tieuDe: string; loai: string; chiTiet: string };

const NGAY_MS = 86_400_000;
const ngayVn = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

export type KetQuaKiemTin = { luc: string; tongTin: number; choDuyet: number; loi: Muc[]; chuY: Muc[] };

export async function kiemTin(admin: SupabaseClient): Promise<KetQuaKiemTin> {
  const [{ data: tinRaw, error }, { data: bl }] = await Promise.all([
    admin
      .from("listings")
      .select("id,title,status,tier,purpose,owner_id,images,published_at,bumped_at,tier_expires_at,details")
      .in("status", ["approved", "pending"])
      .limit(5000),
    admin.from("site_content").select("data").eq("key", "billing").limit(1),
  ]);
  if (error) throw new Error(error.message);
  const ds = (tinRaw ?? []) as Tin[];
  const bang: BillingData = ghepBillingLuu(bl?.[0]?.data as Partial<BillingData> | undefined);

  const ids = [...new Set(ds.map((t) => t.owner_id).filter((x): x is string => !!x))];
  const { data: chuRaw } = ids.length
    ? await admin.from("profiles").select("id,phone,created_at,role,free_quota").in("id", ids)
    : { data: [] };
  const chu = new Map(((chuRaw ?? []) as Chu[]).map((c) => [c.id, c]));

  const loi: Muc[] = [];
  const chuY: Muc[] = [];
  const muc = (t: Tin, loai: string, chiTiet: string): Muc => ({
    id: t.id,
    ma: t.id.slice(0, 8).toUpperCase(),
    tieuDe: (t.title ?? "").slice(0, 80),
    loai,
    chiTiet,
  });
  const bayGio = Date.now();

  for (const t of ds) {
    const c = t.owner_id ? chu.get(t.owner_id) : undefined;

    // Số điện thoại: tin nào (kể cả chờ duyệt) cũng phải gọi được người đăng.
    if (!t.details?.contact?.phone?.trim() && !c?.phone?.trim()) loi.push(muc(t, "Thiếu số điện thoại", "Tin không có số liên hệ, chủ tài khoản cũng không có số."));

    if (t.status !== "approved") continue;

    if (!t.tier_expires_at) {
      loi.push(muc(t, "Thiếu hạn hiển thị", "Tin đang hiện nhưng không có ngày hết hạn."));
    } else if (new Date(t.tier_expires_at).getTime() <= bayGio) {
      chuY.push(muc(t, "Đã qua giờ hết hạn", "Web đã tự ẩn; cron mỗi giờ sẽ chuyển sang Hết hạn và nhắn khách."));
    }
    if (!t.bumped_at) loi.push(muc(t, "Tin bị chìm", "Thiếu mốc xếp hạng (bumped_at) → nằm dưới mọi tin cũ."));

    // Số ngày đúng chương trình — MỌI tin đang hiện, không trừ tin cũ (03/10/2026: đợt
    // gia hạn tay 25/09 lọt qua vì trước chỉ soát tin lên sóng từ 01/10).
    if (t.tier_expires_at && t.published_at) {
      const soNgay = Math.round((new Date(t.tier_expires_at).getTime() - new Date(t.published_at).getTime()) / NGAY_MS);
      const huong = huongKhuyenMai(bang.free, {
        goi: t.tier,
        homNay: ngayVn(t.published_at),
        coChu: !!t.owner_id,
        soNgayMoTk: c?.created_at ? (new Date(t.published_at).getTime() - new Date(c.created_at).getTime()) / NGAY_MS : Number.POSITIVE_INFINITY,
        role: c?.role,
        freeQuota: c?.free_quota,
      });
      const hopLe = huong
        ? [bang.free.days]
        : (bangTheoMucDich(bang, t.purpose).plans.find((p) => p.tierId === t.tier)?.terms ?? []).map((x) => x.days);
      if (hopLe.length && !hopLe.includes(soNgay)) {
        loi.push(
          muc(t, "Sai số ngày hiển thị", `Đang ${soNgay} ngày; đúng chương trình phải là ${hopLe.join(" / ")} ngày${huong ? " (khuyến mãi thành viên mới)" : ""}.`),
        );
      }
    }
  }

  // Ảnh trùng giữa 2 tin khác nhau (so theo URL đầy đủ).
  const theoAnh = new Map<string, Tin[]>();
  for (const t of ds) for (const u of new Set(t.images ?? [])) theoAnh.set(u, [...(theoAnh.get(u) ?? []), t]);
  const daBao = new Set<string>();
  for (const [, ts] of theoAnh) {
    if (ts.length < 2) continue;
    const khoa = ts.map((t) => t.id).sort().join("|");
    if (daBao.has(khoa)) continue;
    daBao.add(khoa);
    const ma = ts.map((t) => t.id.slice(0, 8).toUpperCase()).join(", ");
    for (const t of ts) loi.push(muc(t, "Ảnh lẫn sang tin khác", `Có ảnh dùng chung với tin: ${ma}.`));
  }

  return {
    luc: new Date().toISOString(),
    tongTin: ds.filter((t) => t.status === "approved").length,
    choDuyet: ds.filter((t) => t.status === "pending").length,
    loi,
    chuY,
  };
}
