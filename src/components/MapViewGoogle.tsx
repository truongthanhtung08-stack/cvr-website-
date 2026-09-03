"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Listing } from "@/lib/data";
import { coordOf } from "@/lib/geo";
import {
  MAP_KEY,
  loadMapsApi,
  soatVeDuoc,
  onMapsAuthFailure,
  parseLatLng,
  type GMap,
  type GMarker,
  type LatLng,
} from "@/lib/googleMaps";
import { layViTri, loiDinhVi, quyenDinhVi } from "@/lib/dinhVi";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";
import TimDiaDiem from "@/components/TimDiaDiem";

export type DiemBanDo = {
  id: string;
  lat: number;
  lng: number;
  // false = vị trí suy theo khu vực, không phải điểm người đăng ghim
  chinhXac?: boolean;
  nhan: string;
  title: string;
  phu: string;
  loc: string;
  image: string;
  href: string;
};

// ════════════════════════════════════════════════════════════════════════════
// CHẾ ĐỘ BẢN ĐỒ Ở BA TAB DANH SÁCH (Mua bán · Cho thuê · Dự án). NỀN GOOGLE.
//
// GOM CỤM là bắt buộc: tin nằm rải từ Đà Nẵng tới Cà Mau, phóng ra xem hết thì
// mấy chục viên giá chồng đè nhau, nhìn ra được vài cái — bản đồ thành vô dụng.
// Gom theo Ô LƯỚI TRÊN MÀN HÌNH (không phải theo km) nên phóng tới đâu tách tới
// đó. Bấm vào cụm là phóng vào đúng chỗ, tách dần ra tới từng tin.
// ════════════════════════════════════════════════════════════════════════════

export default function MapViewGoogle({ items, diem }: { items?: Listing[]; diem?: DiemBanDo[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const markerRef = useRef<GMarker[]>([]);
  const chamRef = useRef<GMarker | null>(null);
  const popupRef = useRef<{ setContent(v: string): void; open(o: unknown): void; close(): void } | null>(null);

  const [sanSang, setSanSang] = useState(false);
  const [hong, setHong] = useState(!MAP_KEY);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [loi, setLoi] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");

  // Gộp về MỘT dạng điểm. ƯU TIÊN TOẠ ĐỘ NGƯỜI ĐĂNG GHIM TAY — tin đã ghim đúng
  // mà vẫn bị suy theo tên phường rồi xê dịch là ghim công cốc, người xem tới nơi
  // không thấy nhà đâu.
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
  const dsRef = useRef<DiemBanDo[]>(ds);
  useEffect(() => {
    dsRef.current = ds;
  }, [ds]);

  // Viên giá / viên cụm vẽ bằng SVG data URI — Google Marker không nhận HTML.
  function viênGia(chu: string): string {
    const rong = Math.max(46, chu.length * 8 + 18);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${rong}" height="30">` +
      `<rect x="0.5" y="0.5" rx="15" ry="15" width="${rong - 1}" height="29" fill="#1d1d1f" stroke="#fff" stroke-width="1.5"/>` +
      `<text x="${rong / 2}" y="20" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12.5" font-weight="700" fill="#fff">${chu}</text>` +
      `</svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }
  function viênCum(so: number, nhan: string): string {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54">` +
      `<circle cx="27" cy="27" r="24" fill="#0071e3" fill-opacity="0.25"/>` +
      `<circle cx="27" cy="27" r="18" fill="#0071e3" stroke="#fff" stroke-width="2.5"/>` +
      `<text x="27" y="26" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#fff">${so}</text>` +
      `<text x="27" y="37" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8.5" fill="#fff">${nhan}</text>` +
      `</svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function xoaMarker() {
    markerRef.current.forEach((m) => m.setMap(null));
    markerRef.current = [];
  }

  // Gom theo ô lưới TRÊN MÀN HÌNH: đổi 72px ra số độ tại mức phóng hiện tại.
  function veMarker() {
    const g = window.google;
    const map = mapRef.current;
    if (!g || !map) return;
    xoaMarker();
    const pts = dsRef.current;
    if (!pts.length) return;

    const zoom = (map as unknown as { getZoom(): number }).getZoom() ?? 11;
    const doMoiO = (72 / (256 * Math.pow(2, zoom))) * 360;

    const nhom = new Map<string, DiemBanDo[]>();
    for (const d of pts) {
      const k = `${Math.floor(d.lng / doMoiO)}:${Math.floor(d.lat / doMoiO)}`;
      const cu = nhom.get(k);
      if (cu) cu.push(d);
      else nhom.set(k, [d]);
    }

    for (const cum of nhom.values()) {
      if (cum.length === 1) {
        const d = cum[0];
        const m = new g.maps.Marker({
          position: { lat: d.lat, lng: d.lng },
          map,
          icon: { url: viênGia(d.nhan) },
          title: d.title,
        });
        m.addListener("click", () => {
          popupRef.current?.setContent(
            `<a class="map-pop" href="${d.href}">` +
              `<img src="${d.image}" alt="" loading="lazy" />` +
              `<span class="map-pop-body">` +
              `<span class="map-pop-title">${d.title}</span>` +
              `<span class="map-pop-price">${d.phu}</span>` +
              `<span class="map-pop-loc">${d.loc}${d.chinhXac === false ? " · vị trí tương đối" : ""}</span>` +
              `</span></a>`,
          );
          popupRef.current?.open({ map, anchor: m });
        });
        markerRef.current.push(m);
        continue;
      }

      const lat = cum.reduce((s, d) => s + d.lat, 0) / cum.length;
      const lng = cum.reduce((s, d) => s + d.lng, 0) / cum.length;
      const m = new g.maps.Marker({
        position: { lat, lng },
        map,
        icon: { url: viênCum(cum.length, diem ? "dự án" : "tin") },
      });
      m.addListener("click", () => {
        const mm = map as unknown as { setCenter(p: LatLng): void; setZoom(z: number): void; getZoom(): number };
        mm.setCenter({ lat, lng });
        mm.setZoom(Math.min((mm.getZoom() ?? 11) + 4, 18));
      });
      markerRef.current.push(m);
    }
  }

  useEffect(() => {
    if (!MAP_KEY) return;
    let huy = false;
    (async () => {
      try {
        await loadMapsApi();
        if (huy || !boxRef.current || !window.google) return;
        const g = window.google as unknown as {
          maps: {
            Map: new (el: HTMLElement, o: Record<string, unknown>) => GMap;
            InfoWindow: new (o?: Record<string, unknown>) => NonNullable<typeof popupRef.current>;
          };
        };
        const map = new g.maps.Map(boxRef.current, {
          center: { lat: 16.05, lng: 108.22 },
          zoom: 11,
          gestureHandling: "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          keyboardShortcuts: false,
        });
        mapRef.current = map;
        popupRef.current = new g.maps.InfoWindow({ disableAutoPan: false });
        map.addListener("idle", () => veMarker());
        setSanSang(true);
        // Google nhận khoá nhưng không vẽ thì cũng phải biết mà lùi về dự phòng.
        soatVeDuoc(boxRef.current, () => {
          if (!huy) setHong(true);
        });
      } catch {
        if (!huy) setHong(true);
      }
    })();
    return () => {
      huy = true;
      xoaMarker();
      mapRef.current = null;
      popupRef.current = null;
      chamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => onMapsAuthFailure(() => setHong(true)), []);

  // Kết quả lọc đổi → khớp khung nhìn bao trọn mọi tin, rồi vẽ lại
  useEffect(() => {
    const g = window.google;
    const map = mapRef.current;
    if (!g || !map || !sanSang || ds.length === 0) return;
    const B = (g.maps as unknown as { LatLngBounds: new () => { extend(p: LatLng): void } }).LatLngBounds;
    const bounds = new B();
    ds.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
    (map as unknown as { fitBounds(b: unknown, p?: number): void }).fitBounds(bounds, 40);
    veMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanSang, ds.map((d) => d.id).join("|")]);

  function veCham(p: LatLng, doiTamNhin: boolean) {
    const g = window.google;
    const map = mapRef.current;
    if (!g || !map) return;
    // ⚠️ CHỈ dời khung khi khách TỰ BẤM. Bản đồ này để xem tin ở nhiều khu vực —
    // tự kéo về chỗ khách đứng là hất hết tin ra khỏi màn hình.
    if (doiTamNhin) {
      map.setCenter(p);
      map.setOptions({ zoom: 13 });
    }
    if (chamRef.current) chamRef.current.setPosition(p);
    else
      chamRef.current = new g.maps.Marker({
        position: p,
        map,
        clickable: false,
        zIndex: 1,
        title: "Vị trí của bạn",
        icon: { path: 0, scale: 7, fillColor: "#0071e3", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
      });
  }

  function dinhVi(tuBam = true) {
    setLoi("");
    if (tuBam) setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        veCham({ lat, lng }, tuBam && !chinhXacHon);
      },
      (ma) => {
        setDangDinhVi(false);
        if (!tuBam && ma !== 1) return;
        if (tuBam) setLoi(loiDinhVi(ma));
      },
      tuBam,
    );
  }

  // Mở bản đồ là vẽ chấm xanh sẵn, nhưng LẶNG LẼ — không bung khối hướng dẫn,
  // không kéo bản đồ đi. Khách mở ra để XEM TIN, chưa hỏi mình đang ở đâu.
  useEffect(() => {
    let huy = false;
    void (async () => {
      if (huy || !sanSang || (await quyenDinhVi()) === "denied") return;
      if (!huy) dinhVi(false);
    })();
    return () => {
      huy = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanSang]);

  return (
    <div className="relative h-full w-full">
      <div ref={boxRef} aria-label="Bản đồ bất động sản" className="h-full w-full bg-cvr-surface" />

      {!sanSang && !hong && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-medium text-cvr-muted">
          Đang mở bản đồ…
        </span>
      )}
      {hong && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] font-medium text-cvr-muted">
          Chưa mở được bản đồ. Anh/chị bấm “Xem danh sách” để xem tin bình thường.
        </span>
      )}

      {/* Ô tìm địa điểm — góc trên phải, chừa góc trái cho nút phóng to */}
      <div className="absolute left-14 right-3 top-3 z-10 sm:left-auto sm:w-[330px]">
        <div className="rounded-xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
          <TimDiaDiem
            value={tuKhoa}
            onChange={setTuKhoa}
            onChon={(kq) => {
              const map = mapRef.current;
              if (!map) return;
              map.setCenter({ lat: kq.lat, lng: kq.lng });
              map.setOptions({ zoom: 16 });
            }}
            placeholder="Tìm tên đường, khu vực…"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => dinhVi(true)}
        disabled={dangDinhVi}
        className="absolute bottom-4 left-3 z-10 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-cvr-blue px-3.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition hover:bg-cvr-blue-ink disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        {dangDinhVi ? "Đang định vị…" : "Vị trí của tôi"}
      </button>

      {loi && (
        <div className="absolute bottom-[68px] left-3 right-3 z-10 sm:max-w-[360px]">
          <NhacBatDinhVi loi={loi} onThuLai={() => dinhVi(true)} dangDinhVi={dangDinhVi} onDong={() => setLoi("")} />
        </div>
      )}
    </div>
  );
}
