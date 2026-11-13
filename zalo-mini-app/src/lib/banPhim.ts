// BÀN PHÍM KHÔNG CHE CHỖ KHÁCH ĐANG GÕ — một chỗ cho MỌI ô nhập của Mini App (anh 14/11/2026: "lỗi bị che, bàn phím khi tạo tin,
// sửa tin và nhập liệu — đây là app trên điện thoại"; luật CLAUDE.md 0A1: khách gõ ô nào phải THẤY NGAY ô đó).
// Gốc lỗi: thanh nút đáy cố định (.nut-chinh — Gửi tin, Nạp…) + thanh tab dưới + nút nổi nằm trên bàn phím khi Zalo co màn hình,
// đè ô đang gõ; ô gần đáy không tự cuộn lên. Cách sửa:
//   1) đang gõ → gắn lớp `dang-go` lên <html>, CSS ẩn thanh đáy / thanh tab / nút nổi (gõ xong hiện lại);
//   2) ô đang gõ nằm ngoài vùng còn thấy (dưới bàn phím hoặc dưới đầu trang) → cuộn ra giữa vùng thấy, tính theo visualViewport
//      (chiều cao thật phía trên bàn phím); bàn phím bật xong mới đo lại (sự kiện resize của visualViewport).
const LA_O_GO = (el: Element | null): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) return !el.readOnly && !["checkbox", "radio", "button", "submit", "range", "file", "color"].includes(el.type);
  return false;
};

function dauTrangCao(): number {
  // Đầu trang Zalo (TieuDe / zaui-header) dính trên cùng — ô nằm dưới nó cũng là bị che
  const h = document.querySelector(".zaui-header") as HTMLElement | null;
  return h ? h.getBoundingClientRect().bottom : 0;
}

function choThay(el: HTMLElement) {
  const vv = window.visualViewport;
  const cao = vv ? vv.height + vv.offsetTop : window.innerHeight;
  const r = el.getBoundingClientRect();
  const tren = dauTrangCao() + 8;
  if (r.top < tren || r.bottom > cao - 12) el.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function canBanPhim(): () => void {
  let dangGo: HTMLElement | null = null;
  let hen = 0;
  const vao = (e: FocusEvent) => {
    if (!LA_O_GO(e.target as Element)) return;
    dangGo = e.target as HTMLElement;
    window.clearTimeout(hen);
    document.documentElement.classList.add("dang-go");
    // Đợi bàn phím bật (Android co màn hình ~250–350ms) rồi mới đo
    window.setTimeout(() => dangGo && choThay(dangGo), 350);
  };
  const ra = () => {
    // Chuyển sang ô khác thì focusin tới ngay sau — chờ một nhịp rồi mới hiện lại thanh đáy
    hen = window.setTimeout(() => {
      if (!LA_O_GO(document.activeElement)) {
        dangGo = null;
        document.documentElement.classList.remove("dang-go");
      }
    }, 120);
  };
  // Chiều cao lớn nhất từng thấy = màn hình khi KHÔNG có bàn phím. Khách tắt bàn phím bằng nút Quay lại (ô vẫn giữ con trỏ, không có
  // focusout) → màn cao lại gần bằng mức đó → hiện lại thanh đáy; bật bàn phím lại → ẩn.
  let caoDu = window.visualViewport?.height ?? window.innerHeight;
  const doiCo = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    caoDu = Math.max(caoDu, vv.height);
    const coBanPhim = vv.height < caoDu * 0.85;
    if (!dangGo) return;
    document.documentElement.classList.toggle("dang-go", coBanPhim);
    if (coBanPhim) choThay(dangGo);
  };
  document.addEventListener("focusin", vao);
  document.addEventListener("focusout", ra);
  window.visualViewport?.addEventListener("resize", doiCo);
  return () => {
    document.removeEventListener("focusin", vao);
    document.removeEventListener("focusout", ra);
    window.visualViewport?.removeEventListener("resize", doiCo);
  };
}
