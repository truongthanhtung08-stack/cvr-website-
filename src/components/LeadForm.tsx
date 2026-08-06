"use client";

import { useState } from "react";

export default function LeadForm({
  cta,
  topics,
}: {
  cta: string;
  topics: string[];
}) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-none border border-cvr-line bg-white p-8 text-center shadow-lux">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cvr-ink text-white">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-cvr-ink">Đã gửi thành công!</h3>
        <p className="mt-2 text-sm text-cvr-muted">Chuyên viên Coastal Land sẽ liên hệ với bạn trong thời gian sớm nhất. Cảm ơn bạn đã tin tưởng.</p>
      </div>
    );
  }

  // Bản GỌN: bỏ nhãn riêng từng ô (đưa vào placeholder), chỉ giữ những gì cần để
  // liên hệ lại — Họ tên · Điện thoại · Nhu cầu · ghi chú ngắn. Chiều cao giảm
  // hơn một nửa so với bản cũ, vừa khung cột phải và không chiếm trọn màn hình điện thoại.
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="space-y-2.5 rounded-none border border-cvr-line bg-white p-4 shadow-lux sm:p-5"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field name="name" placeholder="Họ và tên *" required />
        <Field name="phone" placeholder="Số điện thoại *" type="tel" required />
      </div>
      <select name="topic" aria-label="Nhu cầu" className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink outline-none transition focus:border-cvr-line focus:bg-white">
        {topics.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea name="note" rows={2} aria-label="Nội dung" placeholder="Ghi chú thêm (không bắt buộc)" className="w-full rounded-lg border border-transparent bg-cvr-surface px-3 py-2.5 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white" />
      <button type="submit" className="btn-dangtin flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white">
        {cta}
      </button>
      <p className="text-center text-[11px] text-cvr-faint">Thông tin của bạn được bảo mật theo chính sách của Coastal Land.</p>
    </form>
  );
}

function Field({ name, placeholder, type = "text", required }: { name: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      placeholder={placeholder}
      aria-label={placeholder.replace(" *", "")}
      className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white"
    />
  );
}
