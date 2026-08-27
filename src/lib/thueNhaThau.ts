// ════════════════════════════════════════════════════════════════════════════
// THUẾ NHÀ THẦU NƯỚC NGOÀI (FCT) — MỘT CHỖ TÍNH DUY NHẤT CHO CẢ WEB
//
// Mua dịch vụ của nhà cung cấp nước ngoài (Anthropic, Vercel, Supabase…) thì
// bên Việt Nam phải KHAI VÀ NỘP THUẾ THAY họ. Nộp xong, chứng từ nộp thuế đó
// chính là thuế GTGT đầu vào ĐƯỢC KHẤU TRỪ của công ty — nên không mất tiền,
// chỉ mất công khai. Không khai thì vừa mất khoản khấu trừ đó, vừa bị phạt.
//
// ── CĂN CỨ (tra ngày 28/08/2026) ───────────────────────────────────────────
//   · Tỷ lệ % tính thuế GTGT trên doanh thu — Thông tư 69/2025/TT-BTC
//         dịch vụ 5% · phân phối hàng hóa 1% · sản xuất/vận tải 3% · khác 2%
//   · Tỷ lệ % tính thuế TNDN trên doanh thu — Nghị định 320/2025/NĐ-CP
//         dịch vụ 5% · bản quyền 10% · lãi vay 5% · xây dựng, vận tải 2%
//   · Khấu trừ thuế GTGT nộp thay — Nghị định 181/2025/NĐ-CP:
//         chứng từ hợp lệ gồm CẢ "chứng từ nộp thuế GTGT theo tỷ lệ % nhân với
//         doanh thu thay cho phía nước ngoài" → đưa vào chỉ tiêu [24] và [25].
//   · Thanh toán không dùng tiền mặt bắt buộc với khoản từ 5.000.000đ
//         (Nghị định 181/2025/NĐ-CP) → PHẢI trả bằng thẻ đứng tên Công ty.
//   · Cách xác định doanh thu tính thuế khi hợp đồng NET — Thông tư 20/2026/TT-BTC
//         (thay Thông tư 103/2014), giữ nguyên công thức quy đổi ngược.
//
// ⚠️ KHÔNG áp mức giảm 2% (Nghị quyết 204/2025/QH15) vào tỷ lệ nhà thầu. Nghị
//    quyết chỉ nói giảm 20% tỷ lệ % cho hộ/cá nhân kinh doanh, chưa có hướng
//    dẫn rõ cho nhà thầu nước ngoài. Nộp đủ 5% thì vừa an toàn vừa được khấu
//    trừ hết — nộp thiếu mới bị phạt.
// ════════════════════════════════════════════════════════════════════════════

/** Nhóm nhà cung cấp nước ngoài — quyết định có phải khai thay hay không. */
export type NhomNcc =
  /** Đã đăng ký thuế tại Việt Nam (MST đầu 80) → họ tự nộp, mình KHÔNG khai thay. */
  | "da_dang_ky"
  /** Chưa đăng ký tại Việt Nam → BẮT BUỘC khai nộp thay để lấy chứng từ khấu trừ. */
  | "phai_khai_thay";

/** Bản chất khoản chi — quyết định cặp tỷ lệ % phải áp. */
export type LoaiDichVu = "dich_vu" | "ban_quyen";

export const TY_LE: Record<LoaiDichVu, { gtgt: number; tndn: number; nhan: string }> = {
  // Hosting, API, lưu trữ, quảng cáo, SaaS dùng theo lượng — dịch vụ thông thường.
  dich_vu: { gtgt: 0.05, tndn: 0.05, nhan: "Dịch vụ (GTGT 5% · TNDN 5%)" },
  // Mua quyền sử dụng phần mềm/bản quyền: chuyển giao phần mềm KHÔNG chịu GTGT,
  // nhưng TNDN là 10%. Chỉ chọn khi hợp đồng ghi rõ là license/bản quyền.
  ban_quyen: { gtgt: 0, tndn: 0.1, nhan: "Bản quyền, license phần mềm (GTGT 0% · TNDN 10%)" },
};

/**
 * Nhà cung cấp đã biết — đoán sẵn nhóm để khỏi phải nhớ.
 * Khóa là chuỗi con viết thường xuất hiện trong tên nhà cung cấp.
 *
 * ⚠️ Danh sách này chỉ là GỢI Ý. Nhà cung cấp nước ngoài đăng ký thuế tại VN
 *    liên tục thay đổi — tra lại tại Cổng thông tin điện tử dành cho nhà cung
 *    cấp nước ngoài của Cục Thuế trước khi chốt số. Chọn tay đè được gợi ý.
 */
export const NCC_DA_BIET: { khoa: string; ten: string; nhom: NhomNcc }[] = [
  { khoa: "google", ten: "Google", nhom: "da_dang_ky" },
  { khoa: "facebook", ten: "Facebook", nhom: "da_dang_ky" },
  { khoa: "meta", ten: "Meta", nhom: "da_dang_ky" },
  { khoa: "microsoft", ten: "Microsoft", nhom: "da_dang_ky" },
  { khoa: "apple", ten: "Apple", nhom: "da_dang_ky" },
  { khoa: "anthropic", ten: "Anthropic", nhom: "phai_khai_thay" },
  { khoa: "vercel", ten: "Vercel", nhom: "phai_khai_thay" },
  { khoa: "supabase", ten: "Supabase", nhom: "phai_khai_thay" },
  { khoa: "cloudflare", ten: "Cloudflare", nhom: "phai_khai_thay" },
  { khoa: "resend", ten: "Resend", nhom: "phai_khai_thay" },
  { khoa: "openai", ten: "OpenAI", nhom: "phai_khai_thay" },
];

/** Đoán nhóm từ tên nhà cung cấp. Không nhận ra thì coi như phải khai thay (an toàn). */
export function doanNhom(tenNcc: string): NhomNcc {
  const t = tenNcc.toLowerCase();
  return NCC_DA_BIET.find((n) => t.includes(n.khoa))?.nhom ?? "phai_khai_thay";
}

export type KetQuaFct = {
  /** Doanh thu tính thuế TNDN (đã quy đổi ngược nếu hợp đồng NET). */
  dtTndn: number;
  /** Thuế TNDN nộp thay — chi phí của công ty, KHÔNG được khấu trừ GTGT. */
  thueTndn: number;
  /** Doanh thu tính thuế GTGT (đã quy đổi ngược nếu hợp đồng NET). */
  dtGtgt: number;
  /** Thuế GTGT nộp thay — ĐÂY là số đưa vào chỉ tiêu [24] và [25] của 01/GTGT. */
  thueGtgt: number;
  /** Tổng phải nộp Kho bạc cho tờ khai 01/NTNN. */
  tongNop: number;
};

/**
 * Tính thuế nhà thầu cho một hóa đơn nước ngoài.
 *
 * @param tienVnd  Số tiền trên hóa đơn đã quy đổi sang VNĐ.
 * @param loai     Dịch vụ hay bản quyền — quyết định cặp tỷ lệ %.
 * @param net      true (mặc định) = hợp đồng NET: nhà cung cấp nhận đủ số tiền
 *                 trên hóa đơn, bên Việt Nam chịu thuế → phải quy đổi ngược.
 *                 Trả thẻ cho Anthropic/Vercel/Supabase LUÔN là trường hợp này.
 *                 false = hợp đồng GROSS: số tiền đã bao gồm thuế nhà thầu.
 *
 * Ví dụ NET, dịch vụ, 2.600.000đ:
 *   dtTndn 2.736.842 · thueTndn 136.842
 *   dtGtgt 2.881.939 · thueGtgt 144.097 · tongNop 280.939
 */
export function tinhFct(tienVnd: number, loai: LoaiDichVu = "dich_vu", net = true): KetQuaFct {
  const tien = Math.max(0, Math.round(tienVnd));
  const { gtgt, tndn } = TY_LE[loai];

  if (!net) {
    // Số tiền đã gồm thuế nhà thầu: bóc thuế GTGT ra trước, phần còn lại tính TNDN.
    const dtGtgt = tien;
    const thueGtgt = Math.round(dtGtgt * gtgt);
    const dtTndn = dtGtgt - thueGtgt;
    const thueTndn = Math.round(dtTndn * tndn);
    return { dtTndn, thueTndn, dtGtgt, thueGtgt, tongNop: thueGtgt + thueTndn };
  }

  // Hợp đồng NET — quy đổi ngược:
  //   DT tính TNDN = tiền trả / (1 − tỷ lệ TNDN)
  //   DT tính GTGT = (tiền trả + thuế TNDN nộp thay) / (1 − tỷ lệ GTGT)
  const dtTndn = Math.round(tien / (1 - tndn));
  const thueTndn = dtTndn - tien;
  const dtGtgt = Math.round((tien + thueTndn) / (1 - gtgt));
  const thueGtgt = dtGtgt - (tien + thueTndn);
  return { dtTndn, thueTndn, dtGtgt, thueGtgt, tongNop: thueGtgt + thueTndn };
}

/** Mốc đầu và cuối một tháng — kỳ khai của tờ khai 01/NTNN. */
export function khoangThang(nam: number, thang: number): { tu: Date; den: Date } {
  return {
    tu: new Date(nam, thang - 1, 1, 0, 0, 0, 0),
    den: new Date(nam, thang, 0, 23, 59, 59, 999),
  };
}

/** Hạn nộp tờ khai 01/NTNN: ngày 20 của tháng sau tháng phát sinh. */
export function hanNop(nam: number, thang: number): Date {
  return new Date(nam, thang, 20);
}

/** Tháng thuộc quý nào — dùng để cộng thuế GTGT nộp thay vào tờ khai 01/GTGT quý. */
export function quyCuaThang(thang: number): number {
  return Math.floor((thang - 1) / 3) + 1;
}
