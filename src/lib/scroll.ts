// Cuộn tới khối KẾT QUẢ (#ket-qua) của trang đang xem — dùng khi người dùng bấm
// Tìm / Enter / chọn gợi ý ở NGAY trang danh sách (không đổi trang): phải thấy
// trang "chạy" xuống kết quả, kể cả khi không có tin nào khớp.
export function cuonToiKetQua() {
  const el = document.getElementById("ket-qua");
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // KHÔNG ĐỂ THANH ĐẦU TRANG CHE Ô TÌM (chủ dự án 17/10/2026: "khách phải thấy mình đang gõ cái gì"):
  // cuộn sao cho ô tìm vừa bấm nằm dưới thanh đầu trang, chừa khoảng thở (khung bộ lọc không dính sát menu).
  const o = Array.from(document.querySelectorAll<HTMLInputElement>('input[role="combobox"]')).find((x) => x.offsetParent);
  if (o) {
    const dau = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
    const top = o.getBoundingClientRect().top + window.scrollY - dau - 32;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    return;
  }
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

// Cuộn ngang mượt bằng rAF — dùng chung cho mọi slider scroll-snap.
// KHÔNG dùng scrollTo({behavior:"smooth"}) vì scroll-snap MANDATORY trên Chromium
// chống lại từng khung trung gian và kéo track về snap point cũ → slide đứng im.
// Cách xử lý: TẮT snap trong lúc chạy animation, khôi phục lại khi xong.
// Ease-out cubic kiểu Apple; tôn trọng prefers-reduced-motion (nhảy thẳng).
export function smoothScrollTo(el: HTMLElement, left: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.scrollLeft = left;
    return;
  }
  const prevSnap = el.style.scrollSnapType;
  el.style.scrollSnapType = "none"; // tránh snap kéo ngược trong lúc animate
  const from = el.scrollLeft;
  const start = performance.now();
  const DURATION = 600;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    el.scrollLeft = from + (left - from) * (1 - Math.pow(1 - t, 3));
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.style.scrollSnapType = prevSnap; // khôi phục snap cho thao tác vuốt tay
    }
  };
  requestAnimationFrame(step);
}
