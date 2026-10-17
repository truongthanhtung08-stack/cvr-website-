"use client";

import { useEffect, useMemo, useState } from "react";
import PhanTrang from "@/components/PhanTrang";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Bản đồ chỉ chạy phía trình duyệt (Leaflet đụng tới window) → nạp động, tắt SSR.
const MapView = dynamic(() => import("@/components/MapViewMo"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-cvr-muted">Đang tải bản đồ…</div>,
});
import PropertyCard from "@/components/PropertyCard";
import TheTinMobile from "@/components/TheTinMobile";
import FilterBar from "@/components/FilterBar";
import ActiveFilters from "@/components/ActiveFilters";
import { featuredListings, type Article, type Listing } from "@/lib/data";
import {
  filtersFromParams,
  filtersToParams,
  emptyFilters,
  hasActiveFilters,
  priceRangesFor,
  areaRangesFor,
  type Filters,
  type SortKey,
} from "@/lib/filters";
import { TIER_LABEL } from "@/lib/smartSearch";
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
  initialFilters,
  chiId,
  boQuaId,
  soLieu,
  articles = [],
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

  const [filters, setFiltersState] = useState<Filters>(() => {
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
  // ?sapxep=gia-tang (ô tìm thông minh: câu có "giá rẻ" → giá thấp trước)
  const [sort, setSort] = useState<SortKey>(() => {
    const sx = params.get("sapxep");
    return sx === "gia-tang" || sx === "gia-giam" || sx === "dt-giam" || sx === "gia-m2" ? sx : relevance ? "lien-quan" : "moi";
  });
  const [view, setView] = useState<"list" | "grid">("list");
  // Chế độ BẢN ĐỒ (kiểu Batdongsan): bật là cả trang chuyển sang xem bản đồ,
  // marker chạy theo đúng bộ lọc đang áp dụng.
  const [mapMode, setMapMode] = useState(false);
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
  const yeuCau = JSON.stringify({ boLoc: filters, sapXep: sort, trang: page, chiId, boQuaId, banDo: mapMode });
  useEffect(() => {
    if (!nguon) return;
    let huy = false;
    const lanDau = mayChu == null;
    fetch(`/api/danh-sach/${nguon}/loc`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: lanDau ? JSON.stringify({ ...JSON.parse(yeuCau), goiY: true }) : yeuCau,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy || !d) return;
        setMayChu(d);
        if (d.goiY) setGoiY(d.goiY);
      })
      .catch(() => {});
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ gọi lại khi yêu cầu đổi
  }, [nguon, yeuCau]);
  const taiCho = useMemo(
    () => (nguon ? null : locDanhSach(items, itemsHetHan, purpose, filters, sort, page)),
    [nguon, items, itemsHetHan, purpose, filters, sort, page],
  );
  const kq = nguon ? mayChu : taiCho;
  const pageItems = kq?.trang ?? [];
  const totalPages = kq?.soTrang ?? 1;
  const current = kq?.trangHienTai ?? 1;
  const provinces = kq?.khuVuc ?? [];
  const coTuKhoa = filters.keyword.trim().length > 0;
  // DÒNG PHÂN CÁCH TẦNG (17/10/2026): ít tin khớp đủ thì web thêm tin gần đúng ngay sau — phải có dòng báo
  // trước tin gần đúng đầu tiên, nếu không khách tưởng tìm sai (vd tìm Quảng Trị lại thấy Đà Nẵng).
  const dongTang = (item: Listing, i: number) => {
    // Chủ dự án 17/10/2026: "1 tin thì ra 1 tin! Muốn gợi ý thì có câu gợi ý ở những địa phương khác".
    // Nhóm: 0 = khớp đủ · 1 = gợi ý cùng tỉnh đang chọn · 2 = gợi ý ở địa phương khác. Đổi nhóm → một dòng tiêu đề.
    const tinhChon = filters.locations.map((x) => x.province);
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

  // Đang nạp dữ liệu → giữ nguyên khung chờ máy chủ đã dựng (không nhấp nháy giao diện)
  if (nguon && !mayChu) return <>{choTai ?? null}</>;

  return (
    // PC: thanh lọc nằm SÁT header, không chừa khoảng trống (file V3 10.08.2026).
    <div className={nested ? "pt-1 sm:pt-6" : "mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8"}>
      {/* ── Phần trên kiểu Homedy (gọn): thanh lọc → tiêu đề + bộ đếm.
           Trang cấp 1 KHÔNG dùng breadcrumb (menu đã chỉ vị trí — chuẩn Apple). ── */}
      <div>
        <FilterBar
          value={filters}
          onChange={setFilters}
          purpose={purpose}
          onMap={() => setMapMode((v) => !v)}
          mapActive={mapMode}
          // Câu gợi ý chạy trong ô tìm bám theo TIN MỚI + TIN HOT của chính trang này
          hintItems={nguon ? goiY : items}
        />
      </div>

      {/* Chip bộ lọc đang áp dụng */}
      {active && (
        <div className="mt-3">
          <ActiveFilters value={filters} onChange={setFilters} />
        </div>
      )}

      {/* TIÊU ĐỀ và HÀNG ĐIỀU KHIỂN nằm CÙNG MỘT HÀNG (tiêu đề trái · chế độ xem +
          sắp xếp phải) — trước đây điều khiển chiếm riêng một hàng, chừa một dải
          trống ngang giữa tiêu đề và danh sách tin. */}
      {/* id="ket-qua": mốc để bấm Tìm / Enter / chọn gợi ý là CUỘN THẲNG xuống đây,
          khách thấy trang chạy ngay cả khi kết quả không đổi. scroll-mt bù header. */}
      <div id="ket-qua" className="mt-4 flex scroll-mt-20 flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:scroll-mt-24">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{heading}</h1>
          {/* KHÔNG in số lượng tin ra đây — web đang ít tin, nói ra là tự phơi
              điểm yếu với khách (chủ dự án chốt 11/9/2026). Câu này chỉ còn nói
              phạm vi hoạt động. Ẩn trên mobile cho gọn như trước. */}
          {soLieu ? (
            <p className="mt-1 text-sm text-cvr-muted">{soLieu}</p>
          ) : (
            <p className="mt-1 hidden text-sm text-cvr-muted sm:block">
              {active ? "Bất động sản phù hợp." : "Tin mua bán, cho thuê nhà đất mới nhất."}
            </p>
          )}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              {/* XEM BẢN ĐỒ — LỐI VÀO DUY NHẤT, hiện trên mọi màn hình. Nút cũ
                  của thanh lọc (cạnh ô tìm kiếm) đã bỏ vì trùng chức năng. */}
              <button
                type="button"
                onClick={() => setMapMode((v) => !v)}
                aria-pressed={mapMode}
                // NỀN XANH cho dễ thấy — thống nhất với nút bản đồ ở tab Dự án.
                // Đang mở bản đồ thì đậm hơn một nấc để biết mình đang ở chế độ nào.
                className={`mr-auto inline-flex min-h-[38px] items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-white transition ${
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Xoá lọc
                </button>
              )}
              <div className="hidden sm:block">
                <ViewToggle view={view} setView={setView} />
              </div>
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

      <div className={`mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3 ${mapMode ? "hidden" : ""}`}>

        {/* CỘT TRÁI: danh sách tin */}
        <div className="lg:col-span-2">
          {pageItems.length > 0 ? (
            <>
              {/* Nhãn TẦNG kết quả — cho biết nhóm tin đang xem khớp tới đâu */}
              {(active || coTuKhoa) && (() => {
                const t = kq?.tangDau ?? 1;
                return t === 1 ? null : <p className="mb-3 text-sm font-medium text-cvr-body">{TIER_LABEL[t]}</p>;
              })()}
              {/* MOBILE (< 640px): LUÔN thẻ dọc — ảnh trên, nội dung dưới (thuần CSS,
                  không phụ thuộc JS → chắc chắn đúng trên mọi máy) */}
              {/* Tràn sát 2 mép màn hình, khe xám mảnh giữa các thẻ — hạn chế viền trắng (chủ dự án 09/10/2026) */}
              <div className="reveal is-visible cards-stagger -mx-4 grid grid-cols-1 gap-2 bg-cvr-surface sm:hidden">
                {pageItems.flatMap((item, i) => [dongTang(item, i), (
                  // Thẻ theo cấp (chuẩn 09/10/2026, docs/THE-TIN-THEO-CAP.md); tin hết hạn giữ thẻ cũ có nhãn "Tin hết hạn"
                  item.hetHan
                    ? <PropertyCard key={khoaThe(item)} item={item} layout="grid" showTime terms={kq?.boiDam[item.id] ?? []} />
                    : <TheTinMobile key={khoaThe(item)} item={item} terms={kq?.boiDam[item.id] ?? []} />
                )])}
              </div>
              {/* DESKTOP (≥ 640px): theo chế độ xem đã chọn (Danh sách = thẻ ngang · Lưới = thẻ dọc) */}
              <div
                className={`reveal is-visible cards-stagger hidden ${
                  view === "list"
                    ? "sm:flex sm:flex-col sm:gap-4"
                    : "sm:grid sm:grid-cols-2 sm:gap-5"
                }`}
              >
                {pageItems.flatMap((item, i) => [dongTang(item, i), (
                  <PropertyCard key={khoaThe(item)} item={item} layout={view} showTime terms={kq?.boiDam[item.id] ?? []} />
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
              <p className="text-cvr-body">Không tìm thấy bất động sản phù hợp.</p>
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

            {/* Bài viết được quan tâm — CÙNG kiểu với cột phải trang Tin tức */}
            {articles.length > 0 && (
              <div className="rounded-none border border-cvr-line bg-white p-4 shadow-lux">
                <p className="mb-1 text-sm font-semibold text-cvr-ink">Bài viết được quan tâm</p>
                <div className="flex flex-col divide-y divide-cvr-line/70">
                  {articles.slice(0, 5).map((a, i) => (
                    <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex gap-3 py-2.5 last:pb-0">
                      <span className="w-5 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                      <span className="line-clamp-2 text-[13px] font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                        {a.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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

// Nút chuyển chế độ xem Danh sách / Lưới
export function ViewToggle({
  view,
  setView,
}: {
  view: "list" | "grid";
  setView: (v: "list" | "grid") => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-cvr-line bg-white p-0.5">
      <button
        type="button"
        aria-label="Xem dạng danh sách"
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "list" ? "bg-cvr-ink text-white" : "text-cvr-muted hover:text-cvr-ink"}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <button
        type="button"
        aria-label="Xem dạng lưới"
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "grid" ? "bg-cvr-ink text-white" : "text-cvr-muted hover:text-cvr-ink"}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v4H4v-4zm10 0h6v4h-6v-4z" /></svg>
      </button>
    </div>
  );
}
