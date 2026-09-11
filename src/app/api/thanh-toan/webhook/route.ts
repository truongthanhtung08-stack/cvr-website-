import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING_DEFAULT, chuanHoaCapHoiVien, vnd, type BillingData, type MemberLevel } from "@/lib/billing";
import { guiThongBao, MAU_NAP_TIEN } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";

// ============================================================================
// PayOS GỌI NGƯỢC VỀ WEB KHI KHÁCH ĐÃ CHUYỂN TIỀN (webhook)
// ----------------------------------------------------------------------------
// Không có bước này thì khách nạp tiền xong VÍ VẪN BẰNG 0 — phải vào ngân hàng
// đối soát rồi cộng tay từng người. Đây là mắt xích bắt buộc để thu tiền tự động.
//
// Luồng đầy đủ:
//   1. Khách bấm "Nạp tiền"  → /api/thanh-toan/tao-don  ghi một dòng `payments`
//      trạng thái `pending` rồi trả link/QR PayOS.
//   2. Khách chuyển khoản    → PayOS gọi POST vào ĐÚNG route này.
//   3. Route này: kiểm chữ ký → đổi `pending` → `paid` → CỘNG VÍ + tổng đã nạp
//      → xét lại CẤP HỘI VIÊN theo tổng đã nạp.
//
// CÀI ĐẶT (chủ dự án làm 1 lần):
//   PayOS → Kênh thanh toán → Webhook URL:
//     https://coastalland.vn/api/thanh-toan/webhook
//   Vercel → Environment Variables: PAYOS_CHECKSUM_KEY + SUPABASE_SERVICE_ROLE_KEY
//
// AN TOÀN:
//   · Chữ ký sai      → từ chối, KHÔNG cộng đồng nào (chống người lạ gọi giả).
//   · Gọi lại nhiều lần → chỉ cộng MỘT lần (PayOS gửi lại khi không nhận được 200).
//   · Lỗi cơ sở dữ liệu → trả 500 để PayOS thử lại, không nuốt mất giao dịch.
// ============================================================================

type PayosData = Record<string, string | number | null | undefined>;

// Chữ ký PayOS: sắp key theo A→Z, nối "key=value&…", ký HMAC-SHA256 bằng checksum key.
function kyDuLieu(data: PayosData, checksumKey: string): string {
  const raw = Object.keys(data)
    .sort()
    .map((k) => {
      const v = data[k];
      return `${k}=${v === null || v === undefined ? "" : v}`;
    })
    .join("&");
  return crypto.createHmac("sha256", checksumKey).update(raw).digest("hex");
}

// So chuỗi theo kiểu chống dò thời gian (timing attack)
function bangNhau(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Cấp hội viên đạt được với tổng tiền đã nạp
function capTheoTongNap(levels: MemberLevel[], tongNap: number): string {
  const dat = [...levels].sort((a, b) => a.minTopup - b.minTopup).filter((l) => tongNap >= l.minTopup);
  return dat.length ? dat[dat.length - 1].id : levels[0]?.id ?? "basic";
}

export async function POST(req: Request) {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!checksumKey) {
    return NextResponse.json({ ok: false, message: "Chưa cấu hình PAYOS_CHECKSUM_KEY." }, { status: 503 });
  }

  let body: { code?: string; desc?: string; success?: boolean; data?: PayosData; signature?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  // PayOS bấm "Kiểm tra" lúc cài webhook: gửi gói rỗng/không có data → trả 200 để nhận URL.
  if (!body?.data || !body?.signature) {
    return NextResponse.json({ ok: true, message: "Webhook đã sẵn sàng." });
  }

  if (!bangNhau(kyDuLieu(body.data, checksumKey), String(body.signature))) {
    // Chữ ký sai = không phải PayOS gửi → trả 200 để bên gọi khỏi thử lại, nhưng KHÔNG cộng tiền.
    return NextResponse.json({ ok: false, message: "Chữ ký không hợp lệ." });
  }

  // Chỉ xử lý giao dịch THÀNH CÔNG (code "00")
  const thanhCong = String(body.data.code ?? body.code ?? "") === "00";
  const orderCode = String(body.data.orderCode ?? "");
  if (!orderCode) return NextResponse.json({ ok: true, message: "Thiếu mã đơn — bỏ qua." });

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  // Tìm đơn đã ghi lúc tạo link thanh toán
  const { data: rows, error: loiDoc } = await supabase
    .from("payments")
    .select("id,user_id,amount,status")
    .eq("order_code", orderCode)
    .limit(1);
  if (loiDoc) return NextResponse.json({ ok: false, message: loiDoc.message }, { status: 500 });

  const don = rows?.[0] as { id: string; user_id: string | null; amount: number; status: string } | undefined;
  if (!don) {
    // Không tìm thấy đơn (vd đơn tạo từ máy khác) — ghi lại để đối soát tay, không cộng ví.
    await supabase.from("payments").insert({
      order_code: orderCode,
      amount: Number(body.data.amount ?? 0),
      kind: "topup",
      status: thanhCong ? "paid" : "cancelled",
      note: "PayOS báo về nhưng không tìm thấy đơn gốc — cần đối soát tay.",
    });

    // KHÁCH ĐÃ CHUYỂN TIỀN THẬT mà mình không biết tiền của ai → ví vẫn bằng 0.
    // Đây là kiểu lỗi khách sẽ tự đi kể, phải biết trước khi khách kịp bực.
    if (thanhCong) {
      await baoLoi({
        noi: "payos-webhook",
        mucDo: "chet",
        tomTat: "Tiền đã về nhưng KHÔNG biết của khách nào — ví chưa được cộng",
        chiTiet: `Mã đơn PayOS ${orderCode}, số tiền ${body.data.amount ?? "?"}`,
        hauQua: "Khách mất tiền mà ví vẫn bằng 0.",
        canLam: `Mở /admin/thanh-toan, tìm mã đơn ${orderCode}, đối chiếu sao kê rồi cộng ví tay cho khách.`,
        khoa: `payos:mat-don:${orderCode}`,
      });
    }
    return NextResponse.json({ ok: true, message: "Đã ghi nhận để đối soát." });
  }

  // ĐÃ CỘNG RỒI thì thôi — PayOS gửi lại nhiều lần là chuyện bình thường.
  if (don.status === "paid") return NextResponse.json({ ok: true, message: "Đơn đã xử lý trước đó." });

  if (!thanhCong) {
    await supabase.from("payments").update({ status: "cancelled" }).eq("id", don.id);
    return NextResponse.json({ ok: true, message: "Đơn không thành công — đã ghi nhận." });
  }

  // Số tiền lấy theo ĐƠN GỐC trong sổ, không tin số PayOS gửi lên.
  const soTien = Number(don.amount) || 0;

  // GIÀNH QUYỀN CỘNG TIỀN. Phải đọc `.select("id")` để biết lệnh này có đổi được
  // dòng nào không: PayOS gửi webhook hai lần sát nhau thì CẢ HAI đều đọc thấy
  // "pending" ở trên, nhưng chỉ MỘT lệnh update khớp điều kiện. Không kiểm số
  // dòng thì lệnh trượt vẫn chạy tiếp xuống dưới và CỘNG VÍ LẦN THỨ HAI.
  const { data: gianh, error: loiCapNhat } = await supabase
    .from("payments")
    .update({ status: "paid", note: "PayOS xác nhận đã nhận tiền." })
    .eq("id", don.id)
    .eq("status", "pending") // chốt chặn cuối: chỉ cộng khi vẫn đang chờ
    .select("id");
  if (loiCapNhat) return NextResponse.json({ ok: false, message: loiCapNhat.message }, { status: 500 });
  if (!gianh || gianh.length === 0) {
    return NextResponse.json({ ok: true, message: "Đơn vừa được xử lý bởi lần gọi khác." });
  }

  // ── Cộng ví + tổng đã nạp + xét lại cấp hội viên ──────────────────────────
  if (don.user_id && soTien > 0) {
    const { data: hoSo } = await supabase
      .from("profiles")
      .select("balance,total_topup,email,phone,full_name")
      .eq("id", don.user_id)
      .limit(1);
    const cu = hoSo?.[0] as
      | { balance: number | null; total_topup: number | null; email: string | null; phone: string | null; full_name: string | null }
      | undefined;
    const soDuMoi = Number(cu?.balance ?? 0) + soTien;
    const tongNapMoi = Number(cu?.total_topup ?? 0) + soTien;

    // Ngưỡng cấp hội viên: lấy bản chủ dự án đã đặt trong admin, chưa đặt → giá chuẩn
    const { data: bill } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "billing")
      .limit(1);
    const luu = bill?.[0]?.data as Partial<BillingData> | undefined;
    const levels = chuanHoaCapHoiVien(luu?.levels) ?? BILLING_DEFAULT.levels;

    // CỘNG VÍ NGUYÊN TỬ — để CSDL tự cộng trên số dư hiện tại
    // (update ... set balance = balance + x). Kiểu cũ đọc số dư rồi ghi đè cả
    // cột: admin duyệt tin đúng lúc khách nạp tiền là một trong hai khoản bị
    // ghi đè mất. Xem supabase/migrations/0028_vi_nguyen_tu.sql.
    // ĐIỂM THƯỞNG — trang nạp tiền hứa với khách "Được cộng X điểm thưởng" ngay
    // trước lúc bấm nạp, nên ở đây bắt buộc phải cộng thật và cộng ĐÚNG công
    // thức đó. Trước đây webhook không đụng gì tới points: khách nạp bao nhiêu
    // lần vẫn 0 điểm, vào trang Đổi điểm không có gì để đổi.
    const cs = luu?.points ?? BILLING_DEFAULT.points;
    const diemThuong = cs.active && cs.earnPerVnd > 0 ? Math.floor(soTien / cs.earnPerVnd) : 0;

    const { data: viMoi, error: loiRpc } = await supabase.rpc("cong_vi", {
      p_user: don.user_id,
      p_tien: soTien,
      p_cap: capTheoTongNap(levels, tongNapMoi),
      p_diem: diemThuong,
    });
    // Chưa chạy migration 0028 thì chưa có hàm → quay về cách cũ để tiền của
    // khách vẫn vào ví, không kẹt lại ở cổng.
    const chuaCoHam = loiRpc && /function .* does not exist|schema cache|PGRST202/i.test(loiRpc.message);
    let loiVi = chuaCoHam ? null : loiRpc;
    if (chuaCoHam) {
      const { data: diemCu } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", don.user_id)
        .limit(1);
      ({ error: loiVi } = await supabase
        .from("profiles")
        .update({
          balance: soDuMoi,
          total_topup: tongNapMoi,
          points: Number(diemCu?.[0]?.points ?? 0) + diemThuong,
          member_level: capTheoTongNap(levels, tongNapMoi),
        })
        .eq("id", don.user_id));
    }
    // Số dư báo cho khách: lấy số CSDL vừa trả về (chính xác tuyệt đối), chỉ khi
    // chưa có hàm mới dùng số tự tính.
    const soDuBao = Number((viMoi as { so_du?: number }[] | null)?.[0]?.so_du ?? soDuMoi);
    // Ví lỗi mà đơn đã "paid" → trả 500 để PayOS gửi lại; đơn vẫn "paid" nên
    // lần sau vào nhánh "đã xử lý", KHÔNG cộng hai lần. Dòng tiền vẫn nằm trong
    // sổ payments để đối soát tay.
    if (loiVi) {
      await baoLoi({
        noi: "payos-webhook",
        mucDo: "chet",
        tomTat: "Đơn đã ghi ĐÃ THANH TOÁN nhưng cộng ví cho khách thất bại",
        chiTiet: `Đơn ${don.id} — ${loiVi.message}`,
        hauQua: "Khách đã trả tiền mà số dư không tăng.",
        canLam: `Kiểm tra hồ sơ khách rồi cộng tay ${vnd(soTien)} vào ví, hoặc chờ PayOS gọi lại.`,
        khoa: `payos:cong-vi:${don.id}`,
      });
      return NextResponse.json({ ok: false, message: loiVi.message }, { status: 500 });
    }

    // ── Báo cho khách: đã nhận tiền, số dư mới ──────────────────────────────
    // KHÔNG có hóa đơn ở bước này — nạp ví là khách gửi tiền trước, chưa phải
    // doanh thu. Hóa đơn chỉ phát sinh khi khách DÙNG gói (tin được duyệt).
    // Gửi hỏng cũng KHÔNG được trả lỗi: tiền đã vào ví rồi, trả 500 là PayOS
    // gọi lại → nguy cơ cộng ví hai lần.
    await guiThongBao({
      email: cu?.email,
      phone: cu?.phone,
      tieuDe: "Đã nhận tiền nạp vào ví",
      loiNhan: `Coastal Land đã nhận được khoản nạp của ${cu?.full_name || "quý khách"}.`,
      cacDong: [
        { nhan: "Số tiền nạp", giaTri: vnd(soTien) },
        { nhan: "Số dư hiện tại", giaTri: vnd(soDuBao) },
        ...(diemThuong > 0 ? [{ nhan: "Điểm thưởng cộng thêm", giaTri: diemThuong + " điểm" }] : []),
        { nhan: "Mã giao dịch", giaTri: String(don.id) },
      ],
      znsTemplateId: MAU_NAP_TIEN,
      znsData: {
        ten_khach_hang: cu?.full_name || "Quý khách",
        ma_giao_dich: String(don.id),
        so_tien: vnd(soTien),
        so_du: vnd(soDuBao),
      },
    });
  }

  return NextResponse.json({ ok: true, message: "Đã cộng vào ví." });
}

// PayOS/quản trị gọi thử để xem webhook sống chưa
export async function GET() {
  return NextResponse.json({
    ok: true,
    daCauHinh: Boolean(process.env.PAYOS_CHECKSUM_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY),
    thieu: [
      !process.env.PAYOS_CHECKSUM_KEY && "PAYOS_CHECKSUM_KEY",
      !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean),
  });
}
