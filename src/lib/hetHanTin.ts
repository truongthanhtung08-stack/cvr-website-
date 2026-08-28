import type { SupabaseClient } from "@supabase/supabase-js";
import { getTier, type TierId } from "@/lib/packages";
import { guiThongBao } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";

// ════════════════════════════════════════════════════════════════════════════
// TIN HẾT HẠN GÓI — NHẮC TRƯỚC 3 NGÀY, HẾT HẠN THÌ VỀ TIN THƯỜNG
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
    // ── 1) ĐÃ HẾT HẠN → hạ về tin thường ──────────────────────────────────
    const { data: hetHan } = await admin
      .from("listings")
      .select("id,title,owner_id,tier,tier_expires_at,details")
      .eq("status", "approved")
      .neq("tier", "basic")
      .lt("tier_expires_at", bayGio.toISOString())
      .limit(200);

    const dsHet = (hetHan ?? []) as Tin[];
    const nguoi = await layNguoi(admin, dsHet.map((t) => t.owner_id));

    for (const tin of dsHet) {
      const { error } = await admin
        .from("listings")
        .update({ tier: "basic" })
        .eq("id", tin.id)
        .eq("tier", tin.tier); // ai giành được mới báo — chạy hai lần không báo hai lần
      if (error) {
        await baoLoi({
          noi: "het-han-tin",
          mucDo: "nang",
          tomTat: "Không hạ được tin hết hạn về tin thường",
          chiTiet: `Tin ${tin.id} — ${error.message}`,
          hauQua: "Khách hết hạn gói nhưng vẫn giữ vị trí ưu tiên — không công bằng với người đang trả tiền.",
          canLam: `Vào /admin/tin-dang sửa tin "${tin.title}" về gói thường.`,
          khoa: `het-han:ha-tier:${tin.id}`,
        });
        continue;
      }
      daHa++;

      const chu = nguoi.get(tin.owner_id ?? "");
      await guiThongBao({
        email: chu?.email,
        phone: chu?.phone,
        tieuDe: "Gói tin của bạn đã hết hạn",
        loiNhan:
          `Tin vẫn đang hiển thị bình thường, chỉ không còn ở vị trí ưu tiên nữa. ` +
          `Muốn lấy lại vị trí, vào coastalland.vn/tai-khoan/tin-dang chọn tin rồi mua gói mới.`,
        cacDong: [
          { nhan: "Tin đăng", giaTri: tin.title },
          { nhan: "Gói vừa hết hạn", giaTri: getTier(tin.tier).name },
          { nhan: "Hết hạn ngày", giaTri: new Date(tin.tier_expires_at).toLocaleDateString("vi-VN") },
        ],
      });
    }

    // ── 2) SẮP HẾT HẠN → nhắc trước 3 ngày ────────────────────────────────
    const { data: sapHet } = await admin
      .from("listings")
      .select("id,title,owner_id,tier,tier_expires_at,details")
      .eq("status", "approved")
      .neq("tier", "basic")
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

      await guiThongBao({
        email: chu?.email,
        phone: chu?.phone,
        tieuDe: `Còn ${conLai} ngày là hết hạn gói tin`,
        loiNhan:
          `Hết hạn thì tin vẫn hiển thị, nhưng tụt về tin thường và mất vị trí ưu tiên. ` +
          `Gia hạn tại coastalland.vn/tai-khoan/tin-dang.`,
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

  return { daHa, daNhac };
}

/** Lấy email/điện thoại của các chủ tin trong MỘT lần hỏi, không hỏi từng người. */
async function layNguoi(admin: SupabaseClient, ids: (string | null)[]): Promise<Map<string, Nguoi>> {
  const co = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (co.length === 0) return new Map();
  const { data } = await admin.from("profiles").select("id,email,phone,full_name").in("id", co);
  return new Map(((data ?? []) as Nguoi[]).map((n) => [n.id, n]));
}
