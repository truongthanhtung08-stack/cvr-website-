"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FilterDropdown, { FilterDropdownGroup } from "@/components/FilterDropdown";
import PhanTrang from "@/components/PhanTrang";
import { normalizeVi } from "@/lib/filters";
import { useSoMoiTrang } from "@/lib/useSoMoiTrang";
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// TRA CỨU DỰ ÁN (chủ dự án 29/10/2026): danh bạ CHỮ, không ảnh, kiểu tra mã số thuế — máy tính và điện thoại cùng chức năng.
// Ô tìm + Khu vực · Loại hình · Tình trạng lọc ngay tại chỗ; bấm tên → trang dự án.

const ALL = "Tất cả";
// Gom loại hình tự do của dự án về nhóm lớn — cùng cách trang Dự án nổi bật (ProjectsBrowser)
const nhomLoai = (type: string) =>
  !type ? "" : type.includes("Căn hộ") ? "Căn hộ" : type.includes("đô thị") ? "Khu đô thị" : "Nghỉ dưỡng & biệt thự";

function dem(ds: DongTraCuu[], key: (d: DongTraCuu) => string): string[] {
  const m = new Map<string, number>();
  for (const d of ds) { const k = key(d); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

export default function TraCuuDuAn({ ds }: { ds: DongTraCuu[] }) {
  const [q, setQ] = useState("");
  const [tinh, setTinh] = useState(ALL);
  const [loai, setLoai] = useState(ALL);
  const [tinhTrang, setTinhTrang] = useState(ALL);
  const [trang, setTrang] = useState(1);
  const moiTrang = useSoMoiTrang();

  const loc = useMemo(() => {
    const tu = normalizeVi(q).split(/\s+/).filter(Boolean);
    return ds.filter((d) => {
      if (tinh !== ALL && d.tinh !== tinh) return false;
      if (loai !== ALL && nhomLoai(d.loaiHinh) !== loai) return false;
      if (tinhTrang !== ALL && d.tinhTrang !== tinhTrang) return false;
      if (!tu.length) return true;
      const chu = normalizeVi(`${d.ten} ${d.chuDauTu} ${d.loaiHinh} ${d.diaChi} ${d.diaChiCu}`);
      return tu.every((t) => chu.includes(t));
    });
  }, [ds, q, tinh, loai, tinhTrang]);

  const tong = Math.max(1, Math.ceil(loc.length / moiTrang));
  const hienTai = Math.min(trang, tong);
  const trangNay = loc.slice((hienTai - 1) * moiTrang, hienTai * moiTrang);

  const chon = (ten: string, cacGiaTri: string[], gt: string, dat: (v: string) => void) => (
    <FilterDropdown label={ten} summary={gt === ALL ? "" : gt} active={gt !== ALL} panelClassName="w-64" className="shrink-0">
      {({ close }) => (
        <div className="space-y-0.5">
          {[ALL, ...cacGiaTri].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { dat(v); setTrang(1); close(); }}
              className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                gt === v ? "bg-cvr-blue/10 font-medium text-cvr-blue-ink" : "text-cvr-ink/80 hover:bg-black/5"
              }`}
            >
              <span className="truncate">{v}</span>
            </button>
          ))}
        </div>
      )}
    </FilterDropdown>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-cvr-line bg-white px-4 focus-within:border-cvr-blue">
          <svg className="h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" /></svg>
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setTrang(1); }}
            placeholder="Tìm tên dự án, chủ đầu tư, khu vực"
            className="min-w-0 flex-1 bg-transparent text-base text-cvr-ink outline-none placeholder:text-cvr-muted"
          />
        </label>
        <div className="flex gap-2">
          <FilterDropdownGroup>
            {chon("Khu vực", dem(ds, (d) => d.tinh), tinh, setTinh)}
            {chon("Loại hình", dem(ds, (d) => nhomLoai(d.loaiHinh)), loai, setLoai)}
            {chon("Tình trạng", dem(ds, (d) => d.tinhTrang), tinhTrang, setTinhTrang)}
          </FilterDropdownGroup>
        </div>
      </div>

      <p className="mt-4 text-sm text-cvr-muted">{loc.length} dự án</p>

      <ul className="mt-1 divide-y divide-cvr-line border-y border-cvr-line">
        {trangNay.map((d) => (
          <li key={d.slug}>
            <Link href={`/du-an/${d.slug}`} className="group block py-4">
              <span className="text-[17px] font-semibold text-cvr-ink group-hover:text-cvr-blue-ink group-hover:underline">{d.ten}</span>
              {d.chuDauTu && <span className="mt-1 block text-sm text-cvr-body">Chủ đầu tư: {d.chuDauTu}</span>}
              {d.loaiHinh && <span className="mt-0.5 block text-sm text-cvr-body">Loại hình: {d.loaiHinh}</span>}
              <span className="mt-0.5 block text-sm text-cvr-muted">{d.diaChi}</span>
              {d.diaChiCu && <span className="block text-[13px] text-cvr-faint">Địa chỉ cũ: {d.diaChiCu}</span>}
              {(d.ban > 0 || d.thue > 0) && (
                <span className="mt-1 block text-[13px] text-cvr-body">
                  {[d.ban > 0 && `Bán (${d.ban})`, d.thue > 0 && `Cho thuê (${d.thue})`].filter(Boolean).join(" · ")}
                </span>
              )}
            </Link>
          </li>
        ))}
        {loc.length === 0 && (
          <li className="py-10 text-center text-sm text-cvr-muted">Chưa có dự án phù hợp bộ lọc.</li>
        )}
      </ul>

      <PhanTrang hienTai={hienTai} tong={tong} doiTrang={(p) => { setTrang(p); window.scrollTo({ top: 0 }); }} />
    </div>
  );
}
