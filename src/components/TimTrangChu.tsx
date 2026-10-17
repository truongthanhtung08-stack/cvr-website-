"use client";

import { useEffect, useRef, useState } from "react";
import { emptyFilters, filtersToParams, typeGroupsFor, type LocationSel } from "@/lib/filters";
import { saleCategories, rentCategories, nhomPseo } from "@/lib/categories";
import { suggest, goiYPhoBien, type Suggestion } from "@/lib/suggest";
import { parseQuery } from "@/lib/smartSearch";
import { timKhuVuc, slugKhuVuc } from "@/lib/khuVuc";
import { duongDanBuoc, duongDanTuCau, GIA_DUOI } from "@/lib/duongDanTim";

// ============================================================================
// BỘ TÌM TRANG CHỦ — KIỂU AIRBNB, THEO ĐÚNG NHU CẦU KHÁCH (chủ dự án 17/10/2026)
// ----------------------------------------------------------------------------
// Khách tìm nhà đất nghĩ theo thứ tự: mua hay thuê → ở đâu → loại gì → bao nhiêu tiền.
// Mỗi câu hỏi một bước (Airbnb: Ở đâu · Khi nào · Ai), không thêm gì khác:
//   • Điện thoại: trang chủ chỉ MỘT ô "Tìm nhà đất" → chạm mở màn tìm, ba thẻ lần lượt.
//   • Máy tính: một thanh ba ô [Ở đâu | Loại hình | Mức giá | Tìm kiếm], bấm ô nào xổ phần đó.
//   • Gõ cả câu ("căn hộ Nha Trang dưới 3 tỷ") → máy tách câu, đi thẳng trang đúng.
// Kết quả luôn về TRANG SẠCH đang lên Google khi khớp được (duongDanBuoc / duongDanTuCau),
// không thì về trang lọc như cũ. Chạy hoàn toàn ở trình duyệt — không thêm lần gọi máy chủ nào.
// ============================================================================

type Muc = "ban" | "thue" | "duan";
type Noi = { nhan: string; duong: string | null; loc: LocationSel; tuKhoa?: string };
type Nhom = { nhan: string; slug: string; items: string[] };

const RECENT_KEY = "cvr-recent-search"; // dùng chung lịch sử với ô tìm các trang danh sách

const P = {
  search: "M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z",
  x: "M6 18L18 6M6 6l12 12",
  clock: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  duAn: "M6 21V8l6-4 6 4v13M10 21v-4h4v4M9 10h1M14 10h1M9 13.5h1M14 13.5h1M3 21h18",
};
const TABS: { muc: Muc; nhan: string; icon: string }[] = [
  { muc: "ban", nhan: "Mua bán", icon: "M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01" },
  { muc: "thue", nhan: "Cho thuê", icon: "M14.5 9.5a4 4 0 10-3.4-1.9L3 15.7V19h3.3v-2h2v-2h2l1.6-1.6a4 4 0 002.6-.9zM16 6.5h.01" },
  { muc: "duan", nhan: "Dự án", icon: P.duAn },
];
// Biểu tượng nhóm loại hình (5 nhóm chuẩn — typeGroupsFor), không trùng biểu tượng mục đích
const ICON_NHOM: Record<string, string> = {
  "can-ho-chung-cu": "M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 9h4a1 1 0 011 1v11M8 8h3M8 12h3M8 16h3M3 21h18",
  nha: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5",
  dat: "M3 18l4-4 3 2 5-5 6 6M3 18h18v2H3zM15 7a2 2 0 100-4 2 2 0 000 4",
  "nghi-duong": "M12 21v-7M12 14c-4 0-6-3-6-6 3 0 6 2 6 6zM12 14c4 0 6-3 6-6-3 0-6 2-6 6zM4 21h16",
  "kho-nha-xuong": "M3 21V10l5-3v3l5-3v3l5-3v14M3 21h18M7 21v-4h3v4M14 15h3",
  "phong-tro": "M4 20V10a2 2 0 012-2h12a2 2 0 012 2v10M4 15h16M8 12h2M3 20h18",
  "van-phong-mat-bang": "M4 21V3h11v18M15 8h5v13M7 7h2M11 7h2M7 11h2M11 11h2M7 15h2M11 15h2M3 21h18",
};

function Icon({ d, className = "h-5 w-5", w = 1.7 }: { d: string; className?: string; w?: number }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d={d} />
    </svg>
  );
}

// 5 nhóm loại hình của mục đích → trang nhóm (đọc thẳng nguồn chung, "Khác" chỉ ở Lọc thêm)
function nhomCua(muc: "ban" | "thue"): Nhom[] {
  const trang = [...(muc === "thue" ? rentCategories : saleCategories), ...nhomPseo(muc)];
  return typeGroupsFor(muc)
    .filter((g) => g.label !== "Khác")
    .flatMap((g) => {
      const c = trang.find((x) => x.types.length === g.items.length && g.items.every((t) => x.types.includes(t)));
      return c ? [{ nhan: g.label, slug: c.slug, items: g.items }] : [];
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

const donVi = (muc: "ban" | "thue") => (muc === "thue" ? "triệu" : "tỷ");

export default function TimTrangChu() {
  const [muc, setMuc] = useState<Muc>("ban");
  const [noi, setNoi] = useState<Noi | null>(null);
  const [tuKhoa, setTuKhoa] = useState("");
  const [nhom, setNhom] = useState<Nhom | null>(null);
  const [gia, setGia] = useState<number | null>(null);
  const [mo, setMo] = useState(false); // điện thoại: màn tìm
  const [buoc, setBuoc] = useState<1 | 2 | 3>(1); // điện thoại: thẻ đang mở
  const [moPc, setMoPc] = useState<0 | 1 | 2 | 3>(0); // máy tính: ô đang xổ
  const [ganDay, setGanDay] = useState<Suggestion[]>([]);
  const pcRef = useRef<HTMLDivElement>(null);
  const oPcRef = useRef<HTMLInputElement>(null);

  const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";
  const coBuoc = muc !== "duan"; // Dự án chỉ hỏi "Ở đâu"
  const dsNhom = nhomCua(mb);

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

  // Máy tính: bấm ra ngoài thanh tìm / Esc → đóng ô đang xổ
  useEffect(() => {
    if (!moPc) return;
    const onDoc = (e: Event) => { if (!pcRef.current?.contains(e.target as Node)) setMoPc(0); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoPc(0); };
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

  function tim(kwGhiDe?: string) {
    const kw = (kwGhiDe ?? (noi ? "" : tuKhoa)).trim();
    if (kw) luu({ label: kw, kind: "Gợi ý", sub: "Từ khoá đã tìm", keyword: kw });
    const loc = noi ? [noi.loc] : [];
    const chu = [kw, noi?.tuKhoa].filter(Boolean).join(" ");
    if (muc === "duan") {
      const p = filtersToParams({ ...emptyFilters(), keyword: chu, locations: loc });
      p.set("mode", "Dự án");
      return di(`/du-an?${p.toString()}#ket-qua`);
    }
    // Chỉ gõ câu → máy tách câu (loại hình · thành phố/tỉnh · giá) về trang sạch
    if (kw && !nhom && gia == null) { const u = duongDanTuCau(mb, kw); if (u) return di(u); }
    // Chọn theo bước → trang sạch nếu ghép được
    if (!kw && (!noi || noi.duong)) { const u = duongDanBuoc(mb, noi?.duong ?? null, nhom?.slug ?? null, gia); if (u) return di(u); }
    const p = filtersToParams({
      ...emptyFilters(), keyword: chu, locations: loc, types: nhom?.items ?? [],
      priceMax: gia == null ? null : mb === "thue" ? gia / 1000 : gia,
    });
    p.set("mode", mb === "thue" ? "Cho thuê" : "Mua bán");
    di(`${mb === "thue" ? "/cho-thue" : "/mua-ban"}?${p.toString()}#ket-qua`);
  }

  // Xong một bước → sang bước sau (Dự án chỉ có một bước)
  const sang = (n: 2 | 3 | 0) => {
    const toi = coBuoc ? n : 0;
    if (toi) setBuoc(toi);
    setMoPc((m) => (m ? toi : 0));
  };

  function chonGoiY(s: Suggestion) {
    luu(s);
    if (s.kind === "Khu vực") { setNoi(noiTu(s)); setTuKhoa(s.label); sang(2); return; }
    if (s.href) return di(s.href);
    tim(s.keyword ?? s.label);
  }

  const doiMuc = (m: Muc) => { setMuc(m); setNhom(null); setGia(null); };
  const xoaHet = () => { setNoi(null); setTuKhoa(""); setNhom(null); setGia(null); setBuoc(1); };
  const coChon = !!(noi || tuKhoa.trim() || nhom || gia != null);

  // Tóm tắt từng bước — gõ cả câu thì hiện luôn phần máy đã hiểu
  const hieu = !noi && tuKhoa.trim() ? parseQuery(tuKhoa) : null;
  const tomNoi = noi?.nhan || tuKhoa.trim() || "Toàn quốc";
  const tomLoai = nhom?.nhan ?? (hieu?.types.length ? hieu.types.join(", ") : "Tất cả");
  const giaHieu = hieu?.priceMaxTy != null ? (mb === "thue" ? Math.round(hieu.priceMaxTy * 1000) : hieu.priceMaxTy) : null;
  const tomGia = gia != null ? `Dưới ${gia} ${donVi(mb)}` : giaHieu != null ? `Dưới ${giaHieu} ${donVi(mb)}` : "Bất kỳ";

  // ── Nội dung từng bước (dùng chung điện thoại & máy tính) ──
  const kw = noi ? "" : tuKhoa.trim();
  const goiY: Suggestion[] = kw
    ? suggest(kw, 12).filter((s) => s.kind === "Khu vực" || s.kind === "Dự án").slice(0, 6)
    : goiYPhoBien(mb);
  const ganDayHien = kw ? [] : ganDay.slice(0, 3);

  const dong = (s: Suggestion, icon: string, onClick: () => void, key: string) => (
    <button key={key} type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-black/[0.04] active:bg-black/[0.06]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cvr-surface text-cvr-body"><Icon d={icon} /></span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] text-cvr-ink">{s.label}</span>
        {s.sub && <span className="truncate text-[12px] text-cvr-muted">{s.sub}</span>}
      </span>
    </button>
  );
  const nhanNhom = (t: string) => <p className="px-2 pb-1 pt-3 text-[12px] font-semibold text-cvr-muted">{t}</p>;

  const dsNoi = (
    <div>
      {kw && dong({ label: `Tìm “${kw}”`, kind: "Gợi ý", sub: "Dò trong tiêu đề, mô tả và địa chỉ của tin" }, P.search, () => tim(), "tim")}
      {ganDayHien.length > 0 && nhanNhom("Tìm kiếm gần đây")}
      {ganDayHien.map((s, i) => dong(s, P.clock, () => chonGoiY(s), `g${i}`))}
      {!kw && nhanNhom("Gợi ý phổ biến")}
      {goiY.map((s, i) => dong(s, s.kind === "Dự án" ? P.duAn : P.pin, () => chonGoiY(s), `p${i}`))}
    </div>
  );

  const oLoai = (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {dsNhom.map((n) => {
        const chon = nhom?.slug === n.slug;
        return (
          <button
            key={n.slug}
            type="button"
            onClick={() => { setNhom(chon ? null : n); if (!chon) sang(3); }}
            className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition active:scale-[0.97] ${chon ? "border-cvr-ink bg-cvr-surface ring-1 ring-cvr-ink" : "border-cvr-line hover:border-cvr-ink"}`}
          >
            <Icon d={ICON_NHOM[n.slug] ?? ICON_NHOM.nha} className="h-7 w-7 text-cvr-ink" w={1.5} />
            <span className="text-[14px] font-semibold text-cvr-ink">{n.nhan}</span>
          </button>
        );
      })}
    </div>
  );

  const oGia = (
    <div className="flex flex-wrap gap-2">
      {GIA_DUOI[mb].map((x) => {
        const chon = gia === x;
        return (
          <button
            key={x}
            type="button"
            onClick={() => { setGia(chon ? null : x); if (!chon) setMoPc(0); }}
            className={`rounded-full border px-4 py-2.5 text-[14px] font-medium transition active:scale-[0.97] ${chon ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line text-cvr-ink hover:border-cvr-ink"}`}
          >
            Dưới {x} {donVi(mb)}
          </button>
        );
      })}
    </div>
  );

  const tabsEl = (
    <div role="tablist" className="flex items-end justify-center gap-8">
      {TABS.map((t) => {
        const on = muc === t.muc;
        return (
          <button
            key={t.muc}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => doiMuc(t.muc)}
            className={`group relative flex flex-col items-center gap-1 pb-2.5 transition-colors duration-300 ${on ? "text-cvr-ink" : "text-cvr-faint hover:text-cvr-ink"}`}
          >
            <Icon d={t.icon} className="h-7 w-7 transition-transform duration-300 group-active:scale-90" w={1.5} />
            <span className="text-[13px] font-semibold">{t.nhan}</span>
            <span aria-hidden className={`absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-cvr-ink transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        );
      })}
    </div>
  );

  const oNhap = (cls: string, ref?: React.Ref<HTMLInputElement>, autoFocus?: boolean) => (
    <input
      ref={ref}
      type="text"
      value={tuKhoa}
      autoFocus={autoFocus}
      onChange={(e) => { setTuKhoa(e.target.value); setNoi(null); }}
      onFocus={() => setMoPc((m) => (m === 0 || m === 1 ? 1 : m))}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); tim(); } }}
      placeholder="Khu vực, dự án hoặc gõ cả câu"
      aria-label="Ở đâu"
      autoComplete="off"
      enterKeyHint="search"
      className={cls}
    />
  );

  // ── ĐIỆN THOẠI: thẻ của từng bước (mở = câu hỏi lớn + nội dung · đóng = một dòng tóm tắt) ──
  const the = (n: 1 | 2 | 3, hoi: string, ten: string, tom: string, noiDung: React.ReactNode) =>
    buoc === n ? (
      <div key={n} className="anim-xo-xuong rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
        <h3 className="mb-3 text-[22px] font-semibold tracking-tight text-cvr-ink">{hoi}</h3>
        {noiDung}
      </div>
    ) : (
      <button key={n} type="button" onClick={() => setBuoc(n)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] active:scale-[0.99]">
        <span className="text-cvr-muted">{ten}</span>
        <span className="truncate font-semibold text-cvr-ink">{tom}</span>
      </button>
    );

  const oPc = (n: 1 | 2 | 3) =>
    `min-w-0 rounded-full px-7 py-3 text-left transition ${moPc === n ? "bg-white shadow-[0_3px_14px_rgba(0,0,0,0.12)]" : "hover:bg-black/[0.04]"}`;

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* ═══ ĐIỆN THOẠI: một ô duy nhất ═══ */}
      <button
        type="button"
        onClick={() => { setBuoc(1); setMo(true); }}
        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-white px-5 text-[15px] font-semibold text-cvr-ink shadow-[0_3px_12px_rgba(0,0,0,0.10)] ring-1 ring-cvr-line sm:hidden"
      >
        <Icon d={P.search} className="h-[18px] w-[18px] shrink-0" w={2.2} />
        <span className="truncate">{noi?.nhan || tuKhoa.trim() || "Tìm nhà đất"}</span>
      </button>

      {mo && (
        <div className="anim-truot-len fixed inset-0 z-[200] flex flex-col bg-cvr-surface sm:hidden" role="dialog" aria-modal="true" aria-label="Tìm nhà đất">
          <div className="relative self-stretch px-14 pb-2 pt-3">
            {tabsEl}
            <button type="button" aria-label="Đóng tìm kiếm" onClick={() => setMo(false)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-ink shadow-sm active:scale-95">
              <Icon d={P.x} className="h-4 w-4" w={2.2} />
            </button>
          </div>
          <div className="flex-1 space-y-3 self-stretch overflow-y-auto px-3 pb-4 pt-1">
            {the(1, "Ở đâu?", "Ở đâu", tomNoi, (
              <>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cvr-ink"><Icon d={P.search} className="h-[18px] w-[18px]" w={2} /></span>
                  {oNhap("h-12 w-full rounded-2xl border border-cvr-line bg-white pl-11 pr-10 text-[16px] text-cvr-ink placeholder-cvr-muted outline-none transition focus:border-cvr-ink", undefined, true)}
                  {tuKhoa && (
                    <button type="button" aria-label="Xoá từ khoá" onClick={() => { setTuKhoa(""); setNoi(null); }} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint active:bg-black/5">
                      <Icon d={P.x} className="h-4 w-4" w={2} />
                    </button>
                  )}
                </div>
                <div className="-mx-2 mt-1">{dsNoi}</div>
              </>
            ))}
            {coBuoc && the(2, "Loại hình", "Loại hình", tomLoai, oLoai)}
            {coBuoc && the(3, "Mức giá", "Mức giá", tomGia, oGia)}
          </div>
          <div className="flex items-center justify-between self-stretch border-t border-cvr-line bg-white px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={xoaHet} disabled={!coChon} className="text-[15px] font-semibold text-cvr-ink underline underline-offset-4 disabled:text-cvr-faint disabled:no-underline">
              Xoá tất cả
            </button>
            <button type="button" onClick={() => tim()} className="flex h-12 items-center gap-2 rounded-xl bg-cvr-blue px-6 text-[15px] font-semibold text-white transition active:scale-95">
              <Icon d={P.search} className="h-[18px] w-[18px]" w={2.4} />
              Tìm kiếm
            </button>
          </div>
        </div>
      )}

      {/* ═══ MÁY TÍNH: mục đích + thanh ba ô ═══ */}
      <div ref={pcRef} className="relative hidden sm:block">
        <div className="mb-5">{tabsEl}</div>
        <div className={`flex items-center rounded-full border border-cvr-line shadow-[0_3px_12px_rgba(0,0,0,0.08)] transition-colors duration-300 ${moPc ? "bg-cvr-surface" : "bg-white"}`}>
          <label className={`${oPc(1)} flex-[1.6] cursor-text`} onClick={() => setMoPc(1)}>
            <span className="block text-[12px] font-semibold text-cvr-ink">Ở đâu</span>
            {oNhap("w-full truncate bg-transparent text-[14px] text-cvr-ink placeholder-cvr-muted outline-none", oPcRef)}
          </label>
          {coBuoc && (
            <>
              <span aria-hidden className="h-8 w-px bg-cvr-line" />
              <button type="button" className={`${oPc(2)} flex-1`} onClick={() => setMoPc(moPc === 2 ? 0 : 2)}>
                <span className="block text-[12px] font-semibold text-cvr-ink">Loại hình</span>
                <span className="block truncate text-[14px] text-cvr-muted">{tomLoai}</span>
              </button>
              <span aria-hidden className="h-8 w-px bg-cvr-line" />
              <button type="button" className={`${oPc(3)} flex-1`} onClick={() => setMoPc(moPc === 3 ? 0 : 3)}>
                <span className="block text-[12px] font-semibold text-cvr-ink">Mức giá</span>
                <span className="block truncate text-[14px] text-cvr-muted">{tomGia}</span>
              </button>
            </>
          )}
          <button type="button" onClick={() => tim()} className="m-2 ml-auto flex h-12 shrink-0 items-center gap-2 rounded-full bg-cvr-blue px-6 text-[15px] font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95">
            <Icon d={P.search} className="h-[18px] w-[18px]" w={2.4} />
            Tìm kiếm
          </button>
        </div>
        {moPc !== 0 && (
          <div
            className={`anim-xo-xuong absolute top-full z-[120] mt-3 max-h-[70vh] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl shadow-black/15 ring-1 ring-black/5 ${
              moPc === 1 ? "left-0 w-[440px]" : moPc === 2 ? "left-[30%] w-[460px]" : "right-24 w-[380px]"
            }`}
          >
            {moPc === 1 ? dsNoi : moPc === 2 ? oLoai : oGia}
          </div>
        )}
      </div>
    </div>
  );
}
