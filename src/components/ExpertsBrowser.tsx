"use client";

import { useState } from "react";
import ExpertCard from "@/components/ExpertCard";
import { experts, type City } from "@/lib/experts";

const TABS: ("Tất cả" | City)[] = ["Tất cả", "Đà Nẵng", "Huế"];

// Danh bạ chuyên gia có tab lọc theo thành phố. `initialCity` để các trang con
// (/chuyen-gia/da-nang, /chuyen-gia/hue) mở sẵn đúng tab.
export default function ExpertsBrowser({ initialCity }: { initialCity?: City }) {
  const [tab, setTab] = useState<"Tất cả" | City>(initialCity ?? "Tất cả");
  const list = tab === "Tất cả" ? experts : experts.filter((e) => e.city === tab);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              tab === t
                ? "scale-105 bg-cvr-ink text-white shadow-lg shadow-black/10"
                : "border border-black/15 text-cvr-body hover:border-black/40 hover:text-cvr-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-cvr-body">
        <span className="font-bold text-cvr-ink">{list.length}</span> chuyên gia
        {tab !== "Tất cả" ? ` tại ${tab}` : ""}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => <ExpertCard key={e.slug} e={e} />)}
      </div>
    </>
  );
}
