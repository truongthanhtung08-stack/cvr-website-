"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import type { Listing } from "@/lib/data";
import { napMapLibre, STYLE_MO, vietHoaNhan } from "@/lib/banDoMo";
import { parseLatLng } from "@/lib/googleMaps";
import { coordOf } from "@/lib/geo";
import type { DiemBanDo } from "@/components/MapViewGoogle";

// ════════════════════════════════════════════════════════════════════════════
// BẢN ĐỒ BA TAB (Mua bán · Cho thuê · Dự án) — NỀN MỞ.
//
// Google cấm khoá Maps ở tài khoản dự án nên không vẽ được ghim bằng mã của họ,
// mà khung nhúng thì chỉ nhận đúng một điểm. Riêng ba tab này đổi sang nền
// OpenFreeMap: bản đồ vector dựng từ OpenStreetMap, miễn phí, không cần tài
// khoản. Trang chi tiết tin và ô ghim khi đăng tin VẪN dùng Google nhúng.
//
// GOM CỤM theo ô lưới trên màn hình (không theo km) nên phóng tới đâu tách tới
// đó — tin rải từ Đà Nẵng tới Cà Mau mà không gom thì ghim chồng đè nhau.
// ════════════════════════════════════════════════════════════════════════════

const O_LUOI = 64; // cạnh ô gom cụm, tính bằng điểm ảnh trên màn hình

export default function MapViewMo({ items, diem }: { items?: Listing[]; diem?: DiemBanDo[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ghimRef = useRef<MlMarker[]>([]);
  const [sanSang, setSanSang] = useState(false);
  const [loi, setLoi] = useState("");

  const ds: DiemBanDo[] = useMemo(
    () =>
      diem ??
      (items ?? []).map((it) => {
        const ghim = it.mapPin ? parseLatLng(it.mapPin) : null;
        const [lat, lng] = ghim ? [ghim.lat, ghim.lng] : coordOf(it.location, it.id);
        return {
          id: it.id,
          lat,
          lng,
          chinhXac: !!ghim,
          nhan: it.price,
          title: it.title,
          phu: `${it.price} · ${it.area}`,
          loc: it.location,
          image: it.image,
          href: `/bat-dong-san/${it.id}`,
        };
      }),
    [diem, items],
  );
  const dsRef = useRef(ds);
  useEffect(() => {
    dsRef.current = ds;
  });

  // ── Dựng bản đồ ─────────────────────────────────────────────────────────
  useEffect(() => {
    let huy = false;
    void (async () => {
      const ml = await napMapLibre();
      if (huy || !boxRef.current) return;

      const map = new ml.Map({
        container: boxRef.current,
        style: STYLE_MO,
        center: [108.2022, 16.0544],
        zoom: 11,
      });
      mapRef.current = map;
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        if (huy) return;
        vietHoaNhan(map);
        setSanSang(true);
      });
    })().catch(() => setLoi("Chưa mở được bản đồ. Anh/chị bấm “Xem danh sách” để xem tin bình thường."));

    return () => {
      huy = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Vẽ ghim + gom cụm, vẽ lại mỗi khi đổi bộ lọc hoặc phóng to/thu nhỏ ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sanSang) return;

    let huy = false;
    let hen: ReturnType<typeof setTimeout> | null = null;

    async function ve() {
      const ml = await napMapLibre();
      if (huy || !map) return;

      for (const m of ghimRef.current) m.remove();
      ghimRef.current = [];

      // Gom theo ô lưới MÀN HÌNH: quy toạ độ ra điểm ảnh rồi chia ô.
      const nhom = new Map<string, DiemBanDo[]>();
      for (const d of dsRef.current) {
        if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) continue;
        const p = map.project([d.lng, d.lat]);
        const o = `${Math.floor(p.x / O_LUOI)}:${Math.floor(p.y / O_LUOI)}`;
        const cu = nhom.get(o);
        if (cu) cu.push(d);
        else nhom.set(o, [d]);
      }

      for (const cum of nhom.values()) {
        const tam = {
          lat: cum.reduce((t, x) => t + x.lat, 0) / cum.length,
          lng: cum.reduce((t, x) => t + x.lng, 0) / cum.length,
        };
        const el = document.createElement("button");
        el.type = "button";

        if (cum.length > 1) {
          // CỤM: bấm là phóng vào, tách dần ra từng tin.
          el.className =
            "flex h-9 min-w-9 items-center justify-center rounded-full bg-cvr-ink px-2 text-[13px] font-bold text-white shadow-lg ring-2 ring-white";
          el.textContent = String(cum.length);
          el.onclick = () => map.easeTo({ center: [tam.lng, tam.lat], zoom: map.getZoom() + 2, duration: 400 });
        } else {
          // MỘT TIN: hiện thẳng giá trên ghim, bấm là mở tin.
          const d = cum[0];
          el.className =
            "max-w-[150px] truncate rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-cvr-ink shadow-lg ring-1 ring-black/15 hover:bg-cvr-ink hover:text-white";
          el.textContent = d.nhan;
          el.title = d.title;
          el.onclick = () => window.open(d.href, "_blank", "noopener,noreferrer");
        }

        ghimRef.current.push(new ml.Marker({ element: el }).setLngLat([tam.lng, tam.lat]).addTo(map));
      }
    }

    const veLai = () => {
      if (hen) clearTimeout(hen);
      hen = setTimeout(() => void ve(), 120);
    };

    void ve();
    map.on("moveend", veLai);
    map.on("zoomend", veLai);
    return () => {
      huy = true;
      if (hen) clearTimeout(hen);
      map.off("moveend", veLai);
      map.off("zoomend", veLai);
    };
  }, [ds, sanSang]);

  // ── Mở ra là ôm trọn các tin đang lọc ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sanSang) return;
    const co = ds.filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng));
    if (!co.length) return;
    const lats = co.map((d) => d.lat);
    const lngs = co.map((d) => d.lng);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 56, maxZoom: 15, duration: 500 },
    );
  }, [ds, sanSang]);

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-cvr-line sm:h-[75vh]">
      <div ref={boxRef} aria-label="Bản đồ tin đăng" className="h-full w-full bg-cvr-surface" />
      {!sanSang && !loi && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-medium text-cvr-muted">
          Đang mở bản đồ…
        </span>
      )}
      {loi && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] font-medium text-cvr-muted">
          {loi}
        </span>
      )}
    </div>
  );
}
