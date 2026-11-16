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
  // Thanh dính trên cùng: đầu trang Zalo (zaui-header) + thanh bước form Đăng tin (.thanh-buoc, luôn hiện như web) —
  // ô nằm dưới chúng cũng là bị che.
  let day = 0;
  document.querySelectorAll<HTMLElement>(".zaui-header, .thanh-buoc").forEach((h) => {
    const r = h.getBoundingClientRect();
    if (r.height && r.top < window.innerHeight * 0.4) day = Math.max(day, r.bottom);
  });
  return day;
}

const coBanPhimNay = (caoDu: number) => {
  const vv = window.visualViewport;
  return !!vv && vv.height < caoDu * 0.85;
};

// Ô soạn nhiều dòng (Mô tả) — như web điện thoại (ContentEditor, anh 15–16/11/2026): bàn phím bật thì khung soạn nằm NGAY DƯỚI
// thanh bước, cao vừa phần còn thấy trên bàn phím (không bị che, không quá nhỏ); chữ dài cuộn trong ô. Tắt bàn phím → về cỡ thường.
const TOI_THIEU_O_SOAN = 140;
function vuaChoSoan(el: HTMLTextAreaElement) {
  const vv = window.visualViewport;
  if (!vv) return;
  const nhan = (el.closest("label") as HTMLElement | null) ?? el;
  const tren = dauTrangCao() + 8;
  const dauO = el.getBoundingClientRect().top - nhan.getBoundingClientRect().top; // chiều cao nhãn "Mô tả chi tiết" phía trên ô
  const cao = Math.max(TOI_THIEU_O_SOAN, Math.floor(vv.height + vv.offsetTop - tren - dauO - 12));
  if (el.style.height !== `${cao}px`) el.style.height = `${cao}px`;
  nhan.style.scrollMarginTop = `${tren}px`;
  if (Math.abs(nhan.getBoundingClientRect().top - tren) > 2) nhan.scrollIntoView({ block: "start" });
}
function boVuaSoan(el: HTMLElement | null) {
  if (el instanceof HTMLTextAreaElement && el.style.height) el.style.height = "";
}

function choThay(el: HTMLElement, caoDu: number) {
  if (el instanceof HTMLTextAreaElement && coBanPhimNay(caoDu)) return vuaChoSoan(el);
  const vv = window.visualViewport;
  const cao = vv ? vv.height + vv.offsetTop : window.innerHeight;
  const r = el.getBoundingClientRect();
  const tren = dauTrangCao() + 8;
  if (r.top < tren || r.bottom > cao - 12) el.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function canBanPhim(): () => void {
  let dangGo: HTMLElement | null = null;
  let hen = 0;
  // Chiều cao lớn nhất từng thấy = màn hình khi KHÔNG có bàn phím. Khách tắt bàn phím bằng nút Quay lại (ô vẫn giữ con trỏ, không có
  // focusout) → màn cao lại gần bằng mức đó → hiện lại thanh đáy; bật bàn phím lại → ẩn.
  let caoDu = window.visualViewport?.height ?? window.innerHeight;
  const vao = (e: FocusEvent) => {
    if (!LA_O_GO(e.target as Element)) return;
    if (dangGo && dangGo !== e.target) boVuaSoan(dangGo);
    dangGo = e.target as HTMLElement;
    window.clearTimeout(hen);
    document.documentElement.classList.add("dang-go");
    // Đợi bàn phím bật (Android co màn hình ~250–350ms) rồi mới đo
    window.setTimeout(() => dangGo && choThay(dangGo, caoDu), 350);
  };
  const ra = () => {
    // Chuyển sang ô khác thì focusin tới ngay sau — chờ một nhịp rồi mới hiện lại thanh đáy
    hen = window.setTimeout(() => {
      if (!LA_O_GO(document.activeElement)) {
        boVuaSoan(dangGo);
        dangGo = null;
        document.documentElement.classList.remove("dang-go");
      }
    }, 120);
  };
  const doiCo = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    caoDu = Math.max(caoDu, vv.height);
    const coBanPhim = vv.height < caoDu * 0.85;
    if (!dangGo) return;
    document.documentElement.classList.toggle("dang-go", coBanPhim);
    if (coBanPhim) choThay(dangGo, caoDu);
    else boVuaSoan(dangGo);
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
