import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTier, type TierId } from "@/lib/packages";
import { guiThongBao, maTin, MAU_DA_HET_HAN, MAU_SAP_HET_HAN } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";
import { thucHienUpTin } from "@/lib/upTin";

// CÔNG TẮC BÁO KHÁCH VỀ HẾT HẠN (email/Zalo "sắp hết hạn" + "đã hết hạn").
// Chủ dự án chốt 03/10/2026: chỉ đổi khi CHỦ DỰ ÁN YÊU CẦU. Tắt thì tin vẫn chuyển
// 'expired' đúng giờ, rời mọi danh sách, chỉ không nhắn khách.
// 03/10 (sau): BẬT — nhưng CHỈ nhắn khách TỰ đăng ký · đăng nhập · đăng tin (xem tuDang).
// Tin admin đăng hộ / nhập hàng loạt → không nhắn. Đặt false = tắt hẳn.
const BAO_KHACH_HET_HAN = true;

// KHÁCH TỰ ĐĂNG = tin nằm trong TÀI KHOẢN KHÁCH (chủ tin là thành viên, không phải admin).
// Tin admin đăng hộ / nhập hàng loạt không gắn tài khoản khách (owner trống) → không nhắn.
// (03/10/2026: trước còn đòi details.plan → bỏ sót tin khách đăng từ tháng 7, trước khi web
// lưu gói — sai luật chủ dự án chốt "khách tự đăng ký, đăng nhập, đăng tin là nhắn".)
function tuDang(_tin: Tin, chu: Nguoi | undefined): chu is Nguoi {
  return !!chu && chu.role !== "admin";
}

// ════════════════════════════════════════════════════════════════════════════
// TIN HẾT HẠN GÓI — NHẮC TRƯỚC 3 NGÀY, HẾT HẠN THÌ NGỪNG HIỂN THỊ (như BĐS)
//
// ĐỔI 25/09/2026 (chủ dự án chốt, theo Batdongsan): hết hạn → trạng thái
// 'expired'. Tin RỜI KHỎI mọi danh sách, KHÔNG xoá; link cũ vẫn mở, trang tin
// ghi "đã hết hạn" và ẩn số. Khách "Up tin" (gia hạn, ngày tính lại từ đầu) để
// hiện lại. Áp cho MỌI hạng, kể cả tin thường VÀ tin admin đăng hộ (01/10/2026: mọi tin
// lên sóng đều có hạn — số ngày theo Giá & quy định, luật chung soNgayHienThi). Từ
// 01/10/2026 KHÔNG còn trường hợp riêng "hết VIP tụt về tin thường" (đã gỡ, 0053):
// hết số ngày của gói là ngừng hiển thị, VIP hay thường như nhau. Quét MỖI GIỜ
// (/api/tin-dang/het-han) + kèm cron hoá đơn. Đoạn dưới đây là ghi chú của cách cũ.
//
// LỖ HỔNG TRƯỚC ĐÂY: lúc duyệt tin web có ghi `tier_expires_at`, nhưng KHÔNG có
// gì đọc tới cột đó. Khách mua Diamond 30 ngày thì 30 ngày sau vẫn Diamond, mãi
// mãi. Nghĩa là không ai có lý do gia hạn — mất toàn bộ doanh thu lặp lại, mà
// còn không công bằng với người vừa mua gói.
//
// CHỌN CÁCH NHẸ (không ẩn tin): hết hạn thì tin TỤT VỀ TIN THƯỜNG, vẫn hiển thị.
//   · Khách không mất tin, không mất ảnh, không mất lượt xem đã có.
//   · Vẫn thúc gia hạn thật, vì mất hẳn vị trí ưu tiên.
//   · Ẩn hẳn tin đã trả tiền là chuyện dễ gây khiếu nại, và web đang cần tin.
//
// CHẠY Ở ĐÂU: gọi kèm trong cron nhắc xuất hóa đơn (`/api/hoa-don/nhac-xuat`),
// chạy 2 lần mỗi ngày. KHÔNG thêm cron mới vì Vercel gói Hobby chỉ cho 2 cron —
// thêm cái thứ ba là hỏng luôn lần deploy. Chạy hai lần cũng không sao: tin đã
// hạ rồi thì không khớp điều kiện nữa, tin đã nhắc rồi thì có dấu trong details.
// ════════════════════════════════════════════════════════════════════════════

// KHÔNG TỰ ĐĂNG LẠI (chủ dự án chốt 01/10/2026): đăng lại hay không là QUYỀN CỦA KHÁCH
// (bất động sản có thể đã giao dịch). Trách nhiệm của web là NHẮC: trước 3 ngày + lúc hết hạn.
const NGAY_NHAC_TRUOC = 3;

type Tin = {
  id: string;
  title: string;
  owner_id: string | null;
  tier: TierId;
  tier_days?: number | null;
  tier_expires_at: string;
  details: Record<string, unknown> | null;
};

type Nguoi = { id: string; email: string | null; phone: string | null; full_name: string | null; role: string | null };

export async function quetTinHetHan(
  admin: SupabaseClient,
): Promise<{ daHa: number; daNhac: number }> {
  const bayGio = new Date();
  const moc = new Date(bayGio.getTime() + NGAY_NHAC_TRUOC * 86_400_000);

  let daHa = 0;
  let daNhac = 0;

  try {
    // ── 1) ĐÃ HẾT HẠN → ngừng hiển thị ('expired'), mọi hạng ──────────────
    const { data: hetHan } = await admin
      .from("listings")
      .select("id,title,owner_id,tier,tier_days,tier_expires_at,details")
      .eq("status", "approved")
      .lt("tier_expires_at", bayGio.toISOString())
      .limit(200);

    const dsHet = (hetHan ?? []) as Tin[];

    for (const tin of dsHet) {
      // Hết hạn VIP của tin nâng từ Basic → về lại Basic, chạy tiếp số ngày Basic còn lại lúc nâng.
      const conLai = Number(tin.details?.sau_vip_con_lai_ms ?? 0);
      if (tin.tier !== "basic" && conLai > 0) {
        const { sau_vip_con_lai_ms: _bo, ...giu } = tin.details ?? {};
        void _bo;
        const { error: e2 } = await admin
          .from("listings")
          .update({ tier: "basic", tier_days: null, tier_expires_at: new Date(Date.now() + conLai).toISOString(), details: giu })
          .eq("id", tin.id)
          .eq("status", "approved");
        if (!e2) continue;
      }
      const { error } = await admin
        .from("listings")
        // Lượt Up còn lại hết theo tin (luotUp.ts — lượt gắn với kỳ hiển thị).
        .update({ status: "expired", bump_credits: 0 })
        .eq("id", tin.id)
        .eq("status", "approved");
      if (error) {
        await baoLoi({
          noi: "het-han-tin",
          mucDo: "nang",
          tomTat: "Không chuyển được tin hết hạn sang trạng thái hết hạn",
          chiTiet: `Tin ${tin.id} — ${error.message}`,
          hauQua: "Tin hết hạn vẫn hiển thị miễn phí — không công bằng với người đang trả tiền.",
          canLam: `Vào /admin/tin-dang chuyển tin "${tin.title}" sang Hết hạn.`,
          khoa: `het-han:ha-tier:${tin.id}`,
        });
        continue;
      }
      daHa++;

      // TỰ ĐĂNG LẠI (khách tự bật, chuẩn Batdongsan): gửi đăng lại ĐÚNG gói đang dùng —
      // cùng đường với nút Đăng lại (duyệt như tin mới, trừ tiền lúc duyệt). Ví thiếu →
      // ghi chờ nạp (up_cho): nạp đủ là tự gửi; khách nhận tin "đã hết hạn" như thường.
      if (tin.owner_id && tin.details?.tu_dang_lai === true) {
        const plan = tin.details?.plan as { tier?: string; days?: number } | undefined;
        const soNgay = Number(tin.tier_days ?? (plan?.tier === tin.tier ? plan?.days : 0)) || 0;
        const kq = await thucHienUpTin(admin, tin.owner_id, tin.id, tin.tier, soNgay);
        if (!kq.ok && kq.viThieu) {
          await admin.from("up_cho").update({ trang_thai: "huy", ghi_chu: "Thay bằng yêu cầu mới", xong_luc: new Date().toISOString() })
            .eq("listing_id", tin.id).eq("trang_thai", "cho");
          await admin.from("up_cho").insert({ user_id: tin.owner_id, listing_id: tin.id, tier: tin.tier, so_ngay: soNgay });
        }
      }
    }

    if (!BAO_KHACH_HET_HAN) {
      if (daHa > 0) revalidateTag("listings", "max");
      return { daHa, daNhac };
    }

    // ── NHẮN KHÁCH — KHÔNG ĐỂ ZALO KHOÁ (chủ dự án 03/10/2026) ─────────────────
    // · Mỗi KỲ hết hạn của một tin nhắn đúng MỘT lần (dấu theo mốc hạn trong details).
    // · Mỗi KHÁCH tối đa MỘT tin nhắn mỗi 24 giờ cho mỗi loại (sắp hết / đã hết):
    //   nhiều tin cùng lúc thì GỘP vào một tin nhắn; tin tới sau 24 giờ mới nhắn tiếp.
    // · Chỉ tin trong tài khoản khách (tuDang). Tin đăng hộ không nhắn.
    const moc24h = bayGio.getTime() - 86_400_000;

    // ── 1) ĐÃ HẾT HẠN (kể cả gửi bù tin hết hạn mà chưa được nhắn) ──────────────
    const { data: daHet } = await admin
      .from("listings")
      .select("id,title,owner_id,tier,tier_expires_at,details")
      .eq("status", "expired")
      .not("owner_id", "is", null)
      // Quét MỖI PHÚT → chỉ xét tin hết hạn trong 30 ngày gần nhất (đủ để gửi bù mọi tin
      // vừa sót), không đọc lại cả kho tin cũ mỗi phút khi web có hàng nghìn tin.
      .gte("tier_expires_at", new Date(bayGio.getTime() - 30 * 86_400_000).toISOString())
      .limit(1000);
    await nhanTheoKhach(admin, (daHet ?? []) as Tin[], "bao_het_han", moc24h, (ds, chu) => {
      const t = ds[0];
      const ngay = ngayVn(t.tier_expires_at);
      return {
        email: chu.email,
        phone: chu.phone,
        tieuDe: ds.length > 1 ? `${ds.length} tin của bạn đã hết hạn hiển thị` : "Tin của bạn đã hết hạn hiển thị",
        loiNhan: `${ds.length > 1 ? `${ds.length} tin` : "Tin"} của bạn đã hết hạn hiển thị. Mời bạn đăng lại tại coastalland.vn/tai-khoan/tin-dang.`,
        cacDong: ds.map((x) => ({ nhan: `${getTier(x.tier).name} · hết hạn ${ngayVn(x.tier_expires_at)}`, giaTri: x.title })),
        znsTemplateId: MAU_DA_HET_HAN,
        znsData: { ten_khach_hang: chu.full_name || "Quý khách", ngay_het_han: ngay, ma_tin: maTin(t.id), ten_tin: tenGop(ds) },
      };
    });

    // ── 2) SẮP HẾT HẠN → nhắc trước 3 ngày ─────────────────────────────────────
    const { data: sapHet } = await admin
      .from("listings")
      .select("id,title,owner_id,tier,tier_expires_at,details")
      .eq("status", "approved")
      .not("owner_id", "is", null)
      .gte("tier_expires_at", bayGio.toISOString())
      .lte("tier_expires_at", moc.toISOString())
      .limit(500);
    daNhac = await nhanTheoKhach(admin, (sapHet ?? []) as Tin[], "nhac_het_han", moc24h, (ds, chu) => {
      const t = ds[0];
      const conLai = Math.max(0, Math.ceil((new Date(t.tier_expires_at).getTime() - bayGio.getTime()) / 86_400_000));
      return {
        email: chu.email,
        phone: chu.phone,
        tieuDe: `Còn ${conLai} ngày là hết hạn ${ds.length > 1 ? `${ds.length} tin` : "tin"} của bạn`,
        loiNhan: `${ds.length > 1 ? `${ds.length} tin` : "Tin"} của bạn sắp hết hạn hiển thị. Hết hạn, mời bạn đăng lại tại coastalland.vn/tai-khoan/tin-dang.`,
        cacDong: ds.map((x) => ({ nhan: `${getTier(x.tier).name} · hết hạn ${ngayVn(x.tier_expires_at)}`, giaTri: x.title })),
        znsTemplateId: MAU_SAP_HET_HAN,
        znsData: {
          ten_khach_hang: chu.full_name || "Quý khách",
          so_ngay: String(conLai),
          ngay_het_han: ngayVn(t.tier_expires_at),
          ma_tin: maTin(t.id),
          ten_tin: tenGop(ds),
          goi_tin: getTier(t.tier).name,
        },
      };
    });
  } catch (e) {
    await baoLoi({
      noi: "het-han-tin",
      mucDo: "nang",
      tomTat: "Quét tin hết hạn bị lỗi",
      chiTiet: String(e),
      hauQua: "Tin hết hạn có thể còn hiện, và khách không được nhắc.",
      canLam: "Xem log route /api/tin-dang/het-han.",
    });
  }

  // Tin vừa hết hạn phải rời danh sách NGAY, không chờ cache 60 giây.
  if (daHa > 0) revalidateTag("listings", "max");
  return { daHa, daNhac };
}

const ngayVn = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const tenGop = (ds: Tin[]) => (ds.length > 1 ? `${ds[0].title} (và ${ds.length - 1} tin khác)` : ds[0].title);

// Gom tin CHƯA nhắn theo từng khách → mỗi khách MỘT tin nhắn, tối đa một lần / 24 giờ.
// dau = khoá trong details: lưu mốc hạn đã nhắn (dau) + giờ nhắn (dau + "_luc").
async function nhanTheoKhach(
  admin: SupabaseClient,
  ds: Tin[],
  dau: "bao_het_han" | "nhac_het_han",
  moc24h: number,
  soan: (ds: Tin[], chu: Nguoi) => Parameters<typeof guiThongBao>[0],
): Promise<number> {
  const chuaNhan = ds.filter((t) => t.details?.[dau] !== t.tier_expires_at);
  if (chuaNhan.length === 0) return 0;
  const nguoi = await layNguoi(admin, chuaNhan.map((t) => t.owner_id));
  const theoKhach = new Map<string, Tin[]>();
  for (const t of chuaNhan) {
    const chu = nguoi.get(t.owner_id ?? "");
    if (!tuDang(t, chu)) continue;
    theoKhach.set(chu.id, [...(theoKhach.get(chu.id) ?? []), t]);
  }
  let daGui = 0;
  for (const [id, cuaKhach] of theoKhach) {
    const vuaNhan = ds.some((t) => {
      const luc = t.owner_id === id ? t.details?.[`${dau}_luc`] : null;
      return typeof luc === "string" && new Date(luc).getTime() > moc24h;
    });
    if (vuaNhan) continue; // đã nhắn khách này trong 24 giờ — để lượt sau, không dồn tin nhắn
    await guiThongBao(soan(cuaKhach, nguoi.get(id)!));
    // Đánh dấu ngay cả khi gửi hỏng — không thì mỗi phút lại gửi lại. Thư hỏng có sổ sự cố lo.
    const luc = new Date().toISOString();
    for (const t of cuaKhach) {
      await admin
        .from("listings")
        .update({ details: { ...(t.details ?? {}), [dau]: t.tier_expires_at, [`${dau}_luc`]: luc } })
        .eq("id", t.id);
    }
    daGui++;
  }
  return daGui;
}

/** Lấy email/điện thoại của các chủ tin trong MỘT lần hỏi, không hỏi từng người. */
async function layNguoi(admin: SupabaseClient, ids: (string | null)[]): Promise<Map<string, Nguoi>> {
  const co = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (co.length === 0) return new Map();
  const { data } = await admin.from("profiles").select("id,email,phone,full_name,role").in("id", co);
  return new Map(((data ?? []) as Nguoi[]).map((n) => [n.id, n]));
}
