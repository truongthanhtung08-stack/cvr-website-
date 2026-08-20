"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { NutXoaHet, NutQuayLai } from "@/components/FormFields";
import type { LoaiYeuCau } from "@/components/YeuCauForm";

// ============================================================================
// FORM NHẬN BÁO GIÁ / TÀI LIỆU (cột phải trang Bảng giá · Chuyên gia · Dự án)
//
// ⚠️ SỬA LỖI NẶNG 20/8/2026: form này TRƯỚC ĐÂY chỉ hiện "Đã gửi thành công"
// rồi thôi — KHÔNG gửi đi đâu cả, thông tin khách mất trắng. Nay ghi thẳng vào
// bảng customer_requests, cùng chỗ với form Liên hệ → xem tại /admin/yeu-cau.
//
// Bản GỌN: bỏ nhãn riêng từng ô (đưa vào placeholder) để vừa khung cột phải.
// Vẫn có nút ✕ xoá từng ô · "Xoá hết" · "Quay lại" như mọi form khác.
// ============================================================================

export default function LeadForm({
  cta,
  topics,
  loai = "khac",
}: {
  cta: string;
  topics: string[];
  loai?: LoaiYeuCau;
}) {
  const { profile } = useProfile();

  const [ten, setTen] = useState("");
  const [dienThoai, setDienThoai] = useState("");
  const [email, setEmail] = useState("");
  const [nhuCau, setNhuCau] = useState(topics[0] ?? "");
  const [ghiChu, setGhiChu] = useState("");

  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setTen((v) => v || profile.full_name || "");
    setDienThoai((v) => v || profile.phone || "");
    setEmail((v) => v || profile.email || "");
  }, [profile]);

  const coChu = Boolean(ten || dienThoai || email || ghiChu);

  function xoaHet() {
    setTen("");
    setDienThoai("");
    setEmail("");
    setGhiChu("");
    setNhuCau(topics[0] ?? "");
    setLoi("");
  }

  async function gui() {
    setLoi("");
    if (!ten.trim()) return setLoi("Chưa nhập họ tên.");
    if (!dienThoai.trim()) return setLoi("Chưa nhập số điện thoại.");
    if (!email.trim()) return setLoi("Chưa nhập email để nhận tài liệu.");

    setDangGui(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("customer_requests").insert({
        user_id: profile?.id ?? null,
        loai,
        ten: ten.trim(),
        dien_thoai: dienThoai.trim(),
        email: email.trim(),
        noi_dung: [nhuCau, ghiChu.trim()].filter(Boolean).join(" — "),
      });
      if (error) throw error;
      setXong(true);
    } catch (e) {
      setLoi(
        /relation .* does not exist|schema cache/i.test(String(e))
          ? "Hệ thống chưa sẵn sàng nhận yêu cầu. Vui lòng gọi hotline giúp chúng tôi."
          : `Gửi yêu cầu thất bại: ${e instanceof Error ? e.message : "lỗi không rõ"}`,
      );
    }
    setDangGui(false);
  }

  if (xong) {
    return (
      <div className="rounded-none border border-cvr-line bg-white p-8 text-center shadow-lux">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cvr-ink text-white">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-cvr-ink">Đã gửi thành công!</h3>
        <p className="mt-2 text-sm text-cvr-muted">Chuyên viên Coastal Land sẽ liên hệ với bạn trong thời gian sớm nhất. Cảm ơn bạn đã tin tưởng.</p>
        {/* Gửi xong vẫn còn lối đi tiếp, không để khách đứng im */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => { xoaHet(); setXong(false); }}
            className="rounded-lg bg-cvr-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
          >
            Gửi yêu cầu khác
          </button>
          <NutQuayLai />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-none border border-cvr-line bg-white p-4 shadow-lux sm:p-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <O value={ten} onChange={setTen} placeholder="Họ và tên *" />
        <O value={dienThoai} onChange={setDienThoai} placeholder="Số điện thoại *" type="tel" />
      </div>
      {/* Email — BẮT BUỘC ở mọi form nhận báo giá / tài liệu (gửi bảng giá, brochure) */}
      <O value={email} onChange={setEmail} placeholder="Email *" type="email" />

      <select
        value={nhuCau}
        onChange={(e) => setNhuCau(e.target.value)}
        aria-label="Nhu cầu"
        className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink outline-none transition focus:border-cvr-line focus:bg-white"
      >
        {topics.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <div className="relative">
        <textarea
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          rows={2}
          aria-label="Nội dung"
          placeholder="Ghi chú thêm (không bắt buộc)"
          className={`w-full rounded-lg border border-transparent bg-cvr-surface px-3 py-2.5 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white ${ghiChu ? "pr-10" : ""}`}
        />
        {ghiChu && <XoaO tren onClick={() => setGhiChu("")} />}
      </div>

      {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}

      <button
        type="button"
        onClick={gui}
        disabled={dangGui}
        className="btn-dangtin flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {dangGui ? "Đang gửi…" : cta}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {coChu ? <NutXoaHet onClick={xoaHet} /> : <span />}
        <NutQuayLai />
      </div>

      <p className="text-center text-[11px] text-cvr-faint">Thông tin của bạn được bảo mật theo chính sách của Coastal Land.</p>
    </div>
  );
}

// Ô nhập gọn (không nhãn riêng) + nút ✕ xoá nhanh
function O({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder.replace(" *", "")}
        className={`h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white ${value ? "pr-10" : ""}`}
      />
      {value && <XoaO onClick={() => onChange("")} />}
    </div>
  );
}

function XoaO({ onClick, tren }: { onClick: () => void; tren?: boolean }) {
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
