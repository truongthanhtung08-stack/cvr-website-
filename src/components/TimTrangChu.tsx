"use client";
import { useDiaDanh } from "@/lib/useDiaDanh";
import { goiYTheoY } from "@/lib/goiYTheoY";
import { useGoiYThat } from "@/lib/useGoiYThat";
import { timDuAn, napDsDuAn, dsDuAnDaNap, type DuAnTen } from "@/lib/duAnTen";
import { batDauTim } from "@/components/VachTim";
import { useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { applyFilters, emptyFilters, filtersToParams, normalizeVi, type Filters, type LocationSel } from "@/lib/filters";
import { goiYDuAn as goiYDuAnNhanh, type Suggestion } from "@/lib/suggest";
import { parseQuery, suaChinhTa } from "@/lib/smartSearch";
import type { CauGoiY, TinDem } from "@/lib/goiYTrangChu";
import TruongLocTrangChu, { locTuCau } from "@/components/TruongLocTrangChu";
import { timKhuVuc, slugKhuVuc } from "@/lib/khuVuc";
import { duongDanBuoc, duongDanSach, duongDanTuCau, duongDanGanNhat } from "@/lib/duongDanTim";
import { hintsFor, listingHints } from "@/lib/searchHints";
import { MagnifyingGlass, ClockCounterClockwise, X, CircleNotch, ArrowUpLeft, type Icon as PhIcon } from "@phosphor-icons/react";
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

// MỤC ĐÍCH TÌM THEO LỜI KHÁCH (chủ dự án 17/10/2026): "Mua bán" là tin người bán, "Cho thuê" là tin cho thuê — nhưng người
// vào tìm là người MUA hoặc người THUÊ. Đoán theo đúng lời họ để tự chuyển menu; câu không có dấu hiệu nào → giữ mục đang chọn.
//   Cho thuê: "thuê" · "/tháng" · "nguyên căn" · "ở ghép" · loại chỉ có ở cho thuê ("phòng trọ")
//   Mua bán:  "mua"/"bán" · giá tính bằng TỶ · "sổ đỏ/sổ hồng" · đang ở Dự án mà gõ loại nhà ("căn hộ dự án X")
//   Dự án:    "dự án …" không kèm loại nhà, không nói mua/thuê
function mucDichCau(v: string, muc: Muc): Muc | null {
  const pq = parseQuery(v);
  const w = ` ${normalizeVi(v).replace(/[^a-z0-9]+/g, " ")} `;
  if (pq.purpose) return pq.purpose;
  // Loại CHỈ có cho thuê (phòng trọ, văn phòng, mặt bằng) → Cho thuê (rà 21/10/2026: "mặt bằng kinh doanh" từng vào Mua bán)
  if (/ thang | nguyen can | o ghep /.test(w) || (pq.types.length > 0 && pq.types.every((t) => ["Phòng trọ", "Văn phòng", "Mặt bằng"].includes(t)))) return "thue";
  // Giá TỶ (kể cả "3 tỷ" trần, không có "dưới/trên") → giá bán
  if ((pq.priceMaxTy ?? 0) >= 1 || (pq.priceMinTy ?? 0) >= 1 || / \d+[.,]?\d* ?(ty|ti) /.test(w) || / so do | so hong /.test(w)) return "ban";
  // Giá tính bằng TRIỆU (dưới 1 tỷ) cho căn hộ / nhà / phòng → giá thuê tháng (rà 21/10/2026: "căn hộ 10 triệu" từng vào Mua bán)
  const giaTrieu = (pq.priceMaxTy != null || pq.priceMinTy != null) || (/ \d+[.,]?\d* ?(trieu|tr) /.test(w) && !/ \d+[.,]?\d* ?(ty|ti) /.test(w));
  if (giaTrieu && !(pq.types.length > 0 && pq.types.every((t) => /^đất/i.test(t)))) return "thue";
  // ĐẤT, ĐẤT NỀN chỉ có mua bán — không để "đất nền Hoà Xuân" rơi vào Cho thuê thành kho xưởng (rà 18/10/2026)
  if (pq.types.length > 0 && pq.types.every((t) => /^đất/i.test(t))) return "ban";
  if (/ du an /.test(w)) return pq.types.length ? "ban" : "duan";
  // Đang ở mục Dự án (kể cả mục nhớ từ lần trước) mà câu đã rõ loại nhà ("nhà Đà Nẵng", "căn hộ…") → Mua bán, không vào Dự án
  // (rà 21/10/2026: "nhà Đà Nẵng" vào trang Dự án vì web nhớ mục lần tìm trước)
  if ((pq.types.length > 0 || / nha /.test(w)) && muc === "duan") return "ban";
  return null;
}

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
  // Loại nhà so theo chữ đầu ("đất nền" ≈ "đất", "nhà riêng" ≈ "nhà") — trừ loại mà chữ đầu là chữ chung:
  // "phòng trọ" không được khớp "phòng ngủ", "văn phòng" không được khớp "văn…" (lỗi 17/10/2026)
  const loaiY = p.types[0] ? (/^(phong|van) /.test(normalizeVi(p.types[0])) ? normalizeVi(p.types[0]) : normalizeVi(p.types[0]).split(" ")[0]) : "";
  if (tinhY || loaiY) {
    const nTinh = tinhY ? normalizeVi(tinhY) : "";
    const nSau = [p.place?.ward, p.place?.district].filter(Boolean).map((x) => normalizeVi(x!));
    const diem = ds.map((c) => {
      const n = normalizeVi(c.nhan);
      const w = ` ${n} `;
      // "nhà đất" là cả nhóm chung, KHÔNG phải loại "đất" — bỏ cụm này ra trước khi so loại nhà
      // (lỗi 17/10/2026: gõ "đất hòa xuân" ra "Bán nhà đất Phường Cẩm Lệ" đứng trên "Bán đất nền Đà Nẵng")
      const wLoai = w.replace(" nha dat ", " ");
      // so TRỌN CHỮ: "hue" nằm trong "cho t·hue" → từng ghi "Cho thuê căn hộ Đà Nẵng" cho người gõ "Huế" (17/10/2026)
      if (nTinh && !w.includes(` ${nTinh} `)) return { c, d: -1 };       // khác tỉnh → loại
      if (c.muc !== muc) return { c, d: -1 };                                 // khác mục (đang Cho thuê mà gợi ý Bán) → loại
      if (loaiY && !wLoai.includes(" " + loaiY + " ") && !w.includes(" nha dat ")) return { c, d: -1 }; // khác loại nhà → loại
      let d = c.muc === muc ? 256 : 0;                                        // đúng Mua bán / Cho thuê trước
      if (loaiY && wLoai.includes(" " + loaiY + " ")) d += 64;               // đúng loại nhà
      if (nSau.some((x) => w.includes(` ${x} `))) d += 32;                          // đúng phường / quận
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
/** trenAnh: bộ tìm nằm ĐÈ LÊN ảnh Hero (máy tính) → menu chữ trắng cho đọc được trên ảnh */
export default function TimTrangChu({ goiYTin, tinDem, trenAnh = false }: { goiYTin?: CauGoiY[]; tinDem?: TinDem[]; trenAnh?: boolean }) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const [mucDangChon, setMuc] = useState<Muc>("ban");
  const muc = mucDangChon;
  const [tuKhoa, setTuKhoa] = useState("");
  // Tên dự án THẬT (bảng Dự án + trường Dự án của tin) — nạp một lần khi khách bắt đầu gõ (lib/duAnTen)
  const [dsDuAn, setDsDuAn] = useState<DuAnTen[]>(() => dsDuAnDaNap() ?? []);
  useEffect(() => { if (tuKhoa.trim() && !dsDuAn.length) void napDsDuAn().then(setDsDuAn); }, [tuKhoa, dsDuAn.length]);
  const [mo, setMo] = useState(false); // điện thoại: màn tìm
  // DỰNG SẴN MÀN TÌM như Airbnb (chủ dự án 17/10/2026: "giật, lag"): dựng ẩn sau khi trang rảnh, chạm vào chỉ việc hiện ra
  // (đo trên máy chậm: dựng lúc chạm làm khựng 0,3–1,4 giây). Ẩn bằng display:none nên hiệu ứng mở vẫn chạy lại mỗi lần hiện.
  const [sanSang, setSanSang] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    const t = setTimeout(() => setSanSang(true), 1200);
    return () => clearTimeout(t);
  }, []);
  const [moPc, setMoPc] = useState(false); // máy tính: bảng gợi ý
  const [ganDay, setGanDay] = useState<Suggestion[]>([]);
  const [boLoc, setLoc] = useState<Filters>(emptyFilters); // trường lọc chi tiết
  const [dangTim, setDangTim] = useState(false);
  const [chon, setChon] = useState(-1); // dòng gợi ý đang chọn bằng phím ↑ ↓ (máy tính) // vừa bấm tìm, đang chờ trang kết quả
  const router = useRouter();
  // BÀN PHÍM THẬT (đo bằng visualViewport): chỉ khi màn nhìn thấy co lại > 150px mới ẩn tiêu đề + hai thẻ trường.
  // Không dùng lớp ban-phim-mo vì lớp đó ĐOÁN "đang gõ" ngay khi ô có con trỏ (trình duyệt trong app không báo bàn phím)
  // → máy chưa bật bàn phím mà màn đã mất tiêu đề và thẻ (ảnh chủ dự án 17/10/2026).
  const [phimMo, setPhimMo] = useState(false);
  const [dangDong, setDangDong] = useState(false); // màn tìm / bảng xổ đang khép lại (chạy chuyển động đóng)
  const dongNoi = () => { setDangDong(true); setTimeout(() => { setMo(false); setDangDong(false); }, 200); };
  // NÚT QUAY LẠI CỦA ĐIỆN THOẠI (chủ dự án 17/10/2026): mở màn tìm là thêm một bước vào lịch sử → bấm ← chỉ
  // ĐÓNG màn tìm, khách vẫn ở trang chủ (không văng khỏi trang như trước). Nút X cũng đi đường này.
  // MÀN GÕ RIÊNG đúng Airbnb (đo airbnb.com 17/10/2026): chạm thanh tìm → màn có menu + thẻ tìm, CHƯA bật bàn phím;
  // chạm vào ô gõ → chuyển sang màn gõ: ô gõ sát trên cùng có ← quay lại, menu · tiêu đề · nút đáy ẩn, gợi ý chiếm phần còn
  // lại — bàn phím bật vẫn thấy rõ chữ gõ và gợi ý.
  const [dangGo, setDangGo] = useState(false);
  // VÀO / RA MÀN GÕ MƯỢT (chủ dự án 17/10/2026: "gõ vào ô tìm, bàn phím ảo hiện lên rất thô"): menu + tiêu đề ẩn làm thẻ tìm
  // nhảy lên — đo vị trí thẻ trước khi đổi, sau khi đổi cho thẻ TRƯỢT từ chỗ cũ về chỗ mới (chỉ transform, chạy trên GPU).
  const theTimRef = useRef<HTMLDivElement>(null);
  const viTriCu = useRef<number | null>(null);
  const doiGo = (go: boolean) => {
    viTriCu.current = theTimRef.current?.getBoundingClientRect().top ?? null;
    setDangGo(go);
  };
  useLayoutEffect(() => {
    const el = theTimRef.current, cu = viTriCu.current;
    viTriCu.current = null;
    if (!el || cu == null) return;
    const lech = cu - el.getBoundingClientRect().top;
    if (Math.abs(lech) < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ transform: `translate3d(0, ${lech}px, 0)` }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(0.2, 0, 0, 1)" });
  }, [dangGo]);
  // MỘT CHẠM (chủ dự án 18/10/2026: "bấm vào thanh search ra luôn và search", không qua hai bước): chạm thanh tìm là
  // vào thẳng màn gõ, bàn phím bật ngay. flushSync vẽ màn tìm XONG trong chính cú chạm rồi mới đặt con trỏ — iPhone chỉ
  // cho bật bàn phím khi focus nằm trong cú chạm.
  const dauMo = useRef(0);
  const moMo = () => {
    (window as Window & { __cvrMoTim?: number }).__cvrMoTim = 0;
    flushSync(() => { setDangGo(true); setMo(true); });
    document.querySelector<HTMLTextAreaElement>("[role='dialog'] textarea")?.focus({ preventScroll: true });
    // dấu RIÊNG cho mỗi lần mở: quay lại trang chủ từ trang kết quả thì mục lịch sử cũ còn dấu của lần mở trước — dùng
    // dấu chung thì nút ← lùi về mục đó mà màn tìm không đóng (đo 18/10/2026)
    dauMo.current = Date.now();
    try { history.pushState({ ...history.state, cvrTim: dauMo.current }, ""); } catch { /* bỏ qua */ }
  };
  // Khách đã chạm thanh tìm trước khi mã chạy xong → mở màn tìm ngay khi mã sẵn sàng (không bắt khách chạm lại)
  useEffect(() => {
    const w = window as Window & { __cvrMoTim?: number };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ một lần khi mã vừa chạy
    if (w.__cvrMoTim) moMo();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi mã vừa chạy
  }, []);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!mo || !vv) return;
    const cao = window.innerHeight;
    // Bàn phím đã bật MỘT LẦN thì giữ gọn tới khi đóng màn tìm: khách vuốt danh sách làm phím hạ mà tiêu đề hiện lại
    // thì cả danh sách bị đẩy xuống ngay dưới tay — giật (Google không có chuyện đó).
    const do_ = () => { if (cao - vv.height > 150) setPhimMo(true); };
    vv.addEventListener("resize", do_);
    return () => { vv.removeEventListener("resize", do_); setPhimMo(false); };
  }, [mo]);
  // (Bỏ lớp dang-tim-mo 18/10/2026: thêm/bỏ nó bắt cả trang chủ tính lại một lần ~110ms trên máy chậm — đúng lúc thẻ
  // vừa trượt xong nên thấy khựng. Màn tìm đã phủ kín nền đặc, không cần ngưng vẽ trang phía sau.)
  const daKeo = useRef(false); // khách vừa vuốt danh sách (để vuốt lên tới đầu thì bật lại bàn phím)
  const haPhim = () => { const a = document.activeElement as HTMLElement | null; if (a?.tagName === "TEXTAREA") a.blur(); };
  const dongMo = () => { if (history.state?.cvrTim === dauMo.current) history.back(); else dongNoi(); };
  const dongPc = () => { setDangDong(true); setTimeout(() => { setMoPc(false); setDangDong(false); }, 160); };
  const xoaHet = () => { setTuKhoa(""); setLoc(emptyFilters()); };
  const pcRef = useRef<HTMLDivElement>(null);
  const daKiemSom = useRef(false);

  const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";

  // CHỮ GỢI Ý TỰ CHẠY trong thanh tìm khi khách chưa bấm vào (như bản đầu — chủ dự án 18/10/2026): gõ dần từng câu lấy
  // từ tin thật, giữ cho đọc, xoá, sang câu kế. Ghi thẳng vào ô (không đổi state) nên không vẽ lại cả bộ tìm mỗi chữ.
  const chuChayDt = useRef<HTMLSpanElement>(null);
  const tinDemRef = useRef(tinDem);
  // Trạng thái đọc qua ref: vòng chạy chữ chỉ dựng MỘT lần, mỗi bước tự xem khách đã bấm/gõ chưa (không bị dựng lại liên tục)
  const chayRef = useRef({ dung: false, muc: "ban" as Muc });
  useEffect(() => { chayRef.current = { dung: moPc || mo || tuKhoa.length > 0, muc }; });
  useEffect(() => {
    const ta = pcRef.current?.querySelector("textarea");
    const goc = { pc: ta?.getAttribute("placeholder") ?? "", dt: chuChayDt.current?.textContent ?? "" };
    const dat = (s: string) => { ta?.setAttribute("placeholder", s); if (chuChayDt.current) chuChayDt.current.textContent = s; };
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const cauCua = (m: Muc) => (m === "duan" ? hintsFor("duan") : listingHints(tinDemRef.current ?? [], m === "thue" ? "thue" : "ban"));
    let mucDang = chayRef.current.muc, cau = cauCua(mucDang);
    let i = 0, n = 0, xoa = false, hen = 0, dangDung = false;
    const buoc = () => {
      const { dung, muc: m } = chayRef.current;
      if (dung || document.hidden) {
        if (!dangDung) { dangDung = true; dat(goc.pc); if (chuChayDt.current) chuChayDt.current.textContent = goc.dt; }
        hen = window.setTimeout(buoc, 400); return;
      }
      if (dangDung || m !== mucDang) { dangDung = false; mucDang = m; cau = cauCua(m); i = 0; n = 0; xoa = false; }
      const c = cau[i] ?? "";
      if (!xoa && n < c.length) { n++; dat(c.slice(0, n)); hen = window.setTimeout(buoc, 55); }
      else if (!xoa) { xoa = true; hen = window.setTimeout(buoc, 1800); }
      else if (n > 0) { n--; dat(c.slice(0, n)); hen = window.setTimeout(buoc, 26); }
      else { xoa = false; i = (i + 1) % Math.max(1, cau.length); hen = window.setTimeout(buoc, 320); }
    };
    hen = window.setTimeout(buoc, 1500);
    return () => window.clearTimeout(hen);
  }, []);

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
    // lùi từ bảng chọn trường (FilterDropdown) về lại màn tìm: trạng thái vẫn còn cvrTim → KHÔNG đóng màn tìm
    const onPop = () => { if (history.state?.cvrTim !== dauMo.current) dongNoi(); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => { document.body.style.overflow = cu; document.removeEventListener("keydown", onKey); window.removeEventListener("popstate", onPop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dongMo/dongNoi chỉ đổi state, không cần gắn lại
  }, [mo]);

  // Khách bấm vào ô tìm khi trang CHƯA chạy xong mã (vừa mở trang) → con trỏ đã ở trong ô nhưng bảng chưa mở. Mã chạy xong
  // thấy con trỏ đang ở ô tìm máy tính thì mở bảng luôn (đo bằng chuột thật 17/10/2026: lần bấm đầu tiên bị lỡ).
  // Bảng tạm (data-cho-mo) đang hiện thì thay bằng bảng thật trong cùng một khung hình (useLayoutEffect, không chớp).
  useLayoutEffect(() => {
    (window as Window & { __cvrDaChay?: number }).__cvrDaChay = 1;
    const choMo = pcRef.current?.hasAttribute("data-cho-mo");
    pcRef.current?.removeAttribute("data-cho-mo");
    const a = document.activeElement;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ một lần khi mã vừa chạy
    if (choMo || (a?.tagName === "TEXTAREA" && pcRef.current?.contains(a))) setMoPc(true);
  }, []);
  // Máy tính: bấm ra ngoài thanh tìm / Esc → đóng bảng gợi ý
  useEffect(() => {
    if (!moPc) return;
    // Bảng mở nhờ cú bấm SỚM (trước khi mã chạy xong) mà sau đó khách đã bấm ra ngoài → đóng luôn; chỉ xét lần mở đầu tiên
    const w = window as Window & { __cvrBamTrongPc?: boolean };
    if (!daKiemSom.current) {
      daKiemSom.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ một lần, sửa cú bấm sớm trước khi mã chạy
      if (w.__cvrBamTrongPc === false) { dongPc(); return; }
    }
    const onDoc = (e: Event) => {
      const t = e.target as Element;
      // "Bên trong" CHỈ là ô tìm · bảng gợi ý · hàng menu (cùng bảng chọn trường) — bấm khoảng trống quanh đó cũng là bấm ra
      // ngoài → đóng (chủ dự án 17/10/2026: "bấm chỗ trống để thoát lúc có lúc không" — trước tính cả khung 880px là bên trong)
      // Khoảng trắng TRONG bảng gợi ý (không trúng nút, dòng gợi ý, trường lọc) cũng là chỗ trống → đóng
      if (t.closest?.("[data-bang-goi-y]") && !t.closest("button, a, input, textarea, select, label, [role=option], [role=listbox], .cvr-pop, [role=dialog]")) { dongPc(); return; }
      if (t.closest?.("[data-o-tim-pc], [data-bang-goi-y], [data-menu-pc] [role=tab], .cvr-pop, [role='dialog']")) return;
      dongPc();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dongPc(); };
    // BẮT Ở PHA ĐẦU (capture): khối nào trong trang chặn sự kiện (dải thẻ kéo ngang…) cũng không nuốt được cú bấm ra ngoài
    document.addEventListener("pointerdown", onDoc, true);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDoc, true); document.removeEventListener("keydown", onKey); };
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
  // GIỮ CÂU KHÁCH VỪA TÌM cho trang kết quả (chủ dự án 17/10/2026: sang trang kết quả muốn SỬA câu tìm thì ô trống trơn):
  // ghi tạm vào sessionStorage theo đường dẫn — ô tìm trang kết quả hiện lại đúng câu đó (chỉ trên máy khách, không gọi máy chủ)
  const di = (url: string, cau = "") => {
    try { if (cau) { sessionStorage.setItem("cvr-cau:" + url.split("?")[0], cau); sessionStorage.setItem("cvr-tim-cuoi", cau); } } catch { /* bỏ qua */ }
    setDangTim(true); batDauTim(); router.push(url); // vạch xanh chung chạy tới khi trang kết quả hiện
  };
  // QUAY LẠI TRANG CHỦ như Google (chủ dự án 18/10/2026): ô tìm vẫn giữ câu vừa tìm để sửa tiếp; bấm × xoá là thoát tìm kiếm
  useEffect(() => {
    try {
      const c = sessionStorage.getItem("cvr-tim-cuoi");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc một lần khi quay lại trang chủ
      if (c) setTuKhoa(c);
    } catch { /* bỏ qua */ }
  }, []);
  const daCoCau = useRef(false);
  useEffect(() => {
    if (tuKhoa) { daCoCau.current = true; return; }
    if (daCoCau.current) try { sessionStorage.removeItem("cvr-tim-cuoi"); } catch { /* bỏ qua */ }
  }, [tuKhoa]);

  // Tìm theo câu gõ, hoặc theo một nơi vừa chọn
  function tim(cau: string, n: Noi | null = null, mucGhiDe?: Muc) {
    const cauLuu = (n ? n.nhan : cau).trim();
    const den = (u: string) => di(u, cauLuu);
    const muc = mucGhiDe ?? mucDangChon;
    const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";
    const kw = cau.trim();
    if (kw && !n) luu({ label: kw, kind: "Gợi ý", sub: "Từ khoá đã tìm", keyword: kw });
    // GÕ ĐÚNG TÊN DỰ ÁN (21/10/2026): nói rõ mua/thuê → tin thuộc dự án đó; không nói → trang thông tin dự án (nếu có), không có
    // trang thì tin thuộc dự án ở phía có tin
    const da = kw && !n ? timDuAn(kw, dsDuAn) : null;
    if (da) {
      const pq = parseQuery(kw);
      const d = da.duAn;
      if (!pq.purpose && d.coTrang) return den(`/du-an/${d.slug}`);
      const m = pq.purpose ?? (d.ban > 0 || d.thue === 0 ? "ban" : "thue");
      return den(`${m === "thue" ? "/cho-thue" : "/mua-ban"}?duan=${encodeURIComponent(d.ten)}`);
    }
    // KHÁCH PHẢI THẤY CÂU MÌNH ĐÃ GÕ (chủ dự án 17/10/2026): trường lọc chỉ là phần máy tự tách từ câu → đi
    // đường câu gõ (trang kết quả hiện nguyên câu trong ô tìm). Khách tự chỉnh trường → tìm theo trường, kèm câu.
    const tuDong = !!kw && JSON.stringify(boLoc) === JSON.stringify(muc === "duan" ? emptyFilters() : locTuCau(kw, mb));
    if (!n && coLoc && !tuDong) {
      if (muc === "duan") {
        const p = filtersToParams({ ...emptyFilters(), keyword: kw, locations: boLoc.locations, project: boLoc.project });
        p.set("mode", "Dự án");
        return den(`/du-an?${p.toString()}`);
      }
      const u = kw ? null : duongDanSach(mb, boLoc);
      if (u) return den(u);
      const p = filtersToParams({ ...boLoc, keyword: kw });
      p.set("mode", mb === "thue" ? "Cho thuê" : "Mua bán");
      return den(`${mb === "thue" ? "/cho-thue" : "/mua-ban"}?${p.toString()}`);
    }
    const loc = n ? [n.loc] : [];
    const chu = n ? n.tuKhoa ?? "" : kw;
    if (muc === "duan") {
      const p = filtersToParams({ ...emptyFilters(), keyword: chu, locations: loc });
      p.set("mode", "Dự án");
      return den(`/du-an?${p.toString()}`);
    }
    // Câu gõ → máy tách ý định (loại hình · thành phố/tỉnh · giá) về trang sạch
    // gõ sai chính tả → tìm theo câu đã sửa; ?q giữ nguyên câu khách gõ để trang kết quả báo "Đang hiển thị kết quả cho …"
    if (kw && !n) {
      const sua = suaChinhTa(kw);
      const u = duongDanGanNhat(mb, sua ?? kw);
      if (u) {
        if (!sua) return den(u);
        const [duong, cu] = u.split("?");
        const q = new URLSearchParams(cu);
        q.set("q", kw);
        return den(`${duong}?${q.toString()}`);
      }
    }
    // Nơi đã chọn / chưa nhập gì → trang tỉnh, thành phố hoặc trang mục
    if (!kw || (n && n.duong)) { const u = duongDanBuoc(mb, n?.duong ?? null, null, null); if (u) return den(u); }
    const p = filtersToParams({ ...emptyFilters(), keyword: chu, locations: loc });
    p.set("mode", mb === "thue" ? "Cho thuê" : "Mua bán");
    den(`${mb === "thue" ? "/cho-thue" : "/mua-ban"}?${p.toString()}`);
  }

  // Chọn một gợi ý là ra kết quả luôn (như Google)
  // Bấm gợi ý → câu gợi ý HIỆN NGAY trong ô tìm (như Google) rồi mới sang trang — khách thấy mình vừa chọn gì.
  function chonGoiY(s: Suggestion) {
    luu(s);
    setTuKhoa(s.label);
    if (s.kind === "Khu vực") return tim("", noiTu(s));
    if (s.href) return di(s.href, s.label);
    tim(s.keyword ?? s.label);
  }

  // ── GỢI Ý THEO QUY TẮC GOOGLE (chủ dự án 17/10/2026): chưa gõ → chỉ những lần khách đã tìm; đang gõ →
  // MỘT danh sách cụm từ khoá khớp chữ gõ (kể cả tên dự án), không tiêu đề nhóm, mỗi cụm một dòng.
  // CHỮ GÕ HIỆN NGAY, GỢI Ý TÍNH SAU MỘT NHỊP (useDeferredValue): máy chậm vẫn thấy chữ mình gõ tức thì,
  // danh sách gợi ý theo kịp ngay sau — như Google. Trước đây mỗi phím phải chờ tính xong gợi ý mới hiện chữ.
  const kw = useDeferredValue(tuKhoa).trim();
  // Gõ sai chính tả / dính chữ ("Căn họi … tạiphan thiết") → gợi ý theo câu đã sửa, như Google
  const kwHieu = kw ? suaChinhTa(kw) ?? kw : "";
  // GỢI Ý THEO DỮ LIỆU THẬT (máy chủ đếm tin — lib/goiYThat): chỉ câu có tin, giá và nơi thực tế (chủ dự án 21/10/2026)
  const goiYThatDs = useGoiYThat(muc === "duan" ? "" : kwHieu, mb);
  // Chỉ hiện lịch sử ĐÚNG mục đang chọn; câu cũ chưa gắn mục thì đoán theo chữ (có "thuê" → Cho thuê, còn lại → Mua bán)
  const mucCua = (x: Suggestion): Muc => (x as Suggestion & { muc?: Muc }).muc ?? (/ thue /.test(` ${normalizeVi(x.label)} `) ? "thue" : "ban");
  // CHƯA GÕ → CHỈ những lần khách đã tìm, như Google (chủ dự án 17/10/2026: bỏ "Gợi ý phổ biến" khi chưa gõ)
  // CHƯA GÕ: dưới lịch sử là các TÌM KIẾM PHỔ BIẾN lấy từ trang có tin thật (chủ dự án 18/10/2026: màn tìm trống trơn — cần gợi ý)
  const cauNhuCau: CauGoiY[] = muc === "duan" || kw ? [] : dangGo ? (goiYTin ?? []).filter((c) => c.muc === mb && c.loai).slice(0, 6) : [];
  // ĐANG GÕ → GỢI Ý THEO Ý CÂU, dùng chung mọi ô tìm (lib/goiYTheoY — chủ dự án 21/10/2026: bỏ gợi ý khớp ký tự kiểu Google):
  // dòng đầu là đúng câu khách gõ; sau đó mục đích + loại hình + khu vực + đặc điểm, không nói mua/thuê thì có cả hai.
  // Không lặp lại nguyên câu khách gõ thành một dòng gợi ý (chủ dự án 21/10/2026: "gợi ý thừa") — Enter là tìm đúng câu đó.
  // Máy chủ chưa trả (mạng chậm, lỗi) → gợi ý theo ý câu ở máy khách làm dự phòng.
  if (kw && muc !== "duan") {
    const dau = kwHieu.replace(/\s+/g, " ").trim();
    const nguon = goiYThatDs ?? goiYTheoY(dau, mb, dsDuAn);
    for (const d of nguon) if (normalizeVi(d.nhan) !== normalizeVi(dau)) cauNhuCau.push({ nhan: d.nhan, sub: "", muc: d.muc, loai: true, href: d.href });
  }
  const ganDayHien = kw ? [] : ganDay.filter((x) => mucCua(x) === muc).slice(0, 3);
  // Tên dự án gợi ý ở MỌI mục (khách hay gõ tên dự án mà không chuyển sang mục Dự án)
  const goiYDuAn = kw ? goiYDuAnNhanh(kwHieu, muc === "duan" ? 6 : 2) : [];
  const coGoiY = !!kw || ganDayHien.length > 0 || cauNhuCau.length > 0;
  const coLoc = muc === "duan"
    ? boLoc.locations.length > 0 || !!boLoc.project
    : boLoc.locations.length > 0 || boLoc.types.length > 0 || boLoc.priceMin != null || boLoc.priceMax != null || boLoc.areaMin != null || boLoc.areaMax != null || !!boLoc.beds || !!boLoc.direction || !!boLoc.legal || !!boLoc.furnishing || boLoc.verified || boLoc.broker;
  const soTin = coLoc && muc !== "duan" && tinDem ? applyFilters(tinDem.filter((t) => t.purpose === mb), boLoc).length : null;
  const nhanTim = soTin != null ? (soTin ? `Xem ${soTin} tin` : "Tìm kiếm") : "Tìm kiếm";
  // KHÔNG tải sẵn trang đích khi mở màn tìm (chủ dự án 17/10/2026: Vercel phải nằm trong gói $20) — trang không có sẵn
  // trong bộ nhớ đệm thì mỗi lần tải sẵn là một lần chạy máy chủ. Bấm tìm đã có thanh chạy báo đang tìm.
  // CÁCH A (chủ dự án 20/10/2026): mỗi trường chọn xong bấm "Áp dụng" là TÌM LUÔN — đồng bộ Mua bán / Cho thuê / Dự án
  const hangLoc = (gon: boolean, chi?: string[]) => <TruongLocTrangChu muc={muc} value={boLoc} onChange={setLoc} onXong={() => tim(tuKhoa)} gon={gon} chi={chi} />;
  // Điện thoại: hai trường chính là THẺ gọn dưới thẻ tìm; các trường còn lại nằm trong thẻ tìm
  // ĐỦ 5 TRƯỜNG (chủ dự án 17/10/2026: gõ từ khoá không bảo đảm chính xác 100%) trên MỘT HÀNG MENU CHẠY NGANG
  // ngay dưới ô gõ ("1 cái menu chạy phía dưới") — không xếp thẻ chồng bên dưới
  const PHU = muc === "duan" ? ["kv", "da"] : ["kv", "lh", "gia", "dt", "them"];

  // Gợi ý KHÔNG in đậm (chủ dự án 21/10/2026: in đậm phần web tự thêm kiểu Google làm khách thấy chữ vô nghĩa)
  const boiDam = (nhan: string) => nhan;
  // KIỂU GOOGLE: dòng đang chọn bằng phím ↑ ↓ được tô nền; mỗi gợi ý có mũi tên ↖ chép câu vào ô để gõ tiếp
  const chenVaoO = (label: string) => {
    setTuKhoa(label);
    setChon(-1);
    // Con trỏ đứng CUỐI câu vừa chép vào (chủ dự án 20/10/2026) — chờ ô nhận chữ mới rồi mới đặt
    requestAnimationFrame(() => {
      const o = document.querySelector<HTMLTextAreaElement>(mo ? "[role='dialog'] textarea" : "textarea[aria-label='Tìm nhà đất']");
      if (!o) return;
      o.focus();
      o.setSelectionRange(o.value.length, o.value.length);
      o.scrollTop = o.scrollHeight;
    });
  };
  const dong = (s: Suggestion, icon: PhIcon, onClick: () => void, key: string, idx: number, xoa?: () => void) => (
    <div key={key} onMouseEnter={() => setChon(idx)} className={`flex items-center rounded-xl transition ${chon === idx ? "bg-black/[0.05]" : "hover:bg-black/[0.04]"}`}>
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left active:bg-black/[0.06] sm:px-3 sm:py-2.5">
        {/* gọn như màn tìm cũ đã chuẩn (chủ dự án 18/10/2026): kính lúp / đồng hồ nhỏ, không vòng tròn */}
        <span className="flex w-5 shrink-0 justify-center text-cvr-muted"><Icon i={icon} className="h-[18px] w-[18px]" /></span>
        <span className="flex min-w-0 flex-col">
          {/* Gợi ý kiểu Google: MỘT dòng chữ, không dòng phụ (chủ dự án 17/10/2026) */}
          <span className="break-words text-[15px] leading-6 text-cvr-ink sm:text-[16px]">{boiDam(s.label)}</span>
        </span>
      </button>
      {!xoa && (
        <button type="button" aria-label={`Chép "${s.label}" vào ô tìm`} onMouseDown={(e) => e.preventDefault()} onClick={() => chenVaoO(s.label)} className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/[0.06] hover:text-cvr-ink active:scale-90">
          <Icon i={ArrowUpLeft} className="h-[18px] w-[18px]" />
        </button>
      )}
      {xoa && (
        <button type="button" aria-label={`Xoá "${s.label}" khỏi lịch sử`} onMouseDown={(e) => e.preventDefault()} onClick={xoa} className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cvr-muted transition hover:bg-black/[0.06] hover:text-cvr-ink active:scale-90">
          <Icon i={X} className="h-4 w-4" />
        </button>
      )}
    </div>
  );
  const nhanNhom = (t: string, xoaHet?: () => void) => (
    <div className="flex items-center justify-between px-2 pb-1 pt-3 sm:px-3 sm:pt-4">
      <p className="text-[12px] text-cvr-ink sm:text-[13px] sm:font-medium">{t}</p>
      {xoaHet && (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={xoaHet} className="text-[12px] font-semibold text-cvr-muted underline-offset-2 hover:text-cvr-ink hover:underline">
          Xoá tất cả
        </button>
      )}
    </div>
  );

  // Mọi dòng gợi ý theo đúng thứ tự hiện — phím ↑ ↓ đi lần lượt, Enter chạy dòng đang chọn
  const chonCau = (c: CauGoiY) => { luu({ label: c.nhan, kind: "Gợi ý", sub: c.sub, href: c.href }); setTuKhoa(c.nhan); di(c.href, c.nhan); };
  const dsMuc: { label: string; chay: () => void }[] = [
    ...ganDayHien.map((s) => ({ label: s.label, chay: () => chonGoiY(s) })),
    ...cauNhuCau.map((c) => ({ label: c.nhan, chay: () => chonCau(c) })),
    ...goiYDuAn.map((s) => ({ label: s.label, chay: () => chonGoiY(s) })),
  ];
  const nG = ganDayHien.length, nC = cauNhuCau.length;
  const dsGoiY = (
    <div>
      {ganDayHien.length > 0 && nhanNhom("Tìm kiếm gần đây")}
      {ganDayHien.map((s, i) => dong(s, ClockCounterClockwise, () => chonGoiY(s), `g${i}`, i, () => boGanDay(s.label)))}
      {!kw && cauNhuCau.length > 0 && nhanNhom("Tìm kiếm phổ biến")}
      {cauNhuCau.map((c, i) => dong({ label: c.nhan, kind: "Gợi ý", sub: c.sub }, MagnifyingGlass, () => chonCau(c), `n${i}`, nG + i))}
      {goiYDuAn.map((s, i) => dong(s, MagnifyingGlass, () => chonGoiY(s), `d${i}`, nG + nC + i))}
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
              toi ? (on ? "text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]" : "text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)] hover:text-white") : on ? "text-cvr-blue" : "text-cvr-muted hover:text-cvr-ink"
            }`}
          >
            <TabIcon name={t.icon} active={on} className={`${dinh ? "h-5 w-5" : ngang ? "h-8 w-8" : gon ? "h-6 w-6" : "h-[26px] w-[26px] sm:h-8 sm:w-8"} transition-transform duration-300 group-active:scale-90`} />
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
    // CHỈ ĐO KHI CHỮ ĐỔI: đo chiều cao bắt cả trang tính lại bố cục — trước đây đo ở MỌI lần vẽ lại nên chạm thanh tìm trên
    // điện thoại chậm bị khựng ~180ms (đo CPU x4, 18/10/2026). Ô trống thì để cao tự nhiên một dòng, không cần đo.
    if (el.dataset.daDo === el.value) return;
    el.dataset.daDo = el.value;
    if (!el.value) { el.style.height = ""; return; }
    el.style.height = "auto";
    // ô đang ẩn (màn tìm chưa mở) đo ra 0 → để lần sau đo lại khi ô hiện
    if (!el.scrollHeight) { el.style.height = ""; delete el.dataset.daDo; return; }
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
        // Khách QUÊN chọn menu: câu nói "thuê"/"bán" → theo câu; gõ loại chỉ có ở cho thuê ("phòng trọ…") → Cho thuê
        // MENU CHUYỂN THEO TỪ KHOÁ KHÁCH GÕ (chủ dự án 17/10/2026): "dự án…" → Dự án; "mua/bán…" → Mua bán;
        // "thuê…" hoặc loại chỉ có ở cho thuê ("phòng trọ") → Cho thuê. Câu không nói rõ → giữ mục đang chọn.
        const y = mucDichCau(v, muc);
        const m2: Muc = y && y !== muc ? y : muc;
        if (m2 !== muc) setMuc(m2);
        setTuKhoa(v);
        setChon(-1);
        setMoPc(true);
        setLoc(m2 === "duan" ? emptyFilters() : locTuCau(v, m2));
        gianO(e.currentTarget);
      }}
      onFocus={(e) => {
        // Vào ô (mở màn tìm, quay lại ô) → con trỏ ở CUỐI từ khoá; chạm giữa chữ để sửa thì trình duyệt tự đặt lại đúng chỗ chạm
        const o = e.currentTarget;
        o.setSelectionRange(o.value.length, o.value.length);
        setMoPc(true); if (mo && !dangGo) doiGo(true);
      }}
      // bấm vào ô LÚC NÀO cũng mở bảng gợi ý — kể cả khi con trỏ vẫn đang ở trong ô sau khi đóng bằng Esc / × (lỗi "lúc được lúc không")
      onClick={() => setMoPc(true)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (!dsMuc.length) return;
          e.preventDefault();
          setChon((i) => e.key === "ArrowDown" ? (i + 1) % dsMuc.length : i <= 0 ? dsMuc.length - 1 : i - 1);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (chon >= 0 && dsMuc[chon]) dsMuc[chon].chay();
          else tim(tuKhoa);
        }
      }}
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
      <div className={`${trenAnh ? "pb-1.5" : "pb-2"} sm:hidden`}>
        {/* GHI NHẬN CÚ CHẠM SỚM (đo bằng chạm thật 17/10/2026: chạm khi trang chưa chạy xong mã thì mất cú chạm đầu tiên):
            đoạn mã nhỏ này chạy NGAY khi trang hiện ra, nhớ lại khách đã chạm thanh tìm; mã chính chạy xong là mở màn tìm. */}
        <script dangerouslySetInnerHTML={{ __html: "document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('[data-mo-tim]'))window.__cvrMoTim=1},true);document.addEventListener('pointerdown',function(e){var t=e.target;var o=!!(t&&t.closest&&t.closest('[data-o-tim-pc],[data-bang-goi-y],[data-menu-pc] [role=tab]'));window.__cvrBamTrongPc=o;if(!window.__cvrDaChay){var p=document.querySelector('[data-pc-tim]');if(p){if(o&&t.closest('[data-o-tim-pc]'))p.setAttribute('data-cho-mo','');else p.removeAttribute('data-cho-mo')}}},true);document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!window.__cvrDaChay){var p=document.querySelector('[data-pc-tim]');if(p)p.removeAttribute('data-cho-mo')}},true)" }} />
        {/* GIAO DIỆN Ô LỌC CŨ trên nền Hero (chủ dự án 18/10/2026: "chỉ giao diện bộ lọc cũ" — chức năng giữ nguyên bộ tìm
            mới): một thanh xám bo góc, nút xanh vuông có kính lúp nằm trong ô bên phải, không hàng menu (như HomeSearch cũ) */}
        {!trenAnh && <div className="mb-3">{tabsOf(false, true)}</div>}
        {trenAnh ? (
          <button
            type="button"
            data-mo-tim
            onClick={moMo}
            // CÙNG CỠ ô tìm trang Mua bán / Cho thuê / Dự án: cao 36, bo tròn, kính lúp trái (chủ dự án 20/10/2026)
            className="relative flex h-9 w-full items-center rounded-full bg-cvr-surface pl-10 pr-4 text-left ring-1 ring-black/5 transition active:scale-[0.99]"
          >
            <svg aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
            <span className={`min-w-0 truncate text-[15px] ${kw ? "text-cvr-ink" : "text-cvr-faint"}`}>{kw || <span ref={chuChayDt}>Tìm nhà đất theo khu vực, dự án…</span>}</span>
          </button>
        ) : (
        <button
          type="button"
          data-mo-tim
          onClick={moMo}
          className="mt-1 flex min-h-[52px] w-full items-center justify-start gap-3 rounded-[26px] py-3 text-left border border-cvr-line bg-white px-5 shadow-[0_3px_12px_rgba(0,0,0,0.1)] transition duration-200 active:scale-[0.98]"
        >
          <Icon i={MagnifyingGlass} dam className="h-[18px] w-[18px] shrink-0 text-cvr-ink" />
          <span className={`min-w-0 text-left text-[15px] leading-snug ${kw ? "break-words font-semibold text-cvr-ink" : "truncate text-cvr-muted"}`}>{kw || <span ref={chuChayDt}>Tìm nhà đất theo khu vực, dự án…</span>}</span>
        </button>
        )}
      </div>

      {/* MÀN TÌM ĐIỆN THOẠI CHÉP ĐÚNG AIRBNB (ảnh chủ dự án gửi 17/10/2026): nền là trang phía sau làm MỜ NHOÈ ·
          menu mục đích + nút X CÙNG MỘT HÀNG · thẻ trắng có tiêu đề đậm, ô gõ có kính lúp · hai thẻ Loại hình / Mức giá
          (nhãn trái nhạt, giá trị phải đậm) · đáy KHÔNG có thanh: "Xoá tất cả" mờ khi chưa có gì để xoá + nút Tìm kiếm.
          BÀN PHÍM BẬT (lớp ban-phim-mo do BanPhimAo gắn): chỉ ẩn hai thẻ Loại hình/Mức giá — menu, ô gõ, nút Tìm kiếm luôn hiện. */}
      {/* Gắn thẳng vào <body> (createPortal) để ngưng vẽ được trang chủ phía sau mà màn tìm vẫn hiện */}
      {(mo || sanSang) && createPortal(
        <div className={`${!mo ? "hidden" : dangDong ? "mb-dong flex" : "mb-nen-mo flex"} fixed inset-0 z-[200] flex-col ${dangGo ? "bg-white" : "bg-[#f0f0f0]"} sm:hidden`} role="dialog" aria-modal="true" aria-hidden={!mo} aria-label="Tìm nhà đất">
          {/* KHUNG CUỘN RIÊNG: BanPhimAo ép mọi con trực tiếp của lớp phủ "max-height: 100%" khi bàn phím bật → để mỗi
              khung này chịu giới hạn, thẻ tìm bên trong giữ đủ cao và cuộn được (không bị cắt cụt). */}
          {/* CẢ MÀN TÌM CUỘN MỘT KHỐI như Google: vuốt lên thì ô gõ + hàng lọc trôi lên, gợi ý chiếm cả màn hình (trước đây danh
              sách cuộn riêng trong khung nhỏ — bàn phím bật chỉ còn ~70px, chưa được hai dòng). Chạm kéo → hạ bàn phím. */}
          <div onTouchMove={() => { daKeo.current = true; haPhim(); }} onScroll={(e) => { if (dangGo && daKeo.current && e.currentTarget.scrollTop <= 0) { daKeo.current = false; e.currentTarget.querySelector("textarea")?.focus({ preventScroll: true }); } }} className="flex h-full min-h-0 w-full flex-1 flex-col self-stretch overflow-y-auto overscroll-contain">
          {/* CÂN ĐỐI ĐÚNG SỐ ĐO AIRBNB (đo 17/10/2026 ở 375px): lề 20px, lưới 3 cột — hai cột bên BẰNG NHAU 40px, nút X nằm cột phải →
              ba mục giữa đúng tâm màn hình; ba mục rộng bằng nhau (3 cột đều), chữ dài/chữ máy phóng to thì xuống dòng
              trong ô của mình, không đẩy lệch mục khác. */}
          <div className={`${dangGo ? "hidden" : "grid"} mb-tab-mo shrink-0 grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-1 self-stretch px-5 pt-3 [&_[role=tab]]:justify-self-center [&_[role=tab]]:whitespace-normal [&_[role=tab]]:text-center [&_[role=tab]]:pb-1.5 [&_[role=tab]]:text-[12px] [&_[role=tab]]:font-medium [&_[role=tab]]:leading-tight [&_[role=tab]_svg]:h-6 [&_[role=tab]_svg]:w-6 [&_[role=tablist]]:grid [&_[role=tablist]]:grid-cols-3 [&_[role=tablist]]:gap-1`}>
            <div className="col-start-2 min-w-0">{tabsOf(false, true)}</div>
            <button type="button" aria-label="Đóng tìm kiếm" onClick={dongMo} className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full bg-white text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition active:scale-90">
              <Icon i={X} dam className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div ref={theTimRef} className={`${dangDong ? "mb-the-dong" : "mb-the-mo"} relative flex min-h-[200px] flex-1 flex-col self-stretch bg-white px-5 pb-4 ${dangGo ? "pt-3" : "mx-2 mt-3 rounded-[24px] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.2)] " + (phimMo ? "pt-3" : "pt-6")}`}>
            {/* BẤM TÌM / BẤM GỢI Ý → THẤY NGAY WEB ĐANG CHẠY (chủ dự án 17/10/2026: "bấm vào phải nhận biết được, không cứng
                đơ"): thanh chạy ở mép trên thẻ + danh sách mờ đi, không bấm chồng; nút Tìm thành "Đang tìm…". */}
            {dangTim && <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] overflow-hidden rounded-t-[24px]"><span className="thanh-dang-tim block h-full bg-cvr-blue" /></span>}
            {/* Bàn phím bật → ẩn tiêu đề (ẩn ngay: co dần thì phải tính lại bố cục mỗi khung hình → giật) */}
            {!phimMo && !dangGo && <h2 className="mb-4 text-[22px] font-bold leading-[26px] tracking-tight text-cvr-ink">Tìm kiếm</h2>}
            {/* Ô GÕ ĐỨNG YÊN Ở MÉP TRÊN khi đang gõ (như Google): gợi ý dài vuốt xuống thì chỉ danh sách trôi, ô gõ luôn thấy */}
            <div className={dangGo ? "sticky top-0 z-10 -mx-5 -mt-3 shrink-0 border-b border-[#e0e0e0] bg-white px-2 pb-1 pt-3" : "shrink-0"}>
            {/* MÀN GÕ (chủ dự án 18/10/2026): 3 menu ở trên · hàng dưới ← · ô gõ bo tròn, giống màn tìm Mua bán / Cho thuê / Dự án; bỏ nút × */}
            {dangGo && (
              <div className="flex items-center justify-center pb-2.5">
                {/* 3 MENU CHÍNH GIỮA, ba ô rộng bằng nhau (chủ dự án 20/10/2026) */}
                <div role="tablist" className="grid w-full max-w-[360px] grid-cols-3 justify-items-center">
                  {TABS.map((t) => (
                    <button key={t.muc} type="button" role="tab" aria-selected={muc === t.muc} onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setMuc(t.muc); setLoc(t.muc === "duan" ? emptyFilters() : locTuCau(tuKhoa, t.muc)); }}
                      className={`relative pb-1.5 text-[15px] font-semibold transition-colors ${muc === t.muc ? "text-cvr-ink" : "text-cvr-muted"}`}>
                      {t.nhan}
                      {muc === t.muc && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-cvr-blue" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* ĐANG GÕ: nút ← quay lại đứng CẠNH ô gõ, giống màn tìm Mua bán / Cho thuê / Dự án (chủ dự án 18/10/2026: bỏ nút ×) */}
            <div className={dangGo ? "flex items-center gap-1" : ""}>
            {dangGo && <button type="button" aria-label="Quay lại" onMouseDown={(e) => e.preventDefault()} onClick={dongMo} className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-cvr-ink active:bg-cvr-surface"><svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>}
            <div className="relative min-w-0 flex-1">
              {/* kính lúp trong ô — đúng ô "Where?" của Airbnb */}
              {!dangGo && <span className="pointer-events-none absolute left-4 top-7 -translate-y-1/2 text-cvr-ink"><Icon i={MagnifyingGlass} dam className="h-5 w-5" /></span>}
              {oNhap(dangGo ? "max-h-[152px] min-h-[36px] w-full rounded-[18px] border border-transparent bg-cvr-surface py-[5px] pl-4 pr-10 text-[16px] leading-6 text-cvr-ink placeholder-cvr-faint outline-none ring-2 ring-cvr-blue/40 focus:placeholder:text-transparent" : "max-h-[152px] min-h-[54px] w-full rounded-xl border border-[#b0b0b0] bg-white py-[15px] pl-12 pr-10 text-[16px] leading-6 text-cvr-ink placeholder-cvr-muted outline-none transition focus:border-cvr-ink", "Tìm nhà đất")}
              {tuKhoa && (
                <button type="button" aria-label="Xoá từ khoá" onClick={xoaHet} className={`absolute right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-muted active:bg-black/5 ${dangGo ? "top-[18px]" : "top-7"}`}>
                  <Icon i={X} className="h-4 w-4" />
                </button>
              )}
            </div>
            </div>
            {/* NÚT TÌM TRÒN XANH "→" dưới ô gõ, đúng màn gõ của Google (chủ dự án 18/10/2026, ảnh khoanh đỏ): bấm là tìm; đang
                tìm thì xoay vòng + vạch chạy mép trên màn hình — khách biết web đang chạy */}
            </div>
            {/* MÀN GÕ GỌN NHƯ GOOGLE (chủ dự án 18/10/2026, ảnh Google: "rườm rà, thô kệch"): chỉ ô gõ không viền + đường kẻ, bên dưới là
                các lần tìm gần đây / gợi ý — không chen menu hay trường lọc. Lọc chi tiết nằm ở trang kết quả. */}
            {/* Đang gõ: chỉ ô gõ + gợi ý (kiểu Google); bấm ← về lại màn có đủ 5 trường để tìm chi tiết (chủ dự án 17/10/2026) */}
            <div className={`-mx-2 mt-1 transition-opacity duration-200 ${dangTim ? "pointer-events-none opacity-40" : ""}`}>{dsGoiY}</div>
          </div>
          {/* Hai trường chính thành THẺ gọn dưới thẻ tìm (như "Thời gian · Khách" của Airbnb) */}
          <div className="mb-3 shrink-0" />
          </div>
          {/* Đáy: CHỈ nút Tìm kiếm (chủ dự án 17/10/2026: "không cần nút Xoá tất cả, kiểu Google" — xoá bằng × trong ô) */}
          {/* ĐÁY MÀN TÌM (chủ dự án 17/10/2026: "menu phía dưới, bố trí cho gọn, để chuyển qua lại, dễ thao tác"): hàng 5 trường lọc
              nằm sát ngón cái cùng nút Tìm kiếm. ĐANG GÕ thì ẩn cả hàng (như Google: chỉ ô gõ + gợi ý, gợi ý nhiều vẫn đủ chỗ
              bấm — chủ dự án 17/10/2026); bấm ← quay lại là hiện đủ để lọc chi tiết. */}
          <div className={`${dangGo ? "hidden" : "flex"} mb-day-mo shrink-0 flex-col gap-3 self-stretch bg-[#f0f0f0] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3`}>
            {hangLoc(true, PHU)}
            {!dangGo && <button type="button" onClick={() => tim(tuKhoa)} className="flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-cvr-blue px-6 py-2 text-[16px] font-medium text-white transition active:scale-95">
              <Icon i={dangTim ? CircleNotch : MagnifyingGlass} dam className={`h-[18px] w-[18px] ${dangTim ? "animate-spin" : ""}`} />
              {dangTim ? "Đang tìm…" : nhanTim}
            </button>}
          </div>
        </div>,
        document.body,
      )}

      {/* ═══ MÁY TÍNH KIỂU AIRBNB (chủ dự án 17/10/2026: "trên PC để 3 menu ở trên"): menu mục đích (biểu tượng
          trên chữ, căn giữa) ở TRÊN ô tìm lớn · bấm vào ô mới xổ trường lọc + gợi ý ═══ */}
      {/* trenAnh = GIAO DIỆN Ô LỌC CŨ trên ảnh Hero (chủ dự án 18/10/2026): khối kính mờ, 3 nút viên (mục chọn nền trắng),
          ô tìm trong suốt chữ trắng, nút "Tìm kiếm" nằm trong ô — chức năng vẫn là bộ tìm mới */}
      <div ref={pcRef} data-pc-tim className={`relative mx-auto hidden pb-6 sm:block ${trenAnh ? "max-w-2xl" : "max-w-[880px]"}`}>
        <div className={trenAnh ? "rounded-[22px] bg-black/15 p-2.5 shadow-2xl shadow-black/25 ring-1 ring-inset ring-white/25 backdrop-blur-xl backdrop-saturate-150" : ""}>
        {trenAnh ? (
          <div data-menu-pc className="mb-2 flex select-none justify-center">
            <div role="tablist" className="inline-flex items-center gap-1">
              {TABS.map((t) => (
                <button key={t.muc} type="button" role="tab" aria-selected={muc === t.muc}
                  onClick={() => { setMuc(t.muc); setLoc(t.muc === "duan" ? emptyFilters() : locTuCau(tuKhoa, t.muc)); }}
                  className={`rounded-full px-4 py-1.5 text-[13.5px] font-semibold tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${muc === t.muc ? "bg-white text-cvr-ink shadow-[0_1px_6px_rgba(0,0,0,0.2)]" : "text-white/85 hover:bg-white/15 hover:text-white"}`}>
                  {t.nhan}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div data-menu-pc className="mb-6 select-none">{tabsOf(false)}</div>
        )}
        <div className="relative z-[1]">
          <div data-o-tim-pc className={trenAnh
            ? "relative flex items-start rounded-xl bg-white/[0.08] ring-1 ring-white/30 transition focus-within:ring-white/60"
            : `flex items-start rounded-[32px] border border-cvr-line bg-white transition-shadow duration-300 ${moPc ? "shadow-[0_8px_28px_rgba(0,0,0,0.14)]" : "shadow-[0_3px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_5px_18px_rgba(0,0,0,0.12)]"}`}>
            {trenAnh && <span aria-hidden className="pointer-events-none absolute left-4 top-[14px] text-white/70"><Icon i={MagnifyingGlass} dam className="h-5 w-5" /></span>}
            <label className={`flex flex-1 cursor-text items-start gap-3 ${trenAnh ? "py-3 pl-11 pr-2" : "py-[18px] pl-7 pr-3"}`}>
              {oNhap(trenAnh
                ? "max-h-[40vh] w-full bg-transparent text-[15px] leading-6 text-white placeholder-white/70 !outline-none !ring-0 !shadow-none focus:placeholder:text-transparent"
                : "max-h-[40vh] w-full bg-transparent text-[16px] leading-[26px] text-cvr-ink placeholder-cvr-muted !outline-none !ring-0 !shadow-none focus:placeholder:text-transparent", "Tìm nhà đất theo khu vực, dự án hoặc gõ cả câu")}
            </label>
            {tuKhoa && (
              <button type="button" aria-label="Xoá chữ đã gõ" onMouseDown={(e) => e.preventDefault()} onClick={() => setTuKhoa("")} className={`anim-hien-chu flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${trenAnh ? "mt-[10px] text-white/70 hover:bg-white/15 hover:text-white" : "mt-[18px] bg-cvr-surface text-cvr-muted hover:bg-black/[0.08] hover:text-cvr-ink"}`}>
                <Icon i={X} dam className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => tim(tuKhoa)}
              aria-label="Tìm kiếm"
              className={trenAnh
                ? "m-1.5 flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-cvr-blue px-6 text-[14px] font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95"
                : `m-2 flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-cvr-blue text-[15px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cvr-blue-ink active:scale-95 px-6`}
            >
              <Icon i={dangTim ? CircleNotch : MagnifyingGlass} dam className={`h-5 w-5 shrink-0 ${dangTim ? "animate-spin" : ""}`} />
              <span className="whitespace-nowrap">{nhanTim}</span>
            </button>
          </div>
          {moPc && (
            <div data-bang-goi-y className={`${dangDong ? "anim-dong-xuong" : "anim-xo-xuong"} absolute inset-x-0 top-full z-[90] mt-3 rounded-[28px] bg-white px-6 pb-5 pt-5 shadow-2xl shadow-black/15 ring-1 ring-black/5`}>
              {/* (Bỏ nút × đóng bảng 18/10/2026 — chủ dự án: "x" là nút xoá lịch sử, không phải nút đóng; thoát = Esc / bấm ra ngoài) */}
              {/* (Bỏ hàng 5 trường lọc trên trang chủ 18/10/2026 — chủ dự án: trang chủ đã có 3 menu phía trên; sang trang Mua bán / Cho thuê đã có thanh lọc) */}
              <div className="pt-1" />
              {coGoiY && dsGoiY}
            </div>
          )}
          {/* BẢNG HIỆN NGAY TỪ CÚ BẤM ĐẦU (chủ dự án 17/10/2026: "ngay cái bấm đầu tiên đã lỗi"): trang vừa mở, mã chưa chạy
              xong thì đoạn mã nhỏ trong trang bật bảng này lên (cùng dáng bảng thật); mã chạy xong là bảng thật thay chỗ */}
          {!moPc && (
            <div data-bang-tam aria-hidden className="pointer-events-none absolute inset-x-0 top-full z-[90] mt-3 hidden rounded-[28px] bg-white px-6 pb-5 pt-5 shadow-2xl shadow-black/15 ring-1 ring-black/5">
              <div className="flex items-center gap-2 pb-2 pr-11">
                {["Khu vực", "Loại hình", "Mức giá", "Diện tích", "Lọc thêm"].map((t) => (
                  <span key={t} className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-cvr-line bg-white px-4 text-sm text-cvr-body">
                    {t}
                    <svg className="h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
