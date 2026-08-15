// ============================================================================
// BỘ KHUNG DÙNG CHUNG CHO KHU QUẢN TRỊ
//
// Trước đây mỗi trang tự viết lấy một bản `Card` / `Panel` / `Section` và
// `Field` riêng (7 bản gần giống nhau, lệch nhau cái đổ bóng, cỡ chữ mô tả,
// khoảng cách dưới tiêu đề). Cộng lại thành cảm giác lộn xộn khi chuyển trang.
//
// Từ nay mọi trang admin dùng chung 3 thứ ở đây:
//   · PageHeader — đầu trang: tiêu đề + mô tả + nút hành động bên phải
//   · Panel      — khung thẻ trắng bao một nhóm nội dung
//   · Field      — nhãn + ô nhập
//
// Sửa ở đây là mọi trang đổi theo — đó là điểm của việc gom về một chỗ.
// ============================================================================

// Đầu trang. Tiêu đề LUÔN text-2xl (trước có trang text-xl nên chuyển mục
// thấy chữ nhảy to nhỏ). `children` = nút hành động, tự dạt về bên phải.
export function PageHeader({
  title,
  desc,
  children,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">{title}</h1>
        {desc && <p className="mt-1 text-sm text-cvr-muted">{desc}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}

// Khung thẻ trắng. Giữ nguyên cấu trúc DOM cũ (h2 · p · nội dung là anh em
// ruột) để không phá các layout grid/flex đang đặt trực tiếp bên trong.
export function Panel({
  title,
  desc,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  desc?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-cvr-line bg-white p-4 shadow-lux ${className}`}>
      {title && (
        <h2 className={`text-base font-semibold text-cvr-ink ${desc ? "" : "mb-4"}`}>{title}</h2>
      )}
      {desc && <p className="mb-4 mt-1 text-sm text-cvr-muted">{desc}</p>}
      {children}
    </section>
  );
}

// Nhãn + ô nhập. `nho` = biến thể dày đặc, dùng cho bảng giá nhiều cột.
export function Field({
  label,
  nho,
  children,
}: {
  label: React.ReactNode;
  nho?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className={`mb-1.5 block font-medium ${nho ? "text-xs text-cvr-muted" : "text-sm text-cvr-body"}`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
