import type { Listing } from "@/lib/data";
import { tatCaTrang, tieuDe, cha, NGUONG_INDEX } from "@/lib/pseo";
import { oLocThemTuNoiDung } from "@/lib/filters";

// ============================================================================
// GỢI Ý CỤM TỪ KHOÁ DÀI (chủ dự án 17/10/2026: "gợi ý theo ý muốn của người dùng! 1 từ khóa dài!")
// ----------------------------------------------------------------------------
// Như Google gợi ý cả câu: "Bán căn hộ Đà Nẵng dưới 3 tỷ", "Cho thuê phòng trọ Huế"… — KHÔNG liệt kê
// vị trí trần. Mỗi cụm là đúng một trang sạch đang có tin thật (bộ trang pSEO tatCaTrang: ≥ NGUONG_INDEX
// tin, trang được index hoặc trang tỉnh gốc), chữ của cụm là tiêu đề trang → bấm là về đúng trang đó.
// Tính ở máy chủ khi dựng trang chủ (cùng bộ tin, không thêm lần gọi nào); máy khách chỉ nhận chữ + link
// (lọc theo chữ gõ ở TimTrangChu). Chỉ chạy ở máy chủ — đừng import hàm này vào component máy khách.
// ============================================================================

// loai: cụm có loại hình (cụ thể) — lúc chưa gõ chỉ hiện loại này
export type CauGoiY = { nhan: string; sub: string; href: string; muc: "ban" | "thue" | "duan"; loai: boolean };

export function goiYTrangChu(tin: Listing[]): CauGoiY[] {
  const ds = [...tatCaTrang(tin).values()]
    .filter((p) => !p.dk.huong && p.n >= NGUONG_INDEX && (p.index || !cha(p.dk)))
    .sort((a, b) => b.n - a.n)
    .map((p) => ({ nhan: tieuDe(p.dk), sub: `${p.n} tin`, href: p.path, muc: p.dk.muc, loai: !!p.dk.cat }));
  // 27/10/2026 (trang chủ 497 KB > ngưỡng 450): TimTrangChu chỉ hiện cụm có loại hình, 6 cụm đầu mỗi mục
  // (`filter(c.muc === mb && c.loai).slice(0, 6)`) → chỉ gửi đúng những cụm đó, cùng thứ tự. Đổi số 6 ở đó thì đổi cả ở đây.
  const dem = { ban: 0, thue: 0 };
  return ds.filter((c) => c.loai && dem[c.muc]++ < 6);
}

// ĐẾM TIN cho nút "Xem N tin" của hàng trường lọc (chủ dự án 17/10/2026): chỉ những trường applyFilters cần,
// gửi một lần trong trang chủ đã dựng sẵn — đếm ngay ở trình duyệt, không gọi máy chủ khi khách chọn lọc.
export type TinDem = {
  id: string; title: string; price: string; area: string; beds?: number; location: string; diaChiTim?: string;
  type: string; purpose: "ban" | "thue"; huong?: string; phapLy?: string; noiThat?: string;
};

export function tinDem(tin: Listing[]): TinDem[] {
  // diaChiTim lặp "mới · cũ · mới" → bỏ phần trùng (20/10/2026, trang chủ nặng); đủ chữ để lọc như cũ
  const gon = (s?: string) => (s ? [...new Set(s.split(" · ").map((x) => x.trim()))].join(" · ") : undefined);
  return tin.map((l) => {
    const diaChiTim = gon(l.diaChiTim);
    // GOM VỀ BỘ LỌC TỔNG (01/11/2026): bản rút gọn không kèm nội dung tin → điền sẵn ô Lọc thêm còn trống từ nội dung (vòng 2,
    // filters.oLocThemTuNoiDung) để "Xem N tin" trang chủ đếm đúng như trang Mua bán / Cho thuê
    const them = oLocThemTuNoiDung(l);
    return {
      // 27/10/2026 (trang chủ 497 KB): id chỉ còn dùng cho công tắc "Tin xác thực" / "Môi giới chuyên nghiệp"
      // (listingVerified/listingProBroker đọc parseInt(id) || 1) → gửi đúng con số đó thay cho mã 36 ký tự, đếm y như cũ.
      id: String(parseInt(l.id, 10) || 1), title: "", price: l.price, area: l.area, beds: them.beds,
      // Có diaChiTim thì bộ lọc dò trên nó (đã chứa location); location chỉ còn cho listingHints lấy tên tỉnh (phần sau dấu phẩy cuối).
      location: diaChiTim ? (l.location.split(",").pop()?.trim() ?? "") : l.location, diaChiTim,
      type: l.type, purpose: l.purpose === "thue" ? "thue" : "ban", huong: them.huong, phapLy: them.phapLy, noiThat: them.noiThat,
    };
  });
}

/** CÂU SEO, pSEO CỦA MỘT MỤC (chủ dự án 01/11/2026: "câu chạy trong ô tìm phải là câu SEO, pSEO của mỗi phần, mỗi trang") — tên
 *  các trang pSEO đang có tin (cùng luật trang được index), nhiều tin trước. Trang con lấy đúng câu của chính nó + trang con của nó. */
export function cauSeoTheoMuc(tin: Listing[], muc: "ban" | "thue"): { nhan: string; href: string }[] {
  return [...tatCaTrang(tin).values()]
    .filter((p) => p.dk.muc === muc && !p.dk.huong && p.n >= NGUONG_INDEX && (p.index || !cha(p.dk)))
    .sort((a, b) => b.n - a.n)
    .map((p) => ({ nhan: tieuDe(p.dk), href: p.path }));
}
