import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTier, type TierId } from "@/lib/packages";
import { guiThongBao, maTin, MAU_DA_HET_HAN, MAU_SAP_HET_HAN } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";

// CÔNG TẮC BÁO KHÁCH VỀ HẾT HẠN (email/Zalo "sắp hết hạn" + "đã hết hạn").
// Chủ dự án chốt 03/10/2026: chỉ đổi khi CHỦ DỰ ÁN YÊU CẦU. Tắt thì tin vẫn chuyển
// 'expired' đúng giờ, rời mọi danh sách, chỉ không nhắn khách.
// 03/10 (sau): BẬT — nhưng CHỈ nhắn khách TỰ đăng ký · đăng nhập · đăng tin (xem tuDang).
// Tin admin đăng hộ / nhập hàng loạt → không nhắn. Đặt false = tắt hẳn.
const BAO_KHACH_HET_HAN = true;

// KHÁCH TỰ ĐĂNG: tin có chủ là khách (không phải admin) và gửi qua FORM CỦA KHÁCH
// (web PostListingForm / Mini App — chỉ 2 form này ghi details.plan = gói khách tự chọn;
// form admin đăng hộ và nhập hàng loạt không ghi). Tự đăng tin thì đã tự đăng ký + đăng nhập.
function tuDang(tin: Tin, chu: Nguoi | undefined): chu is Nguoi {
  return !!chu && chu.role !== "admin" && !!tin.details && "plan" in tin.details;
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
      .select("id,title,owner_id,tier,tier_expires_at,details")
      .eq("status", "approved")
      .lt("tier_expires_at", bayGio.toISOString())
      .limit(200);

    const dsHet = (hetHan ?? []) as Tin[];
    const nguoi = await layNguoi(admin, dsHet.map((t) => t.owner_id));

    for (const tin of dsHet) {
      const { error } = await admin
        .from("listings")
        // Lượt Up còn lại hết theo tin (luotUp.ts — lượt gắn với kỳ hiển thị).
        .update({ status: "expired", bump_credits: 0 })
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

      if (!BAO_KHACH_HET_HAN) continue; // đang tắt báo khách — tin vẫn chuyển Hết hạn đúng giờ
      const chu = nguoi.get(tin.owner_id ?? "");
      if (!tuDang(tin, chu)) continue; // tin admin đăng hộ / nhập hàng loạt — không nhắn
      await guiThongBao({
        email: chu?.email,
        phone: chu?.phone,
        tieuDe: "Tin của bạn đã hết hạn hiển thị",
        loiNhan:
          `Tin của bạn đã hết hạn hiển thị ngày ${new Date(tin.tier_expires_at).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}. ` +
          `Mời bạn đăng lại tại coastalland.vn/tai-khoan/tin-dang.`,
        cacDong: [
          { nhan: "Tin đăng", giaTri: tin.title },
          { nhan: "Gói vừa hết hạn", giaTri: getTier(tin.tier).name },
          { nhan: "Hết hạn ngày", giaTri: new Date(tin.tier_expires_at).toLocaleDateString("vi-VN") },
        ],
        znsTemplateId: MAU_DA_HET_HAN,
        znsData: {
          ten_khach_hang: chu?.full_name || "Quý khách",
          ngay_het_han: new Date(tin.tier_expires_at).toLocaleDateString("vi-VN"),
          ma_tin: maTin(tin.id),
          ten_tin: tin.title,
        },
      });
    }

    // ── 2) SẮP HẾT HẠN → nhắc trước 3 ngày (mọi hạng) ─────────────────────
    // Đang tắt báo khách → bỏ HẲN bước nhắc (không đánh dấu đã nhắc), để khi bật lại
    // các tin sắp hết hạn vẫn được nhắc đúng.
    if (!BAO_KHACH_HET_HAN) {
      if (daHa > 0) revalidateTag("listings", "max");
      return { daHa, daNhac };
    }
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
      if (!tuDang(tin, chu)) continue; // tin admin đăng hộ / nhập hàng loạt — không nhắc
      const hetNgay = new Date(tin.tier_expires_at);
      const conLai = Math.max(0, Math.ceil((hetNgay.getTime() - bayGio.getTime()) / 86_400_000));

      await guiThongBao({
        email: chu?.email,
        phone: chu?.phone,
        tieuDe: `Còn ${conLai} ngày là hết hạn gói tin`,
        loiNhan:
          `Tin của bạn sẽ hết hạn hiển thị ngày ${hetNgay.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}. ` +
            `Hết hạn, mời bạn đăng lại tại coastalland.vn/tai-khoan/tin-dang.`,
        cacDong: [
          { nhan: "Tin đăng", giaTri: tin.title },
          { nhan: "Gói hiện tại", giaTri: getTier(tin.tier).name },
          { nhan: "Hết hạn ngày", giaTri: hetNgay.toLocaleDateString("vi-VN") },
        ],
        znsTemplateId: MAU_SAP_HET_HAN,
        znsData: {
          ten_khach_hang: chu?.full_name || "Quý khách",
          so_ngay: String(conLai),
          ngay_het_han: hetNgay.toLocaleDateString("vi-VN"),
          ma_tin: maTin(tin.id),
          ten_tin: tin.title,
          goi_tin: getTier(tin.tier).name,
        },
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
  const { data } = await admin.from("profiles").select("id,email,phone,full_name,role").in("id", co);
  return new Map(((data ?? []) as Nguoi[]).map((n) => [n.id, n]));
}
