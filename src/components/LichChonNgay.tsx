"use client";

import { useEffect, useState } from "react";

// ============================================================================
// LỊCH CHỌN NGÀY CHO MÁY TÍNH (chủ dự án 23/10/2026: "mỗi giao diện PC / mobile khác nhau — cái lịch chọn ngày bấm lên nhìn nhỏ
// xíu"): lịch của trình duyệt máy tính bé và theo ngôn ngữ máy (tiếng Anh ra tháng/ngày kiểu Mỹ). Bảng tháng riêng: thứ T2…CN,
// ô ngày to, chỉ bấm được trong khoảng cho phép. Điện thoại vẫn dùng lịch của máy (to, quen tay).
// Ngày là chuỗi "YYYY-MM-DD" theo lịch Việt Nam — tính bằng UTC thuần ngày, không dính múi giờ máy.
// ============================================================================

const THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const chuoi = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function LichChonNgay({
  value,
  min,
  max,
  onChon,
  onDong,
}: {
  value: string;
  min: string;
  max: string;
  onChon: (v: string) => void;
  onDong: () => void;
}) {
  const goc = value || min;
  const [thang, setThang] = useState({ y: Number(goc.slice(0, 4)), m: Number(goc.slice(5, 7)) - 1 });

  useEffect(() => {
    const phim = (e: KeyboardEvent) => e.key === "Escape" && onDong();
    window.addEventListener("keydown", phim);
    return () => window.removeEventListener("keydown", phim);
  }, [onDong]);

  const soNgay = new Date(Date.UTC(thang.y, thang.m + 1, 0)).getUTCDate();
  const lech = (new Date(Date.UTC(thang.y, thang.m, 1)).getUTCDay() + 6) % 7; // thứ Hai đầu tuần
  const dauThang = chuoi(thang.y, thang.m, 1);
  const cuoiThang = chuoi(thang.y, thang.m, soNgay);
  const lui = () => setThang(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const toi = () => setThang(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  const nut = "flex h-9 w-9 items-center justify-center rounded-full text-cvr-ink transition hover:bg-cvr-surface disabled:pointer-events-none disabled:opacity-30";

  return (
    <>
      {/* chạm ra ngoài = đóng */}
      <div className="fixed inset-0 z-40" onClick={onDong} aria-hidden />
      <div role="dialog" aria-label="Chọn ngày" className="absolute left-0 top-full z-50 mt-2 w-[320px] rounded-2xl border border-cvr-line bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Tháng trước" disabled={dauThang <= min} onClick={lui} className={nut}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <p className="text-[15px] font-semibold text-cvr-ink">Tháng {thang.m + 1}, {thang.y}</p>
          <button type="button" aria-label="Tháng sau" disabled={cuoiThang >= max} onClick={toi} className={nut}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {THU.map((t) => <span key={t} className="py-1 text-[12px] font-semibold text-cvr-muted">{t}</span>)}
          {Array.from({ length: lech }, (_, i) => <span key={`trong-${i}`} />)}
          {Array.from({ length: soNgay }, (_, i) => {
            const ngay = chuoi(thang.y, thang.m, i + 1);
            const duoc = ngay >= min && ngay <= max;
            const dang = ngay === value;
            return (
              <button
                key={ngay}
                type="button"
                disabled={!duoc}
                aria-pressed={dang}
                onClick={() => { onChon(ngay); onDong(); }}
                className={`h-10 rounded-lg text-[14px] tabular-nums transition disabled:cursor-default disabled:text-cvr-faint/60 ${
                  dang ? "bg-cvr-ink font-bold text-white" : "font-medium text-cvr-ink hover:bg-cvr-surface"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
