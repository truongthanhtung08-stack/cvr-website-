"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { applyFilters, emptyFilters, filtersToParams, normalizeVi, type Filters, type LocationSel } from "@/lib/filters";
import { suggest, type Suggestion } from "@/lib/suggest";
import { parseQuery } from "@/lib/smartSearch";
import type { CauGoiY, TinDem } from "@/lib/goiYTrangChu";
import TruongLocTrangChu, { locTuCau } from "@/components/TruongLocTrangChu";
import { timKhuVuc, slugKhuVuc } from "@/lib/khuVuc";
import { duongDanBuoc, duongDanSach, duongDanTuCau } from "@/lib/duongDanTim";
import { MagnifyingGlass, ClockCounterClockwise, X, CircleNotch, type Icon as PhIcon } from "@phosphor-icons/react";
import { TabIcon, type TenIcon } from "@/components/MobileTabBar";

// ============================================================================
// BỘ TÌM TRANG CHỦ — THAY HERO (chủ dự án 17/10/2026)
// ----------------------------------------------------------------------------
// Ghép Google + Airbnb theo đúng ý định người tìm nhà đất, cái gì không cần thì bỏ:
//   ① Mục đích: Mua bán · Cho thuê · Dự án (Airbnb: hàng mục có biểu tượng).
//   ② MỘT ô tìm (Google): gõ đến đâu gợi ý CẢ CÂU đến đó, khu vực / dự án chia nhóm; chọn là ra kết quả.
//      Gõ cả câu ("căn hộ Nha Trang dưới 3 tỷ") → máy tách ý định, đi thẳng trang sạch đang lên Google.
//   ③ (Hàng loại hình bấm nhanh đã bỏ 17/10/2026 — trường "Loại hình" trong bảng xổ thay thế.)
//   ④ Hàng trường lọc chi tiết (Khu vực · Loại hình · Giá · Diện tích · Phòng ngủ) cho khách muốn tìm chính xác:
//      gõ câu → các trường tự điền; nút tìm đếm ngay số tin khớp ("Xem 24 tin"); ghép được thì về trang sạch.
// Chạy hoàn toàn ở trình duyệt — không thêm lần gọi máy chủ nào.
// ============================================================================

type Muc = "ban" | "thue" | "duan";
type Noi = { nhan: string; duong: string | null; loc: LocationSel; tuKhoa?: string };

const RECENT_KEY = "cvr-recent-search"; // dùng chung lịch sử với ô tìm các trang danh sách
const MUC_KEY = "cvr-muc-tim"; // mục đích khách chọn lần trước (Mua bán · Cho thuê · Dự án)

// MENU MỤC ĐÍCH KIỂU AIRBNB (chủ dự án 17/10/2026): biểu tượng nằm trên chữ, căn giữa, mục chọn gạch chân đen.
// Biểu tượng ĐỒNG BỘ TOÀN WEB (chủ dự án 17/10/2026): đúng bộ của thanh menu đáy (MobileTabBar) — nét mảnh,
// mục đang chọn tô đặc màu xanh.
const TABS: { muc: Muc; nhan: string; icon: TenIcon }[] = [
  { muc: "ban", nhan: "Mua bán", icon: "muaBan" },
  { muc: "thue", nhan: "Cho thuê", icon: "choThue" },
  { muc: "duan", nhan: "Dự án", icon: "duAnC" },
];

function Icon({ i: I, className = "h-5 w-5", dam = false, nen = false }: { i: PhIcon; className?: string; w?: number; dam?: boolean; nen?: boolean }) {
  return <I className={className} weight={nen ? "duotone" : dam ? "bold" : "regular"} aria-hidden />;
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

// Chữ khách gõ không có trong tiêu đề trang (bỏ qua khi so): "mua nhà Huế" ≈ "Bán nhà … Huế"
const BO_QUA = new Set(["mua", "can", "tim", "o", "tai", "khu", "vuc"]);
const tuCua = (s: string) => normalizeVi(s).replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);

/** Cụm khớp chữ đang gõ: mọi từ gõ đều là ĐẦU một từ trong cụm ("nhà đà" → "Bán nhà đất Đà Nẵng") */
function locCauGoiY(ds: CauGoiY[], go: string, muc: "ban" | "thue", toiDa: number): CauGoiY[] {
  const tu = tuCua(go).filter((t) => !BO_QUA.has(t));
  if (!tu.length && go.trim()) return [];
  if (!tu.length) {
    // Khách mới, chưa gõ: CỤM DÀI cụ thể (loại nhà + nơi, có giá/phường càng tốt — đúng kiểu từ khoá dài trang pSEO),
    // mỗi tỉnh + loại nhà một cụm cho đủ nhu cầu; không đưa cụm trần "Bán nhà Đà Nẵng".
    const da = new Set<string>();
    const cuThe = (c: CauGoiY) => { const n = normalizeVi(c.nhan); return (n.includes(" duoi ") ? 2 : 0) + (/ (phuong|xa|quan|huyen) /.test(` ${n} `) ? 1 : 0); };
    return ds.filter((c) => c.muc === muc && c.loai)
      .map((c, i) => ({ c, i, d: cuThe(c) }))
      .sort((a, b) => b.d - a.d || a.i - b.i)
      .filter(({ c }) => {
        const khoa = c.href.split("/").slice(2, 4).join("/") + "|" + normalizeVi(c.nhan).split(" ").slice(1, 3).join(" ");
        if (da.has(khoa)) return false;
        da.add(khoa);
        return true;
      })
      .map((x) => x.c)
      .slice(0, toiDa);
  }
  // Gõ CÓ DẤU thì so đúng dấu ("đà" không khớp "đất"); gõ không dấu thì so không dấu
  const coDau = (s: string) => s.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const tuDau = coDau(go).filter((t) => !BO_QUA.has(normalizeVi(t)));
  // Đếm số từ gõ khớp trong từng cụm. Câu dài ("căn hộ 2 phòng ngủ Ngũ Hành Sơn") không cụm nào khớp
  // HẾT thì vẫn gợi ý cụm khớp NHIỀU từ nhất (chủ dự án 17/10/2026: "có gợi ý theo từ khoá khách gõ").
  const cham = ds.map((c) => {
    const chu = tuCua(c.nhan);
    const chuDau = coDau(c.nhan);
    const n = tuDau.filter((t) => normalizeVi(t) === t ? chu.some((w) => w.startsWith(t)) : chuDau.some((w) => w.startsWith(t))).length;
    return { c, n };
  });
  const du = tuDau.length;
  const p = parseQuery(go);
  // CÂU ĐÃ RÕ Ý (có nơi hoặc loại nhà): gợi ý BÁM ĐÚNG Ý máy đã hiểu, không đếm chữ trùng vu vơ
  // (chủ dự án 17/10/2026: "đất giá rẻ dưới 3 tỷ tại Hòa Xuân" từng ra "căn hộ Khánh Hòa" vì chữ "hòa").
  // Thứ tự ưu tiên: đúng NƠI (phường/quận → tỉnh) > đúng LOẠI NHÀ > đúng GIÁ > số chữ khớp.
  const tinhY = p.place?.province ?? p.places[0];
  const loaiY = p.types[0] ? normalizeVi(p.types[0]).split(" ")[0] : "";
  if (tinhY || loaiY) {
    const nTinh = tinhY ? normalizeVi(tinhY) : "";
    const nSau = [p.place?.ward, p.place?.district].filter(Boolean).map((x) => normalizeVi(x!));
    const diem = ds.map((c) => {
      const n = normalizeVi(c.nhan);
      const w = ` ${n} `;
      // "nhà đất" là cả nhóm chung, KHÔNG phải loại "đất" — bỏ cụm này ra trước khi so loại nhà
      // (lỗi 17/10/2026: gõ "đất hòa xuân" ra "Bán nhà đất Phường Cẩm Lệ" đứng trên "Bán đất nền Đà Nẵng")
      const wLoai = w.replace(" nha dat ", " ");
      if (nTinh && !n.includes(nTinh)) return { c, d: -1 };                 // khác tỉnh → loại
      if (loaiY && !wLoai.includes(" " + loaiY + " ") && !w.includes(" nha dat ")) return { c, d: -1 }; // khác loại nhà → loại
      let d = c.muc === muc ? 256 : 0;                                        // đúng Mua bán / Cho thuê trước
      if (loaiY && wLoai.includes(" " + loaiY + " ")) d += 64;               // đúng loại nhà
      if (nSau.some((x) => n.includes(x))) d += 32;                          // đúng phường / quận
      else if (/ (phuong|xa) /.test(w)) { if (nSau.length) return { c, d: -1 }; d -= 8; } // phường KHÁC: khách đã nói rõ nơi → loại hẳn
      if (p.priceMaxTy != null && n.includes("duoi " + p.priceMaxTy + " ty")) d += 8;
      else if (p.priceMaxTy != null && n.includes("duoi ")) d += 4;
      d += tu.filter((t) => w.includes(" " + t)).length;
      return { c, d };
    }).filter((x) => x.d > -1);
    return diem
      .sort((a, b) => b.d - a.d || Number(b.c.muc === muc) - Number(a.c.muc === muc))
      .map((x) => x.c)
      .slice(0, toiDa);
  }
  // Cùng số từ khớp: cụm đúng NƠI khách gõ đứng trước (khu vực là mục ưu tiên số một)
  const noi = [p.place?.ward, p.place?.district, ...p.places].filter(Boolean).map((x) => normalizeVi(x!));
  for (const x of cham) if (noi.some((n) => normalizeVi(x.c.nhan).includes(n))) x.n += 0.5;
  const khop = cham
    .filter((x) => x.n >= du || (du >= 3 && x.n >= 2))
    .sort((a, b) => b.n - a.n || Number(b.c.muc === muc) - Number(a.c.muc === muc))
    .map((x) => x.c);
  // Đúng mục đang chọn trước (Mua bán / Cho thuê), giữ thứ tự nhiều tin trước
  return [...khop.filter((c) => c.muc === muc), ...khop.filter((c) => c.muc !== muc)].slice(0, toiDa);
}

/** goiYTin: cụm từ khoá dài dựng từ tin thật ở máy chủ (goiYTrangChu) */
export default function TimTrangChu({ goiYTin, tinDem }: { goiYTin?: CauGoiY[]; tinDem?: TinDem[] }) {
  const [mucDangChon, setMuc] = useState<Muc>("ban");
  const muc = mucDangChon;
  const [tuKhoa, setTuKhoa] = useState("");
  const [mo, setMo] = useState(false); // điện thoại: màn tìm
  const [moPc, setMoPc] = useState(false); // máy tính: bảng gợi ý
  const [ganDay, setGanDay] = useState<Suggestion[]>([]);
  const [boLoc, setLoc] = useState<Filters>(emptyFilters); // trường lọc chi tiết
  const [dangTim, setDangTim] = useState(false); // vừa bấm tìm, đang chờ trang kết quả
  const router = useRouter();
  // BÀN PHÍM THẬT (đo bằng visualViewport): chỉ khi màn nhìn thấy co lại > 150px mới ẩn tiêu đề + hai thẻ trường.
  // Không dùng lớp ban-phim-mo vì lớp đó ĐOÁN "đang gõ" ngay khi ô có con trỏ (trình duyệt trong app không báo bàn phím)
  // → máy chưa bật bàn phím mà màn đã mất tiêu đề và thẻ (ảnh chủ dự án 17/10/2026).
  const [phimMo, setPhimMo] = useState(false);
  const [dangDong, setDangDong] = useState(false); // màn tìm / bảng xổ đang khép lại (chạy chuyển động đóng)
  const dongNoi = () => { setDangDong(true); setTimeout(() => { setMo(false); setDangDong(false); }, 200); };
  // NÚT QUAY LẠI CỦA ĐIỆN THOẠI (chủ dự án 17/10/2026): mở màn tìm là thêm một bước vào lịch sử → bấm ← chỉ
  // ĐÓNG màn tìm, khách vẫn ở trang chủ (không văng khỏi trang như trước). Nút X cũng đi đường này.
  const oVienRef = useRef<HTMLButtonElement>(null);
  const theRef = useRef<HTMLDivElement>(null);
  const viTriO = useRef<DOMRect | null>(null);
  const moMo = () => { viTriO.current = oVienRef.current?.getBoundingClientRect() ?? null; setMo(true); try { history.pushState({ ...history.state, cvrTim: 1 }, ""); } catch { /* bỏ qua */ } };
  // THANH TÌM PHÌNH THÀNH THẺ (chủ dự án 17/10/2026: "làm y như Airbnb"): đo khoảng lệch giữa thanh tìm vừa bấm và
  // thẻ tìm, đặt vào biến CSS TRƯỚC khi vẽ → chuyển động bắt đầu đúng vị trí + chiều cao thanh tìm rồi mở ra.
  useLayoutEffect(() => {
    const the = theRef.current, o = viTriO.current;
    if (!mo || !the || !o) return;
    const t = the.getBoundingClientRect();
    the.style.setProperty("--tu-y", `${Math.round(o.top - t.top)}px`);
    the.style.setProperty("--tu-x", `${Math.round(o.left - t.left)}px`);
    the.style.setProperty("--tu-day", `${Math.max(0, Math.round(t.height - o.height))}px`);
    the.style.setProperty("--tu-phai", `${Math.max(0, Math.round(t.width - o.width))}px`);
  }, [mo]);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!mo || !vv) return;
    const cao = window.innerHeight;
    const do_ = () => setPhimMo(cao - vv.height > 150);
    vv.addEventListener("resize", do_);
    return () => { vv.removeEventListener("resize", do_); setPhimMo(false); };
  }, [mo]);
  const dongMo = () => { if (history.state?.cvrTim) history.back(); else dongNoi(); };
  const dongPc = () => { setDangDong(true); setTimeout(() => { setMoPc(false); setDangDong(false); }, 160); };
  const xoaHet = () => { setTuKhoa(""); setLoc(emptyFilters()); };
  const pcRef = useRef<HTMLDivElement>(null);

  const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";

  const daDocMuc = useRef(false);
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc lịch sử một lần khi mở
      if (Array.isArray(r)) setGanDay(r);
      // KHÁCH QUAY LẠI mở sẵn mục lần trước (người thuê quay lại để thuê — không bắt chọn lại menu)
      const m = localStorage.getItem(MUC_KEY);
      if (m === "ban" || m === "thue" || m === "duan") setMuc(m);
    } catch { /* bỏ qua */ }
    daDocMuc.current = true;
  }, []);
  useEffect(() => {
    if (!daDocMuc.current) return;
    try { localStorage.setItem(MUC_KEY, muc); } catch { /* bỏ qua */ }
    // khối "Tìm kiếm phổ biến" cuối trang nghe tín hiệu này để đổi tab theo mục khách vừa chọn
    window.dispatchEvent(new Event("cvr-muc-tim"));
  }, [muc]);

  // Màn tìm điện thoại: khoá cuộn trang phía sau · Esc đóng
  useEffect(() => {
    if (!mo) return;
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dongMo(); };
    const onPop = () => dongNoi();
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => { document.body.style.overflow = cu; document.removeEventListener("keydown", onKey); window.removeEventListener("popstate", onPop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dongMo/dongNoi chỉ đổi state, không cần gắn lại
  }, [mo]);

  // Máy tính: bấm ra ngoài thanh tìm / Esc → đóng bảng gợi ý
  useEffect(() => {
    if (!moPc) return;
    const onDoc = (e: Event) => {
      const t = e.target as Element;
      if (pcRef.current?.contains(t) || t.closest?.(".cvr-pop, [role='dialog']")) return;
      dongPc();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dongPc(); };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [moPc]);

  // LỊCH SỬ THEO MỤC (chủ dự án 17/10/2026: menu Dự án mà vẫn hiện câu tìm nhà đất): lưu kèm mục lúc tìm
  const luu = (s: Suggestion) => {
    const next = [{ ...s, muc } as Suggestion, ...ganDay.filter((x) => x.label !== s.label)].slice(0, 12);
    setGanDay(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
  };
  // XOÁ LỊCH SỬ: từng dòng (dấu ×) hoặc tất cả
  const boGanDay = (label?: string) => {
    const next = label ? ganDay.filter((x) => x.label !== label) : [];
    setGanDay(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
  };

  // BẤM TÌM PHẢI THẤY WEB ĐANG TÌM (chủ dự án 17/10/2026: "thấy nó cứng đơ"): nút đổi sang vòng xoay ngay, chuyển
  // trang kiểu Next (router) để trang kết quả hiện khung chờ tức thì thay vì tải lại cả trang
  const di = (url: string) => { setDangTim(true); router.push(url); };

  // Tìm theo câu gõ, hoặc theo một nơi vừa chọn
  function tim(cau: string, n: Noi | null = null, mucGhiDe?: Muc) {
    const muc = mucGhiDe ?? mucDangChon;
    const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";
    const kw = cau.trim();
    if (kw && !n) luu({ label: kw, kind: "Gợi ý", sub: "Từ khoá đã tìm", keyword: kw });
    // KHÁCH PHẢI THẤY CÂU MÌNH ĐÃ GÕ (chủ dự án 17/10/2026): trường lọc chỉ là phần máy tự tách từ câu → đi
    // đường câu gõ (trang kết quả hiện nguyên câu trong ô tìm). Khách tự chỉnh trường → tìm theo trường, kèm câu.
    const tuDong = !!kw && JSON.stringify(boLoc) === JSON.stringify(muc === "duan" ? emptyFilters() : locTuCau(kw, mb));
    if (!n && coLoc && !tuDong) {
      if (muc === "duan") {
        const p = filtersToParams({ ...emptyFilters(), keyword: kw, locations: boLoc.locations, project: boLoc.project });
        p.set("mode", "Dự án");
        return di(`/du-an?${p.toString()}`);
      }
      const u = kw ? null : duongDanSach(mb, boLoc);
      if (u) return di(u);
      const p = filtersToParams({ ...boLoc, keyword: kw });
      p.set("mode", mb === "thue" ? "Cho thuê" : "Mua bán");
      return di(`${mb === "thue" ? "/cho-thue" : "/mua-ban"}?${p.toString()}`);
    }
    const loc = n ? [n.loc] : [];
    const chu = n ? n.tuKhoa ?? "" : kw;
    if (muc === "duan") {
      const p = filtersToParams({ ...emptyFilters(), keyword: chu, locations: loc });
      p.set("mode", "Dự án");
      return di(`/du-an?${p.toString()}`);
    }
    // Câu gõ → máy tách ý định (loại hình · thành phố/tỉnh · giá) về trang sạch
    if (kw && !n) { const u = duongDanTuCau(mb, kw); if (u) return di(u); }
    // Nơi đã chọn / chưa nhập gì → trang tỉnh, thành phố hoặc trang mục
    if (!kw || (n && n.duong)) { const u = duongDanBuoc(mb, n?.duong ?? null, null, null); if (u) return di(u); }
    const p = filtersToParams({ ...emptyFilters(), keyword: chu, locations: loc });
    p.set("mode", mb === "thue" ? "Cho thuê" : "Mua bán");
    di(`${mb === "thue" ? "/cho-thue" : "/mua-ban"}?${p.toString()}`);
  }

  // Chọn một gợi ý là ra kết quả luôn (như Google)
  function chonGoiY(s: Suggestion) {
    luu(s);
    if (s.kind === "Khu vực") { setTuKhoa(s.label); return tim("", noiTu(s)); }
    if (s.href) return di(s.href);
    tim(s.keyword ?? s.label);
  }

  // ── GỢI Ý THEO QUY TẮC GOOGLE (chủ dự án 17/10/2026): chưa gõ → chỉ những lần khách đã tìm; đang gõ →
  // MỘT danh sách cụm từ khoá khớp chữ gõ (kể cả tên dự án), không tiêu đề nhóm, mỗi cụm một dòng.
  const kw = tuKhoa.trim();
  // Chỉ hiện lịch sử ĐÚNG mục đang chọn; câu cũ chưa gắn mục thì đoán theo chữ (có "thuê" → Cho thuê, còn lại → Mua bán)
  const mucCua = (x: Suggestion): Muc => (x as Suggestion & { muc?: Muc }).muc ?? (/ thue /.test(` ${normalizeVi(x.label)} `) ? "thue" : "ban");
  // CHẠM VÀO Ô CHƯA GÕ (như Airbnb: bấm là có gợi ý ngay) — nhưng gợi ý phải CÓ NGHĨA với khách (chủ dự án 17/10/2026:
  // "Bán nhà Đà Nẵng, Bán nhà Huế… phổ biến cái gì"): khách đã từng tìm → cụm từ khoá dài bám theo lần tìm gần nhất
  // (cùng nơi, cùng loại nhà); khách mới → cụm dài, cụ thể (loại nhà + nơi + giá), mỗi tỉnh một loại nhà.
  const lanTruoc = ganDay.find((x) => mucCua(x) === muc)?.label ?? "";
  const cauNhuCau = muc === "duan" ? [] : kw
    ? locCauGoiY(goiYTin ?? [], kw, mb, 6)
    : lanTruoc
      ? locCauGoiY(goiYTin ?? [], lanTruoc, mb, 6).filter((c) => normalizeVi(c.nhan) !== normalizeVi(lanTruoc)).slice(0, 5)
      : locCauGoiY(goiYTin ?? [], "", mb, 5);
  const ganDayHien = kw ? [] : ganDay.filter((x) => mucCua(x) === muc).slice(0, 3);
  // Tên dự án gợi ý ở MỌI mục (khách hay gõ tên dự án mà không chuyển sang mục Dự án)
  const goiYDuAn = kw ? suggest(kw, 12).filter((s) => s.kind === "Dự án").slice(0, muc === "duan" ? 6 : 2) : [];
  const coGoiY = !!kw || ganDayHien.length > 0 || cauNhuCau.length > 0;
  const coLoc = muc === "duan"
    ? boLoc.locations.length > 0 || !!boLoc.project
    : boLoc.locations.length > 0 || boLoc.types.length > 0 || boLoc.priceMin != null || boLoc.priceMax != null || boLoc.areaMin != null || boLoc.areaMax != null || !!boLoc.beds || !!boLoc.direction || !!boLoc.legal || !!boLoc.furnishing || boLoc.verified || boLoc.broker;
  const soTin = coLoc && muc !== "duan" && tinDem ? applyFilters(tinDem.filter((t) => t.purpose === mb), boLoc).length : null;
  const nhanTim = soTin != null ? (soTin ? `Xem ${soTin} tin` : "Tìm kiếm") : "Tìm kiếm";
  const hangLoc = (gon: boolean, chi?: string[]) => <TruongLocTrangChu muc={muc} value={boLoc} onChange={setLoc} gon={gon} chi={chi} />;
  // Điện thoại: hai trường chính là THẺ gọn dưới thẻ tìm; các trường còn lại nằm trong thẻ tìm
  const DOAN = muc === "duan" ? ["kv", "da"] : ["lh", "gia"]; // đúng 2 thẻ như Airbnb (Khi nào · Mấy người); Diện tích, Lọc thêm có ở thanh lọc trang kết quả

  const dong = (s: Suggestion, icon: PhIcon, onClick: () => void, key: string, xoa?: () => void) => (
    <div key={key} className="flex items-center rounded-xl transition hover:bg-black/[0.04]">
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-2 py-1.5 text-left active:bg-black/[0.06]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2f2f2] text-cvr-ink"><Icon i={icon} className="h-5 w-5" /></span>
        <span className="flex min-w-0 flex-col">
          {/* Gợi ý kiểu Google: MỘT dòng chữ, không dòng phụ (chủ dự án 17/10/2026) */}
          <span className="truncate text-[14px] font-medium leading-5 text-cvr-ink">{s.label}</span>
        </span>
      </button>
      {xoa && (
        <button type="button" aria-label={`Xoá "${s.label}" khỏi lịch sử`} onMouseDown={(e) => e.preventDefault()} onClick={xoa} className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cvr-muted transition hover:bg-black/[0.06] hover:text-cvr-ink active:scale-90">
          <Icon i={X} className="h-4 w-4" />
        </button>
      )}
    </div>
  );
  const nhanNhom = (t: string, xoaHet?: () => void) => (
    <div className="flex items-center justify-between px-2 pb-1 pt-3">
      <p className="text-[12px] text-cvr-ink">{t}</p>
      {xoaHet && (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={xoaHet} className="text-[12px] font-semibold text-cvr-muted underline-offset-2 hover:text-cvr-ink hover:underline">
          Xoá tất cả
        </button>
      )}
    </div>
  );

  const dsGoiY = (
    <div>
      {ganDayHien.length > 0 && nhanNhom("Tìm kiếm gần đây", () => boGanDay())}
      {ganDayHien.map((s, i) => dong(s, ClockCounterClockwise, () => chonGoiY(s), `g${i}`, () => boGanDay(s.label)))}
      {!kw && cauNhuCau.length > 0 && nhanNhom("Gợi ý phổ biến")}
      {cauNhuCau.map((c, i) => dong({ label: c.nhan, kind: "Gợi ý", sub: c.sub }, MagnifyingGlass, () => { luu({ label: c.nhan, kind: "Gợi ý", sub: c.sub, href: c.href }); di(c.href); }, `n${i}`))}
      {goiYDuAn.map((s, i) => dong(s, MagnifyingGlass, () => chonGoiY(s), `d${i}`))}
    </div>
  );

  // MỤC ĐÍCH: đúng kiểu nút tròn dùng chung trên trang chủ (khối "Bất động sản dành cho bạn", "Tin nổi bật")
  // MENU MỤC ĐÍCH (kiểu Batdongsan): hàng tab trên một đường kẻ mảnh, mục chọn gạch chân màu thương hiệu
  // dinh = MENU DÍNH LIỀN Ô TÌM (chủ dự án 17/10/2026): khách chỉ nhìn ô tìm và hay quên chọn mục đích → menu
  // nhỏ, canh trái, nằm sát mép trên ô tìm; mục đang chọn xanh — nhìn ô là biết đang tìm Mua bán hay Cho thuê.
  const tabsOf = (toi: boolean, gon = false, ngang = false, dinh = false) => (
    <div role="tablist" className={`flex ${dinh ? "justify-start gap-6 pl-5 sm:gap-8 sm:pl-7" : `justify-center ${gon ? "gap-5" : ngang ? "gap-16" : "gap-9 sm:gap-16"}`}`}>
      {TABS.map((t) => {
        const on = muc === t.muc;
        return (
          <button
            key={t.muc}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => { setMuc(t.muc); setLoc(t.muc === "duan" ? emptyFilters() : locTuCau(tuKhoa, t.muc)); }}
            className={`group relative flex items-center whitespace-nowrap px-1 font-semibold transition-colors duration-300 ${dinh ? "gap-1.5 pb-2 text-[13px] sm:text-[14px]" : ngang ? "gap-3 pb-3.5 text-[16px]" : "flex-col gap-1 pb-2.5 text-[13px] sm:gap-1.5 sm:pb-3 sm:text-[15px]"} ${
              toi ? (on ? "text-white" : "text-[#a1a1a6] hover:text-white") : on ? "text-cvr-blue" : "text-cvr-muted hover:text-cvr-ink"
            }`}
          >
            <TabIcon name={t.icon} active={on} className={`${dinh ? "h-5 w-5" : ngang ? "h-8 w-8" : gon ? "h-[26px] w-[26px]" : "h-[26px] w-[26px] sm:h-8 sm:w-8"} transition-transform duration-300 group-active:scale-90`} />
            {t.nhan}
            <span aria-hidden className={`absolute inset-x-0 bottom-0 ${dinh ? "h-[2px]" : "h-[3px]"} rounded-full transition-transform duration-300 ${toi ? "bg-cvr-gold-soft" : "bg-cvr-blue"} ${on ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        );
      })}
    </div>
  );

  // CÂU DÀI (chủ dự án 17/10/2026: "khách gõ 1 câu 100 từ thì sao, ẩn đi à"): ô TỰ GIÃN theo chữ, tối đa ~5 dòng
  // rồi cuộn trong ô — khách luôn thấy hết mình đã gõ gì. Enter vẫn là tìm (không xuống dòng).
  const gianO = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    // đặt lại chiều cao làm ô cuộn về đầu → đang gõ ở cuối câu thì kéo về cuối, chữ vừa gõ luôn hiện
    if (document.activeElement === el && el.selectionEnd === el.value.length) el.scrollTop = el.scrollHeight;
  };
  const oNhap = (cls: string, goiYO: string, autoFocus = false) => (
    <textarea
      ref={(el) => gianO(el)}
      rows={1}
      value={tuKhoa}
      autoFocus={autoFocus}
      onChange={(e) => {
        const v = e.target.value.split("\n").join(" ");
        // Câu nói rõ "thuê" / "bán" thì menu tự chuyển theo (khách đã nói rõ ý, không bắt bấm lại menu)
        const y = muc === "duan" ? null : parseQuery(v).purpose;
        const m2: Muc = y && y !== muc ? y : muc;
        if (m2 !== muc) setMuc(m2);
        setTuKhoa(v);
        setLoc(m2 === "duan" ? emptyFilters() : locTuCau(v, m2));
        gianO(e.currentTarget);
      }}
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
      {/* ĐIỆN THOẠI ĐÚNG KIỂU AIRBNB (chủ dự án 17/10/2026): ô tìm viên thuốc ở trên, menu mục đích (biểu tượng
          trên chữ, căn giữa) ở dưới */}
      <div className="pb-2 sm:hidden">
        <button
          type="button"
          ref={oVienRef}
          onClick={moMo}
          className="mt-1 flex min-h-[52px] w-full items-center justify-start gap-3 rounded-[26px] py-3 text-left border border-cvr-line bg-white px-5 shadow-[0_3px_12px_rgba(0,0,0,0.1)] transition duration-200 active:scale-[0.98]"
        >
          <Icon i={MagnifyingGlass} dam className="h-[18px] w-[18px] shrink-0 text-cvr-ink" />
          <span className={`min-w-0 text-left text-[15px] leading-snug ${kw ? "break-words font-semibold text-cvr-ink" : "truncate text-cvr-muted"}`}>{kw || "Tìm nhà đất theo khu vực, dự án…"}</span>
        </button>
        <div className="mt-4">{tabsOf(false, true)}</div>
      </div>

      {/* MÀN TÌM ĐIỆN THOẠI CHÉP ĐÚNG AIRBNB (ảnh chủ dự án gửi 17/10/2026): nền là trang phía sau làm MỜ NHOÈ ·
          menu mục đích + nút X CÙNG MỘT HÀNG · thẻ trắng có tiêu đề đậm, ô gõ có kính lúp · hai thẻ Loại hình / Mức giá
          (nhãn trái nhạt, giá trị phải đậm) · đáy KHÔNG có thanh: "Xoá tất cả" mờ khi chưa có gì để xoá + nút Tìm kiếm.
          BÀN PHÍM BẬT (lớp ban-phim-mo do BanPhimAo gắn): chỉ ẩn hai thẻ Loại hình/Mức giá — menu, ô gõ, nút Tìm kiếm luôn hiện. */}
      {mo && (
        <div className={`${dangDong ? "anim-dong-lai" : "mb-nen-mo"} fixed inset-0 z-[200] flex flex-col bg-white/75 backdrop-blur-md sm:hidden`} role="dialog" aria-modal="true" aria-label="Tìm nhà đất">
          {/* KHUNG CUỘN RIÊNG: BanPhimAo ép mọi con trực tiếp của lớp phủ "max-height: 100%" khi bàn phím bật → để mỗi
              khung này chịu giới hạn, thẻ tìm bên trong giữ đủ cao và cuộn được (không bị cắt cụt). */}
          <div className="flex h-full min-h-0 w-full flex-1 flex-col self-stretch overflow-y-auto overscroll-contain">
          <div className="mb-tab-mo relative shrink-0 self-stretch px-14 pb-1 pt-3 [&_[role=tab]]:text-[14px] [&_[role=tab]]:font-medium [&_[role=tab]_svg]:h-9 [&_[role=tab]_svg]:w-9 [&_[role=tablist]]:gap-0 [&_[role=tablist]]:justify-around">
            {tabsOf(false, true)}
            <button type="button" aria-label="Đóng tìm kiếm" onClick={dongMo} className="absolute right-3 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition active:scale-90">
              <Icon i={X} dam className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div ref={theRef} className="mb-the-mo mx-3 mt-5 flex min-h-[200px] flex-1 flex-col self-stretch rounded-[24px] bg-white px-6 pb-4 pt-6 shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
            {!phimMo && <h2 className="mb-4 text-[22px] font-bold tracking-tight text-cvr-ink">Tìm kiếm</h2>}
            <div className="relative shrink-0">
              <span className="pointer-events-none absolute left-4 top-7 -translate-y-1/2 text-cvr-ink"><Icon i={MagnifyingGlass} dam className="h-5 w-5" /></span>
              {oNhap("max-h-[152px] min-h-14 w-full rounded-xl border border-[#b0b0b0] bg-white py-4 pl-12 pr-10 text-[16px] leading-6 text-cvr-ink placeholder-cvr-muted outline-none transition focus:border-cvr-ink", "Khu vực, dự án…", true)}
              {tuKhoa && (
                <button type="button" aria-label="Xoá từ khoá" onClick={() => setTuKhoa("")} className="absolute right-2 top-7 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-muted active:bg-black/5">
                  <Icon i={X} className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="-mx-2 mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain">{dsGoiY}</div>
          </div>
          {/* Hai trường chính thành THẺ gọn dưới thẻ tìm (như "Thời gian · Khách" của Airbnb) */}
          <div className={`mb-the-sau mx-3 mb-3 mt-3 shrink-0 self-stretch ${phimMo ? "hidden" : ""}`}>
            <TruongLocTrangChu muc={muc} value={boLoc} onChange={setLoc} the chi={DOAN} />
          </div>
          <div className="mb-day-mo sticky bottom-0 flex shrink-0 items-center justify-between gap-4 self-stretch bg-white/80 px-6 backdrop-blur-md pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
            <button type="button" onClick={xoaHet} disabled={!tuKhoa && !coLoc} className="shrink-0 whitespace-nowrap px-2 text-[16px] font-medium text-cvr-ink disabled:text-cvr-faint">
              Xoá tất cả
            </button>
            <button type="button" onClick={() => tim(tuKhoa)} className="flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-cvr-blue px-6 py-2 text-[16px] font-medium text-white transition active:scale-95">
              <Icon i={dangTim ? CircleNotch : MagnifyingGlass} dam className={`h-[18px] w-[18px] ${dangTim ? "animate-spin" : ""}`} />
              {nhanTim}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* ═══ MÁY TÍNH KIỂU AIRBNB (chủ dự án 17/10/2026: "trên PC để 3 menu ở trên"): menu mục đích (biểu tượng
          trên chữ, căn giữa) ở TRÊN ô tìm lớn · bấm vào ô mới xổ trường lọc + gợi ý ═══ */}
      <div ref={pcRef} className="relative mx-auto hidden max-w-[880px] pb-6 sm:block">
        <div className="mb-6">{tabsOf(false)}</div>
        <div className="relative z-[1]">
          <div className={`flex items-start rounded-[32px] border border-cvr-line bg-white transition-shadow duration-300 ${moPc ? "shadow-[0_8px_28px_rgba(0,0,0,0.14)]" : "shadow-[0_3px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_5px_18px_rgba(0,0,0,0.12)]"}`}>
            <label className="flex flex-1 cursor-text items-start gap-3 py-[18px] pl-7 pr-3">
              {oNhap("max-h-[40vh] w-full bg-transparent text-[16px] leading-[26px] text-cvr-ink placeholder-cvr-muted !outline-none !ring-0 !shadow-none", "Tìm nhà đất theo khu vực, dự án hoặc gõ cả câu")}
            </label>
            {tuKhoa && (
              <button type="button" aria-label="Xoá chữ đã gõ" onMouseDown={(e) => e.preventDefault()} onClick={() => setTuKhoa("")} className="anim-hien-chu mt-[18px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-cvr-muted transition hover:bg-black/[0.08] hover:text-cvr-ink">
                <Icon i={X} dam className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => tim(tuKhoa)}
              aria-label="Tìm kiếm"
              className={`m-2 flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-cvr-blue text-[15px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cvr-blue-ink active:scale-95 ${moPc || coLoc ? "px-6" : "w-12"}`}
            >
              <Icon i={dangTim ? CircleNotch : MagnifyingGlass} dam className={`h-5 w-5 shrink-0 ${dangTim ? "animate-spin" : ""}`} />
              {(moPc || coLoc) && <span className="anim-hien-chu whitespace-nowrap">{nhanTim}</span>}
            </button>
          </div>
          {moPc && (
            <div className={`${dangDong ? "anim-dong-xuong" : "anim-xo-xuong"} absolute left-0 top-full z-[90] mt-3 max-h-[70vh] w-[min(100%,620px)] overflow-y-auto rounded-[28px] bg-white p-4 shadow-2xl shadow-black/15 ring-1 ring-black/5`}>
              <div className="pb-2">{hangLoc(true)}</div>
              {coGoiY && dsGoiY}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
