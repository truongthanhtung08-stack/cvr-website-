"use client";

import { useEffect, useRef, useState } from "react";
import { useHomeSection } from "@/components/HomeExpand";

// Menu điều hướng DÍNH của trang dự án — tự sáng mục đang xem khi cuộn (scroll-spy),
// bấm để cuộn mượt tới đúng mục. Nhận danh sách {id, label} khớp id các <section>.
// anKhiMo: menu nằm NGOÀI phần nội dung (dính suốt trang, kể cả khối tin + dự án tương tự cuối trang — 22/10/2026)
// → khi một khối "Xem thêm" đang mở danh sách thì menu tự ẩn như phần nội dung.
export default function ProjectNav({ items, anKhiMo = false }: { items: { id: string; label: string }[]; anKhiMo?: boolean }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  // MENU KHỚP NỘI DUNG (chủ dự án 22/10/2026: "một tin có thể không đầy đủ như menu ở trên thì không cần hiện — mở một tin,
  // nội dung và menu ở trên phải khớp"): chỉ hiện mục có khối THẬT trên trang và khối có nội dung. Khối tải sau (Lịch sử
  // giá) có thì tự hiện lại. Chưa đo (lúc dựng ở máy chủ) thì hiện đủ như danh sách truyền vào.
  const [coMuc, setCoMuc] = useState<string[] | null>(null);
  const thanh = useRef<HTMLDivElement>(null);
  // Khách BẤM một mục → giữ sáng mục đó tới khi trang cuộn xong (mục ngắn như Đặc điểm: mục kế lọt vạch → sáng nhầm).
  const bamRef = useRef<{ id: string; t: number } | null>(null);
  const { hidden } = useHomeSection("__menu-muc");

  useEffect(() => {
    // Mục đang xem = mục CUỐI CÙNG đã cuộn qua mép dưới thanh menu dính. Trước dùng
    // IntersectionObserver chỉ xét các mục VỪA đổi trạng thái → cuộn nhanh qua một mục
    // dài là kẹt sáng mục cũ (đang đọc Lịch sử giá mà vẫn sáng "Đặc điểm").
    // Tìm lại các mục MỖI LẦN tính: khối Lịch sử giá tải sau (stream) nên lúc gắn
    // menu nó chưa có trên trang — tìm một lần là bỏ sót nó vĩnh viễn.
    let raf = 0;
    let cho = 0;
    const tinh = () => {
      raf = 0;
      if (bamRef.current) return;
      const sections = items
        .map((it) => document.getElementById(it.id))
        .filter((el): el is HTMLElement => el != null && el.offsetHeight > 0 && (!!el.textContent?.trim() || !!el.querySelector("img,canvas,svg,iframe,video")));
      const ids = sections.map((el) => el.id);
      setCoMuc((cu) => (cu && cu.join() === ids.join() ? cu : ids));
      if (sections.length === 0) return;
      // VẠCH = 25% phần màn hình dưới thanh (40% thì mục ngắn kế tiếp lấn: Tiến độ đang ở đầu màn hình mà sáng "Chủ đầu tư") (chủ dự án 22/10/2026: "vuốt lên xuống nội dung đến đâu menu tới đó" — trước
      // vạch chỉ cách thanh 24px: bản đồ Vị trí đã hiện gần hết màn hình mà vẫn sáng "Lịch sử giá").
      const day = thanh.current?.getBoundingClientRect().bottom ?? 0;
      const mep = day + (window.innerHeight - day) * 0.25;
      let cur = sections[0].id;
      for (const el of sections) if (el.getBoundingClientRect().top <= mep) cur = el.id;
      // Cuộn chạm đáy trang: mục cuối (thường ngắn) không bao giờ lên tới mép → chọn luôn.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = sections[sections.length - 1].id;
      setActive(cur);
    };
    const onScroll = () => {
      // Đang cuộn tới mục vừa bấm: cuộn dừng 180ms là tới nơi → thả giữ, từ đó vuốt tay thì tính lại như thường.
      if (bamRef.current) {
        clearTimeout(cho);
        cho = window.setTimeout(() => { bamRef.current = null; }, 180);
        return;
      }
      if (!raf) raf = requestAnimationFrame(tinh);
    };
    tinh();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(cho);
    };
  }, [items]);

  // Mục đang sáng luôn nằm trong tầm nhìn của thanh (thanh cuộn ngang trên điện thoại — trước "Vị trí" khuất bên phải).
  useEffect(() => {
    const boc = thanh.current;
    const nut = boc?.querySelector<HTMLElement>(`[data-muc="${active}"]`);
    if (!boc || !nut) return;
    boc.scrollTo({ left: nut.offsetLeft - boc.clientWidth / 2 + nut.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  function scrollTo(id: string) {
    bamRef.current = { id, t: Date.now() };
    setActive(id);
    // Trang đã đứng sẵn ở mục đó (không cuộn) → không có sự kiện cuộn để thả giữ → tự thả sau 1,5 giây.
    window.setTimeout(() => { if (bamRef.current?.id === id) bamRef.current = null; }, 1500);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (anKhiMo && hidden) return null;

  return (
    // MOBILE: dính NGAY DƯỚI thanh "Quay lại" (header 60px + thanh back 53px = 113px)
    // — trước để 56px nên menu bị thanh back đè lên. PC: dính dưới header (60px).
    <div ref={thanh} className="sticky top-[113px] z-30 -mx-1 overflow-x-auto border-b border-cvr-line bg-white/95 px-1 backdrop-blur-md lg:top-[60px]">
      <div className="flex gap-1 whitespace-nowrap py-1">
        {items.filter((t) => !coMuc || coMuc.includes(t.id)).map((t) => (
          <button
            key={t.id}
            type="button"
            data-muc={t.id}
            onClick={() => scrollTo(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active === t.id
                ? "bg-cvr-ink text-white"
                : "text-cvr-muted hover:bg-black/5 hover:text-cvr-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
