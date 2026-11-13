"use client";
// BẢN ĐỒ HẠ TẦNG trong Điểm tin thị trường (như DKRA: bản đồ đánh số công trình). Nền mở MapLibre + OpenFreeMap (src/lib/banDoMo.ts) —
// thư viện ~440 KB chỉ nạp khi khách cuộn tới gần bản đồ. Toạ độ = cột toa_do sheet HA-TANG ("16.05, 108.20"); công trình không
// có toạ độ vẫn nằm trong danh sách, chỉ không có ghim.
import { useEffect, useRef } from "react";
import { napMapLibre, STYLE_MO, vietHoaNhan } from "@/lib/banDoMo";
import type { DiemHaTang } from "@/lib/baoCaoThiTruong";

export default function BanDoHaTang({ diem }: { diem: DiemHaTang[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !diem.length) return;
    let huy = false;
    let map: { remove(): void } | null = null;
    const ve = async () => {
      const ml = await napMapLibre();
      if (huy || !boxRef.current) return;
      const m = new ml.Map({ container: boxRef.current, style: STYLE_MO, center: [diem[0].lng, diem[0].lat], zoom: 10, attributionControl: { compact: true }, cooperativeGestures: true });
      map = m;
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      m.on("load", () => vietHoaNhan(m));
      for (const d of diem) {
        const g = document.createElement("div");
        g.textContent = String(d.so);
        g.style.cssText = "width:24px;height:24px;border-radius:9999px;background:#1d1d1f;color:#fff;font:600 12px/24px system-ui;text-align:center;border:2px solid #b89254;box-shadow:0 2px 6px rgba(0,0,0,.25)";
        g.title = d.ten;
        new ml.Marker({ element: g }).setLngLat([d.lng, d.lat]).addTo(m);
      }
      if (diem.length > 1) {
        const b = new ml.LngLatBounds();
        diem.forEach((d) => b.extend([d.lng, d.lat]));
        m.fitBounds(b, { padding: 40, maxZoom: 13, duration: 0 });
      }
    };
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); ve(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => { huy = true; io.disconnect(); map?.remove(); };
  }, [JSON.stringify(diem)]); // eslint-disable-line react-hooks/exhaustive-deps -- mảng mới mỗi lần vẽ, so theo nội dung
  return <div ref={boxRef} className="h-[260px] w-full overflow-hidden rounded-xl bg-cvr-surface sm:h-[320px] print:hidden" aria-label="Bản đồ công trình hạ tầng" />;
}
