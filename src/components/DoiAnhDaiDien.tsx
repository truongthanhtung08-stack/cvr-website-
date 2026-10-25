"use client";

import { useState } from "react";
import AnhDaiDien from "@/components/AnhDaiDien";
import { uploadImageFile } from "@/lib/uploadImage";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// BẤM VÀO AVATAR LÀ ĐỔI ẢNH (chuẩn các web — chủ dự án 26/10/2026). Avatar có biểu tượng máy ảnh nhỏ; bấm → chọn
// ảnh → tải lên → lưu vào hồ sơ (profiles.avatar_url) + phiên đăng nhập (đầu trang hiện ảnh mới ngay).
// Dùng chung ở trang Tài khoản và Cài đặt, điện thoại và máy tính như nhau. Chưa có ảnh → hình người xám mặc định.
// ============================================================================
export default function DoiAnhDaiDien({ idHoSo, url, ten, className }: { idHoSo: string; url: string; ten: string; className: string }) {
  const [anh, setAnh] = useState<string | null>(null);
  const [dang, setDang] = useState(false);

  async function doi(f: File) {
    setDang(true);
    const { url: moi, error } = await uploadImageFile(f);
    if (!moi) { setDang(false); window.alert("Chưa tải được ảnh. " + (error ?? "")); return; }
    const sb = createClient();
    const { error: e } = await sb.from("profiles").update({ avatar_url: moi }).eq("id", idHoSo);
    if (!e) await sb.auth.updateUser({ data: { avatar_url: moi } });
    setDang(false);
    if (e) { window.alert("Lưu thất bại: " + e.message); return; }
    setAnh(moi);
  }

  return (
    <label className="relative shrink-0 cursor-pointer" aria-label="Đổi ảnh đại diện" title="Đổi ảnh đại diện">
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={dang}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void doi(f); e.target.value = ""; }}
      />
      <AnhDaiDien url={anh ?? url} ten={ten} className={`${className} ${dang ? "opacity-50" : ""}`} />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-cvr-ink text-white ring-2 ring-white">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.6l1.2-1.8A1.5 1.5 0 0 1 9.5 3.5h5a1.5 1.5 0 0 1 1.2.7L16.9 6h1.6A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </span>
    </label>
  );
}
