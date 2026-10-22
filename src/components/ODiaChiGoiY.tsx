"use client";

import { useEffect, useState } from "react";
import { normalizeVi } from "@/lib/filters";
import { goiYDiaChi } from "@/lib/timToaDo";

// Ô "Địa chỉ cụ thể" CÓ GỢI Ý (chủ dự án 15/10/2026): gõ từ 3 chữ là gợi ý đường / địa điểm trong ĐÚNG phường – tỉnh đã
// chọn (kết quả tỉnh khác bị loại). Khách vẫn gõ tự do được (thêm số nhà, số lô…). Gợi ý chỉ hiện khi khách đang gõ.
// CHỌN GỢI Ý = CHỌN VỊ TRÍ (chủ dự án 22/10/2026 tối: "theo chức năng bản đồ, theo logic chọn vị trí"): điền tên vào ô và
// báo toạ độ của gợi ý cho bản đồ (onChonDiem) — bản đồ tới đúng chỗ đó và ghim (MapPickerMo, prop diemChon).
// Dùng chung form khách đăng tin và form admin đăng hộ / sửa tin.
export default function ODiaChiGoiY({ value, onChange, onChonDiem, placeholder, khuVuc, className, ghim }: {
  value: string;
  onChange: (v: string) => void;
  onChonDiem?: (p: { lat: number; lng: number }) => void;
  placeholder: string;
  khuVuc: { tinh: string; phuong: string };
  className: string;
  // Biểu tượng ghim đỏ đầu ô (cùng màu ghim bản đồ) — className phải chừa lề trái (pl-10)
  ghim?: boolean;
}) {
  const [ds, setDs] = useState<{ ten: string; phu: string; lat: number; lng: number }[]>([]);
  const [dangGo, setDangGo] = useState(false);
  const khoaKv = `${khuVuc.phuong}|${khuVuc.tinh}`;
  useEffect(() => {
    const q = value.trim();
    if (!dangGo || q.length < 3 || !khuVuc.tinh) return;
    let huy = false;
    const t = setTimeout(async () => {
      const kq = await goiYDiaChi(q, [khuVuc.phuong, khuVuc.tinh].filter(Boolean).join(", "));
      if (huy) return;
      const tinh = normalizeVi(khuVuc.tinh.replace(/^(Thành phố|Tỉnh)\s+/i, ""));
      const daCo = new Set<string>();
      setDs(kq.filter((x) => normalizeVi(x.phu).includes(tinh)).filter((x) => {
        const k = normalizeVi(x.ten);
        if (!x.ten || daCo.has(k)) return false;
        daCo.add(k);
        return true;
      }).slice(0, 5));
    }, 450);
    return () => { huy = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dangGo, khoaKv]);
  return (
    <div className="relative">
      {ghim && (
        <svg className="pointer-events-none absolute left-3 top-[24px] h-5 w-5 -translate-y-1/2 text-[#e11d48]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      )}
      <input
        value={value}
        onChange={(e) => { setDangGo(true); onChange(e.target.value); }}
        onBlur={() => setTimeout(() => setDangGo(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {dangGo && value.trim().length >= 3 && ds.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-cvr-line bg-white shadow-lux">
          {ds.map((x) => (
            <button
              key={x.ten + x.phu}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(x.ten);
                setDangGo(false);
                setDs([]);
                if (Number.isFinite(x.lat) && Number.isFinite(x.lng)) onChonDiem?.({ lat: x.lat, lng: x.lng });
              }}
              className="block w-full border-b border-cvr-line px-3 py-2.5 text-left last:border-0 hover:bg-cvr-surface"
            >
              <span className="block text-sm font-medium text-cvr-ink">{x.ten}</span>
              {x.phu && <span className="block text-xs text-cvr-muted">{x.phu}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
