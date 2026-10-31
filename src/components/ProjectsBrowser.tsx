"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { batDauTim, xongTim } from "@/components/VachTim";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNutQuayLai } from "@/lib/khoaCuon";
import { useSoMoiTrang } from "@/lib/useSoMoiTrang";
import PhanTrang from "@/components/PhanTrang";
import Image from "next/image";
import { chuThuan } from "@/lib/chuThuan";
import AnhChay from "@/components/AnhChay";
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
import type { DiemBanDo } from "@/components/MapViewGoogle";
import type { Project, Article } from "@/lib/data";
import type { DongTraCuu } from "@/lib/traCuuDuAn";
import { locTraCuu, nhomLoai } from "@/components/TraCuuDuAn";
import { useHomeSection } from "@/components/HomeExpand";
import { sortProjectsByTier } from "@/components/ProjectSlider";
import NhanTinhTrang, { capVip } from "@/components/NhanTinhTrang";
import { giaTriThat, loaiHinhThe } from "@/lib/truongDuAn";
import { khuVucList, khuVucTrongDiem, slugKhuVuc } from "@/lib/khuVuc";
import { duAnThuocNhom, projectCategories } from "@/lib/categories";
import { nhomChuDauTu } from "@/lib/chuDauTu";

// Bản đồ chỉ chạy phía client (Leaflet đụng tới window) — nạp động, không SSR.
const MapView = dynamic(() => import("@/components/MapViewMo"), { ssr: false });

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
// MỘT THẺ CHO MỌI DỰ ÁN TRONG DANH SÁCH (chủ dự án 30/10/2026: "thẻ mục tra cứu phải thống nhất"): dự án tra cứu vẽ bằng chính thẻ
// ngang đang chạy của dự án nổi bật — cùng ảnh, nhãn trạng thái, tên, ghim địa chỉ, loại hình, chủ đầu tư; trường bắt buộc chưa có
// thông tin ghi "Đang cập nhật"; chưa có giá thì không có dòng giá, chưa có ảnh thì khung xám + biểu tượng
const CHUA = "Đang cập nhật";
const duAnTuTraCuu = (d: DongTraCuu): Project => ({
  slug: d.slug, name: d.ten, location: d.diaChi, priceFrom: "", type: d.loaiHinh || CHUA, status: d.tinhTrang || CHUA,
  image: d.anh, developer: d.chuDauTu || CHUA, scale: [], amenities: [], overview: [],
});

const BIEU_TUONG: Record<string, string> = {
  ghim: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  loai: "M3 21h18M5 21V7l7-4 7 4v14M9 9h1m-1 4h1m4-4h1m-1 4h1M10 21v-4h4v4",
  trangthai: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  cdt: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};
// Một dòng thông tin dưới tên dự án: biểu tượng + nội dung (thẻ dự án dùng chung)
function DongThe({ icon, gt, chua }: { icon: string; gt: string; chua?: string }) {
  return (
    <p className="flex min-w-0 items-start gap-1.5 text-[13px] leading-snug">
      <svg className="mt-px h-3.5 w-3.5 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d={BIEU_TUONG[icon]} /></svg>
      {/* NỘI DUNG DÀI (địa chỉ đầy đủ số nhà, đường, phường, tỉnh là BẮT BUỘC): luôn hiện đủ, xuống dòng — không cắt "…" */}
      <span title={gt || undefined} className={`min-w-0 sm:truncate ${gt ? "text-cvr-body" : "text-cvr-faint"}`}>{gt || chua}</span>
    </p>
  );
}

// Một dòng có nhãn dưới tên dự án: "Nhãn: nội dung" — nhãn đậm, chưa có thì "Đang cập nhật" mờ hơn
function DongNhan({ nhan, gt }: { nhan: string; gt: string }) {
  return (
    <p title={gt || undefined} className="min-w-0 text-[13px] leading-snug text-cvr-body sm:truncate">
      <span className="font-semibold text-cvr-ink">{nhan}:</span> <span className={gt ? "" : "text-cvr-faint"}>{gt || CHUA}</span>
    </p>
  );
}

// CHIA TRANG THEO CHIỀU CAO THẺ (chủ dự án 30/10/2026: trang toàn tra cứu thẻ nhỏ thì nhiều dự án hơn, có nổi bật thì ít hơn) —
// mỗi trang 10 suất (= 10 thẻ nổi bật), tính theo phần sáu suất cho khỏi lẻ, theo chiều cao THẬT của thẻ trên từng màn hình:
//  · máy tính: nổi bật cao 178 = 6 · tra cứu cao 109 = 4 → toàn tra cứu 15 dự án / trang
//  · điện thoại (31/10/2026 — thẻ tra cứu xếp như nổi bật, chưa có ảnh thì bỏ khung): nổi bật 331 = 6 · tra cứu có ảnh 299 = 5 ·
//    tra cứu chưa ảnh 163 = 3 → các trang dài xấp xỉ nhau dù trộn loại nào
const SUAT_TRANG = 60;
function chiaTrangDuAn<T extends object>(ds: T[], dt = false): T[][] {
  const trang: T[][] = [[]];
  let dung = 0;
  for (const x of ds) {
    const coAnh = "traCuu" in x && !!(x as { traCuu: { anh?: string } }).traCuu.anh;
    const suat = "noiBat" in x ? 6 : !dt ? 4 : coAnh ? 5 : 3;
    if (dung + suat > SUAT_TRANG && trang[trang.length - 1].length) { trang.push([]); dung = 0; }
    trang[trang.length - 1].push(x);
    dung += suat;
  }
  return trang;
}

const ALL = "Tất cả";

// Đếm số dự án theo từng giá trị của 1 tiêu chí
function countBy(projects: Project[], key: (p: Project) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const p of projects) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
  return [...m];
}


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

export default function ProjectsBrowser({
  projects,
  articles,
  hero,
  tieuDePhu = false,
  tieuDe = "Dự án nổi bật",
  traCuu,
  danhSachNoiBat = false,
  tieuDeDs = "Dự án nổi bật",
}: {
  projects: Project[];
  articles: Article[];
  /** Trang cha đã có <h1> riêng (trang danh mục / khu vực dự án) → tiêu đề ở đây là h2,
   *  mỗi trang chỉ MỘT thẻ h1 (SEO, rà 08/10/2026). */
  tieuDePhu?: boolean;
  /** Tiêu đề khối danh sách — /du-an "Dự án nổi bật", /du-an/tra-cuu "Tra cứu dự án…" */
  tieuDe?: string;
  // Banner Hero — nhận từ trang cha để đặt ĐÚNG thứ tự: mobile nằm DƯỚI thanh lọc,
  // desktop nằm TRÊN (dùng CSS order, không đổi cấu trúc dữ liệu).
  hero?: React.ReactNode;
  /** Trang Dự án (/du-an, chủ dự án 29/10/2026): có danh bạ → trái TRA CỨU DỰ ÁN (mọi dự án), phải DỰ ÁN NỔI BẬT (projects);
   *  một bộ tìm + lọc áp cả hai. Không truyền (trang loại hình, trang tỉnh) → bố cục cũ. */
  traCuu?: DongTraCuu[];
  /** "Xem thêm" khối Dự án nổi bật TRANG CHỦ (30/10/2026): cùng một logic với "Xem thêm" ở trang Dự án — danh sách thẻ Dự án
   *  nổi bật (Tên · Địa chỉ · Loại hình · Chủ đầu tư), 10 dự án / trang; nút Quay lại do khối trang chủ lo (HomeExpand). */
  danhSachNoiBat?: boolean;
  /** Tiêu đề danh sách "Xem thêm" (trang chủ: "Dự án nổi bật"; trang dự án: "Dự án tương tự") */
  tieuDeDs?: string;
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  // Điện thoại (< 640 px): chia trang theo chiều cao thẻ điện thoại (chiaTrangDuAn)
  const [dienThoai, setDienThoai] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const doi = () => setDienThoai(mq.matches);
    doi();
    mq.addEventListener("change", doi);
    return () => mq.removeEventListener("change", doi);
  }, []);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // Nút Quay lại điện thoại đóng màn tìm, không rời trang (hàm chung, 22/10/2026); bấm dự án để sang trang → boQuaLui.
  const boQuaLui = useNutQuayLai(overlay, () => setOverlay(false));
  const overlayInputRef = useRef<HTMLTextAreaElement | null>(null);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Có danh bạ Tra cứu → lựa chọn lọc lấy từ MỌI dự án (danh bạ chứa cả dự án nổi bật)
  const nguonDem = (k1: (p: Project) => string, k2: (d: DongTraCuu) => string): [string, number][] => {
    if (!traCuu) return countBy(projects, k1);
    const m = new Map<string, number>();
    for (const d of traCuu) { const k = k2(d); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m];
  };
  const provinceCounts = nguonDem((p) => provinceOf(p.location), (d) => d.tinh);
  const typeCounts = nguonDem((p) => typeOf(p.type), (d) => nhomLoai(d.loaiHinh));
  const statusCounts = nguonDem((p) => p.status, (d) => d.tinhTrang);
  // Danh sách tỉnh theo hệ đã chọn, chỉ giữ tỉnh có dự án (kèm số đếm). Rỗng → dùng nguyên data.
  const provCountMap = new Map(provinceCounts);
  const provinceOpts: [string, number][] =
    provinceNamesFor(geoMode).filter((n) => provCountMap.has(n)).map((n) => [n, provCountMap.get(n)!]);
  const provinceOptions = provinceOpts.length ? provinceOpts : provinceCounts;

  // TÌM KIẾM THEO TRƯỜNG — DÙNG CHUNG một luật với Mua bán / Cho thuê:
  // bóc tách câu dài → xếp 3 tầng (khớp đủ → gần đúng → liên quan) → không bao
  // giờ ra màn hình trống. Khu vực + Loại hình là 2 trường GIỮ khi nới lỏng.
  // Dự án nổi bật luôn xếp theo cấp VIP (Kim cương → Vàng → Bạc → thường) ở MỌI trang (trang Dự án, khu vực, loại hình, chủ đầu tư,
  // trang chủ) — chủ dự án 30/10/2026; dự án tra cứu xếp theo tên A, B, C (dongTraCuu)
  const xepVip = useMemo(() => sortProjectsByTier(projects), [projects]);
  const hits = searchAny(xepVip, q, {
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
    batDauTim(); xongTim(); // lọc tại chỗ: kết quả có ngay — vạch chung hiện tối thiểu 0,6 giây
    window.setTimeout(() => setDangTim(false), 700);
    // đợi overlay đóng xong mới cuộn, nếu không phần tử còn bị che
    window.setTimeout(cuonToiKetQua, 60);
  };

  // Phân trang danh sách dự án: 9 dự án/trang (khớp yêu cầu "8–10/trang").
  useSoMoiTrang();
  const [page, setPage] = useState(1);
  // CHẾ ĐỘ BẢN ĐỒ cho tab Dự án — giống Mua bán / Cho thuê, marker là TÊN DỰ ÁN.
  const [mapMode, setMapMode] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [q, status, province, type]); // đổi lọc → về trang 1
  // TRANG DỰ ÁN = BỐ CỤC WEB CŨ + THÊM TRA CỨU (chủ dự án 30/10/2026: "PC để như cũ, chỉ thêm vào"): một danh sách — dự án nổi bật
  // theo cấp VIP trước (thẻ ngang đang chạy), rồi dự án tra cứu theo tên A, B, C (thẻ tra cứu); thanh tìm + lọc áp chung cả hai
  const traCuuLoc = traCuu ? locTraCuu(traCuu, q, province, type, status, ALL) : [];
  const slugNoiBat = new Set(visible.map((p) => p.slug));
  const dsTrang: ({ noiBat: Project } | { traCuu: DongTraCuu })[] = [
    ...visible.map((p) => ({ noiBat: p })),
    ...traCuuLoc.filter((d) => !slugNoiBat.has(d.slug)).map((d) => ({ traCuu: d })),
  ];
  const cacTrang = chiaTrangDuAn(dsTrang, dienThoai);
  const totalPages = cacTrang.length;
  const current = Math.min(page, totalPages);
  const pageItems = cacTrang[current - 1];
  // Mở một dự án rồi BACK → về đúng trang danh sách + đúng chỗ đang xem (ghi vào bước lịch sử, giữ dữ liệu Next.js)
  const ghiTrang = (p: number, y?: number) =>
    window.history.replaceState({ ...(window.history.state ?? {}), clTrangDa: p, ...(y !== undefined ? { clYDa: y } : {}) }, "");
  useEffect(() => {
    const st = (window.history.state ?? {}) as { clTrangDa?: number; clYDa?: number };
    if (!st.clTrangDa) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(st.clTrangDa);
    if (st.clYDa) { const y = st.clYDa; requestAnimationFrame(() => window.scrollTo({ top: y })); window.setTimeout(() => window.scrollTo({ top: y }), 350); }
  }, []);
  // Dự án nổi bật: hàng trượt 8 dự án + "Xem thêm" (chuẩn chung HomeExpand): bấm → phần còn lại của trang ẩn, danh sách
  // Chia trang theo chiều cao thẻ (chiaTrangDuAn); nút Quay lại về như cũ.
  const noiBat = useHomeSection("du-an-noi-bat");
  const [trangNoiBat, setTrangNoiBat] = useState(1);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setTrangNoiBat(1); }, [q, status, province, type]); // đổi tìm / lọc → danh sách về trang 1
  // MỞ MỘT DỰ ÁN RỒI BACK → về đúng trang danh sách + đúng chỗ đang xem (30/10/2026): ghi số trang + vị trí cuộn vào bước lịch sử
  // của danh sách (giữ nguyên dữ liệu Next.js trong đó), quay lại thì đọc ra
  // Danh sách "Xem thêm" của khối Dự án nổi bật TRANG CHỦ (trang Dự án đã là danh sách)
  const dangMoDs = !!danhSachNoiBat;
  const ghiDs = (trang: number, y?: number) =>
    window.history.replaceState({ ...(window.history.state ?? {}), clTrang: trang, ...(y !== undefined ? { clYDs: y } : {}) }, "");
  useEffect(() => {
    if (!dangMoDs) return;
    const st = (window.history.state ?? {}) as { clTrang?: number; clYDs?: number };
    if (!st.clTrang) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrangNoiBat(st.clTrang);
    // cuộn hai nhịp: sau khi vẽ, và sau khi trình duyệt tự đặt lại vị trí lúc lùi trang
    if (st.clYDs) { const y = st.clYDs; requestAnimationFrame(() => window.scrollTo({ top: y })); window.setTimeout(() => window.scrollTo({ top: y }), 350); }
  }, [dangMoDs]);

  // Panel chọn 1 giá trị trong dropdown (không in số dự án — chủ dự án 09/10/2026)
  const optionList = (
    options: [string, number][],
    value: string,
    onPick: (v: string) => void,
    close: () => void
  ) => (
    <div className="space-y-0.5">
      {[[ALL, projects.length] as [string, number], ...options].map(([name]) => (
        <button
          key={name}
          type="button"
          onClick={() => { onPick(name); close(); batDauTim(); xongTim(); }}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
            value === name ? "bg-cvr-blue/10 font-medium text-cvr-blue-ink" : "text-cvr-ink/80 hover:bg-black/5"
          }`}
        >
          <span className="truncate">{name}</span>
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

  // Thẻ Dự án nổi bật (hàng trượt + lưới Xem thêm, trang /du-an và trang chủ): tình trạng · Tên · Địa chỉ · Loại hình · Chủ đầu tư
  // + giá — chủ dự án 29–30/10/2026; ảnh trên, chữ dưới, hiện đủ chữ.
  // THẺ DỰ ÁN NGANG ĐANG CHẠY TRÊN WEB (đã chốt — giữ nguyên nội dung: tình trạng · tên · giá + giá tham khảo · địa chỉ · loại hình +
  // giới thiệu · chủ đầu tư). Dùng chung: danh sách trang Dự án cũ + cột trái danh sách "Xem thêm" (chủ dự án 30/10/2026)
  // HAI KHỐI THẺ, MỖI KHỐI MỘT KIỂU CỐ ĐỊNH, ĐO SẴN (chủ dự án 30/10/2026: "cân đối ảnh – nội dung, đo đếm mà làm"):
  //  · Dự án nổi bật — máy tính: ảnh trái 256 × 158 px (tỷ lệ vàng 1,618), khối chữ cao đúng 158 px chia đều: tên · địa chỉ · loại hình ·
  //    trạng thái · chủ đầu tư (giá / "Liên hệ" cuối dòng) · giới thiệu 2 dòng. Điện thoại: ảnh trên 16:9, chữ dưới.
  //  · Dự án tra cứu (gon) — máy tính: ảnh trái 176 × 109 px (tỷ lệ vàng), khối chữ 5 dòng cao đúng 109 px. Điện thoại: ảnh trái
  //    96 px cao theo khối chữ. Không có khoảng trống dưới ảnh hay dưới chữ.
  //  · NỘI DUNG DÀI (tên 2 dòng, địa chỉ đầy đủ xuống dòng…): ảnh cao theo khối chữ (không nhỏ hơn số đo tỷ lệ vàng ở trên), chữ hiện đủ.
  const theDuAnWeb = (p: Project, gon = false) => (
        <Link
          href={`/du-an/${p.slug}`}
          className={`card-lux group relative flex overflow-hidden rounded-none bg-white shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45 sm:gap-5 sm:border sm:border-cvr-line sm:p-3 ${gon ? "flex-col border border-cvr-line sm:flex-row" : "flex-col sm:flex-row"}`}
        >
          <div className={gon
            // Điện thoại: BỐ TRÍ NHƯ THẺ NỔI BẬT — ảnh trên rộng hết thẻ, chữ hiện đủ bên dưới (chủ dự án 31/10/2026: câu dài thì ảnh trái
            // không cân được với chữ → "bố trí như nhau hết"; không cắt chữ). Máy tính giữ ảnh trái 176 × 109
            // Khung ảnh tra cứu THẤP hơn thẻ nổi bật: 5:2 (chủ dự án 31/10/2026: "cho cái khung nhỏ hơn")
            // Chưa có ảnh: điện thoại bỏ hẳn khung ảnh (chủ dự án 31/10/2026: "có ảnh thì hiển thị, không có thì bỏ"); máy tính giữ khung xám
            ? `relative aspect-[5/2] w-full shrink-0 overflow-hidden bg-cvr-surface sm:aspect-auto sm:min-h-[109px] sm:w-44 sm:self-stretch sm:rounded-xl ${p.image ? "" : "max-sm:hidden"}`
            : `relative w-full shrink-0 overflow-hidden bg-cvr-surface sm:aspect-auto sm:min-h-[178px] sm:w-72 sm:self-stretch sm:rounded-xl ${p.image ? "aspect-[16/9]" : "aspect-[3/1]"}`}>
            {/* Dự án nổi bật: tình trạng (tiến độ) ghi trên ảnh; thẻ không còn dòng Trạng thái (chủ dự án 30/10/2026) */}
            {/* Nhãn tình trạng chung mọi nơi (NhanTinhTrang, 31/10/2026): chỉ dự án VIP, màu theo cấp; còn lại ghi "Tiến độ" ở dòng cuối */}
            <NhanTinhTrang tier={p.tier} tinhTrang={giaTriThat(p.status)} />
            {p.image ? (
            <AnhChay
              chay={false}
              images={[p.image, ...(p.photos ?? [])]}
              alt={p.name}
              sizes={gon ? "(max-width:640px) 96px, 176px" : "(max-width:640px) 100vw, 288px"}
              className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/logo/symbol-dark.svg" alt="" className={`absolute inset-0 m-auto opacity-25 ${gon ? "h-7 w-7 sm:h-10 sm:w-10" : "h-12 w-12"}`} />
            )}
          </div>

          {/* Khung chữ CAO THEO NỘI DUNG, tối thiểu đúng số đo cũ (109 / 178 px); ảnh giãn theo — không cắt, không che tên (31/10/2026: thêm dòng
              Tiến độ làm khung cố định 109 px che mất tên — chủ dự án chụp màn hình) */}
          {/* Điện thoại (tra cứu): chữ hiện đủ dưới ảnh, đệm như thẻ nổi bật */}
          <div className={`flex min-w-0 flex-1 flex-col ${gon ? "p-3 sm:min-h-[109px] sm:p-0" : "p-3 sm:min-h-[178px] sm:p-0"}`}>
            {/* PC: KHUNG ẢNH CỐ ĐỊNH tỷ lệ vàng, chữ chỉnh theo khung — mỗi dòng 1 dòng, dài thì “…” (rê chuột thấy đủ), giới thiệu tối đa 2 dòng (chủ dự án 30/10/2026) */}
            <h3 title={p.name} className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:line-clamp-1 sm:text-lg">
              <Highlight text={p.name} terms={termsBySlug.get(p.slug) ?? []} />
            </h3>
            {/* Mọi dòng dưới tên một kiểu: biểu tượng + nội dung, cùng cỡ, cùng màu; chưa có thì "<trường> đang cập nhật" mờ hơn */}
            {/* Thẻ tra cứu: địa chỉ ĐẦY ĐỦ một dòng riêng; Loại hình một dòng; Tiến độ dòng cuối bên phải (KHÔNG ghi trên ảnh) — chủ dự án 30/10/2026 */}
            <div className="mt-2 space-y-1.5">
              <DongThe icon="ghim" gt={giaTriThat(p.location)} chua="Đang cập nhật" />
              {/* Mọi thẻ: chỉ dòng Vị trí có biểu tượng; các dòng khác ghi NHÃN ĐẬM có dấu hai chấm (chủ dự án 30/10/2026) */}
              {/* Loại hình: 1 dòng dài hết bề ngang thẻ, quá dài mới “…” ở cuối (chủ dự án 30/10/2026) */}
              <DongNhan nhan="Loại hình" gt={loaiHinhThe(p.type)} />
              {/* Tiến độ: thẻ VIP ở nhãn trên ảnh; thẻ thường một dòng ngay sau Loại hình — một chuẩn mọi thẻ dự án (31/10/2026) */}
              {!capVip(p.tier) && <DongNhan nhan="Tiến độ" gt={giaTriThat(p.status)} />}
            </div>
            {/* Điện thoại bỏ 2 dòng giới thiệu (chủ dự án 30/10/2026) */}
            {!gon && p.overview[0] && (
              <p className="mt-2.5 hidden text-[13px] leading-relaxed text-cvr-muted sm:line-clamp-2">{chuThuan(p.overview[0])}</p>
            )}
            {/* Chủ đầu tư + Liên hệ: dòng cuối thẻ, gạch ngang phía trên (chủ dự án 30/10/2026) */}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-cvr-line pt-2.5 sm:mt-auto">
              <DongNhan nhan="Chủ đầu tư" gt={giaTriThat(p.developer)} />
              {p.priceFrom && <span className="shrink-0 whitespace-nowrap text-sm font-semibold leading-snug text-cvr-gold-ink">{p.priceFrom}</span>}
            </div>
          </div>
        </Link>
  );

  // Cột phải: tỉnh có dự án (đếm cả dự án tra cứu khi có) → trang pSEO /du-an/<tỉnh>
  const demTinhLienKet = new Map<string, number>();
  for (const t of traCuu ? traCuu.map((d) => d.tinh) : projects.map((p) => provinceOf(p.location))) {
    if (t && khuVucList.some((k) => k.name === t)) demTinhLienKet.set(t, (demTinhLienKet.get(t) ?? 0) + 1);
  }
  const tinhLienKet = [...demTinhLienKet.entries()].sort((a, b) => b[1] - a[1]);
  const cotKhuVuc = (
    <>{tinhLienKet.length > 0 && (
    <aside className="hidden lg:col-span-1 lg:block">
      <div className="sticky top-24 rounded-none border border-cvr-line bg-white p-5 shadow-lux">
        <h3 className="text-sm font-semibold tracking-tight text-cvr-ink">Dự án theo khu vực</h3>
        <div className="mt-3 flex flex-col">
          {tinhLienKet.map(([ten, so]) => (
            <Link
              key={ten}
              href={`/du-an/${slugKhuVuc(ten)}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink"
            >
              <span>Dự án tại {ten}</span>
              <span className="text-xs text-cvr-muted">{so}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
    )}</>
  );

  // Đã bấm "Xem thêm" ở Dự án nổi bật → danh sách theo trang thay cho các khối slide (Quay lại về như cũ). THANH TÌM + LỌC LUÔN
  // HIỆN phía trên danh sách (chủ dự án 30/10/2026: trang Dự án có thêm Tra cứu → trang nào cũng tìm, lọc được)
  let danhSachXemThem: React.ReactNode = null;
  if (dangMoDs) {
    // "Xem thêm" của Dự án nổi bật (trang chủ + trang Dự án) ra MỘT danh sách theo thứ tự (chủ dự án 30/10/2026): dự án nổi bật
    // trước (thẻ ngang đang chạy trên web), rồi dự án tra cứu (thẻ tra cứu). Cùng bộ lọc đang chọn.
    const noiBatSlug = new Set(visible.map((p) => p.slug));
    const dsChung: ({ noiBat: Project } | { traCuu: DongTraCuu })[] = [
      ...visible.map((p) => ({ noiBat: p })),
      ...(traCuu ? traCuuLoc.filter((d) => !noiBatSlug.has(d.slug)).map((d) => ({ traCuu: d })) : []),
    ];
    const trangChung = chiaTrangDuAn(dsChung, dienThoai);
    const tongNB = trangChung.length;
    const trangNB = Math.min(trangNoiBat, tongNB);
    danhSachXemThem = (
      <section id="noi-bat" className={`mt-6 scroll-mt-24 sm:mt-5 ${mapMode ? "hidden" : ""}`}>
        {/* Trang Dự án / trang khu vực đã có tiêu đề trang ngay trên → không lặp; trang chủ: tiêu đề khối "Dự án nổi bật" */}
        {/* Điện thoại ẩn dòng tiêu đề (chủ dự án 31/10/2026) — vẫn trong HTML cho Google */}
        {danhSachNoiBat && <h2 className="sr-only text-xl font-semibold tracking-tight text-cvr-ink sm:not-sr-only sm:text-2xl">{tieuDeDs}</h2>}
        {/* BỐ CỤC WEB HIỆN TẠI (chủ dự án 30/10/2026): CỘT TRÁI = danh sách thẻ, MỖI DỰ ÁN ĐÚNG LOẠI THẺ CỦA NÓ — nổi bật: thẻ nổi bật
            (ngang); tra cứu: thẻ tra cứu · CỘT PHẢI = liên kết pSEO "Dự án theo khu vực" (/du-an/<tỉnh>), dính theo khi cuộn — máy tính */}
        <div className={`${danhSachNoiBat ? "mt-4" : ""} grid grid-cols-1 gap-8 lg:grid-cols-3`}>
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-4 sm:gap-5" onClickCapture={() => ghiDs(trangNB, window.scrollY)}>
              {trangChung[trangNB - 1].map((x) =>
                "noiBat" in x
                  ? <div key={x.noiBat.slug}>{theDuAnWeb(x.noiBat)}</div>
                  : <div key={x.traCuu.slug}>{theDuAnWeb(duAnTuTraCuu(x.traCuu), true)}</div>,
              )}
            </div>
            <PhanTrang hienTai={trangNB} tong={tongNB} doiTrang={(p) => { setTrangNoiBat(p); ghiDs(p, 0); window.scrollTo({ top: 0 }); }} />
          </div>
          {cotKhuVuc}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero banner — MOBILE nằm DƯỚI thanh lọc (mẫu Batdongsan), DESKTOP nằm TRÊN.
          Âm lề để banner tràn hết bề ngang, không bị lề trang bó lại. */}
      {hero && !(noiBat.expanded || danhSachNoiBat) && (
        // Tràn viền THẬT: kéo ra full bề ngang màn hình, không bị khung max-w-7xl bó lại
        // (trước đây Hero nằm ngoài khung nên full màn hình — phải giữ đúng như vậy trên PC).
        <div className="relative left-1/2 order-2 mb-0 w-screen -translate-x-1/2 sm:order-1 sm:mb-0">
          {hero}
        </div>
      )}

      {/* ── Thanh tìm + lọc dự án (MOBILE: lên trên cùng, KHÔNG khung viền/bóng, rộng hết bề ngang) ── */}
      {/* Máy tính: thanh tìm gọn trong CỘT DỰ ÁN bên trái (= lg:col-span-2 của lưới 3 cột, khe 32px) — chủ dự án 18/10/2026 */}
      {/* 25/10/2026: máy tính CÙNG KIỂU thanh tìm Mua bán / Cho thuê — không khung viền, không bóng, gạch mảnh phía dưới, cách Hero 16px */}
      {/* Trang Dự án có Tra cứu (29/10/2026): không còn cột phải → thanh tìm rộng hết khung, thẳng mép với Nổi bật + Tra cứu */}
      <div id="tra-cuu" className={`order-1 mt-2 scroll-mt-24 rounded-none bg-white pb-2.5 pt-0 sm:order-2 sm:mt-4 sm:border-b sm:border-cvr-line sm:pb-4 lg:w-[calc(66.667%-10.667px)]`}>
        <div className="flex flex-col gap-2 sm:gap-3">{/* máy tính 2 hàng như Mua bán: ô tìm rộng · hàng lọc dưới (25/10/2026) */}
          {/* Ô tìm nhanh dự án — nút search XANH nằm SÁT mép phải trong khung (mobile), đồng bộ Mua bán/Cho thuê.
              MOBILE: chừa lề trái đúng chỗ NÚT BACK TRÒN nổi (8px + 36px) để nút đứng
              CẠNH ô tìm thành một hàng, không đè lên chữ gợi ý đang chạy. */}
          <div className="flex flex-1 items-center gap-2">
          <div ref={sugBoxRef} className="relative flex-1">
            {/* Kính lúp hiện cả điện thoại — đồng bộ ô tìm Mua bán / Cho thuê (chủ dự án 20/10/2026) */}
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-cvr-muted sm:left-3 sm:h-4 sm:w-4 sm:text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
              placeholder={sugOpen ? "Tìm dự án…" : goiYChay} // đã chạm ô → chữ chạy dừng
              aria-label="Tìm nhanh dự án"
              enterKeyHint="search"
              className="h-9 w-full rounded-full bg-cvr-surface pl-10 pr-10 sm:h-12 sm:rounded-xl sm:pr-32 text-[15px] text-cvr-ink placeholder-cvr-faint ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-cvr-blue/50 focus:placeholder:text-transparent sm:h-10 sm:rounded-xl sm:border sm:border-transparent sm:pl-9 sm:pr-[8.5rem] sm:ring-0 sm:focus:border-cvr-line sm:focus:bg-white"
            />
            {/* Nút xoá nhanh (×) — đồng bộ với ô tìm Mua bán/Cho thuê */}
            {q.trim().length > 0 && (
              <button
                type="button"
                aria-label="Xoá tìm kiếm"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/5 hover:text-cvr-ink active:scale-95 sm:right-[8.25rem]"
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
              className="absolute bottom-1.5 right-1.5 top-1.5 hidden items-center justify-center gap-2 rounded-lg bg-cvr-blue px-6 text-[14px] font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95 sm:flex"
            >
              {dangTim && <SpinnerDuAn size={16} />}
              {dangTim ? "Đang tìm…" : "Tìm kiếm"}
            </button>

            {/* (Bỏ nút kính lúp xanh trên điện thoại 18/10/2026 — chủ dự án: bàn phím đã có phím Tìm khi chạm ô) */}
          </div>
          {/* MÁY TÍNH: "Xem bản đồ" đứng SÁT ô tìm, cùng chiều cao — như Mua bán / Cho thuê (chủ dự án 25/10/2026). Điện thoại giữ nút cạnh tiêu đề. */}
          <button
            type="button"
            onClick={() => setMapMode((v) => !v)}
            aria-pressed={mapMode}
            className={`hidden h-12 shrink-0 items-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white transition sm:inline-flex ${mapMode ? "bg-cvr-blue-ink" : "bg-cvr-blue hover:bg-cvr-blue-ink"}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5l6 2.4 5-2.4v14.4l-5 2.4-6-2.4-5 2.4V4.9l5-2.4v16.8" />
            </svg>
            {mapMode ? "Xem danh sách" : "Xem bản đồ"}
          </button>
          </div>

          {/* Chip lọc: Khu vực · Loại hình · Trạng thái.
              MOBILE: ẨN ở đây — chuyển vào TRANG TÌM toàn màn hình (bấm nút tìm kiếm),
              đúng kiểu bộ lọc trang chủ mobile. DESKTOP: giữ nguyên tại chỗ. */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5 lg:overflow-visible">
            {/* Nút "Làm mới" (xoá hết lọc) Ở ĐẦU HÀNG TRƯỜNG LỌC trên điện thoại — ngay cạnh các trường vừa chọn (chủ dự án 18/10/2026) */}
            {hasActive && (
              <button type="button" aria-label="Làm mới" title="Làm mới" onClick={reset} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-blue-ink transition active:scale-90 active:bg-cvr-surface sm:hidden">{/* Làm mới = BIỂU TƯỢNG đậm ở đầu hàng lọc (chủ dự án 20/10/2026) */}<svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018 17.4M18.4 9A7 7 0 006 6.6" /></svg></button>
            )}
            {chipLoc}
          </div>

        </div>
      </div>

      {/* ── MOBILE: trang tìm dự án TOÀN MÀN HÌNH — back + × + nút Search (đồng bộ Mua bán) ── */}
      {overlay && (
        // z-[80]: phủ header (z-50) + thanh tab đáy (z-40) nhưng THẤP hơn sheet
        // của nút lọc (z-100) để bảng chọn Khu vực/Loại hình/Trạng thái mở đè lên được.
        <div className="fixed inset-0 z-[80] flex flex-col bg-white sm:hidden">
          <div className="flex items-center gap-1 border-b border-cvr-line px-2 py-1.5">
            {/* Nút ← và ô gõ cùng cỡ màn tìm Mua bán / Cho thuê (chủ dự án 20/10/2026) */}
            <button
              type="button"
              aria-label="Đóng tìm kiếm"
              onClick={() => setOverlay(false)}
              className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-cvr-ink active:bg-cvr-surface"
            >
              <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="relative flex-1">
              {/* ĐÚNG CHUẨN ô gõ màn tìm trang chủ: chữ 16, bo 18, viền xanh; từ khoá DÀI thì ô TỰ GIÃN thêm dòng (chủ dự án 20/10/2026) */}
              <textarea
                ref={(el) => {
                  overlayInputRef.current = el;
                  gianO(el); // như ô gõ trang chủ: ô trống cao tự nhiên một dòng, chỉ đo khi có chữ
                }}
                autoFocus
                rows={1}
                value={q}
                onChange={(e) => setQ(e.target.value.split("\n").join(" "))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); chayTim(); } }}
                onFocus={(e) => { const o = e.currentTarget; o.setSelectionRange(o.value.length, o.value.length); }}
                placeholder="Tìm dự án…" // màn tìm đã mở: chữ gợi ý KHÔNG chạy (chủ dự án 18/10/2026)
                aria-label="Tìm dự án"
                enterKeyHint="search"
                className="no-scrollbar block max-h-[112px] min-h-[36px] w-full resize-none overflow-y-auto rounded-[18px] border border-transparent bg-cvr-surface py-[5px] pl-4 pr-10 text-[16px] leading-6 text-cvr-ink placeholder-cvr-faint outline-none ring-2 ring-cvr-blue/40 focus:placeholder:text-transparent"
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
            {/* (Bỏ nút kính lúp tròn 18/10/2026 — chủ dự án; tìm bằng phím Tìm của bàn phím) */}
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
                  onClick={() => { boQuaLui(); setOverlay(false); }}
                  className="flex flex-col rounded-lg px-2.5 py-2.5 active:bg-cvr-surface"
                >
                  <span className="text-sm font-medium text-cvr-ink">{p.name}</span>
                  <span className="text-[12px] text-cvr-faint">{giaTriThat(p.location)}</span>
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
      {/* TIÊU ĐỀ + HÀNG NÚT cùng bố cục, cùng cỡ với trang Mua bán / Cho thuê (chủ dự án 18/10/2026: đồng bộ 3 tab):
          tiêu đề trái · Xem bản đồ + Xoá lọc phải (máy tính); điện thoại xuống dòng dưới tiêu đề */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:mt-5">{/* máy tính cùng nhịp Mua bán: gạch → tiêu đề 20px, tiêu đề cỡ chữ như Mua bán (25/10/2026) */}
        {/* Trang pSEO (loại hình, tỉnh, chủ đầu tư) có Tra cứu: h1 + mô tả ở trang cha, khối Nổi bật / Tra cứu có tiêu đề riêng →
            không vẽ thêm tiêu đề ở đây (30/10/2026) */}
        {/* Danh sách Xem thêm trang chủ: không vẽ tiêu đề trang (trang chủ đã có h1) — danh sách có tiêu đề khối riêng */}
        {!(traCuu && tieuDePhu) && !danhSachNoiBat && (
        <div className="min-w-0">
          {tieuDePhu ? (
            <h2 className="sr-only text-xl font-semibold tracking-tight text-cvr-ink sm:not-sr-only sm:text-2xl">{tieuDe}</h2>
          ) : (
            // Điện thoại ẩn dòng "Dự án bất động sản" — thanh "‹ Dự án" đã ghi tên (chủ dự án 31/10/2026); vẫn là H1 cho Google
            <h1 className="sr-only text-xl font-semibold tracking-tight text-cvr-ink sm:not-sr-only sm:text-2xl">{tieuDe}</h1>
          )}
          <p className="mt-1 text-sm text-cvr-muted">
            {/* Coastal Land là CỔNG THÔNG TIN — không phân phối, không mua bán dự án. */}
            Dự án căn hộ, khu đô thị và nghỉ dưỡng đang được cập nhật trên Coastal Land.
          </p>
        </div>
        )}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setMapMode((v) => !v)}
            aria-pressed={mapMode}
            className={`mr-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-white transition sm:hidden ${
              mapMode ? "bg-cvr-blue-ink" : "bg-cvr-blue hover:bg-cvr-blue-ink"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5l6 2.4 5-2.4v14.4l-5 2.4-6-2.4-5 2.4V4.9l5-2.4v16.8" />
            </svg>
            {mapMode ? "Xem danh sách" : "Xem bản đồ"}
          </button>
          {hasActive && (
            <button
              type="button"
              onClick={reset}
              className="hidden items-center gap-1.5 rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium sm:inline-flex text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* ═══ CHẾ ĐỘ BẢN ĐỒ ═══ marker là TÊN DỰ ÁN, bấm ra thẻ mini dẫn tới trang
          dự án. Có nút "Vị trí của tôi" ngay trên bản đồ, kéo một ngón. */}
      {mapMode && (
        <div className="mt-4 overflow-hidden rounded-xl border border-cvr-line">
          <div className="h-[62vh] min-h-[380px] w-full">
            <MapView
              diem={[...visible.map((p): DiemBanDo => {
                const [lat, lng] = coordOf(p.location, p.slug);
                return {
                  id: p.slug,
                  lat,
                  lng,
                  // Toạ độ đã tra sẵn theo đúng địa chỉ dự án (như bản đồ trang dự án) — MapViewMo thay vào khi có.
                  ma: `du-an:${p.slug}`,
                  q: p.location,
                  nhan: p.name,
                  title: p.name,
                  phu: [p.priceFrom, giaTriThat(p.status)].filter(Boolean).join(" · "),
                  loc: p.location,
                  image: p.image,
                  href: `/du-an/${p.slug}`,
                };
              }),
              // Dự án tra cứu (30/10/2026): bản đồ có đủ mọi dự án trong danh sách đang lọc, không chỉ dự án nổi bật
              ...traCuuLoc.filter((d) => !slugNoiBat.has(d.slug)).map((d): DiemBanDo => {
                const [lat, lng] = coordOf(d.diaChi, d.slug);
                return { id: d.slug, lat, lng, ma: `du-an:${d.slug}`, q: d.diaChi, nhan: d.ten, title: d.ten, phu: d.tinhTrang || d.loaiHinh, loc: d.diaChi, image: d.anh, href: `/du-an/${d.slug}` };
              })]}
            />
          </div>
          <p className="border-t border-cvr-line bg-cvr-surface px-3 py-2 text-xs text-cvr-muted">

            Bấm vào tên dự án để xem nhanh.
          </p>
        </div>
      )}

      {dangMoDs ? danhSachXemThem : (
      <div className={`mt-6 grid grid-cols-1 gap-8 sm:mt-3 lg:grid-cols-3 ${mapMode ? "hidden" : ""}`}>
        {/* ── Cột chính: thẻ dự án ngang ── */}
        <div className="lg:col-span-2">
          {/* Nhãn TẦNG kết quả — giống trang Mua bán / Cho thuê */}
          {hasActive && pageItems.length > 0 && "noiBat" in pageItems[0] && (() => {
            const t = tierBySlug.get(pageItems[0].noiBat.slug) ?? 1;
            return t === 1 ? null : <p className="mb-3 text-sm font-medium text-cvr-body">{TIER_LABEL[t]}</p>;
          })()}
          <div id="noi-bat" className="reveal is-visible cards-stagger flex scroll-mt-24 flex-col gap-5" onClickCapture={() => ghiTrang(current, window.scrollY)}>
            {pageItems.map((x) =>
              "noiBat" in x
                ? <Fragment key={x.noiBat.slug}>{theDuAnWeb(x.noiBat)}</Fragment>
                : <Fragment key={x.traCuu.slug}>{theDuAnWeb(duAnTuTraCuu(x.traCuu), true)}</Fragment>,
            )}

            {dsTrang.length === 0 && (
              <p className="rounded-none border border-cvr-line bg-cvr-surface p-10 text-center text-sm text-cvr-muted">
                Chưa có dự án phù hợp bộ lọc. Hãy đổi từ khoá hoặc bấm &ldquo;Xoá lọc&rdquo;.
              </p>
            )}
          </div>

          {/* Phân trang dự án — mỗi trang 9 (đích của nút "Xem thêm" ở trang chủ) */}
          <PhanTrang
              hienTai={current}
              tong={totalPages}
              doiTrang={(p) => { setPage(p); ghiTrang(p, 0); window.scrollTo({ top: 0 }); }}
            />
        </div>

        {/* ── Sidebar: lọc theo khu vực + tin tức (kiểu Batdongsan) ── */}
        {/* Điện thoại: thanh lọc trên đầu đã có "Khu vực" → khối lọc khu vực này chỉ ở máy tính (cột bên) — 22/10/2026 */}
        <aside className="hidden lg:col-span-1 lg:block">
          {/* CỘT PHẢI CHUẨN TÌM KIẾM + SEO (chủ dự án 30/10/2026): lọc khu vực (có số) · loại hình → /du-an/<loại> · chủ đầu tư →
              /chu-dau-tu/<tên> · dự án mới cập nhật — toàn liên kết tới trang đã có, khối nào không có dữ liệu thì ẩn. Không dính khi cuộn
              (cột dài hơn màn hình). */}
          <div className="space-y-5">
            <div className="rounded-none border border-cvr-line bg-white p-5 shadow-lux">
              <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Lọc theo khu vực</h2>
              <div className="mt-3 flex flex-col">
                {/* ĐỦ MỌI KHU VỰC CỦA WEB (chủ dự án 30/10/2026: "khu vực trên web có mấy khu vực hiện hết lên") — khu vực trọng điểm theo
                    thứ tự menu, thêm tỉnh khác nếu có dự án */}
                {[ALL, ...khuVucTrongDiem, ...provinceCounts.map(([n]) => n).filter((n) => !khuVucTrongDiem.includes(n))].map((name) => (
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
                    {name !== ALL && provCountMap.get(name) ? <span className="text-xs text-cvr-muted">{provCountMap.get(name)}</span> : null}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const tatCa: Project[] = [...projects, ...(traCuu ? traCuu.filter((d) => !slugNoiBat.has(d.slug)).map(duAnTuTraCuu) : [])];
              const loai = projectCategories.map((c) => [c, duAnThuocNhom(tatCa, c).length] as const).filter(([, n]) => n > 0);
              const cdt = [...nhomChuDauTu(tatCa)].sort((a, b) => b[1].duAn.length - a[1].duAn.length).slice(0, 8);
              const moi = projects.slice(0, 5);
              const hop = "rounded-none border border-cvr-line bg-white p-5 shadow-lux";
              const dong = "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink";
              return (
                <>
                  {loai.length > 0 && (
                    <div className={hop}>
                      <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Dự án theo loại hình</h2>
                      <div className="mt-3 flex flex-col">
                        {loai.map(([c, n]) => (
                          <Link key={c.slug} href={`/du-an/${c.slug}`} className={dong}><span className="min-w-0 truncate">{c.label}</span><span className="shrink-0 text-xs text-cvr-muted">{n}</span></Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {cdt.length > 0 && (
                    <div className={hop}>
                      <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Dự án theo chủ đầu tư</h2>
                      <div className="mt-3 flex flex-col">
                        {cdt.map(([s, g]) => (
                          <Link key={s} href={`/chu-dau-tu/${s}`} className={dong}><span className="min-w-0 truncate">{g.ten}</span><span className="shrink-0 text-xs text-cvr-muted">{g.duAn.length}</span></Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {moi.length > 0 && (
                    <div className={hop}>
                      <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Dự án mới cập nhật</h2>
                      <div className="mt-3 flex flex-col">
                        {moi.map((p) => (
                          <Link key={p.slug} href={`/du-an/${p.slug}`} className={dong}><span className="min-w-0 truncate">{p.name}</span></Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </aside>
      </div>
      )}
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
