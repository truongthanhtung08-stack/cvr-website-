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
      <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-cvr-ink">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="font-serif text-xl font-bold text-white">Đã gửi thành công!</h3>
        <p className="mt-2 text-sm text-white/65">Chuyên viên Coastal Land sẽ liên hệ với bạn trong thời gian sớm nhất. Cảm ơn bạn đã tin tưởng.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.04] p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Họ và tên *" name="name" placeholder="Nguyễn Văn A" required />
        <Field label="Số điện thoại *" name="phone" placeholder="09xx xxx xxx" type="tel" required />
      </div>
      <Field label="Email" name="email" placeholder="email@example.com" type="email" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/80">Nhu cầu</label>
        <select name="topic" className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/40">
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/80">Nội dung</label>
        <textarea name="note" rows={4} placeholder="Mô tả bất động sản hoặc nhu cầu của bạn…" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40" />
      </div>
      <button type="submit" className="btn-dangtin flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-cvr-ink">
        {cta}
      </button>
      <p className="text-center text-[11px] text-white/40">Thông tin của bạn được bảo mật theo chính sách của Coastal Land.</p>
    </form>
  );
}

function Field({ label, name, placeholder, type = "text", required }: { label: string; name: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/80">{label}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40 focus:bg-white/10" />
    </div>
  );
}

