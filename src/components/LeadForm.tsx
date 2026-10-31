"use client";

import { useEffect, useState } from "react";
import { loiEmail, loiSdt } from "@/lib/kiemNhap";
import { napSupabase } from "@/lib/supabase/nap";
import { taiKhiRanh } from "@/lib/taiKhiRanh";
import { useProfile } from "@/lib/useProfile";
import { emailThat } from "@/lib/useAuth";
import type { LoaiYeuCau } from "@/components/YeuCauForm";

// ============================================================================
// FORM NHẬN BÁO GIÁ / TÀI LIỆU (cột phải trang Bảng giá · Chuyên gia · Dự án)
//
// ⚠️ SỬA LỖI NẶNG 20/8/2026: form này TRƯỚC ĐÂY chỉ hiện "Đã gửi thành công"
// rồi thôi — KHÔNG gửi đi đâu cả, thông tin khách mất trắng. Nay ghi thẳng vào
// bảng customer_requests, cùng chỗ với form Liên hệ → xem tại /admin/yeu-cau.
//
// Bản GỌN: bỏ nhãn riêng từng ô (đưa vào placeholder) để vừa khung cột phải.
// Mỗi ô có ✕ xoá nhanh. KHÔNG có "Xoá hết", "Quay lại" (chủ dự án 22/10/2026: form nằm trong trang thì hai nút đó để làm
// gì — mỗi ô đã có ✕, lùi trang thì dùng nút Quay lại của máy / trình duyệt).
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
  // Thư viện Supabase tải ngầm khi máy rảnh → bấm Gửi là gửi ngay, không chờ tải (taiKhiRanh)
  useEffect(() => taiKhiRanh(() => import("@/lib/supabase/client")), []);

  useEffect(() => {
    if (!profile) return;
    setTen((v) => v || profile.full_name || "");
    setDienThoai((v) => v || profile.phone || "");
    setEmail((v) => v || emailThat(profile.email));
  }, [profile]);

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
    // Chuẩn định dạng chung toàn web (src/lib/kiemNhap.ts)
    if (loiSdt(dienThoai)) return setLoi(loiSdt(dienThoai));
    if (!email.trim()) return setLoi("Chưa nhập email để nhận tài liệu.");
    if (loiEmail(email)) return setLoi(loiEmail(email));

    setDangGui(true);
    try {
      // Thư viện Supabase (~58 KB nén) chỉ tải lúc khách bấm Gửi — không tải lúc mở trang dự án / bảng giá (27/10/2026)
      const supabase = await napSupabase();
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
        </div>
      </div>
    );
  }

  return (
    // BẢN GỌN (chủ dự án 22/10/2026 tối: "khung nhận tư vấn, để lại thông tin ở cuối — làm gọn lại tất cả trên web"): ô xếp
    // hai cột theo bề rộng KHUNG chứa (@container — cột hẹp cạnh trang dự án vẫn vừa), ghi chú một dòng. Chữ ô 16px trên điện
    // thoại để iPhone không tự phóng to khi gõ.
    <div className="@container rounded-none border border-cvr-line bg-white p-3.5 shadow-lux sm:p-4">
      <div className="grid grid-cols-2 gap-2">
        <O value={ten} onChange={setTen} placeholder="Họ và tên *" />
        <O value={dienThoai} onChange={setDienThoai} placeholder="Số điện thoại *" type="tel" />
        {/* Email — BẮT BUỘC ở mọi form nhận báo giá / tài liệu (gửi bảng giá, brochure) */}
        <div className="col-span-2 @md:col-span-1">
          <O value={email} onChange={setEmail} placeholder="Email *" type="email" />
        </div>
        <select
          value={nhuCau}
          onChange={(e) => setNhuCau(e.target.value)}
          aria-label="Nhu cầu"
          className="col-span-2 h-11 w-full min-w-0 rounded-lg border border-transparent bg-cvr-surface px-3 text-base text-cvr-ink outline-none transition focus:border-cvr-line focus:bg-white @md:col-span-1 sm:text-sm"
        >
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="col-span-2">
          <O value={ghiChu} onChange={setGhiChu} placeholder="Ghi chú thêm (không bắt buộc)" />
        </div>
      </div>

      {loi && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}

      <button
        type="button"
        onClick={gui}
        disabled={dangGui}
        className="btn-dangtin mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg px-6 text-[13.5px] font-semibold text-white disabled:opacity-50 @md:w-auto @md:px-8"
      >
        {dangGui ? "Đang gửi…" : cta}
      </button>

      <p className="mt-2 text-center text-[11px] text-cvr-faint">Thông tin của bạn được bảo mật theo chính sách của Coastal Land.</p>
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
        className={`h-11 w-full min-w-0 rounded-lg border border-transparent bg-cvr-surface px-3 text-base text-cvr-ink sm:text-sm placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white ${value ? "pr-10" : ""}`}
      />
      {value && <XoaO onClick={() => onChange("")} />}
    </div>
  );
}

function XoaO({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Xoá nội dung ô này"
      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/[0.06] text-cvr-muted transition hover:bg-black/10 hover:text-cvr-ink"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
