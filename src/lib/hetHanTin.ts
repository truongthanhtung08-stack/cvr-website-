import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTier, type TierId } from "@/lib/packages";
import { guiThongBao } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";

// ════════════════════════════════════════════════════════════════════════════
// TIN HẾT HẠN GÓI — NHẮC TRƯỚC 3 NGÀY, HẾT HẠN THÌ NGỪNG HIỂN THỊ (như BĐS)
//
// ĐỔI 25/09/2026 (chủ dự án chốt, theo Batdongsan): hết hạn → trạng thái
// 'expired'. Tin RỜI KHỎI mọi danh sách, KHÔNG xoá; link cũ vẫn mở, trang tin
// ghi "đã hết hạn" và ẩn số. Khách "Up tin" (gia hạn, ngày tính lại từ đầu) để
// hiện lại. Áp cho MỌI hạng, kể cả tin thường. Tin nhập từ admin (không có
// tier_expires_at) không bao giờ hết hạn. Đoạn dưới đây là ghi chú của cách cũ.
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

const NGAY_NHAC_TRUOC = 3;

// TIN THƯỜNG SAU VIP (chủ dự án chốt 25/09/2026): tin VIP có ghi mốc này trong
// details thì hết hạn VIP KHÔNG ngừng hiển thị ngay mà TỤT VỀ TIN THƯỜNG, chạy
// tới đúng mốc đó rồi mới hết hạn như mọi tin. Máy chỉ làm theo mốc đã ghi,
// không tự suy ra. Up tin xoá mốc này (reset từ đầu).
export const KHOA_SAU_VIP = "sau_vip_thuong_den";

type Tin = {
  id: string;
  title: string;
  owner_id: string | null;
  tier: TierId;
  tier_expires_at: string;
  details: Record<string, unknown> | null;
};

type Nguoi = { id: string; email: string | null; phone: string | null; full_name: string | null };

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
      .select("id,title,owner_id,tier,tier_expires_at,details")
      .eq("status", "approved")
      .lt("tier_expires_at", bayGio.toISOString())
      .limit(200);

    const dsHet = (hetHan ?? []) as Tin[];
    const nguoi = await layNguoi(admin, dsHet.map((t) => t.owner_id));

    for (const tin of dsHet) {
      // ── VIP có "tin thường sau VIP" còn hạn → tụt về tin thường, KHÔNG ẩn ──
      const sauVip = tin.details?.[KHOA_SAU_VIP];
      if (tin.tier !== "basic" && typeof sauVip === "string" && new Date(sauVip).getTime() > bayGio.getTime()) {
        const { [KHOA_SAU_VIP]: _bo, nhac_het_han: _nhac, ...conLai } = tin.details ?? {};
        void _bo; void _nhac;
        const { data: tut, error: loiTut } = await admin
          .from("listings")
          .update({ tier: "basic", tier_expires_at: sauVip, details: conLai })
          .eq("id", tin.id)
          .eq("status", "approved")
          .eq("tier", tin.tier) // ai giành được mới báo — chạy hai lần không báo hai lần
          .select("id");
        if (loiTut || !tut?.length) continue;
        daHa++;
        const chuTut = nguoi.get(tin.owner_id ?? "");
        await guiThongBao({
          email: chuTut?.email,
          phone: chuTut?.phone,
          tieuDe: "Gói VIP của tin đã hết hạn",
          loiNhan: `Tin chuyển về tin thường và vẫn hiển thị đến ${new Date(sauVip).toLocaleDateString("vi-VN")}. ` +
            `Muốn lấy lại vị trí VIP, vào coastalland.vn/tai-khoan/tin-dang bấm Up tin.`,
          cacDong: [
            { nhan: "Tin đăng", giaTri: tin.title },
            { nhan: "Gói vừa hết hạn", giaTri: getTier(tin.tier).name },
            { nhan: "Tin thường đến", giaTri: new Date(sauVip).toLocaleDateString("vi-VN") },
          ],
        });
        continue;
      }

      const { error } = await admin
        .from("listings")
        .update({ status: "expired" })
        .eq("id", tin.id)
        .eq("status", "approved"); // ai giành được mới báo — chạy hai lần không báo hai lần
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

      const chu = nguoi.get(tin.owner_id ?? "");
      await guiThongBao({
        email: chu?.email,
        phone: chu?.phone,
        tieuDe: "Tin của bạn đã hết hạn hiển thị",
        loiNhan:
          `Tin đã tạm ngừng hiển thị trên Coastal Land (nội dung, ảnh vẫn giữ nguyên). ` +
          `Để hiện lại, vào coastalland.vn/tai-khoan/tin-dang chọn tin rồi bấm Up tin.`,
        cacDong: [
          { nhan: "Tin đăng", giaTri: tin.title },
          { nhan: "Gói vừa hết hạn", giaTri: getTier(tin.tier).name },
          { nhan: "Hết hạn ngày", giaTri: new Date(tin.tier_expires_at).toLocaleDateString("vi-VN") },
        ],
      });
    }

    // ── 2) SẮP HẾT HẠN → nhắc trước 3 ngày (mọi hạng) ─────────────────────
    const { data: sapHet } = await admin
      .from("listings")
      .select("id,title,owner_id,tier,tier_expires_at,details")
      .eq("status", "approved")
      .gte("tier_expires_at", bayGio.toISOString())
      .lte("tier_expires_at", moc.toISOString())
      .limit(200);

    const dsSap = (sapHet ?? []) as Tin[];
    // Đã nhắc cho ĐÚNG mốc hết hạn này rồi thì thôi. So theo mốc chứ không theo
    // cờ đúng/sai: khách gia hạn xong mốc đổi, lần tới vẫn được nhắc lại.
    const canNhac = dsSap.filter((t) => t.details?.nhac_het_han !== t.tier_expires_at);
    const nguoi2 = await layNguoi(admin, canNhac.map((t) => t.owner_id));

    for (const tin of canNhac) {
      const chu = nguoi2.get(tin.owner_id ?? "");
      const hetNgay = new Date(tin.tier_expires_at);
      const conLai = Math.max(0, Math.ceil((hetNgay.getTime() - bayGio.getTime()) / 86_400_000));
      const sauVipNhac = tin.details?.[KHOA_SAU_VIP];
      const tutVeThuong = tin.tier !== "basic" && typeof sauVipNhac === "string";

      await guiThongBao({
        email: chu?.email,
        phone: chu?.phone,
        tieuDe: `Còn ${conLai} ngày là hết hạn gói tin`,
        loiNhan: tutVeThuong
          ? `Hết hạn VIP thì tin về tin thường, hiển thị đến ${new Date(sauVipNhac).toLocaleDateString("vi-VN")}. ` +
            `Up tin tại coastalland.vn/tai-khoan/tin-dang để giữ vị trí VIP.`
          : `Hết hạn thì tin tạm ngừng hiển thị cho tới khi bạn Up tin. ` +
            `Up tin tại coastalland.vn/tai-khoan/tin-dang.`,
        cacDong: [
          { nhan: "Tin đăng", giaTri: tin.title },
          { nhan: "Gói hiện tại", giaTri: getTier(tin.tier).name },
          { nhan: "Hết hạn ngày", giaTri: hetNgay.toLocaleDateString("vi-VN") },
        ],
      });

      // Đánh dấu ngay cả khi gửi hỏng — không thì mỗi lần chạy lại gửi lại,
      // ngày hai lần, suốt ba ngày. Thư hỏng đã có sổ sự cố lo.
      await admin
        .from("listings")
        .update({ details: { ...(tin.details ?? {}), nhac_het_han: tin.tier_expires_at } })
        .eq("id", tin.id);
      daNhac++;
    }
  } catch (e) {
    await baoLoi({
      noi: "het-han-tin",
      mucDo: "nang",
      tomTat: "Quét tin hết hạn bị lỗi",
      chiTiet: String(e),
      hauQua: "Tin hết gói vẫn giữ vị trí ưu tiên, và khách không được nhắc gia hạn.",
      canLam: "Xem log route /api/hoa-don/nhac-xuat.",
    });
  }

  // Tin vừa hết hạn phải rời danh sách NGAY, không chờ cache 60 giây.
  if (daHa > 0) revalidateTag("listings", "max");
  return { daHa, daNhac };
}

/** Lấy email/điện thoại của các chủ tin trong MỘT lần hỏi, không hỏi từng người. */
async function layNguoi(admin: SupabaseClient, ids: (string | null)[]): Promise<Map<string, Nguoi>> {
  const co = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (co.length === 0) return new Map();
  const { data } = await admin.from("profiles").select("id,email,phone,full_name").in("id", co);
  return new Map(((data ?? []) as Nguoi[]).map((n) => [n.id, n]));
}
