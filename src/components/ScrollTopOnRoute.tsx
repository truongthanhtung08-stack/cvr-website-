"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ════════════════════════════════════════════════════════════════════════════
// VỊ TRÍ CUỘN — cơ chế chuẩn của một website
//
//   Mở trang mới (bấm tab, bấm mục menu, bấm thẻ tin, bấm Tìm)
//        → về ĐẦU TRANG THẬT (y = 0), tức chỗ THẤY LOGO. Header là loại dính
//          (sticky) nên ở y = 0 luôn hiện đầy đủ logo + menu.
//   Địa chỉ có neo (#ket-qua, #goi-vip…)
//        → KHÔNG ép về đầu, để trang cuộn tới đúng neo đó (đây là chủ ý:
//          bấm Tìm ở trang chủ phải nhảy thẳng tới khối kết quả).
//   Tải lại trang (F5, kéo xuống làm mới)
//        → về ĐÚNG chỗ đang đọc.
//   Quay lại / Tiến tới (cả tải lại trang lẫn điều hướng trong web)
//        → về ĐÚNG chỗ đã đọc ở trang đó.
//
// Vì sao phải tự làm: ta buộc phải đặt scrollRestoration = "manual" (không thì
// mở trang mới sẽ rơi vào giữa trang). Nhưng giá trị này lưu theo mục lịch sử
// nên F5 và Quay lại cũng dính "manual" → trình duyệt thôi khôi phục. Do đó ta
// tự ghi nhớ và tự cuộn lại.
// ════════════════════════════════════════════════════════════════════════════
const KEY = "cvr_vi_tri_cuon";
const TOI_DA = 30; // nhớ 30 trang gần nhất, tránh phình bộ nhớ phiên

type BanDo = Record<string, number>;

// Địa chỉ hiện tại KÈM tham số lọc — /mua-ban?tinh=Huế khác /mua-ban
const diaChi = () => window.location.pathname + window.location.search;

// Trang đang bị khoá cuộn (đang mở bộ xem ảnh / menu toàn màn hình): lúc đó
// body ở position:fixed và scrollY = 0 → KHÔNG được ghi đè vị trí thật đã lưu.
const dangKhoaCuon = () => document.body.style.position === "fixed";

function docBanDo(): BanDo {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? (v as BanDo) : {};
  } catch {
    return {};
  }
}

function ghiViTri(url: string, y: number) {
  try {
    const bd = docBanDo();
    bd[url] = y;
    const keys = Object.keys(bd);
    // Quá số trang cho phép → bỏ bớt mục cũ nhất (đứng đầu object)
    if (keys.length > TOI_DA) for (const k of keys.slice(0, keys.length - TOI_DA)) delete bd[k];
    sessionStorage.setItem(KEY, JSON.stringify(bd));
  } catch {
    /* chế độ riêng tư chặn sessionStorage → bỏ qua, không làm hỏng trang */
  }
}

export default function ScrollTopOnRoute() {
  const pathname = usePathname();
  const lanDau = useRef(true);
  const quayLai = useRef(false); // vừa bấm Quay lại / Tiến tới

  useEffect(() => {
    const onPop = () => { quayLai.current = true; };
    // Người dùng CHẠM/BẤM/GÕ PHÍM = chủ động mở trang mới → huỷ cờ quay lại.
    // Bảo đảm bấm tab hay mục menu LUÔN về đầu trang (chỗ thấy logo), không bao
    // giờ bị cờ còn sót lại làm nhảy vào giữa trang.
    const huyCo = () => { quayLai.current = false; };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pointerdown", huyCo, true);
    window.addEventListener("keydown", huyCo, true);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pointerdown", huyCo, true);
      window.removeEventListener("keydown", huyCo, true);
    };
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // "reload" = F5 · "back_forward" = mở lại từ lịch sử (tải cả trang)
    const taiLaiTrang = nav?.type === "reload" || nav?.type === "back_forward";
    const dauTien = lanDau.current;
    lanDau.current = false;

    const nenKhoiPhuc = (dauTien && taiLaiTrang) || quayLai.current;
    quayLai.current = false;

    // Địa chỉ có NEO (#ket-qua…) → để trang cuộn tới neo, không ép về đầu.
    if (!nenKhoiPhuc && window.location.hash) return;

    {
      // Khôi phục thì về đúng chỗ đã đọc; mở trang mới thì về ĐẦU TRANG.
      const y = nenKhoiPhuc ? (docBanDo()[diaChi()] ?? 0) : 0;
      if (nenKhoiPhuc && y <= 0) return; // chưa có vị trí đã lưu → để nguyên

      // BÁM THEO KHUNG HÌNH — kể cả khi về đầu trang. Bấm một thẻ tin từ giữa danh
      // sách dài: trình duyệt giữ nguyên vị trí cũ cho tới khi trang mới dựng
      // xong, rồi ảnh vào muộn lại đẩy trang cao lên. Cuộn đúng một nhịp là
      // trang dừng lưng chừng giữa bài, không lên tới đầu (chủ dự án báo
      // 11/9/2026). Lặp vài nhịp tới khi trang ổn định là hết.
      let con = true;
      // NHẢY TỨC THÌ, KHÔNG TRƯỢT MƯỢT.
      // globals.css đặt `html { scroll-behavior: smooth }` cho cả trang (để bấm neo
      // thì trượt êm). Nhưng ở đây trượt êm là hỏng: cuộn từ giữa danh sách về đầu
      // mất cả giây, mà mỗi khung hình lại gọi cuộn một lần nên animation khởi động
      // lại liên tục — đo thật 17/09/2026: mở một tin từ giữa danh sách thì trang
      // kẹt ở y = 53 hơn hai giây rồi mới bò về đầu. Ép `behavior: instant` cho
      // riêng thao tác này; neo trong trang vẫn trượt êm như cũ.
      const ve = () => { if (con) window.scrollTo({ top: y, left: 0, behavior: "instant" }); };
      // Người dùng tự cuộn/chạm trong lúc đang khôi phục → DỪNG NGAY, không
      // được giật họ về chỗ cũ (đây là lỗi kinh điển của cách làm nhiều nhịp).
      const dung = () => { con = false; };
      const optsThuDong = { passive: true } as const;
      window.addEventListener("wheel", dung, optsThuDong);
      window.addEventListener("touchstart", dung, optsThuDong);
      window.addEventListener("keydown", dung);

      // GIỮ ĐẦU TRANG CHO TỚI KHI TRANG ĐỨNG YÊN — không chỉ vài nhịp rời rạc.
      // Đo thật 17/09/2026 trên coastalland.vn: bấm một thẻ tin từ giữa danh sách
      // thì trang tin dừng ở y = 53, không phải đầu trang. Lý do: sau khi mình cuộn
      // về 0, Next dựng xong nội dung rồi tự cuộn tới đầu vùng nội dung — việc đó
      // xảy ra MUỘN HƠN nhịp cuối cùng (400 ms) nên không còn ai kéo lại.
      // Nay bám theo từng khung hình trong ~1,2 giây: lệch quá 2px là kéo về ngay.
      // Khách tự cuộn/chạm/gõ phím thì dừng lập tức (dung() ở trên).
      // MỞ TRANG MỚI: 1,2 giây là đủ (chỉ cần giữ y = 0).
      // KHÔI PHỤC (F5 / Quay lại): cần lâu hơn — trang phải dựng đủ CHIỀU CAO thì
      // mới cuộn xuống sâu được. Đo 17/09/2026: F5 ở y = 2000 mà chỉ về được 1302
      // vì lúc khôi phục ảnh chưa vào, trang còn ngắn.
      const HAN = nenKhoiPhuc ? 4000 : 1200;
      const batDau = performance.now();
      let idFrame = 0;
      const bam = () => {
        if (!con) return;
        if (Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: y, left: 0, behavior: "instant" });
        if (performance.now() - batDau < HAN) idFrame = requestAnimationFrame(bam);
      };

      ve();
      idFrame = requestAnimationFrame(bam);
      window.addEventListener("load", ve, { once: true });

      return () => {
        con = false;
        cancelAnimationFrame(idFrame);
        window.removeEventListener("load", ve);
        window.removeEventListener("wheel", dung);
        window.removeEventListener("touchstart", dung);
        window.removeEventListener("keydown", dung);
      };
    }
  }, [pathname]);

  // Ghi nhớ vị trí đang đọc theo nhịp cuộn (gộp bằng rAF cho nhẹ). Ghi liên tục
  // chứ không chỉ lúc rời trang, vì trên điện thoại sự kiện rời trang hay không kịp chạy.
  useEffect(() => {
    let cho = false;
    const luu = () => {
      if (cho || dangKhoaCuon()) return;
      cho = true;
      requestAnimationFrame(() => {
        cho = false;
        if (!dangKhoaCuon()) ghiViTri(diaChi(), window.scrollY);
      });
    };
    window.addEventListener("scroll", luu, { passive: true });
    window.addEventListener("pagehide", luu);
    return () => {
      window.removeEventListener("scroll", luu);
      window.removeEventListener("pagehide", luu);
    };
  }, [pathname]);

  return null;
}
