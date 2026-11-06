// KÉO NGANG BẰNG CHUỘT / TOUCHPAD TRÊN ZALO PC (06/11/2026 "chạm vuốt xem ảnh, điều hướng trên PC touchpad"):
// điện thoại vuốt sẵn được; trên PC chuột không vuốt được dải cuộn ngang → giữ chuột kéo là cuộn, thả ra thì dừng đúng tấm
// (scroll-snap của khung lo). Kéo quá 6px thì cú bấm sau đó bị bỏ (không mở nhầm tin / ảnh). Lăn dọc trên dải ngang KHÔNG
// đổi thành ngang (giữ cuộn trang); touchpad vuốt hai ngón ngang tự chạy bằng cuộn ngang sẵn có.
// Áp MỘT chỗ cho mọi dải: .anh-tin-khung (ảnh tin, dự án) · .truot-ngang (dải thẻ) · .ray-slide (Bất động sản nổi bật).
const CHON = ".anh-tin-khung, .truot-ngang, .ray-slide";

export function batKeoNgang() {
  let khung: HTMLElement | null = null;
  let x0 = 0;
  let trai0 = 0;
  let daKeo = false;
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    khung = (e.target as HTMLElement).closest<HTMLElement>(CHON);
    if (!khung) return;
    x0 = e.clientX;
    trai0 = khung.scrollLeft;
    daKeo = false;
  });
  document.addEventListener("pointermove", (e) => {
    if (!khung || e.pointerType !== "mouse") return;
    const dx = e.clientX - x0;
    if (!daKeo && Math.abs(dx) < 6) return;
    if (!daKeo) { daKeo = true; khung.style.scrollSnapType = "none"; khung.style.scrollBehavior = "auto"; }
    khung.scrollLeft = trai0 - dx;
    e.preventDefault();
  });
  const tha = () => {
    if (!khung) return;
    const k = khung;
    khung = null;
    if (!daKeo) return;
    // Tới tấm gần nhất theo hướng kéo (như vuốt trên điện thoại)
    const con = k.firstElementChild as HTMLElement | null;
    const buoc = con ? con.getBoundingClientRect().width + (parseFloat(getComputedStyle(k).columnGap) || 0) : k.clientWidth;
    const huong = k.scrollLeft > trai0 ? 1 : -1;
    const tam = Math.round(trai0 / buoc) + huong;
    k.scrollTo({ left: Math.max(0, tam * buoc), behavior: "smooth" });
    // Trả lại "dừng đúng tấm" SAU khi cuộn xong — trả ngay thì khung bật về tấm cũ (đo 06/11/2026)
    setTimeout(() => { k.style.scrollSnapType = ""; k.style.scrollBehavior = ""; }, 450);
  };
  document.addEventListener("pointerup", tha);
  document.addEventListener("pointercancel", tha);
  // Bỏ cú bấm ngay sau khi kéo
  document.addEventListener("click", (e) => {
    if (daKeo) { e.stopPropagation(); e.preventDefault(); daKeo = false; }
  }, true);
}
