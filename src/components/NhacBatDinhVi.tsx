"use client";

import { huongDanBatDinhVi } from "@/lib/dinhVi";

// Khối chỉ khách bật lại định vị. Dùng chung cho cả ba bản đồ (3 tab · trang tin ·
// ghim khi đăng tin) để lời hướng dẫn ở đâu cũng như nhau.
//
// VÌ SAO CẦN NGUYÊN MỘT KHỐI CHỨ KHÔNG PHẢI MỘT DÒNG: khi trình duyệt đã nhớ
// "từ chối", nó KHÔNG hỏi lại nữa — khách bấm nút thấy im re, tưởng web hỏng.
// Phải nói rõ vì sao và chỉ đúng từng bước theo máy họ đang cầm.
export default function NhacBatDinhVi({
  loi,
  onThuLai,
  dangDinhVi,
  onDong,
}: {
  loi: string;
  onThuLai: () => void;
  dangDinhVi: boolean;
  onDong?: () => void;
}) {
  const buoc = huongDanBatDinhVi();
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-lg">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-amber-900">{loi}</p>
        {onDong && (
          <button
            type="button"
            onClick={onDong}
            aria-label="Đóng"
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-amber-900/70 transition hover:bg-amber-100 hover:text-amber-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <ol className="mt-2 space-y-1.5">
        {buoc.map((b, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug text-amber-900">
            <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-bold">
              {i + 1}
            </span>
            <span className="min-w-0">{b}</span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onThuLai}
        disabled={dangDinhVi}
        className="mt-2.5 inline-flex min-h-[36px] items-center rounded-lg border border-amber-400 bg-white px-3 text-[13px] font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
      >
        {dangDinhVi ? "Đang định vị…" : "Bật xong rồi, thử lại"}
      </button>
    </div>
  );
}
