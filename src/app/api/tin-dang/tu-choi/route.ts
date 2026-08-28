import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiThongBao, type KetQuaKenh } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";

// ============================================================================
// TỪ CHỐI TIN — GHI LÝ DO + BÁO KHÁCH
// ----------------------------------------------------------------------------
// Trước đây admin chỉ có "Duyệt" và "Ẩn". Tin không đạt thì đành để im hoặc ẩn
// đi — khách KHÔNG nhận được gì, cứ ngồi chờ tin lên sóng, còn mình thì mất một
// khách có thể đã sửa lại là đăng được.
//
// KHÔNG DÍNH TIỀN NONG: chỉ tin đang chờ duyệt (pending) mới từ chối được, mà
// tin chờ duyệt thì chưa bị trừ ví đồng nào (tiền chỉ trừ lúc duyệt). Nên ở đây
// không hoàn tiền, không ghi doanh thu, không hóa đơn.
//
// LÝ DO LƯU Ở ĐÂU: cột `details` (jsonb) đã có sẵn — không phải thêm cột, không
// phải chạy migration. Ghi đè có gộp để giữ nguyên mọi thứ khách đã nhập.
// ============================================================================
export const dynamic = "force-dynamic";

const DAI_TOI_DA = 300;

export async function POST(request: Request) {
  // ── 1. Chỉ admin ──────────────────────────────────────────────────────────
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Chưa đăng nhập", 401);
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return loi("Chỉ quản trị viên được từ chối tin", 403);

  const { id, lyDo } = (await request.json().catch(() => ({}))) as { id?: string; lyDo?: string };
  if (!id) return loi("Thiếu mã tin", 400);

  // Lý do là BẮT BUỘC: từ chối mà không nói vì sao thì khách không biết sửa gì,
  // gửi lại vẫn sai — mất công cả hai bên.
  const ly = (lyDo ?? "").trim().slice(0, DAI_TOI_DA);
  if (!ly) return loi("Phải ghi lý do từ chối để khách biết cần sửa gì", 400);

  const admin = createAdminClient();
  if (!admin) return loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ — chưa từ chối tin được.", 500);

  // ── 2. Lấy tin ────────────────────────────────────────────────────────────
  const { data: tin, error: loiTin } = await admin
    .from("listings")
    .select("id,title,owner_id,status,details")
    .eq("id", id)
    .single();
  if (loiTin || !tin) return loi("Không tìm thấy tin", 404);

  // Tin đã lên sóng là đã trừ tiền của khách rồi — gỡ xuống phải hoàn tiền, đó
  // là việc khác. Ở đây chặn lại, bảo admin dùng nút "Ẩn".
  if (tin.status !== "pending") {
    return loi(
      `Chỉ từ chối được tin đang chờ duyệt. Tin này đang ở trạng thái "${tin.status}" — dùng nút Ẩn.`,
      400,
    );
  }

  // ── 3. Đổi trạng thái + ghi lý do ─────────────────────────────────────────
  const details = (tin.details ?? {}) as Record<string, unknown>;
  const { error: loiGhi } = await admin
    .from("listings")
    .update({
      status: "rejected",
      details: { ...details, ly_do_tu_choi: ly, tu_choi_luc: new Date().toISOString() },
    })
    .eq("id", id)
    .eq("status", "pending"); // bấm hai lần chỉ ăn lần đầu
  if (loiGhi) return loi(loiGhi.message, 500);

  // ── 4. Báo khách ──────────────────────────────────────────────────────────
  // Gửi hỏng KHÔNG được coi là từ chối hỏng — trạng thái đã đổi xong ở trên rồi.
  // Trả kết quả từng kênh về cho admin nhìn, hỏng thì gọi khách bằng tay.
  let thongBao: KetQuaKenh[] = [];
  try {
    const { data: hs } = await admin
      .from("profiles")
      .select("email,phone,full_name")
      .eq("id", tin.owner_id)
      .limit(1);
    const chu = hs?.[0] as { email: string | null; phone: string | null; full_name: string | null } | undefined;

    thongBao = await guiThongBao({
      email: chu?.email,
      phone: chu?.phone,
      tieuDe: "Tin của bạn chưa được duyệt",
      loiNhan:
        `Chào ${chu?.full_name || "quý khách"}, tin dưới đây chưa đăng được. ` +
        `Bạn sửa lại theo lý do rồi gửi duyệt lại tại coastalland.vn/tai-khoan/tin-dang — ` +
        `tin chưa duyệt thì chưa bị trừ tiền, số dư trong ví vẫn giữ nguyên.`,
      cacDong: [
        { nhan: "Tin đăng", giaTri: tin.title },
        { nhan: "Lý do", giaTri: ly },
      ],
      znsTemplateId: process.env.ZALO_ZNS_TEMPLATE_TU_CHOI,
      znsData: { ten_tin: tin.title, ly_do: ly },
    });
  } catch (e) {
    // Mức 'nhẹ': chỉ ghi sổ, không bắn email. Khách vào /tai-khoan/tin-dang vẫn
    // đọc được lý do ngay trên tin, nên hỏng thư chưa tới mức phải gọi người dậy.
    await baoLoi({
      noi: "tu-choi-tin",
      mucDo: "nhe",
      tomTat: "Từ chối tin xong nhưng không báo được cho khách",
      chiTiet: String(e),
      canLam: "Khách vẫn đọc được lý do trong trang tin của họ — chỉ cần kiểm tra lại khoá Resend.",
    });
    thongBao = [];
  }

  return NextResponse.json({ ok: true, thongBao });
}

function loi(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}
