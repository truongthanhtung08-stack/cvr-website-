import { supabase } from "./supabase";

// ĐẾM LƯỢT HIỂN THỊ TIN — cùng chuẩn, cùng hàm ghi_hien_thi với web (src/lib/hienThi.ts):
// thẻ tin lọt vào màn hình ≥ 1/2 và nằm lại ≥ 1 giây = 1 lượt; cùng tin cách nhau ≥ 30 giây.
// Gom rồi gửi một lần (đủ 25 tin · 6 giây · khách rời màn hình).
// Mini App là một kênh của nền tảng → lượt hiển thị ở đây cộng vào số người đăng thấy trên web.
const hangDoi: string[] = [];
const lanCuoi = new Map<string, number>();
let hen: ReturnType<typeof setTimeout> | null = null;
let daGan = false;

function day() {
  if (hen) clearTimeout(hen);
  hen = null;
  if (!hangDoi.length) return;
  const ids = hangDoi.splice(0, hangDoi.length);
  supabase.rpc("ghi_hien_thi", { p_ids: ids }).then(() => {}, () => {});
}

function danhDau(id: string) {
  const gio = Date.now();
  if (gio - (lanCuoi.get(id) ?? 0) < 30_000) return;
  lanCuoi.set(id, gio);
  hangDoi.push(id);
  if (!daGan) {
    daGan = true;
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && day());
  }
  if (hangDoi.length >= 25) day();
  else if (!hen) hen = setTimeout(day, 6_000);
}

export function theoDoiThe(el: Element, id: string): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  let cho: ReturnType<typeof setTimeout> | null = null;
  const io = new IntersectionObserver(
    (ds) => {
      for (const e of ds) {
        if (e.isIntersecting) {
          if (!cho) cho = setTimeout(() => { danhDau(id); cho = null; }, 1_000);
        } else if (cho) {
          clearTimeout(cho);
          cho = null;
        }
      }
    },
    { threshold: 0.5 },
  );
  io.observe(el);
  return () => {
    if (cho) clearTimeout(cho);
    io.disconnect();
  };
}
