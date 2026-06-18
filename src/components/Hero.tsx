"use client";

import { useState } from "react";
import Image from "next/image";

const tabs = ["Mua bán", "Cho thuê", "Dự án"];
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

export default function Hero() {
  const [tab, setTab] = useState(tabs[0]);
  const [province, setProvince] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [keyword, setKeyword] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (province) params.set("tinh", province);
    if (type) params.set("loai", type);
    if (price) params.set("gia", price);
    if (keyword) params.set("q", keyword);
    const base = tab === "Cho thuê" ? "/cho-thue" : tab === "Dự án" ? "/du-an" : "/mua-ban";
    window.location.href = `${base}?${params.toString()}`;
  }

  return (
    <section className="relative isolate flex min-h-[460px] items-center justify-center overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="animate-kenburns object-cover"
      />
      {/* Lớp phủ cinematic — nhẹ để vẫn thấy ảnh, hoà vào nền trang */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-cl-ink" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.4)_100%)]" />

      <div className="relative w-full max-w-4xl px-4 pt-16 sm:px-6">
        {/* Tabs */}
        <div className="flex gap-1.5">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-white/10 text-white backdrop-blur-xl"
                  : "text-white/60 hover:text-white/90"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Bộ lọc — kính mờ */}
        <form
          onSubmit={handleSearch}
          className="rounded-b-2xl rounded-tr-2xl border border-white/20 bg-gradient-to-b from-white/[0.13] to-white/[0.04] p-4 shadow-2xl ring-1 ring-inset ring-white/10 backdrop-blur-md sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Khu vực" value={province} onChange={setProvince} options={provinces} placeholder="Tất cả khu vực" />
            <Select label="Loại hình" value={type} onChange={setType} options={propertyTypes} placeholder="Tất cả loại hình" />
            <Select label="Mức giá" value={price} onChange={setPrice} options={priceRanges} placeholder="Tất cả mức giá" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Từ khoá..."
              className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder-white/45 outline-none transition focus:border-white/50 focus:bg-white/10"
            />
          </div>
          <button
            type="submit"
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-cl-ink transition-colors hover:bg-white/90 sm:w-48"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            Tìm kiếm
          </button>
        </form>
      </div>
    </section>
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
      className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/50 focus:bg-white/10"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
