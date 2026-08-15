"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import YeuCauForm from "@/components/YeuCauForm";

// ============================================================================
// KHÁCH GỬI YÊU CẦU ĐĂNG DỰ ÁN — dùng chung ô gửi yêu cầu của web:
// TÊN · SỐ ĐIỆN THOẠI · EMAIL (không bắt buộc) · NỘI DUNG.
// KHÔNG bắt tải giấy tờ ở đây: hồ sơ pháp nhân do quản trị viên kiểm ở khâu
// duyệt (nhận trực tiếp / Zalo / email) rồi mở quyền đăng dự án.
// ============================================================================

const NHAN: Record<string, { chu: string; lop: string }> = {
  moi: { chu: "Đã gửi — chờ xử lý", lop: "bg-amber-50 text-amber-700" },
  dang_xu_ly: { chu: "Đang xử lý", lop: "bg-amber-50 text-amber-700" },
  xong: { chu: "Đã duyệt", lop: "bg-green-50 text-green-700" },
  tu_choi: { chu: "Chưa được duyệt", lop: "bg-red-50 text-red-700" },
};

export default function YeuCauDangDuAnPage() {
  const { profile, loading } = useProfile();
  const [daGui, setDaGui] = useState<{ status: string; admin_note: string | null } | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("customer_requests")
          .select("status, admin_note")
          .eq("user_id", profile.id)
          .eq("loai", "dang_du_an")
          .order("created_at", { ascending: false })
          .limit(1);
        if (data?.[0]) setDaGui(data[0] as { status: string; admin_note: string | null });
      } catch {
        /* chưa chạy migration 0015 → coi như chưa gửi */
      }
    })();
  }, [profile]);

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  // Đã gửi rồi → chỉ hiện trạng thái, không gửi trùng
  if (daGui) {
    const nhan = NHAN[daGui.status] ?? NHAN.moi;
    return (
      <div className="rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Yêu cầu đăng dự án</h1>
        <p className="mt-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${nhan.lop}`}>{nhan.chu}</span>
        </p>
        {daGui.admin_note && (
          <p className="mt-3 rounded-lg bg-cvr-surface px-4 py-3 text-sm text-cvr-body">
            Ghi chú từ Coastal Land: {daGui.admin_note}
          </p>
        )}
        <p className="mt-3 text-sm text-cvr-muted">
          {daGui.status === "xong"
            ? "Bạn đã có quyền đăng dự án."
            : daGui.status === "tu_choi"
              ? "Vui lòng liên hệ Coastal Land để được hướng dẫn."
              : "Coastal Land sẽ gọi lại theo số điện thoại bạn để lại để xác minh hồ sơ."}
        </p>
        <Link
          href="/tai-khoan/du-an"
          className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về trang Dự án của tôi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Yêu cầu đăng dự án</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Để lại thông tin liên hệ — Coastal Land gọi lại xác minh hồ sơ Chủ đầu tư / Công ty phân
          phối rồi mở quyền đăng dự án cho bạn.
        </p>
      </div>

      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        <YeuCauForm
          loai="dang_du_an"
          goiYNoiDung="Tên dự án muốn đăng, vai trò (chủ đầu tư hay phân phối), công ty…"
          loiNhanXong="Đã gửi yêu cầu. Coastal Land sẽ gọi lại để xác minh và mở quyền đăng dự án."
        />
      </div>
    </div>
  );
}
