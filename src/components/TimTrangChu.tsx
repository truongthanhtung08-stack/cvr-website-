"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { emptyFilters, filtersToParams, normalizeVi, typeGroupsFor, type LocationSel } from "@/lib/filters";
import { saleCategories, rentCategories, nhomPseo } from "@/lib/categories";
import { suggest, goiYPhoBien, type Suggestion } from "@/lib/suggest";
import { timKhuVuc, slugKhuVuc } from "@/lib/khuVuc";
import { duongDanBuoc, duongDanTuCau } from "@/lib/duongDanTim";
import { Building2, MapPin, Clock, Search, X, type LucideIcon } from "lucide-react";

// ============================================================================
// BỘ TÌM TRANG CHỦ — THAY HERO (chủ dự án 17/10/2026)
// ----------------------------------------------------------------------------
// Ghép Google + Airbnb theo đúng ý định người tìm nhà đất, cái gì không cần thì bỏ:
//   ① Mục đích: Mua bán · Cho thuê · Dự án (Airbnb: hàng mục có biểu tượng).
//   ② MỘT ô tìm (Google): gõ đến đâu gợi ý CẢ CÂU đến đó, khu vực / dự án chia nhóm; chọn là ra kết quả.
//      Gõ cả câu ("căn hộ Nha Trang dưới 3 tỷ") → máy tách ý định, đi thẳng trang sạch đang lên Google.
//   ③ Loại hình bấm nhanh: link thật tới trang loại hình (người chưa biết gõ gì; tốt cho SEO).
// Lọc chi tiết (giá, diện tích, phòng ngủ…) khách chỉnh SAU khi thấy kết quả — trang kết quả đã có đủ.
// Chạy hoàn toàn ở trình duyệt — không thêm lần gọi máy chủ nào.
// ============================================================================

type Muc = "ban" | "thue" | "duan";
type Noi = { nhan: string; duong: string | null; loc: LocationSel; tuKhoa?: string };

const RECENT_KEY = "cvr-recent-search"; // dùng chung lịch sử với ô tìm các trang danh sách

// Menu mục đích và loại hình CHỈ CÓ CHỮ (chủ dự án 17/10/2026: bỏ hẳn biểu tượng). Biểu tượng chức năng
// trong ô tìm (kính lúp, xoá, gần đây, khu vực, dự án) dùng bộ chuẩn Lucide, một màu.
const TABS: { muc: Muc; nhan: string }[] = [
  { muc: "ban", nhan: "Mua bán" },
  { muc: "thue", nhan: "Cho thuê" },
  { muc: "duan", nhan: "Dự án" },
];

function Icon({ i: I, className = "h-5 w-5", w = 1.75 }: { i: LucideIcon; className?: string; w?: number }) {
  return <I className={className} strokeWidth={w} aria-hidden />;
}

// 5 nhóm loại hình của mục đích → trang nhóm (đọc thẳng nguồn chung typeGroupsFor; "Khác" chỉ ở Lọc thêm)
function nhomCua(muc: "ban" | "thue") {
  const trang = [...(muc === "thue" ? rentCategories : saleCategories), ...nhomPseo(muc)];
  return typeGroupsFor(muc)
    .filter((g) => g.label !== "Khác")
    .flatMap((g) => {
      const c = trang.find((x) => x.types.length === g.items.length && g.items.every((t) => x.types.includes(t)));
      return c ? [{ nhan: g.label, slug: c.slug }] : [];
    });
}

const GOC = /^\/(mua-ban|cho-thue)\//;
function noiTu(s: Suggestion): Noi {
  if (s.href && GOC.test(s.href)) {
    // Khu vực phổ biến: link sẵn trang tỉnh / thành phố (Nha Trang → khanh-hoa/nha-trang)
    return { nhan: s.label, duong: s.href.replace(GOC, ""), loc: { province: s.sub ?? s.label }, tuKhoa: s.sub ? s.label : undefined };
  }
  const loc: LocationSel = { province: s.province ?? s.label, district: s.district || undefined, ward: s.ward || undefined };
  return { nhan: s.label, duong: !loc.district && !loc.ward ? timKhuVuc(slugKhuVuc(loc.province))?.slug ?? null : null, loc };
}

export default function TimTrangChu() {
  const [mucDangChon, setMuc] = useState<Muc>("ban");
  const muc = mucDangChon;
  const [tuKhoa, setTuKhoa] = useState("");
  const [mo, setMo] = useState(false); // điện thoại: màn tìm
  const [moPc, setMoPc] = useState(false); // máy tính: bảng gợi ý
  const [ganDay, setGanDay] = useState<Suggestion[]>([]);
  const pcRef = useRef<HTMLDivElement>(null);

  const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc lịch sử một lần khi mở
      if (Array.isArray(r)) setGanDay(r);
    } catch { /* bỏ qua */ }
  }, []);

  // Màn tìm điện thoại: khoá cuộn trang phía sau · Esc đóng
  useEffect(() => {
    if (!mo) return;
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMo(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = cu; document.removeEventListener("keydown", onKey); };
  }, [mo]);

  // Máy tính: bấm ra ngoài thanh tìm / Esc → đóng bảng gợi ý
  useEffect(() => {
    if (!moPc) return;
    const onDoc = (e: Event) => { if (!pcRef.current?.contains(e.target as Node)) setMoPc(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoPc(false); };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [moPc]);

  const luu = (s: Suggestion) => {
    const next = [s, ...ganDay.filter((x) => x.label !== s.label)].slice(0, 6);
    setGanDay(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
  };

  const di = (url: string) => window.location.assign(url);

  // Tìm theo câu gõ, hoặc theo một nơi vừa chọn
  function tim(cau: string, n: Noi | null = null, mucGhiDe?: Muc) {
    const muc = mucGhiDe ?? mucDangChon;
    const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";
    const kw = cau.trim();
    if (kw && !n) luu({ label: kw, kind: "Gợi ý", sub: "Từ khoá đã tìm", keyword: kw });
    const loc = n ? [n.loc] : [];
    const chu = n ? n.tuKhoa ?? "" : kw;
    if (muc === "duan") {
      const p = filtersToParams({ ...emptyFilters(), keyword: chu, locations: loc });
      p.set("mode", "Dự án");
      return di(`/du-an?${p.toString()}#ket-qua`);
    }
    // Câu gõ → máy tách ý định (loại hình · thành phố/tỉnh · giá) về trang sạch
    if (kw && !n) { const u = duongDanTuCau(mb, kw); if (u) return di(u); }
    // Nơi đã chọn / chưa nhập gì → trang tỉnh, thành phố hoặc trang mục
    if (!kw || (n && n.duong)) { const u = duongDanBuoc(mb, n?.duong ?? null, null, null); if (u) return di(u); }
    const p = filtersToParams({ ...emptyFilters(), keyword: chu, locations: loc });
    p.set("mode", mb === "thue" ? "Cho thuê" : "Mua bán");
    di(`${mb === "thue" ? "/cho-thue" : "/mua-ban"}?${p.toString()}#ket-qua`);
  }

  // Chọn một gợi ý là ra kết quả luôn (như Google)
  function chonGoiY(s: Suggestion) {
    luu(s);
    if (s.kind === "Khu vực") { setTuKhoa(s.label); return tim("", noiTu(s)); }
    if (s.href) return di(s.href);
    tim(s.keyword ?? s.label);
  }

  // ── Gợi ý: gõ → câu hoàn chỉnh + khu vực + dự án · chưa gõ → gần đây + khu vực phổ biến ──
  const kw = tuKhoa.trim();
  // GỢI Ý CẢ CÂU (Google): đoán phần CUỐI câu là nơi / dự án đang gõ dở ("căn hộ nha" → "nha" → Nha Trang),
  // phần đầu là ý định đã gõ ("căn hộ") → ghép thành câu hoàn chỉnh "Căn hộ Nha Trang".
  const tach = (() => {
    const tu = kw.split(" ").filter(Boolean);
    // câu dài: không ghép gợi ý (các dòng bị cắt cụt trông giống hệt nhau) — dòng "Tìm “…”" đọc trọn câu
    if (tu.length > 6) return { dau: "", ds: [] as Suggestion[] };
    for (let k = Math.min(3, tu.length); k >= 1; k--) {
      const duoi = tu.slice(-k).join(" ");
      if (duoi.length < 2) continue;
      // CHÍNH XÁC: chỉ nhận nơi / dự án có TÊN BẮT ĐẦU bằng phần đang gõ (không đoán gần đúng "hộ nha" → "Lộc Thọ")
      const nd = normalizeVi(duoi);
      const ds = suggest(duoi, 12).filter((s) => (s.kind === "Khu vực" || s.kind === "Dự án") && normalizeVi(s.label).startsWith(nd));
      // nơi lớn (tỉnh, thành phố) trước nơi nhỏ (phường, xã) — đếm số cấp trong tên
      const cap = (x: Suggestion) => x.label.split(",").length;
      if (ds.length) return { dau: tu.slice(0, -k).join(" "), ds: [...ds].sort((x, y) => cap(x) - cap(y)).slice(0, 6) };
    }
    return { dau: "", ds: [] as Suggestion[] };
  })();
  const dau = tach.dau ? tach.dau.charAt(0).toUpperCase() + tach.dau.slice(1) : "";
  const goiY: Suggestion[] = kw ? tach.ds : goiYPhoBien(mb);
  const cauGoiY = dau ? goiY.filter((s) => s.kind === "Khu vực").slice(0, 4).map((s) => ({ label: `${dau} ${s.label}`, sub: s.sub })) : [];
  const ganDayHien = kw ? [] : ganDay.slice(0, 3);
  const goiYKhu = dau ? [] : goiY.filter((s) => s.kind === "Khu vực");
  const goiYDuAn = goiY.filter((s) => s.kind === "Dự án");

  const dong = (s: Suggestion, icon: LucideIcon, onClick: () => void, key: string) => (
    <button key={key} type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-black/[0.04] active:bg-black/[0.06]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cvr-surface text-cvr-body"><Icon i={icon} /></span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] text-cvr-ink">{s.label}</span>
        {s.sub && <span className="truncate text-[12px] text-cvr-muted">{s.sub}</span>}
      </span>
    </button>
  );
  const nhanNhom = (t: string) => <p className="px-2 pb-1 pt-3 text-[12px] font-semibold text-cvr-muted">{t}</p>;

  const dsGoiY = (
    <div>
      {kw && dong({ label: `Tìm “${kw}”`, kind: "Gợi ý", sub: "Dò trong tiêu đề, mô tả và địa chỉ của tin" }, Search, () => tim(kw), "tim")}
      {cauGoiY.map((g, i) => dong({ label: g.label, kind: "Gợi ý", sub: g.sub }, Search, () => tim(g.label), `c${i}`))}
      {ganDayHien.length > 0 && nhanNhom("Tìm kiếm gần đây")}
      {ganDayHien.map((s, i) => dong(s, Clock, () => chonGoiY(s), `g${i}`))}
      {goiYKhu.length > 0 && nhanNhom(kw ? "Khu vực" : "Gợi ý phổ biến")}
      {goiYKhu.map((s, i) => dong(s, MapPin, () => chonGoiY(s), `k${i}`))}
      {goiYDuAn.length > 0 && nhanNhom("Dự án")}
      {goiYDuAn.map((s, i) => dong(s, Building2, () => chonGoiY(s), `d${i}`))}
    </div>
  );

  // MỤC ĐÍCH: đúng kiểu nút tròn dùng chung trên trang chủ (khối "Bất động sản dành cho bạn", "Tin nổi bật")
  // MENU MỤC ĐÍCH (kiểu Batdongsan): hàng tab trên một đường kẻ mảnh, mục chọn gạch chân màu thương hiệu
  const tabsOf = (toi: boolean, gon = false) => (
    <div role="tablist" className={`flex justify-center border-b ${toi ? "border-white/15" : "border-black/10"}`}>
      {TABS.map((t) => {
        const on = muc === t.muc;
        return (
          <button
            key={t.muc}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setMuc(t.muc)}
            className={`relative whitespace-nowrap ${gon ? "px-3" : "px-6"} pb-3 pt-1 text-[15px] font-semibold sm:text-[16px] transition-colors duration-300 ${
              toi ? (on ? "text-white" : "text-[#a1a1a6] hover:text-white") : on ? "text-cvr-ink" : "text-cvr-muted hover:text-cvr-ink"
            }`}
          >
            {t.nhan}
            <span aria-hidden className={`absolute inset-x-4 -bottom-px h-[2px] rounded-full transition-transform duration-300 ${toi ? "bg-cvr-gold-soft" : "bg-cvr-ink"} ${on ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        );
      })}
    </div>
  );

  // HÀNG NHÓM LOẠI HÌNH (Bước 4 KE-HOACH-AIRBNB): link thật tới trang nhóm, đổi theo mục đích; Dự án không có
  const hangNhom = muc !== "duan" && (
    <nav aria-label="Loại hình bất động sản" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-4 sm:flex-wrap sm:justify-center sm:px-0">
      {nhomCua(mb).map((n) => (
        <Link
          key={n.slug}
          href={`${mb === "thue" ? "/cho-thue" : "/mua-ban"}/${n.slug}`}
          className="shrink-0 rounded-full border border-cvr-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-cvr-ink transition hover:border-cvr-ink active:scale-[0.97]"
        >
          {n.nhan}
        </Link>
      ))}
    </nav>
  );

  // CÂU DÀI (chủ dự án 17/10/2026: "khách gõ 1 câu 100 từ thì sao, ẩn đi à"): ô TỰ GIÃN theo chữ, tối đa ~5 dòng
  // rồi cuộn trong ô — khách luôn thấy hết mình đã gõ gì. Enter vẫn là tìm (không xuống dòng).
  const gianO = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  const oNhap = (cls: string, goiYO: string, autoFocus = false) => (
    <textarea
      ref={(el) => gianO(el)}
      rows={1}
      value={tuKhoa}
      autoFocus={autoFocus}
      onChange={(e) => { setTuKhoa(e.target.value.split("\n").join(" ")); gianO(e.currentTarget); }}
      onFocus={() => setMoPc(true)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); tim(tuKhoa); } }}
      placeholder={goiYO}
      aria-label="Tìm nhà đất"
      autoComplete="off"
      enterKeyHint="search"
      className={`no-scrollbar block resize-none overflow-y-auto ${cls}`}
    />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ═══ ĐIỆN THOẠI: menu mục đích · ô tìm viên thuốc một dòng (chạm mở màn tìm) · nhóm loại hình ═══ */}
      <div className="sm:hidden">
        {tabsOf(false, true)}
        <button
          type="button"
          onClick={() => setMo(true)}
          className="mt-3 flex h-12 w-full items-center gap-3 rounded-full border border-cvr-line bg-white px-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
        >
          <Icon i={Search} className="h-5 w-5 shrink-0 text-cvr-ink" w={2} />
          <span className={`min-w-0 flex-1 truncate text-[15px] ${kw ? "text-cvr-ink" : "text-cvr-muted"}`}>{kw || "Tìm nhà đất theo khu vực, dự án…"}</span>
        </button>
        {hangNhom}
      </div>

      {/* Màn tìm điện thoại (như Google): mục đích + X · ô gõ · gợi ý · nút Tìm kiếm */}
      {mo && (
        <div className="anim-truot-len fixed inset-0 z-[200] flex flex-col bg-white sm:hidden" role="dialog" aria-modal="true" aria-label="Tìm nhà đất">
          <div className="flex items-center gap-2 self-stretch pb-2 pl-2 pr-3 pt-3">
            <div className="min-w-0 flex-1">{tabsOf(false, true)}</div>
            <button type="button" aria-label="Đóng tìm kiếm" onClick={() => setMo(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-ink shadow-sm active:scale-95">
              <Icon i={X} className="h-4 w-4" w={2.2} />
            </button>
          </div>
          <div className="relative self-stretch px-4 pt-2">
            <span className="pointer-events-none absolute left-8 top-[32px] -translate-y-1/2 text-cvr-faint"><Icon i={Search} className="h-[18px] w-[18px]" w={2} /></span>
            {oNhap("max-h-[148px] min-h-12 w-full rounded-[24px] border border-[#dfe1e5] bg-white py-3 pl-11 pr-11 text-[16px] leading-6 text-cvr-ink placeholder-cvr-muted shadow-[0_1px_6px_rgba(32,33,36,0.18)] outline-none transition focus:border-transparent focus:shadow-[0_1px_8px_rgba(32,33,36,0.32)]", "Khu vực, dự án…", true)}
            {tuKhoa && (
              <button type="button" aria-label="Xoá từ khoá" onClick={() => setTuKhoa("")} className="absolute right-6 top-[32px] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint active:bg-black/5">
                <Icon i={X} className="h-4 w-4" w={2} />
              </button>
            )}
          </div>
          <div className="flex-1 self-stretch overflow-y-auto overscroll-contain px-2 pb-4 pt-2">{dsGoiY}</div>
          <div className="self-stretch border-t border-cvr-line bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={() => tim(tuKhoa)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cvr-blue text-[15px] font-semibold text-white transition active:scale-[0.98]">
              <Icon i={Search} className="h-[18px] w-[18px]" w={2.4} />
              Tìm kiếm
            </button>
          </div>
        </div>
      )}

      {/* ═══ MÁY TÍNH: menu mục đích gạch chân · ô tìm viên thuốc một dòng (tự giãn khi gõ dài) · nhóm loại hình ═══ */}
      <div ref={pcRef} className="relative mx-auto hidden max-w-[720px] sm:block">
        <div className="mb-3">{tabsOf(false)}</div>
        <div className="relative">
          <div className={`flex items-start rounded-[26px] border border-cvr-line bg-white transition-shadow duration-200 ${moPc ? "shadow-[0_6px_20px_rgba(0,0,0,0.12)]" : "shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"}`}>
            <label className="flex flex-1 cursor-text items-start gap-3 py-[11px] pl-5 pr-3">
              <Icon i={Search} className="mt-[3px] h-5 w-5 shrink-0 text-cvr-muted" w={2} />
              {oNhap("max-h-[130px] w-full bg-transparent text-[15px] leading-[26px] text-cvr-ink placeholder-cvr-muted !outline-none !ring-0 !shadow-none", "Tìm nhà đất theo khu vực, dự án hoặc gõ cả câu")}
            </label>
            <button
              type="button"
              onClick={() => tim(tuKhoa)}
              className="m-[5px] flex h-10 shrink-0 items-center justify-center rounded-full bg-cvr-blue px-6 text-[14px] font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95"
            >
              Tìm kiếm
            </button>
          </div>
          {moPc && (
            <div className="anim-xo-xuong absolute inset-x-0 top-full z-[120] mt-2 max-h-[70vh] overflow-y-auto rounded-3xl bg-white p-3 shadow-2xl shadow-black/15 ring-1 ring-black/5">
              {dsGoiY}
            </div>
          )}
        </div>
        {hangNhom}
      </div>
    </div>
  );
}
