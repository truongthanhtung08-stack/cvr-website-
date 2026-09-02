"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FilterDropdown, { FilterDropdownGroup } from "@/components/FilterDropdown";
import Highlight from "@/components/Highlight";
import { goiYNoiLong, searchAny, TIER_LABEL } from "@/lib/smartSearch";
import { provinceNamesFor, type GeoMode } from "@/lib/locations";
import { projectHints } from "@/lib/searchHints";
import { useTypingPlaceholder } from "@/lib/useTypingPlaceholder";
import { cuonToiKetQua } from "@/lib/scroll";
import dynamic from "next/dynamic";
import { coordOf } from "@/lib/geo";
import type { DiemBanDo } from "@/components/MapView";
import type { Project, Article } from "@/lib/data";

// Bản đồ chỉ chạy phía client (Leaflet đụng tới window) — nạp động, không SSR.
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const GEO_MODE_KEY = "cl-geo-mode"; // đồng bộ hệ đơn vị hành chính với FilterBar (Mua bán/Cho thuê)

// Danh sách dự án trang /du-an — bố cục kiểu Batdongsan:
// thanh lọc dưới Hero (ô tìm + dropdown Khu vực · Loại hình · Trạng thái)
// → tiêu đề + bộ đếm nhảy theo bộ lọc → thẻ ngang (ảnh trái · thông tin phải)
// + sidebar phải = lọc theo khu vực (đếm số dự án) + tin tức bất động sản.
// Dữ liệu do trang cha truyền vào (đọc từ Supabase — admin đăng gì hiện nấy).

// Tỉnh/thành = phần cuối của location ("Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" → "Đà Nẵng")
const provinceOf = (location: string) => location.split(",").pop()?.trim() ?? "";
// Gom type tự do của dự án về 3 nhóm loại hình lớn (đủ cho bộ dữ liệu hiện tại)
const typeOf = (type: string) =>
  type.includes("Căn hộ") ? "Căn hộ" : type.includes("đô thị") ? "Khu đô thị" : "Nghỉ dưỡng & biệt thự";
// Giá/m² tham khảo: lấy hàng "Giá..." trong bảng quy mô của dự án
const priceRef = (p: Project) =>
  p.scale.find((s) => s.label.startsWith("Giá"))?.value;

const ALL = "Tất cả";

// Đếm số dự án theo từng giá trị của 1 tiêu chí
function countBy(projects: Project[], key: (p: Project) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const p of projects) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
  return [...m];
}

export default function ProjectsBrowser({
  projects,
  articles,
  hero,
}: {
  projects: Project[];
  articles: Article[];
  // Banner Hero — nhận từ trang cha để đặt ĐÚNG thứ tự: mobile nằm DƯỚI thanh lọc,
  // desktop nằm TRÊN (dùng CSS order, không đổi cấu trúc dữ liệu).
  hero?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(ALL);
  const [province, setProvince] = useState(ALL);
  const [type, setType] = useState(ALL);
  // NHẬN TỪ KHOÁ TỪ TRANG CHỦ: bấm tab "Dự án" ở Hero rồi tìm → nhảy sang
  // /du-an?q=... , ô tìm ở đây phải tự điền và lọc ngay (trước đây bỏ qua ?q=).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tuKhoa = sp.get("q") ?? "";
    const tinh = sp.get("tinh") ?? "";
    const loai = sp.get("loai") ?? "";     // loại hình chọn ở trang chủ
    const tt = sp.get("trangthai") ?? "";  // tình trạng dự án
    if (tuKhoa) setQ(tuKhoa);
    if (tinh) setProvince(tinh);
    // Loại hình ở trang chủ là danh mục của TIN (Căn hộ, Đất nền, Biệt thự…) —
    // quy về đúng 3 nhóm loại hình mà dự án đang dùng; không thuộc nhóm nào thì
    // để nguyên "Tất cả" và giữ chữ đó trong ô tìm để vẫn lọc được theo từ khoá.
    if (loai) {
      const nhom = typeOf(loai);
      setType(nhom);
      if (!tuKhoa) setQ(loai);
    }
    if (tt) setStatus(tt);
  }, []);
  // MOBILE: chạm ô tìm → mở trang tìm TOÀN MÀN HÌNH (back + × + nút search) — như Mua bán.
  const [overlay, setOverlay] = useState(false);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  // Panel gợi ý (PC): mở khi gõ, TẮT khi bấm ra ngoài hoặc nhấn Esc
  const [sugOpen, setSugOpen] = useState(false);
  const sugBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ngoai = (e: PointerEvent) => {
      if (sugBoxRef.current && !sugBoxRef.current.contains(e.target as Node)) setSugOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setSugOpen(false); };
    document.addEventListener("pointerdown", ngoai);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", ngoai); document.removeEventListener("keydown", esc); };
  }, []);
  // Hệ đơn vị hành chính Cũ/Mới — bật/tắt như bên Mua bán (nhớ chung qua localStorage).
  const [geoMode, setGeoMode] = useState<GeoMode>("moi");
  useEffect(() => {
    try { const m = localStorage.getItem(GEO_MODE_KEY); if (m === "moi" || m === "cu") setGeoMode(m); } catch { /* noop */ }
  }, []);

  // Bấm search từ trang chủ → URL kèm #ket-qua → tự cuộn tới khối kết quả (bỏ qua
  // banner Hero rất to), cho cả PC & Mobile. Dùng JS cho chắc (hash native không
  // ổn định trên trang client-render). scroll-mt trên #ket-qua lo phần bù header.
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#ket-qua") return;
    const el = document.getElementById("ket-qua");
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
  }, []);
  const switchGeo = (m: GeoMode) => {
    setGeoMode(m); setProvince(ALL);
    try { localStorage.setItem(GEO_MODE_KEY, m); } catch { /* noop */ }
  };

  const provinceCounts = countBy(projects, (p) => provinceOf(p.location));
  const typeCounts = countBy(projects, (p) => typeOf(p.type));
  const statusCounts = countBy(projects, (p) => p.status);
  // Danh sách tỉnh theo hệ đã chọn, chỉ giữ tỉnh có dự án (kèm số đếm). Rỗng → dùng nguyên data.
  const provCountMap = new Map(provinceCounts);
  const provinceOpts: [string, number][] =
    provinceNamesFor(geoMode).filter((n) => provCountMap.has(n)).map((n) => [n, provCountMap.get(n)!]);
  const provinceOptions = provinceOpts.length ? provinceOpts : provinceCounts;

  // TÌM KIẾM THEO TRƯỜNG — DÙNG CHUNG một luật với Mua bán / Cho thuê:
  // bóc tách câu dài → xếp 3 tầng (khớp đủ → gần đúng → liên quan) → không bao
  // giờ ra màn hình trống. Khu vực + Loại hình là 2 trường GIỮ khi nới lỏng.
  const hits = searchAny(projects, q, {
    // TÊN dự án = chuỗi chính (khớp ở đây ăn điểm cao nhất)
    ten: (p) => `${p.name} ${p.type}`,
    // Vùng dò ĐẦY ĐỦ: thêm MÔ TẢ, quy mô và TIỆN ÍCH XUNG QUANH — trước đây chỉ
    // dò tên + chủ đầu tư + địa chỉ nên "view biển", "gần biển"… không bao giờ
    // khớp dù mô tả dự án có ghi rõ.
    hay: (p) =>
      [
        p.name, p.developer, p.location, p.type, p.status, p.priceFrom,
        ...(p.overview ?? []),
        ...(p.scale ?? []).map((s) => `${s.label} ${s.value}`),
        ...(p.places ?? []).map((x) => `${x.category} ${x.name}`),
      ].join(" "),
    truong: [
      { ten: "khu vực", chon: province !== ALL, giu: true, ok: (p) => provinceOf(p.location) === province },
      { ten: "loại hình", chon: type !== ALL, giu: true, ok: (p) => typeOf(p.type) === type },
      { ten: "tình trạng", chon: status !== ALL, ok: (p) => p.status === status },
    ],
  });
  const visible = hits.map((h) => h.item);
  // Tầng + chữ cần bôi đậm của từng dự án
  const tierBySlug = new Map(hits.map((h) => [h.item.slug, h.tier]));
  const termsBySlug = new Map(hits.map((h) => [h.item.slug, h.matched]));

  // ── PANEL GỢI Ý TÌM KIẾM cho mục Dự án (mở khi gõ, tắt khi bấm ra ngoài/Esc) ──
  // Gồm 2 nhóm: (1) gợi ý BẬC THANG dựng từ chính câu đang gõ · (2) tên dự án khớp.
  const goiY = q.trim() ? goiYNoiLong(q) : [];
  const duAnKhop = q.trim() ? hits.slice(0, 5).map((h) => h.item) : [];
  const coGoiY = sugOpen && (goiY.length > 0 || duAnKhop.length > 0);
  const chonGoiY = (tinh?: string) => {
    if (tinh) setProvince(tinh);
    setSugOpen(false);
    chayTim(); // bấm gợi ý = ra kết quả NGAY, không phải bấm thêm nút Tìm
  };

  const hasActive = q.trim() !== "" || status !== ALL || province !== ALL || type !== ALL;
  const reset = () => { setQ(""); setStatus(ALL); setProvince(ALL); setType(ALL); };

  // Gợi ý CHẠY CHỮ trong ô tìm — dựng từ CHÍNH kho dự án đang có (tên dự án, chủ
  // đầu tư, khu vực, tình trạng CÓ THẬT) nên gõ vào là chắc chắn ra kết quả;
  // kho rỗng thì lùi về bộ theo cơ cấu. Dừng chạy khi khách đã gõ.
  // useMemo giữ mảng ổn định giữa các lần render (nếu không sẽ reset chữ liên tục).
  const hintDuAn = useMemo(() => projectHints(projects), [projects]);
  const goiYChay = useTypingPlaceholder(hintDuAn, q.trim().length > 0);

  // ── CHẠY TÌM (nút Tìm · Enter · bấm gợi ý · bấm "Xong" ở bảng lọc) ──────────
  // Trang Dự án lọc TẠI CHỖ nên "chạy" = đóng panel/trang tìm + CUỘN xuống khối
  // kết quả, kèm ~0,7s trạng thái "đang tìm" để khách biết máy đang chạy —
  // dù có dự án khớp hay không.
  const [dangTim, setDangTim] = useState(false);
  const chayTim = () => {
    setSugOpen(false);
    setOverlay(false);
    setDangTim(true);
    window.setTimeout(() => setDangTim(false), 700);
    // đợi overlay đóng xong mới cuộn, nếu không phần tử còn bị che
    window.setTimeout(cuonToiKetQua, 60);
  };

  // Phân trang danh sách dự án: 9 dự án/trang (khớp yêu cầu "8–10/trang").
  const PER_PAGE = 9;
  const [page, setPage] = useState(1);
  // CHẾ ĐỘ BẢN ĐỒ cho tab Dự án — giống Mua bán / Cho thuê, marker là TÊN DỰ ÁN.
  const [mapMode, setMapMode] = useState(false);
  useEffect(() => { setPage(1); }, [q, status, province, type]); // đổi lọc → về trang 1
  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = visible.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  // Panel chọn 1 giá trị trong dropdown (kèm số dự án mỗi mục)
  const optionList = (
    options: [string, number][],
    value: string,
    onPick: (v: string) => void,
    close: () => void
  ) => (
    <div className="space-y-0.5">
      {[[ALL, projects.length] as [string, number], ...options].map(([name, count]) => (
        <button
          key={name}
          type="button"
          onClick={() => { onPick(name); close(); }}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
            value === name ? "bg-cvr-blue/10 font-medium text-cvr-blue-ink" : "text-cvr-ink/80 hover:bg-black/5"
          }`}
        >
          <span className="truncate">{name}</span>
          <span className="shrink-0 text-[11px] text-cvr-faint">{count} dự án</span>
        </button>
      ))}
    </div>
  );

  // Nhóm nút lọc dùng chung cho HAI vị trí: thanh lọc (desktop) và trang tìm
  // toàn màn hình (mobile). Chức năng y hệt — chỉ khác chỗ đặt.
  const chipLoc = (
    <FilterDropdownGroup>
      <FilterDropdown label="Khu vực" summary={province === ALL ? "" : province} active={province !== ALL} panelClassName="w-64" className="shrink-0">
        {({ close }) => (
          <div>
            {/* Công tắc hệ hành chính Cũ/Mới — đồng bộ với Mua bán/Cho thuê */}
            <button
              type="button"
              role="switch"
              aria-checked={geoMode === "moi"}
              onClick={() => switchGeo(geoMode === "moi" ? "cu" : "moi")}
              className="mb-2 flex w-full items-center justify-between gap-3 rounded-lg bg-cvr-blue/[0.06] px-2.5 py-2 text-left transition hover:bg-cvr-blue/[0.1]"
            >
              <span className="text-[12px] font-semibold text-cvr-ink">Tìm theo địa chỉ mới sau sáp nhập</span>
              <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${geoMode === "moi" ? "bg-cvr-blue" : "bg-black/20"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${geoMode === "moi" ? "left-[18px]" : "left-0.5"}`} />
              </span>
            </button>
            {optionList(provinceOptions, province, setProvince, close)}
          </div>
        )}
      </FilterDropdown>
      <FilterDropdown label="Loại hình" summary={type === ALL ? "" : type} active={type !== ALL} panelClassName="w-64" className="shrink-0">
        {({ close }) => optionList(typeCounts, type, setType, close)}
      </FilterDropdown>
      <FilterDropdown label="Trạng thái" summary={status === ALL ? "" : status} active={status !== ALL} panelClassName="w-64" className="shrink-0">
        {({ close }) => optionList(statusCounts, status, setStatus, close)}
      </FilterDropdown>
    </FilterDropdownGroup>
  );

  return (
    <div className="flex flex-col">
      {/* Hero banner — MOBILE nằm DƯỚI thanh lọc (mẫu Batdongsan), DESKTOP nằm TRÊN.
          Âm lề để banner tràn hết bề ngang, không bị lề trang bó lại. */}
      {hero && (
        // Tràn viền THẬT: kéo ra full bề ngang màn hình, không bị khung max-w-7xl bó lại
        // (trước đây Hero nằm ngoài khung nên full màn hình — phải giữ đúng như vậy trên PC).
        <div className="relative left-1/2 order-2 mb-0 w-screen -translate-x-1/2 sm:order-1 sm:mb-0">
          {hero}
        </div>
      )}

      {/* ── Thanh tìm + lọc dự án (MOBILE: lên trên cùng, KHÔNG khung viền/bóng, rộng hết bề ngang) ── */}
      <div className="order-1 mt-2 rounded-none bg-white pb-2.5 pt-0 sm:order-2 sm:mt-2.5 sm:border sm:border-cvr-line sm:p-2.5 sm:shadow-lux">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {/* Ô tìm nhanh dự án — nút search XANH nằm SÁT mép phải trong khung (mobile), đồng bộ Mua bán/Cho thuê.
              MOBILE: chừa lề trái đúng chỗ NÚT BACK TRÒN nổi (8px + 36px) để nút đứng
              CẠNH ô tìm thành một hàng, không đè lên chữ gợi ý đang chạy. */}
          <div className="ml-11 flex flex-1 items-center gap-2 sm:ml-0">
          <div ref={sugBoxRef} className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-cvr-faint sm:block" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={(e) => {
                // MOBILE: mở trang tìm toàn màn hình (có nút back + search) thay vì gõ tại chỗ.
                if (window.matchMedia("(max-width: 639px)").matches) { e.currentTarget.blur(); setOverlay(true); }
                else setSugOpen(true); // PC: mở panel gợi ý
              }}
              onKeyDown={(e) => { if (e.key === "Enter") chayTim(); }}
              // Gợi ý CHẠY CHỮ của mục Dự án
              placeholder={goiYChay}
              aria-label="Tìm nhanh dự án"
              className="h-11 w-full rounded-xl bg-cvr-surface pl-4 pr-14 text-[15px] text-cvr-ink placeholder-cvr-faint ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-cvr-blue/50 sm:h-10 sm:border sm:border-transparent sm:pl-9 sm:pr-24 sm:ring-0 sm:focus:border-cvr-line sm:focus:bg-white"
            />
            {/* Nút xoá nhanh (×) — đồng bộ với ô tìm Mua bán/Cho thuê */}
            {q.trim().length > 0 && (
              <button
                type="button"
                aria-label="Xoá tìm kiếm"
                onClick={() => setQ("")}
                className="absolute right-14 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/5 hover:text-cvr-ink active:scale-95 sm:right-[5.5rem]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {/* ── PANEL GỢI Ý (chỉ PC) — bấm ra ngoài hoặc Esc là tắt ── */}
            {coGoiY && (
              <div className="absolute left-0 right-0 top-full z-[120] mt-1.5 hidden max-h-80 overflow-y-auto rounded-xl border border-cvr-line bg-white p-1.5 shadow-2xl shadow-black/20 sm:block">
                <div className="sticky top-0 -mx-1.5 -mt-1.5 mb-1 flex items-center justify-between border-b border-cvr-line bg-white px-2.5 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-cvr-faint">Gợi ý tìm kiếm</span>
                  <button type="button" onClick={() => setSugOpen(false)} aria-label="Đóng gợi ý" className="text-cvr-muted hover:text-cvr-ink">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {goiY.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => chonGoiY(g.patch.locations?.[0]?.province)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-black/[0.04]"
                  >
                    <span className="min-w-0 truncate text-sm text-cvr-ink">{g.label}</span>
                    <span className="shrink-0 text-[11px] text-cvr-faint">{g.sub}</span>
                  </button>
                ))}
                {duAnKhop.length > 0 && (
                  <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-cvr-faint">Dự án</p>
                )}
                {duAnKhop.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/du-an/${p.slug}`}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-black/[0.04]"
                  >
                    <span className="min-w-0 truncate text-sm text-cvr-ink">
                      <Highlight text={p.name} terms={termsBySlug.get(p.slug) ?? []} />
                    </span>
                    <span className="shrink-0 text-[11px] text-cvr-faint">{provinceOf(p.location)}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* NÚT TÌM KIẾM trên PC — mục Dự án cũng phải có nút như Mua bán/Cho thuê
                (trước đây desktop chỉ có kính lúp trang trí, không bấm được) */}
            <button
              type="button"
              aria-label="Tìm kiếm dự án"
              onClick={chayTim}
              className="absolute right-1 top-1 bottom-1 hidden items-center gap-1.5 rounded-lg bg-cvr-blue px-3 text-[13px] font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95 sm:flex"
            >
              {dangTim ? <SpinnerDuAn size={16} /> : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
              )}
              {dangTim ? "Đang tìm…" : "Tìm"}
            </button>

            {/* Nút search XANH — bo tròn mềm, snug mép phải (giống trang chủ).
                Đã gõ từ khoá / đã chọn lọc → BẤM LÀ CHẠY (cuộn xuống kết quả);
                còn trống trơn → mở trang tìm toàn màn hình để gõ và chọn. */}
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={() => (hasActive ? chayTim() : setOverlay(true))}
              className="absolute right-1 top-1 bottom-1 flex w-11 items-center justify-center rounded-lg bg-cvr-blue text-white transition hover:bg-cvr-blue-ink active:scale-95 sm:hidden"
            >
              {dangTim ? <SpinnerDuAn size={18} /> : (
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
              )}
            </button>
          </div>
          </div>

          {/* Chip lọc: Khu vực · Loại hình · Trạng thái.
              MOBILE: ẨN ở đây — chuyển vào TRANG TÌM toàn màn hình (bấm nút tìm kiếm),
              đúng kiểu bộ lọc trang chủ mobile. DESKTOP: giữ nguyên tại chỗ. */}
          <div className="no-scrollbar hidden items-center gap-2 overflow-x-auto pb-0.5 sm:flex lg:overflow-visible">
            {chipLoc}
          </div>

          {hasActive && (
            <button
              type="button"
              onClick={reset}
              className="hidden h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-cvr-muted transition hover:text-cvr-blue-ink sm:block"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE: trang tìm dự án TOÀN MÀN HÌNH — back + × + nút Search (đồng bộ Mua bán) ── */}
      {overlay && (
        // z-[80]: phủ header (z-50) + thanh tab đáy (z-40) nhưng THẤP hơn sheet
        // của nút lọc (z-100) để bảng chọn Khu vực/Loại hình/Trạng thái mở đè lên được.
        <div className="fixed inset-0 z-[80] flex flex-col bg-white sm:hidden">
          <div className="flex items-center gap-1.5 border-b border-cvr-line px-2 py-2">
            <button
              type="button"
              aria-label="Đóng tìm kiếm"
              onClick={() => setOverlay(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cvr-ink active:bg-cvr-surface"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="relative flex-1">
              <input
                ref={overlayInputRef}
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") chayTim(); }}
                placeholder={goiYChay}
                aria-label="Tìm dự án"
                className="h-11 w-full rounded-full bg-cvr-surface pl-4 pr-10 text-[15px] text-cvr-ink placeholder-cvr-faint outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-cvr-blue/40"
              />
              {q.trim().length > 0 && (
                <button
                  type="button"
                  aria-label="Xoá tìm kiếm"
                  onClick={() => { setQ(""); overlayInputRef.current?.focus(); }}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint active:bg-black/5"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={chayTim}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cvr-blue text-white active:scale-95"
            >
              {dangTim ? <SpinnerDuAn size={18} /> : (
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
              )}
            </button>
          </div>
          {/* BỘ LỌC dự án — MOBILE nằm TRONG trang tìm này (giống trang chủ đưa
              tab Mua bán/Cho thuê/Dự án vào trang tìm). Chức năng giữ nguyên. */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-cvr-line px-3 py-2">
            {chipLoc}
            {hasActive && (
              <button
                type="button"
                onClick={reset}
                className="h-10 shrink-0 rounded-full px-3 text-sm font-medium text-cvr-muted active:text-cvr-blue-ink"
              >
                Đặt lại
              </button>
            )}
            {/* Chọn xong (1 trường hay nhiều trường tuỳ khách) → bấm XONG là ra kết quả */}
            <button
              type="button"
              onClick={chayTim}
              className="ml-auto h-10 shrink-0 rounded-full bg-cvr-blue px-4 text-sm font-semibold text-white active:scale-95"
            >
              Xong
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {visible.length === 0 ? (
              <p className="px-2.5 py-3 text-sm text-cvr-muted">Không tìm thấy dự án khớp “{q}”.</p>
            ) : (
              visible.map((p) => (
                <Link
                  key={p.slug}
                  href={`/du-an/${p.slug}`}
                  onClick={() => setOverlay(false)}
                  className="flex flex-col rounded-lg px-2.5 py-2.5 active:bg-cvr-surface"
                >
                  <span className="text-sm font-medium text-cvr-ink">{p.name}</span>
                  <span className="text-[12px] text-cvr-faint">{p.location}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Phần còn lại LUÔN nằm cuối (sau Hero và thanh lọc) trên mọi kích thước.
          id="ket-qua" + scroll-mt: bấm search từ trang chủ → tự cuộn tới đây, bỏ qua
          banner Hero rất to (áp cho cả PC & Mobile). */}
      <div id="ket-qua" className="order-3 scroll-mt-20 sm:scroll-mt-24">
      {/* Tiêu đề + bộ đếm nhảy theo bộ lọc (kiểu Batdongsan) */}
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:mt-6 sm:text-3xl">
        Dự án nổi bật
      </h1>
      <p className="mt-1.5 text-sm text-cvr-muted">
        {/* Coastal Land là CỔNG THÔNG TIN — không phân phối, không mua bán dự án.
            Câu này chỉ nói về thông tin đang đăng tải, không được hàm ý môi giới. */}
        Hiện có {visible.length} dự án căn hộ, khu đô thị và nghỉ dưỡng đang được cập nhật trên Coastal Land.
      </p>

      {/* NÚT XEM BẢN ĐỒ — cùng vị trí với trang Mua bán / Cho thuê để khách quen tay */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setMapMode((v) => !v)}
          aria-pressed={mapMode}
          // NỀN XANH cho dễ thấy — thống nhất với nút bản đồ ở Mua bán / Cho thuê
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-white transition ${
            mapMode ? "bg-cvr-blue-ink" : "bg-cvr-blue hover:bg-cvr-blue-ink"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5l6 2.4 5-2.4v14.4l-5 2.4-6-2.4-5 2.4V4.9l5-2.4v16.8" />
          </svg>
          {mapMode ? "Xem danh sách" : "Xem bản đồ"}
        </button>
      </div>

      {/* ═══ CHẾ ĐỘ BẢN ĐỒ ═══ marker là TÊN DỰ ÁN, bấm ra thẻ mini dẫn tới trang
          dự án. Có nút "Vị trí của tôi" ngay trên bản đồ, kéo một ngón. */}
      {mapMode && (
        <div className="mt-4 overflow-hidden rounded-xl border border-cvr-line">
          <div className="h-[62vh] min-h-[380px] w-full">
            <MapView
              diem={visible.map((p): DiemBanDo => {
                const [lat, lng] = coordOf(p.location, p.slug);
                return {
                  id: p.slug,
                  lat,
                  lng,
                  nhan: p.name,
                  title: p.name,
                  phu: `${p.priceFrom} · ${p.status}`,
                  loc: p.location,
                  image: p.image,
                  href: `/du-an/${p.slug}`,
                };
              })}
            />
          </div>
          <p className="border-t border-cvr-line bg-cvr-surface px-3 py-2 text-xs text-cvr-muted">
            Đang hiện <span className="font-semibold text-cvr-ink">{visible.length}</span> dự án theo bộ lọc.
            Bấm vào tên dự án để xem nhanh.
          </p>
        </div>
      )}

      <div className={`mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3 ${mapMode ? "hidden" : ""}`}>
        {/* ── Cột chính: thẻ dự án ngang ── */}
        <div className="lg:col-span-2">
          {/* Nhãn TẦNG kết quả — giống trang Mua bán / Cho thuê */}
          {hasActive && pageItems.length > 0 && (() => {
            const t = tierBySlug.get(pageItems[0].slug) ?? 1;
            return t === 1 ? null : <p className="mb-3 text-sm font-medium text-cvr-body">{TIER_LABEL[t]}</p>;
          })()}
          <div className="reveal is-visible cards-stagger flex flex-col gap-5">
            {pageItems.map((p) => (
              <Link
                key={p.slug}
                href={`/du-an/${p.slug}`}
                className="card-lux group relative flex flex-col overflow-hidden rounded-none bg-white shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45 sm:flex-row sm:gap-5 sm:border sm:border-cvr-line sm:p-3"
              >
                {/* MOBILE: ảnh TRÊN tràn viền · DESKTOP: ảnh trái */}
                <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-none bg-cvr-surface sm:aspect-[4/3] sm:w-56 sm:rounded-xl md:w-64">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width:640px) 33vw, 256px"
                    className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-white/60 backdrop-blur-md">
                    {p.status}
                  </span>
                </div>

                {/* Thông tin — mobile có padding cho "thở", desktop sát ảnh */}
                <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-0 sm:py-1 sm:pr-1">
                  <h3 className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg">
                    <Highlight text={p.name} terms={termsBySlug.get(p.slug) ?? []} />
                  </h3>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-base font-semibold text-cvr-gold-ink sm:text-lg">{p.priceFrom}</span>
                    {priceRef(p) && <span className="text-xs text-cvr-muted">{priceRef(p)}</span>}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-cvr-muted">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{p.location}</span>
                  </p>
                  <p className="mb-3 mt-1.5 line-clamp-2 text-xs leading-relaxed text-cvr-muted">
                    {p.type} · {p.overview[0]}
                  </p>
                  <div className="mt-auto border-t border-cvr-line pt-2.5">
                    <span className="text-xs text-cvr-body">
                      Chủ đầu tư: <span className="font-medium text-cvr-ink">{p.developer}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {visible.length === 0 && (
              <p className="rounded-none border border-cvr-line bg-cvr-surface p-10 text-center text-sm text-cvr-muted">
                Chưa có dự án phù hợp bộ lọc. Hãy đổi từ khoá hoặc bấm &ldquo;Đặt lại&rdquo;.
              </p>
            )}
          </div>

          {/* Phân trang dự án — mỗi trang 9 (đích của nút "Xem thêm" ở trang chủ) */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <button type="button" disabled={current === 1} onClick={() => { setPage(current - 1); window.scrollTo({ top: 0 }); }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" onClick={() => { setPage(p); window.scrollTo({ top: 0 }); }} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${p === current ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}>{p}</button>
              ))}
              <button type="button" disabled={current === totalPages} onClick={() => { setPage(current + 1); window.scrollTo({ top: 0 }); }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30">›</button>
            </div>
          )}
        </div>

        {/* ── Sidebar: lọc theo khu vực + tin tức (kiểu Batdongsan) ── */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-none border border-cvr-line bg-white p-5 shadow-lux">
              <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Lọc theo khu vực</h2>
              <div className="mt-3 flex flex-col">
                {[[ALL, projects.length] as [string, number], ...provinceCounts].map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setProvince(name)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      province === name
                        ? "bg-cvr-surface font-semibold text-cvr-ink"
                        : "text-cvr-body hover:bg-cvr-surface hover:text-cvr-ink"
                    }`}
                  >
                    <span>{name === ALL ? "Tất cả khu vực" : name}</span>
                    <span className="text-xs text-cvr-muted">{count} dự án</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tin tức bất động sản — 5 bài mới nhất */}
            <div className="rounded-none border border-cvr-line bg-white p-5 shadow-lux">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Tin tức bất động sản</h2>
                <Link href="/tin-tuc" className="shrink-0 text-xs font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
                  Xem thêm →
                </Link>
              </div>
              <div className="mt-2 flex flex-col divide-y divide-cvr-line/70">
                {articles.slice(0, 5).map((a) => (
                  <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group py-3 first:pt-2 last:pb-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                      {a.title}
                    </p>
                    <p className="mt-1 text-xs text-cvr-muted">{a.category} · {a.date}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </div>
  );
}

// Vòng xoay "đang tìm" của mục Dự án — báo cho khách biết máy đang chạy
// ngay khi bấm Tìm / Enter / Xong, dù có dự án khớp hay không.
function SpinnerDuAn({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.3} strokeWidth={2.6} />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
}
