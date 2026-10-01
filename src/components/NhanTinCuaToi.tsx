"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import XacMinhSdt from "@/components/XacMinhSdt";

// ============================================================================
// TIN ĐĂNG HỘ TỰ VỀ TÀI KHOẢN — TỰ ĐỘNG, KHÔNG CHỜ COASTAL LAND DUYỆT
// (chủ dự án chốt 28/09/2026: khách đăng nhập vào là tự đồng bộ, không phải chờ mình làm)
//
//   · Số đã xác minh  → mở trang tài khoản là tin mang số đó tự về, báo "N tin đã về".
//   · Số chưa xác minh (tài khoản Coastal Land tạo hộ, có ghi số) mà số đó đang có tin
//     → hiện ô nhận mã Zalo ngay tại đây; mã đúng là tin về + tài khoản tự gộp.
//   · Chưa có số nào → không hiện gì (khách xác minh số lúc đăng tin, tự đồng bộ lúc đó).
// Bỏ đường cũ "gửi yêu cầu → Coastal Land duyệt tay".
// ============================================================================

type TrangThai = "an" | "can-xac-minh" | "xong";

export default function NhanTinCuaToi() {
  const [tt, setTt] = useState<TrangThai>("an");
  const [soTin, setSoTin] = useState(0);
  const [soGoiY, setSoGoiY] = useState("");
  const [ketQua, setKetQua] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Số đã xác minh → đồng bộ luôn, lặng lẽ; chỉ báo khi thật sự có tin vừa về.
      const { data: daXm } = await supabase.rpc("sdt_cua_toi", { p_chi_da_xac_minh: true });
      if (((daXm ?? []) as string[]).filter(Boolean).length) {
        const { data: n } = await supabase.rpc("tu_nhan_tin_theo_sdt");
        if (Number(n ?? 0) > 0) {
          setKetQua(`${Number(n)} tin đăng đã về tài khoản của bạn.`);
          setTt("xong");
        }
        return;
      }

      // Có số (chưa xác minh) và số đó đang có tin → mời nhận mã để tin về.
      const { data: dem } = await supabase.rpc("dem_tin_theo_sdt_cua_toi");
      if (Number(dem ?? 0) <= 0) return;
      const { data: ds } = await supabase.rpc("sdt_cua_toi", { p_chi_da_xac_minh: false });
      setSoGoiY(((ds ?? []) as string[]).filter(Boolean)[0] ?? "");
      setSoTin(Number(dem));
      setTt("can-xac-minh");
    })();
  }, []);

  if (tt === "an") return null;

  if (tt === "xong") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-300 bg-green-50 px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">✓</span>
        <p className="text-sm leading-relaxed text-green-900">
          <strong className="font-semibold">Đã đồng bộ.</strong> {ketQua}{" "}
          <Link href="/tai-khoan/tin-dang" className="font-semibold underline">Xem tin</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-cvr-ink">Có {soTin} tin đăng mang số {soGoiY} — xác minh số để nhận về tài khoản.</p>
      <XacMinhSdt
        soGoiY={soGoiY}
        onXong={(so, gop, idMoi) => {
          // Tài khoản Zalo vừa gộp vào tài khoản cũ của số → tải lại để hiện đúng tài khoản đó.
          if (idMoi) return window.location.reload();
          setKetQua(gop > 0 ? `${gop} tin đăng đã về tài khoản của bạn.` : `Đã xác minh số ${so}, tin mang số này đã về tài khoản.`);
          setTt("xong");
        }}
      />
    </div>
  );
}
