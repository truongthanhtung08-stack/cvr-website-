"use client";

// Hàng đợi duyệt tin — cần bảng listings (B2). Trang khung để điều hướng admin không lỗi.
export default function ModerationPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Duyệt tin đăng</h1>
      <div className="mt-5 rounded-2xl border border-cvr-line bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-cvr-body">
          Hàng đợi duyệt tin sẽ hiển thị sau khi hoàn thành phần <strong>Tin đăng (B2)</strong> —
          bảng <code>listings</code> + kiểm duyệt AI. Khi đó admin duyệt/từ chối/ẩn tin ngay tại đây.
        </p>
      </div>
    </div>
  );
}
