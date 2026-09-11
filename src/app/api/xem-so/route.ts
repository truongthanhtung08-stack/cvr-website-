import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { phatMa, kiemMa, guiMaQuaZalo } from "@/lib/maXacThuc";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { phatVe, docVe } from "@/lib/veXemSo";

// ════════════════════════════════════════════════════════════════════════════
// XEM SỐ NGƯỜI BÁN BẰNG CÁCH XÁC THỰC SỐ CỦA MÌNH (không cần tạo tài khoản)
// ----------------------------------------------------------------------------
// Cách các sàn lớn vẫn làm: khách muốn xem số người bán thì nhập số của chính
// mình, nhận mã, nhập mã là xem được. Không bắt đặt mật khẩu, không bắt điền hồ
// sơ — rào cản thấp hơn hẳn việc đăng ký, nên số người qua được nhiều hơn nhiều.
//
// Đổi lại, sàn có SỐ ĐIỆN THOẠI THẬT ĐÃ XÁC THỰC của người quan tâm, và người
// bán nhận được một lead gọi lại được ngay. Đó chính là vòng chuyển đổi.
//
// HAI BƯỚC, cùng một địa chỉ:
//   1) gửi { listingId, sdt }        → phát mã, gửi qua Zalo
//   2) gửi { listingId, sdt, ma }    → kiểm mã, ghi lead, TRẢ SỐ người bán
//
// SỐ NGƯỜI BÁN KHÔNG BAO GIỜ nằm sẵn trong HTML: chỉ trả về sau khi mã đúng.
// ════════════════════════════════════════════════════════════════════════════
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { listingId?: string; sdt?: string; ma?: string; ten?: string; ve?: string };
  try {
    body = await req.json();
  } catch {
    return loi("Dữ liệu không hợp lệ.", 400);
  }

  const listingId = (body.listingId ?? "").trim();
  const sdt = chuanHoaSdt(body.sdt ?? "");
  const ma = (body.ma ?? "").trim();
  // VÉ — đã xác thực số ở một tin trước đó thì không phải nhập mã lại.
  const sdtTuVe = docVe(body.ve);

  if (!listingId) return loi("Thiếu mã tin.", 400);

  // Có vé còn hạn → bỏ qua cả hai bước mã, trả số ngay.
  if (sdtTuVe) return traSo(listingId, sdtTuVe, body.ten, null);

  if (!laSdtVN(sdt)) return loi("Số điện thoại chưa đúng.", 400);

  // ── BƯỚC 1: PHÁT MÃ ───────────────────────────────────────────────────────
  if (!ma) {
    const phat = await phatMa(sdt, "zalo", "xac-minh-sdt");
    if (!phat.ok) return loi(phat.loi, 429);

    const gui = await guiMaQuaZalo(sdt, phat.ma);
    if (!gui.ok) {
      // Nói THẬT là chưa gửi được và chỉ đường đi tiếp, thay vì bắt khách ngồi
      // đợi một cái mã không bao giờ tới.
      return NextResponse.json(
        {
          ok: false,
          khongGuiDuoc: true,
          loi: "Chưa gửi được mã về số này. Bạn đăng nhập bằng email để xem số nhé.",
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, daGui: true });
  }

  // ── BƯỚC 2: KIỂM MÃ RỒI TRẢ SỐ ────────────────────────────────────────────
  const kiem = await kiemMa(sdt, "xac-minh-sdt", ma);
  if (!kiem.ok) return loi(kiem.loi, 400);

  // Mã đúng → phát vé để lần sau xem tin khác khỏi phải nhập mã lại.
  return traSo(listingId, sdt, body.ten, phatVe(sdt));
}

// ── TRẢ SỐ NGƯỜI BÁN + GHI LEAD ─────────────────────────────────────────────
// Dùng chung cho cả hai đường vào: vừa nhập mã xong, hoặc đã có vé từ trước.
// Cả hai đều là người đã xác thực số, nên đều phải ghi lead — người bán cần biết
// ai vừa hỏi số ở tin nào, kể cả khách quay lại xem tin thứ hai thứ ba.
async function traSo(listingId: string, sdtKhach: string, ten: string | undefined, ve: string | null) {
  const admin = createAdminClient();
  if (!admin) return loi("Máy chủ chưa cấu hình đủ.", 500);

  const { data: tin } = await admin
    .from("listings")
    .select("id,details,status")
    .eq("id", listingId)
    .maybeSingle();

  if (!tin || tin.status !== "approved") return loi("Tin không còn hiển thị.", 404);

  const soNguoiBan = chuanHoaSdt(
    (tin.details as { contact?: { phone?: string } } | null)?.contact?.phone ?? "",
  );
  if (!soNguoiBan) return loi("Tin này chưa có số điện thoại.", 404);

  // GHI LEAD — người bán phải biết ai vừa hỏi số, kể cả khi người đó chưa có tài
  // khoản. viewer_id để trống, còn tên và SỐ ĐÃ XÁC THỰC thì có đủ để gọi lại.
  //
  // CHẶN TRÙNG 24 GIỜ, khớp với hàm reveal_contact dành cho thành viên: cùng một
  // số bấm đi bấm lại một tin thì chỉ ghi một dòng. Không chặn thì danh sách của
  // người bán ngập lên bằng cùng một cái tên, đọc không ra ai là khách mới.
  //
  // Ghi hỏng cũng KHÔNG chặn khách xem số: họ đã xác thực đúng rồi, chặn lại là
  // phạt nhầm người.
  try {
    const hom_qua = new Date(Date.now() - 86_400_000).toISOString();
    const { data: daCo } = await admin
      .from("listing_leads")
      .select("id")
      .eq("listing_id", listingId)
      .eq("viewer_phone", sdtKhach)
      .gt("created_at", hom_qua)
      .limit(1);

    if (!daCo?.length) {
      await admin.from("listing_leads").insert({
        listing_id: listingId,
        viewer_id: null,
        viewer_name: (ten ?? "").trim() || null,
        viewer_phone: sdtKhach,
      });
    }
  } catch {
    /* ghi lead hỏng → vẫn trả số cho khách */
  }

  return NextResponse.json({ ok: true, sdt: soNguoiBan, ...(ve ? { ve } : {}) });
}

function loi(message: string, status: number) {
  return NextResponse.json({ ok: false, loi: message }, { status });
}
