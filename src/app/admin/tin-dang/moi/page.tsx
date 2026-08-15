"use client";

import ListingForm from "@/components/admin/ListingForm";

export default function NewListingPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng tin mới</h1>
      <p className="mt-1 text-sm text-cvr-muted">
        Bấm <strong>Đăng tin</strong> để hiện ngay trên web (cập nhật trong ≤60 giây), hoặc <strong>Lưu nháp</strong> để làm tiếp sau.
      </p>
      <div className="mt-6">
        <ListingForm />
      </div>
    </div>
  );
}
