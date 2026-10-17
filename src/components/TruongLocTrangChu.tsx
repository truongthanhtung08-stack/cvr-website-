"use client";

import FilterDropdown, { FilterDropdownGroup, PanelActions } from "@/components/FilterDropdown";
import { LocationPanel, ProjectPanel, RangePanel, Chip, SwitchRow } from "@/components/FilterBar";
import {
  typeGroupsFor, priceRangesFor, areaRangesFor, bedroomOptions, priceRangeText, areaRangeText,
  locationLabel, normalizeVi, emptyFilters, directionOptions, legalOptions, furnishingOptions, type Filters,
} from "@/lib/filters";
import { parseQuery } from "@/lib/smartSearch";

// ============================================================================
// HÀNG TRƯỜNG LỌC CHI TIẾT dưới ô tìm trang chủ (chủ dự án 17/10/2026: "khách muốn lọc chi tiết theo yêu cầu
// của họ … phải có trường lọc thêm phía dưới", "thông minh và chuẩn khi khách muốn tìm thông tin chính xác")
// ----------------------------------------------------------------------------
// Dùng lại đúng các bảng chọn của FilterBar trang /mua-ban (LocationPanel, RangePanel, ProjectPanel) — không viết mới.
// Trường nhảy theo mục: Mua bán / Cho thuê (giá thuê theo tháng, loại hình theo mục) · Dự án (Khu vực → Dự án lọc
// theo khu vực). Gõ câu vào ô tìm → các trường tự điền theo phần máy tách được (locTuCau).
// ============================================================================

// Nhãn loại hình của bộ tách câu → loại hình của bộ lọc (cùng nguồn typeGroupsFor)
function loaiTuNhan(nhan: string, nq: string, mb: "ban" | "thue"): string[] {
  const nhom = typeGroupsFor(mb).filter((g) => g.label !== "Khác");
  const n = normalizeVi(nhan);
  // "đất" trần → cả nhóm Đất; "đất nền" mới là loại chi tiết
  if (n === "dat nen" && !nq.includes("dat nen")) return nhom.find((g) => g.label === "Đất")?.items ?? [];
  // "chung cư" và "căn hộ" là một nhu cầu → cả nhóm Căn hộ
  if (n === "chung cu" || n === "can ho") return nhom.find((g) => g.label === "Căn hộ")?.items ?? [];
  const g = nhom.find((x) => normalizeVi(x.label) === n);
  if (g) return g.items;
  const khop = nhom.flatMap((x) => x.items).filter((t) => normalizeVi(t).includes(n));
  if (khop.length) return khop;
  const dau = n.split(" ")[0];
  return nhom.flatMap((x) => x.items).filter((t) => normalizeVi(t).split(/[^a-z0-9]+/).includes(dau));
}

/** Câu gõ → các trường lọc (khu vực · loại hình · giá · phòng ngủ) — phần còn lại để ô tìm xử lý */
export function locTuCau(cau: string, mb: "ban" | "thue"): Filters {
  const f = emptyFilters();
  if (!cau.trim()) return f;
  const p = parseQuery(cau);
  const nq = ` ${normalizeVi(cau).replace(/[^a-z0-9]+/g, " ")} `;
  const pl = p.place;
  if (pl) f.locations = [{ province: pl.province, district: pl.district, ward: pl.ward }];
  else if (p.places[0]) f.locations = [{ province: p.places[0] }];
  if (p.types.length) f.types = [...new Set(p.types.flatMap((t) => loaiTuNhan(t, nq, mb)))];
  else if (/ nha /.test(nq) && !/ nha dat /.test(nq)) f.types = typeGroupsFor(mb).find((g) => g.label === "Nhà")?.items ?? [];
  f.priceMin = p.priceMinTy;
  f.priceMax = p.priceMaxTy;
  if (p.beds) f.beds = Math.min(5, p.beds);
  return f;
}

export default function TruongLocTrangChu({
  muc, value: f, onChange, onXong, gon = false, seg = false, the = false, chi,
}: {
  muc: "ban" | "thue" | "duan";
  value: Filters;
  onChange: (f: Filters) => void;
  /** Bấm "Xong" trong một bảng chọn */
  onXong?: () => void;
  /** Điện thoại: hàng cuộn ngang trong màn tìm */
  gon?: boolean;
  /** Máy tính: các trường là ĐOẠN trong thanh tìm chia ô kiểu Airbnb (nhãn trên, giá trị dưới) */
  seg?: boolean;
  /** Điện thoại: các trường là THẺ gọn xếp dọc trong màn tìm (kiểu Airbnb) */
  the?: boolean;
  /** Chỉ hiện các trường này (kv · da · lh · gia · dt · pn); bỏ trống = hiện hết */
  chi?: string[];
}) {
  const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const xong = (close: () => void) => { close(); onXong?.(); };
  const nhom = typeGroupsFor(mb).filter((g) => g.label !== "Khác");
  const cls = seg
    ? "h-full min-w-0 flex-1 before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-px before:bg-cvr-line"
    : the ? "w-full" : "shrink-0";
  const hien = (id: string) => !chi || chi.includes(id);
  // Đoạn chia ô: không bọc hàng — nằm thẳng trong thanh tìm
  const hang = (con: React.ReactNode) => seg ? <>{con}</> : the ? <div className="flex flex-col gap-3">{con}</div> : (
    <div className={`no-scrollbar flex items-center gap-2 ${gon ? "-mx-4 overflow-x-auto px-4" : "flex-wrap justify-center"}`}>{con}</div>
  );

  const khuVuc = hien("kv") && (
    <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="kv" label="Khu vực" summary={f.locations.length > 1 ? `${locationLabel(f.locations[0])} +${f.locations.length - 1}` : f.locations[0] ? locationLabel(f.locations[0]) : ""} active={f.locations.length > 0} panelClassName="w-80" className={cls}>
      {({ close }) => <LocationPanel locations={f.locations} onChange={(locations) => set({ locations, project: "" })} onClose={() => xong(close)} />}
    </FilterDropdown>
  );

  if (muc === "duan") {
    return (
      <FilterDropdownGroup>
        {hang(<>
          {khuVuc}
          {hien("da") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="da" label="Dự án" summary={f.project} active={!!f.project} panelClassName="w-72" className={cls}>
            {({ close }) => <ProjectPanel locations={f.locations} project={f.project} onPick={(name) => { set({ project: f.project === name ? "" : name }); xong(close); }} />}
          </FilterDropdown>}
        </>)}
      </FilterDropdownGroup>
    );
  }

  // số mục đang bật trong "Lọc thêm" (cùng cách đếm của FilterBar)
  const soThem = (f.beds ? 1 : 0) + (mb === "ban" ? (f.direction ? 1 : 0) + (f.legal ? 1 : 0) : (f.furnishing ? 1 : 0)) + (f.verified ? 1 : 0) + (f.broker ? 1 : 0);
  const tenLoai = nhom.find((g) => g.items.length === f.types.length && g.items.every((t) => f.types.includes(t)))?.label;
  return (
    <FilterDropdownGroup>
      {hang(<>
        {khuVuc}
        {hien("lh") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="lh" label="Loại hình" summary={tenLoai ?? (f.types.length === 1 ? f.types[0] : `${f.types.length} loại hình`)} active={f.types.length > 0} panelClassName="w-72" className={cls}>
          {({ close }) => (
            <div>
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {nhom.map((g) => {
                  const ca = g.items.every((t) => f.types.includes(t));
                  return (
                    <div key={g.label}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">
                        <input type="checkbox" checked={ca} onChange={() => set({ types: ca ? f.types.filter((t) => !g.items.includes(t)) : [...new Set([...f.types, ...g.items])] })} className="h-4 w-4 shrink-0 accent-cvr-blue" />
                        {g.label}
                      </label>
                      {g.items.length > 1 && g.items.map((t) => {
                        const on = f.types.includes(t);
                        return (
                          <label key={t} className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pl-8 pr-2 text-sm text-cvr-ink/80 transition hover:bg-black/5">
                            <input type="checkbox" checked={on} onChange={() => set({ types: on ? f.types.filter((x) => x !== t) : [...f.types, t] })} className="h-4 w-4 shrink-0 accent-cvr-blue" />
                            <span className="truncate">{t}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <PanelActions onReset={() => set({ types: [] })} onApply={() => xong(close)} />
            </div>
          )}
        </FilterDropdown>}
        {hien("gia") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="gia" label={mb === "thue" ? "Giá thuê/tháng" : "Mức giá"} summary={priceRangeText(f.priceMin, f.priceMax)} active={f.priceMin != null || f.priceMax != null} panelClassName="w-80" className={cls}>
          {({ close }) => (
            <RangePanel unit="tỷ" step={0.5} sliderMax={50} min={f.priceMin} max={f.priceMax} presets={priceRangesFor(mb)}
              onPick={(min, max) => set({ priceMin: min, priceMax: max })} onReset={() => set({ priceMin: null, priceMax: null })} onApply={() => xong(close)} />
          )}
        </FilterDropdown>}
        {hien("dt") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="dt" label="Diện tích" summary={areaRangeText(f.areaMin, f.areaMax)} active={f.areaMin != null || f.areaMax != null} panelClassName="w-80" className={cls}>
          {({ close }) => (
            <RangePanel unit="m²" step={10} sliderMax={mb === "thue" ? 5000 : 500} min={f.areaMin} max={f.areaMax} presets={areaRangesFor(mb)}
              onPick={(min, max) => set({ areaMin: min, areaMax: max })} onReset={() => set({ areaMin: null, areaMax: null })} onApply={() => xong(close)} />
          )}
        </FilterDropdown>}
        {/* LỌC THÊM — đúng chuẩn bộ lọc trang /mua-ban (FilterBar): phòng ngủ · hướng + pháp lý (mua bán) /
            nội thất (cho thuê) · tin xác thực · môi giới chuyên nghiệp. Khách cần chi tiết thì mở ở đây. */}
        {hien("them") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="them" label="Lọc thêm" summary={soThem ? `Lọc thêm (${soThem})` : ""} active={soThem > 0} panelClassName="w-80" className={cls}>
          {({ close }) => (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Số phòng ngủ</p>
                <div className="flex flex-wrap gap-1.5">
                  {bedroomOptions.map((n) => (
                    <Chip key={n} active={f.beds === n} onClick={() => set({ beds: f.beds === n ? 0 : n })}>{n === 5 ? "5+ PN" : `${n} PN`}</Chip>
                  ))}
                </div>
              </div>
              {mb === "ban" && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Hướng nhà</p>
                  <div className="flex flex-wrap gap-1.5">
                    {directionOptions.map((d) => <Chip key={d} active={f.direction === d} onClick={() => set({ direction: f.direction === d ? "" : d })}>{d}</Chip>)}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">{mb === "ban" ? "Pháp lý" : "Nội thất"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mb === "ban"
                    ? legalOptions.map((x) => <Chip key={x} active={f.legal === x} onClick={() => set({ legal: f.legal === x ? "" : x })}>{x}</Chip>)
                    : furnishingOptions.map((x) => <Chip key={x} active={f.furnishing === x} onClick={() => set({ furnishing: f.furnishing === x ? "" : x })}>{x}</Chip>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Lọc khác</p>
                <div className="space-y-1">
                  <SwitchRow label="Tin xác thực" checked={f.verified} onChange={(v) => set({ verified: v })} />
                  <SwitchRow label="Môi giới chuyên nghiệp" checked={f.broker} onChange={(v) => set({ broker: v })} />
                </div>
              </div>
              <PanelActions onReset={() => set({ beds: 0, direction: "", legal: "", furnishing: "", verified: false, broker: false })} onApply={() => xong(close)} />
            </div>
          )}
        </FilterDropdown>}
      </>)}
    </FilterDropdownGroup>
  );
}
