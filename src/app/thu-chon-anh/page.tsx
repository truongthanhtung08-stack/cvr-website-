"use client";

import { useState } from "react";

// ════════════════════════════════════════════════════════════════════════════
// TRANG ĐO — BẤM THỬ ĐỂ BIẾT CÁCH NÀO MỞ ĐƯỢC BỘ SƯU TẬP TRÊN MÁY THẬT
// ----------------------------------------------------------------------------
// Mỗi hệ điều hành, mỗi hãng máy, mỗi trình duyệt gọi bộ chọn tệp một kiểu; ngồi
// đoán thì mất cả buổi mà vẫn không chắc. Trang này bày đúng 6 cách khai ô chọn
// tệp, bấm từng cái trên chính máy đang dùng rồi xem cách nào ra Bộ sưu tập —
// biết chắc rồi mới sửa vào form đăng tin.
//
// Trang KHÔNG nằm trong menu nào, chỉ mở khi cần đo: /thu-chon-anh
// Không tải tệp lên đâu cả, chỉ hiện tên tệp vừa chọn.
// ════════════════════════════════════════════════════════════════════════════

type Cach = {
  ten: string;
  giaiThich: string;
  accept?: string;
  multiple?: boolean;
  capture?: "environment" | "user";
};

const CACH: Cach[] = [
  {
    ten: "A — Ảnh, chọn nhiều",
    giaiThich: 'accept="image/*" + multiple (cách form đăng tin đang dùng)',
    accept: "image/*",
    multiple: true,
  },
  {
    ten: "B — Ảnh, chọn một",
    giaiThich: 'accept="image/*", KHÔNG multiple',
    accept: "image/*",
  },
  {
    ten: "C — Ảnh + video, chọn nhiều",
    giaiThich: 'accept="image/*,video/*" + multiple (nghi là cách làm mất Bộ sưu tập)',
    accept: "image/*,video/*",
    multiple: true,
  },
  {
    ten: "D — Không khai loại",
    giaiThich: "không có accept, cho chọn nhiều",
    multiple: true,
  },
  {
    ten: "E — Video",
    giaiThich: 'accept="video/*"',
    accept: "video/*",
  },
  {
    ten: "F — Máy ảnh",
    giaiThich: 'accept="image/*" + capture — phải mở thẳng máy ảnh',
    accept: "image/*",
    capture: "environment",
  },
];

export default function ThuChonAnhPage() {
  const [ketQua, setKetQua] = useState<Record<string, string>>({});

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* Trang chỉ dùng để đo trên máy thật — chặn Google đánh chỉ mục. */}
      <meta name="robots" content="noindex, nofollow" />
      <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Thử cách mở Bộ sưu tập</h1>
      <p className="mt-1.5 text-sm text-cvr-muted">
        Bấm lần lượt từng nút, xem cách nào mở ra Bộ sưu tập trên máy này.
      </p>

      <div className="mt-5 space-y-3">
        {CACH.map((c) => (
          <label
            key={c.ten}
            className="relative block cursor-pointer rounded-xl border border-cvr-line bg-white p-4 shadow-sm active:bg-cvr-surface"
          >
            <span className="block text-[15px] font-semibold text-cvr-ink">{c.ten}</span>
            <span className="mt-0.5 block text-xs text-cvr-muted">{c.giaiThich}</span>
            {ketQua[c.ten] && (
              <span className="mt-2 block rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                {ketQua[c.ten]}
              </span>
            )}
            <input
              type="file"
              accept={c.accept}
              multiple={c.multiple}
              capture={c.capture}
              onChange={(e) => {
                const fs = e.target.files;
                setKetQua((k) => ({
                  ...k,
                  [c.ten]: fs?.length
                    ? `Đã chọn ${fs.length} tệp: ${Array.from(fs).map((f) => f.name).join(", ").slice(0, 120)}`
                    : "Không chọn tệp nào",
                }));
                e.target.value = "";
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        ))}
      </div>

      <p className="mt-6 text-sm text-cvr-body">
        Cách nào mở đúng Bộ sưu tập thì báo lại chữ cái đầu (A, B, C…) — form đăng tin sẽ dùng đúng cách đó.
      </p>
    </main>
  );
}
