// ============================================================================
// NÚT "TIẾP" TRÊN BÀN PHÍM ĐIỆN THOẠI = SANG Ô KẾ TIẾP — theo chuẩn HTML (thuộc tính enterkeyhint: "next" đưa khách tới ô
// nhập kế tiếp, "done" là xong) — chủ dự án 22/10/2026: "bấm Tab trên PC hoặc Tiếp trên mobile thì bấm làm sao — lấy
// nguyên tắc chuẩn, không tự thêm". Máy tính: phím Tab đi theo thứ tự trang (trình duyệt tự làm). Điện thoại: phím Enter
// của bàn phím mang nhãn Tiếp / Xong; bấm Tiếp tới ô gõ chữ kế tiếp, ô cuối bấm Xong là đóng bàn phím. Ô nhiều dòng giữ
// Enter là xuống dòng; ô đã tự xử lý Enter (ô tìm trong bảng chọn…) thì không đụng.
// Gắn vào thẻ <form>: onFocus={ganNhanPhimEnter} onKeyDown={enterSangOTiep}
// ============================================================================

const O_GO = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]):not([type=submit]):not([disabled]):not([readonly]), textarea:not([disabled]), [contenteditable="true"]';

function oKeTiep(form: HTMLElement, o: HTMLElement): HTMLElement | null {
  const ds = [...form.querySelectorAll<HTMLElement>(O_GO)].filter((x) => x.getClientRects().length > 0);
  return ds[ds.indexOf(o) + 1] ?? null;
}

export function ganNhanPhimEnter(e: React.FocusEvent<HTMLFormElement>) {
  const o = e.target as HTMLElement;
  if (!(o instanceof HTMLInputElement) || o.hasAttribute("enterkeyhint")) return;
  o.enterKeyHint = oKeTiep(e.currentTarget, o) ? "next" : "done";
}

export function enterSangOTiep(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || e.defaultPrevented || e.nativeEvent.isComposing) return;
  const o = e.target as HTMLElement;
  if (!(o instanceof HTMLInputElement)) return;
  e.preventDefault(); // ô một dòng không tự gửi form
  if (o.enterKeyHint && o.enterKeyHint !== "next" && o.enterKeyHint !== "done") return; // ô tìm… tự lo
  const tiep = oKeTiep(e.currentTarget, o);
  if (tiep) tiep.focus();
  else o.blur();
}
