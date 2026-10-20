"use client";

import { useEffect } from "react";

// ============================================================================
// BÀN PHÍM ẢO KHÔNG ĐƯỢC CHE Ô ĐANG GÕ — áp cho TOÀN WEB (chủ dự án 15/10/2026: "khi nhập, bàn phím
// ảo của mobile không che phần khách đang nhập, khách phải thấy được họ đang nhập cái gì").
//
// Trình duyệt trong Zalo / Facebook / Messenger (và Safari iPhone) KHÔNG thu nhỏ trang khi bàn phím
// bật: bàn phím đè lên nửa dưới màn hình, ô nhập ở dưới, bảng trượt từ đáy, thanh tab… nằm khuất
// sau bàn phím. Thành phần này đo phần màn hình còn nhìn thấy (visualViewport) rồi:
//   1. Cuộn ô đang gõ vào giữa phần nhìn thấy (khi bàn phím vừa bật và khi ô tự giãn dòng).
//   2. Lớp phủ toàn màn hình (bảng chọn, hộp xác minh…) co lại vừa phần trên bàn phím.
//   3. Thêm lớp `ban-phim-mo` vào <html> để ẩn các thanh dính đáy (thanh tab, nút chat, thanh
//      gọi/Zalo) — chúng không trồi lên nằm đè ngay trên ô đang gõ.
// ============================================================================

const GO_DUOC = /^(text|search|email|tel|url|password|number|date|datetime-local|month|time|week)$/;

function laOGo(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el.tagName === "TEXTAREA") return true;
  return el.tagName === "INPUT" && GO_DUOC.test((el as HTMLInputElement).type || "text");
}

export default function BanPhimAo() {
  useEffect(() => {
    // ZALO (16/10/2026 chủ dự án: "trên Zalo hiện tại bị che"): trình duyệt trong Zalo nhiều máy KHÔNG
    // báo bàn phím (không co cửa sổ, visualViewport giữ nguyên hoặc không có) → cách đo cũ tưởng không
    // có bàn phím, không cuộn. Dự phòng: máy cảm ứng + đang đứng trong ô gõ = coi như bàn phím ĐANG MỞ,
    // phần còn nhìn thấy giả định là nửa trên màn hình (bàn phím điện thoại chiếm ~40–50%).
    const vv = window.visualViewport;
    const cham = window.matchMedia("(pointer: coarse)").matches;
    const vvTop = () => vv?.offsetTop ?? 0;
    const vvCao = () => vv?.height ?? window.innerHeight;
    const html = document.documentElement;
    let caoNhat = window.innerHeight; // chiều cao khi chưa có bàn phím
    let rongTruoc = window.innerWidth;
    let canCuon = false; // vừa chạm vào ô → được cuộn một lần khi bàn phím bật xong
    let lopPhu: HTMLElement | null = null;
    let raf = 0;

    const traLopPhu = () => {
      if (!lopPhu) return;
      lopPhu.style.removeProperty("top");
      lopPhu.style.removeProperty("bottom");
      lopPhu.style.removeProperty("height");
      lopPhu.style.removeProperty("align-items");
      lopPhu.classList.remove("vua-ban-phim");
      lopPhu = null;
    };

    // Lớp phủ cố định phủ cả màn hình chứa ô đang gõ (bảng chọn, hộp xác minh…)
    const timLopPhu = (el: HTMLElement): HTMLElement | null => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (getComputedStyle(p).position !== "fixed") continue;
        const r = p.getBoundingClientRect();
        return r.height >= window.innerHeight * 0.9 ? p : null;
      }
      return null;
    };

    // THANH DÍNH TRÊN ĐẦU (header + thanh "← Quay lại"): ô nằm dưới chúng là BỊ CHE, không phải "đang nhìn thấy"
    // (chủ dự án 17/10/2026: ô tìm trang kết quả bị thanh "← Cho thuê" đè). Lấy đúng scroll-padding-top của trang.
    // ĐO THẬT MỌI THANH DÍNH TRÊN ĐẦU đang đè lên màn hình (chủ dự án 21/10/2026: "che bởi dòng khác đè lên" — thanh
    // bước "1 Loại tin · 2 Thông tin chính…" của trang đăng tin dính dưới thanh Quay lại mà scroll-padding không tính,
    // ô đang gõ bị cuộn lên nằm ngay dưới thanh đó). Lấy đáy thấp nhất của các thanh dính/cố định nối nhau từ mép trên.
    const cheTren = (el: HTMLElement) => {
      if (timLopPhu(el)) return 0;
      let day = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const ds = Array.from(document.querySelectorAll<HTMLElement>("header, .sticky, .fixed"))
        .filter((n) => !n.contains(el) && /^(sticky|fixed)$/.test(getComputedStyle(n).position))
        .map((n) => n.getBoundingClientRect())
        .filter((r) => r.height > 0 && r.width >= window.innerWidth * 0.5 && r.height <= window.innerHeight * 0.4)
        .sort((a, b) => a.top - b.top);
      for (const r of ds) if (r.top - vvTop() <= day + 4) day = Math.max(day, r.bottom - vvTop());
      return day;
    };
    const dangNhin = (el: HTMLElement, giaDinh: boolean) => {
      const r = el.getBoundingClientRect();
      const tren = vvTop() + cheTren(el) + 8;
      const duoi = giaDinh ? window.innerHeight * 0.5 : vvTop() + vvCao() - 8;
      if (r.height > vvCao() * 0.6) return r.top < duoi - 40 && r.bottom > tren + 40; // ô cao (mô tả): thấy một phần là đủ
      return r.top >= tren && r.bottom <= duoi;
    };

    const capNhat = () => {
      raf = 0;
      if (window.innerWidth !== rongTruoc) {
        rongTruoc = window.innerWidth; // xoay máy → đo lại
        caoNhat = window.innerHeight;
      }
      const el = document.activeElement;
      const go = laOGo(el);
      if (!go) caoNhat = Math.max(caoNhat, window.innerHeight);
      const phim = Math.max(0, window.innerHeight - vvCao() - vvTop());
      const baoPhim = phim > 80 || window.innerHeight < caoNhat - 150; // trình duyệt CÓ báo bàn phím
      const giaDinh = go && cham && !baoPhim; // không báo nhưng máy cảm ứng đang gõ → bàn phím đang che nửa dưới
      const mo = go && (baoPhim || giaDinh);
      html.classList.toggle("ban-phim-mo", mo);
      if (!mo || !go) return traLopPhu();

      const phu = timLopPhu(el);
      if (phu !== lopPhu) traLopPhu();
      if (phu && phim > 0) {
        lopPhu = phu;
        phu.classList.add("vua-ban-phim");
        phu.style.top = `${vvTop()}px`;
        phu.style.bottom = `${phim}px`;
        phu.style.height = "auto";
      } else if (phu && giaDinh) {
        // Không đo được bàn phím: kéo hộp (bảng trượt từ đáy, hộp xác minh…) lên sát mép trên
        lopPhu = phu;
        // Chỉ lớp phủ xếp NGANG (hộp nằm đáy nhờ items-end) mới kéo lên được bằng align-items. Lớp phủ xếp DỌC
        // (màn tìm toàn màn hình) mà ép flex-start thì mọi con co theo chữ → câu dài tràn mép phải, nút X lệch
        // (chủ dự án chụp 17/10/2026) — bỏ qua.
        if (!getComputedStyle(phu).flexDirection.startsWith("column")) phu.style.alignItems = "flex-start";
      } else if (phu) traLopPhu();

      if (canCuon && !dangNhin(el, giaDinh)) {
        const r = el.getBoundingClientRect();
        // ô nằm trong khung cuộn riêng (không phải cả trang) → để trình duyệt cuộn khung đó
        let khung = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p).overflowY;
          if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight) { khung = true; break; }
        }
        if (phu || khung) el.scrollIntoView({ block: giaDinh || r.height > vvCao() * 0.6 ? "start" : "center", behavior: "smooth" });
        else {
          // Cuộn TỰ TÍNH theo phần thật sự nhìn thấy (dưới mọi thanh dính, trên bàn phím) — scrollIntoView của trình
          // duyệt chỉ biết scroll-padding nên đặt ô xuống dưới thanh bước
          const tren = vvTop() + cheTren(el) + 8;
          const duoi = giaDinh ? window.innerHeight * 0.5 : vvTop() + vvCao() - 8;
          const dich = giaDinh || r.height > duoi - tren ? r.top - tren : r.top - (tren + (duoi - tren - r.height) / 2);
          window.scrollBy({ top: dich, behavior: "smooth" });
        }
      }
      canCuon = false;
    };
    const henCapNhat = () => {
      if (!raf) raf = requestAnimationFrame(capNhat);
    };

    const vaoO = (e: FocusEvent) => {
      if (!laOGo(e.target as Element)) return;
      canCuon = true;
      henCapNhat();
      // Có máy không báo đổi kích thước (bàn phím đã mở sẵn khi chuyển ô) → đo lại sau khi bàn phím ổn định
      setTimeout(() => { canCuon = true; henCapNhat(); }, 350);
    };
    const roiO = () => setTimeout(henCapNhat, 120);
    // Ô tự giãn dòng (tiêu đề, mô tả) → dòng đang gõ không được chui xuống dưới bàn phím
    const dangGo = (e: Event) => {
      if (!laOGo(e.target as Element)) return;
      canCuon = true;
      henCapNhat();
    };

    document.addEventListener("focusin", vaoO);
    document.addEventListener("focusout", roiO);
    document.addEventListener("input", dangGo);
    vv?.addEventListener("resize", henCapNhat);
    vv?.addEventListener("scroll", henCapNhat);
    window.addEventListener("resize", henCapNhat); // WebView Android (Zalo, Facebook) co cửa sổ khi bật bàn phím
    return () => {
      document.removeEventListener("focusin", vaoO);
      document.removeEventListener("focusout", roiO);
      document.removeEventListener("input", dangGo);
      vv?.removeEventListener("resize", henCapNhat);
      vv?.removeEventListener("scroll", henCapNhat);
      window.removeEventListener("resize", henCapNhat);
      if (raf) cancelAnimationFrame(raf);
      traLopPhu();
      html.classList.remove("ban-phim-mo");
    };
  }, []);

  return null;
}
