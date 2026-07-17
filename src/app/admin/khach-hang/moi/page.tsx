"use client";

import Link from "next/link";

// Tạo khách hàng thay họ cần Supabase Admin API (service_role) — không thể chạy an toàn
// từ trình duyệt. Sẽ làm qua một Route Handler/Edge Function ở bước tiếp theo của B3.
export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/khach-hang" className="text-sm text-cvr-muted hover:text-cvr-ink">← Danh sách khách hàng</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-cvr-ink">Tạo khách hàng</h1>
      <div className="mt-5 rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
        <p className="text-sm leading-relaxed text-cvr-body">
          Tính năng <strong>admin tạo hộ tài khoản</strong> cần khoá quản trị (service_role) chạy
          phía máy chủ để bảo mật — sẽ được thêm qua một API riêng ở bước kế tiếp.
        </p>
        <p className="mt-3 text-xs text-cvr-faint">
          Hiện tại: khách tự đăng ký tại trang Đăng ký; admin vào đây để đổi vai trò/gói/khoá tài khoản.
        </p>
      </div>
    </div>
  );
}
