"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { ONhap, ONhapDai, NutXoaHet, NutQuayLai, TheGuiXong } from "@/components/FormFields";

// ============================================================================
// Ô GỬI YÊU CẦU — DÙNG CHUNG CHO MỌI LOẠI YÊU CẦU
// Khách chỉ để lại: TÊN · SỐ ĐIỆN THOẠI · EMAIL (không bắt buộc) · NỘI DUNG.
// Mọi yêu cầu đổ về một chỗ: /admin/yeu-cau để quản trị viên xử lý.
// Đặt `loai` khác nhau để lọc: dang_du_an · ho_tro · hop_tac · khac
//
// Mỗi ô có nút ✕ xoá nhanh · có "Xoá hết" · có "Quay lại" · gửi xong vẫn còn
// lối đi tiếp — dùng chung mảnh ghép trong components/FormFields.tsx.
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

  const coChu = Boolean(ten || dienThoai || email || noiDung);

  function xoaHet() {
    setTen("");
    setDienThoai("");
    setEmail("");
    setNoiDung("");
    setLoi("");
  }

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

  // Gửi xong: báo rõ + vẫn còn lối đi tiếp (gửi yêu cầu khác / quay lại)
  if (xong) {
    return (
      <TheGuiXong
        loiNhan={loiNhanXong}
        onGuiTiep={() => {
          xoaHet();
          setXong(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ONhap nhan="Họ và tên *" value={ten} onChange={setTen} placeholder="Nguyễn Văn A" />
        <ONhap nhan="Số điện thoại *" value={dienThoai} onChange={setDienThoai} placeholder="0905 123 456" inputMode="tel" />
      </div>

      <ONhap nhan="Email (không bắt buộc)" value={email} onChange={setEmail} placeholder="email@cua-ban.com" inputMode="email" />

      <ONhapDai nhan="Nội dung yêu cầu *" value={noiDung} onChange={setNoiDung} placeholder={goiYNoiDung} />

      {loi && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loi}</p>}

      {/* Hàng nút: GỬI · Xoá hết (khi đã gõ) · Quay lại — luôn có lối thoát */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={gui}
          disabled={dangGui}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
        >
          {dangGui ? "Đang gửi…" : nhanNut}
        </button>
        {coChu && <NutXoaHet onClick={xoaHet} />}
        <span className="ml-auto">
          <NutQuayLai />
        </span>
      </div>
    </div>
  );
}
