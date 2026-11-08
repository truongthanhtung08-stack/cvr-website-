"use client";

import { useEffect, useState } from "react";

// ẨN / HIỆN THEO CUỘN — MỘT BỘ ĐO CHUNG cho thanh dưới (MobileTabBar) và hàng trường lọc (FilterBar), để hai thanh ẩn / hiện CÙNG NHỊP.
// Chuẩn (anh 08/11/2026: "hiệu ứng chuyển động chuẩn + mượt khi cuộn vuốt"; luật 02/11: ẩn khi cuộn, dừng thì hiện lại):
//   · chỉ khách cuộn THẬT (vuốt / lăn chuột) — trang tự dịch khi ảnh tải không tính; vuốt trong bảng chọn ([data-cuon-bang]) không tính
//   · cuộn XUỐNG quá NGUONG_AN px (tính từ chỗ đổi chiều) mới ẩn — nhích vài px khi đọc không làm thanh nhấp nháy (trước: chạm là ẩn)
//   · cuộn LÊN quá NGUONG_HIEN px là hiện NGAY (không chờ dừng tay)
//   · dừng tay DUNG ms → hiện lại; gần đầu trang (< 24px) luôn hiện
const NGUONG_AN = 12;
const NGUONG_HIEN = 8;
const DUNG = 350;

let an = false;
const nghe = new Set<(v: boolean) => void>();
let gan = 0;
let go: (() => void) | null = null;

function datAn(v: boolean) {
  if (an === v) return;
  an = v;
  nghe.forEach((f) => f(v));
}

function batDau() {
  let moc = window.scrollY; // chỗ đổi chiều gần nhất
  let truoc = window.scrollY;
  let dangVuot = false;
  let hen = 0;
  const henHien = () => { clearTimeout(hen); hen = window.setTimeout(() => { dangVuot = false; datAn(false); moc = window.scrollY; }, DUNG); };
  const tinh = () => {
    const y = window.scrollY;
    if (y < 24) { datAn(false); moc = truoc = y; return; }
    // Trang tự dịch (không phải khách vuốt) → mốc đi theo chỗ đang đứng; khách vuốt thì tính từ đúng chỗ bắt đầu vuốt
    if (!dangVuot) { moc = truoc = y; return; }
    if ((y - truoc) * (truoc - moc) < 0) moc = truoc; // đổi chiều → đặt lại mốc
    truoc = y;
    if (y - moc > NGUONG_AN) datAn(true);
    else if (moc - y > NGUONG_HIEN) datAn(false);
    henHien();
  };
  // Tính NGAY lúc cuộn (chỉ đọc scrollY, không đo bố cục — rất nhẹ); không chờ khung vẽ: trình duyệt hoãn khung vẽ khi trang chạy nền
  // thì kẹt trạng thái (bài học FilterBar 02/11/2026)
  const cuon = tinh;
  const vuot = (e: Event) => { if ((e.target as Element | null)?.closest?.("[data-cuon-bang]")) return; dangVuot = true; };
  window.addEventListener("scroll", cuon, { passive: true });
  window.addEventListener("touchmove", vuot, { passive: true });
  window.addEventListener("wheel", vuot, { passive: true });
  go = () => {
    window.removeEventListener("scroll", cuon); window.removeEventListener("touchmove", vuot); window.removeEventListener("wheel", vuot);
    clearTimeout(hen); an = false;
  };
}

export function useAnKhiCuon(): boolean {
  const [v, setV] = useState(an);
  useEffect(() => {
    nghe.add(setV);
    if (gan++ === 0) batDau();
    return () => {
      nghe.delete(setV);
      if (--gan === 0) { go?.(); go = null; }
    };
  }, []);
  return v;
}
