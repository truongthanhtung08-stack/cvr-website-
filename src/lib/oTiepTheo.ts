// ============================================================================
// NÚT "TIẾP" TRÊN BÀN PHÍM ĐIỆN THOẠI = SANG Ô KẾ TIẾP — theo chuẩn HTML (thuộc tính enterkeyhint: "next" đưa khách tới ô
// nhập kế tiếp, "done" là xong) — chủ dự án 22/10/2026: "bấm Tab trên PC hoặc Tiếp trên mobile thì bấm làm sao — lấy
// nguyên tắc chuẩn, không tự thêm". Máy tính: phím Tab đi theo thứ tự trang (trình duyệt tự làm). Điện thoại: phím Enter
// của bàn phím mang nhãn Tiếp / Xong; bấm Tiếp tới ô gõ chữ kế tiếp, ô cuối bấm Xong là đóng bàn phím. Ô nhiều dòng giữ
// Enter là xuống dòng; ô đã tự xử lý Enter (ô tìm trong bảng chọn…) thì không đụng.
// Gắn vào thẻ <form>: onFocus={ganNhanPhimEnter} onKeyDown={enterSangOTiep}
// ============================================================================

const O_GO = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]):not([type=submit]):not([disabled]):not([readonly]), textarea:not([disabled]), [contenteditable="true"]';

// Ô CHỌN cũng nằm trong trình tự Tiếp (chủ dự án 23/10/2026: "Tiếp tới ô chọn thì mở luôn bảng chọn — Tiếp/Tab phải trình
// tự"): bảng chọn của web (nút có data-o-chon — ChonCoTim) và ô chọn gốc <select>. Ô đang khoá (Phường khi chưa chọn Tỉnh)
// thì bỏ qua; ô đang ẩn (khối thu gọn) cũng bỏ qua.
const O_CHON = "button[data-o-chon]:not([disabled]), select:not([disabled])";

function oKeTiep(form: HTMLElement, o: HTMLElement): HTMLElement | null {
  const ds = [...form.querySelectorAll<HTMLElement>(`${O_GO}, ${O_CHON}`)].filter((x) => x.getClientRects().length > 0);
  return ds[ds.indexOf(o) + 1] ?? null;
}

// Tới một ô: ô gõ → đặt con trỏ; ô chọn của web → đóng bàn phím, mở bảng chọn (đánh dấu để chọn xong đi tiếp); <select> →
// mở danh sách gốc nếu trình duyệt cho.
function denO(tiep: HTMLElement) {
  if (tiep instanceof HTMLButtonElement) {
    (document.activeElement as HTMLElement | null)?.blur();
    tiep.dataset.tuTiep = "1";
    tiep.click();
    return;
  }
  tiep.focus();
  if (tiep instanceof HTMLSelectElement) {
    try { tiep.showPicker(); } catch { /* trình duyệt chưa hỗ trợ — khách chạm để mở */ }
  }
}

// Bảng chọn mở bằng Tiếp, khách vừa chọn xong → đi tiếp tới ô sau nó (gọi từ ChonCoTim).
export function diTiepSauOChon(nut: HTMLElement) {
  const form = nut.closest("form");
  const tiep = form ? oKeTiep(form, nut) : null;
  if (tiep) denO(tiep);
}

// Ô MỘT Ý nhưng tự giãn khi chữ dài (OGoTuGian — <textarea data-mot-dong>): Enter KHÔNG xuống dòng mà Tiếp như ô một dòng
// (chủ dự án 23/10/2026: "cùng một trường, trên mobile đến đây Tab/Tiếp không nhảy mà nhảy Enter" — ô Tầng số (căn)…).
const motDong = (o: HTMLElement): o is HTMLInputElement | HTMLTextAreaElement =>
  o instanceof HTMLInputElement || (o instanceof HTMLTextAreaElement && o.dataset.motDong !== undefined);

export function ganNhanPhimEnter(e: React.FocusEvent<HTMLFormElement>) {
  const o = e.target as HTMLElement;
  if (!motDong(o) || o.hasAttribute("enterkeyhint")) return;
  o.enterKeyHint = oKeTiep(e.currentTarget, o) ? "next" : "done";
}

export function enterSangOTiep(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || e.defaultPrevented || e.nativeEvent.isComposing) return;
  const o = e.target as HTMLElement;
  if (!motDong(o)) return;
  e.preventDefault(); // ô một dòng không tự gửi form
  if (o.enterKeyHint && o.enterKeyHint !== "next" && o.enterKeyHint !== "done") return; // ô tìm… tự lo
  const tiep = oKeTiep(e.currentTarget, o);
  if (tiep) denO(tiep);
  else o.blur();
}
