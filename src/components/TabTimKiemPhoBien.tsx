"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { normalizeVi } from "@/lib/filters";

export type TabLienKet = { ten: string; links: { href: string; nhan: string }[] };

// Phần bấm tab của khối "Tìm kiếm phổ biến" (TimKiemPhoBien.tsx). Tab không chọn chỉ ẨN bằng lớp
// `hidden` — link vẫn nằm trong HTML máy chủ cho Google đọc.
//
// THEO HÀNH ĐỘNG CỦA KHÁCH (chủ dự án 17/10/2026: "vì sao tôi vào search, ra kết quả lại trả phần này"):
// HTML máy chủ giữ nguyên thứ tự (Google đọc đủ). Trên máy khách, sau khi trang mở, khối tự chọn tab và đưa
// link hợp lên đầu theo: trang đang đứng (/cho-thue/can-ho/da-nang) → câu vừa tìm (?q=…, lịch sử tìm) →
// mục Mua bán / Cho thuê khách chọn trên menu trang chủ (đổi là khối đổi ngay).
const RECENT_KEY = "cvr-recent-search";
const MUC_KEY = "cvr-muc-tim";

const tuCua = (s: string) => normalizeVi(s).replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length > 1 || /\d/.test(w));
const BO = new Set(["ban", "mua", "cho", "thue", "nha", "dat", "tai", "duoi", "tren", "ty", "trieu", "phuong", "quan", "xa"]);

export default function TabTimKiemPhoBien({ tabs }: { tabs: TabLienKet[] }) {
  const [dang, setDang] = useState(0);
  // THU GỌN (chủ dự án 24/10/2026: "phần này càng ngày càng dài thêm"): mỗi tab hiện 4 hàng — điện thoại 8 · 3 cột 9 ·
  // máy tính 12 link; còn lại ẩn bằng CSS (vẫn trong HTML cho Google) tới khi bấm "Xem thêm". Đổi tab → thu gọn lại.
  const [mo, setMo] = useState(false);
  useEffect(() => { setMo(false); }, [dang]);
  const [tinHieu, setTinHieu] = useState<{ tu: string[]; muc: "ban" | "thue" | null }>({ tu: [], muc: null });
  const pathname = usePathname() || "/";

  // Gom tín hiệu hành động: trang đang đứng · câu tìm trên địa chỉ · lịch sử tìm · mục đã chọn
  useEffect(() => {
    const doc = () => {
      const tu: string[] = [];
      let muc: "ban" | "thue" | null = pathname.startsWith("/cho-thue") ? "thue" : pathname.startsWith("/mua-ban") ? "ban" : null;
      tu.push(...tuCua(pathname.replace(/[/-]/g, " ")));
      const params = new URLSearchParams(window.location.search);
      for (const k of ["q", "keyword", "kv", "loai"]) { const v = params.get(k); if (v) tu.push(...tuCua(v)); }
      try {
        const ganDay = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as { label?: string }[];
        for (const g of ganDay.slice(0, 2)) if (g.label) tu.push(...tuCua(g.label));
        if (!muc) { const m = localStorage.getItem(MUC_KEY); if (m === "ban" || m === "thue") muc = m; }
      } catch { /* bỏ qua */ }
      setTinHieu({ tu: tu.filter((w) => !BO.has(w)), muc });
    };
    doc();
    // Menu trang chủ đổi Mua bán / Cho thuê → khối đổi ngay (TimTrangChu phát sự kiện này)
    window.addEventListener("cvr-muc-tim", doc);
    return () => window.removeEventListener("cvr-muc-tim", doc);
  }, [pathname]);

  // Điểm của tab: đúng mục (Mua bán / Cho thuê) + số chữ khớp tín hiệu ở tên tab và trong các link
  const diemLink = (nhan: string) => { const w = new Set(tuCua(nhan)); return tinHieu.tu.filter((t) => w.has(t)).length; };
  useEffect(() => {
    if (!tinHieu.tu.length && !tinHieu.muc) return;
    let tot = 0, diemTot = -1;
    tabs.forEach((t, i) => {
      const ten = normalizeVi(t.ten);
      const dungMuc = tinHieu.muc ? (tinHieu.muc === "thue") === ten.startsWith("cho thue") : true;
      const d = (dungMuc ? 100 : 0) + tinHieu.tu.filter((w) => tuCua(t.ten).includes(w)).length * 10 + Math.max(0, ...t.links.map((l) => diemLink(l.nhan)));
      if (d > diemTot) { diemTot = d; tot = i; }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chọn tab theo hành động sau khi đọc tín hiệu
    setDang(tot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tinHieu, tabs]);

  // Khối trước luôn có đệm đáy riêng (danh sách tin pb-footer, khu vực…) → đệm trên nhỏ, không cộng dồn thành khoảng trống to (22/10/2026)
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-2 sm:px-6 sm:pb-14 sm:pt-6 lg:px-8">
      <h2 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tìm kiếm phổ biến</h2>
      <div role="tablist" className="no-scrollbar mt-5 flex gap-6 overflow-x-auto border-b border-cvr-line">
        {tabs.map((t, i) => (
          <button
            key={t.ten}
            type="button"
            role="tab"
            aria-selected={i === dang}
            onClick={() => setDang(i)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors ${
              i === dang ? "border-cvr-ink text-cvr-ink" : "border-transparent text-cvr-muted hover:text-cvr-ink"
            }`}
          >
            {t.ten}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.ten} className={i === dang ? "" : "hidden"}>
        <div role="tabpanel" className={`mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 ${mo ? "" : "max-sm:[&>*:nth-child(n+9)]:hidden sm:max-lg:[&>*:nth-child(n+10)]:hidden lg:[&>*:nth-child(n+13)]:hidden"}`}>
          {/* Link đúng nơi khách tìm lên đầu (thứ tự trong HTML máy chủ giữ nguyên cho tới khi trang chạy) */}
          {(tinHieu.tu.length ? [...t.links].sort((a, b) => diemLink(b.nhan) - diemLink(a.nhan)) : t.links).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm leading-snug text-cvr-body transition-colors hover:text-cvr-ink hover:underline">
              {l.nhan}
            </Link>
          ))}
        </div>
        {t.links.length > 8 && (
          <button
            type="button"
            onClick={() => setMo((v) => !v)}
            className={`mt-4 text-[14px] font-semibold text-cvr-blue-ink ${t.links.length <= 9 ? "sm:hidden" : ""} ${t.links.length <= 12 ? "lg:hidden" : ""}`}
          >
            {mo ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
        </div>
      ))}
    </section>
  );
}
