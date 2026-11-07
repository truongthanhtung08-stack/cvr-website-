"use client";

import { useMemo, useState } from "react";
import { useDiaDanh } from "@/lib/useDiaDanh";
import FilterDropdown, { FilterDropdownGroup } from "@/components/FilterDropdown";
import { LocationPanel, ProjectPanel, RangePanel, Chip, SwitchRow, NutXem, DaChon, NhomDacDiem, tenDacDiem, loaiTheoCha, nhanLoai, nhanNoi, tenLoai } from "@/components/FilterBar";
import { PanelLoaiBdsDuAn, PanelLocThemDuAn, PanelChuDauTu } from "@/components/TruongDuAn";
import { CAY_LOAI_DU_AN, dsTinhTrang, thuHepDuAn, type DuAnLoc } from "@/lib/thuHepDuAn";
import { coTruongKhacLoai, demLoaiTu } from "@/lib/thuHepTin";
import {
  typeGroupsFor, priceRangesFor, areaRangesFor, bedroomOptions, priceRangeText, areaRangeText,
  directionOptions, legalOptions, furnishingOptions, type Filters,
} from "@/lib/filters";

// ============================================================================
// HÀNG TRƯỜNG LỌC CHI TIẾT dưới ô tìm trang chủ (chủ dự án 17/10/2026: "khách muốn lọc chi tiết theo yêu cầu
// của họ … phải có trường lọc thêm phía dưới", "thông minh và chuẩn khi khách muốn tìm thông tin chính xác")
// ----------------------------------------------------------------------------
// Dùng lại đúng các bảng chọn của FilterBar trang /mua-ban (LocationPanel, RangePanel, ProjectPanel) — không viết mới.
// Trường nhảy theo mục: Mua bán / Cho thuê (giá thuê theo tháng, loại hình theo mục) · Dự án (Khu vực → Dự án lọc
// theo khu vực). Gõ câu vào ô tìm → các trường tự điền theo phần máy tách được (locTuCau).
// ============================================================================

export { locTuCau } from "@/lib/locTuCau";

// KHU VỰC = CHỌN NHIỀU → NHÁP (anh 07/11/2026: "chưa Áp dụng thì sao lại search"): tick / bỏ tick / Đặt lại chỉ đổi nháp trong bảng,
// bấm nút đáy mới đưa vào bộ lọc. Đóng bảng không bấm = bỏ nháp (bảng mở lại dựng mới từ bộ lọc). Cùng luật thanh lọc trang kết quả.
function BangKhuVucNhap({ dau, nhanXem, onApDung }: { dau: Filters["locations"]; nhanXem: string; onApDung: (l: Filters["locations"]) => void }) {
  const [nhap, setNhap] = useState(dau);
  return <><LocationPanel locations={nhap} onChange={setNhap} onClose={() => onApDung(nhap)} onApDung={() => onApDung(nhap)} onDatLai={() => setNhap([])} /></>;
}

export default function TruongLocTrangChu({
  muc, value: f, onChange, onXong, gon = false, seg = false, the = false, chi, nhanXem = "Tìm kiếm", soLoai, duAn,
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
  /** Chỉ hiện các trường này (kv · da · lda · cdt · lh · gia · dt · pn · them); bỏ trống = hiện hết */
  chi?: string[];
  /** Chữ nút lối ra đáy bảng chọn = chữ nút tìm của ô tìm ("Xem 62 tin" / "Tìm kiếm") */
  nhanXem?: string;
  /** Mua bán / Cho thuê: bảng [loại hình, số tin] theo các trường khác đã chọn (lib/thuHepTin — cùng gốc trang danh sách) */
  soLoai?: [string, number][];
  /** Dự án: danh sách dự án thật để thu hẹp hai chiều (lib/thuHepDuAn — cùng gốc trang Dự án) */
  duAn?: DuAnLoc[];
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const mb: "ban" | "thue" = muc === "thue" ? "thue" : "ban";
  // THU HẸP HAI CHIỀU = gốc chung với các trang con (01/11/2026): chưa chọn trường khác thì danh sách để đủ
  const demLoai = soLoai && coTruongKhacLoai(f) ? (loai: string) => demLoaiTu(soLoai, loai) : undefined;
  // lọc dự án chỉ khi lựa chọn đổi (useMemo — mở màn tìm, gõ chữ không lọc lại, 01/11/2026)
  const locDa = useMemo(() => (duAn ? thuHepDuAn(duAn, f) : null), [duAn, f]);
  const dsDuAnChon = useMemo(() => locDa?.tapDuAn.map((p) => ({ slug: p.slug, name: p.ten, location: p.diaChiTim.split(" · ")[0], developer: p.chuDauTu })), [locDa]);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const xong = (close: () => void) => { close(); onXong?.(); };
  const loiRa = (close: () => void, datLai: () => void) => <NutXem nhan={nhanXem} onClick={() => xong(close)} onReset={datLai} />;
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
    <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="kv" label={seg || the ? "Khu vực" : "Toàn quốc"} tieuDe="Khu vực" giuCo summary={nhanNoi(f.locations)} active={f.locations.length > 0} panelClassName="w-96" className={cls}>
      {({ close }) => <BangKhuVucNhap dau={f.locations} nhanXem={nhanXem} onApDung={(locations) => { onChange({ ...f, locations, project: "" }); xong(close); }} />}
    </FilterDropdown>
  );

  if (muc === "duan") {
    return (
      <FilterDropdownGroup>
        {hang(<>
          {khuVuc}
          {/* Trường riêng mục Dự án theo chuẩn tra cứu dự án (chủ dự án 01/11/2026) — bảng chọn dùng chung với trang /du-an */}
          {hien("lda") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="lda" label="Loại hình" summary={nhanLoai(f.types, CAY_LOAI_DU_AN)} active={f.types.length > 0} panelClassName="w-72" className={cls}>
            {/* LOẠI HÌNH DỰ ÁN = CÂY LOẠI HÌNH BẤT ĐỘNG SẢN cha – con — cùng trang Dự án (01/11/2026) */}
            {({ close }) => <><DaChon muc={loaiTheoCha(f.types, CAY_LOAI_DU_AN).map((g) => ({ nhan: g.nhan, bo: () => set({ types: f.types.filter((x) => !g.cac.includes(x)) }) }))} macDinh="Tất cả loại hình" />{locDa && <PanelLoaiBdsDuAn value={f.types} onChange={(types) => set({ types, loaiDuAn: [] })} dem={locDa.demLoaiBds} />}{loiRa(close, () => set({ types: [], loaiDuAn: [] }))}</>}
          </FilterDropdown>}
          {hien("cdt") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="cdt" label="Chủ đầu tư" summary={f.chuDauTu ?? ""} active={!!f.chuDauTu} panelClassName="w-80" className={cls}>
            {({ close }) => <><DaChon muc={f.chuDauTu ? [{ nhan: f.chuDauTu, bo: () => set({ chuDauTu: "" }) }] : []} onBoHet={() => set({ chuDauTu: "" })} /><PanelChuDauTu ds={locDa?.dsChuDauTu} hienSan={!!locDa?.coTruongKhac("cdt")} value={f.chuDauTu} onChange={(chuDauTu) => set({ chuDauTu })} onApply={() => xong(close)} /></>}
          </FilterDropdown>}
          {hien("da") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="da" label="Dự án" summary={f.project} active={!!f.project} panelClassName="w-72" className={cls}>
            {({ close }) => <><DaChon muc={f.project ? [{ nhan: f.project, bo: () => set({ project: "" }) }] : []} onBoHet={() => set({ project: "" })} /><ProjectPanel ds={dsDuAnChon} locations={f.locations} project={f.project} hienSan={!!locDa?.coTruongKhac("da")} onPick={(name) => { set({ project: f.project === name ? "" : name }); xong(close); }} /></>}
          </FilterDropdown>}
          {hien("them") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="them" label="Lọc thêm" summary={f.tinhTrang ? `Lọc thêm (${dsTinhTrang(f.tinhTrang).length})` : ""} active={!!f.tinhTrang} panelClassName="w-80" className={cls}>
            {({ close }) => <><DaChon muc={dsTinhTrang(f.tinhTrang).map((t) => ({ nhan: t, bo: () => set({ tinhTrang: dsTinhTrang(f.tinhTrang).filter((x) => x !== t).join("|") }) }))} onBoHet={() => set({ tinhTrang: "" })} /><PanelLocThemDuAn tinhTrang={f.tinhTrang} onChange={(tinhTrang) => set({ tinhTrang })} onApply={() => xong(close)} co={locDa?.coTruongKhac("tt") ? locDa.tinhTrangCo : undefined} />{loiRa(close, () => set({ tinhTrang: "" }))}</>}
          </FilterDropdown>}
        </>)}
      </FilterDropdownGroup>
    );
  }

  // số mục đang bật trong "Lọc thêm" (cùng cách đếm của FilterBar)
  // màn tìm điện thoại (the): Diện tích nằm TRONG "Lọc thêm" (chỉ 3 thẻ dưới thẻ tìm) → đếm luôn
  const soThem = (f.project ? 1 : 0) + (the && !hien("dt") && (f.areaMin != null || f.areaMax != null) ? 1 : 0) + (f.beds ? 1 : 0) + (mb === "ban" ? (f.direction ? 1 : 0) + (f.legal ? 1 : 0) : (f.furnishing ? 1 : 0)) + (f.verified ? 1 : 0) + (f.broker ? 1 : 0) + (f.dacDiem?.length ?? 0);
  return (
    <FilterDropdownGroup>
      {hang(<>
        {khuVuc}
        {hien("lh") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="lh" label="Loại hình" summary={nhanLoai(f.types, nhom)} active={f.types.length > 0} panelClassName="w-72" className={cls}>
          {({ close }) => (
            <div>
              <DaChon muc={loaiTheoCha(f.types, nhom).map((g) => ({ nhan: g.nhan, bo: () => set({ types: f.types.filter((y) => !g.cac.includes(y)) }) }))} macDinh="Tất cả loại nhà đất" />
              <div className="space-y-1.5 pr-1">
                {nhom.map((g0) => ({ ...g0, du: g0.items })).map((g) => { /* luôn đủ lựa chọn (anh 07/11/2026) */
                  const ca = g.items.every((t) => f.types.includes(t));
                  return (
                    <div key={g.label}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">
                        <input type="checkbox" checked={ca} onChange={() => set({ types: ca ? f.types.filter((t) => !g.du.includes(t)) : [...new Set([...f.types, ...g.du])] })} className="h-4 w-4 shrink-0 accent-cvr-blue" />
                        {g.label}
                      </label>
                      {g.items.length > 1 && g.items.map((t) => {
                        const on = f.types.includes(t);
                        return (
                          <label key={t} className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pl-8 pr-2 text-sm text-cvr-ink/80 transition hover:bg-black/5">
                            <input type="checkbox" checked={on} onChange={() => set({ types: on ? f.types.filter((x) => x !== t) : [...f.types, t] })} className="h-4 w-4 shrink-0 accent-cvr-blue" />
                            <span className="flex-1 truncate">{tenLoai(t)}</span>
                            {/* bỏ số đếm cạnh lựa chọn (anh 07/11/2026: kết quả do dữ liệu quyết định) */}
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {/* CHỌN LÀ LỌC NGAY — không nút Đặt lại · Áp dụng (chủ dự án 01/11/2026: mỗi mức nhu cầu có lựa chọn, không ép khách bấm thêm) */}
              {loiRa(close, () => set({ types: [] }))}
            </div>
          )}
        </FilterDropdown>}
        {hien("gia") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="gia" label={mb === "thue" ? "Giá thuê/tháng" : "Mức giá"} summary={priceRangeText(f.priceMin, f.priceMax)} active={f.priceMin != null || f.priceMax != null} panelClassName="w-80" className={cls}>
          {({ close }) => (<>
            <DaChon muc={f.priceMin != null || f.priceMax != null ? [{ nhan: priceRangeText(f.priceMin, f.priceMax), bo: () => set({ priceMin: null, priceMax: null }) }] : []} onBoHet={() => set({ priceMin: null, priceMax: null })} />
            <RangePanel key={`${f.priceMin}-${f.priceMax}`} unit="tỷ" step={0.5} sliderMax={50} min={f.priceMin} max={f.priceMax} presets={priceRangesFor(mb)}
              onPick={(min, max) => set({ priceMin: min, priceMax: max })} onReset={() => set({ priceMin: null, priceMax: null })} onApply={() => xong(close)} />
            {/* trường chọn một: không nút Áp dụng — bấm là tìm */}
          </>)}
        </FilterDropdown>}
        {hien("dt") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="dt" label="Diện tích" summary={areaRangeText(f.areaMin, f.areaMax)} active={f.areaMin != null || f.areaMax != null} panelClassName="w-80" className={cls}>
          {({ close }) => (<>
            <DaChon muc={f.areaMin != null || f.areaMax != null ? [{ nhan: areaRangeText(f.areaMin, f.areaMax), bo: () => set({ areaMin: null, areaMax: null }) }] : []} onBoHet={() => set({ areaMin: null, areaMax: null })} />
            <RangePanel key={`${f.areaMin}-${f.areaMax}`} unit="m²" step={10} sliderMax={mb === "thue" ? 5000 : 500} min={f.areaMin} max={f.areaMax} presets={areaRangesFor(mb, f.types)}
              onPick={(min, max) => set({ areaMin: min, areaMax: max })} onReset={() => set({ areaMin: null, areaMax: null })} onApply={() => xong(close)} />
            {/* trường chọn một: không nút Áp dụng — bấm là tìm */}
          </>)}
        </FilterDropdown>}
        {/* LỌC THÊM — đúng chuẩn bộ lọc trang /mua-ban (FilterBar): phòng ngủ · hướng + pháp lý (mua bán) /
            nội thất (cho thuê) · tin xác thực · môi giới chuyên nghiệp. Khách cần chi tiết thì mở ở đây. */}
        {hien("them") && <FilterDropdown pill={!seg && !the} seg={seg} the={the} id="them" label="Lọc thêm" summary={soThem ? `Lọc thêm (${soThem})` : ""} active={soThem > 0} panelClassName="w-80" className={cls}>
          {({ close }) => (
            <div className="space-y-4">
              <DaChon muc={[
              ...(f.project ? [{ nhan: f.project, bo: () => set({ project: "" }) }] : []),
              ...(f.beds ? [{ nhan: f.beds === 5 ? "5+ PN" : `${f.beds} PN`, bo: () => set({ beds: 0 }) }] : []),
              ...(f.direction ? [{ nhan: f.direction, bo: () => set({ direction: "" }) }] : []),
              ...(f.legal ? [{ nhan: f.legal, bo: () => set({ legal: "" }) }] : []),
              ...(f.furnishing ? [{ nhan: f.furnishing, bo: () => set({ furnishing: "" }) }] : []),
              ...(f.verified ? [{ nhan: "Tin xác thực", bo: () => set({ verified: false }) }] : []),
              ...(f.broker ? [{ nhan: "Môi giới chuyên nghiệp", bo: () => set({ broker: false }) }] : []),
              ...(f.dacDiem ?? []).map((d) => ({ nhan: tenDacDiem(d), bo: () => set({ dacDiem: (f.dacDiem ?? []).filter((x) => x !== d) }) })),
            ]} onBoHet={() => set({ project: "", beds: 0, direction: "", legal: "", furnishing: "", verified: false, broker: false, dacDiem: [] })} />
              {the && !hien("dt") && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Diện tích</p>
                  <div className="flex flex-wrap gap-1.5">
                    {areaRangesFor(mb, f.types).map((r) => {
                      const on = f.areaMin === r.min && f.areaMax === r.max;
                      return <Chip key={r.label} active={on} onClick={() => set(on ? { areaMin: null, areaMax: null } : { areaMin: r.min, areaMax: r.max })}>{r.label}</Chip>;
                    })}
                  </div>
                </div>
              )}
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
              <NhomDacDiem chon={f.dacDiem ?? []} types={f.types} onDoi={(ds) => set({ dacDiem: ds })} />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Lọc khác</p>
                <div className="space-y-1">
                  <SwitchRow label="Tin xác thực" checked={f.verified} onChange={(v) => set({ verified: v })} />
                  <SwitchRow label="Môi giới chuyên nghiệp" checked={f.broker} onChange={(v) => set({ broker: v })} />
                </div>
              </div>
              {/* CHỌN LÀ LỌC NGAY — không nút Đặt lại · Áp dụng (chủ dự án 01/11/2026: mỗi mức nhu cầu có lựa chọn, không ép khách bấm thêm) */}
              {loiRa(close, () => set({ project: "", beds: 0, direction: "", legal: "", furnishing: "", verified: false, broker: false, dacDiem: [] }))}
            </div>
          )}
        </FilterDropdown>}
      </>)}
    </FilterDropdownGroup>
  );
}
