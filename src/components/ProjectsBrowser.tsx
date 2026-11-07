"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { batDauTim, xongTim } from "@/components/VachTim";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useSoMoiTrang } from "@/lib/useSoMoiTrang";
import PhanTrang from "@/components/PhanTrang";
import Image from "next/image";
import { chuThuan } from "@/lib/chuThuan";
import AnhChay from "@/components/AnhChay";
import Link from "next/link";
import FilterDropdown, { FilterDropdownGroup } from "@/components/FilterDropdown";
import Highlight from "@/components/Highlight";
import { chuChuaHieu, searchAny } from "@/lib/smartSearch";
import { locTuCau } from "@/lib/locTuCau";
import { cuonToiKetQua } from "@/lib/scroll";
import dynamic from "next/dynamic";
import { coordOf } from "@/lib/geo";
import type { DiemBanDo } from "@/components/MapViewGoogle";
import type { Project, Article } from "@/lib/data";
import type { DongTraCuu } from "@/lib/traCuuDuAn";
import { locTraCuu } from "@/components/TraCuuDuAn";
import { useHomeSection } from "@/components/HomeExpand";
import { sortProjectsByTier } from "@/components/ProjectSlider";
import NhanTinhTrang, { capVip } from "@/components/NhanTinhTrang";
import { giaTriThat, loaiHinhThe } from "@/lib/truongDuAn";
import { khuVucList, khuVucTrongDiem, slugKhuVuc } from "@/lib/khuVuc";
import { duAnThuocNhom, projectCategories } from "@/lib/categories";
import { nhomChuDauTu, slugChuDauTu } from "@/lib/chuDauTu";
import FilterBar, { LocationPanel, NutXem, DaChon, nhanNoi, loaiTheoCha, nhanLoai } from "@/components/FilterBar";
import type { Suggestion } from "@/lib/suggest";
import { PanelLoaiBdsDuAn, PanelLocThemDuAn, PanelChuDauTu, tomTatLoaiDuAn } from "@/components/TruongDuAn";
import { emptyFilters, filtersFromParams, filtersToParams, type Filters } from "@/lib/filters";
import { CAY_LOAI_DU_AN, dsTinhTrang, khopKhuVuc, loaiCuaDuAn, thuHepDuAn, tinhCua, type DuAnLoc } from "@/lib/thuHepDuAn";

// Bản đồ chỉ chạy phía client (Leaflet đụng tới window) — nạp động, không SSR.
const MapView = dynamic(() => import("@/components/MapViewMo"), { ssr: false });

// Danh sách dự án trang /du-an — bố cục kiểu Batdongsan:
// thanh lọc dưới Hero (ô tìm + dropdown Khu vực · Loại hình · Trạng thái)
// → tiêu đề + bộ đếm nhảy theo bộ lọc → thẻ ngang (ảnh trái · thông tin phải)
// + sidebar phải = lọc theo khu vực (đếm số dự án) + tin tức bất động sản.
// Dữ liệu do trang cha truyền vào (đọc từ Supabase — admin đăng gì hiện nấy).

// Tỉnh/thành = phần cuối của location ("Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" → "Đà Nẵng")
const provinceOf = (location: string) => location.split(",").pop()?.trim() ?? "";
// BỘ LỌC CHUNG (chủ dự án 01/11/2026: "bộ lọc dùng chung cho Mua bán · Cho thuê · Dự án, bổ sung cho dự án các trường đặc thù"):
// Khu vực đa tầng (tỉnh → phường, hệ cũ/mới) + Dự án = đúng hàng trường lọc chung tab Dự án (TruongLocTrangChu); so khớp khu vực bằng
// CHÍNH luật khu vực của tin (applyFilters) trên địa chỉ dự án. Hàng dưới: Loại hình · Chủ đầu tư · Tình trạng (riêng dự án).
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
  const coDiaDanh = useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
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
  const [boLoc, setBoLoc] = useState<Filters>(emptyFilters);   // Khu vực + Dự án — hàng trường lọc chung
  const province = boLoc.locations.length === 1 && !boLoc.locations[0].district && !boLoc.locations[0].ward ? boLoc.locations[0].province : ALL;
  const setProvince = (p: string) => setBoLoc((b) => ({ ...b, project: "", locations: p === ALL ? [] : [{ province: p }] }));
  // NHẬN TỪ KHOÁ TỪ TRANG CHỦ: bấm tab "Dự án" ở Hero rồi tìm → nhảy sang
  // /du-an?q=... , ô tìm ở đây phải tự điền và lọc ngay (trước đây bỏ qua ?q=).
  useEffect(() => {
    // Trang chủ (tab Dự án) gửi sang đủ trường của bộ lọc chung: kv · duan · loaida · tinhtrang · cdt · q (filtersFromParams);
    // link cũ ?tinh=… vẫn nhận (filtersFromParams lùi về tinh/quan/phuong)
    const sp = new URLSearchParams(window.location.search);
    const f = filtersFromParams(sp);
    const tt = f.tinhTrang || sp.get("trangthai") || "";
    // ?q= (bấm gợi ý ở trang tổng) → đọc câu vào Khu vực · Loại hình như ô tìm (cùng bộ đọc locTuCau), phần chưa đọc được (tên dự án,
    // chủ đầu tư…) làm từ khoá — trước đây cả câu chỉ để dò chữ (01/11/2026)
    const cau = f.keyword ? locTuCau(f.keyword, "ban") : null;
    // địa danh (phường, quận) nạp sau khi trang mở — về tới thì đọc lại câu (coDiaDanh), như trang Mua bán
    if (coDiaDanh && !f.keyword) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (f.keyword) setQ(chuChuaHieu(f.keyword.replace(/(^|\s)dự\s+án(?=\s|$)/gi, " ")).replace(/,/g, ""));
    setBoLoc({ ...emptyFilters(), locations: f.locations.length ? f.locations : cau?.locations ?? [], project: f.project, types: f.types.length ? f.types : cau?.types ?? [], loaiDuAn: f.loaiDuAn, tinhTrang: tt || cau?.tinhTrang || undefined, chuDauTu: f.chuDauTu });
  }, [coDiaDanh]);

  // GHI BỘ LỌC LÊN ĐỊA CHỈ TRANG như Mua bán / Cho thuê (07/11/2026: chọn khu vực rồi Tìm mà địa chỉ vẫn /du-an — tải lại / gửi link là mất).
  // Bỏ qua lần đầu (đọc từ địa chỉ ở trên); chỉ đổi khi bộ lọc đổi thật.
  const daDoc = useRef(false);
  useEffect(() => {
    if (!daDoc.current) { daDoc.current = true; return; }
    const p = filtersToParams({ ...boLoc, keyword: q });
    const u = `${window.location.pathname}${p.toString() ? `?${p.toString()}` : ""}`;
    if (u !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, "", u);
  }, [boLoc, q]);

  // Bấm search từ trang chủ → URL kèm #ket-qua → tự cuộn tới khối kết quả (bỏ qua
  // banner Hero rất to), cho cả PC & Mobile. Dùng JS cho chắc (hash native không
  // ổn định trên trang client-render). scroll-mt trên #ket-qua lo phần bù header.
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#ket-qua") return;
    const el = document.getElementById("ket-qua");
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
  }, []);

  // Có danh bạ Tra cứu → lựa chọn lọc lấy từ MỌI dự án (danh bạ chứa cả dự án nổi bật)
  const nguonDem = (k1: (p: Project) => string, k2: (d: DongTraCuu) => string): [string, number][] => {
    if (!traCuu) return countBy(projects, k1);
    const m = new Map<string, number>();
    for (const d of traCuu) { const k = k2(d); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m];
  };
  const provinceCounts = nguonDem((p) => provinceOf(p.location), (d) => d.tinh);
  const provCountMap = new Map(provinceCounts);
  // Danh sách chọn Dự án + Chủ đầu tư: dự án THẬT trên trang (nổi bật + tra cứu)
  const tatCaDuAn = [...projects, ...(traCuu ?? []).filter((d) => !projects.some((p) => p.slug === d.slug)).map(duAnTuTraCuu)];
  const khopCdt = (ten: string) => !boLoc.chuDauTu || slugChuDauTu(ten) === slugChuDauTu(boLoc.chuDauTu);
  // loại hình theo CÂY LOẠI HÌNH (boLoc.types — lib/thuHepDuAn loaiCuaDuAn) + nhóm dự án cũ của trang /du-an/<loại>
  const khopLoaiDa = (type: string) => (!boLoc.types.length || loaiCuaDuAn(type).some((o) => boLoc.types.includes(o))) && (!boLoc.loaiDuAn?.length || projectCategories.some((c) => boLoc.loaiDuAn!.includes(c.slug) && duAnThuocNhom([{ type }], c).length > 0));
  // LỰA CHỌN TỪNG TRƯỜNG + GỢI Ý KHI GÕ = MỘT GỐC CHUNG với tab Dự án của bộ lọc tổng (lib/thuHepDuAn, 01/11/2026): thu hẹp hai chiều
  // cha ↔ con theo dữ liệu thật; khách chưa chọn trường khác thì danh sách để đủ.
  const diaChiTraCuu = new Map((traCuu ?? []).map((d) => [d.slug, `${d.diaChi} · ${d.diaChiCu} · ${d.tinh}`]));
  const tinhTraCuu = new Map((traCuu ?? []).map((d) => [d.slug, d.tinh]));
  const dsLoc: (DuAnLoc & { p: Project })[] = tatCaDuAn.map((p) => ({
    p, slug: p.slug, ten: p.name, chuDauTu: giaTriThat(p.developer), loaiHinh: giaTriThat(p.type), tinhTrang: giaTriThat(p.status),
    diaChiTim: diaChiTraCuu.get(p.slug) ?? p.location, tinh: tinhTraCuu.get(p.slug) ?? tinhCua(p.location),
  }));
  const loc = thuHepDuAn(dsLoc, boLoc);
  const { dsChuDauTu, tinhTrangCo, coTruongKhac, demLoaiBds } = loc;
  const nhanLoaiDa = nhanLoai(boLoc.types, CAY_LOAI_DU_AN) || tomTatLoaiDuAn(boLoc.loaiDuAn);
  const goiYDuAnRieng = (kw: string): Suggestion[] =>
    loc.goiY(kw).map(({ p }) => ({ label: p.name, kind: "Dự án" as const, sub: giaTriThat(p.location), href: `/du-an/${p.slug}` }));

  // TÌM KIẾM THEO TRƯỜNG — DÙNG CHUNG một luật với Mua bán / Cho thuê:
  // bóc tách câu dài → xếp 3 tầng (khớp đủ → gần đúng → liên quan) → không bao
  // giờ ra màn hình trống. Khu vực + Loại hình là 2 trường GIỮ khi nới lỏng.
  // Dự án nổi bật luôn xếp theo cấp VIP (Kim cương → Vàng → Bạc → thường) ở MỌI trang (trang Dự án, khu vực, loại hình, chủ đầu tư,
  // trang chủ) — chủ dự án 30/10/2026; dự án tra cứu xếp theo tên A, B, C (dongTraCuu)
  const xepVip = useMemo(() => sortProjectsByTier(projects), [projects]);
  const hits = searchAny(xepVip, q, {
    // TÊN dự án = chuỗi chính (khớp ở đây ăn điểm cao nhất)
    // "TỪ" CỦA DỰ ÁN = TÊN DỰ ÁN + TÊN CHỦ ĐẦU TƯ (chủ dự án 01/11/2026)
    ten: (p) => `${p.name} ${p.developer}`,
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
      // đúng thứ tự hàng trường dưới ô tìm, trái qua phải: Toàn quốc · Loại hình · Chủ đầu tư · Dự án · Lọc thêm (Tình trạng)
      { ten: "khu vực", chon: boLoc.locations.length > 0, giu: true, ok: (p) => khopKhuVuc(p.location, boLoc.locations, tinhCua(p.location)) },
      { ten: "loại hình", chon: !!boLoc.loaiDuAn?.length || boLoc.types.length > 0, giu: true, ok: (p) => khopLoaiDa(p.type) },
      { ten: "chủ đầu tư", chon: !!boLoc.chuDauTu, giu: true, ok: (p) => khopCdt(p.developer) },
      { ten: "dự án", chon: !!boLoc.project, giu: true, ok: (p) => p.name === boLoc.project },
      { ten: "tình trạng", chon: !!boLoc.tinhTrang, ok: (p) => dsTinhTrang(boLoc.tinhTrang).includes(p.status) },
    ],
  });
  const visible = sortProjectsByTier(hits.map((h) => h.item));
  // Tầng + chữ cần bôi đậm của từng dự án
  const tierBySlug = new Map(hits.map((h) => [h.item.slug, h.tier]));
  const termsBySlug = new Map(hits.map((h) => [h.item.slug, h.matched]));


  const hasActive = q.trim() !== "" || boLoc.locations.length > 0 || !!boLoc.project || !!boLoc.loaiDuAn?.length || boLoc.types.length > 0 || !!boLoc.tinhTrang || !!boLoc.chuDauTu;
  const reset = () => { setQ(""); setBoLoc(emptyFilters()); };


  // ── CHẠY TÌM (nút Tìm · Enter · bấm gợi ý · bấm "Xong" ở bảng lọc) ──────────
  // Trang Dự án lọc TẠI CHỖ nên "chạy" = đóng panel/trang tìm + CUỘN xuống khối
  // kết quả, kèm ~0,7s trạng thái "đang tìm" để khách biết máy đang chạy —
  // dù có dự án khớp hay không.
  const chayTim = () => {
    batDauTim(); xongTim(); // lọc tại chỗ: kết quả có ngay — vạch chung hiện tối thiểu 0,6 giây
    // đợi overlay đóng xong mới cuộn, nếu không phần tử còn bị che
    window.setTimeout(cuonToiKetQua, 60);
  };

  // Phân trang danh sách dự án: 9 dự án/trang (khớp yêu cầu "8–10/trang").
  useSoMoiTrang();
  const [page, setPage] = useState(1);
  // CHẾ ĐỘ BẢN ĐỒ cho tab Dự án — giống Mua bán / Cho thuê, marker là TÊN DỰ ÁN.
  const [mapMode, setMapMode] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [q, boLoc]); // đổi lọc → về trang 1
  // TRANG DỰ ÁN = BỐ CỤC WEB CŨ + THÊM TRA CỨU (chủ dự án 30/10/2026: "PC để như cũ, chỉ thêm vào"): một danh sách — dự án nổi bật
  // theo cấp VIP trước (thẻ ngang đang chạy), rồi dự án tra cứu theo tên A, B, C (thẻ tra cứu); thanh tìm + lọc áp chung cả hai
  const traCuuLoc = traCuu
    ? locTraCuu(traCuu, q, ALL, ALL, boLoc.tinhTrang || ALL, ALL).filter((d) =>
        khopKhuVuc(`${d.diaChi} · ${d.diaChiCu} · ${d.tinh}`, boLoc.locations, d.tinh) && (!boLoc.project || d.ten === boLoc.project) &&
        khopLoaiDa(d.loaiHinh) && (!boLoc.chuDauTu || (!!d.chuDauTu && khopCdt(d.chuDauTu))))
    : [];
  const slugNoiBat = new Set(visible.map((p) => p.slug));
  // Số dự án KHỚP ĐÚNG lựa chọn (không tính gợi ý tương tự) — nút lối ra "Xem N dự án" (chủ dự án 01/11/2026)
  const soDuAnKhop = visible.filter((p) => (tierBySlug.get(p.slug) ?? 1) === 1).length + traCuuLoc.filter((d) => !slugNoiBat.has(d.slug)).length;
  const nhanXemDuAn = `Xem ${soDuAnKhop} dự án`;
  // Đang lọc: dự án KHỚP đứng trước (nổi bật khớp → tra cứu khớp); dự án nổi bật "gợi ý tương tự" (tầng 2–3) xuống cuối, có nhãn tầng
  // đứng trước — chọn Huế mà dự án Đà Nẵng chen lên trước là sai (01/11/2026)
  const laGoiY = (p: Project) => hasActive && (tierBySlug.get(p.slug) ?? 1) > 1;
  const dsTrang: ({ noiBat: Project } | { traCuu: DongTraCuu })[] = [
    ...visible.filter((p) => !laGoiY(p)).map((p) => ({ noiBat: p })),
    ...traCuuLoc.filter((d) => !slugNoiBat.has(d.slug)).map((d) => ({ traCuu: d })),
    // "Gợi ý tương tự" CHỈ khi không có dự án nào khớp (chủ dự án 01/11/2026: lọc để TÌM dự án — chọn Huế thì chỉ ra dự án Huế;
    // hết dự án khớp mới gợi ý, để trang không trống)
    ...(soDuAnKhop > 0 ? [] : visible.filter(laGoiY).map((p) => ({ noiBat: p }))),
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
  useEffect(() => { setTrangNoiBat(1); }, [q, boLoc]); // đổi tìm / lọc → danh sách về trang 1
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


  // Nhóm nút lọc dùng chung cho HAI vị trí: thanh lọc (desktop) và trang tìm
  // toàn màn hình (mobile). Chức năng y hệt — chỉ khác chỗ đặt.
  // MỘT HÀNG, kiểu nút cũ của trang, CHA → CON (chủ dự án 01/11/2026): Toàn quốc · Loại hình · Chủ đầu tư · Dự án · Lọc thêm (Tình
  // trạng) — trường trước thu hẹp trường sau theo dữ liệu thật — bảng chọn dùng chung với tab Dự án trang chủ (TruongDuAn), bấm Đặt lại · Áp dụng như Mua bán (chủ dự án 01/11/2026)
  // Chọn xong một trường = lọc NGAY tại chỗ, bảng đóng, KHÔNG cuộn đi, không đóng màn tìm điện thoại — khách chọn tiếp các trường
  // khác rồi mới bấm Tìm (chủ dự án 01/11/2026: "bấm vào 1 trường nó chạy rồi thì các trường khác có tác dụng gì")
  const apDung = (close: () => void) => { close(); batDauTim(); xongTim(); };
  // TRƯỜNG CHỌN NHIỀU = NHÁP (cùng luật bộ lọc Mua bán / Cho thuê, 07/11/2026): tick chỉ ghi nháp, Áp dụng mới lọc; đóng không Áp dụng → bỏ
  const [nhapDa, setNhapDa] = useState<Filters | null>(null);
  const gD = nhapDa ?? boLoc;
  const setND = (fn: (b: Filters) => Filters) => setNhapDa((n) => fn(n ?? boLoc));
  const moNhapDa = (mo: boolean) => { if (!mo) setNhapDa(null); };
  const apDungDa = (close: () => void) => { const n = nhapDa; close(); if (n) setBoLoc(n); chayTim(); };
  const chipLoc = (
    <FilterDropdownGroup>
      <FilterDropdown label="Toàn quốc" tieuDe="Khu vực" giuCo summary={nhanNoi(boLoc.locations)} active={boLoc.locations.length > 0} panelClassName="w-96" className="shrink-0 sm:min-w-0 sm:flex-1" onMo={moNhapDa}>
        {({ close }) => <><LocationPanel locations={gD.locations} onChange={(locations) => setND((b) => ({ ...b, locations, project: "" }))} onClose={() => apDungDa(close)} onApDung={() => apDungDa(close)} onDatLai={() => setND((b) => ({ ...b, locations: [], project: "" }))} /></>}
      </FilterDropdown>
      {/* LOẠI HÌNH = CÂY LOẠI HÌNH BẤT ĐỘNG SẢN cha – con (chủ dự án 01/11/2026), chỉ loại có dự án thật, kèm số */}
      <FilterDropdown label="Loại hình" summary={nhanLoaiDa} active={boLoc.types.length > 0 || !!boLoc.loaiDuAn?.length} panelClassName="w-72" className="shrink-0 sm:min-w-0 sm:flex-1" onMo={moNhapDa}>
        {({ close }) => <><DaChon muc={loaiTheoCha(gD.types, CAY_LOAI_DU_AN).map((g) => ({ nhan: g.nhan, bo: () => setND((b) => ({ ...b, types: b.types.filter((x) => !g.cac.includes(x)) })) }))} macDinh="Tất cả loại hình" /><PanelLoaiBdsDuAn value={gD.types} onChange={(types) => setND((b) => ({ ...b, types, loaiDuAn: [] }))} dem={demLoaiBds} /><NutXem nhan={nhanXemDuAn} onClick={() => apDungDa(close)} onReset={() => setND((b) => ({ ...b, types: [], loaiDuAn: [] }))} /></>}
      </FilterDropdown>
      <FilterDropdown label="Chủ đầu tư" summary={boLoc.chuDauTu ?? ""} active={!!boLoc.chuDauTu} panelClassName="w-80" className="shrink-0 sm:min-w-0 sm:flex-1">
        {({ close }) => <><DaChon muc={boLoc.chuDauTu ? [{ nhan: boLoc.chuDauTu, bo: () => setBoLoc((b) => ({ ...b, chuDauTu: "" })) }] : []} onBoHet={() => setBoLoc((b) => ({ ...b, chuDauTu: "" }))} /><PanelChuDauTu ds={dsChuDauTu} hienSan={boLoc.locations.length > 0 || !!boLoc.loaiDuAn?.length || !!boLoc.project || !!boLoc.tinhTrang} value={boLoc.chuDauTu} onChange={(chuDauTu) => setBoLoc((b) => ({ ...b, chuDauTu }))} onApply={() => { apDung(close); }} /></>}
      </FilterDropdown>
      {/* Trường "Dự án" BỎ khỏi bộ lọc trang Dự án (chủ dự án 07/11/2026) — tìm dự án theo tên bằng ô tìm */}
      <FilterDropdown label="Lọc thêm" summary={boLoc.tinhTrang ? `Lọc thêm (${dsTinhTrang(boLoc.tinhTrang).length})` : ""} active={!!boLoc.tinhTrang} panelClassName="w-80" className="shrink-0 sm:min-w-0 sm:flex-1" onMo={moNhapDa}>
        {({ close }) => <><DaChon muc={dsTinhTrang(gD.tinhTrang).map((t) => ({ nhan: t, bo: () => setND((b) => ({ ...b, tinhTrang: dsTinhTrang(b.tinhTrang).filter((x) => x !== t).join("|") })) }))} onBoHet={() => setND((b) => ({ ...b, tinhTrang: "" }))} /><PanelLocThemDuAn tinhTrang={gD.tinhTrang} onChange={(tinhTrang) => setND((b) => ({ ...b, tinhTrang }))} onApply={() => apDungDa(close)} co={coTruongKhac("tt") ? tinhTrangCo : undefined} /><NutXem nhan={nhanXemDuAn} onClick={() => apDungDa(close)} onReset={() => setND((b) => ({ ...b, tinhTrang: "" }))} /></>}
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
      {/* ĐIỆN THOẠI: sát thanh "‹ Dự án" như Mua bán / Cho thuê — bỏ dải trắng 8px (chủ dự án 02/11/2026: căn lề chuẩn, một kiểu) */}
      {/* ĐIỆN THOẠI: khối tìm + lọc DÍNH ngay dưới thanh "‹ Dự án" khi cuộn — như Mua bán / Cho thuê (02/11/2026) */}
      <div id="tra-cuu" className={`khoi-loc-dinh max-sm:sticky max-sm:top-[calc(60px+var(--at))] max-sm:[html:has(.thanh-quay-lai)_&]:top-[calc(60px+var(--backbar-h)+var(--at))] max-sm:z-20 max-sm:shadow-[0_1px_0_rgba(0,0,0,0.08)] max-sm:has-[[data-man-tim].flex]:z-[90] order-1 mt-0 scroll-mt-24 rounded-none bg-white pb-2.5 pt-0 max-sm:mb-4 max-sm:pb-0 sm:order-2 sm:mt-4 sm:border-b sm:border-cvr-line sm:pb-4 lg:w-[calc(66.667%-10.667px)]`}>
        {/* MỘT KHUÔN với Mua bán / Cho thuê (chủ dự án 01/11/2026): CHÍNH khung tìm FilterBar — bấm vào ô, lúc gõ, màn tìm điện thoại,
            nút Làm mới, Xem bản đồ y hệt; chỉ khác HÀNG TRƯỜNG LỌC của dự án và gợi ý khi gõ (dự án khớp tên / chủ đầu tư). Lọc tại chỗ. */}
        <FilterBar
          value={{ ...boLoc, keyword: q }}
          onChange={(nf) => { setQ(nf.keyword); setBoLoc({ ...nf, keyword: "" }); }}
          onSearch={() => chayTim()}
          onMap={() => setMapMode((v) => !v)}
          mapActive={mapMode}
          hintMode="duan"
          hangLoc={chipLoc}
          goiYRieng={goiYDuAnRieng}
          nhanXem={nhanXemDuAn}
        />
      </div>

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
          {/* bỏ câu "Dự án căn hộ, khu đô thị và nghỉ dưỡng đang được cập nhật trên Coastal Land." (anh 07/11/2026 — chú thích thừa) */}
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
      <div className={`mt-4 grid grid-cols-1 gap-8 sm:mt-3 lg:grid-cols-3 ${mapMode ? "hidden" : ""}`}>
        {/* ── Cột chính: thẻ dự án ngang ── */}
        <div className="lg:col-span-2">
          {/* CÙNG LUẬT CẢ HỆ THỐNG (anh 07/11/2026): có dự án khớp → chỉ xếp theo độ chính xác, không ghi gì; KHÔNG dự án nào khớp mới ghi */}
          {hasActive && soDuAnKhop === 0 && pageItems.length > 0 && <p className="mb-3 text-sm font-medium text-cvr-body">Dự án tương tự</p>}
          <div id="noi-bat" className="reveal is-visible cards-stagger flex scroll-mt-24 flex-col gap-5" onClickCapture={() => ghiTrang(current, window.scrollY)}>
            {pageItems.map((x) =>
              "noiBat" in x
                ? <Fragment key={x.noiBat.slug}>
                    {/* không chèn nhãn "tương tự" giữa danh sách (anh 07/11/2026: có kết quả thì không ghi tương tự) */}
                    {theDuAnWeb(x.noiBat)}
                  </Fragment>
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
