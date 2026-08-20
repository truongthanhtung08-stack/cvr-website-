"use client";

import { useRouter } from "next/navigation";

// ════════════════════════════════════════════════════════════════════════════
// MẢNH GHÉP DÙNG CHUNG CHO MỌI Ô KHÁCH NHẬP
//
// Gom một chỗ để mọi form khách nhắn tin đều hành xử GIỐNG NHAU, khỏi mỗi nơi
// một kiểu: gõ vào là có nút ✕ xoá nhanh · có nút "Xoá hết" · có nút "Quay lại".
// Thêm form mới thì dùng lại mấy mảnh này, đừng viết lại từ đầu.
// ════════════════════════════════════════════════════════════════════════════

export const inputCls =
  "h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

// Nút ✕ nằm trong ô — chỉ hiện khi ô có chữ.
function NutXoaO({ onClick, tren }: { onClick: () => void; tren?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Xoá nội dung ô này"
      className={`absolute right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.06] text-cvr-muted transition hover:bg-black/10 hover:text-cvr-ink ${
        tren ? "top-2.5" : "top-1/2 -translate-y-1/2"
      }`}
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// Ô nhập một dòng, có nhãn và nút xoá nhanh.
export function ONhap({
  nhan,
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text",
}: {
  nhan: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "tel" | "email" | "text";
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-cvr-muted">{nhan}</span>
      <span className="relative block">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          placeholder={placeholder}
          className={`${inputCls} ${value ? "pr-10" : ""}`}
        />
        {value && <NutXoaO onClick={() => onChange("")} />}
      </span>
    </label>
  );
}

// Ô nhập nhiều dòng, có nhãn và nút xoá nhanh.
export function ONhapDai({
  nhan,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  nhan: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-cvr-muted">{nhan}</span>
      <span className="relative block">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={`${inputCls} h-auto py-2.5 ${value ? "pr-10" : ""}`}
        />
        {value && <NutXoaO tren onClick={() => onChange("")} />}
      </span>
    </label>
  );
}

// Nút QUAY LẠI dùng trong form — còn lịch sử thì lùi thật, không thì về trang chủ
// (khách mở thẳng link từ Zalo/Facebook sẽ không có gì để lùi).
export function NutQuayLai({ nhan = "Quay lại" }: { nhan?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line px-4 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {nhan}
    </button>
  );
}

// Nút XOÁ HẾT — chỉ hiện khi form đã có chữ.
export function NutXoaHet({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-cvr-muted transition hover:text-red-600"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Xoá hết
    </button>
  );
}

// Thẻ báo GỬI XONG — kèm lối đi tiếp, không để khách đứng im không biết làm gì.
export function TheGuiXong({
  loiNhan,
  onGuiTiep,
}: {
  loiNhan: string;
  onGuiTiep: () => void;
}) {
  return (
    <div className="rounded-xl border border-green-600/20 bg-green-50 p-5 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-green-800">{loiNhan}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onGuiTiep}
          className="rounded-lg bg-cvr-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
        >
          Gửi yêu cầu khác
        </button>
        <NutQuayLai />
      </div>
    </div>
  );
}
