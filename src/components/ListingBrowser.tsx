"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { xongTim } from "@/components/VachTim";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import PhanTrang from "@/components/PhanTrang";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

// Bản đồ chỉ chạy phía trình duyệt (Leaflet đụng tới window) → nạp động, tắt SSR.
const MapView = dynamic(() => import("@/components/MapViewMo"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-cvr-muted">Đang tải bản đồ…</div>,
});
import PropertyCard from "@/components/PropertyCard";
import TheTinMobile from "@/components/TheTinMobile";
import FilterBar from "@/components/FilterBar";
import { cauThanhBoLoc } from "@/lib/locDanhSach";
import { featuredListings, type Article, type Listing } from "@/lib/data";
import {
  filtersFromParams,
  filtersToParams,
  emptyFilters,
  hasActiveFilters,
  priceRangesFor,
  areaRangesFor,
  normalizeVi,
  type Filters,
  type SortKey,
} from "@/lib/filters";
import { TIER_LABEL, suaChinhTa } from "@/lib/smartSearch";
import { khoaThe } from "@/lib/nhanDoiHienThi";
import { locDanhSach, type KetQuaLoc } from "@/lib/locDanhSach";
import type { DiemBanDo } from "@/components/MapViewGoogle";
import type { TinGoiY } from "@/lib/searchHints";
import LuuTimKiem from "./LuuTimKiem";
import { boDuoiThang } from "@/lib/thang";

export default function ListingBrowser({
  heading,
  purpose = "ban",
  items: itemsTuMayChu,
  itemsHetHan: hetHanTuMayChu,
  nguon,
  choTai,
  soLieu,
  initialFilters,
  chiId,
  boQuaId,
  relevance = false,
  nested = false,
  initialTypes,
  initialProvince,
}: {
  heading: string;
  // Mục đích trang: "ban" = mua bán · "thue" = cho thuê — lọc nguồn tin + danh mục loại hình.
  purpose?: "ban" | "thue";
  // Tin từ Supabase (server truyền xuống) — không truyền thì dùng dữ liệu mẫu.
  items?: Listing[];
  // Tin ĐÃ HẾT HẠN (getListingsHetHan) — xếp SAU toàn bộ tin còn hạn, thẻ gắn nhãn
  // "Tin hết hạn" (chủ dự án chốt 03/10/2026). Chỉ lấy tin khớp ĐỦ bộ lọc / từ khoá.
  // Không truyền (danh sách "Xem thêm" ở trang chủ, tin tương tự…) → tự nạp từ
  // /api/tin-het-han lúc danh sách mở ra — để MỌI danh sách đều có tin hết hạn ở cuối.
  itemsHetHan?: Listing[];
  // Bài viết cho cột phải "Bài viết được quan tâm" (trang Mua bán / Cho thuê).
  // Không truyền → khối này không hiện (vd khi nhúng trong trang chi tiết tin).
  articles?: Article[];
  // Danh sách "tin tương tự": nguồn đã sắp theo độ liên quan → mặc định giữ đúng
  // thứ tự đó (thay vì Mới nhất) và thêm lựa chọn sắp xếp "Liên quan nhất".
  relevance?: boolean;
  // Đặt bên trong một trang đã có khung max-w-7xl + lề ngang (trang chi tiết tin,
  // chi tiết dự án…) → BỎ khung riêng, nếu không lề bị cộng dồn gấp đôi.
  nested?: boolean;
  // Trang DANH MỤC (/mua-ban/can-ho-chung-cu…): mở sẵn đúng loại hình của danh mục.
  // Khách vẫn bỏ chọn / đổi lọc bình thường — đây chỉ là giá trị khởi đầu.
  initialTypes?: string[];
  // Trang KHU VỰC (/mua-ban/da-nang…): mở sẵn đúng tỉnh/thành đang xem.
  initialProvince?: string;
  // NẠP DỮ LIỆU Ở TRÌNH DUYỆT (SEO 15/10/2026): trang danh sách lớn không nhét dữ liệu tin vào
  // HTML nữa mà truyền `nguon`; danh sách tự nạp /api/danh-sach/<nguon> (CDN lưu sẵn, mọi trang
  // dùng chung). `choTai` = khung hiện trong lúc nạp (cùng khung chờ máy chủ đã dựng).
  nguon?: "ban" | "thue";
  choTai?: React.ReactNode;
  // Trang pSEO: bật sẵn bộ lọc theo đường dẫn (giá, phòng ngủ, pháp lý, hướng, phường…).
  // Địa chỉ có tham số lọc riêng thì tham số đó thắng.
  initialFilters?: Partial<Filters>;
  // Khối "Tin tương tự" (trang tin): dữ liệu nạp từ `nguon`, chỉ giữ ĐÚNG các tin này theo ĐÚNG thứ tự
  // liên quan máy chủ đã xếp — để HTML trang tin không phải chở dữ liệu đầy đủ của hàng trăm tin.
  chiId?: string[];
  // Trang chủ "Xem thêm": bỏ các tin đã hiện ở khối trên (danh sách bắt đầu từ tin tiếp theo)
  boQuaId?: string[];
  // Trang pSEO: dòng số liệu riêng của trang dưới H1 (giá rao · diện tích · cập nhật) — thay câu chung
  soLieu?: string;
}) {
  // coDiaDanh trong điều kiện tính lại của các useMemo dùng địa danh: dữ liệu về sau lần tính đầu thì phải tính lại
  const coDiaDanh = useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const params = useSearchParams();

  // Trang không nạp từ máy chủ (tin tương tự truyền thẳng…): lọc ngay ở trình duyệt.
  const items = useMemo(() => itemsTuMayChu ?? featuredListings, [itemsTuMayChu]);
  const [hetHanNap, setHetHanNap] = useState<Listing[]>([]);
  useEffect(() => {
    if (hetHanTuMayChu || nguon) return;
    let huy = false;
    fetch("/api/tin-het-han")
      .then((r) => (r.ok ? r.json() : []))
      .then((ds: Listing[]) => { if (!huy) setHetHanNap(ds); })
      .catch(() => {});
    return () => { huy = true; };
  }, [hetHanTuMayChu, nguon]);
  const itemsHetHan = hetHanTuMayChu ?? hetHanNap;

  const [filtersSong, setFiltersState] = useState<Filters>(() => {
    const f = filtersFromParams(params);
    // Địa chỉ chưa chỉ định loại hình → lấy loại hình của danh mục đang xem
    if (initialTypes?.length && !f.types.length) f.types = [...initialTypes];
    // Trang khu vực: chưa chọn nơi nào → mặc định lọc đúng tỉnh của trang
    if (initialProvince && f.locations.length === 0) f.locations = [{ province: initialProvince }];
    if (initialFilters) {
      const g = initialFilters;
      if (g.locations?.length && f.locations.length === 0) f.locations = g.locations;
      if (g.types?.length && !f.types.length) f.types = [...g.types];
      if (g.priceMax != null && f.priceMax == null && f.priceMin == null) f.priceMax = g.priceMax;
      if (g.beds && !f.beds) f.beds = g.beds;
      if (g.direction && !f.direction) f.direction = g.direction;
      if (g.legal && !f.legal) f.legal = g.legal;
    }
    return f;
  });
  // GÕ MƯỢT (chủ dự án 20/10/2026: màn tìm điện thoại "rất giật và lag"): ô tìm dùng bộ lọc SỐNG (filtersSong) nên chữ hiện
  // ngay; danh sách, đếm kết quả, sửa chính tả dùng bản HOÃN — React dựng lại danh sách lúc rảnh, không chặn từng phím gõ.
  const filtersHoan = useDeferredValue(filtersSong);
  // TỪ KHOÁ CHỈ TÍNH KHI KHÁCH BẤM TÌM (chủ dự án 21/10/2026: "hiểu từ khoá không vội như vậy" — gõ dở "hải" mà thanh lọc đã nhảy
  // Hải Tân). Đang gõ: chỉ hiện gợi ý, KHÔNG lọc lại, KHÔNG gọi máy chủ mỗi phím (trước đây mỗi chữ cái một lượt /loc — tốn hàm
  // Vercel). Bấm Tìm / Enter / chọn gợi ý (sự kiện "cvr-tim") hoặc xoá hết chữ → mới áp từ khoá. Từ khoá trên địa chỉ = đã tìm.
  const tuKhoaSong = useRef(filtersSong.keyword);
  tuKhoaSong.current = filtersSong.keyword;
  const [tuKhoaDaTim, setTuKhoaDaTim] = useState(() => filtersSong.keyword);
  useEffect(() => { if (!filtersSong.keyword.trim()) setTuKhoaDaTim(""); }, [filtersSong.keyword]);
  const filters = useMemo(() => ({ ...filtersHoan, keyword: tuKhoaDaTim }), [filtersHoan, tuKhoaDaTim]);
  // ?sapxep=gia-tang (ô tìm thông minh: câu có "giá rẻ" → giá thấp trước)
  const [sort, setSort] = useState<SortKey>(() => {
    const sx = params.get("sapxep");
    return sx === "gia-tang" || sx === "gia-giam" || sx === "dt-giam" || sx === "gia-m2" ? sx : relevance ? "lien-quan" : "moi";
  });
  // Chế độ BẢN ĐỒ (kiểu Batdongsan): bật là cả trang chuyển sang xem bản đồ,
  // marker chạy theo đúng bộ lọc đang áp dụng.
  const [mapMode, setMapMode] = useState(false);
  // BẤM TÌM PHẢI THẤY KẾT QUẢ ĐỔI (chủ dự án 17/10/2026: "không thể đứng yên như vậy, hãy học Google"): mỗi lần
  // tìm, khối kết quả được vẽ lại với chuyển động mờ → rõ, trồi lên nhẹ.
  const [lanTim, setLanTim] = useState(0);
  useEffect(() => {
    // Bấm tìm mà bộ lọc không đổi (không nạp gì) → báo xong luôn cho vạch xanh chung tắt
    const tang = () => {
      setLanTim((n) => n + 1);
      window.setTimeout(() => setTuKhoaDaTim(tuKhoaSong.current), 0); // chờ ô tìm ghi chữ xong rồi mới chốt từ khoá
      window.setTimeout(() => { if (!dangNap.current) xongTim(); }, 150);
    };
    window.addEventListener("cvr-tim", tang);
    return () => window.removeEventListener("cvr-tim", tang);
  }, []);
  // SỐ TRANG NẰM TRONG ĐỊA CHỈ (?trang=3) — bắt buộc, đừng bỏ.
  // Trước đây số trang chỉ nằm trong bộ nhớ: khách đang ở trang 3, bấm vào một tin
  // rồi bấm Back là văng về trang 1, phải bấm lại 3 lần. Ghi vào địa chỉ thì bấm
  // Back trình duyệt trả đúng ?trang=3, mà gửi link cho nhau cũng ra đúng trang.
  const [page, setPage] = useState(() => {
    const n = parseInt(params.get("trang") ?? "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  });

  // Đổi bộ lọc → luôn quay về trang 1
  const setFilters = (f: Filters) => { setFiltersState(f); setPage(1); ghiTrangVaoDiaChi(1); };

  // Bấm sang trang khác → hiện NGAY từ tin đầu tiên của trang đó (nhảy thẳng lên
  // đầu danh sách, không phải cuộn tay). Áp dụng cho mọi danh sách phân trang.
  const goPage = (p: number) => { setPage(p); ghiTrangVaoDiaChi(p); window.scrollTo({ top: 0 }); };

  // Đường dẫn ?trang=N cho nút phân trang — Google lần theo để tới tin ở các trang sau.
  const linkTrang = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    if (p > 1) sp.set("trang", String(p));
    else sp.delete("trang");
    const q = sp.toString();
    return q ? `?${q}` : "?";
  };

  // Ghi ?trang=N vào địa chỉ mà KHÔNG tải lại trang (replaceState, không thêm bước
  // lịch sử — để nút Back vẫn quay ra chỗ khách vào danh sách, không phải bấm Back
  // đúng bằng số lần đổi trang).
  function ghiTrangVaoDiaChi(p: number) {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (p > 1) u.searchParams.set("trang", String(p));
    else u.searchParams.delete("trang");
    window.history.replaceState(window.history.state, "", u);
  }

  // LỌC Ở MÁY CHỦ (#1b kế hoạch SEO, 17/10/2026): trang có `nguon` gửi bộ lọc + trang đang xem
  // tới /api/danh-sach/<nguon>/loc, chỉ nhận 10 tin của trang đó — không tải cả kho tin.
  const [mayChu, setMayChu] = useState<(KetQuaLoc & { diem?: DiemBanDo[] }) | null>(null);
  const [goiY, setGoiY] = useState<TinGoiY[]>([]);
  // SỬA CHÍNH TẢ KIỂU GOOGLE: gõ sai một chữ cái ("phog") → tìm theo câu đã sửa và báo "Đang hiển thị kết quả cho …";
  // khách bấm "Tìm kiếm thay thế cho …" (?nguyenvan=1) thì tìm đúng nguyên chữ đã gõ.
  const nguyenVan = params.get("nguyenvan") === "1";
  const cauSua = useMemo(() => (!nguyenVan && filters.keyword.trim() ? suaChinhTa(filters.keyword) : null), [nguyenVan, filters.keyword, coDiaDanh]);
  const locThat = cauSua ? { ...filters, keyword: cauSua } : filters;
  const linkNguyenVan = (() => { const sp = new URLSearchParams(params.toString()); sp.set("q", filters.keyword); sp.set("nguyenvan", "1"); return `?${sp.toString()}`; })();
  const yeuCau = JSON.stringify({ boLoc: locThat, sapXep: sort, trang: page, chiId, boQuaId, banDo: mapMode });
  const choDiaDanh = filters.keyword.trim() !== "" && !coDiaDanh;
  const dangNap = useRef(false); // không từ khoá thì luôn false → không gọi thêm lần nào
  useEffect(() => {
    if (!nguon) return;
    // Có từ khoá → chờ địa danh về (sửa chính tả cần nó) rồi mới hỏi MỘT lần — hỏi ngay thì phải hỏi lại khi câu sửa xong (tốn lượt gọi hàm)
    if (choDiaDanh) return;
    let huy = false;
    dangNap.current = true;
    window.dispatchEvent(new Event("cvr-tim-nap")); // vạch xanh chung chạy tới khi danh sách hiện
    const lanDau = mayChu == null;
    fetch(`/api/danh-sach/${nguon}/loc`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: lanDau ? JSON.stringify({ ...JSON.parse(yeuCau), goiY: true }) : yeuCau,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy) return;
        dangNap.current = false;
        xongTim();
        if (!d) return;
        setMayChu(d);
        if (d.goiY) setGoiY(d.goiY);
      })
      .catch(() => { if (!huy) { dangNap.current = false; xongTim(); } });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ gọi lại khi yêu cầu đổi (hoặc địa danh vừa về)
  }, [nguon, yeuCau, choDiaDanh]);
  const taiCho = useMemo(
    () => (nguon ? null : locDanhSach(items, itemsHetHan, purpose, locThat, sort, page)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- locThat suy ra từ filters + cauSua
    [nguon, items, itemsHetHan, purpose, filters, cauSua, sort, page, coDiaDanh],
  );
  const kq = nguon ? mayChu : taiCho;
  const pageItems = kq?.trang ?? [];
  // BÔI ĐẬM KIỂU GOOGLE (chủ dự án 18/10/2026): chữ khách gõ (bỏ chữ nối) in đậm trong tên tin kết quả
  const BO_NOI = new Set(["ban", "mua", "thue", "cho", "can", "tai", "o", "va", "co", "gia", "nha", "dat", "nhu", "cua", "duoi", "tren", "tu", "den"]);
  const tuGo = filters.keyword.split(/\s+/).filter((w) => { const n = normalizeVi(w).replace(/[^a-z0-9]/g, ""); return n.length >= 2 && !BO_NOI.has(n); });
  const chuDam = (id: string) => (kq?.boiDam[id]?.length ? kq.boiDam[id] : tuGo);
  const totalPages = kq?.soTrang ?? 1;
  const current = kq?.trangHienTai ?? 1;
  const provinces = kq?.khuVuc ?? [];
  const coTuKhoa = filters.keyword.trim().length > 0;
  // DÒNG PHÂN CÁCH TẦNG (17/10/2026): ít tin khớp đủ thì web thêm tin gần đúng ngay sau — phải có dòng báo
  // trước tin gần đúng đầu tiên, nếu không khách tưởng tìm sai (vd tìm Quảng Trị lại thấy Đà Nẵng).
  const dongTang = (item: Listing, i: number) => {
    // Chủ dự án 17/10/2026: "1 tin thì ra 1 tin! Muốn gợi ý thì có câu gợi ý ở những địa phương khác".
    // Nhóm: 0 = khớp đủ · 1 = gợi ý cùng tỉnh đang chọn · 2 = gợi ý ở địa phương khác. Đổi nhóm → một dòng tiêu đề.
    const tinhChon = kq?.tinhHieu ?? filters.locations.map((x) => x.province);
    const nhom = (l: Listing) => {
      if ((kq?.tangTheoId?.[l.id] ?? 1) === 1) return 0;
      const tinh = l.location.split(",").pop()?.trim() ?? "";
      return tinhChon.length > 0 && !tinhChon.includes(tinh) ? 2 : 1;
    };
    const n = nhom(item);
    if (i === 0 || n === 0 || n === nhom(pageItems[i - 1])) return null;
    const tieuDe = n === 2 || tinhChon.length !== 1 ? "Gợi ý ở địa phương khác" : `Gợi ý khác tại ${tinhChon[0]}`;
    return (
      <p key={`tang-${item.id}`} className="col-span-full mt-3 border-t border-cvr-line px-4 pb-1 pt-5 text-[15px] font-semibold text-cvr-ink sm:px-0">
        {tieuDe}
      </p>
    );
  };
  const active = hasActiveFilters(filters);
  // TỪ KHOÁ CHUẨN (chủ dự án 17/10/2026: gõ câu thì phải hiện Huế · Căn hộ · Dưới 2 tỷ, không phải câu thô):
  // ô tìm giữ nguyên câu khách gõ; trường lọc + thẻ bên dưới hiện đúng tiêu chí máy đã hiểu.
  // Thẻ lọc hiểu từ câu: chỉ theo từ khoá ĐÃ TÌM — đang gõ dở thì thanh lọc giữ nguyên
  const hieu = useMemo(() => (filtersSong.keyword === tuKhoaDaTim ? cauThanhBoLoc(filtersSong, purpose) : null), [filtersSong, tuKhoaDaTim, purpose, coDiaDanh]); // eslint-disable-line react-hooks/exhaustive-deps -- coDiaDanh: tính lại khi địa danh về

  // Đang nạp dữ liệu → giữ nguyên khung chờ máy chủ đã dựng (không nhấp nháy giao diện)
  if (nguon && !mayChu) return <>{choTai ?? null}</>;

  return (
    // PC: thanh lọc nằm SÁT header, không chừa khoảng trống (file V3 10.08.2026).
    <div className={nested ? "pt-1 sm:pt-6" : "mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-4 lg:px-8"}>
      {/* ── Phần trên kiểu Homedy (gọn): thanh lọc → tiêu đề + bộ đếm.
           Trang cấp 1 KHÔNG dùng breadcrumb (menu đã chỉ vị trí — chuẩn Apple). ── */}
      {/* Máy tính: thanh tìm gọn trong CỘT TIN bên trái (= lg:col-span-3 của lưới 4 cột, khe 24px), như Batdongsan — chủ dự án 18/10/2026 */}
      <div className="lg:w-[calc(75%-6px)]">
        <FilterBar
          value={hieu ? { ...hieu, keyword: filtersSong.keyword } : filtersSong}
          onChange={setFilters}
          purpose={purpose}
          onMap={() => setMapMode((v) => !v)}
          mapActive={mapMode}
          // Câu gợi ý chạy trong ô tìm bám theo TIN MỚI + TIN HOT của chính trang này
          hintItems={nguon ? goiY : items}
        />
      </div>

      {/* (Bỏ hàng chip bộ lọc đang áp dụng 18/10/2026 — chủ dự án: trùng với các trường lọc phía trên, không có tác dụng SEO
          vì chỉ vẽ ở máy khách. Gỡ lọc bằng chính trường lọc hoặc nút "Xoá lọc".) */}

      {/* TIÊU ĐỀ và HÀNG ĐIỀU KHIỂN nằm CÙNG MỘT HÀNG (tiêu đề trái · chế độ xem +
          sắp xếp phải) — trước đây điều khiển chiếm riêng một hàng, chừa một dải
          trống ngang giữa tiêu đề và danh sách tin. */}
      {/* id="ket-qua": mốc để bấm Tìm / Enter / chọn gợi ý là CUỘN THẲNG xuống đây,
          khách thấy trang chạy ngay cả khi kết quả không đổi. scroll-mt bù header. */}
      {cauSua && (
        <div className="mt-4 text-[15px] leading-relaxed">
          <p className="text-cvr-ink">
            Đang hiển thị kết quả cho{" "}
            <span className="text-cvr-blue-ink">
              {cauSua.split(/(\s+)/).map((w, i) => {
                const goc = filters.keyword.split(/(\s+)/)[i];
                return goc !== undefined && goc === w ? w : <b key={i}><i>{w}</i></b>;
              })}
            </span>
          </p>
          <p className="text-[13px] text-cvr-muted">
            Tìm kiếm thay thế cho <a href={linkNguyenVan} className="text-cvr-blue-ink hover:underline">{filters.keyword}</a>
          </p>
        </div>
      )}
      <div id="ket-qua" className="mt-4 flex scroll-mt-20 flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:scroll-mt-24">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{heading}</h1>
          {/* KHÔNG in số lượng tin ra đây — web đang ít tin, nói ra là tự phơi
              điểm yếu với khách (chủ dự án chốt 11/9/2026). Câu này chỉ còn nói
              phạm vi hoạt động. Ẩn trên mobile cho gọn như trước. */}
          {/* khách tìm "giá rẻ" → khoảng giá của riêng phân khúc rẻ (kq.khoangRe), không phải cả trang */}
          {kq?.khoangRe || soLieu ? (
            <p className="mt-1 text-sm text-cvr-muted">{kq?.khoangRe || soLieu}</p>
          ) : (
            <p className="mt-1 hidden text-sm text-cvr-muted sm:block">
              {active ? "Bất động sản phù hợp." : "Tin mua bán, cho thuê nhà đất mới nhất."}
            </p>
          )}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              {/* XEM BẢN ĐỒ — chỉ ĐIỆN THOẠI. Máy tính: nút nằm sát ô tìm trong thanh lọc như Batdongsan
                  (FilterBar, 18/10/2026) — mỗi màn hình một lối vào bản đồ. */}
              <button
                type="button"
                onClick={() => setMapMode((v) => !v)}
                aria-pressed={mapMode}
                // NỀN XANH cho dễ thấy — thống nhất với nút bản đồ ở tab Dự án.
                // Đang mở bản đồ thì đậm hơn một nấc để biết mình đang ở chế độ nào.
                className={`mr-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-white transition sm:hidden ${
                  mapMode ? "bg-cvr-blue-ink" : "bg-cvr-blue hover:bg-cvr-blue-ink"
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5l6 2.4 5-2.4v14.4l-5 2.4-6-2.4-5 2.4V4.9l5-2.4v16.8" />
                </svg>
                {mapMode ? "Xem danh sách" : "Xem bản đồ"}
              </button>
              {/* Đang lọc → cho lưu bộ lọc để nhận tin mới khớp (Tìm kiếm đã lưu). */}
              {active && <LuuTimKiem key={filtersToParams(filters).toString()} purpose={purpose} filters={filters} />}
              {active && (
                <button
                  type="button"
                  onClick={() => setFilters(emptyFilters())}
                  // điện thoại: nút này nằm ở cuối hàng trường lọc (FilterBar) — ở đây chỉ máy tính
                  className="hidden items-center gap-1.5 rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium sm:inline-flex text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Xoá lọc
                </button>
              )}
              <select
                aria-label="Sắp xếp"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="hidden h-9 rounded-lg border border-cvr-line bg-white px-3 text-xs text-cvr-ink outline-none transition focus:border-cvr-ink sm:block"
              >
                {relevance && <option value="lien-quan">Liên quan nhất</option>}
                <option value="moi">Mới nhất</option>
                <option value="gia-tang">Giá thấp → cao</option>
                <option value="gia-giam">Giá cao → thấp</option>
                <option value="dt-giam">Diện tích lớn nhất</option>
                {purpose === "ban" && <option value="gia-m2">Giá/m² thấp nhất</option>}
              </select>
        </div>
      </div>

      {/* ═══ CHẾ ĐỘ BẢN ĐỒ ═══ marker là viên GIÁ, bấm ra thẻ mini dẫn tới tin.
          Bấm "Xem danh sách" để quay lại. */}
      {mapMode && (
        <div className="mt-4 overflow-hidden rounded-xl border border-cvr-line">
          <div className="h-[62vh] min-h-[380px] w-full">
            {/* Bản đồ hiện CẢ tin hết hạn (chủ dự án 10/10/2026) — tin vẫn hiển thị trên web */}
            {nguon
              ? <MapView diem={mayChu?.diem ?? []} />
              : <MapView items={(taiCho?.ketQua ?? []).filter((l) => !l.banSao)} />}
          </div>
          <p className="border-t border-cvr-line bg-cvr-surface px-3 py-2 text-xs text-cvr-muted">
            Bấm vào viên giá để xem nhanh tin.
          </p>
        </div>
      )}

      {/* Máy tính: cột tin 3/4 · cột lọc 1/4 (chủ dự án 18/10/2026: cho phần nội dung bên trái to ra) */}
      <div className={`mt-3 grid grid-cols-1 gap-6 lg:grid-cols-4 ${mapMode ? "hidden" : ""}`}>

        {/* CỘT TRÁI: danh sách tin */}
        <div key={`${lanTim}-${JSON.stringify(filters)}`} className="anim-ket-qua lg:col-span-3">
          {pageItems.length > 0 ? (
            <>
              {/* Nhãn TẦNG kết quả — cho biết nhóm tin đang xem khớp tới đâu */}
              {(active || coTuKhoa) && (() => {
                const t = kq?.tangDau ?? 1;
                if (kq?.thongBao) return <p className="mb-3 text-sm font-medium text-cvr-body">{kq.thongBao}</p>;
                return t === 1 ? null : <p className="mb-3 text-sm font-medium text-cvr-body">{TIER_LABEL[t]}</p>;
              })()}
              {/* MOBILE (< 640px): LUÔN thẻ dọc — ảnh trên, nội dung dưới (thuần CSS,
                  không phụ thuộc JS → chắc chắn đúng trên mọi máy) */}
              {/* Tràn sát 2 mép màn hình, khe xám mảnh giữa các thẻ — hạn chế viền trắng (chủ dự án 09/10/2026) */}
              <div className="reveal is-visible cards-stagger -mx-4 grid grid-cols-1 gap-2 bg-cvr-surface sm:hidden">
                {pageItems.flatMap((item, i) => [dongTang(item, i), (
                  // Thẻ theo cấp (chuẩn 09/10/2026, docs/THE-TIN-THEO-CAP.md); tin hết hạn giữ thẻ cũ có nhãn "Tin hết hạn"
                  item.hetHan
                    ? <PropertyCard key={khoaThe(item)} item={item} layout="grid" showTime terms={chuDam(item.id)} />
                    : <TheTinMobile key={khoaThe(item)} item={item} terms={chuDam(item.id)} uuTien={i === 0} />
                )])}
              </div>
              {/* DESKTOP (≥ 640px): MỖI TIN MỘT HÀNG, nội dung đúng thẻ điện thoại theo cấp, khung ảnh theo cấp (TheTinMobile pc, chủ dự án
                  18/10/2026) — trang nào cũng đủ hàng, không ô trống. Tin hết hạn giữ hàng cũ có nhãn "Tin hết hạn". */}
              <div className="reveal is-visible cards-stagger hidden sm:flex sm:flex-col sm:gap-4">
                {pageItems.flatMap((item, i) => [dongTang(item, i), (
                  item.hetHan
                    ? <PropertyCard key={khoaThe(item)} item={item} layout="list" showTime terms={chuDam(item.id)} />
                    : <div key={khoaThe(item)} className="overflow-hidden rounded-xl border border-cvr-line"><TheTinMobile item={item} terms={chuDam(item.id)} pc uuTien={i === 0} /></div>
                )])}
              </div>

              <PhanTrang
                hienTai={current}
                tong={totalPages}
                doiTrang={goPage}
                taoLink={linkTrang}
                className="mt-10"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-cvr-line py-20 text-center">
              <p className="text-cvr-body">{kq?.thongBao ?? "Không tìm thấy bất động sản phù hợp."}</p>
              <button type="button" onClick={() => setFilters(emptyFilters())} className="mt-5 rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-body">Xoá bộ lọc</button>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: sidebar lọc nhanh */}
        <aside className="lg:col-span-1">
          {/* Cột phải DÍNH CỐ ĐỊNH khi cuộn, cao hơn màn hình thì cuộn trong khung */}
          <div className="no-scrollbar sticky top-20 max-h-[calc(100vh-6rem)] space-y-5 overflow-y-auto">
            {/* Lọc theo khoảng giá — mua bán = tỷ · cho thuê = triệu/tháng */}
            <SidebarFilter title={purpose === "thue" ? "Lọc theo giá thuê (tháng)" : "Lọc theo khoảng giá"}>
              {priceRangesFor(purpose).map((r) => {
                const on = filters.priceMin === r.min && filters.priceMax === r.max;
                return (
                  <SidebarLink
                    key={r.label}
                    active={on}
                    onClick={() => setFilters(on
                      ? { ...filters, priceMin: null, priceMax: null }
                      : { ...filters, priceMin: r.min, priceMax: r.max })}
                  >
                    {r.label}
                  </SidebarLink>
                );
              })}
            </SidebarFilter>

            {/* Lọc theo diện tích */}
            <SidebarFilter title="Lọc theo diện tích">
              {areaRangesFor(purpose).map((r) => {
                const on = filters.areaMin === r.min && filters.areaMax === r.max;
                return (
                  <SidebarLink
                    key={r.label}
                    active={on}
                    onClick={() => setFilters(on
                      ? { ...filters, areaMin: null, areaMax: null }
                      : { ...filters, areaMin: r.min, areaMax: r.max })}
                  >
                    {r.label}
                  </SidebarLink>
                );
              })}
            </SidebarFilter>

            {/* Bất động sản theo khu vực */}
            <SidebarFilter title={`${boDuoiThang(heading)} theo khu vực`}>
              {provinces.map(([prov, count]) => {
                const on = filters.locations.some((l) => l.province === prov && !l.district && !l.ward);
                return (
                  <SidebarLink
                    key={prov}
                    active={on}
                    count={count}
                    onClick={() => setFilters(on
                      ? { ...filters, locations: filters.locations.filter((l) => !(l.province === prov && !l.district && !l.ward)) }
                      : { ...filters, locations: [...filters.locations, { province: prov }] })}
                  >
                    {prov}
                  </SidebarLink>
                );
              })}
            </SidebarFilter>

            {/* (Bỏ khối "Bài viết được quan tâm" 18/10/2026 — chủ dự án: bài lạc đề với trang tìm, trên điện thoại bị cắt cụt) */}
          </div>
        </aside>

      </div>
    </div>
  );
}

// ── Sidebar lọc nhanh (giống .product-right của Homedy) ──────────────────────
function SidebarFilter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-none border border-cvr-line bg-white p-4 shadow-lux">
      <p className="mb-2.5 text-sm font-semibold text-cvr-ink">{title}</p>
      <ul className="grid grid-cols-2 gap-1.5">{children}</ul>
    </div>
  );
}

function SidebarLink({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: React.ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-center text-[12px] transition ${
          active
            ? "border-cvr-ink bg-cvr-ink font-semibold text-white"
            : "border-cvr-line bg-cvr-surface text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
        }`}
      >
        <span className="truncate">{children}</span>
        {count != null && (
          <span className={active ? "text-white/70" : "text-cvr-faint"}>({count})</span>
        )}
      </button>
    </li>
  );
}
