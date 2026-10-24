import Link from "next/link";
import type { NhomLienKet } from "@/lib/pseo";
import DanhSachThuGon from "@/components/DanhSachThuGon";

// Khối liên kết nội bộ của hệ pSEO (Template 1 — "Contextual internal linking hub").
// Chỉ liệt kê trang ĐÃ QUA CỔNG CHẤT LƯỢNG (src/lib/pseo.ts) — không dẫn khách vào trang thưa tin.
// Cùng kiểu thẻ với KhuVucLinks để giao diện đồng bộ.
// KIỂU GOOGLE "MỌI NGƯỜI CŨNG TÌM KIẾM" (chủ dự án 18/10/2026, ảnh Google: "làm như Google cả PC và Mobile"): mỗi từ khoá
// một ô xám có kính lúp, 2 cột; phần KHÁC câu đang xem in đậm. GIỮ ĐỦ MỌI liên kết của các nhóm — xương sống pSEO.
// kieuGoogle chỉ bật ở trang kết quả tìm; trang chi tiết tin, tra cứu dự án giữ kiểu nhóm cũ.
export default function LienKetPseo({ nhom, cau = "", kieuGoogle = false }: { nhom: NhomLienKet[]; cau?: string; kieuGoogle?: boolean }) {
  if (nhom.length === 0) return null;
  if (kieuGoogle) {
    // ĐÚNG Ý NGƯỜI ĐANG TÌM (chủ dự án 18/10/2026: "search nhà ở Đà Nẵng ra Huế và đất là sao"): chỉ giữ tìm kiếm CÙNG loại
    // nhà, CÙNG nơi (thu hẹp theo phường, giá, phòng ngủ, pháp lý…); bỏ nhóm tỉnh khác và loại hình khác. Trang chưa có loại
    // nhà (vd "Bán nhà đất Đà Nẵng") thì nhóm loại hình chính là thu hẹp đúng ý → giữ.
    const hep = nhom.filter((g) => g.tieuDe !== "Tỉnh, thành khác" && g.tieuDe !== "Theo loại hình");
    const nguon = hep.some((g) => g.links.length) ? hep : nhom.filter((g) => g.tieuDe !== "Tỉnh, thành khác");
    const links = nguon.flatMap((g) => g.links).filter((l, i, ds) => ds.findIndex((x) => x.href === l.href) === i);
    // Không in đậm (chủ dự án 21/10/2026: in đậm kiểu Google phần khác câu đang xem → chữ bôi đậm vô nghĩa)
    void cau;
    const boiDam = (nhan: string) => nhan;
    return (
      // CHUẨN SEO: khối điều hướng có tên (nav + h2), danh sách liên kết thật (ul/li, thẻ a do máy chủ vẽ sẵn — Google đọc
      // được ngay), chữ liên kết là chính tên trang đích ("Bán căn hộ chung cư Đà Nẵng dưới 3 tỷ"), không chữ chung chung.
      <nav aria-labelledby="moi-nguoi-tim" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 id="moi-nguoi-tim" className="text-[20px] font-normal tracking-tight text-cvr-ink sm:text-[22px]">Mọi người cũng tìm kiếm</h2>
        {/* Thu gọn 8 ô (chủ dự án 24/10/2026: "phần này càng ngày càng dài thêm, cho nút thu gọn") — mục thu vẫn trong HTML */}
        <DanhSachThuGon the="ul" anBangCss soHien={8} className="mt-4 grid max-w-[980px] gap-3 sm:grid-cols-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex items-center justify-between gap-4 rounded-xl bg-[#f1f3f4] px-5 py-3.5 text-[15px] text-cvr-ink transition hover:bg-[#e8eaed] active:scale-[0.99] sm:text-[16px]">
                <span className="min-w-0">{boiDam(l.day ?? l.nhan)}</span>
                <svg aria-hidden className="h-5 w-5 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
              </Link>
            </li>
          ))}
        </DanhSachThuGon>
      </nav>
    );
  }
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="space-y-5 rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        {nhom.map((g) => (
          <div key={g.tieuDe}>
            <h2 className="text-base font-semibold tracking-tight text-cvr-ink sm:text-lg">{g.tieuDe}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center rounded-full border border-cvr-line bg-cvr-surface px-3.5 py-1.5 text-sm text-cvr-ink transition hover:border-cvr-blue hover:text-cvr-blue-ink"
                >
                  {l.nhan}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
