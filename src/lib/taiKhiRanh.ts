// TẢI TRƯỚC KHI MÁY RẢNH — cùng cách nạp gói địa danh (src/lib/useDiaDanh.ts): phần mã chỉ dùng khi khách bấm được tách
// khỏi lúc mở trang, rồi tự tải ngầm sau khi trang tải xong và máy rảnh (chậm nhất 3 giây sau), hoặc ngay khi khách chạm /
// gõ phím trước đó. Trang mở nhẹ mà lúc bấm mã đã có sẵn, không phải chờ (27/10/2026).
export function taiKhiRanh(nap: () => unknown): () => void {
  let xong = false;
  let hen: number | undefined;
  const chay = () => {
    if (xong) return;
    xong = true;
    go();
    void Promise.resolve().then(nap).catch(() => {});
  };
  const ranh = () => {
    hen = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(chay, { timeout: 3000 }) : window.setTimeout(chay, 1000);
  };
  const go = () => {
    window.removeEventListener("pointerdown", chay, true);
    window.removeEventListener("keydown", chay, true);
    window.removeEventListener("load", ranh);
  };
  window.addEventListener("pointerdown", chay, { once: true, capture: true });
  window.addEventListener("keydown", chay, { once: true, capture: true });
  if (document.readyState === "complete") ranh();
  else window.addEventListener("load", ranh, { once: true });
  // Rời trang trước khi kịp tải → huỷ hẹn
  return () => {
    go();
    if (hen !== undefined) {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(hen);
      else window.clearTimeout(hen);
    }
  };
}
