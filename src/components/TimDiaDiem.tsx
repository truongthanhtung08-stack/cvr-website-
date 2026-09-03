"use client";

import { useEffect, useRef, useState } from "react";
import { goiYDiaChi, type GoiYDiaChi } from "@/lib/timToaDo";

// ── THANH NHẬP ĐỊA CHỈ CÓ GỢI Ý TÊN ĐƯỜNG ────────────────────────────────────
//
// Dùng chung cho NGƯỜI ĐĂNG (ghim vị trí bất động sản) và NGƯỜI XEM (tìm chỗ trên
// bản đồ). Gõ vài chữ là ra danh sách để chọn, chọn xong bản đồ bay tới đó.
//
// VÌ SAO PHẢI CHO CHỌN chứ không để máy tự đoán: tên đường ở Việt Nam trùng nhau
// rất nhiều — "Nguyễn Văn Linh" tỉnh nào cũng có, "Lê Lợi" phường nào cũng có.
// Máy đoán một mình là ghim sai, mà ghim sai thì người mua tới tận nơi không thấy nhà.
//
// ⚠️ HAI ĐIỀU VỀ CHỖ ĐẶT, ĐỪNG SỬA LẠI:
//   1. Thanh này KHÔNG nổi đè lên mặt bản đồ. Đặt nổi thì lúc thao tác nó che mất
//      chính chỗ đang cần nhìn. Nó nằm SÁT NGAY TRÊN bản đồ, chung một khung.
//   2. Bảng gợi ý mới là thứ được phép đè, và chỉ đè trong lúc đang gõ — chọn xong
//      hoặc bấm ra ngoài là biến mất.
export default function TimDiaDiem({
  value,
  onChange,
  onChon,
  khuVuc = "",
  nhan,
  batBuoc = false,
  placeholder = "Số nhà, tên đường…",
  dangBan = false,
}: {
  value: string;
  onChange: (v: string) => void;
  // Người dùng chọn một gợi ý → nơi gọi tự quyết định làm gì (bay tới, ghim…).
  onChon: (kq: GoiYDiaChi) => void;
  // Tỉnh/Phường đang chọn — ghép vào truy vấn cho kết quả đúng vùng.
  khuVuc?: string;
  nhan?: string;
  batBuoc?: boolean;
  placeholder?: string;
  // Nơi gọi đang bận (tra địa chỉ, tra ngược…) → hiện chữ "đang tìm…"
  dangBan?: boolean;
}) {
  const [ds, setDs] = useState<GoiYDiaChi[]>([]);
  const [mo, setMo] = useState(false);
  const [dangGoiY, setDangGoiY] = useState(false);
  const khungRef = useRef<HTMLDivElement>(null);
  // Chữ vừa chọn từ gợi ý — không hỏi gợi ý lại cho chính chữ đó, nếu không vừa
  // chọn xong bảng lại bung ra ngay.
  const vuaChonRef = useRef("");

  // Bấm ra ngoài thì đóng bảng gợi ý
  useEffect(() => {
    function ngoai(e: MouseEvent | TouchEvent) {
      if (khungRef.current && !khungRef.current.contains(e.target as Node)) setMo(false);
    }
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("touchstart", ngoai);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("touchstart", ngoai);
    };
  }, []);

  // Gõ xong 350ms mới hỏi — gõ tới đâu hỏi tới đó là phí và bị chặn vì gọi quá dày.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || q === vuaChonRef.current) {
      setDs([]);
      return;
    }
    let huy = false;
    setDangGoiY(true);
    const t = setTimeout(async () => {
      const kq = await goiYDiaChi(q, khuVuc);
      if (huy) return;
      setDangGoiY(false);
      setDs(kq);
      if (kq.length) setMo(true);
    }, 350);
    return () => {
      huy = true;
      clearTimeout(t);
      setDangGoiY(false);
    };
  }, [value, khuVuc]);

  function chon(kq: GoiYDiaChi) {
    vuaChonRef.current = kq.ten;
    onChange(kq.ten);
    setMo(false);
    setDs([]);
    onChon(kq);
  }

  return (
    <div ref={khungRef} className="relative">
      {nhan && (
        <label className="mb-1 block px-3.5 pt-2.5 text-[12px] font-semibold text-cvr-body">
          {nhan}
          {batBuoc && <span className="ml-1 text-rose-600">*</span>}
        </label>
      )}
      <div className="flex items-center">
        <svg className="ml-3.5 h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          value={value}
          onChange={(e) => {
            vuaChonRef.current = "";
            onChange(e.target.value);
          }}
          onFocus={() => ds.length && setMo(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMo(false);
            if (e.key === "Enter" && ds[0]) {
              e.preventDefault();
              chon(ds[0]);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent px-2.5 py-2.5 text-[15px] text-cvr-ink outline-none placeholder:text-cvr-faint"
        />
        {(dangGoiY || dangBan) && (
          <span className="mr-3.5 shrink-0 text-[12px] text-cvr-faint">đang tìm…</span>
        )}
        {!dangGoiY && !dangBan && value.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              vuaChonRef.current = "";
              onChange("");
              setDs([]);
              setMo(false);
            }}
            aria-label="Xoá"
            className="mr-2 shrink-0 rounded-md p-1.5 text-cvr-faint transition hover:bg-cvr-surface hover:text-cvr-ink"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {/* BẢNG GỢI Ý — thứ duy nhất được phép đè lên bản đồ, và chỉ trong lúc đang gõ.
          z-index trên 800: Leaflet xếp marker 600 / popup 700. */}
      {mo && ds.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-[1400] mt-1 max-h-[240px] overflow-y-auto rounded-xl border border-cvr-line bg-white py-1 shadow-[0_8px_28px_rgba(0,0,0,0.22)]">
          {ds.map((kq, i) => (
            <li key={`${kq.lat},${kq.lng},${i}`}>
              <button
                type="button"
                onClick={() => chon(kq)}
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-cvr-surface"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
                </svg>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-cvr-ink">{kq.ten}</span>
                  {kq.phu && <span className="block truncate text-[12.5px] text-cvr-muted">{kq.phu}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
