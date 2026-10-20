"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { goiYTheoY } from "@/lib/goiYTheoY";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FilterDropdown, { PanelActions, FilterDropdownGroup } from "@/components/FilterDropdown";
import { districtsOf, wardsOf, wardsOfNew, provinceNamesFor, type GeoMode } from "@/lib/locations";
import { projects } from "@/lib/data";
import {
  typeGroupsFor,
  priceRangesFor,
  areaRangesFor,
  bedroomOptions,
  directionOptions,
  priceRangeText,
  areaRangeText,
  normalizeVi,
  locationLabel,
  sameLocation,
  MAX_LOCATIONS,
  legalOptions,
  furnishingOptions,
  emptyFilters,
  filtersToParams,
  hasActiveFilters,
  type Filters,
  type LocationSel,
} from "@/lib/filters";
import { suggest, type Suggestion } from "@/lib/suggest";
import { goiYNoiLong, parseQuery, suaChinhTa } from "@/lib/smartSearch";
import { duongDanGanNhat } from "@/lib/duongDanTim";
import { locTuCau } from "@/lib/locTuCau";
import { hintsFor, listingHints, type HintMode, type TinGoiY } from "@/lib/searchHints";
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
  const hintPhrases = useMemo(
    () => (coLocSan ? ["Tìm nhà đất theo khu vực, dự án…"]
      : hintItems && hintItems.length > 0 && mode !== "duan"
      ? listingHints(hintItems, mode)
      : hintsFor(mode)),
    [hintItems, mode, coLocSan],
  );
  const goiYChay = useTypingPlaceholder(hintPhrases, f.keyword.trim().length > 0 || coLocSan);

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
      if (!boxRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [sugOpen]);

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
    if (onSearch) return onSearch(next);
    // TRANG KẾT QUẢ: khách gõ CÂU MỚI rồi bấm Tìm → câu mới thắng bộ lọc cũ (chủ dự án 17/10/2026: đang ở
    // "nhà Đà Nẵng" gõ "Phòng trọ cho thuê tại Huế" mà vẫn ra Đà Nẵng). Câu máy hiểu trọn → sang đúng trang sạch
    // như ô tìm trang chủ; câu còn chi tiết riêng → lọc lại từ đầu theo câu (khu vực · loại hình · giá tách từ câu).
    const kw = f.keyword.trim();
    if (!next && kw && mode !== "duan" && kw !== daTim) {
      setDaTim(kw);
      const u = duongDanGanNhat(purpose, kw);
      if (u && u !== window.location.pathname) return router.push(u);
      // Địa chỉ trang đi theo câu mới (tải lại / gửi link vẫn đúng câu khách tìm). Đang ở trang con cố định nơi
      // (VD /cho-thue/nha/da-nang) → về trang mục đích gốc, không để lọc cố định của trang con đè câu mới.
      const goc = purpose === "thue" ? "/cho-thue" : "/mua-ban";
      const q = filtersToParams({ ...emptyFilters(), keyword: kw });
      q.set("mode", purpose === "thue" ? "Cho thuê" : "Mua bán");
      if (window.location.pathname !== goc) return router.push(`${goc}?${q.toString()}`);
      onChange({ ...locTuCau(kw, purpose), keyword: kw });
      window.history.replaceState(window.history.state, "", `${goc}?${q.toString()}`);
    }
    cuonToiKetQua();
  };
  // câu đã tìm gần nhất — bấm Tìm lại cùng câu thì giữ nguyên các trường khách tự chỉnh sau đó
  const [daTim, setDaTim] = useState(f.keyword.trim());
  // Câu khách vừa gõ ở trang chủ rồi được đưa tới trang sạch (pSEO) — hiện lại trong ô để SỬA TIẾP như Google
  // (chủ dự án 17/10/2026). Chỉ để hiện; khách sửa là thành từ khoá thật. Đọc sau khi dựng trang (máy chủ không có sessionStorage).
  const [cauCu, setCauCu] = useState("");
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("cvr-cau:" + window.location.pathname);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc một lần khi mở trang
      if (s) setCauCu(s);
    } catch { /* bỏ qua */ }
  }, []);

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
  const bacThang: Suggestion[] = useMemo(() => (typed
    // GỢI Ý THEO Ý CÂU dùng chung mọi ô tìm (lib/goiYTheoY, chủ dự án 21/10/2026): mục đích + loại hình + khu vực + đặc điểm;
    // không nói mua/thuê → có cả hai (mục của trang trước). Bấm là sang đúng trang kết quả của dòng đó.
    ? goiYTheoY(kwHieu, purpose === "thue" ? "thue" : "ban").map((g) => ({ label: g.nhan, kind: "Gợi ý" as const, href: g.href }))
    : []), [typed, kwHieu, purpose, coDiaDanh]); // eslint-disable-line react-hooks/exhaustive-deps
  // CHƯA GÕ → CHỈ những lần khách đã tìm, như Google (chủ dự án 17/10/2026: bỏ "gợi ý phổ biến" toàn tên tỉnh trơn — vô dụng)
  // Bỏ gợi ý khớp ký tự kiểu Google (địa danh trùng tên tỉnh khác, "Tất cả biệt thự"…) — chủ dự án 21/10/2026: chỉ gợi ý theo ý câu
  const panelItems: Suggestion[] = typed ? bacThang : recentShown;
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
    // Sản phẩm / Dự án / Tin tức → mở thẳng trang chi tiết (đã là "kết quả").
    if (s.href) {
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
  const locLabel =
    f.locations.length === 0 ? "" :
    f.locations.length === 1 ? locationLabel(f.locations[0]) :
    `${locationLabel(f.locations[0])} +${f.locations.length - 1}`;
  const typeLabel =
    f.types.length === 0 ? "" : f.types.length === 1 ? f.types[0] : `${f.types.length} loại hình`;
  // Lọc thêm ĐẶC THÙ theo ý định: mua bán = Hướng + Pháp lý · cho thuê = Nội thất.
  // + 2 công tắc Tin xác thực / Môi giới chuyên nghiệp (đã gộp vào drawer "Lọc thêm").
  const moreCount =
    (f.beds ? 1 : 0) +
    (purpose === "ban" ? (f.direction ? 1 : 0) + (f.legal ? 1 : 0) : (f.furnishing ? 1 : 0)) +
    (f.verified ? 1 : 0) + (f.broker ? 1 : 0);

  // Mỗi ô lọc rộng vừa đúng nội dung (pill gọn, hiện đủ chữ, không kéo giãn).
  const ddClass = "shrink-0";

  // ===== "Loại nhà đất" — dòng 2 (bố cục Batdongsan) =====
  const typeDropdown = (
    <FilterDropdown label="Loại BĐS" summary={typeLabel} active={f.types.length > 0} panelClassName="w-72" compact={compact} className={ddClass}>
      {({ close }) => {
        // LOGIC CHỌN LOẠI HÌNH (chủ dự án 20/10/2026): chưa chọn loại nào = TẤT CẢ (không lọc). Bấm "Tất cả" = bỏ lọc;
        // đang "Tất cả" mà bấm một loại = chỉ loại đó; chọn đủ mọi loại = quay về "Tất cả" (không hiện "13 loại hình").
        const allChecked = f.types.length === 0 || typeOptions.every((t) => f.types.includes(t));
        const doiLoai = (t: string, checked: boolean) => {
          const next = checked ? f.types.filter((x) => x !== t) : [...f.types, t];
          set({ types: typeOptions.every((x) => next.includes(x)) ? [] : next });
        };
        return (
          <div>
            {/* Chọn tất cả */}
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => set({ types: [] })}
                className="h-4 w-4 shrink-0 accent-cvr-blue"
              />
              <span>Tất cả loại nhà đất</span>
            </label>

            <div className="mt-1 max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {typeGroups.map((g) => (
                <div key={g.label}>
                  <p className="px-2 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-cvr-faint">{g.label}</p>
                  {g.items.map((t) => {
                    const checked = f.types.includes(t);
                    return (
                      <label
                        key={t}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-cvr-ink/80 transition hover:bg-black/5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => doiLoai(t, checked)}
                          className="h-4 w-4 shrink-0 accent-cvr-blue"
                        />
                        <span className="truncate">{t}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* HÀNG KẾT THÚC CHỌN — bỏ chọn hết · "Xong" đóng bảng và RA KẾT QUẢ NGAY.
                Trước đây chỉ có nút bỏ chọn, chọn xong không biết bấm đâu để tìm. */}
            {/* Hàng nút ĐỒNG BỘ mọi bảng lọc: Đặt lại · Áp dụng (chủ dự án 20/10/2026) */}
            <PanelActions onReset={() => set({ types: [] })} onApply={() => { close(); chayTim(); }} />
          </div>
        );
      }}
    </FilterDropdown>
  );

  // ===== Các dropdown chi tiết — dòng 2 (thứ tự hiển thị xếp ở phần return) =====
  // Khu vực — ĐA CHỌN (tối đa 5) theo tầng Tỉnh→Quận→Phường (kiểu Batdongsan)
  const locationDropdown = (
      <FilterDropdown label="Toàn quốc" summary={locLabel} active={f.locations.length > 0} panelClassName="w-80" compact={compact} className={ddClass}>
        {({ close }) => (
          <LocationPanel
            locations={f.locations}
            onChange={(locations) => set({ locations })}
            // "Xong" = kết thúc chọn VÀ ra kết quả ngay (đóng bảng rồi chạy tìm),
            // không phải chỉ đóng bảng để khách ngồi đoán đã tìm hay chưa.
            onClose={() => { close(); chayTim(); }}
          />
        )}
      </FilterDropdown>
  );

  // Dự án — LỌC ĐỘNG theo khu vực đã chọn (kiểu Batdongsan)
  const projectDropdown = (
      <FilterDropdown label="Dự án" summary={f.project} active={!!f.project} panelClassName="w-72" compact={compact} className={ddClass}>
        {({ close }) => (
          <ProjectPanel
            locations={f.locations}
            project={f.project}
            // Chọn dự án = chốt luôn → đóng bảng + ra kết quả ngay
            onPick={(name) => {
              const next = { ...f, project: f.project === name ? "" : name };
              onChange(next);
              close();
              chayTim(next, false);
            }}
          />
        )}
      </FilterDropdown>
  );

  // Khoảng giá (tên nhãn kiểu Batdongsan)
  const priceDropdown = (
      <FilterDropdown label="Khoảng giá" summary={priceLabel} active={f.priceMin != null || f.priceMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
        {({ close }) => (
          <RangePanel
            unit="tỷ"
            step={0.5}
            sliderMax={50}
            min={f.priceMin}
            max={f.priceMax}
            presets={priceRangesFor(purpose)}
            onPick={(min, max) => set({ priceMin: min, priceMax: max })}
            onReset={() => set({ priceMin: null, priceMax: null })}
            onApply={() => { close(); chayTim(); }}
          />
        )}
      </FilterDropdown>
  );

  // Diện tích
  const areaDropdown = (
      <FilterDropdown label="Diện tích" summary={areaLabel} active={f.areaMin != null || f.areaMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
        {({ close }) => (
          <RangePanel
            unit="m²"
            step={10}
            sliderMax={purpose === "thue" ? 5000 : 500}
            min={f.areaMin}
            max={f.areaMax}
            presets={areaRangesFor(purpose)}
            onPick={(min, max) => set({ areaMin: min, areaMax: max })}
            onReset={() => set({ areaMin: null, areaMax: null })}
            onApply={() => { close(); chayTim(); }}
          />
        )}
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
            <PanelActions onReset={() => set({ beds: 0, direction: "", legal: "", furnishing: "", verified: false, broker: false })} onApply={() => { close(); chayTim(); }} />
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

  // ===== Ô từ khoá + nút tìm kiếm (dùng chung) =====
  const searchBox = (
    <>
    {/* Trang danh sách: ô tìm co giãn hết khung, nút "Xem bản đồ" nằm SÁT MÉP PHẢI
        → không còn mảng trống hụt bên phải như khi giới hạn bề ngang. */}
    <div ref={boxRef} className={compact ? "flex w-full gap-2.5" : "flex w-full gap-2.5"}>
      <div className={compact ? "relative flex-1" : "relative flex h-9 min-w-0 flex-1 items-center rounded-full bg-cvr-surface ring-1 ring-black/5 transition focus-within:ring-2 focus-within:ring-cvr-blue/40 sm:h-12 sm:rounded-xl sm:ring-1"}>
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
          onFocus={(e) => {
            if (window.matchMedia("(max-width: 639px)").matches) { e.currentTarget.blur(); setOverlay(true); }
            else setSugOpen(true);
          }}
          onKeyDown={onKeyNav}
          // Gợi ý CHẠY CHỮ theo đúng mục (mua bán / cho thuê / dự án)
          placeholder={sugOpen ? "Tìm nhà đất theo khu vực, dự án…" : goiYChay} // đang mở gợi ý (đã chạm ô) → chữ chạy dừng, chỉ còn dòng mờ cố định
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
    {overlay && (
      <div className="fixed inset-0 z-[80] flex flex-col bg-white sm:hidden">{/* hiện NGAY như Google, không trượt (chủ dự án 20/10/2026: giật) */}
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
              autoFocus
              rows={1}
              value={f.keyword || cauCu}
              onChange={(e) => {
                setCauCu("");
                set({ keyword: e.target.value.replace(/\n/g, " ") });
                setActiveIdx(-1);
                gianO(e.currentTarget);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); chayTim(); } onKeyNav(e); }} // phím Tìm: chạy tìm thật (có vạch chạy báo đang tìm)
              placeholder="Tìm nhà đất theo khu vực, dự án…" // màn tìm đã mở: chữ gợi ý KHÔNG chạy (chủ dự án 18/10/2026)
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
        {!compact && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-cvr-line px-3 py-2">
            {/* Nút "Làm mới" cả trong MÀN TÌM — giống hàng trường lọc ngoài trang (chủ dự án 20/10/2026) */}
            {hasActiveFilters(f) && (
              <button type="button" aria-label="Làm mới" title="Làm mới" onClick={() => { setCauCu(""); onChange(emptyFilters()); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-blue-ink transition active:scale-90 active:bg-cvr-surface">{/* Làm mới = BIỂU TƯỢNG đậm ở đầu hàng lọc (chủ dự án 20/10/2026) */}<svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018 17.4M18.4 9A7 7 0 006 6.6" /></svg></button>
            )}
            {locationDropdown}
            {projectDropdown}
            {typeDropdown}
            {priceDropdown}
            {areaDropdown}
            {moreDropdown}
          </div>
        )}
        {/* CHỌN MỤC ĐÍCH (Dự án · Mua bán · Cho thuê) — đặt TRONG trang tìm của
            điện thoại, ngay dưới ô nhập. Ngoài Hero mobile chỉ để đúng ô tìm cho
            gọn; vào đây mới có đủ chỗ chọn, và chọn xong bấm Tìm là ra ĐÚNG mục. */}
        {/* Kéo danh sách gợi ý → hạ bàn phím (kiểu Google) */}
        <div onTouchMove={() => overlayInputRef.current?.blur()} className="flex-1 overflow-y-auto p-1.5">
          {noHits && (
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
      <div className="rounded-none bg-white pb-2 pt-2 sm:mt-0 sm:border-b sm:border-cvr-line sm:pb-4 sm:pt-3">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="min-w-0">{searchBox}</div>
          {/* Hàng chip lọc — CUỘN NGANG trên mobile (kiểu Batdongsan), tự xuống hàng trên desktop.
              -mx-2.5/px-2.5 để dải chip tràn sát mép thẻ, cuộn mượt hết bề rộng. */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {/* ĐÃ BỎ chip "Bản đồ" ở hàng ngay dưới thanh tìm kiếm — bị trùng với
                nút "Xem bản đồ" nằm cạnh ô tìm phía trên. */}
            {/* Thứ tự chuẩn (mockup Mục I phần 2): Khu vực · Dự án · Loại BĐS · Mức giá · Diện tích · Lọc thêm.
                2 công tắc Tin xác thực / Môi giới chuyên nghiệp đã chuyển vào "Lọc thêm". */}
            {/* Nút "Làm mới" (xoá hết lọc) Ở ĐẦU HÀNG TRƯỜNG LỌC trên điện thoại — ngay cạnh các trường vừa chọn (chủ dự án 18/10/2026) */}
            {hasActiveFilters(f) && (
              <button type="button" aria-label="Làm mới" title="Làm mới" onClick={() => { setCauCu(""); onChange(emptyFilters()); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-blue-ink transition active:scale-90 active:bg-cvr-surface sm:hidden">{/* Làm mới = BIỂU TƯỢNG đậm ở đầu hàng lọc (chủ dự án 20/10/2026) */}<svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018 17.4M18.4 9A7 7 0 006 6.6" /></svg></button>
            )}
            {locationDropdown}
            {projectDropdown}
            {typeDropdown}
            {priceDropdown}
            {areaDropdown}
            {moreDropdown}
            {/* Bỏ nút "Đặt lại" (chủ dự án 17/10/2026): trùng việc với nút "Xoá lọc" cạnh tiêu đề kết quả */}
          </div>
        </div>
      </div>
    </FilterDropdownGroup>
  );
}

// ===== Bộ phận con =====

// Bộ chọn khu vực ĐA TẦNG + ĐA CHỌN (kiểu Batdongsan): duyệt Tỉnh→Quận→Phường,
// thêm cả tỉnh/quận hoặc chọn tới phường; mỗi khu vực là 1 chip (tối đa MAX_LOCATIONS).
export function LocationPanel({
  locations, onChange, onClose,
}: {
  locations: LocationSel[];
  onChange: (locations: LocationSel[]) => void;
  // Đóng panel từ bên trong (nút "Xong") — trước đây chỉ đóng được bằng cách
  // bấm ra ngoài, người dùng không biết đã chọn xong hay chưa.
  onClose?: () => void;
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const [q, setQ] = useState("");
  const [prov, setProv] = useState(""); // đường dẫn đang duyệt (chưa cam kết)
  const [dist, setDist] = useState("");
  // Hệ đơn vị hành chính: "moi" (sau sát nhập 2025 — 2 cấp) hoặc "cu" (trước — 3 cấp).
  // Nhớ lựa chọn để áp đồng bộ cho Dự án · Mua bán · Cho thuê (cả PC & Mobile).
  const [mode, setMode] = useState<GeoMode>("moi");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc localStorage một lần khi mở (có từ trước)
    try { const m = localStorage.getItem(GEO_MODE_KEY); if (m === "moi" || m === "cu") setMode(m); } catch { /* noop */ }
  }, []);
  const switchMode = (m: GeoMode) => {
    if (m === mode) return;
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

  const list = level === "province" ? provinceNamesFor(mode) : level === "district" ? districtsOf(prov) : wardList;
  const nq = normalizeVi(q);
  const filtered = nq ? list.filter((x) => normalizeVi(x).includes(nq)) : list;

  const full = locations.length >= MAX_LOCATIONS;
  const add = (sel: LocationSel) => {
    if (full || locations.some((l) => sameLocation(l, sel))) return;
    onChange([...locations, sel]);
    setProv(""); setDist(""); setQ("");
  };
  const remove = (i: number) => onChange(locations.filter((_, k) => k !== i));

  const pick = (name: string) => {
    if (level === "province") { setProv(name); setQ(""); }
    else if (level === "district") { setDist(name); setQ(""); }
    else add(isNew ? { province: prov, ward: name } : { province: prov, district: dist, ward: name }); // tới phường = thêm luôn
  };

  const Crumb = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[8rem] truncate rounded px-1.5 py-0.5 ${active ? "font-semibold text-cvr-ink" : "text-cvr-muted hover:text-cvr-ink"}`}
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Công tắc: Tìm theo địa chỉ MỚI sau sáp nhập (2025). Bật = hệ mới 2 cấp
          (Tỉnh/Thành → Phường/Xã); Tắt = hệ cũ 3 cấp (Tỉnh → Quận/Huyện → Phường/Xã). */}
      <button
        type="button"
        role="switch"
        aria-checked={isNew}
        onClick={() => switchMode(isNew ? "cu" : "moi")}
        className="mb-1.5 flex w-full items-center justify-between gap-3 rounded-lg bg-cvr-blue/[0.06] px-3 py-2.5 text-left transition hover:bg-cvr-blue/[0.1]"
      >
        <span className="text-[13px] font-semibold text-cvr-ink">Tìm theo địa chỉ mới sau sáp nhập</span>
        <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isNew ? "bg-cvr-blue" : "bg-black/20"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isNew ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>
      <p className="mb-2 px-0.5 text-[11px] text-cvr-faint">
        {isNew ? "Tỉnh/Thành phố → Phường/Xã (sau sáp nhập 2025)" : "Tỉnh → Quận/Huyện → Phường/Xã (trước sáp nhập)"}
      </p>

      {/* Khu vực ĐÃ CHỌN — chip gỡ riêng */}
      {locations.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {locations.map((l, i) => (
            <span key={`${locationLabel(l)}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-cvr-blue/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-cvr-blue-ink">
              <span className="max-w-[9rem] truncate">{locationLabel(l)}</span>
              <button type="button" onClick={() => remove(i)} aria-label="Gỡ khu vực" className="text-cvr-blue/60 transition hover:text-cvr-blue-ink">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Breadcrumb tầng đang duyệt */}
      <div className="mb-2 flex flex-wrap items-center gap-0.5 text-xs">
        {/* eslint-disable-next-line react-hooks/static-components -- Crumb có từ trước */}
        <Crumb active={!prov} onClick={() => { setProv(""); setDist(""); setQ(""); }}>Toàn quốc</Crumb>
        {/* eslint-disable-next-line react-hooks/static-components -- Crumb có từ trước */}
        {prov && <><span className="text-cvr-faint">›</span><Crumb active={!dist} onClick={() => { setDist(""); setQ(""); }}>{prov}</Crumb></>}
        {dist && <><span className="text-cvr-faint">›</span><span className="max-w-[8rem] truncate px-1.5 py-0.5 font-semibold text-cvr-ink">{dist}</span></>}
      </div>

      {/* Thêm nhanh cả tỉnh / cả quận đang duyệt */}
      {prov && !full && (
        <button
          type="button"
          onClick={() => add(dist ? { province: prov, district: dist } : { province: prov })}
          className="mb-2 w-full rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.06] px-2.5 py-1.5 text-left text-xs font-medium text-cvr-blue-ink transition hover:bg-cvr-blue/15"
        >
          ＋ Thêm cả {dist || prov}
        </button>
      )}

      {/* Lọc nhanh trong tầng hiện tại — kính lúp kiểu Google */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={level === "province" ? "Tìm tỉnh/thành…" : level === "district" ? "Tìm quận/huyện…" : "Tìm phường/xã…"}
          aria-label="Lọc nhanh khu vực"
          className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] pl-9 pr-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
      </div>

      {/* Danh sách bấm chọn */}
      <div className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
        {full && <p className="px-2 py-2 text-center text-xs font-medium text-cvr-blue-ink">Đã đạt tối đa {MAX_LOCATIONS} khu vực</p>}
        {filtered.length === 0 && <p className="px-2 py-3 text-center text-sm text-cvr-faint">Không có kết quả</p>}
        {filtered.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => pick(name)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-cvr-ink/80 transition hover:bg-black/5"
          >
            <span className="truncate"><HighlightLabel label={name} q={q} /></span>
            {level !== "ward" ? <span className="shrink-0 text-cvr-faint">›</span> : <span className="shrink-0 text-[11px] text-cvr-faint">＋ Thêm</span>}
          </button>
        ))}
      </div>

      {/* ── HÀNG THAO TÁC — luôn nhìn thấy ở đáy panel ──────────────────────────
          Trước đây chọn xong không có nút nào để đóng, phải bấm ra ngoài mới thoát;
          cũng không có cách bỏ hết khu vực đã chọn ngoài việc gỡ từng chip. */}
      {/* Hàng nút ĐỒNG BỘ mọi bảng lọc: Đặt lại · Áp dụng (chủ dự án 20/10/2026) */}
      <PanelActions onReset={() => { onChange([]); setProv(""); setDist(""); setQ(""); }} onApply={() => onClose?.()} />
    </div>
  );
}

// Danh sách dự án — LỌC ĐỘNG theo khu vực đã chọn (kiểu Batdongsan): chọn Đà Nẵng
// → chỉ hiện dự án Đà Nẵng. Chưa chọn khu vực → hiện tất cả.
export function ProjectPanel({
  locations, project, onPick,
}: {
  locations: LocationSel[];
  project: string;
  onPick: (name: string) => void;
}) {
  const [q, setQ] = useState("");
  const inArea = (loc: string) =>
    locations.length === 0 ||
    locations.some((l) => loc.includes(l.province) && (!l.district || loc.includes(l.district)) && (!l.ward || loc.includes(l.ward)));
  const base = projects.filter((p) => inArea(p.location));
  const nq = normalizeVi(q);
  const list = nq ? base.filter((p) => normalizeVi(`${p.name} ${p.location} ${p.developer}`).includes(nq)) : base;

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
          className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] pl-9 pr-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
      </div>
      <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
        {list.length === 0 && (
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
              <span className="truncate font-medium">{active ? p.name : <HighlightLabel label={p.name} q={q} />}</span>
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
  unit, step, sliderMax, min, max, presets, onPick, onReset, onApply,
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
        />
        <input
          className="cvr-range absolute left-0 top-0 h-5 w-full"
          type="range" min={0} max={sliderMax} step={step} value={hi}
          aria-label={`Tối đa (${unit})`}
          onChange={(e) => onSlide(lo, Math.max(Number(e.target.value), lo))}
        />
      </div>

      {/* Ô nhập khoảng tuỳ chỉnh */}
      <div className="flex items-center gap-2">
        {/* type="text" chứ KHÔNG "number": trình duyệt loại bỏ dấu phẩy nên gõ
            "4,2" là ô trống trơn. Hàm commit() đã hiểu cả dấu phẩy lẫn dấu chấm. */}
        <input
          type="text" inputMode="decimal" placeholder="Tối thiểu"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
        <span className="text-cvr-faint">–</span>
        <input
          type="text" inputMode="decimal" placeholder="Tối đa"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
        <span className="shrink-0 text-xs text-cvr-faint">{unit}</span>
      </div>

      {/* Khoảng có sẵn */}
      <div className="mt-3 max-h-52 space-y-0.5 overflow-y-auto">
        {presets.map((p) => {
          const active = min === p.min && (max ?? null) === (p.max ?? null);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDraftMin(String(p.min));
                setDraftMax(p.max == null ? "" : String(p.max));
                onPick(p.min, p.max);
              }}
              className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                active ? "bg-cvr-blue/10 font-medium text-cvr-blue-ink" : "text-cvr-ink/75 hover:bg-black/5"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <PanelActions
        onReset={() => { setDraftMin(""); setDraftMax(""); onReset(); }}
        onApply={onApply}
      />
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
