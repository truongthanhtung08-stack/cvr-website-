import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiThongBao, soDienThoaiZalo } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";
import { quetTinHetHan } from "@/lib/hetHanTin";
import { vnd } from "@/lib/billing";

// ============================================================================
// NHẮC XUẤT HÓA ĐƠN CUỐI NGÀY — chạy tự động mỗi tối
// ----------------------------------------------------------------------------
// Chữ ký số là USB token, máy chủ KHÔNG tự ký được — phải có người cắm que USB.
// Nên "tự động hằng ngày" ở đây nghĩa là: web tự gom giao dịch chờ xuất hóa đơn
// rồi TỰ NHẮC, chủ dự án chỉ việc mở admin tải file → VNPT → cắm token → ký.
//
// Không có bước nhắc này thì quên một hôm là hôm đó chưa xuất hóa đơn cho
// khách — vi phạm, mà không ai biết cho tới khi khách hỏi.
//
// Chạy HAI lần mỗi ngày (vercel.json):
//   20:00 giờ VN — nhắc xuất hóa đơn phát sinh trong ngày
//   08:30 giờ VN — vớt lại nếu tối qua lỡ quên
//
// Vì sao cần lần nhắc buổi sáng: VNPT bật "Chặn ký số phát hành hóa đơn nếu quá
// 1 ngày làm việc so với thời điểm lập" — chủ dự án cố ý giữ, vì hóa đơn phải
// xuất trong ngày. Nhưng nghĩa là quên một tối là hôm sau BỊ KHOÁ, không ký
// được nữa, phải gọi VNPT xin mở. Lần nhắc sáng là cơ hội cuối để cứu.
//
// Bảo mật: Vercel Cron tự gắn header "Authorization: Bearer $CRON_SECRET".
// Chưa cắm CRON_SECRET thì route vẫn chạy được để gọi tay lúc thử.
// ============================================================================
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const khoaCron = process.env.CRON_SECRET;
  if (khoaCron && request.headers.get("authorization") !== `Bearer ${khoaCron}`) {
    return NextResponse.json({ ok: false, message: "Không có quyền" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ." },
      { status: 503 },
    );
  }

  // ── Nhân thể quét luôn tin hết hạn gói ────────────────────────────────────
  // Gộp vào đây vì Vercel gói Hobby chỉ cho 2 cron, đã dùng hết cho hóa đơn.
  // Phải chạy TRƯỚC các lệnh return sớm bên dưới — không thì hôm nào không có
  // hóa đơn chờ ký là hôm đó tin hết hạn cũng không ai quét.
  const hetHan = await quetTinHetHan(supabase);

  // ── Giao dịch còn chờ xuất hóa đơn ────────────────────────────────────────
  // Lấy CẢ những ngày trước, không chỉ hôm nay: quên một hôm thì hôm sau vẫn
  // được nhắc, chứ không im lặng bỏ qua.
  const { data, error } = await supabase
    .from("doanh_thu")
    .select("id,ngay_ghi_nhan,tien_hang,tien_thue,tong_tra,hoa_don_loai,mst_nguoi_mua")
    .eq("hoa_don_trang_thai", "chua_xuat")
    .order("ngay_ghi_nhan", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const ds = data ?? [];
  if (ds.length === 0) {
    return NextResponse.json({ ok: true, canNhac: false, hetHan, message: "Không có giao dịch nào chờ xuất hóa đơn." });
  }

  // ── Gom theo ngày để biết phải ký mấy tờ ──────────────────────────────────
  // Mỗi ngày: khách có MST → mỗi giao dịch một tờ riêng; còn lại gộp một tờ tổng.
  const theoNgay = new Map<string, { rieng: number; tong: number }>();
  for (const d of ds) {
    const ngay = new Date(d.ngay_ghi_nhan).toLocaleDateString("vi-VN");
    const o = theoNgay.get(ngay) ?? { rieng: 0, tong: 0 };
    if (d.hoa_don_loai === "rieng") o.rieng++;
    else o.tong++;
    theoNgay.set(ngay, o);
  }

  const soTo = [...theoNgay.values()].reduce((s, o) => s + o.rieng + (o.tong > 0 ? 1 : 0), 0);
  const tongTien = ds.reduce((s, d) => s + Number(d.tong_tra || 0), 0);

  // Có giao dịch của ngày trước còn sót → sắp bị VNPT khoá, phải báo gấp.
  const homNay = new Date().toLocaleDateString("vi-VN");
  const coNgayCu = [...theoNgay.keys()].some((n) => n !== homNay);

  const cacDong = [
    { nhan: "Giao dịch chờ xuất", giaTri: `${ds.length}` },
    { nhan: "Số tờ hóa đơn phải ký", giaTri: `${soTo}` },
    { nhan: "Tổng tiền", giaTri: vnd(tongTien) },
    ...[...theoNgay.entries()].map(([ngay, o]) => ({
      nhan: `Ngày ${ngay}`,
      giaTri: `${o.rieng} hóa đơn riêng` + (o.tong > 0 ? ` + 1 hóa đơn tổng (${o.tong} giao dịch)` : ""),
    })),
  ];

  // ── Gửi cho tất cả admin ──────────────────────────────────────────────────
  const { data: admins } = await supabase
    .from("profiles")
    .select("email,phone")
    .eq("role", "admin");

  const nguoiNhan = (admins ?? []).filter((a) => a.email || a.phone);
  if (nguoiNhan.length === 0) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy admin nào có email hoặc số điện thoại." }, { status: 500 });
  }

  const ketQua = [];
  for (const a of nguoiNhan) {
    ketQua.push(
      await guiThongBao({
        email: a.email,
        phone: soDienThoaiZalo(a.phone) ? a.phone : null,
        tieuDe: coNgayCu
          ? `GẤP — ${soTo} tờ hóa đơn của ngày trước chưa xuất`
          : `Còn ${soTo} tờ hóa đơn chưa xuất hôm nay`,
        loiNhan:
          (coNgayCu
            ? "⚠️ Có hóa đơn của NGÀY TRƯỚC chưa xuất. VNPT chặn ký nếu quá 1 ngày " +
              "làm việc — xử lý ngay hôm nay, để sang mai là khoá, phải gọi VNPT xin mở. "
            : "") +
          "Mở /admin/hoa-don-thue → mục “Hóa đơn chờ phát hành” → tải file → " +
          "vào VNPT Invoice tải lên → cắm USB token ký. Ký xong nhớ bấm “Đánh dấu đã phát hành”.",
        cacDong,
      }),
    );
  }

  // Lời nhắc không tới được ai = coi như không có lời nhắc: quên ký một tối là
  // hôm sau VNPT khoá. Ghi vào sổ sự cố để mở /admin là thấy đỏ ngay — sổ này
  // cứu được cả trường hợp chính Resend đang hỏng nên email không đi được.
  if (!ketQua.flat().some((k) => k.daGui)) {
    await baoLoi({
      noi: "nhac-xuat-hoa-don",
      mucDo: "chet",
      tomTat: `Không gửi được lời nhắc xuất ${soTo} tờ hóa đơn`,
      chiTiet: ketQua.flat().map((k) => `${k.kenh}: ${k.lyDo ?? "không rõ"}`).join(" · "),
      hauQua: "Quên ký trong ngày thì VNPT khoá phát hành, phải gọi tổng đài xin mở.",
      canLam: "Mở /admin/hoa-don-thue ký ngay, rồi kiểm tra khoá Resend.",
    });
  }

  return NextResponse.json({
    ok: true,
    canNhac: true,
    soGiaoDich: ds.length,
    soTo,
    soNguoiNhan: nguoiNhan.length,
    hetHan,
    ketQua: ketQua.flat(),
  });
}
