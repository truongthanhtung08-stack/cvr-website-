"use client";

import ListingForm from "@/components/admin/ListingForm";

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng tin mới</h1>
      <p className="mt-1 text-sm text-cvr-muted">
        Tin do admin đăng — chọn &quot;Đang đăng&quot; để hiện ngay trên web (web cập nhật trong ≤60 giây).
      </p>
      <div className="mt-6">
        <ListingForm />
      </div>
    </div>
  );
}
