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

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="space-y-4 rounded-none border border-cvr-line bg-white p-6 shadow-lux sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Họ và tên *" name="name" placeholder="Nguyễn Văn A" required />
        <Field label="Số điện thoại *" name="phone" placeholder="09xx xxx xxx" type="tel" required />
      </div>
      <Field label="Email" name="email" placeholder="email@example.com" type="email" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-cvr-body">Nhu cầu</label>
        <select name="topic" className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink outline-none transition focus:border-cvr-line focus:bg-white">
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-cvr-body">Nội dung</label>
        <textarea name="note" rows={4} placeholder="Mô tả bất động sản hoặc nhu cầu của bạn…" className="w-full rounded-lg border border-transparent bg-cvr-surface px-3 py-2.5 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white" />
      </div>
      <button type="submit" className="btn-dangtin flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white">
        {cta}
      </button>
      <p className="text-center text-[11px] text-cvr-faint">Thông tin của bạn được bảo mật theo chính sách của Coastal Land.</p>
    </form>
  );
}

function Field({ label, name, placeholder, type = "text", required }: { label: string; name: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white" />
    </div>
  );
}
