"use client";

// ── NÚT GẠT BÁN | CHO THUÊ TRÊN TRANG BẢNG GIÁ ───────────────────────────────
// Trang dựng sẵn CẢ HAI bộ giá ở máy chủ; nút chỉ đổi `data-md` trên khung
// #vung-bang-gia, còn hiện bộ nào là do lớp `group-data-[md=…]/gia` quyết định.
// Nhờ vậy đặt nút ở nhiều chỗ (đầu bảng giá, đầu bảng đẩy tin) vẫn luôn khớp nhau,
// và trang vẫn được cache như trang tĩnh.
export default function NutMucDichGia() {
  const chon = (md: "ban" | "thue") => {
    const vung = document.getElementById("vung-bang-gia");
    if (vung) vung.dataset.md = md;
  };
  const nut = "rounded-full px-4 py-1.5 text-sm font-semibold transition";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-cvr-surface p-1" role="group" aria-label="Giá cho tin bán hay cho thuê">
      <button
        type="button"
        onClick={() => chon("ban")}
        className={`${nut} text-cvr-muted group-data-[md=ban]/gia:bg-cvr-ink group-data-[md=ban]/gia:text-white`}
      >
        Tin bán
      </button>
      <button
        type="button"
        onClick={() => chon("thue")}
        className={`${nut} text-cvr-muted group-data-[md=thue]/gia:bg-cvr-ink group-data-[md=thue]/gia:text-white`}
      >
        Tin cho thuê
      </button>
    </div>
  );
}
