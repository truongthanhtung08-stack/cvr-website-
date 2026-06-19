"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings } from "@/lib/data";

const provinces = ["Đà Nẵng", "Thừa Thiên Huế", "Quảng Nam", "Quảng Ngãi", "Bình Định"];
const propertyTypes = [
  "Đất nền",
  "Căn hộ / Chung cư",
  "Nhà phố",
  "Villa / Biệt thự biển",
  "Condotel",
  "Đất công nghiệp",
  "Nhà xưởng / Kho bãi",
];
const priceRanges = ["Dưới 1 tỷ", "1 - 3 tỷ", "3 - 5 tỷ", "5 - 10 tỷ", "Trên 10 tỷ"];

// Đổi chuỗi giá "28,5 tỷ" → số tỷ. "Thỏa thuận" → null
function priceToTy(price: string): number | null {
  const m = price.replace(",", ".").match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function inRange(ty: number | null, range: string): boolean {
  if (ty === null) return false;
  switch (range) {
    case "Dưới 1 tỷ":
      return ty < 1;
    case "1 - 3 tỷ":
      return ty >= 1 && ty <= 3;
    case "3 - 5 tỷ":
      return ty > 3 && ty <= 5;
    case "5 - 10 tỷ":
      return ty > 5 && ty <= 10;
    case "Trên 10 tỷ":
      return ty > 10;
    default:
      return true;
  }
}

export default function SearchClient() {
  const params = useSearchParams();

  const [province, setProvince] = useState(params.get("tinh") ?? "");
  const [type, setType] = useState(params.get("loai") ?? "");
  const [price, setPrice] = useState(params.get("gia") ?? "");
  const [keyword, setKeyword] = useState(params.get("q") ?? "");

  const results = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return featuredListings.filter((item) => {
      if (province && !item.location.includes(province)) return false;
      if (type && item.type !== type) return false;
      if (price && !inRange(priceToTy(item.price), price)) return false;
      if (kw && !`${item.title} ${item.location} ${item.type}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [province, type, price, keyword]);

  function reset() {
    setProvince("");
    setType("");
    setPrice("");
    setKeyword("");
  }

  const hasFilter = province || type || price || keyword;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Tìm kiếm bất động sản</h1>
        <p className="mt-1.5 text-sm text-white/55">
          Lọc theo khu vực, loại hình và mức giá tại Miền Trung — minh bạch, trực tiếp.
        </p>
      </div>

      {/* Thanh lọc */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-2 rounded-2xl border border-white/12 bg-white/[0.04] p-2.5 shadow-xl shadow-black/30 backdrop-blur-md md:flex-row md:items-center md:gap-1.5"
      >
        <Select label="Khu vực" value={province} onChange={setProvince} options={provinces} placeholder="Toàn khu vực" />
        <span className="hidden h-6 w-px bg-white/12 md:block" />
        <Select label="Loại hình" value={type} onChange={setType} options={propertyTypes} placeholder="Mọi loại hình" />
        <span className="hidden h-6 w-px bg-white/12 md:block" />
        <Select label="Mức giá" value={price} onChange={setPrice} options={priceRanges} placeholder="Mọi mức giá" />
        <span className="hidden h-6 w-px bg-white/12 md:block" />
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Từ khoá: dự án, đường, phường…"
            className="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40 focus:bg-white/10"
          />
        </div>
      </form>

      {/* Tổng kết + xoá lọc */}
      <div className="mb-5 mt-5 flex items-center justify-between">
        <p className="text-sm text-white/70">
          <span className="font-bold text-white">{results.length}</span> bất động sản
          {hasFilter ? " phù hợp" : ""}
        </p>
        {hasFilter && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/35 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Kết quả */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <svg className="mb-4 h-12 w-12 text-white/25" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <p className="text-white/70">Không tìm thấy bất động sản phù hợp.</p>
          <p className="mt-1 text-sm text-white/45">Thử nới rộng bộ lọc hoặc xoá từ khoá.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-cl-ink transition hover:bg-white/90"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/10 md:min-w-[150px]"
    >
      <option value="" className="bg-cl-ink">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o} className="bg-cl-ink">
          {o}
        </option>
      ))}
    </select>
  );
}
