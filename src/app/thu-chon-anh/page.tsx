"use client";

import { useState } from "react";

// ════════════════════════════════════════════════════════════════════════════
// TRANG THỬ — TÌM CÁCH MỞ ĐƯỢC THƯ VIỆN ẢNH TRÊN TỪNG MÁY
//
// VÌ SAO CÓ: trên Samsung Internet, ô chọn tệp khai `accept="image/*"` vẫn ra
// bảng "Chọn một thao tác — Máy ảnh · File của bạn · Files", KHÔNG có Bộ sưu
// tập (chủ dự án chụp lại 12/09/2026). Mỗi trình duyệt Android lại dịch khai
// báo đó thành một ý định (intent) khác nhau, và không có tài liệu nào nói
// chính xác cách nào ra Bộ sưu tập trên máy nào.
//
// Nên thay vì đoán: bày ra đủ các cách, để bấm thử ngay trên MÁY THẬT, cách nào
// mở được Bộ sưu tập thì đem cách đó về dùng cho ô đăng tin.
//
// Trang này KHÔNG có liên kết nào trỏ tới, chỉ ai biết đường dẫn mới vào được.
// Dò xong thì xoá cả thư mục này đi.
// ════════════════════════════════════════════════════════════════════════════

const CACH = [
  { ma: "A", ten: "image/* + nhiều ảnh", accept: "image/*", multiple: true },
  { ma: "B", ten: "image/* + MỘT ảnh", accept: "image/*", multiple: false },
  { ma: "C", ten: "Liệt kê đuôi ảnh cụ thể", accept: "image/jpeg,image/png,image/webp,image/heic", multiple: true },
  { ma: "D", ten: "Không khai loại tệp", accept: "", multiple: true },
  { ma: "E", ten: "Ảnh + video chung", accept: "image/*,video/*", multiple: true },
] as const;

export default function ThuChonAnh() {
  const [ket, setKet] = useState<Record<string, string>>({});

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Thử cách mở Thư viện ảnh</h1>
      <p className="mt-2 text-sm text-cvr-muted">
        Bấm lần lượt từng nút. Nút nào mở ra <strong>Bộ sưu tập / Thư viện ảnh</strong> thì nhớ chữ cái
        của nút đó.
      </p>

      <div className="mt-5 space-y-3">
        {CACH.map((c) => (
          <label
            key={c.ma}
            className="relative flex cursor-pointer items-center gap-3 rounded-xl border border-cvr-line bg-white px-4 py-3.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cvr-ink text-sm font-bold text-white">
              {c.ma}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-cvr-ink">{c.ten}</span>
              <span className="block text-xs text-cvr-faint">
                {ket[c.ma] ? `→ chọn được: ${ket[c.ma]}` : "chưa thử"}
              </span>
            </span>
            <input
              type="file"
              {...(c.accept ? { accept: c.accept } : {})}
              {...(c.multiple ? { multiple: true } : {})}
              onChange={(e) => {
                const f = e.target.files;
                setKet((t) => ({
                  ...t,
                  [c.ma]: f && f.length ? `${f.length} tệp — ${f[0].name.slice(0, 24)}` : "không chọn gì",
                }));
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        ))}
      </div>

      <p className="mt-6 rounded-xl bg-cvr-surface px-4 py-3 text-xs leading-relaxed text-cvr-muted">
        Trình duyệt đang dùng:
        <span className="mt-1 block break-all font-mono text-[11px] text-cvr-ink">
          {typeof navigator !== "undefined" ? navigator.userAgent : ""}
        </span>
      </p>
    </main>
  );
}
