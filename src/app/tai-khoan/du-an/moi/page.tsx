"use client";

import Link from "next/link";
import ProjectForm from "@/components/admin/ProjectForm";
import { useProfile } from "@/lib/useProfile";

// Khách hàng (Chủ đầu tư / Công ty phân phối ĐÃ ĐƯỢC DUYỆT) đăng dự án —
// dùng CHUNG form với quản trị viên, khác duy nhất ở chỗ: bấm xong là "chờ duyệt",
// quản trị viên xem rồi mới cho hiện trên web.
export default function DangDuAnKhachPage() {
  const { profile, loading } = useProfile();
  const duocDang = Boolean((profile as unknown as { can_post_project?: boolean } | null)?.can_post_project);

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  if (!duocDang) {
    return (
      <div className="rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
        <h1 className="text-lg font-semibold text-cvr-ink">Chưa mở quyền đăng dự án</h1>
        <p className="mt-2 text-sm text-cvr-body">
          Chỉ Chủ đầu tư / Công ty phân phối đã được duyệt hồ sơ mới đăng được dự án.
        </p>
        <Link
          href="/tai-khoan/du-an"
          className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          Xem điều kiện & gửi hồ sơ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng dự án mới</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Điền đầy đủ rồi bấm <strong>Gửi duyệt</strong> — quản trị viên duyệt xong dự án sẽ hiện trên trang Dự án.
        </p>
      </div>
      <ProjectForm khachHang ownerId={profile?.id ?? null} />
    </div>
  );
}
