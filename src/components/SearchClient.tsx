"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { cauDaHieu } from "@/lib/locTuCau";
import { xongTim } from "@/components/VachTim";
import { useEffect, useMemo, useState } from "react";
import PhanTrang from "@/components/PhanTrang";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import FilterBar from "@/components/FilterBar";
import { featuredListings, type Listing } from "@/lib/data";
import {
  filtersFromParams,
  emptyFilters,
  hasActiveFilters,
  type Filters,
  type SortKey,
} from "@/lib/filters";
import { smartFilter, smartSearch, suaChinhTa } from "@/lib/smartSearch";
import CauSuaGoogle from "@/components/CauSuaGoogle";
import { nhanDoiHienThi, khoaThe } from "@/lib/nhanDoiHienThi";
import { locDanhSach } from "@/lib/locDanhSach";
import { useSoMoiTrang } from "@/lib/useSoMoiTrang";


// Trang kết quả tìm kiếm chung (đích của ô tìm kiếm ở Hero + nút "Xem thêm" trang chủ).
// Dùng HỆ LỌC THÔNG MINH chung với /mua-ban, /cho-thue:
//   • KHÔNG giới hạn khu vực — FilterBar phủ toàn bộ Tỉnh/Quận/Phường.
//   • Từ khoá khớp không phân biệt dấu + sửa lỗi gõ (applyFilters → normalizeVi).
//   • Hiểu đúng tham số từ Hero: tinh/quan/phuong, loai (nhiều loại), giaMin/giaMax,
//     dtMin/dtMax, pn, huong, q, mode.
// items: tin THẬT từ Supabase (server truyền xuống). Không truyền → dữ liệu mẫu.
export default function SearchClient({
  items = featuredListings,
  itemsHetHan = [],
}: {
  items?: Listing[];
  // Tin ĐÃ HẾT HẠN — xếp SAU toàn bộ tin còn hạn, chỉ lấy tin khớp đủ (chốt 03/10/2026).
  itemsHetHan?: Listing[];
}) {
  // coDiaDanh trong điều kiện tính lại của các useMemo dùng địa danh: dữ liệu về sau lần tính đầu thì phải tính lại
  const coDiaDanh = useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const params = useSearchParams();
  const mode = params.get("mode") ?? "";
  // Tab đã chọn ở Hero → danh mục loại hình + nguồn tin theo mục đích.
  const purpose: "ban" | "thue" = mode === "Cho thuê" ? "thue" : "ban";
  // CÂU KHÔNG NÓI MỤC ĐÍCH (không có mode) → lấy CẢ tin bán lẫn tin cho thuê (anh 07/11/2026: "ra cả 2")
  const dungMuc = (l: { purpose?: string | null }) => !mode || (l.purpose ?? "ban") === purpose;

  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(params));
  const [sort] = useState<SortKey>("moi"); // không còn ô xếp (07/11/2026): có câu tìm thì xếp theo mức độ khớp
  const [page, setPage] = useState(1);
  const moiTrang = useSoMoiTrang(); // PC 15 · điện thoại 10 — quy định chung mọi danh sách (22/10/2026)
  // Đổi bộ lọc / sắp xếp → luôn quay về trang 1
  const changeFilters = (f: Filters) => { setFilters(f); setPage(1); };
  // Bấm sang trang khác → hiện NGAY từ tin đầu tiên của trang đó
  const goPage = (p: number) => { setPage(p); window.scrollTo({ top: 0 }); };

  // Nguồn tin theo mục đích (bán/thuê) — giá bán tính TỶ, giá thuê tính TRIỆU/THÁNG
  // nên tách riêng để lọc giá đúng đơn vị. Trong mỗi mục đích: KHÔNG giới hạn khu vực.
  // + NHÂN ĐÔI HIỂN THỊ của CVR Diamond (bản kèm dạng CVR Basic — nhanDoiHienThi.ts)
  const base = useMemo(
    () => nhanDoiHienThi(items.filter(dungMuc)),
    [items, purpose, mode], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── TÌM KIẾM THÔNG MINH (tài liệu "Hệ thống bộ lọc và tìm kiếm thông minh") ──
  // Bộ lọc chọn tay chạy trước (khu vực/giá/diện tích…), TỪ KHOÁ do smartSearch
  // xử lý: bóc tách câu dài → xếp 3 tầng (khớp 100% → gần đúng → liên quan) và
  // LUÔN có kết quả. Không gõ từ khoá → giữ nguyên cách sắp xếp cũ.
  // Các trường lọc chọn tay (khu vực · loại hình · giá · diện tích · đặc điểm…)
  // cũng chạy theo cùng logic 3 tầng — chọn quá chặt vẫn không ra màn hình trống.
  const locHits = useMemo(() => smartFilter(base, { ...filters, keyword: "" }), [base, filters, coDiaDanh]); // eslint-disable-line react-hooks/exhaustive-deps
  const loc = useMemo(() => locHits.map((h) => h.item), [locHits]);
  const search = useMemo(() => smartSearch(loc, filters.keyword), [loc, filters.keyword, coDiaDanh]); // eslint-disable-line react-hooks/exhaustive-deps
  const coTuKhoa = filters.keyword.trim().length > 0;
  // Có từ khoá mà địa danh chưa về → chưa hiện kết quả (tìm thiếu phường xã ra sai rồi nhảy; máy chủ dựng cũng vậy để khớp)
  const choDiaDanh = coTuKhoa && !coDiaDanh;
  // SỬA CHÍNH TẢ KIỂU GOOGLE — cùng luật trang Mua bán / Cho thuê (anh 07/11/2026): gõ sai → tìm theo câu đã sửa + dòng "Đang hiển thị kết quả cho"
  const nguyenVan = params.get("nguyenvan") === "1";
  const cauSua = useMemo(() => (!nguyenVan && coDiaDanh && filters.keyword.trim() ? suaChinhTa(filters.keyword) : null), [nguyenVan, filters.keyword, coDiaDanh]);
  // DÒNG GOOGLE viết từ CÁI WEB ĐÃ HIỂU (loại hình, nơi — anh 07/11/2026), không phải câu sửa từng chữ
  const cauHien = useMemo(() => (!nguyenVan && coDiaDanh && filters.keyword.trim() ? cauDaHieu(filters.keyword, purpose) : null), [nguyenVan, filters.keyword, coDiaDanh, purpose]); // eslint-disable-line react-hooks/exhaustive-deps
  const locThat = useMemo(() => (cauSua ? { ...filters, keyword: cauSua } : filters), [cauSua, filters]);
  const linkNguyenVan = (() => { const sp = new URLSearchParams(params.toString()); sp.set("q", filters.keyword); sp.set("nguyenvan", "1"); return `?${sp.toString()}`; })();


  // Không có tin khớp chặt (câu lạ, hoặc trống) → dùng chung luật nới dần + câu nói rõ của trang Mua bán / Cho thuê
  // (chủ dự án 21/10/2026: không bao giờ 0 kết quả, nhưng gợi ý vô lý là tệ nhất)
  // MỘT BỘ XẾP CHO TOÀN WEB (anh 07/11/2026: "tương tự cho cách hiểu này toàn web"): trang Tìm kiếm dùng đúng locDanhSach như Mua bán /
  // Cho thuê — ý khách (loại hình → nơi → giá…), xếp theo mức khớp. Câu không nói mục đích → cả hai mục (theoMuc = false)
  const chung = useMemo(() => {
    if (choDiaDanh) return null;
    return locDanhSach(items.filter(dungMuc), itemsHetHan.filter(dungMuc), purpose, locThat, sort, 1, undefined, items, !!mode);
  }, [choDiaDanh, items, itemsHetHan, purpose, locThat, sort, mode, coDiaDanh]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = useMemo(() => (choDiaDanh || !chung ? [] : chung.ketQua), [choDiaDanh, chung]);
  // Tra cứu nhanh: tin nào thuộc tầng nào + khớp những chữ gì (để bôi đậm)
  // Kết quả đã hiện → tắt vạch xanh "đang tìm" chung (lọc tại chỗ nên có ngay)
  useEffect(() => { if (!choDiaDanh) xongTim(); }, [results, choDiaDanh]);
  const hitById = useMemo(() => new Map(search.hits.map((h) => [h.item.id, h])), [search]);
  const active = hasActiveFilters(filters);

  // Phân trang: PC 15 · điện thoại 10 tin/trang, kẹp trang hiện tại trong [1, totalPages]
  const totalPages = Math.max(1, Math.ceil(results.length / moiTrang));
  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * moiTrang, current * moiTrang);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">
      {/* MOBILE: ẩn tiêu đề + mô tả để thanh tìm kiếm sát ngay dưới header (không chừa khoảng trống).
          Vẫn giữ trong DOM cho SEO (hidden = display:none, Google vẫn đọc). */}
      <h1 className="hidden text-2xl font-semibold tracking-tight text-cvr-ink sm:block sm:text-3xl">Tìm kiếm bất động sản</h1>
      <p className="mt-1.5 hidden text-sm text-cvr-muted sm:block">
        Không giới hạn khu vực — gõ khu vực, dự án hay loại hình bất động sản đều ra kết quả.
      </p>

      {/* Thanh lọc thông minh (dùng chung với /mua-ban, /cho-thue) */}
      <div className="mt-0 sm:mt-5">
        <FilterBar value={filters} onChange={changeFilters} purpose={purpose} hintItems={items} />
      </div>

      {/* bỏ hàng chip lặp lại các trường (anh 07/11/2026: "không cần list ra như vậy" — trường Loại BĐS đã ghi loại hình CHA) */}
      {cauHien && <CauSuaGoogle cauSua={cauHien} goc={filters.keyword} linkNguyenVan={linkNguyenVan} />}

      {/* Tổng kết + sắp xếp + xoá lọc.
          id="ket-qua": bấm Tìm / Enter / chọn gợi ý là cuộn thẳng xuống đây. */}
      <div id="ket-qua" className="mb-5 mt-5 flex scroll-mt-20 flex-wrap items-center justify-between gap-3 sm:scroll-mt-24">
        <p className="text-sm text-cvr-body">
          {/* số "phù hợp" = tin KHỚP ĐỦ, không đếm tin tương tự (anh 07/11/2026) */}
          {choDiaDanh ? null : active ? (chung?.khop ? <><span className="font-bold text-cvr-ink">{chung.khop}</span> bất động sản phù hợp</> : null) : "Tin mua bán, cho thuê nhà đất mới nhất"}
        </p>
        {/* bỏ nút "Xoá lọc" và ô xếp "Mới nhất" (anh 07/11/2026: "không cần") — kết quả xếp tin khớp chính xác nhất lên trên */}
      </div>

      {/* Kết quả — 8 tin/trang, có phân trang 1,2,3… */}
      {choDiaDanh ? null : results.length > 0 ? (
        <>
          {/* Nhãn TẦNG KẾT QUẢ — hiện đúng chất lượng khớp của nhóm tin đang xem
              (khớp 100% · gần đúng · liên quan). Không gõ từ khoá thì không hiện. */}
          {chung?.thongBao && <p className="mb-3 text-sm font-medium text-cvr-body">{chung.thongBao}</p>}
          

          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((item) => (
              <PropertyCard key={khoaThe(item)} item={item} terms={hitById.get(item.id)?.matched ?? []} />
            ))}
          </div>

          <PhanTrang hienTai={current} tong={totalPages} doiTrang={goPage} className="mt-10" />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-cvr-line py-20 text-center">
          <svg className="mb-4 h-12 w-12 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <p className="text-cvr-body">{chung?.thongBao ?? "Không tìm thấy bất động sản phù hợp."}</p>
          <p className="mt-1 text-sm text-cvr-muted">Thử nới rộng bộ lọc hoặc xoá bớt từ khoá.</p>
          <button
            type="button"
            onClick={() => changeFilters(emptyFilters())}
            className="mt-5 rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-body"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
