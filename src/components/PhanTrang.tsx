"use client";

// ============================================================================
// PHÂN TRANG DÙNG CHUNG — MỘT BẢN CHO CẢ WEB
//
// Trước đây mỗi danh sách tự in ra ĐỦ số trang: `Array.from({length: totalPages})`.
// Có 9 trang là hàng số dài hơn màn hình điện thoại → trang 1 bị đẩy khuất mép
// trái, các số cuối nằm ngoài màn, khách KHÔNG BẤM ĐƯỢC (ảnh chụp 10/9/2026).
//
// Bản này luôn gọn trong một hàng, dù có 5 hay 500 trang:
//   · luôn thấy trang ĐẦU và trang CUỐI
//   · thấy trang đang xem và hai trang kề
//   · phần bị lược thay bằng "…"
//   → nhiều nhất 7 nút số + 2 nút mũi tên, vừa mọi màn hình.
//
// Nút cao 40px (>= 44px cả padding) cho ngón tay bấm trúng — chuẩn chạm di động.
// ============================================================================

export function daySoTrang(hienTai: number, tong: number): (number | "…")[] {
  const so: (number | "…")[] = [];
  for (let p = 1; p <= tong; p++) {
    if (p === 1 || p === tong || Math.abs(p - hienTai) <= 1) so.push(p);
    else if (so[so.length - 1] !== "…") so.push("…");
  }
  return so;
}

export default function PhanTrang({
  hienTai,
  tong,
  doiTrang,
  ghiChu,
  className = "mt-8",
}: {
  hienTai: number;
  tong: number;
  doiTrang: (p: number) => void;
  /** Dòng phụ dưới hàng số, vd "1.234 tin". Không truyền thì chỉ hiện "Trang x/y". */
  ghiChu?: string;
  className?: string;
}) {
  if (tong <= 1) return null;
  const so = daySoTrang(hienTai, tong);

  return (
    <nav aria-label="Phân trang" className={`flex flex-col items-center gap-2 ${className}`}>
      {/* flex-wrap = lớp chặn cuối: dù số trang có ba chữ số thì hàng cũng
          XUỐNG DÒNG chứ không bao giờ tràn ngang khỏi màn hình điện thoại. */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={hienTai === 1}
          onClick={() => doiTrang(hienTai - 1)}
          aria-label="Trang trước"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>

        {so.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-0.5 text-sm text-cvr-faint">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => doiTrang(p)}
              aria-current={p === hienTai ? "page" : undefined}
              className={`h-10 min-w-10 rounded-lg px-3 text-sm font-medium transition ${
                p === hienTai
                  ? "bg-cvr-ink text-white"
                  : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={hienTai === tong}
          onClick={() => doiTrang(hienTai + 1)}
          aria-label="Trang sau"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* KHÔNG in "Trang 2/7 · 67 tin" ra trang khách: các nút số ở trên đã cho
          biết đang ở trang nào, còn tổng số tin là chuyện nội bộ — web đang ít
          tin thì nói ra chỉ tự phơi điểm yếu (chủ dự án chốt 11/9/2026).
          Dòng này chỉ hiện khi nơi gọi TỰ ĐƯA ghi chú, ví dụ trang "Tin đã đăng"
          trong tài khoản — đó là tin của chính khách, họ biết là đúng. */}
      {ghiChu && <p className="text-xs text-cvr-faint">{ghiChu}</p>}
    </nav>
  );
}
