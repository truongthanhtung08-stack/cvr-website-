"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/data";
import { coordOf } from "@/lib/geo";

// Chế độ Bản đồ (Leaflet + OpenStreetMap) — marker là pill GIÁ kiểu Batdongsan,
// bấm ra popup thẻ mini dẫn tới trang chi tiết tin.
// ⚠️ Chỉ render phía client — nơi dùng phải import qua next/dynamic với ssr:false.
export default function MapView({ items }: { items: Listing[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Khởi tạo bản đồ 1 lần
  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;
    const map = L.map(boxRef.current).setView([16.05, 108.22], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Vẽ lại marker mỗi khi kết quả lọc đổi + tự khớp khung nhìn
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (items.length === 0) return;

    const bounds = L.latLngBounds([]);
    for (const it of items) {
      const [lat, lng] = coordOf(it.location, it.id);
      bounds.extend([lat, lng]);
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({ className: "map-pin", html: `<span class="map-pill">${it.price}</span>`, iconSize: [0, 0] }),
      }).addTo(layer);
      marker.bindPopup(
        `<a class="map-pop" href="/bat-dong-san/${it.id}">
          <img src="${it.image}" alt="" loading="lazy" />
          <span class="map-pop-body">
            <span class="map-pop-title">${it.title}</span>
            <span class="map-pop-price">${it.price} · ${it.area}</span>
            <span class="map-pop-loc">${it.location}</span>
          </span>
        </a>`,
        { closeButton: false, offset: L.point(0, -14) },
      );
    }
    map.fitBounds(bounds.pad(0.15), { maxZoom: 14 });
  }, [items]);

  return <div ref={boxRef} aria-label="Bản đồ bất động sản" className="h-full w-full" />;
}
