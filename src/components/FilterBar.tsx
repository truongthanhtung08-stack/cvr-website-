"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { duongDanCau, goiYTheoY } from "@/lib/goiYTheoY";
import { useGoiYThat } from "@/lib/useGoiYThat";
import { timDuAn, napDsDuAn, dsDuAnDaNap, type DuAnTen } from "@/lib/duAnTen";
import { startTransition, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNutQuayLai } from "@/lib/khoaCuon";
import { useRouter } from "next/navigation";
import { createPortal, flushSync } from "react-dom";
import FilterDropdown, { PanelActions, FilterDropdownGroup, ChanBangContext } from "@/components/FilterDropdown";
import { districtsOf, wardsOf, wardsOfNew, provinceNamesFor, choCuCua, phuongMoiCua, phuongMoiCuaQuan, oldNamesOf, newProvinceOf, type GeoMode } from "@/lib/locations";
import {
  typeGroupsFor,
  priceRangesFor,
  areaRangesFor,
  bedroomOptions,
  directionOptions,
  priceRangeText,
  areaRangeText,
  normalizeVi,
  applyFilters,
  khopTen,
  diemTen,
  sameLocation,
  MAX_LOCATIONS,
  legalOptions,
  furnishingOptions,
  emptyFilters,
  filtersToParams,
  hasActiveFilters,
  type Filters,
  type LocationSel,
  tenLoaiHinh,
} from "@/lib/filters";
import { suggest, type Suggestion } from "@/lib/suggest";
import { chuChuaHieu, docMucDich, goiYNoiLong, parseQuery, suaChinhTa } from "@/lib/smartSearch";
import { gopCau } from "@/lib/locTuCau";
import { hintsFor, listingHints, pageHints, type HintMode, type TinGoiY } from "@/lib/searchHints";
import { useTypingPlaceholder } from "@/lib/useTypingPlaceholder";
import { cuonToiKetQua } from "@/lib/scroll";

const RECENT_KEY = "cvr-recent-search"; // lịch sử tìm kiếm (localStorage)
const GEO_MODE_KEY = "cl-geo-mode"; // hệ đơn vị hành chính đã chọn: "cu" | "moi" (localStorage)

// Icon dòng gợi ý — kiểu Google: đồng hồ (lịch sử) · kính lúp (gợi ý) · mũi tên chèn ↖.
const ICON_CLOCK = "M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
const ICON_SEARCH = "M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z";
const ICON_INSERT = "M18 18L6 6M6 6h8M6 6v8"; // ↖ chèn gợi ý vào ô tìm
// Thanh lọc kiểu Homedy — fully controlled qua props value/onChange.

// Ô gõ màn tìm TỰ GIÃN theo chữ — ĐÚNG cách ô trang chủ (TimTrangChu): ô trống để cao tự nhiên một dòng, KHÔNG đo (đo lúc
// màn tìm vừa mở thì chữ gợi ý còn xuống dòng, ô ra cao sai tỷ lệ tới khi gõ — chủ dự án 20/10/2026); ô đang ẩn đo ra 0 thì đo lại sau.
function gianO(el: HTMLTextAreaElement | null) {
  if (!el || el.dataset.daDo === el.value) return;
  el.dataset.daDo = el.value;
  if (!el.value) { el.style.height = ""; return; }
  el.style.height = "auto";
  if (!el.scrollHeight) { el.style.height = ""; delete el.dataset.daDo; return; }
  el.style.height = `${Math.max(36, el.scrollHeight)}px`;
}

export default function FilterBar({
  value,
  onChange,
  onSearch,
  onMap,
  mapActive = false,
  compact = false,
  leading,
  overlayLeading,
  nenSang = false,
  purpose = "ban",
  hintMode,
  hintItems,
  hangLoc,
  goiYRieng,
  soKetQua,
  nhanXem,
  demTheoNoi,
  demLoai,
  cauSeo,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  // Kiểu Google: ra kết quả NGAY. Có thể truyền bộ lọc kèm (khi bấm gợi ý/lịch sử) để
  // điều hướng đúng lựa chọn vừa chọn, không dính state cũ.
  onSearch?: (f?: Filters) => void;
  // Bấm "Bản đồ" — bật/tắt chế độ bản đồ (nút nằm cạnh ô tìm, kiểu Batdongsan).
  onMap?: () => void;
  mapActive?: boolean;
  compact?: boolean;
  // Nội dung đứng đầu dòng 1 (vd: tab Mua bán/Cho thuê/Dự án) — chỉ dùng ở chế độ compact.
  leading?: React.ReactNode;
  /** Nội dung đầu màn tìm toàn màn hình (điện thoại) — vd tab Mua bán/Cho thuê/Dự án. Trống = dùng leading. */
  overlayLeading?: React.ReactNode;
  /** Ô tìm lớn nằm trên NỀN SÁNG (trang chủ bỏ Hero ảnh, 17/10/2026) — PC chữ đen, không kiểu kính trên ảnh tối. */
  nenSang?: boolean;
  // Mục đích trang → danh mục loại hình tương ứng (mua bán vs cho thuê).
  purpose?: "ban" | "thue";
  // Bộ câu gợi ý chạy trong ô tìm. Mặc định theo purpose; trang chủ truyền thêm
  // "duan" khi đang ở tab Dự án (purpose của Dự án vẫn là "ban").
  hintMode?: HintMode;
  // Kho tin để dựng câu gợi ý theo TIN MỚI + TIN HOT (đổi theo từng đợt đăng tin).
  // Không truyền → dùng bộ câu theo cơ cấu.
  hintItems?: TinGoiY[];
  /** MỘT KHUÔN cho trang Dự án (chủ dự án 01/11/2026): cùng ô tìm, cùng màn tìm, cùng nút Làm mới — chỉ thay HÀNG TRƯỜNG LỌC
   *  (Toàn quốc · Dự án · Loại hình · Chủ đầu tư · Lọc thêm) và GỢI Ý khi gõ (dự án khớp tên / chủ đầu tư). */
  hangLoc?: React.ReactNode;
  goiYRieng?: (kw: string) => Suggestion[];
  /** Số kết quả khớp đúng lựa chọn → nút lối ra "Xem N tin" ở đáy mỗi bảng chọn */
  soKetQua?: number;
  /** Chữ nút lối ra do trang tự ghi (trang Dự án: "Xem N dự án") */
  nhanXem?: string;
  /** Số tin theo nơi / theo loại, tính theo mọi trường KHÁC đã chọn → bảng chọn chỉ hiện cái còn tin (01/11/2026) */
  demTheoNoi?: (l: LocationSel) => number;
  demLoai?: (loai: string) => number;
  /** Câu SEO, pSEO của mục (tên trang pSEO có tin, kèm đường dẫn) — chữ chạy trong ô tìm theo đúng trang đang xem */
  cauSeo?: { nhan: string; href: string }[];
}) {
  // coDiaDanh trong điều kiện tính lại của các useMemo dùng địa danh: dữ liệu về sau lần tính đầu thì phải tính lại
  const coDiaDanh = useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const f = value;
  // Danh mục loại hình theo đúng mục đích trang
  const typeGroups = typeGroupsFor(purpose);
  const typeOptions = typeGroups.flatMap((g) => g.items);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const hh = compact ? "h-12" : "h-10"; // compact = thanh tìm kiếm LỚN ở Hero · trang danh sách = gọn

  // Gợi ý CHẠY CHỮ trong ô tìm — SÁT đúng mục đang đứng (mua bán / cho thuê / dự án)
  // và bám TIN MỚI + TIN HOT trong kho (có kho tin thì dựng động, không thì theo cơ cấu).
  // Người dùng đã gõ chữ → dừng chạy để không giật dưới tay họ.
  const mode = hintMode ?? purpose;
  // Trang ĐÃ CÓ LỌC (VD căn hộ Khánh Hòa) → không chạy câu mẫu nơi khác ("Nhà riêng Đà Nẵng…" lạc trang —
  // chủ dự án 17/10/2026), đứng yên đúng câu của ô tìm trang chủ.
  const coLocSan = hasActiveFilters(f);
  // Trang đã lọc sẵn (trang theo từ khoá SEO): chữ chạy = từ khoá của chính trang + đi sâu theo tin thật (searchHints.pageHints, 01/11/2026)
  const hintTrang = () => {
    if (!hintItems?.length || mode === "duan" || f.locations.length > 1) return null;
    const l0 = f.locations[0];
    const loaiG = gomLoai(f.types, typeGroups);
    const loai = loaiG.length === 1 ? loaiG[0].nhan.toLowerCase().replace(/,\s*/g, " ") : ""; // "căn hộ chung cư" — đúng chữ từ khoá trang, không dấu phẩy
    const tinh = l0 ? (l0.ward ? `${l0.ward.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, "")}, ${l0.province}` : l0.province) : "";
    const bl = { ...f, keyword: "" };
    const ds = pageHints(hintItems, mode === "thue" ? "thue" : "ban", loai, l0?.ward ? "" : tinh,
      (l) => applyFilters([{ id: "", title: "", area: "", ...l }], bl).length > 0);
    // phường đã chọn: câu gốc ghi đủ "phường, tỉnh"
    return l0?.ward ? [`${mode === "thue" ? "Cho thuê" : "Bán"} ${loai || "nhà đất"} ${tinh}`, ...ds.slice(1)] : ds;
  };
  // CÂU SEO CỦA CHÍNH TRANG (chủ dự án 01/11/2026: "câu chạy phải là câu SEO, pSEO của mỗi phần — hiện tất cả chạy chung một câu"):
  // trang /mua-ban/can-ho-chung-cu/da-nang chạy tên chính trang đó rồi các trang con (phường, giá…); trang mục (/mua-ban) chạy các trang
  // pSEO nhiều tin nhất của mục. Đọc đường dẫn lúc trang đã mở (máy chủ dựng như cũ).
  const cauSeoTrang = (): string[] | null => {
    if (!cauSeo?.length || typeof window === "undefined") return null;
    const p = window.location.pathname.replace(/\/trang\/\d+$/, "").replace(/\/$/, "");
    const cua = cauSeo.filter((c) => c.href === p || c.href.startsWith(p + "/"));
    const ds = (cua.length ? cua : cauSeo).map((c) => c.nhan);
    return ds.length ? ds.slice(0, 8) : null;
  };
  const hintPhrases = useMemo(
    () => cauSeoTrang() ?? (coLocSan ? hintTrang() ?? ["Tìm nhà đất theo khu vực, dự án…"]
      : hintItems && hintItems.length > 0 && mode !== "duan"
      ? listingHints(hintItems, mode)
      : hintsFor(mode)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hintTrang đọc f + nhóm loại của trang
    [hintItems, mode, coLocSan, f, cauSeo],
  );
  // chỉ dừng chạy khi khách đã gõ chữ (trang lọc sẵn nay cũng chạy câu theo từ khoá của trang)
  const goiYChay = useTypingPlaceholder(hintPhrases, f.keyword.trim().length > 0);

  // Autocomplete đa tầng: Khu vực · Loại hình · Sản phẩm · Dự án · Tin tức.
  // Khi chạm vào ô (chưa gõ) → hiện Lịch sử + Gợi ý phổ biến (mô hình Homedy).
  const router = useRouter();
  const [sugOpen, setSugOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<Suggestion[]>([]);
  const boxRef = useRef<HTMLDivElement>(null); // vùng ô tìm — để bấm-ra-ngoài thì đóng gợi ý
  const inputRef = useRef<HTMLInputElement>(null); // để nút Chèn/Xoá đưa con trỏ về ô
  const overlayInputRef = useRef<HTMLTextAreaElement>(null); // ô nhập của trang tìm toàn màn hình (mobile)
  const [overlay, setOverlay] = useState(false); // MOBILE: chạm ô → mở trang tìm TOÀN MÀN HÌNH kiểu Google
  // Nút Quay lại điện thoại đóng màn tìm, không rời trang (hàm chung, 22/10/2026). Mọi lối đóng để CHUYỂN TRANG gọi
  // boQuaLui() trước (tự lùi lúc trang mới đang vào có thể đá khách về trang cũ).
  const boQuaLui = useNutQuayLai(overlay, () => setOverlay(false));
  // Điện thoại (đo sau khi trang mở — máy chủ dựng như máy tính, không lệch HTML)
  const [laDt, setLaDt] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc cỡ màn hình một lần khi trang mở
  useEffect(() => { setLaDt(window.matchMedia("(max-width: 639px)").matches); }, []);
  // Mở màn tìm + đưa con trỏ vào ô gõ trong CÙNG cú chạm (flushSync): iPhone chỉ bật bàn phím khi focus nằm trong cú chạm
  // Dựng sẵn màn tìm 1,2 s sau khi trang mở (điện thoại) — lúc chạm không phải dựng
  const [sanSangDt, setSanSangDt] = useState(false);
  useEffect(() => {
    if (!laDt) return;
    const id = setTimeout(() => setSanSangDt(true), 1200);
    return () => clearTimeout(id);
  }, [laDt]);
  const moTimDt = () => {
    const man = document.querySelector<HTMLElement>("[data-man-tim]");
    if (man && overlayInputRef.current) {
      // đã dựng sẵn: hiện ngay + con trỏ vào ô gõ trong cú chạm; cập nhật trạng thái làm sau, không chặn cú chạm
      man.classList.remove("hidden");
      man.classList.add("flex");
      overlayInputRef.current.focus({ preventScroll: true });
      startTransition(() => setOverlay(true));
    } else {
      flushSync(() => setOverlay(true));
      overlayInputRef.current?.focus({ preventScroll: true });
    }
  };

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc localStorage một lần khi mở (có từ trước)
      if (Array.isArray(r)) setRecent(r);
    } catch { /* bỏ qua localStorage lỗi */ }
  }, []);

  // Ẩn gợi ý: đóng khi chạm/bấm RA NGOÀI ô tìm. Dùng "pointerdown" (bao cả CHẠM,
  // chuột, bút) — "mousedown" cũ không ăn chắc trên điện thoại nên panel bị kẹt.
  // Thêm phím Esc để đóng.
  useEffect(() => {
    if (!sugOpen) return;
    const close = () => { setSugOpen(false); setActiveIdx(-1); };
    const onDoc = (e: Event) => {
      // bấm trong BẢNG TRƯỜNG (Toàn quốc, Loại BĐS… — dựng ngoài ô tìm) hoặc trong MÀN GÕ không phải bấm ra ngoài: gợi ý / tìm kiếm gần
      // đây giữ nguyên (01/11/2026: chọn trường, Áp dụng xong màn gõ trống trơn — "biến mất")
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest(".cvr-sheet, .cvr-sheet-scrim") || overlay) return;
      if (!boxRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [sugOpen, overlay]);

  const pushRecent = (s: Suggestion) => {
    setRecent((prev) => {
      const next = [s, ...prev.filter((x) => x.label !== s.label)].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };
  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* noop */ }
  };
  // Xoá RIÊNG một mục trong lịch sử (dấu × ở cuối dòng) — kiểu Google.
  const removeRecent = (label: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x.label !== label);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };
  // LƯU CHÍNH CHỮ NGƯỜI GÕ vào lịch sử khi bấm Tìm / nhấn Enter.
  // Trước đây chỉ lưu khi bấm vào một dòng gợi ý — mà phần lớn người dùng gõ
  // xong là bấm Tìm luôn, nên lịch sử gần như trống.
  const luuTuKhoaDaGo = () => {
    const kw = f.keyword.trim();
    if (kw.length >= 2) pushRecent({ label: kw, kind: "Gợi ý", sub: "Từ khoá đã tìm", keyword: kw });
  };

  // ── CHẠY TÌM (một cửa cho: nút Tìm · Enter · bấm dòng gợi ý) ───────────────
  // LUÔN có phản hồi, dù khớp hay không khớp tin nào:
  //   • Trang có onSearch (trang chủ) → sang trang kết quả.
  //   • Trang danh sách tự lọc tại chỗ → CUỘN xuống khối kết quả (#ket-qua).
  // Kèm trạng thái "đang tìm" ~0,7s để khách thấy máy đang chạy, không tưởng đứng yên.
  // ĐIỀU HƯỚNG TÌM CHUẨN — MỘT VÒNG TÌM (chủ dự án 02/11/2026: "chỗ đang vào gõ ở đâu — làm một vòng — quay lại, đích là chỗ đang gõ"):
  // trang khách đứng gõ lần đầu (trang chủ, hoặc Mua bán / Cho thuê / Dự án vào từ menu) là ĐIỂM XUẤT PHÁT. Kết quả → đổi trường → gõ
  // mới → kết quả… mỗi trang kết quả THAY trang kết quả trước trong lịch sử (trang kết quả mang dấu cvrKq), nên bấm Quay lại MỘT LẦN là
  // về điểm xuất phát. Gõ ở điểm xuất phát thì trang kết quả đầu là bước MỚI (điểm xuất phát còn nguyên phía sau). Màn tìm điện thoại
  // đang giữ một bước lịch sử riêng (nút ← đóng màn tìm) → lùi bỏ bước đó trước rồi mới sang trang. Câu vừa gõ đi theo sang trang mới.
  const diKetQua = (url: string, cau: string) => {
    try { if (cau) sessionStorage.setItem("cvr-cau:" + url.split("?")[0], cau); } catch { /* bỏ qua */ }
    boQuaLui();
    const st = (history.state ?? {}) as Record<string, unknown>;
    if (dangLui.current) { dangLui.current = url; return; } // gọi lặp (Enter + gửi form) trong lúc đang lùi: chỉ đổi đích, không lùi thêm
    const di = (u: string) => (st.cvrKq ? router.replace(u) : router.push(u));
    if (!Object.keys(st).some((k) => k.startsWith("cvrBang"))) return di(url);
    dangLui.current = url;
    const sau = () => {
      window.removeEventListener("popstate", sau);
      window.setTimeout(() => { const u = dangLui.current; dangLui.current = ""; if (u) di(u); }, 0);
    };
    window.addEventListener("popstate", sau);
    history.back();
  };
  const dangLui = useRef("");
  const [dangTim, setDangTim] = useState(false);
  const chayTim = (next?: Filters, luu = true) => {
    setSugOpen(false);
    setOverlay(false);
    setActiveIdx(-1);
    if (luu) luuTuKhoaDaGo();
    setDangTim(true);
    window.setTimeout(() => setDangTim(false), 1200);
    // Báo khối kết quả chạy chuyển động (kể cả khi bộ lọc không đổi) — khách thấy trang vừa tìm
    window.dispatchEvent(new Event("cvr-tim"));
    const kw = f.keyword.trim();
    // TÊN DỰ ÁN CHƯA NẠP (khách gõ nhanh rồi Enter ngay — danh sách nạp khi bắt đầu gõ): chờ nạp xong rồi mới đọc mục đích, không thì gõ
    // trọn tên dự án vẫn ở lại Mua bán / Cho thuê (02/11/2026)
    if (!next && kw && dsDuAnDaNap() === null) { void napDsDuAn().then(() => chayTim(next, false)); return; }
    const dsDa = dsDuAnDaNap() ?? dsDuAn;
    // CÂU NÓI MỤC ĐÍCH KHÁC TAB ĐANG ĐỨNG → SANG ĐÚNG TAB (chủ dự án 02/11/2026: "đứng ở Mua bán gõ cho thuê phải đổi qua Cho thuê",
    // Mua bán · Cho thuê · Dự án như nhau). DÙNG CHUNG bộ đọc mục đích của ô tìm trang chủ (docMucDich + gõ trọn tên dự án = Dự án,
    // y hệt mucDichCau ở TimTrangChu — chủ dự án 02/11/2026). Sang tab mới bằng diKetQua: Quay lại về đúng trang đang đứng gõ.
    if (!next && kw && kw !== daTim && (!onSearch || mode === "duan")) {
      const md = docMucDich(kw, () => dsDa.length > 0 && !!timDuAn(kw, dsDa, false));
      if (md && md !== (mode === "duan" ? "duan" : purpose)) {
        setDaTim(kw);
        const da = timDuAn(kw, dsDa);
        if (md === "duan") {
          if (da?.duAn.coTrang) return diKetQua(`/du-an/${da.duAn.slug}`, kw);
          const p = filtersToParams({ ...emptyFilters(), keyword: kw });
          p.set("mode", "Dự án");
          return diKetQua(`/du-an?${p.toString()}`, kw);
        }
        const goc = md === "thue" ? "/cho-thue" : "/mua-ban";
        if (da) return diKetQua(`${goc}?duan=${encodeURIComponent(da.duAn.ten)}`, kw);
        const u = duongDanCau(md, kw);
        if (u) return diKetQua(u, kw);
        const q = filtersToParams({ ...emptyFilters(), keyword: kw });
        q.set("mode", md === "thue" ? "Cho thuê" : "Mua bán");
        return diKetQua(`${goc}?${q.toString()}`, kw);
      }
    }
    if (onSearch) { boQuaLui(); return onSearch(next); }
    // TRANG KẾT QUẢ: khách gõ CÂU MỚI rồi bấm Tìm → câu mới thắng bộ lọc cũ (chủ dự án 17/10/2026: đang ở
    // "nhà Đà Nẵng" gõ "Phòng trọ cho thuê tại Huế" mà vẫn ra Đà Nẵng). Câu máy hiểu trọn → sang đúng trang sạch
    // như ô tìm trang chủ; câu còn chi tiết riêng → lọc lại từ đầu theo câu (khu vực · loại hình · giá tách từ câu).
    if (!next && kw && mode === "duan" && kw !== daTim) { apDungCau(kw); return; }
    if (!next && kw && mode !== "duan" && kw !== daTim) {
      setDaTim(kw);
      // GÕ ĐÚNG TÊN DỰ ÁN (21/10/2026): như ô tìm trang chủ — nói rõ mua/thuê hoặc đang ở trang Mua bán/Cho thuê → tin thuộc dự án
      const da = timDuAn(kw, dsDa);
      if (da) {
        const m = parseQuery(kw).purpose ?? purpose;
        return diKetQua(`${m === "thue" ? "/cho-thue" : "/mua-ban"}?duan=${encodeURIComponent(da.duAn.ten)}`, kw);
      }
      const u = duongDanCau(purpose, kw);
      if (u && u !== window.location.pathname) return diKetQua(u, kw);
      // Địa chỉ trang đi theo câu mới (tải lại / gửi link vẫn đúng câu khách tìm). Đang ở trang con cố định nơi
      // (VD /cho-thue/nha/da-nang) → về trang mục đích gốc, không để lọc cố định của trang con đè câu mới.
      const goc = purpose === "thue" ? "/cho-thue" : "/mua-ban";
      const q = filtersToParams({ ...emptyFilters(), keyword: kw });
      q.set("mode", purpose === "thue" ? "Cho thuê" : "Mua bán");
      if (window.location.pathname !== goc) return diKetQua(`${goc}?${q.toString()}`, kw);
      onChange(gopCau(f, kw, purpose));
      window.history.replaceState(window.history.state, "", `${goc}?${q.toString()}`);
    }
    cuonToiKetQua();
  };
  // ĐỌC MỘT CÂU VÀO CÁC TRƯỜNG LỌC TẠI CHỖ — một đường cho Mua bán, Cho thuê, Dự án (cùng bộ đọc locTuCau):
  // Mua bán / Cho thuê: khu vực · loại hình · giá · phòng ngủ · lọc thêm, cả câu giữ làm từ khoá (vòng 2 dò nội dung)
  // Dự án: khu vực · loại hình (cùng cây loại hình), phần chưa đọc được (tên dự án, chủ đầu tư…) làm từ khoá
  const apDungCau = (cau: string) => {
    setSugOpen(false); setOverlay(false); setActiveIdx(-1);
    setDaTim(cau);
    // Ô tìm HIỆN ĐÚNG CÂU VỪA TÌM (01/11/2026): Dự án đọc hết câu vào trường thì từ khoá còn lại rỗng → ô từng hiện lại câu CŨ từ trang
    // chủ, gõ tiếp bị nối vào câu cũ ("căn hộ sơn tràcăn hộ sơn trà")
    setCauCu(cau);
    tuCau.current = true;
    try { sessionStorage.setItem("cvr-cau:" + window.location.pathname, cau); } catch { /* bỏ qua */ }
    if (mode === "duan") {
      // Dự án: chỉ Khu vực · Loại hình đọc từ câu; trường khách tự chọn (chủ đầu tư, tình trạng…) giữ; phần chưa đọc làm từ khoá
      const g = gopCau(f, cau, "ban");
      onChange({ ...f, locations: g.locations, types: g.types, tinhTrang: g.tinhTrang, keyword: chuChuaHieu(cau.replace(/(^|\s)dự\s+án(?=\s|$)/gi, " ")).replace(/,/g, "") });
    } else onChange(gopCau(f, cau, purpose));
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${filtersToParams({ ...emptyFilters(), keyword: cau }).toString()}`);
    cuonToiKetQua();
  };
  // câu đã tìm gần nhất — bấm Tìm lại cùng câu thì giữ nguyên các trường khách tự chỉnh sau đó
  const [daTim, setDaTim] = useState(f.keyword.trim());
  // Câu khách vừa gõ ở trang chủ rồi được đưa tới trang sạch (pSEO) — hiện lại trong ô để SỬA TIẾP như Google
  // (chủ dự án 17/10/2026). Chỉ để hiện; khách sửa là thành từ khoá thật. Đọc sau khi dựng trang (máy chủ không có sessionStorage).
  const [cauCu, setCauCu] = useState("");
  const [veChoGo, setVeChoGo] = useState(false); // trang này là trang kết quả của một vòng tìm → hiện nút ‹ về chỗ đang gõ
  // ĐIỆN THOẠI, ĐANG CUỘN (lên hay xuống) khi khối lọc đã dính trên đầu → thu gọn hàng trường lọc, chỉ chừa thanh tìm; DỪNG CUỘN thì hiện
  // lại (chủ dự án 02/11/2026: "cuộn xuống, cuộn lên thì ẩn, dừng lại thì hiện ra"). Chỉ khi dải lọc nằm trong khối dính (.khoi-loc-dinh:
  // trang chủ → Xem thêm, Mua bán, Cho thuê, Dự án). Thanh menu dưới cùng KHÔNG đụng tới.
  // KHÔNG XÊ DỊCH MÀN HÌNH: khi khối đã dính, hàng trường lọc NỔI ngay dưới thanh tìm (đè lên nội dung, không chiếm chỗ) → ẩn / hiện chỉ đổi
  // độ mờ, danh sách bên dưới không nhảy. dinh: bật khi cuộn quá mốc 80px, tắt khi về gần đầu (hai mốc khác nhau — không chập chờn ở ranh).
  // gắn theo dõi đúng lúc khung dải lọc có trên trang (lần dựng đầu có trang chưa có khung — useRef + [] thì không bao giờ gắn lại)
  const [daiLoc, setDaiLoc] = useState<HTMLDivElement | null>(null);
  const [dinh, setDinh] = useState(false);
  const [dangCuon, setDangCuon] = useState(false);
  useEffect(() => {
    const khoi = daiLoc?.closest<HTMLElement>(".khoi-loc-dinh");
    if (!khoi) return;
    const dt = window.matchMedia("(max-width: 639px)");
    let dung = 0;
    // ĐO MỖI LẦN CUỘN (không đo một lần lúc mở — trang chủ → Xem thêm mở danh sách đúng lúc trang đang nhảy, mốc đo lúc đó sai, phải cuộn
    // rất xa hàng trường mới ẩn: lỗi chủ dự án báo 02/11/2026): khối đã chạm chỗ dính sát logo và đã cuộn quá 80px thì bật; về gần đầu
    // trang hoặc khối rời chỗ dính thì tắt (hai mốc khác nhau — không chập chờn ở ranh)
    // tính NGAY trong lúc cuộn (một lần đo vị trí, rất nhẹ) — không chờ khung vẽ: trình duyệt hoãn khung vẽ khi trang chạy nền thì kẹt trạng thái
    const tinh = () => {
      const y = window.scrollY;
      const sat = khoi.getBoundingClientRect().top <= parseFloat(getComputedStyle(khoi).top) + 1;
      setDinh((cu) => dt.matches && sat && (cu ? y > 4 : y > 80));
    };
    // CHỈ KHÁCH CUỘN THẬT (vuốt tay / lăn chuột) mới ẩn — trang tự dịch (ảnh tải xong, trình duyệt tự chỉnh vị trí cuộn) cũng phát "scroll",
    // nếu tính cả thì hàng trường tự ẩn lung tung khi khách đang đứng yên (đo 02/11/2026). Đã vuốt thì đà trôi vẫn tính là đang cuộn.
    let dangVuot = false;
    const hen = () => { clearTimeout(dung); dung = window.setTimeout(() => { dangVuot = false; setDangCuon(false); }, 350); }; // ngừng 0,35 s → hiện lại
    const vuot = () => { dangVuot = true; setDangCuon(true); hen(); };
    const cuon = () => {
      tinh();
      if (dangVuot) hen();
    };
    tinh();
    window.addEventListener("scroll", cuon, { passive: true });
    window.addEventListener("touchmove", vuot, { passive: true });
    window.addEventListener("wheel", vuot, { passive: true });
    return () => {
      window.removeEventListener("scroll", cuon); window.removeEventListener("touchmove", vuot); window.removeEventListener("wheel", vuot);
      clearTimeout(dung);
    };
  }, [daiLoc]);
  const gonKhiCuon = dinh && dangCuon;
  useEffect(() => {
    try {
      // QUAY LẠI CHỖ ĐANG GÕ (chủ dự án 02/11/2026): câu gõ ở trang này nằm theo ĐÚNG BƯỚC LỊCH SỬ của trang (history.state.cvrCau) —
      // từ trang kết quả sau bấm Quay lại thì ô tìm hiện lại đúng câu đã gõ ở đây; vào trang bằng menu là bước mới, không có câu cũ
      // TRANG KẾT QUẢ CỦA VÒNG TÌM: trang mở ra từ ô tìm / đổi trường được đánh dấu cvrKq trên bước lịch sử của nó (xem diKetQua)
      const st = (history.state ?? {}) as Record<string, unknown>;
      const sCau = sessionStorage.getItem("cvr-cau:" + window.location.pathname);
      const tuTruong = sessionStorage.getItem("cvr-kq-den") === window.location.pathname;
      const s = sCau || (typeof st.cvrCau === "string" ? st.cvrCau : "");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc một lần khi mở trang
      if (s) setCauCu(s);
      if (s || sCau || tuTruong) history.replaceState({ ...st, ...(s ? { cvrCau: s } : {}), ...(sCau || tuTruong ? { cvrKq: 1 } : {}) }, "");
      if (tuTruong) sessionStorage.removeItem("cvr-kq-den");
      setVeChoGo(!!(sCau || tuTruong || st.cvrKq) && history.length > 1);
      // ĐỌC MỘT LẦN RỒI BỎ (02/11/2026): để lại thì lần sau vào trang này bằng menu câu cũ lại hiện ra; tải lại trang đã có ?q= giữ câu
      sessionStorage.removeItem("cvr-cau:" + window.location.pathname);
    } catch { /* bỏ qua */ }
  }, []);
  // KHÁCH ĐÃ XOÁ CÂU (×, xoá tay, Làm mới) → XOÁ HẾT MỌI CHỖ GIỮ CÂU, không chỗ nào làm câu cũ hiện lại (chủ dự án 02/11/2026:
  // "bấm về trang chủ, hiện lại câu đó dù đã xoá" — "xử lý triệt để"): câu ghi tạm của trang chủ + mọi trang, và ?q= trên địa chỉ
  // (tải lại / Quay lại). Các trường lọc đang chọn (Khánh Hòa, Căn hộ…) ghi lại vào địa chỉ thay cho câu, tải lại vẫn đúng kết quả.
  // KHÁCH SỬA TRƯỜNG LỌC → câu cũ hết vai, ô tìm không hiện lại câu đó (02/11/2026 — cùng gốc với ListingBrowser doiBoLoc). Đọc câu vào
  // trường (apDungCau) cũng đổi trường: bỏ qua đúng lần đó.
  const khoaTruong = JSON.stringify({ ...f, keyword: "" });
  const truongCu = useRef(khoaTruong);
  const tuCau = useRef(false);
  useEffect(() => {
    if (khoaTruong === truongCu.current) return;
    truongCu.current = khoaTruong;
    if (tuCau.current) { tuCau.current = false; return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- trường vừa đổi do khách chọn
    if (!f.keyword.trim()) setCauCu("");
  }, [khoaTruong, f.keyword]);
  const coCau = (f.keyword || cauCu).trim().length > 0;
  const daCoCau = useRef(false);
  useEffect(() => {
    if (coCau) { daCoCau.current = true; return; }
    if (!daCoCau.current) return;
    try {
      sessionStorage.removeItem("cvr-tim-cuoi");
      Object.keys(sessionStorage).filter((k) => k.startsWith("cvr-cau:")).forEach((k) => sessionStorage.removeItem(k));
    } catch { /* bỏ qua */ }
    const u = new URL(window.location.href);
    if (u.searchParams.has("q")) {
      u.searchParams.delete("q");
      filtersToParams({ ...f, keyword: "" }).forEach((v, k) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
      window.history.replaceState(window.history.state, "", u);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi ô vừa bị xoá trống
  }, [coCau]);

  const typed = f.keyword.trim().length > 0;
  // Panel: đang gõ → cụm khớp chữ gõ; CHẠM VÀO Ô CHƯA GÕ → lịch sử tìm + gợi ý phổ biến của đúng mục
  // (chủ dự án 17/10/2026: "Airbnb chỉ cần bấm vào là nó hiện thông minh về gợi ý").
  const recentShown = recent.slice(0, 5); // hiện 5 mục gần nhất (trước chỉ 3)

  // ── LOẠI DẦN GỢI Ý LẠC ĐỀ ────────────────────────────────────────────────
  // Câu đã nêu RÕ mục đích (mua bán / cho thuê / dự án) hoặc loại hình → bỏ các
  // gợi ý thuộc mục đích & loại hình KHÁC cho chính xác. Từ khoá CHUNG CHUNG
  // (không nêu gì) → giữ nguyên, cứ hiển thị đủ để người dùng tự chọn.
  // Gõ sai chính tả / dính chữ ("Căn họi … tạiphan thiết") → hiểu theo câu đã sửa, như Google
  // GÕ MƯỢT (chủ dự án 20/10/2026): chữ trong ô hiện ngay; sửa chính tả + dò gợi ý (nặng: cả bộ địa danh) chạy trên bản HOÃN
  // của từ khoá — React làm lúc rảnh, không chặn phím gõ. Gợi ý theo kịp ngay khi khách ngừng tay.
  const kwHoan = useDeferredValue(f.keyword);
  // Tên dự án THẬT — nạp một lần khi khách bắt đầu gõ (lib/duAnTen), dùng chung với ô tìm trang chủ
  const [dsDuAn, setDsDuAn] = useState<DuAnTen[]>(() => dsDuAnDaNap() ?? []);
  useEffect(() => { if (kwHoan.trim() && !dsDuAn.length) void napDsDuAn().then(setDsDuAn); }, [kwHoan, dsDuAn.length]);
  const kwHieu = useMemo(() => (kwHoan.trim() ? suaChinhTa(kwHoan) ?? kwHoan : kwHoan), [kwHoan, coDiaDanh]); // eslint-disable-line react-hooks/exhaustive-deps
  const yDinh = parseQuery(kwHieu);
  const mucDich = yDinh.purpose ?? purpose;
  const roNghia = yDinh.purpose != null || yDinh.types.length > 0;
  const HREF_MUC_DICH: Record<string, string> = { "/mua-ban": "ban", "/cho-thue": "thue", "/du-an": "duan" };
  const dungY = (s: Suggestion) => {
    if (!roNghia) return true;
    if (s.kind === "Mục đích") return HREF_MUC_DICH[s.href ?? ""] === mucDich;
    if (s.kind === "Loại hình" && s.type) {
      if (!typeOptions.includes(s.type)) return false; // danh mục của mục đích khác
      if (!yDinh.types.length) return true;
      const n = normalizeVi(s.type);
      return yDinh.types.some((t) => n.includes(normalizeVi(t)));
    }
    return true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dungY suy ra từ kwHieu + typeOptions
  const typedHits = useMemo(() => (typed ? suggest(kwHieu, 12).filter(dungY).slice(0, 6) : []), [typed, kwHieu, typeOptions, purpose, coDiaDanh]);
  // LUÔN có gợi ý (kiểu Google): gõ mà không khớp gì → hiện GỢI Ý PHỔ BIẾN thay vì để trống.
  const noHits = typed && typedHits.length === 0;
  // GỢI Ý BẬC THANG — dựng từ chính câu đang gõ, xếp từ khớp đầy đủ → nới dần.
  // VD "Đất nền tại Đà Nẵng giá dưới 3 tỷ" → [Đất nền · Đà Nẵng · dưới 3 tỷ] →
  // [Đất nền · Đà Nẵng] → [Tất cả đất nền] → [BĐS tại Đà Nẵng] → [BĐS dưới 3 tỷ].
  // GỢI Ý THEO DỮ LIỆU THẬT dùng chung mọi ô tìm (máy chủ đếm tin — lib/goiYThat, chủ dự án 21/10/2026): mục đích + loại hình +
  // khu vực + đặc điểm, chỉ câu có tin, giá và nơi thực tế. Máy chủ lỗi → gợi ý theo ý câu ở máy khách (goiYTheoY) làm dự phòng.
  // trang Dự án (hintMode duan): gợi ý máy chủ của mục Dự án — đọc loại hình, tỉnh thành, mục đích trong câu (gợi ý tổng, lib/goiYTong)
  // GỢI Ý THEO MỤC ĐÍCH CỦA CÂU (chủ dự án 02/11/2026: "gõ câu mới, mục đích khác trang hiện tại thì phải chuyển qua đúng tab"): câu nói
  // rõ mục đích (bộ đọc chung docMucDich, như trang chủ) → gợi ý của mục đó, bấm vào là sang đúng tab; câu không nói → mục trang đang đứng
  const mucCau = useMemo(() => (typed ? docMucDich(kwHieu, () => dsDuAn.length > 0 && !!timDuAn(kwHieu, dsDuAn, false)) : null), [typed, kwHieu, dsDuAn]);
  const mucGoiY = mucCau ?? (hintMode === "duan" ? "duan" : purpose === "thue" ? "thue" : "ban");
  const goiYThatDs = useGoiYThat(typed ? kwHieu : "", mucGoiY, !compact);
  const bacThang: Suggestion[] = useMemo(() => (typed
    ? (goiYThatDs ?? goiYTheoY(kwHieu, mucGoiY === "thue" ? "thue" : "ban", dsDuAn)).map((g) => ({ label: g.nhan, kind: "Gợi ý" as const, href: g.href }))
    : []), [typed, kwHieu, mucGoiY, coDiaDanh, dsDuAn, goiYThatDs]); // eslint-disable-line react-hooks/exhaustive-deps
  // CHƯA GÕ → CHỈ những lần khách đã tìm, như Google (chủ dự án 17/10/2026: bỏ "gợi ý phổ biến" toàn tên tỉnh trơn — vô dụng)
  // Bỏ gợi ý khớp ký tự kiểu Google (địa danh trùng tên tỉnh khác, "Tất cả biệt thự"…) — chủ dự án 21/10/2026: chỉ gợi ý theo ý câu
  // Ô TÌM PHẢI HƠN CHỌN TRƯỜNG (chủ dự án 01/11/2026, ảnh trang Dự án gõ "Căn ho" chỉ ra một tên dự án): gõ là đọc TỈNH THÀNH · LOẠI
  // HÌNH · MỤC ĐÍCH (gợi ý máy chủ — "Dự án căn hộ chung cư tại…", dự án đúng loại, Bán / Cho thuê), rồi mới đến dự án khớp tên theo
  // các trường đang chọn (goiYRieng), không lặp
  const panelItems: Suggestion[] = typed
    ? (goiYRieng && mucGoiY === "duan" ? [...bacThang, ...goiYRieng(kwHoan).filter((s) => !bacThang.some((b) => b.href === s.href || b.label === s.label))] : bacThang)
    : recentShown; // tên dự án (chữ Anh) không qua sửa chính tả
  // Câu dài hiếm khi khớp NGUYÊN VĂN một mục nào — nhưng nếu bóc được tiêu chí
  // (loại hình · phường/quận · giá…) thì KHÔNG được báo "không có kết quả",
  // phải nói đã hiểu gì và gợi ý theo đúng tiêu chí đó.
  const hieuY = bacThang.length > 0;
  // KHÔNG bao giờ báo "không có kết quả" ngay lúc gõ: lúc này mới chỉ chưa khớp
  // DANH MỤC, chưa hề dò vào tin. Dòng đầu panel vẫn tìm được bằng chính chữ đó.
  const dongDanDat = hieuY
    ? "Gợi ý theo tiêu chí trong câu bạn gõ:"
    : `Tìm “${f.keyword.trim()}” trong toàn bộ tin đăng, hoặc chọn gợi ý:`;

  const applySuggestion = (s: Suggestion) => {
    pushRecent(s);
    setSugOpen(false);
    setOverlay(false);
    setActiveIdx(-1);
    // GỢI Ý CÂU CHO CHÍNH TRANG ĐANG ĐỨNG (/mua-ban?q=…, /du-an?q=…): đổi địa chỉ thôi thì trang không đọc lại (chỉ đọc địa chỉ lúc
    // mở) — danh sách đứng yên, bấm "không có tác dụng gì" (01/11/2026). Đọc câu đổ thẳng vào các trường lọc tại chỗ.
    if (s.href) {
      const u = new URL(s.href, window.location.origin);
      const cau = u.searchParams.get("q");
      if (cau && u.pathname === window.location.pathname.replace(/\/trang\/\d+$/, "").replace(/\/$/, "")) { apDungCau(cau); return; }
    }
    // Sản phẩm / Dự án / Tin tức → mở thẳng trang chi tiết (đã là "kết quả").
    if (s.href) {
      if (/^\/(mua-ban|cho-thue)(\/|\?|$)|^\/du-an(\?|$)/.test(s.href)) return diKetQua(s.href, s.label);
      boQuaLui();
      router.push(s.href);
      return;
    }
    // Dựng bộ lọc MỚI từ gợi ý rồi RA KẾT QUẢ NGAY (kiểu Google) — truyền thẳng bộ lọc
    // vừa dựng cho onSearch, tránh dùng state cũ.
    let next: Filters = f;
    if (s.patch) {
      // Gợi ý bậc thang: đổ THẲNG nhiều trường lọc cùng lúc.
      // · Bậc dựng từ TIÊU CHÍ (loại hình/khu vực/giá) → xoá ô từ khoá (tiêu chí đã ở bộ lọc).
      // · Bậc dựng từ CHÍNH CHỮ người gõ → giữ nguyên từ khoá.
      next = { ...f, ...(s.patch.keyword != null ? s.patch : { ...s.patch, keyword: "" }) };
    } else if (s.kind === "Khu vực" && s.province) {
      // Thêm khu vực vào danh sách ĐA CHỌN (không ghi đè, không trùng, tối đa 5).
      const sel: LocationSel = { province: s.province, district: s.district || undefined, ward: s.ward || undefined };
      const dup = f.locations.some((l) => sameLocation(l, sel));
      const locations = dup || f.locations.length >= MAX_LOCATIONS ? f.locations : [...f.locations, sel];
      next = { ...f, locations, keyword: "" };
    } else if (s.kind === "Loại hình" && s.type) {
      next = { ...f, types: f.types.includes(s.type) ? f.types : [...f.types, s.type], keyword: "" };
    } else if (s.keyword) {
      next = { ...f, keyword: s.keyword };
    }
    onChange(next);
    // Bấm một dòng gợi ý = ra kết quả NGAY (không phải bấm thêm nút Tìm):
    // trang chủ → sang trang kết quả · trang danh sách → cuộn xuống kết quả.
    chayTim(next, false); // đã pushRecent(s) ở trên, không lưu lại lần nữa
  };

  // Nút ↖ — CHÈN gợi ý vào ô tìm để sửa tiếp, KHÔNG tìm/điều hướng ngay (kiểu Google).
  const insertSuggestion = (s: Suggestion) => {
    set({ keyword: s.keyword || s.label });
    setSugOpen(true);
    setActiveIdx(-1);
    // Con trỏ đứng CUỐI câu vừa chép vào (chủ dự án 20/10/2026) — chờ ô nhận chữ mới rồi mới đặt
    requestAnimationFrame(() => {
      const o = (overlay ? overlayInputRef : inputRef).current;
      if (!o) return;
      o.focus();
      o.setSelectionRange(o.value.length, o.value.length);
      o.scrollTop = o.scrollHeight;
    });
  };

  // Điều hướng bằng phím trong panel gợi ý.
  const onKeyNav = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!sugOpen) { setSugOpen(true); return; }
      setActiveIdx((i) => Math.min(i + 1, panelItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (sugOpen && activeIdx >= 0 && panelItems[activeIdx]) {
        e.preventDefault();
        applySuggestion(panelItems[activeIdx]);
      } else {
        // Enter (PC & điện thoại): LUÔN chạy tìm — kể cả khi chưa có gợi ý nào khớp.
        chayTim();
      }
    } else if (e.key === "Escape") {
      setSugOpen(false);
      setActiveIdx(-1);
    }
  };


  const areaLabel = areaRangeText(f.areaMin, f.areaMax);
  const priceLabel = priceRangeText(f.priceMin, f.priceMax);
  const locLabel = nhanNoi(f.locations);
  const loaiGom = loaiTheoCha(f.types, typeGroups);
  const typeLabel = nhanLoai(f.types, typeGroups); // mục cha + số mục con (02/11/2026)
  // Lọc thêm ĐẶC THÙ theo ý định: mua bán = Hướng + Pháp lý · cho thuê = Nội thất.
  // + 2 công tắc Tin xác thực / Môi giới chuyên nghiệp (đã gộp vào drawer "Lọc thêm").
  const moreCount =
    (f.project ? 1 : 0) +
    (f.beds ? 1 : 0) +
    (purpose === "ban" ? (f.direction ? 1 : 0) + (f.legal ? 1 : 0) : (f.furnishing ? 1 : 0)) +
    (f.verified ? 1 : 0) + (f.broker ? 1 : 0);

  // LỐI RA của mỗi bảng chọn (chủ dự án 01/11/2026): một nút "Xem N tin" ghi đúng số kết quả theo lựa chọn — bấm là đóng bảng, tới kết quả
  const chuXem = nhanXem ?? (soKetQua != null ? `Xem ${soKetQua} tin` : "Tìm kiếm");
  // CƠ CHẾ CHỌN TRƯỜNG (chủ dự án, đã chốt): trường CHỌN MỘT (giá, diện tích, chủ đầu tư, dự án, tình trạng) bấm chọn là TỰ TÌM;
  // trường CHỌN NHIỀU (khu vực, loại hình, lọc thêm) tick xong bấm ÁP DỤNG là TỰ TÌM — hiện ra kết quả.
  const xongTruong = (close: () => void) => { close(); chayTim(); };
  const loiRa = (close: () => void, datLai: () => void) => <NutXem nhan={chuXem} onClick={() => xongTruong(close)} onReset={datLai} />;
  // Điện thoại: mỗi ô rộng vừa nội dung (hàng cuộn ngang). Máy tính: các ô CHIA ĐỀU hàng, chọn xong không đổi cỡ (01/11/2026).
  const ddClass = "shrink-0 sm:min-w-0 sm:flex-1";

  // ===== "Loại nhà đất" — dòng 2 (bố cục Batdongsan) =====
  const typeDropdown = (
    <FilterDropdown label="Loại BĐS" summary={typeLabel} active={f.types.length > 0} panelClassName="w-72" compact={compact} className={ddClass}>
      {({ close }) => {
        // LOGIC CHỌN LOẠI HÌNH (chủ dự án 20/10/2026): chưa chọn loại nào = TẤT CẢ (không lọc). Bấm "Tất cả" = bỏ lọc;
        // đang "Tất cả" mà bấm một loại = chỉ loại đó; chọn đủ mọi loại = quay về "Tất cả" (không hiện "13 loại hình").
        const doiLoai = (t: string, checked: boolean) => {
          const next = checked ? f.types.filter((x) => x !== t) : [...f.types, t];
          set({ types: typeOptions.every((x) => next.includes(x)) ? [] : next });
        };
        return (
          <div>
            <DaChon muc={loaiGom.map((g) => ({ nhan: g.nhan, bo: () => set({ types: f.types.filter((y) => !g.cac.includes(y)) }) }))} macDinh="Tất cả loại nhà đất" />
            {/* "Tất cả" KHÔNG lặp hai lần (chủ dự án 01/11/2026): chưa chọn gì thì dòng đã chọn trên cùng ghi "Tất cả …"; bỏ chọn bằng × hoặc Đặt lại */}

            <div className="mt-1 space-y-1.5 pr-1">
              {/* NHÓM CÓ MỤC ĐÃ CHỌN LÊN ĐẦU, trong nhóm mục đã chọn lên trước — chốt lúc mở bảng (02/11/2026) */}
              <DaChonLenDau ds={typeGroups.map((g0) => ({ ...g0, items: g0.items.filter((t) => !demLoai || demLoai(t) > 0 || f.types.includes(t)) })).filter((g) => g.items.length > 0)}
                khoa={(g) => g.label} daChon={(g) => g.items.some((t) => f.types.includes(t))}>
              {(dsNhom) => dsNhom.map((g) => (
                <div key={g.label}>
                  {/* Bấm NHÓM = chọn cả nhóm (xong); muốn chi tiết thì bấm loại con (chủ dự án 01/11/2026) */}
                  {(() => {
                    const ca = g.items.every((t) => f.types.includes(t));
                    const doiNhom = () => {
                      const next = ca ? f.types.filter((x) => !g.items.includes(x)) : [...new Set([...f.types, ...g.items])];
                      set({ types: typeOptions.every((x) => next.includes(x)) ? [] : next });
                    };
                    return (
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 pb-0.5 pt-1.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">
                        <input type="checkbox" checked={ca} onChange={doiNhom} className="h-4 w-4 shrink-0 accent-cvr-blue" />
                        <span className="truncate">{g.label}</span>
                      </label>
                    );
                  })()}
                  <DaChonLenDau ds={g.items} khoa={(t) => t} daChon={(t) => f.types.includes(t)}>
                  {(dsLoai) => dsLoai.map((t) => {
                    const checked = f.types.includes(t);
                    return (
                      <label
                        key={t}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pl-8 pr-2 text-sm text-cvr-ink/80 transition hover:bg-black/5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => doiLoai(t, checked)}
                          className="h-4 w-4 shrink-0 accent-cvr-blue"
                        />
                        <span className="flex-1 truncate">{tenLoaiHinh(t)}</span>
                        {demLoai && <span className="shrink-0 text-xs text-cvr-faint">{demLoai(t)}</span>}
                      </label>
                    );
                  })}
                  </DaChonLenDau>
                </div>
              ))}
              </DaChonLenDau>
            </div>

            {/* CHỌN LÀ LỌC NGAY — không nút Đặt lại · Áp dụng (chủ dự án 01/11/2026: mỗi mức nhu cầu có lựa chọn, không ép khách bấm thêm) */}
            {loiRa(close, () => set({ types: [] }))}
          </div>
        );
      }}
    </FilterDropdown>
  );

  // ===== Các dropdown chi tiết — dòng 2 (thứ tự hiển thị xếp ở phần return) =====
  // Khu vực — ĐA CHỌN (tối đa 5) theo tầng Tỉnh→Quận→Phường (kiểu Batdongsan)
  const locationDropdown = (
      <FilterDropdown label="Toàn quốc" tieuDe="Khu vực" giuCo summary={locLabel} active={f.locations.length > 0} panelClassName="w-96" compact={compact} className={ddClass}>
        {({ close }) => (<>
          <LocationPanel
            locations={f.locations}
            onChange={(locations) => set({ locations })}
            demTheoNoi={demTheoNoi}
            // "Xong" = kết thúc chọn VÀ ra kết quả ngay (đóng bảng rồi chạy tìm),
            // không phải chỉ đóng bảng để khách ngồi đoán đã tìm hay chưa.
            onClose={() => xongTruong(close)}
          />
          {loiRa(close, () => set({ locations: [] }))}
          </>
        )}
      </FilterDropdown>
  );


  // Khoảng giá (tên nhãn kiểu Batdongsan)
  const priceDropdown = (
      <FilterDropdown label="Khoảng giá" summary={priceLabel} active={f.priceMin != null || f.priceMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
        {({ close }) => (<>
          <DaChon muc={priceLabel ? [{ nhan: priceLabel, bo: () => set({ priceMin: null, priceMax: null }) }] : []} onBoHet={() => set({ priceMin: null, priceMax: null })} />
          <RangePanel
            key={`${f.priceMin}-${f.priceMax}`}
            unit="tỷ"
            step={0.5}
            sliderMax={50}
            min={f.priceMin}
            max={f.priceMax}
            presets={priceRangesFor(purpose)}
            onPick={(min, max) => set({ priceMin: min, priceMax: max })}
            onReset={() => set({ priceMin: null, priceMax: null })}
            onApply={() => xongTruong(close)}
          />
          {/* trường CHỌN MỘT: không nút Áp dụng — bấm mốc / phím Tìm / thả thanh trượt là tìm (chủ dự án 01/11/2026) */}
        </>)}
      </FilterDropdown>
  );

  // Diện tích
  const areaDropdown = (
      <FilterDropdown label="Diện tích" summary={areaLabel} active={f.areaMin != null || f.areaMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
        {({ close }) => (<>
          <DaChon muc={areaLabel ? [{ nhan: areaLabel, bo: () => set({ areaMin: null, areaMax: null }) }] : []} onBoHet={() => set({ areaMin: null, areaMax: null })} />
          <RangePanel
            key={`${f.areaMin}-${f.areaMax}`}
            unit="m²"
            step={10}
            sliderMax={purpose === "thue" ? 5000 : 500}
            min={f.areaMin}
            max={f.areaMax}
            presets={areaRangesFor(purpose, f.types)}
            onPick={(min, max) => set({ areaMin: min, areaMax: max })}
            onReset={() => set({ areaMin: null, areaMax: null })}
            onApply={() => xongTruong(close)}
          />
          {/* trường CHỌN MỘT: không nút Áp dụng (như Khoảng giá) */}
        </>)}
      </FilterDropdown>
  );

  // "Lọc" — phòng ngủ + hướng + pháp lý/nội thất (đứng ĐẦU dòng 2, kiểu Batdongsan)
  const moreDropdown = (
      <FilterDropdown
        label="Lọc thêm"
        summary={moreCount ? `Lọc thêm (${moreCount})` : ""}
        active={moreCount > 0}
        panelClassName="w-80"
        className={ddClass}
        compact={compact}
      >
        {({ close }) => (
          <div className="space-y-4">
            {/* Lọc thêm CHỈ thứ mục Mua bán / Cho thuê cần (chủ dự án 01/11/2026: Dự án đã có mục riêng — không nhồi vào đây); dự án
                đang lọc (đến từ ô tìm) vẫn hiện ở Đã chọn để bỏ */}
            <DaChon muc={[
              ...(f.project ? [{ nhan: f.project, bo: () => set({ project: "" }) }] : []),
              ...(f.beds ? [{ nhan: f.beds === 5 ? "5+ PN" : `${f.beds} PN`, bo: () => set({ beds: 0 }) }] : []),
              ...(f.direction ? [{ nhan: f.direction, bo: () => set({ direction: "" }) }] : []),
              ...(f.legal ? [{ nhan: f.legal, bo: () => set({ legal: "" }) }] : []),
              ...(f.furnishing ? [{ nhan: f.furnishing, bo: () => set({ furnishing: "" }) }] : []),
              ...(f.verified ? [{ nhan: "Tin xác thực", bo: () => set({ verified: false }) }] : []),
              ...(f.broker ? [{ nhan: "Môi giới chuyên nghiệp", bo: () => set({ broker: false }) }] : []),
            ]} onBoHet={() => set({ project: "", beds: 0, direction: "", legal: "", furnishing: "", verified: false, broker: false })} />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Số phòng ngủ</p>
              <div className="flex flex-wrap gap-1.5">
                {bedroomOptions.map((n) => (
                  <Chip key={n} active={f.beds === n} onClick={() => set({ beds: f.beds === n ? 0 : n })}>
                    {n === 5 ? "5+ PN" : `${n} PN`}
                  </Chip>
                ))}
              </div>
            </div>
            {purpose === "ban" && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Hướng nhà</p>
                <div className="flex flex-wrap gap-1.5">
                  {directionOptions.map((d) => (
                    <Chip key={d} active={f.direction === d} onClick={() => set({ direction: f.direction === d ? "" : d })}>
                      {d}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {/* Đặc thù theo ý định: MUA BÁN → Pháp lý · CHO THUÊ → Nội thất */}
            {purpose === "ban" ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Pháp lý</p>
                <div className="flex flex-wrap gap-1.5">
                  {legalOptions.map((x) => (
                    <Chip key={x} active={f.legal === x} onClick={() => set({ legal: f.legal === x ? "" : x })}>
                      {x}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Nội thất</p>
                <div className="flex flex-wrap gap-1.5">
                  {furnishingOptions.map((x) => (
                    <Chip key={x} active={f.furnishing === x} onClick={() => set({ furnishing: f.furnishing === x ? "" : x })}>
                      {x}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {/* Công tắc chuyển từ thanh chính vào đây (theo mockup): Tin xác thực · Môi giới chuyên nghiệp */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Lọc khác</p>
              <div className="space-y-1">
                <SwitchRow label="Tin xác thực" checked={f.verified} onChange={(v) => set({ verified: v })} />
                <SwitchRow label="Môi giới chuyên nghiệp" checked={f.broker} onChange={(v) => set({ broker: v })} />
              </div>
            </div>
            {/* CHỌN LÀ LỌC NGAY — không nút Đặt lại · Áp dụng (chủ dự án 01/11/2026: mỗi mức nhu cầu có lựa chọn, không ép khách bấm thêm) */}
            {loiRa(close, () => set({ project: "", beds: 0, direction: "", legal: "", furnishing: "", verified: false, broker: false }))}
          </div>
        )}
      </FilterDropdown>
  );

  // ===== Danh sách gợi ý — DÙNG CHUNG cho dropdown (desktop) & trang tìm toàn màn hình (mobile) =====
  const suggestionRows = panelItems.map((s, i) => {
    const header = !typed
      ? i === 0 && recentShown.length > 0 ? "recent" : i === recentShown.length ? "popular" : ""
      : "";
    return (
      <div key={`${s.label}-${i}`}>
        {header === "popular" && (
          <div className="px-2.5 pb-1 pt-2 text-[12px] font-semibold text-cvr-muted">Gợi ý phổ biến</div>
        )}
        {header === "recent" && (
          <div className="flex items-center justify-between px-2.5 pb-1 pt-1 text-[12px] font-semibold text-cvr-muted">
            <span>Tìm kiếm gần đây</span>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearRecent} className="text-cvr-muted transition hover:text-cvr-ink hover:underline">Xoá tất cả</button>
          </div>
        )}
        <div className={`group flex items-center rounded-lg pr-1 transition ${i === activeIdx ? "bg-black/[0.06]" : "hover:bg-black/5"}`}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActiveIdx(i)}
            onClick={() => applySuggestion(s)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[15px]"
          >
            <span className="flex w-5 shrink-0 justify-center text-cvr-muted">
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d={!typed && i < recentShown.length ? ICON_CLOCK : ICON_SEARCH} />
              </svg>
            </span>
            <span className="min-w-0 flex-1 break-words"><HighlightLabel label={s.label} q={typed ? f.keyword : ""} /></span>
          </button>
          {/* ↖ Chèn gợi ý vào ô tìm để sửa tiếp (không tìm ngay) — kiểu Google */}
          <button
            type="button"
            aria-label="Chèn vào ô tìm kiếm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); insertSuggestion(s); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/10 hover:text-cvr-ink active:scale-95"
          >
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={ICON_INSERT} />
            </svg>
          </button>
          {/* × — XOÁ RIÊNG dòng lịch sử này (chỉ hiện với mục "Tìm kiếm gần đây") */}
          {!typed && i < recentShown.length && (
            <button
              type="button"
              aria-label={`Xoá "${s.label}" khỏi lịch sử`}
              title="Xoá khỏi lịch sử"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); removeRecent(s.label); }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/10 hover:text-cvr-ink active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  });

  // ===== CÁC TRƯỜNG LỌC — KHAI MỘT LẦN, MỖI MÁY ĐẶT ĐÚNG MỘT CHỖ (01/11/2026) =====
  // Điện thoại: trong màn gõ, ngay dưới ô gõ · Máy tính: ngay dưới ô tìm ngoài trang. Không bao giờ dựng hai nơi cùng lúc — dựng hai nơi
  // thì bấm một nút mở cả bảng của nơi kia (hai bảng chồng nhau).
  const cacTruong = hangLoc ?? <>
    {locationDropdown}
    {typeDropdown}
    {priceDropdown}
    {areaDropdown}
    {moreDropdown}
  </>;

  // ===== Ô từ khoá + nút tìm kiếm (dùng chung) =====
  const searchBox = (
    <>
    {/* Trang danh sách: ô tìm co giãn hết khung, nút "Xem bản đồ" nằm SÁT MÉP PHẢI
        → không còn mảng trống hụt bên phải như khi giới hạn bề ngang. */}
    <div ref={boxRef} className={compact ? "flex w-full gap-2.5" : "flex w-full gap-2.5"}>
      {/* NÚT VỀ CHỖ ĐANG GÕ (chủ dự án 02/11/2026: "chưa có nút điều hướng về chỗ đang gõ"): chỉ hiện ở trang kết quả của một vòng tìm
          (cvrKq) — bấm là về đúng trang khách đứng gõ tìm (luật một vòng tìm: trang kết quả thay nhau nên một bước lùi là về chỗ gõ) */}
      {!compact && veChoGo && (
        <button type="button" aria-label="Quay lại chỗ đang tìm" title="Quay lại chỗ đang tìm" onClick={() => history.back()}
          className="-ml-1 -mr-1.5 flex h-11 w-7 shrink-0 items-center justify-center rounded-full text-cvr-ink active:bg-cvr-surface sm:h-12">
          {/* cùng kiểu nút ‹ của màn tìm (mũi tên trơn), gọn, cao bằng ô tìm, căn giữa theo ô */}
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      <div className={compact ? "relative flex-1" :"relative flex h-11 min-w-0 flex-1 items-center rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.14)] ring-1 ring-black/15 transition sm:bg-cvr-surface sm:shadow-none focus-within:ring-2 focus-within:ring-cvr-blue/40 sm:h-12 sm:rounded-xl sm:ring-1"}>
        {/* Kính lúp trái — trang Mua bán / Cho thuê: HIỆN cả trên điện thoại cho khách nhận ra ngay là ô tìm (chủ dự án
            20/10/2026); ô tìm lớn ở Hero điện thoại vẫn ẩn (đã có nút tìm xanh) */}
        <svg className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-cvr-muted ${compact ? "left-4 hidden sm:block" : "left-3.5 sm:left-4"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={f.keyword || cauCu}
          onChange={(e) => { setCauCu(""); set({ keyword: e.target.value }); setSugOpen(true); setActiveIdx(-1); }}
          // Kiểu Google: MOBILE → chạm ô mở TRANG TÌM TOÀN MÀN HÌNH · DESKTOP → xổ dropdown gợi ý.
          // ĐIỆN THOẠI: ô trên trang CHỈ LÀ NÚT CHẠM (readOnly — chủ dự án 01/11/2026: "giật khi bấm vào ô search, làm mượt chuẩn Google").
          // Trước đây chạm → bàn phím bật → tắt ô → mở màn tìm → bàn phím bật lại: bàn phím bật–tắt–bật, trang co giãn hai lần. Nay chạm là
          // mở ngay màn tìm và đưa con trỏ vào ô gõ trong CÙNG cú chạm — bàn phím bật đúng một lần.
          readOnly={laDt}
          onClick={() => { if (laDt) moTimDt(); }}
          onFocus={() => { if (!laDt) setSugOpen(true); }}
          onKeyDown={onKeyNav}
          // Gợi ý CHẠY CHỮ theo đúng mục (mua bán / cho thuê / dự án)
          placeholder={sugOpen ? "" : goiYChay} // đã chạm ô → chữ chạy tắt, ô trống (02/11/2026: không để dòng mờ đứng in, xoá vẫn hiện lại)
          aria-label="Tìm theo từ khoá, khu vực, loại hình, dự án, tin"
          autoComplete="off"
          role="combobox"
          aria-expanded={sugOpen}
          className={
            compact
              // MOBILE: ô nằm trên NỀN TRẮNG → nền xám nhạt Apple cho thấy rõ khung.
              // DESKTOP: vẫn trắng + đổ bóng vì nằm đè trên ảnh Hero tối.
              // Đệm phải NỚI RA khi đã gõ để chừa chỗ nút xoá ×.
              // DESKTOP: ô nằm TRONG khối trắng của Hero → nền xám nhạt, không đổ
              // bóng (nếu để trắng + bóng sẽ thành "khối lồng khối").
              // DESKTOP: chừa chỗ cho nút "Tìm kiếm" NẰM TRONG ô (không tách rời).
              ? `h-11 w-full rounded-xl border border-transparent bg-cvr-surface pl-4 ${typed ? "pr-[5.5rem]" : "pr-14"} text-[15px] text-cvr-ink placeholder-cvr-faint ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-cvr-blue/50 focus:placeholder:text-transparent sm:h-12 sm:pl-11 ${typed ? "sm:pr-[11.5rem]" : "sm:pr-[8.5rem]"} ${nenSang ? "sm:bg-white sm:text-cvr-ink sm:placeholder-cvr-faint sm:ring-cvr-line sm:focus:ring-cvr-blue/50" : "sm:bg-white/[0.08] sm:text-white sm:placeholder-white/70 sm:ring-white/30 sm:focus:ring-white/60"}`
              : "h-full w-full min-w-0 flex-1 border-none bg-transparent pl-10 pr-4 text-[15px] text-cvr-ink placeholder-cvr-faint outline-none focus:placeholder:text-transparent sm:pl-11 sm:pr-3"
          }
        />
        {/* Nút XOÁ (×) trong ô — kiểu Google, hiện khi đã gõ (chỉ ô tìm lớn/Hero) */}
        {compact && (f.keyword || cauCu).trim().length > 0 && (
          <button
            type="button"
            aria-label="Xoá từ khoá"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setCauCu(""); set({ keyword: "" }); setSugOpen(true); inputRef.current?.focus(); }}
            className="absolute right-[3.25rem] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/5 hover:text-cvr-ink active:scale-95 sm:right-3"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* MOBILE (Hero): nút SEARCH XANH nằm NGAY TRONG ô tìm — cao BẰNG khung, 1 dòng duy nhất */}
        {/* Nút tìm DESKTOP — nằm NGAY TRONG ô tìm, sát mép phải (không tách khối) */}
        {compact && onSearch && (
          <button
            type="button"
            onClick={() => chayTim()}
            className="absolute bottom-1.5 right-1.5 top-1.5 hidden items-center justify-center gap-2 rounded-lg bg-cvr-blue px-6 text-[14px] font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95 sm:flex"
          >
            {dangTim && <Spinner />}
            {dangTim ? "Đang tìm…" : "Tìm kiếm"}
          </button>
        )}
        {compact && onSearch && (
          <button
            type="button"
            aria-label="Tìm kiếm"
            onClick={() => chayTim()}
            className="absolute right-1 top-1 bottom-1 flex w-11 items-center justify-center rounded-lg bg-cvr-blue text-white transition active:scale-95 sm:hidden"
          >
            {dangTim ? <Spinner size={20} /> : (
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            )}
          </button>
        )}
        {/* Nút XOÁ nhanh (×) cho ô tìm TRANG DANH SÁCH — hiện khi đã gõ, đồng bộ với Hero. */}
        {!compact && (f.keyword || cauCu).trim().length > 0 && (
          <button
            type="button"
            aria-label="Xoá từ khoá"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setCauCu(""); set({ keyword: "" }); setSugOpen(true); inputRef.current?.focus(); }}
            className="mr-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/5 hover:text-cvr-ink active:scale-95 sm:flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
        {/* Nút Tìm kiếm NẰM TRONG thanh tìm (kiểu Batdongsan) — trang danh sách.
            MOBILE: BIỂU TƯỢNG Search cao BẰNG khung · DESKTOP: giữ NGUYÊN nút chữ. */}
        {!compact && (
          <>
            {/* (Bỏ nút kính lúp xanh trên điện thoại 18/10/2026 — chủ dự án: bàn phím đã có phím Tìm khi chạm ô) */}
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={() => chayTim()}
              // máy tính: m-1.5 + h-9 = vừa khít ô tìm h-12 (48px) như Batdongsan
              className="m-1.5 hidden h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-cvr-blue px-5 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95 sm:flex"
            >
              {dangTim && <Spinner />}
              {dangTim ? "Đang tìm…" : "Tìm kiếm"}
            </button>
          </>
        )}
        {sugOpen && panelItems.length > 0 && (
          <div className="anim-xo-xuong absolute left-0 right-0 top-full z-[120] mt-1.5 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/15 ring-1 ring-black/5">
            {/* Nút THOÁT tìm kiếm — chạm là tắt panel gợi ý + đóng bàn phím. Hiện cả PC & Mobile. */}
            <div className="pointer-events-none sticky top-0 z-10 flex h-7 justify-end">
              <button
                type="button"
                aria-label="Thoát tìm kiếm"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSugOpen(false);
                  setActiveIdx(-1);
                  (document.activeElement as HTMLElement | null)?.blur?.();
                }}
                className="pointer-events-auto -mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-cvr-muted hover:bg-cvr-surface active:bg-cvr-surface"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {suggestionRows}
          </div>
        )}
      </div>
      {/* (Hero) Nút tìm đã nằm TRONG ô tìm ở trên — không còn nút rời bên ngoài. */}
      {/* MÁY TÍNH: "Xem bản đồ" đứng SÁT ô tìm, cùng chiều cao — bố trí như Batdongsan (chủ dự án 18/10/2026).
          Điện thoại vẫn dùng nút cạnh tiêu đề (ListingBrowser) — mỗi màn hình chỉ MỘT lối vào bản đồ. */}
      {!compact && onMap && (
        <button
          type="button"
          onClick={onMap}
          aria-pressed={mapActive}
          className={`hidden h-12 shrink-0 items-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white transition sm:inline-flex ${mapActive ? "bg-cvr-blue-ink" : "bg-cvr-blue hover:bg-cvr-blue-ink"}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5l6 2.4 5-2.4v14.4l-5 2.4-6-2.4-5 2.4V4.9l5-2.4v16.8" />
          </svg>
          {mapActive ? "Xem danh sách" : "Xem bản đồ"}
        </button>
      )}
    </div>

    {/* BẤM TÌM → VẠCH CHẠY MÉP TRÊN MÀN HÌNH: dùng vạch chung VachTim (sự kiện "cvr-tim" trong chayTim), chạy tới khi kết quả hiện (21/10/2026) */}
    {/* ===== MOBILE: TRANG TÌM TOÀN MÀN HÌNH kiểu Google — chạm ô tìm là mở ===== */}
    {/* DỰNG SẴN MÀN TÌM (ẩn) trên điện thoại sau khi trang rảnh — chạm ô tìm chỉ việc hiện ra, con trỏ vào ô gõ ngay (moTimDt, 01/11/2026) */}
    {(overlay || sanSangDt) && (
      <div data-man-tim className={`${overlay ? "flex" : "hidden"} fixed inset-0 z-[80] flex-col bg-white sm:hidden`}>{/* hiện NGAY như Google, không trượt (chủ dự án 20/10/2026: giật) */}
        {/* MẪU MÀN TÌM TRANG DỰ ÁN (chủ dự án 18/10/2026: "lấy mẫu thanh search Dự án, làm giống nhau cho cả 3"): một hàng
            ← · ô gõ có × · nút tìm tròn xanh; ngay dưới là hàng trường lọc. z-[80]: dưới bảng chọn của trường lọc (z-100). */}
        <div className="flex items-center gap-1 border-b border-cvr-line px-2 py-1.5">
          {/* Nút ← và ô gõ gọn lại, vừa sát (chủ dự án 20/10/2026) */}
          <button
            type="button"
            aria-label="Đóng tìm kiếm"
            onClick={() => { setOverlay(false); setActiveIdx(-1); }}
            className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-cvr-ink active:bg-cvr-surface"
          >
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="relative flex-1">
            {/* Gõ dài thì ô TỰ GIÃN thêm dòng (tối đa 4 dòng) để khách thấy hết mình đang viết gì. */}
            <textarea
              ref={(el) => {
                overlayInputRef.current = el;
                // CHỈ ĐO KHI CHỮ ĐỔI — đo ở mọi lần vẽ bắt cả trang tính lại bố cục, gõ bị khựng (đo 20/10/2026)
                gianO(el); // như ô gõ trang chủ: ô trống cao tự nhiên một dòng, chỉ đo khi có chữ
              }}
              autoFocus={overlay} // dựng sẵn (ẩn) thì không tự giành con trỏ
              rows={1}
              value={f.keyword || cauCu}
              onChange={(e) => {
                setCauCu("");
                set({ keyword: e.target.value.replace(/\n/g, " ") });
                setActiveIdx(-1);
                gianO(e.currentTarget);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); chayTim(); return; } onKeyNav(e); }} // phím Tìm: chạy tìm thật (có vạch chạy báo đang tìm)
              placeholder="" // màn tìm đã mở: chữ gợi ý KHÔNG chạy (18/10/2026), ô TRỐNG — không chữ mờ in sẵn (02/11/2026: "xoá vẫn cứ hiện lại")
              aria-label="Tìm kiếm"
              autoComplete="off"
              enterKeyHint="search"
              onFocus={(e) => { const o = e.currentTarget; o.setSelectionRange(o.value.length, o.value.length); }} // con trỏ cuối từ khoá
              className="no-scrollbar block max-h-[112px] min-h-[36px] w-full resize-none overflow-y-auto rounded-[18px] border border-transparent bg-cvr-surface py-[5px] pl-4 pr-10 text-[16px] leading-6 text-cvr-ink placeholder-cvr-faint outline-none ring-2 ring-cvr-blue/40 focus:placeholder:text-transparent"
            />
            {(f.keyword || cauCu).trim().length > 0 && (
              <button
                type="button"
                aria-label="Xoá từ khoá"
                onClick={() => { setCauCu(""); set({ keyword: "" }); overlayInputRef.current?.focus(); }}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint active:bg-black/5"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          {/* (Bỏ nút kính lúp tròn 18/10/2026 — chủ dự án; tìm bằng phím Tìm của bàn phím) */}
        </div>
        {/* ĐIỆN THOẠI: HÀNG TRƯỜNG LỌC CHỈ NẰM TRONG MÀN GÕ, ngay dưới ô gõ (chủ dự án 01/11/2026: "menu dưới ô search ngoài trang không có
            tác dụng gì thì hiển thị ở đó làm gì"): ngoài trang chỉ còn ô tìm; chạm ô tìm → màn gõ có ← · ô gõ · hàng trường lọc · gợi ý. */}
        {/* như web thật: hàng trường ở cả màn search lẫn ngoài trang — mỗi lúc dựng một hàng (màn search mở / đóng), không hai bảng chồng nhau */}
        {!compact && laDt && overlay && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-cvr-line px-3 py-2">
            {/* Nút "Làm mới" cả trong MÀN TÌM — giống hàng trường lọc ngoài trang (chủ dự án 20/10/2026). Chỉ xét các TRƯỜNG LỌC, không xét
                chữ đang gõ: gõ chữ đầu tiên làm nút bật ra ở đầu hàng, đẩy cả hàng sang phải — giật (đo 01/11/2026); xoá chữ có nút × của ô gõ */}
            {hasActiveFilters({ ...f, keyword: "" }) && (
              <button type="button" aria-label="Làm mới" title="Làm mới" onClick={() => { setCauCu(""); onChange(emptyFilters()); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-blue-ink transition active:scale-90 active:bg-cvr-surface">{/* Làm mới = BIỂU TƯỢNG đậm ở đầu hàng lọc (chủ dự án 20/10/2026) */}<svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018 17.4M18.4 9A7 7 0 006 6.6" /></svg></button>
            )}
            {cacTruong}
          </div>
        )}
        {/* CHỌN MỤC ĐÍCH (Dự án · Mua bán · Cho thuê) — đặt TRONG trang tìm của
            điện thoại, ngay dưới ô nhập. Ngoài Hero mobile chỉ để đúng ô tìm cho
            gọn; vào đây mới có đủ chỗ chọn, và chọn xong bấm Tìm là ra ĐÚNG mục. */}
        {/* Kéo danh sách gợi ý → hạ bàn phím (kiểu Google) */}
        <div onTouchMove={() => overlayInputRef.current?.blur()} className="flex-1 overflow-y-auto p-1.5">
          {noHits && !goiYRieng && (
            <p className="px-2.5 pb-1.5 pt-2 text-[13px] text-cvr-muted">
              {dongDanDat}
            </p>
          )}
          {suggestionRows}
        </div>
      </div>
    )}
    </>
  );

  // Compact (Hero): kiểu "bay" trên ảnh — tab canh giữa + 1 thanh tìm kiếm LỚN,
  // KHÔNG hộp nền, KHÔNG dàn dropdown (lọc chi tiết nằm ở trang kết quả).
  // Autocomplete thông minh (khu vực · loại hình · dự án · tin) vẫn nằm trong ô tìm (suggest.ts).
  if (compact) {
    return (
      <div className="flex flex-col gap-2 sm:gap-2">
        {/* Dòng 1: tab (menu) — canh giữa, gạch chân tab đang chọn.
            MOBILE: ẩn — Hero chỉ còn ĐÚNG 1 dòng ô tìm kiếm cho gọn. */}
        {/* Hàng tab MỤC ĐÍCH — CHỈ trên máy tính. Điện thoại chật, ngoài Hero chỉ
            để đúng ô tìm; phần chọn mục đích chuyển vào TRANG TÌM TOÀN MÀN HÌNH
            (xem khối overlay bên dưới) nơi có đủ chỗ. */}
        {leading && <div className="hidden justify-center sm:flex">{leading}</div>}
        {/* Dòng 2: thanh tìm kiếm lớn */}
        {searchBox}
      </div>
    );
  }

  // Mặc định (trang danh sách/tìm kiếm): bố cục Batdongsan, da Apple —
  // DÒNG 1: Loại nhà đất (dẫn đầu) + ô tìm kiếm + Bản đồ ·
  // DÒNG 2: Khu vực · Dự án · Mức giá · Diện tích · Lọc thêm · Đặt lại (phải).
  return (
    <FilterDropdownGroup>
      {/* MOBILE: KHÔNG khung (viền/bóng), KHÔNG padding ngang → thanh tìm rộng hết bề ngang trang.
          DESKTOP: giữ thẻ như cũ. */}
      {/* SÁT HEADER: khung lọc không chừa lề trên (mt-0), chỉ có đệm trong 8px */}
      {/* MÁY TÍNH bố trí như Batdongsan (chủ dự án 18/10/2026): KHÔNG khung bao — hàng 1 ô tìm cao 48px + "Xem bản đồ",
          hàng 2 các trường lọc, dưới cùng một đường kẻ. Hai hàng ở mọi bề rộng → không bao giờ tràn mép phải. */}
      {/* NỀN BỘ LỌC trên điện thoại (chủ dự án 01/11/2026: "cần cái nền, kiểu đơn giản để nhìn là biết ngay bộ lọc, cả 4 phần"): dải nền xám nhạt tràn hết bề ngang bao ô tìm + hàng trường lọc; ô tìm, nút trường lọc trắng nổi trên nền — kiểu Google. Máy tính giữ nguyên. */}
      <div ref={setDaiLoc} className="relative -mx-4 rounded-none bg-cvr-surface px-4 pb-0.5 pt-1 sm:mx-0 sm:mt-0 sm:border-b sm:border-cvr-line sm:bg-white sm:px-0 sm:pb-4 sm:pt-3">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="min-w-0">{searchBox}</div>
          {/* Hàng chip lọc — CUỘN NGANG trên mobile (kiểu Batdongsan), tự xuống hàng trên desktop.
              -mx-2.5/px-2.5 để dải chip tràn sát mép thẻ, cuộn mượt hết bề rộng. */}
          {/* ĐIỆN THOẠI: ngoài trang KHÔNG có hàng trường lọc — nằm trong màn gõ (chủ dự án 01/11/2026). Máy tính giữ nguyên hàng này.
              Điện thoại không dựng hàng này — các trường đã nằm trong màn gõ (cacTruong) */}
          {/* ĐANG CUỘN (khối lọc đã dính trên đầu, điện thoại): hàng trường lọc THU GỌN, chỉ chừa thanh tìm (chủ dự án 02/11/2026: "khi cuộn
              xuống hoặc lên thì ẩn cái menu dưới thanh lọc, chỉ chừa lại mỗi thanh search"); cuộn về đầu trang thì hiện lại */}
          {(!laDt || !overlay) && <div className={`no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5 transition-opacity duration-200 sm:static sm:flex-wrap sm:overflow-visible sm:bg-transparent sm:px-0 sm:pb-0 sm:opacity-100 sm:shadow-none ${dinh ? "absolute inset-x-0 top-full bg-cvr-surface px-4 pb-2 shadow-[0_1px_0_rgba(0,0,0,0.08)]" : ""} ${gonKhiCuon ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            {/* ĐÃ BỎ chip "Bản đồ" ở hàng ngay dưới thanh tìm kiếm — bị trùng với
                nút "Xem bản đồ" nằm cạnh ô tìm phía trên. */}
            {/* Thứ tự chuẩn (mockup Mục I phần 2): Khu vực · Dự án · Loại BĐS · Mức giá · Diện tích · Lọc thêm.
                2 công tắc Tin xác thực / Môi giới chuyên nghiệp đã chuyển vào "Lọc thêm". */}
            {/* Nút "Làm mới" (xoá hết lọc) Ở ĐẦU HÀNG TRƯỜNG LỌC trên điện thoại — ngay cạnh các trường vừa chọn (chủ dự án 18/10/2026) */}
            {hasActiveFilters(f) && (
              <button type="button" aria-label="Làm mới" title="Làm mới" onClick={() => { setCauCu(""); onChange(emptyFilters()); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-blue-ink transition active:scale-90 active:bg-cvr-surface sm:hidden">{/* Làm mới = BIỂU TƯỢNG đậm ở đầu hàng lọc (chủ dự án 20/10/2026) */}<svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018 17.4M18.4 9A7 7 0 006 6.6" /></svg></button>
            )}
            {cacTruong}
            {/* Bỏ nút "Đặt lại" (chủ dự án 17/10/2026): trùng việc với nút "Xoá lọc" cạnh tiêu đề kết quả */}
          </div>}
        </div>
      </div>
    </FilterDropdownGroup>
  );
}


/** Nhãn trường khu vực đã chọn — cùng cách ghi với dòng đã chọn trong bảng ("Đà Nẵng › Hải Châu, Hòa Cường"; nhiều nhánh thì +N).
 *  MỘT hàm dùng chung cho Mua bán · Cho thuê · Dự án · trang chủ (01/11/2026). */
// MỘT DÒNG = MỤC CHA + SỐ MỤC CON (chủ dự án 02/11/2026: chọn nhiều nơi thì nút ra một chuỗi rất dài): "Cà Mau" (cả tỉnh) ·
// "Cà Mau (3)" (3 phường / quận) · nhiều tỉnh "Cà Mau (3) +1". Cùng cách ghi với dòng đã chọn trong bảng (tinhDaChon).
export function tinhDaChon(locations: LocationSel[]): { tinh: string; so: number; nhan: string }[] {
  const m = new Map<string, number>();
  for (const l of locations) m.set(l.province, (m.get(l.province) ?? 0) + (l.district || l.ward ? 1 : 0));
  return [...m.entries()].map(([tinh, so]) => ({ tinh, so, nhan: so ? `${tinh} (${so})` : tinh }));
}
export function nhanNoi(locations: LocationSel[]): string {
  const ds = tinhDaChon(locations);
  if (!ds.length) return "";
  return ds.length > 1 ? `${ds[0].nhan} +${ds.length - 1}` : ds[0].nhan;
}

// ===== Bộ phận con =====

// Bộ chọn khu vực ĐA TẦNG + ĐA CHỌN (kiểu Batdongsan): duyệt Tỉnh→Quận→Phường,
// thêm cả tỉnh/quận hoặc chọn tới phường; mỗi khu vực là 1 chip (tối đa MAX_LOCATIONS).
export function LocationPanel({
  locations, onChange, demTheoNoi,
}: {
  locations: LocationSel[];
  /** Trang có dữ liệu ít (Dự án): đếm số kết quả của một nơi → CHỈ hiện nơi CÓ kết quả, kèm số (chủ dự án 01/11/2026: không cho
   *  khách chọn nơi trống rồi cụt đường). Không truyền → hiện đủ danh mục như cũ (Mua bán / Cho thuê). */
  demTheoNoi?: (l: LocationSel) => number;
  onChange: (locations: LocationSel[]) => void;
  // Đóng panel từ bên trong (nút "Xong") — trước đây chỉ đóng được bằng cách
  // bấm ra ngoài, người dùng không biết đã chọn xong hay chưa.
  onClose?: () => void;
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const [q, setQ] = useState("");
  const [prov, setProv] = useState(""); // đường dẫn đang duyệt (chưa cam kết)
  const [dist, setDist] = useState("");
  // Đổi tầng (Toàn quốc → tỉnh → phường) = cuộn bảng về đầu, không đứng lưng chừng danh sách mới (chủ dự án 01/11/2026: vuốt chọn lên
  // xuống phải đúng)
  const gocRef = useRef<HTMLDivElement>(null);
  // Ô TÌM CHỈ LÀ KÍNH LÚP (chủ dự án 02/11/2026: "bỏ ô search") — bấm kính lúp mới hiện chỗ gõ; đổi tầng thì cất lại
  const [moTim, setMoTim] = useState(false);
  useEffect(() => {
    let el: HTMLElement | null = gocRef.current?.parentElement ?? null;
    while (el && getComputedStyle(el).overflowY !== "auto") el = el.parentElement;
    el?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đổi tầng thì cất chỗ gõ
    setMoTim(false);
  }, [prov, dist]);
  // ĐẶT LẠI (bỏ hết nơi đã chọn) = về đầu: danh sách tỉnh, xoá chữ đang gõ (02/11/2026: bấm Đặt lại mà bảng vẫn đứng trong tỉnh cũ)
  const rong = locations.length === 0;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- về đầu khi bỏ hết
    if (rong) { setProv(""); setDist(""); setQ(""); setMoTim(false); }
  }, [rong]);
  // Hệ đơn vị hành chính: "moi" (sau sát nhập 2025 — 2 cấp) hoặc "cu" (trước — 3 cấp).
  // Nhớ lựa chọn để áp đồng bộ cho Dự án · Mua bán · Cho thuê (cả PC & Mobile).
  const [mode, setMode] = useState<GeoMode>("moi");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc localStorage một lần khi mở (có từ trước)
    try { const m = localStorage.getItem(GEO_MODE_KEY); if (m === "moi" || m === "cu") setMode(m); } catch { /* noop */ }
  }, []);
  // ĐỔI HỆ CŨ ↔ MỚI = ĐỔI LUÔN những nơi đã chọn sang hệ kia (chủ dự án 01/11/2026: "chuyển đổi qua lại phải đồng bộ") — dùng bảng
  // sáp nhập của web; nơi không có trong bảng thì giữ nguyên (không đoán). Kết quả lọc không đổi vì bộ lọc vẫn khớp cả hai hệ.
  const doiHe = (ls: LocationSel[], m: GeoMode): LocationSel[] => {
    const ra: LocationSel[] = [];
    const them = (l: LocationSel) => { if (!ra.some((x) => sameLocation(x, l))) ra.push(l); };
    for (const l of ls) {
      if (m === "cu") {
        if (l.ward && !l.district) {
          const cu = choCuCua(l.province, l.ward);
          if (cu.length) cu.forEach((c) => them({ province: c.tinh, district: c.quan, ward: c.phuong }));
          else them(l);
        } else if (!l.district && !l.ward) oldNamesOf(l.province).forEach((p) => them({ province: p }));
        else them(l);
      } else {
        if (l.ward && l.district) {
          const moi = phuongMoiCua(l.province, l.district, l.ward);
          them(moi ? { province: moi.tinh, ward: moi.phuong } : l);
        } else if (l.district) {
          const ws = phuongMoiCuaQuan(l.province, l.district);
          if (ws.length) ws.forEach((w) => them({ province: newProvinceOf(l.province), ward: w }));
          else them(l);
        } else them({ province: newProvinceOf(l.province) });
      }
    }
    return ra; // không cắt: đổi hệ là đổi CÁCH GỌI, không được làm rơi nơi khách đã chọn (01/11/2026)
  };
  const switchMode = (m: GeoMode) => {
    if (m === mode) return;
    if (locations.length) onChange(doiHe(locations, m));
    setMode(m); setProv(""); setDist(""); setQ("");
    try { localStorage.setItem(GEO_MODE_KEY, m); } catch { /* noop */ }
  };

  const isNew = mode === "moi";
  // Hệ mới: Tỉnh → thẳng tới Phường/Xã (bỏ Quận/Huyện). Hệ cũ: Tỉnh → Quận/Huyện → Phường/Xã.
  const wardList = isNew ? (prov ? wardsOfNew(prov) : []) : (prov && dist ? wardsOf(prov, dist) : []);
  const level: "province" | "district" | "ward" =
    !prov ? "province"
      : isNew ? "ward"
      : !dist ? "district" : wardList.length ? "ward" : "district";

  // Mỗi tầng xếp A–Z theo tên riêng (bỏ chữ Phường/Xã/Quận/Huyện… khi so) — khách dò tên nhanh (chủ dự án 01/11/2026)
  const tenRieng = (x: string) => normalizeVi(x.replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i, ""));
  const soSanhTenTinh = (a: string, b: string) => a.localeCompare(b, "vi", { sensitivity: "base" });
  const list = [...(level === "province" ? provinceNamesFor(mode) : level === "district" ? districtsOf(prov) : wardList)];
  // Hệ địa chỉ cũ: giữ tỉnh cũ được nhóm theo tỉnh mới cha từ locations.ts; các tầng khác vẫn A–Z.
  if (level === "province") list.sort(isNew ? soSanhTenTinh : (a, b) => newProvinceOf(a).localeCompare(newProvinceOf(b), "vi", { sensitivity: "base" }) || soSanhTenTinh(a, b));
  else list.sort((a, b) => tenRieng(a).localeCompare(tenRieng(b), "vi"));
  const nq = normalizeVi(q);
  const noiCua = (name: string): LocationSel =>
    !prov ? { province: name } : !isNew && !dist ? { province: prov, district: name } : isNew ? { province: prov, ward: name } : { province: prov, district: dist, ward: name };
  const soCua = (name: string) => (demTheoNoi ? demTheoNoi(noiCua(name)) : 0);
  const filtered = (nq ? list.filter((x) => khopTen(x, q)).sort((x, y) => diemTen(y, q) - diemTen(x, q)) : list).filter((x) => !demTheoNoi || soCua(x) > 0);

  const full = locations.length >= MAX_LOCATIONS;

  // CÁCH CHỌN NHƯ NGƯỜI BÌNH THƯỜNG (chủ dự án 01/11/2026): bấm TỈNH = chọn cả tỉnh ngay + mở danh sách phường; bấm PHƯỜNG = chọn
  // phường đó (thay "toàn bộ tỉnh"), bấm thêm phường = chọn thêm (tối đa ${MAX_LOCATIONS}); bỏ hết phường = về toàn bộ tỉnh. Chọn là lọc
  // ngay — không nút "Thêm cả", không "Áp dụng". Hệ cũ: Tỉnh → Quận/Huyện → Phường/Xã cùng cách.
  const cungTinh = (l: LocationSel, p: string) => l.province === p;
  const cungQuan = (l: LocationSel, p: string, d: string) => l.province === p && l.district === d;
  // Chọn xong một tầng → TẮT BÀN PHÍM (khách vừa gõ tìm tỉnh): bàn phím còn bật thì che hết danh sách tầng dưới (ảnh chủ dự án 01/11/2026)
  const tatPhim = () => (document.activeElement as HTMLElement | null)?.blur?.();
  // ĐANG GÕ Ô TÌM KHU VỰC (chủ dự án 01/11/2026, báo 4 lần — ảnh Bắc Kạn, "Hồ", Bắc Giang): bàn phím bật thì danh sách phải hiện NGAY
  // DƯỚI ô tìm. Thu gọn phần trên (nơi đã chọn, công tắc hệ địa chỉ, tiêu đề tầng) + đánh dấu bảng để ẩn hai nút đáy — đặt thẳng trên
  // bảng khi ô tìm nhận / mất con trỏ, không phụ thuộc trình duyệt có đo bàn phím hay hiểu :has không. Mất con trỏ thì đợi một nhịp
  // mới hiện lại phần trên, để chạm vào dòng trong danh sách không làm danh sách xê dịch dưới tay.
  // 02/11/2026: phần trên KHÔNG thu gọn nữa (ẩn / hiện làm bảng nhảy lên xuống) — chỉ còn đánh dấu bảng để ẩn hai nút đáy lúc gõ
  const henTim = useRef(0);
  const danhDauBang = (bat: boolean) => { const b = gocRef.current?.closest(".cvr-sheet"); if (b) { if (bat) b.setAttribute("data-tim-noi", "1"); else b.removeAttribute("data-tim-noi"); } };
  const vaoTim = () => { clearTimeout(henTim.current); danhDauBang(true); };
  const raTim = () => { clearTimeout(henTim.current); henTim.current = window.setTimeout(() => danhDauBang(false), 250); };
  useEffect(() => () => { clearTimeout(henTim.current); danhDauBang(false); }, []);
  // Cất chỗ gõ (×, đổi tầng, Đặt lại) mà ô gõ biến mất khi còn con trỏ thì không có lần "mất con trỏ" — tự hiện lại hai nút đáy
  useEffect(() => {
    if (!moTim) { clearTimeout(henTim.current); danhDauBang(false); }
  }, [moTim]);
  const chonTinh = (p: string) => {
    tatPhim();
    if (!locations.some((l) => cungTinh(l, p)) && !full) onChange([...locations, { province: p }]);
    setProv(p); setDist(""); setQ("");
  };
  const chonQuan = (d: string) => {
    tatPhim();
    if (!locations.some((l) => cungQuan(l, prov, d))) {
      const conLai = locations.filter((l) => !(cungTinh(l, prov) && !l.district && !l.ward));
      if (conLai.length < MAX_LOCATIONS) onChange([...conLai, { province: prov, district: d }]);
    }
    setDist(d); setQ("");
  };
  const toanBo: LocationSel = isNew || !dist ? { province: prov } : { province: prov, district: dist };
  const laToanBo = (l: LocationSel) => sameLocation(l, toanBo);
  const phuongCua = (w: string): LocationSel => (isNew ? { province: prov, ward: w } : { province: prov, district: dist, ward: w });
  const doiPhuong = (w: string) => {
    const sel = phuongCua(w);
    const daChon = locations.some((l) => sameLocation(l, sel));
    let next = daChon ? locations.filter((l) => !sameLocation(l, sel)) : [...locations.filter((l) => !laToanBo(l)), sel];
    const conPhuong = next.some((l) => l.province === prov && (isNew || l.district === dist) && !!l.ward);
    if (daChon && !conPhuong) next = [...next, toanBo]; // bỏ hết phường → về toàn bộ tỉnh / quận
    if (next.length > MAX_LOCATIONS) return;
    onChange(next);
  };
  const chonToanBo = () => onChange([...locations.filter((l) => !(l.province === prov && (isNew || l.district === dist || !dist))), toanBo]);
  const daChon = (name: string) =>
    level === "province" ? locations.some((l) => cungTinh(l, name))
      : level === "district" ? locations.some((l) => cungQuan(l, prov, name))
      : locations.some((l) => sameLocation(l, phuongCua(name)));
  const pick = (name: string) => (level === "province" ? chonTinh(name) : level === "district" ? chonQuan(name) : doiPhuong(name));
  // NƠI ĐÃ CHỌN LÊN ĐẦU, TÔ XANH (chủ dự án 01/11/2026) — thứ tự CHỐT lúc mở bảng / chuyển tầng (tỉnh → phường, đổi hệ): đang bấm chọn
  // thì chỉ đổi màu, không đổi chỗ, nên danh sách không nhảy dưới tay; mở lại / chuyển tầng thì nơi đã chọn nằm trên cùng.
  const khoaTang = `${mode}|${prov}|${dist}|${rong}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chốt lại khi chuyển tầng, không theo từng lần bấm
  const dauTang = useMemo(() => new Set(list.filter(daChon)), [khoaTang]);
  const xepLen = nq ? filtered : [...filtered.filter((x) => dauTang.has(x)), ...filtered.filter((x) => !dauTang.has(x))];
  const nhomTinhCu = level === "province" && !isNew
    ? [...new Set(list.map(newProvinceOf))]
        .sort((a, b) => soSanhTenTinh(a, b))
        .map((cha) => ({
          cha,
          con: xepLen
            .filter((ten) => newProvinceOf(ten) === cha)
            .sort((a, b) => nq ? 0 : Number(dauTang.has(b)) - Number(dauTang.has(a)) || soSanhTenTinh(a, b)),
        }))
        .filter((nhom) => nhom.con.length > 0)
    : [];
  const renderTinh = (name: string) => {
    const on = daChon(name);
    // CHỌN / BỎ CHỌN MỘT KIỂU cho mọi tầng, cả hệ mới lẫn hệ cũ (chủ dự án 02/11/2026 — cùng ô tick bảng Loại hình):
    // ô tick trái = chọn / bỏ chọn · tên tỉnh, quận (có ›) = mở cấp con (chưa chọn thì chọn luôn — cách đã chốt 01/11) ·
    // phường: bấm cả dòng = chọn / bỏ chọn.
    const doiTick = () => {
      if (level === "ward") return doiPhuong(name);
      if (on) return onChange(locations.filter((l) => (level === "province" ? !cungTinh(l, name) : !cungQuan(l, prov, name))));
      if (level === "province") { if (!full) onChange([...locations, { province: name }]); return; }
      const conLai = locations.filter((l) => !(cungTinh(l, prov) && !l.district && !l.ward));
      if (conLai.length < MAX_LOCATIONS) onChange([...conLai, { province: prov, district: name }]);
    };
    return (
      <div key={name} className={`flex items-center rounded-lg transition hover:bg-black/5 ${on ? "font-semibold text-cvr-blue-ink" : "text-cvr-ink/80"}`}>
        <label className="flex shrink-0 cursor-pointer items-center py-1.5 pl-2 pr-1">
          <input type="checkbox" checked={on} onChange={doiTick} aria-label={`${on ? "Bỏ chọn" : "Chọn"} ${name}`} className="h-4 w-4 accent-cvr-blue" />
        </label>
        <button
          type="button"
          onClick={() => pick(name)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 py-1.5 pl-1.5 pr-2.5 text-left text-sm"
        >
          <span className="truncate">{name}</span>
          <span className="flex shrink-0 items-center gap-1.5">{demTheoNoi && <span className="text-xs text-cvr-faint">{soCua(name)}</span>}{level !== "ward" && <span className="text-cvr-faint">›</span>}</span>
        </button>
      </div>
    );
  };
  // TẦNG NÀO TÌM TẦNG ĐÓ (chủ dự án 01/11/2026: "đây là chọn Tỉnh / Thành phố"): ô gõ chỉ lọc đúng danh sách tầng đang mở — tầng tỉnh ra tỉnh
  // thành, vào tỉnh rồi mới tìm phường (đã bỏ tìm phường cả nước ở tầng tỉnh).

  const Crumb = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[8rem] truncate rounded px-1.5 py-0.5 ${active ? "font-semibold text-cvr-ink" : "text-cvr-muted hover:text-cvr-ink"}`}
    >
      {children}
    </button>
  );

  // ĐÃ CHỌN = MỖI TỈNH MỘT NÚT, MỤC CHA + SỐ MỤC CON (chủ dự án 02/11/2026: "1 dòng là tỉnh thành chính và con số"): "Cà Mau (3)" ·
  // "Đà Nẵng" (cả tỉnh). × bỏ cả tỉnh; bấm tên = mở tỉnh đó để thêm / bớt phường (bỏ từng phường thì bấm lại phường đó).
  const mucDaChon = tinhDaChon(locations).map((g) => ({
    nhan: g.nhan,
    bo: () => onChange(locations.filter((l) => l.province !== g.tinh)),
    mo: () => {
      const cua = locations.filter((l) => l.province === g.tinh);
      const heDong: GeoMode = cua.some((l) => l.district) ? "cu" : cua.some((l) => l.ward) ? "moi" : mode;
      if (heDong !== mode) { setMode(heDong); try { localStorage.setItem(GEO_MODE_KEY, heDong); } catch { /* noop */ } }
      const quan = [...new Set(cua.map((l) => l.district).filter(Boolean))];
      tatPhim(); setProv(g.tinh); setDist(heDong === "cu" && quan.length === 1 ? quan[0]! : ""); setQ("");
    },
  }));
  return (
    // CAO CỐ ĐỊNH trên điện thoại — vào tỉnh / Đặt lại / gõ tìm, bảng không co giãn, nhảy dưới tay (02/11/2026)
    // shrink-0: khung theo đúng chiều dài danh sách — co lại thì dòng đã chọn (dính trên cùng) trôi mất khi cuộn
    <div ref={gocRef} className="min-h-[60dvh] shrink-0 sm:min-h-0">
      {/* KHÔNG ẨN phần trên khi gõ (02/11/2026: ẩn / hiện làm bảng nhảy lên xuống) — chỉ hai nút đáy ẩn lúc gõ (data-tim-noi) */}
      <DaChon muc={mucDaChon} macDinh="Toàn quốc" />
      {/* Công tắc: Tìm theo địa chỉ MỚI sau sáp nhập (2025). Bật = hệ mới 2 cấp
          (Tỉnh/Thành → Phường/Xã); Tắt = hệ cũ 3 cấp (Tỉnh → Quận/Huyện → Phường/Xã). */}
      <button
        type="button"
        role="switch"
        aria-checked={isNew}
        onClick={() => switchMode(isNew ? "cu" : "moi")}
        className={`flex mb-2 w-full items-center justify-between gap-3 rounded-lg bg-cvr-blue/[0.06] px-3 py-2.5 text-left transition hover:bg-cvr-blue/[0.1]`}
      >
        <span className="text-[13px] font-semibold text-cvr-ink">Tìm theo địa chỉ mới sau sáp nhập</span>
        <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isNew ? "bg-cvr-blue" : "bg-black/20"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isNew ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>

      {/* Breadcrumb tầng đang duyệt — chỉ khi đã vào một tỉnh (ở tầng tỉnh nó chỉ lặp chữ "Toàn quốc", 02/11/2026) */}
      {prov && <div className="mb-2 flex flex-wrap items-center gap-0.5 text-xs">
        {/* eslint-disable-next-line react-hooks/static-components -- Crumb có từ trước */}
        <Crumb active={!prov} onClick={() => { setProv(""); setDist(""); setQ(""); }}>Toàn quốc</Crumb>
        {/* eslint-disable-next-line react-hooks/static-components -- Crumb có từ trước */}
        {prov && <><span className="text-cvr-faint">›</span><Crumb active={!dist} onClick={() => { setDist(""); setQ(""); }}>{prov}</Crumb></>}
        {dist && <><span className="text-cvr-faint">›</span><span className="max-w-[8rem] truncate px-1.5 py-0.5 font-semibold text-cvr-ink">{dist}</span></>}
      </div>}


      {/* TIÊU ĐỀ TẦNG + KÍNH LÚP — khách biết đang chọn cấp nào (01/11/2026); không khung ô tìm, bấm kính lúp mới gõ (02/11/2026) */}
      {!moTim && (
        <div className="mb-1 flex items-center justify-between gap-2 px-0.5">
          <p className="min-w-0 truncate text-[13px] font-semibold text-cvr-ink">
            {level === "province" ? "Chọn Tỉnh / Thành phố" : level === "district" ? `Chọn Quận / Huyện của ${prov}` : `Chọn Phường / Xã của ${dist || prov}`}
          </p>
          <button type="button" onClick={() => setMoTim(true)} aria-label="Tìm" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cvr-ink transition hover:bg-black/5 active:bg-black/5">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
          </button>
        </div>
      )}
      {moTim && <div className="relative">
        <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          onFocus={vaoTim}
          onBlur={raTim}
          // Chrome thấy chữ "quận/huyện", "tỉnh/thành" tưởng ô điền ĐỊA CHỈ → bật thanh tự điền (chìa khoá · thẻ · ghim) chồng lên bàn phím,
          // che thêm danh sách (ảnh chủ dự án 01/11/2026). Đây là ô LỌC, không phải ô địa chỉ → tắt tự điền, sửa chính tả.
          name="loc-nhanh-khu-vuc"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={level === "province" ? "Tìm tỉnh/thành…" : level === "district" ? "Tìm quận/huyện…" : "Tìm phường/xã…"}
          aria-label="Lọc nhanh khu vực"
          className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] pl-9 pr-10 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
        {/* Cất chỗ gõ, về lại kính lúp */}
        <button type="button" onClick={() => { setQ(""); setMoTim(false); }} aria-label="Đóng tìm" className="absolute right-0.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-muted active:bg-black/5">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>}

      {/* Danh sách bấm chọn */}
      <div className="mt-2 space-y-0.5">
        {full && <p className="px-2 py-2 text-center text-xs font-medium text-cvr-blue-ink">Đã đạt tối đa {MAX_LOCATIONS} khu vực</p>}
        {filtered.length === 0 && <p className="px-2 py-3 text-center text-sm text-cvr-faint">Không có kết quả</p>}
        {prov && !nq && (
          <label className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition hover:bg-black/5 ${locations.some(laToanBo) ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>
            <input type="checkbox" checked={locations.some(laToanBo)} onChange={() => (locations.some(laToanBo) ? onChange(locations.filter((l) => !laToanBo(l))) : chonToanBo())} className="h-4 w-4 shrink-0 accent-cvr-blue" />
            <span className="truncate">Toàn bộ {dist || prov}</span>
          </label>
        )}
        {/* Nơi đã chọn (xanh, đậm) nằm ĐẦU danh sách, còn lại A–Z — thứ tự chốt lúc mở bảng / chuyển tầng (xepLen), đang bấm thì không
            đổi chỗ (chủ dự án 01/11/2026: vuốt, chọn không được nhảy). */}
        {nhomTinhCu.length
          ? nhomTinhCu.map(({ cha, con }) => (
              <div key={cha} className="pt-1">
                <p className="px-2 pb-1 pt-1.5 text-xs font-semibold text-cvr-ink">{cha}</p>
                <div className="ml-3 space-y-0.5 border-l border-black/10 pl-2">{con.map(renderTinh)}</div>
              </div>
            ))
          : xepLen.map(renderTinh)}
      </div>

    </div>
  );
}

// Danh sách dự án — LỌC ĐỘNG theo khu vực đã chọn (kiểu Batdongsan): chọn Đà Nẵng
// → chỉ hiện dự án Đà Nẵng. Chưa chọn khu vực → hiện tất cả.
export function ProjectPanel({
  locations, project, onPick, ds, hienSan = false,
}: {
  locations: LocationSel[];
  project: string;
  onPick: (name: string) => void;
  /** Danh sách dự án thật trang cha có sẵn (trang /du-an, 01/11/2026); không truyền → như cũ */
  ds?: { slug: string; name: string; location: string; developer: string }[];
  /** Đã thu hẹp bằng trường trước (khu vực, loại hình, chủ đầu tư) → hiện sẵn danh sách; không thì gõ mới hiện */
  hienSan?: boolean;
}) {
  const [q, setQ] = useState("");
  // DỰ ÁN THẬT (chủ dự án 01/11/2026 — trước đây lấy dự án MẪU trong data.ts): trang cha truyền ds, không thì nạp danh mục dự án
  // của web (/api/du-an/ten — hồ sơ dự án + dự án ghi trên tin, chỉ biết tỉnh/thành → khu vực so theo tỉnh)
  const [napDs, setNapDs] = useState<{ slug: string; name: string; location: string; developer: string }[]>([]);
  useEffect(() => {
    if (ds) return;
    void napDsDuAn().then((x) => setNapDs(x.map((d) => ({ slug: d.slug, name: d.ten, location: d.tinh, developer: d.cdt ?? "" }))));
  }, [ds]);
  const inArea = (loc: string) =>
    locations.length === 0 ||
    locations.some((l) => loc.includes(l.province) && (!ds || ((!l.district || loc.includes(l.district)) && (!l.ward || loc.includes(l.ward)))));
  const base = (ds ?? napDs).filter((p) => inArea(p.location)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const nq = normalizeVi(q);
  // TRƯỜNG CHỌN (chủ dự án 01/11/2026): chưa gõ thì không bày cả danh sách — gõ tên dự án / chủ đầu tư mới hiện đúng dự án khớp để chọn
  const list = nq ? base.filter((p) => khopTen(`${p.name} ${p.location} ${p.developer}`, q))
      // XẾP: trùng TÊN dự án trước, rồi chủ đầu tư, cuối cùng địa chỉ (gõ "sun" → Sun Galaxy trước dự án của chủ đầu tư Sun)
      .map((p) => ({ p, d: diemTen(p.name, q) * 100 + diemTen(p.developer, q) * 10 + diemTen(p.location, q) }))
      .sort((x, y) => y.d - x.d)
      .map((x) => x.p) : hienSan || locations.length ? base : [];

  return (
    <div>
      <div className="relative">
        <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm dự án…"
          aria-label="Tìm dự án"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] pl-9 pr-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
      </div>
      <div className="mt-2 space-y-0.5">
        {nq && list.length === 0 && (
          <p className="px-2 py-3 text-center text-sm text-cvr-faint">
            {locations.length ? "Chưa có dự án ở khu vực đã chọn" : "Không có dự án khớp"}
          </p>
        )}
        {list.map((p) => {
          const active = project === p.name;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onPick(p.name)}
              className={`flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left text-sm transition ${active ? "bg-cvr-blue/10 text-cvr-blue-ink" : "text-cvr-ink/80 hover:bg-black/5"}`}
            >
              <span className="truncate font-medium">{p.name}</span>
              <span className="truncate text-[11px] text-cvr-faint">{p.location}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Toggle bật/tắt kiểu Batdongsan (Tin xác thực · Môi giới chuyên nghiệp) — công tắc iOS/Apple.
// Hàng công tắc trong drawer "Lọc thêm" (nhãn trái · switch phải) — kiểu Apple.
export function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left text-sm text-cvr-ink transition hover:bg-black/[0.03]"
    >
      <span className="font-medium">{label}</span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-cvr-blue" : "bg-black/15"}`} aria-hidden>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

// Tô KIỂU GOOGLE (chủ dự án 17/10/2026, đồng bộ ô tìm trang chủ): chữ khách ĐÃ GÕ để thường, phần máy GỢI Ý THÊM in đậm.
// So theo từng chữ, không phân biệt dấu; chữ cuối có thể đang gõ dở ("Đà N" → "Đà Nẵng" để thường).
function HighlightLabel({ label, q }: { label: string; q: string }) {
  const daGo = normalizeVi(q).split(/[^a-z0-9]+/).filter(Boolean);
  if (!daGo.length) return <span className="text-cvr-ink">{label}</span>;
  return (
    <span className="text-cvr-ink">
      {label.split(/(\s+)/).map((w, i) => {
        const n = normalizeVi(w).replace(/[^a-z0-9]/g, "");
        return !n || daGo.includes(n) || n.startsWith(daGo[daGo.length - 1]) ? w : <b key={i} className="font-semibold">{w}</b>;
      })}
    </span>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active ? "border-cvr-blue bg-cvr-blue text-white" : "border-black/15 text-cvr-ink/75 hover:border-cvr-blue/50 hover:text-cvr-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function RangePanel({
  unit, step, sliderMax, min, max, presets, onPick, onApply,
}: {
  unit: string;
  step: number;
  sliderMax: number; // mốc tối đa của thanh trượt (kéo tới cuối = không giới hạn)
  min: number | null;
  max: number | null;
  presets: { label: string; min: number; max: number | null }[];
  onPick: (min: number | null, max: number | null) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  // Bản nháp cho ô nhập tuỳ chỉnh (chỉ ghi vào filter khi rời ô)
  const [draftMin, setDraftMin] = useState(min == null ? "" : String(min));
  const [draftMax, setDraftMax] = useState(max == null ? "" : String(max));

  const commit = (mn: string, mx: string) => {
    const a = mn.trim() === "" ? null : Number(mn.replace(",", "."));
    const b = mx.trim() === "" ? null : Number(mx.replace(",", "."));
    onPick(Number.isNaN(a as number) ? null : a, Number.isNaN(b as number) ? null : b);
  };

  // Giá trị hiện tại cho thanh trượt (rỗng = 0 / hết mốc)
  const lo = draftMin.trim() === "" ? 0 : Math.max(0, Number(draftMin.replace(",", ".")) || 0);
  const hi = draftMax.trim() === "" ? sliderMax : Math.min(sliderMax, Number(draftMax.replace(",", ".")) || sliderMax);
  const pct = (v: number) => Math.max(0, Math.min(100, (v / sliderMax) * 100));
  const onSlide = (nlo: number, nhi: number) => {
    const a = nlo <= 0 ? "" : String(nlo);
    const b = nhi >= sliderMax ? "" : String(nhi); // kéo tới cuối = không giới hạn trên
    setDraftMin(a);
    setDraftMax(b);
    onPick(a === "" ? null : nlo, b === "" ? null : nhi);
  };

  return (
    <div>
      {/* Thanh trượt 2 đầu kiểu Homedy */}
      <div className="relative mb-3 h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-black/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-cvr-blue"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          className="cvr-range absolute left-0 top-0 h-5 w-full"
          type="range" min={0} max={sliderMax} step={step} value={lo}
          aria-label={`Tối thiểu (${unit})`}
          onChange={(e) => onSlide(Math.min(Number(e.target.value), hi), hi)}
          onPointerUp={onApply} // thả tay khỏi thanh trượt = tìm (trường chọn một, không nút Áp dụng — chủ dự án 01/11/2026)
        />
        <input
          className="cvr-range absolute left-0 top-0 h-5 w-full"
          type="range" min={0} max={sliderMax} step={step} value={hi}
          aria-label={`Tối đa (${unit})`}
          onChange={(e) => onSlide(lo, Math.max(Number(e.target.value), lo))}
          onPointerUp={onApply}
        />
      </div>

      {/* Ô nhập khoảng tuỳ chỉnh */}
      <div className="flex items-center gap-2">
        {/* type="text" chứ KHÔNG "number": trình duyệt loại bỏ dấu phẩy nên gõ
            "4,2" là ô trống trơn. Hàm commit() đã hiểu cả dấu phẩy lẫn dấu chấm. */}
        <input
          type="text" inputMode="decimal" enterKeyHint="search" placeholder="Tối thiểu"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          onKeyDown={(e) => { if (e.key === "Enter") { commit(draftMin, draftMax); onApply(); } }}
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
        <span className="text-cvr-faint">–</span>
        <input
          type="text" inputMode="decimal" enterKeyHint="search" placeholder="Tối đa"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          onKeyDown={(e) => { if (e.key === "Enter") { commit(draftMin, draftMax); onApply(); } }}
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
        <span className="shrink-0 text-xs text-cvr-faint">{unit}</span>
      </div>

      {/* Khoảng có sẵn */}
      <div className="mt-3 space-y-0.5">
        {presets.map((p) => {
          const active = min === p.min && (max ?? null) === (p.max ?? null);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDraftMin(String(p.min));
                setDraftMax(p.max == null ? "" : String(p.max));
                // CHỌN MỘT = XONG (chủ dự án 01/11/2026: "có 1 lựa chọn thì áp dụng cái gì"): bấm mốc là đóng bảng; trong màn gõ chỉ
                // đóng bảng và tìm (xongTruong)
                onPick(p.min, p.max);
                onApply();
              }}
              // CÙNG KIỂU DÒNG bảng Khu vực / Loại BĐS (chủ dự án 02/11/2026: "cân đối, dễ nhìn"): ô tròn trái (chọn MỘT) — bảng chọn
              // nhiều dùng ô vuông; cùng cỡ chữ, cùng khoảng dòng; đang chọn chữ xanh đậm
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-black/5 ${
                active ? "font-semibold text-cvr-blue-ink" : "text-cvr-ink/80"
              }`}
            >
              <span aria-hidden className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-cvr-blue" : "border-black/30"}`}>
                {active && <span className="h-2 w-2 rounded-full bg-cvr-blue" />}
              </span>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* CHỌN LÀ LỌC NGAY — không nút Đặt lại · Áp dụng (chủ dự án 01/11/2026: mỗi mức nhu cầu có lựa chọn, không ép khách bấm thêm) */}
    </div>
  );
}

/** Loại đã chọn gom theo NHÓM (chủ dự án 01/11/2026: chọn "Nhà" là một lựa chọn, không bung 4 loại con) — trọn nhóm → tên nhóm */
export function gomLoai(types: string[], nhom: { label: string; items: string[] }[]): { nhan: string; cac: string[] }[] {
  const ra: { nhan: string; cac: string[] }[] = [];
  const daGom = new Set<string>();
  for (const g of nhom) if (g.items.length > 1 && g.items.every((x) => types.includes(x))) { ra.push({ nhan: g.label, cac: g.items }); g.items.forEach((x) => daGom.add(x)); }
  for (const x of types) if (!daGom.has(x)) ra.push({ nhan: tenLoaiHinh(x), cac: [x] });
  return ra;
}

/** MỤC ĐÃ CHỌN LÊN ĐẦU (chủ dự án 02/11/2026: "tương tự như địa điểm, trường nào chọn nhiều, trường đã chọn thì cho lên đầu") —
 *  thứ tự CHỐT LÚC MỞ BẢNG như bảng Khu vực: đang bấm chọn thì không đổi chỗ (không nhảy dưới tay), mở lại thì mục đã chọn nằm trên cùng. */
export function DaChonLenDau<T>({ ds, khoa, daChon, children }: { ds: T[]; khoa: (x: T) => string; daChon: (x: T) => boolean; children: (ds: T[]) => React.ReactNode }) {
  const [dau] = useState(() => new Set(ds.filter(daChon).map(khoa)));
  return <>{children([...ds.filter((x) => dau.has(khoa(x))), ...ds.filter((x) => !dau.has(khoa(x)))])}</>;
}

/** Loại đã chọn theo MỤC CHA + SỐ MỤC CON (chủ dự án 02/11/2026 — cùng cách ghi trường Khu vực): trọn nhóm → "Nhà" ·
 *  một phần → "Nhà (2)" · loại lẻ ngoài nhóm → tên loại. Chỉ để GHI NHÃN nút / dòng đã chọn (câu SEO vẫn dùng gomLoai). */
export function loaiTheoCha(types: string[], nhom: { label: string; items: string[] }[]): { nhan: string; cac: string[] }[] {
  const ra: { nhan: string; cac: string[] }[] = [];
  const daGom = new Set<string>();
  for (const g of nhom) {
    const cac = g.items.filter((x) => types.includes(x));
    if (!cac.length || g.items.length < 2) continue;
    ra.push({ nhan: cac.length === g.items.length ? g.label : `${g.label} (${cac.length})`, cac });
    cac.forEach((x) => daGom.add(x));
  }
  for (const x of types) if (!daGom.has(x)) ra.push({ nhan: tenLoaiHinh(x), cac: [x] });
  return ra;
}
export const nhanLoai = (types: string[], nhom: { label: string; items: string[] }[]) => {
  const ds = loaiTheoCha(types, nhom);
  return !ds.length ? "" : ds.length > 1 ? `${ds[0].nhan} +${ds.length - 1}` : ds[0].nhan;
};

// ĐÃ CHỌN đầu mọi bảng chọn (chủ dự án 01/11/2026: khách thấy rõ mình chọn gì; chọn 1, 2, 3 mục thì xoá từng mục được, nhiều mục
// cha – con thì nút Đặt lại). Chỉ các mục đã chọn, mỗi mục một dấu × — không chữ giải thích. muc: tên ĐỦ ("Phường Vỹ Dạ, Huế") + cách xoá.
export function DaChon({ muc, macDinh = "Tất cả" }: { muc: { nhan: string; bo: () => void; mo?: () => void }[]; onBoHet?: () => void; macDinh?: string }) {
  // GIỮ CHỖ CỐ ĐỊNH kể cả khi chưa chọn gì (chủ dự án 01/11/2026: vuốt / chọn không được nhảy): dòng này hiện ra hay mất đi không đẩy
  // danh sách bên dưới chạy dưới tay khách. DÍNH TRÊN CÙNG khi cuộn — khách luôn thấy mình đang chọn gì.
  return (
    <div className="sticky top-0 z-10 -mx-1 mb-2 h-[34px] bg-white px-1 pb-1">
      {/* MỘT HÀNG cố định (dài thì vuốt ngang) — chọn thêm không đẩy danh sách bên dưới chạy dưới tay khách (01/11/2026) */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {/* chưa chọn gì → hiện lựa chọn đang áp (Toàn quốc / Tất cả), không để dòng trống (01/11/2026) */}
        {!muc.length && <span className="inline-flex shrink-0 items-center rounded-full border border-cvr-line bg-cvr-surface px-3 py-1 text-[13px] font-semibold text-cvr-muted">{macDinh}</span>}
        {muc.map((m) => (
          <span key={m.nhan} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-cvr-blue/40 bg-cvr-blue/[0.06] py-1 pl-3 pr-1.5 text-[13px] font-semibold text-cvr-ink">
            {m.mo ? <button type="button" onClick={m.mo} className="text-left">{m.nhan}</button> : <span>{m.nhan}</span>}
            <button type="button" onClick={m.bo} aria-label={`Xoá ${m.nhan}`} className="flex h-5 w-5 items-center justify-center rounded-full text-cvr-muted transition hover:bg-black/5 hover:text-cvr-ink">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

// LỐI RA đáy bảng chọn = NÚT CHUẨN đã chốt cho mọi bảng: Đặt lại · Áp dụng (chủ dự án 20/10/2026, nhắc lại 01/11/2026 — không thêm
// nút kiểu khác), dính đáy bảng để danh sách dài vẫn luôn thấy (luật 0A1).
export function NutXem({ onClick, onReset }: { nhan?: string; onClick: () => void; onReset: () => void }) {
  // ĐIỆN THOẠI (bảng trượt): vẽ vào ĐÁY CỐ ĐỊNH của bảng, ngoài phần cuộn — không còn "dính đáy" trong phần cuộn (02/11/2026: trên
  // Samsung Internet hàng nút trôi lên giữa danh sách). Một chỗ cho mọi bảng: Khu vực, Loại hình, Giá, Diện tích, Lọc thêm, Dự án…
  const chan = useContext(ChanBangContext);
  if (chan) {
    if (!chan.el) return null; // đáy chưa gắn xong (một nhịp lúc mở bảng)
    return createPortal(
      <div className="an-khi-go-phim pb-4">
        <PanelActions onReset={onReset} onApply={onClick} />
      </div>,
      chan.el,
    );
  }
  return (
    // LUÔN ở ĐÁY bảng (mt-auto — bảng nội dung ngắn nút cũng không lơ lửng giữa màn), dính sát đáy khi cuộn, trùm cả phần đệm đáy.
    // ĐANG GÕ (bàn phím bật) thì ẩn (an-khi-go-phim — chủ dự án 01/11/2026, ảnh: chạm "Tìm tỉnh/thành" thì hai nút đè mất danh sách,
    // luật 0A1 không che chỗ khách thao tác); hạ bàn phím là hiện lại, như Google
    <div className="an-khi-go-phim sticky -bottom-4 -mx-1 -mb-4 mt-auto bg-white px-1 pb-4 sm:-bottom-3 sm:-mb-3 sm:pb-3">
      <PanelActions onReset={onReset} onApply={onClick} />
    </div>
  );
}

// Vòng xoay "đang tìm" — hiện trong nút Tìm ngay khi bấm/Enter, để khách BIẾT
// máy đang chạy dù kết quả có khớp hay không.
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.3} strokeWidth={2.6} />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
}
