import type { Listing } from "@/lib/data";
import { applyFilters, emptyFilters, filtersToParams, normalizeVi } from "@/lib/filters";
import { parseQuery } from "@/lib/smartSearch";
import { cauThanhBoLoc } from "@/lib/locDanhSach";
import { duAnThuocNhom, projectCategories } from "@/lib/categories";
import { thuHepDuAn, type DuAnLoc } from "@/lib/thuHepDuAn";
import type { DongGoiY, MucGoiY } from "@/lib/goiYTheoY";

// ============================================================================
// GỢI Ý BỘ LỌC TỔNG — ĐỦ 3 MỤC (chủ dự án duyệt 01/11/2026). Tab chỉ là NGỮ CẢNH, không khoá gợi ý:
//   · Câu nói rõ mục đích (bán/mua/tỷ · thuê/triệu · dự án/tên dự án) → chỉ mục đó (tab trang chủ tự chuyển theo — mucDichCau).
//   · Câu KHÔNG rõ mục đích ("căn hộ đà nẵng") → đủ cả 3 mục: mục của tab đang đứng lên trước, 2 mục kia xếp theo số kết quả THẬT;
//     mục không có dữ liệu thật thì không hiện.
//   · Mục Dự án: "Dự án <loại> tại <nơi>" (mở trang Dự án đã lọc sẵn) + vài dự án thật đúng loại, đúng nơi (hoặc khớp tên khách gõ).
// Dùng ở máy chủ (/api/goi-y/that) — đếm trên toàn bộ kho tin + danh bạ dự án.
// ============================================================================

/** Dòng mục Dự án cho một câu gõ — chỉ khi có dự án thật */
export function dongDuAn(raw: string, ds: DuAnLoc[], coTenDuAn = true): { dong: DongGoiY[]; so: number } {
  const p = parseQuery(raw);
  const nhom = p.types[0] ? projectCategories.find((c) => duAnThuocNhom([{ type: p.types[0] }], c).length > 0) : undefined;
  const tinh = p.place?.province ?? p.places[0];
  const dong: DongGoiY[] = [];
  let so = 0;
  // Có dòng "Dự án …" khi loại khách gõ CÓ loại dự án tương ứng, hoặc khách gõ chữ "dự án" — "nhà phố hải châu", "nhà huế" không kèm
  // dòng dự án (nhà riêng, nhà phố không có loại dự án)
  const noiDuAn = / du an /.test(` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `);
  if (nhom || (tinh && noiDuAn)) {
    const f = { ...emptyFilters(), locations: tinh ? [{ province: tinh }] : [], loaiDuAn: nhom ? [nhom.slug] : [] };
    const tap = thuHepDuAn(ds, f).tapDuAn;
    so = tap.length;
    if (tap.length) {
      const ts = filtersToParams(f).toString();
      dong.push({ nhan: ["Dự án", nhom?.label.toLowerCase(), tinh ? `tại ${tinh}` : ""].filter(Boolean).join(" "), muc: "duan", href: `/du-an?${ts}` });
      if (coTenDuAn) for (const d of tap.slice(0, 2)) dong.push({ nhan: d.ten, muc: "duan", href: `/du-an/${d.slug}` });
    }
  }
  // Gõ "dự án" trơn (chưa loại, chưa nơi, chưa tên) → các LOẠI dự án đang có dự án thật, nhiều dự án trước
  // bỏ chữ "dự án" — so không dấu (\b không nhận chữ có dấu tiếng Việt)
  const boChuDuAn = (s: string) => ` ${normalizeVi(s).replace(/[^a-z0-9]+/g, " ")} `.replace(/ du an | du /g, " ").trim();
  const tron = boChuDuAn(raw);
  if (!nhom && !tinh && !tron) {
    const theoLoai = projectCategories
      .map((c) => ({ c, n: thuHepDuAn(ds, { ...emptyFilters(), loaiDuAn: [c.slug] }).tapDuAn.length }))
      .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 4);
    for (const { c, n } of theoLoai) { dong.push({ nhan: `Dự án ${c.label.toLowerCase()}`, muc: "duan", href: `/du-an?${filtersToParams({ ...emptyFilters(), loaiDuAn: [c.slug] })}` }); so += n; }
    return { dong, so };
  }
  // Khách gõ TÊN dự án / chủ đầu tư → đúng dự án đó (khớp kiểu Google), kể cả khi câu không có loại, nơi
  if (coTenDuAn) {
    // GIỮ DẤU khi so tên (gõ "ăn gì" không ra An Cựu) — chỉ bỏ chữ "dự án"; gõ dưới 3 chữ cái chưa dò tên dự án
    const goc = raw.normalize("NFC").split(/\s+/).filter((w, i, a) => !/^(dự|du)$/i.test(w) && !(/^(án|an)$/i.test(w) && /^(dự|du)$/i.test(a[i - 1] ?? ""))).join(" ").trim();
    for (const d of goc.replace(/\s/g, "").length >= 3 ? thuHepDuAn(ds, emptyFilters()).goiY(goc, 3) : []) {
      if (!dong.some((x) => x.href === `/du-an/${d.slug}`)) { dong.push({ nhan: d.ten, muc: "duan", href: `/du-an/${d.slug}` }); so = Math.max(so, 1); }
    }
  }
  return { dong, so };
}

/** Gộp gợi ý 3 mục theo khuôn đã duyệt. dongBT: dòng Bán / Cho thuê (goiYThat). */
export function gopGoiYTong(raw: string, tab: MucGoiY, dongBT: DongGoiY[], tin: Listing[], dsDuAn: DuAnLoc[]): DongGoiY[] {
  const p = parseQuery(raw);
  const nq = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `;
  const noiDuAn = / du an /.test(nq);
  // Dòng /du-an/… mà goiYThat dựng (khách gõ tên dự án) thuộc nhóm Dự án
  const laDuAn = (d: DongGoiY) => d.muc === "duan" || d.href.startsWith("/du-an");
  const nhom: Record<MucGoiY, DongGoiY[]> = { ban: [], thue: [], duan: [] };
  for (const d of dongBT) nhom[laDuAn(d) ? "duan" : d.muc].push(laDuAn(d) ? { ...d, muc: "duan" } : d);
  // Mục Dự án: câu nói "dự án", hoặc câu chưa rõ mua / thuê (đủ 3 mục) — câu đã rõ bán / thuê thì không thêm
  const da = noiDuAn || !p.purpose ? dongDuAn(raw, dsDuAn) : { dong: [], so: 0 };
  for (const d of da.dong) if (!nhom.duan.some((x) => x.href === d.href)) nhom.duan.push(d);

  // Số kết quả THẬT của mỗi mục — để xếp 2 mục không phải tab đang đứng
  const dem = (m: "ban" | "thue") => {
    const bl = cauThanhBoLoc({ ...emptyFilters(), keyword: raw }, m);
    return bl ? applyFilters(tin.filter((l) => !l.banSao && (l.purpose ?? "ban") === m), { ...bl, keyword: "" }).length : 0;
  };
  const so: Record<MucGoiY, number> = { ban: nhom.ban.length ? dem("ban") : 0, thue: nhom.thue.length ? dem("thue") : 0, duan: da.so || nhom.duan.length };
  // GỢI Ý DỒN VÀO MUA BÁN · CHO THUÊ (chủ dự án 01/11/2026: "tập trung gợi ý mạnh vào các mục chính của trang"): tab đang đứng trước;
  // Mua bán, Cho thuê xếp theo số tin thật; Dự án luôn sau cùng (trừ khi đang ở tab Dự án)
  const thuTu: MucGoiY[] = [tab, ...(["ban", "thue"] as MucGoiY[]).filter((m) => m !== tab).sort((a, b) => so[b] - so[a]), ...(tab === "duan" ? [] : ["duan" as MucGoiY])];
  const ra: DongGoiY[] = [];
  for (const m of thuTu) {
    // tab Mua bán / Cho thuê tối đa 4 dòng, mục kia 3 dòng; Dự án (không phải tab đang đứng) tối đa 2 dòng; tab Dự án 3 dòng
    const toiDa = m === "duan" ? (tab === "duan" ? 3 : 2) : m === tab ? 4 : 3;
    for (const d of nhom[m].slice(0, toiDa)) if (!ra.some((x) => normalizeVi(x.nhan) === normalizeVi(d.nhan))) ra.push(d);
  }
  return ra.slice(0, 8);
}
