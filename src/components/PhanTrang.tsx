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

// DÃY SỐ TRANG: ‹ 1 2 3 … n › (anh 08/11/2026 khuya) — luôn thấy 3 trang liền quanh trang đang xem (đầu danh sách: 1–3, cuối: n−2…n),
// cộng trang đầu + trang cuối, phần lược là "…". Tối đa 7 ô số.
export function daySoTrang(hienTai: number, tong: number): (number | "…")[] {
  const KHUNG = 3;
  let tu = Math.max(1, hienTai - Math.floor(KHUNG / 2));
  const den = Math.min(tong, tu + KHUNG - 1);
  tu = Math.max(1, den - KHUNG + 1);
  const so: (number | "…")[] = [];
  if (tu > 1) { so.push(1); if (tu > 2) so.push("…"); }
  for (let p = tu; p <= den; p++) so.push(p);
  if (den < tong) { if (den < tong - 1) so.push("…"); so.push(tong); }
  return so;
}

export default function PhanTrang({
  hienTai,
  tong,
  doiTrang,
  taoLink,
  ghiChu,
  className = "mt-8",
}: {
  hienTai: number;
  tong: number;
  doiTrang: (p: number) => void;
  /** Có truyền thì mỗi nút là ĐƯỜNG DẪN THẬT (?trang=N) để Google lần theo được tới
   *  tin ở trang 2, 3… Khách bấm vẫn đổi trang tại chỗ, không tải lại. */
  taoLink?: (p: number) => string;
  /** Dòng phụ dưới hàng số, vd "1.234 tin". Không truyền thì chỉ hiện "Trang x/y". */
  ghiChu?: string;
  className?: string;
}) {
  if (tong <= 1) return null;
  const so = daySoTrang(hienTai, tong);
  // Đường dẫn thật cho Google; bấm thường (không giữ Ctrl/Cmd) thì đổi trang tại chỗ.
  const nhay = (p: number) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    doiTrang(p);
  };
  const oSo = (p: number) =>
    `h-10 min-w-8 rounded-lg px-1.5 text-sm font-medium transition sm:min-w-10 sm:px-3 ${
      p === hienTai
        ? "bg-cvr-ink text-white"
        : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
    }`;

  return (
    <nav aria-label="Phân trang" className={`flex flex-col items-center gap-2 ${className}`}>
      {/* flex-wrap = lớp chặn cuối: dù số trang có ba chữ số thì hàng cũng
          XUỐNG DÒNG chứ không bao giờ tràn ngang khỏi màn hình điện thoại. */}
      <div className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1.5">{/* một hàng, không xuống dòng (anh 08/11/2026) */}
        <button
          type="button"
          disabled={hienTai === 1}
          onClick={() => doiTrang(hienTai - 1)}
          aria-label="Trang trước"
          className="flex h-10 w-8 items-center justify-center rounded-lg border border-cvr-line sm:w-10 text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>

        {so.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-0.5 text-sm text-cvr-faint">…</span>
          ) : taoLink ? (
            <a
              key={p}
              href={taoLink(p)}
              onClick={nhay(p)}
              aria-current={p === hienTai ? "page" : undefined}
              className={`${oSo(p)} flex items-center justify-center`}
            >
              {p}
            </a>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => doiTrang(p)}
              aria-current={p === hienTai ? "page" : undefined}
              className={oSo(p)}
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
          className="flex h-10 w-8 items-center justify-center rounded-lg border border-cvr-line sm:w-10 text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
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
