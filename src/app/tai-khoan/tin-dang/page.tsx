"use client";

import Link from "next/link";

// Danh sách tin của thành viên — hiển thị thật khi có bảng listings (B2).
export default function MyListingsPage() {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cvr-surface">
        <svg className="h-6 w-6 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-cvr-ink">Chưa có tin đăng</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-cvr-muted">
        Hệ thống đăng tin trực tuyến đang hoàn thiện. Khi hoạt động, tin của bạn sẽ hiển thị tại đây
        kèm trạng thái duyệt, lượt xem và lượt liên hệ.
      </p>
      <Link href="/dang-tin" className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
        + Đăng tin mới
      </Link>
    </div>
  );
}
