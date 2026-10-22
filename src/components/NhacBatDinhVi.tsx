"use client";

import { useEffect, useState } from "react";
import { huongDanBatDinhVi, maCuaLoi, quyenDinhVi } from "@/lib/dinhVi";

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
  // Bước theo đúng lỗi (chưa cho phép / máy tắt Vị trí) và đúng chỗ khách mở web (trình duyệt, ứng dụng, Zalo…).
  const ma = maCuaLoi(loi);
  // Bị từ chối: hỏi trình duyệt quyền của TRANG — "denied" = trang bị chặn; còn lại = chính ứng dụng (Chrome, Safari…)
  // chưa được điện thoại cho dùng vị trí. Mỗi tầng một đường gỡ (22/10/2026).
  const [tang, setTang] = useState<"trang" | "ungDung" | "">("");
  useEffect(() => {
    if (ma !== 1) return;
    void quyenDinhVi().then((q) => setTang(q === "denied" ? "trang" : q === "granted" || q === "prompt" ? "ungDung" : ""));
  }, [ma]);
  const buoc = ma === 3 ? [] : huongDanBatDinhVi(ma, tang);
  // MẶC ĐỊNH CHỈ MỘT DÒNG. Chủ dự án chốt: đừng bày bảng hướng dẫn ra màn hình.
  // Web KHÔNG có quyền tự bật GPS của máy — đó là chặn của hệ điều hành, không
  // phải thiếu code — nên vẫn phải nói được một câu, kèm chỗ mở ra xem cách bật
  // cho ai cần. Ai không cần thì nhìn thấy đúng một dòng.
  const [moRong, setMoRong] = useState(false);
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

      <ol className={`mt-2 space-y-1.5 ${moRong ? "" : "hidden"}`}>
        {buoc.map((b, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug text-amber-900">
            <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-bold">
              {i + 1}
            </span>
            <span className="min-w-0">{b}</span>
          </li>
        ))}
      </ol>

      {/* Hai nút CÙNG MỘT HÀNG, có khoảng cách (22/10/2026: "Xem cách bật" từng bị nút "thử lại" đè lên). */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {!moRong && buoc.length > 0 && (
          <button
            type="button"
            onClick={() => setMoRong(true)}
            className="text-[12.5px] font-semibold text-amber-900 underline underline-offset-2"
          >
            Xem cách bật
          </button>
        )}
        <button
          type="button"
          onClick={onThuLai}
          disabled={dangDinhVi}
          className="inline-flex min-h-[36px] items-center rounded-lg border border-amber-400 bg-white px-3 text-[13px] font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
        >
          {dangDinhVi ? "Đang định vị…" : "Bật xong rồi, thử lại"}
        </button>
      </div>
    </div>
  );
}
