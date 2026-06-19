"use client";

import { useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";

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
    <section className="relative isolate flex min-h-[440px] items-end justify-center overflow-hidden">
      <Image
        src={asset("/images/hero1.png")}
        alt="Bất động sản Miền Trung"
        fill
        priority
        sizes="100vw"
        className="animate-kenburns object-cover contrast-[1.03] saturate-[1.08] brightness-[0.92]"
      />
      {/* Lớp phủ: đậm ở trên cho header rõ trên nền sáng, giữa hiện màu, đậm dần xuống đáy cho thanh lọc + hoà nền */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-cl-ink" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cl-ink via-cl-ink/60 to-transparent" />

      <div className="relative w-full max-w-4xl px-4 pb-10 pt-24 sm:px-6">
        {/* Tiêu đề gọn */}
        <h1 className="hero-in hero-in-1 mb-4 max-w-2xl text-balance font-serif text-2xl font-bold leading-tight text-white drop-shadow-lg sm:text-[2rem]">
          Bất động sản Miền Trung — minh bạch, trực tiếp
        </h1>

        {/* Tabs */}
        <div className="hero-in hero-in-2 mb-2 flex gap-1.5">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-white text-cl-ink"
                  : "bg-black/40 text-white/80 backdrop-blur-sm hover:bg-black/60"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Thanh tìm kiếm 1 hàng — nền tối đậm cho cân, nổi rõ trên ảnh sáng */}
        <form
          onSubmit={handleSearch}
          className="hero-in hero-in-3 flex flex-col gap-2 rounded-2xl border border-white/15 bg-cl-ink/80 p-2 shadow-2xl ring-1 ring-inset ring-white/10 backdrop-blur-md md:flex-row md:items-center md:gap-1.5"
        >
          <Select label="Khu vực" value={province} onChange={setProvince} options={provinces} placeholder="Khu vực" />
          <span className="hidden h-6 w-px bg-white/15 md:block" />
          <Select label="Loại hình" value={type} onChange={setType} options={propertyTypes} placeholder="Loại hình" />
          <span className="hidden h-6 w-px bg-white/15 md:block" />
          <Select label="Mức giá" value={price} onChange={setPrice} options={priceRanges} placeholder="Mức giá" />
          <span className="hidden h-6 w-px bg-white/15 md:block" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Từ khoá..."
            className="h-11 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/45 outline-none transition focus:border-white/40 focus:bg-white/10 md:border-transparent md:bg-transparent"
          />
          <button
            type="submit"
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold text-cl-ink transition-all duration-200 hover:bg-white/90 hover:shadow-lg hover:shadow-white/10 active:scale-95"
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
      className="h-11 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/10 md:border-transparent md:bg-transparent"
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
