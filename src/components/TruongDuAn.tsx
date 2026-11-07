"use client";

import { useEffect, useState } from "react";
import { Chip, DaChonLenDau } from "@/components/FilterBar";
import { projectCategories } from "@/lib/categories";
import { TINH_TRANG_DU_AN } from "@/lib/truongDuAn";
import { khopTen, normalizeVi, tenLoaiHinh } from "@/lib/filters";
import { CAY_LOAI_DU_AN } from "@/lib/thuHepDuAn";
import { napDsDuAn } from "@/lib/duAnTen";

// ============================================================================
// TRƯỜNG LỌC RIÊNG MỤC DỰ ÁN — chuẩn tra cứu dự án (chủ dự án 01/11/2026: "bộ lọc dùng chung, bổ sung cho dự án các trường đặc
// thù"). MỘT bộ bảng chọn dùng ở cả tab Dự án trang chủ (TruongLocTrangChu) lẫn trang /du-an (ProjectsBrowser): nút ngoài theo kiểu
// của từng trang, bảng chọn bên trong như nhau, cùng cách bấm Đặt lại · Áp dụng như Mua bán / Cho thuê.
//   · Loại hình = nhóm của trang /du-an/<loại> (projectCategories), chọn nhiều
//   · Tình trạng = đúng 4 giá trị chuẩn hồ sơ dự án (TRANG_THAI_HOP_LE)
//   · Chủ đầu tư = tên công ty có trong hồ sơ dự án thật
// Chọn MỘT giá trị (Tình trạng, Chủ đầu tư) = chốt luôn, đóng bảng, ra kết quả — như chọn Dự án ở Mua bán; chọn NHIỀU (Loại hình)
// mới có Đặt lại · Áp dụng như Loại BĐS.
// ============================================================================

/** Tên ngắn trên nút: một nhóm → tên nhóm; nhiều nhóm → "n loại hình" */
export const tomTatLoaiDuAn = (ds: string[] = []) =>
  ds.length === 0 ? "" : ds.length === 1 ? projectCategories.find((c) => c.slug === ds[0])?.label ?? "" : `${ds.length} loại hình`;

/** dem: số dự án của từng nhóm theo dữ liệu thật (trang Dự án) → chỉ hiện nhóm CÓ dự án, kèm số; không truyền → đủ danh mục */
export function PanelLoaiDuAn({ value = [], onChange, dem }: { value?: string[]; onChange: (v: string[]) => void; onApply: () => void; dem?: (slug: string) => number }) {
  const ds = projectCategories; // luôn đủ lựa chọn, không ẩn mục chưa có dự án (anh 07/11/2026)
  // CÙNG LOGIC "Loại BĐS" Mua bán (chủ dự án 20/10/2026): chưa chọn = TẤT CẢ; bấm "Tất cả" = bỏ lọc; chọn đủ mọi loại = về "Tất cả"
  const tatCa = ds.map((c) => c.slug);
  const doiLoai = (s: string, on: boolean) => {
    const next = on ? value.filter((x) => x !== s) : [...value, s];
    onChange(tatCa.every((x) => next.includes(x)) ? [] : next);
  };
  return (
    <div>
      {/* "Tất cả" KHÔNG lặp hai lần (chủ dự án 01/11/2026): chưa chọn gì thì dòng đã chọn trên cùng ghi "Tất cả …"; bỏ chọn bằng × hoặc Đặt lại */}
      <div className="mt-1 space-y-0.5 pr-1">
        {ds.map((c) => {
          const on = value.includes(c.slug);
          return (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-cvr-ink transition hover:bg-black/5">
              <input type="checkbox" checked={on} onChange={() => doiLoai(c.slug, on)} className="h-4 w-4 shrink-0 accent-cvr-blue" />
              <span className="flex-1">{c.label}</span>
              {/* bỏ số đếm cạnh lựa chọn (anh 07/11/2026: kết quả do dữ liệu quyết định) */}
            </label>
          );
        })}
      </div>
      {/* CHỌN LÀ LỌC NGAY — không nút Đặt lại · Áp dụng (chủ dự án 01/11/2026: mỗi mức nhu cầu có lựa chọn, không ép khách bấm thêm) */}
    </div>
  );
}

/** co: tình trạng đang có trong dữ liệu theo các lựa chọn khác → chỉ hiện những tình trạng đó */
export function PanelTinhTrang({ value = "", onChange, co }: { value?: string; onChange: (v: string) => void; onApply: () => void; co?: string[] }) {
  const ds = value.split("|").filter(Boolean);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {/* CHỌN NHIỀU tình trạng (chủ dự án 02/11/2026): bấm bật / tắt từng tình trạng, bấm Áp dụng mới tìm — lưu "A|B" */}
        {TINH_TRANG_DU_AN.filter((x) => !co || co.includes(x) || ds.includes(x)).map((t) => <Chip key={t} active={ds.includes(t)} onClick={() => onChange((ds.includes(t) ? ds.filter((x) => x !== t) : [...ds, t]).join("|"))}>{t}</Chip>)}
      </div>
    </div>
  );
}

/** LỌC THÊM mục Dự án (chủ dự án 01/11/2026: dưới ô tìm chỉ Khu vực · Dự án · Loại hình · Chủ đầu tư, trường khác vào Lọc thêm theo thứ
 *  tự ưu tiên) — hiện: Tình trạng. Chọn là xong. */
export function PanelLocThemDuAn({ tinhTrang = "", onChange, onApply, co }: { tinhTrang?: string; onChange: (v: string) => void; onApply: () => void; co?: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Tình trạng</p>
      <PanelTinhTrang value={tinhTrang} onChange={onChange} onApply={onApply} co={co} />
    </div>
  );
}

/** ds: danh sách chủ đầu tư trang cha có sẵn; không truyền → nạp từ danh mục dự án (/api/du-an/ten) lúc mở bảng */
/** hienSan: đã thu hẹp bằng trường trước → hiện sẵn danh sách; không thì gõ mới hiện (trường chọn — chủ dự án 01/11/2026) */
export function PanelChuDauTu({ value = "", ds, onChange, onApply, hienSan = false }: { value?: string; ds?: string[]; onChange: (v: string) => void; onApply: () => void; hienSan?: boolean }) {
  const [nap, setNap] = useState<string[]>([]);
  useEffect(() => {
    if (ds) return;
    void napDsDuAn().then((x) => setNap([...new Set(x.map((d) => d.cdt ?? "").filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"))));
  }, [ds]);
  const tatCa = ds ?? nap;
  const [q, setQ] = useState("");
  const nq = normalizeVi(q);
  const list = nq ? tatCa.filter((x) => khopTen(x, q)) : hienSan ? tatCa : [];
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm chủ đầu tư…" aria-label="Tìm chủ đầu tư" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60" />
      <div className="mt-2 space-y-0.5">
        {nq && list.length === 0 && <p className="px-2 py-3 text-center text-sm text-cvr-faint">Không có chủ đầu tư khớp</p>}
        {list.map((x) => (
          <button key={x} type="button" onClick={() => { onChange(value === x ? "" : x); onApply(); }}
            className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition ${value === x ? "bg-cvr-blue/10 font-medium text-cvr-blue-ink" : "text-cvr-ink/80 hover:bg-black/5"}`}>
            <span className="truncate">{x}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** LOẠI HÌNH DỰ ÁN THEO CÂY LOẠI HÌNH MUA BÁN, CHA – CON (chủ dự án 01/11/2026: dùng chính cây loại hình bất động sản đã cấu trúc —
 *  lib/thuHepDuAn CAY_LOAI_DU_AN). Cùng cách chọn bảng Loại BĐS Mua bán: bấm nhóm = cả nhóm, bấm loại con = loại đó. Chỉ hiện loại CÓ
 *  dự án thật (dem — theo các trường khác đã chọn), kèm số. value = f.types (cùng trường loại hình của bộ lọc chung). */
export function PanelLoaiBdsDuAn({ value = [], onChange, dem }: { value?: string[]; onChange: (v: string[]) => void; dem: (o: string) => number }) {
  const cay = CAY_LOAI_DU_AN; // luôn đủ lựa chọn (anh 07/11/2026)
  // tick loại nào GIỮ loại đó — bỏ quy tắc "tick đủ mọi loại = Tất cả": nơi chỉ có MỘT loại (Cẩm Lệ: chỉ Căn hộ) thì tick là bị tự bỏ
  // tick, khách không chọn được (ảnh chủ dự án 01/11/2026)
  const dat = (next: string[]) => onChange(next);
  return (
    <div className="mt-1 space-y-1.5 pr-1">
      {/* NHÓM CÓ MỤC ĐÃ CHỌN LÊN ĐẦU, trong nhóm mục đã chọn lên trước — chốt lúc mở bảng, như bảng Khu vực (02/11/2026) */}
      <DaChonLenDau ds={cay} khoa={(g) => g.label} daChon={(g) => g.items.some((o) => value.includes(o))}>
      {(dsNhom) => dsNhom.map((g) => {
        const ca = g.items.every((o) => value.includes(o));
        return (
          <div key={g.label}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 pb-0.5 pt-1.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">
              <input type="checkbox" checked={ca} onChange={() => dat(ca ? value.filter((x) => !g.items.includes(x)) : [...new Set([...value, ...g.items])])} className="h-4 w-4 shrink-0 accent-cvr-blue" />
              <span className="truncate">{g.label}</span>
            </label>
            <DaChonLenDau ds={g.items} khoa={(o) => o} daChon={(o) => value.includes(o)}>
            {(dsLoai) => dsLoai.map((o) => {
              const on = value.includes(o);
              return (
                <label key={o} className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pl-8 pr-2 text-sm text-cvr-ink/80 transition hover:bg-black/5">
                  <input type="checkbox" checked={on} onChange={() => dat(on ? value.filter((x) => x !== o) : [...value, o])} className="h-4 w-4 shrink-0 accent-cvr-blue" />
                  <span className="flex-1 truncate">{tenLoaiHinh(o)}</span>
                  {/* bỏ số đếm cạnh lựa chọn (anh 07/11/2026: kết quả do dữ liệu quyết định) */}
                </label>
              );
            })}
            </DaChonLenDau>
          </div>
        );
      })}
      </DaChonLenDau>
    </div>
  );
}
