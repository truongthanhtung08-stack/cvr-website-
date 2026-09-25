import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HANG_UP, thucHienUpTin } from "@/lib/upTin";
import type { TierId } from "@/lib/packages";

// ============================================================================
// UP TIN = GIA HẠN GÓI TIN (chủ dự án chốt 25/09/2026) — logic ở src/lib/upTin.ts
//   · Được Up BẤT CỨ LÚC NÀO (tin đang đăng hoặc đã hết hạn), ngày tính lại
//     từ hôm nay, ngày còn dư của gói cũ bỏ.
//   · VÍ THIẾU → ghi yêu cầu vào up_cho (0044) rồi báo số cần nạp. Nạp xong,
//     webhook tự Up đúng gói + thời hạn khách đã chọn — khách không phải bấm lại.
// ============================================================================
export const dynamic = "force-dynamic";

function loi(thongBao: string, code = 400, them: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, loi: thongBao, ...them }, { status: code });
}

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Bạn cần đăng nhập.", 401);

  const { id, tier, soNgay } = (await request.json().catch(() => ({}))) as { id?: string; tier?: string; soNgay?: number };
  if (!id || !tier || !HANG_UP.includes(tier as TierId) || !Number.isInteger(soNgay)) return loi("Thiếu tin, hạng hoặc thời hạn.");

  const admin = createAdminClient();
  if (!admin) return loi("Máy chủ chưa cấu hình đủ.", 500);

  const kq = await thucHienUpTin(admin, user.id, id, tier as TierId, soNgay!);
  if (!kq.ok) {
    if (kq.viThieu) {
      // Ghi yêu cầu chờ nạp — mỗi tin một yêu cầu, bấm lại thì thay yêu cầu cũ.
      await admin.from("up_cho").update({ trang_thai: "huy", ghi_chu: "Thay bằng yêu cầu mới", xong_luc: new Date().toISOString() })
        .eq("listing_id", id).eq("trang_thai", "cho");
      const { error: loiGhi } = await admin.from("up_cho").insert({ user_id: user.id, listing_id: id, tier, so_ngay: soNgay });
      return loi(kq.loi, 402, { viThieu: kq.viThieu, choUp: !loiGhi });
    }
    return loi(kq.loi, kq.code ?? 400);
  }

  revalidateTag("listings", "max"); // tin vừa Up → lên đầu, hiện lại NGAY
  return NextResponse.json({ ok: true, daTru: kq.daTru, mienPhi: kq.mienPhi, soDu: kq.soDu, hetHan: kq.hetHan });
}
