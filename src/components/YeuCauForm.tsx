"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";

// ============================================================================
// Ô GỬI YÊU CẦU — DÙNG CHUNG CHO MỌI LOẠI YÊU CẦU
// Khách chỉ để lại: TÊN · SỐ ĐIỆN THOẠI · EMAIL (không bắt buộc) · NỘI DUNG.
// Mọi yêu cầu đổ về một chỗ: /admin/yeu-cau để quản trị viên xử lý.
// Đặt `loai` khác nhau để lọc: dang_du_an · ho_tro · hop_tac · khac
// ============================================================================

export type LoaiYeuCau = "dang_du_an" | "ho_tro" | "hop_tac" | "khac";

export default function YeuCauForm({
  loai = "khac",
  goiYNoiDung,
  nhanNut = "Gửi yêu cầu",
  loiNhanXong = "Đã gửi yêu cầu. Coastal Land sẽ liên hệ với bạn sớm nhất.",
}: {
  loai?: LoaiYeuCau;
  goiYNoiDung?: string;
  nhanNut?: string;
  loiNhanXong?: string;
}) {
  const { profile } = useProfile();

  const [ten, setTen] = useState("");
  const [dienThoai, setDienThoai] = useState("");
  const [email, setEmail] = useState("");
  const [noiDung, setNoiDung] = useState("");

  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);

  // Đã đăng nhập → điền sẵn cho khách đỡ gõ
  useEffect(() => {
    if (!profile) return;
    setTen((v) => v || profile.full_name || "");
    setDienThoai((v) => v || profile.phone || "");
    setEmail((v) => v || profile.email || "");
  }, [profile]);

  async function gui() {
    setLoi("");
    if (!ten.trim()) return setLoi("Chưa nhập họ tên.");
    if (!dienThoai.trim()) return setLoi("Chưa nhập số điện thoại.");
    if (!noiDung.trim()) return setLoi("Chưa nhập nội dung yêu cầu.");

    setDangGui(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("customer_requests").insert({
        user_id: profile?.id ?? null,
        loai,
        ten: ten.trim(),
        dien_thoai: dienThoai.trim(),
        email: email.trim() || null,
        noi_dung: noiDung.trim(),
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
      <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{loiNhanXong}</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <O nhan="Họ và tên *">
          <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} />
        </O>
        <O nhan="Số điện thoại *">
          <input
            value={dienThoai}
            onChange={(e) => setDienThoai(e.target.value)}
            inputMode="tel"
            placeholder="0905 123 456"
            className={inputCls}
          />
        </O>
      </div>

      <O nhan="Email (không bắt buộc)">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          placeholder="email@cua-ban.com"
          className={inputCls}
        />
      </O>

      <O nhan="Nội dung yêu cầu *">
        <textarea
          value={noiDung}
          onChange={(e) => setNoiDung(e.target.value)}
          rows={4}
          placeholder={goiYNoiDung}
          className={`${inputCls} h-auto py-2.5`}
        />
      </O>

      {loi && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loi}</p>}

      <button
        type="button"
        onClick={gui}
        disabled={dangGui}
        className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
      >
        {dangGui ? "Đang gửi…" : nhanNut}
      </button>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

function O({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-cvr-muted">{nhan}</span>
      {children}
    </label>
  );
}
