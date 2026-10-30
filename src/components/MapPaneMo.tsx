"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import { napMapLibre, STYLE_MO, vietHoaNhan } from "@/lib/banDoMo";
import { parseLatLng } from "@/lib/googleMaps";
import { timToaDo, zoomTheoMucDo } from "@/lib/timToaDo";
import { centerOfArea } from "@/lib/geo";
import { useKhoaCuon } from "@/lib/khoaCuon";

// ════════════════════════════════════════════════════════════════════════════
// BẢN ĐỒ VỊ TRÍ Ở TRANG CHI TIẾT TIN / DỰ ÁN — NỀN MỞ (MapLibre + OpenFreeMap)
//
// VÌ SAO ĐỔI (17/09/2026): khung nhúng của Google CHẾT HẲN. Đo thật cùng ngày,
// cả ba kiểu địa chỉ nhúng đều trả 404 kèm `X-Frame-Options: SAMEORIGIN`:
//     www.google.com/maps?q=…&output=embed
//     maps.google.com/maps?q=…&output=embed
//     www.google.com/maps/embed/v1/place?q=…
// Trình duyệt chặn khung → khách mở tin ra thấy đúng dòng "Trang web hiện không
// khả dụng … net::ERR_BLOCKED_BY_RESPONSE" nằm giữa trang tin. Khách đã kêu.
// Đây là hệ quả cuối của việc Google xếp Việt Nam vào "prohibited territories"
// (xem src/lib/googleMaps.ts) — KHÔNG phải lỗi cấu hình, không sửa bằng khoá được.
//
// Nền mở thì miễn phí, không khoá, không tài khoản, kéo MỘT ngón trên điện thoại
// (khung Google nhúng bắt hai ngón). Nút "Chỉ đường" vẫn mở thẳng app Google Maps
// như cũ — chỗ đó chỉ là đường dẫn thường, không dính hạn chế nào.
// ════════════════════════════════════════════════════════════════════════════
export default function MapPaneMo({
  query,
  zoom = 16,
  cao = "h-[260px] w-full sm:h-[320px]",
  trongTrang = false,
}: {
  /** Toạ độ "16.02,108.22" (ưu tiên) hoặc chuỗi địa chỉ. */
  query: string;
  zoom?: number;
  cao?: string;
  /** Bản đồ nằm GIỮA trang (trang tin, trang dự án): điện thoại kéo một ngón, phóng hai ngón ngay; máy tính kéo chuột,
   *  nút +/−, Ctrl + lăn chuột mới phóng (lăn thường là cuộn trang). Không câu nhắc nào phủ lên bản đồ. */
  trongTrang?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ghimRef = useRef<MlMarker | null>(null);
  // XEM TOÀN MÀN HÌNH (chủ dự án 23/10/2026: "bản đồ hiển thị trên tin có chức năng bấm xem full"): nút ⛶ → bản đồ phủ kín
  // màn hình, kéo một ngón; ✕ hoặc nút Quay lại của điện thoại thu về đúng chỗ đang xem (useKhoaCuon — hàm chung mọi bảng nổi).
  const [toan, setToan] = useState(false);
  useKhoaCuon(toan, () => setToan(false));
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Toàn màn hình: kéo/phóng tự do. Trong trang (cả điện thoại — chủ dự án 30/10/2026: kéo một ngón làm VƯỚNG khi cuộn):
    // một ngón cuộn trang, hai ngón kéo/phóng (máy tính: Ctrl + lăn).
    if (toan || !trongTrang) map.cooperativeGestures.disable();
    else map.cooperativeGestures.enable();
    requestAnimationFrame(() => map.resize());
  }, [toan, trongTrang]);

  useEffect(() => {
    let huy = false;
    // CHỈ VẼ KHI KHÁCH CUỘN GẦN TỚI (tốc độ điện thoại, đo 21/10/2026): thư viện bản đồ ~440 KB — nạp ngay lúc mở trang tin là
    // giành máy với phần đầu trang dù khách chưa xem bản đồ. Khung giữ nguyên cỡ; trong bộ xem ảnh khung đã hiện nên vẽ ngay.
    let io: IntersectionObserver | null = null;
    const ve = () => (async () => {
      const el = boxRef.current;
      if (!el) return;

      // CHỖ ĐẶT DẤU ĐỎ do MỘT hàm chung quyết (timToaDo — bản đồ nào cũng vậy, sau này đổi sang Google chỉ thay khung vẽ):
      //   1. toạ độ người đăng GHIM TAY → đúng tuyệt đối, kể cả khi bản đồ chưa có tên đường ở đó
      //   2. số nhà + tên đường          → đúng nhà; bản đồ chưa có số đó → trên đúng đoạn đường trong phường
      //   3. tên toà nhà / dự án         → đúng chỗ đó
      //   4. chỉ phường/xã, tỉnh         → giữa khu vực, lùi tầm nhìn cho thấy cả khu vực
      const ghim = parseLatLng(query);
      const kv = centerOfArea(query);
      // Chuỗi địa chỉ có kèm tên đường thì bảng tâm khu vực không khớp — lúc đó
      // vẫn PHẢI vẽ bản đồ (mở tạm ở Đà Nẵng) rồi tra toạ độ ở nền, vì đó chính
      // là trường hợp phổ biến nhất. Bỏ qua là khối bản đồ trắng trơn.
      const tam = ghim ?? (kv ? { lat: kv[0], lng: kv[1] } : { lat: 16.054, lng: 108.202 });

      const ml = await napMapLibre();
      if (huy || !boxRef.current) return;

      const map = new ml.Map({
        container: el,
        style: STYLE_MO,
        center: [tam.lng, tam.lat],
        zoom: ghim ? zoom : Math.min(zoom, 13),
        // Dòng ghi nguồn thu thành nút (i), KHÔNG chèn chữ "MapLibre" (chủ dự án 22/10/2026). "© OpenStreetMap" vẫn nằm
        // trong (i) — giấy phép dữ liệu bản đồ bắt buộc ghi nguồn.
        attributionControl: { compact: true },
        // ĐIỆN THOẠI: một ngón cuộn trang, HAI ngón kéo/phóng ngay trong khung (chủ dự án 30/10/2026: kéo một ngón làm vướng
        // khi cuộn); ⛶ bản đồ lớn kéo một ngón. MÁY TÍNH: kéo chuột như thường; Ctrl/⌘ + lăn mới phóng, lăn thường là cuộn trang.
        // Câu nhắc của thư viện bị ẩn (globals.css) — không chữ nào phủ bản đồ.
        ...(trongTrang ? {
          cooperativeGestures: true,
          locale: {
            "CooperativeGesturesHandler.WindowsHelpText": "Sử dụng Ctrl + cuộn để thu phóng bản đồ",
            "CooperativeGesturesHandler.MacHelpText": "Sử dụng ⌘ + cuộn để thu phóng bản đồ",
          },
        } : {}),
      });
      mapRef.current = map;
      // Điện thoại KHÔNG có +/− (chụm hai ngón để phóng to — chủ dự án 22/10/2026); máy tính giữ +/− (không chụm được).
      if (window.matchMedia("(min-width: 640px)").matches) map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        el.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
        vietHoaNhan(map);
      });

      if (ghim) {
        ghimRef.current = new ml.Marker({ color: "#e11d48" }).setLngLat([ghim.lng, ghim.lat]).addTo(map);
        return;
      }

      // Chưa ghim tay → tra địa chỉ ở NỀN. Bản đồ đã hiện sẵn khu vực nên khách
      // không phải nhìn ô trắng trong lúc chờ.
      // TIN NÀO CŨNG CÓ DẤU ĐỎ (chủ dự án 23/10/2026: "một tin BĐS có vị trí — đúng vị trí khách ghi trên tin nhất, hiển thị
      // bằng dấu đỏ"): ra tới tên đường / số nhà → dấu trên đường đó, phóng sát; chỉ ra tới phường/xã (hoặc tra hỏng, lùi về
      // bảng khu vực) → dấu giữa phường, lùi tầm nhìn cho thấy cả khu vực. Không biết gì cả mới không cắm.
      const kq = (await timToaDo(query)) ?? (kv ? { lat: kv[0], lng: kv[1], mucDo: "khuVuc" as const } : null);
      if (huy || !kq || !mapRef.current) return;
      mapRef.current.jumpTo({ center: [kq.lng, kq.lat], zoom: zoomTheoMucDo(kq.mucDo, zoom) });
      ghimRef.current = new ml.Marker({ color: "#e11d48" }).setLngLat([kq.lng, kq.lat]).addTo(mapRef.current);
    })().catch(() => {
      /* nạp bản đồ hỏng → để trống khối, không làm vỡ trang tin */
    });
    const box = boxRef.current;
    if (box && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((ds) => {
        if (ds.some((d) => d.isIntersecting)) { io?.disconnect(); io = null; void ve(); }
      }, { rootMargin: "400px 0px" });
      io.observe(box);
    } else void ve();

    return () => {
      huy = true;
      io?.disconnect();
      ghimRef.current?.remove();
      ghimRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [query, zoom]);

  if (!trongTrang) return <div ref={boxRef} aria-label="Bản đồ vị trí" className={`${cao} bg-cvr-surface`} />;
  return (
    <div className={toan ? "fixed inset-0 z-[80] bg-white" : "relative"}>
      <div ref={boxRef} aria-label="Bản đồ vị trí" className={`${toan ? "h-full w-full" : cao} bg-cvr-surface`} />
      {/* ⛶ / ✕ — điện thoại góc trên phải; máy tính nằm dưới cụm +/− */}
      <button
        type="button"
        aria-label={toan ? "Thu nhỏ bản đồ" : "Xem bản đồ toàn màn hình"}
        title={toan ? "Thu nhỏ bản đồ" : "Xem bản đồ toàn màn hình"}
        onClick={() => setToan((v) => !v)}
        className={`absolute right-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-cvr-ink shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition active:scale-95 ${toan ? "top-[calc(10px+env(safe-area-inset-top))]" : "top-2.5"} sm:top-[78px]`}
      >
        {toan ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        )}
      </button>
    </div>
  );
}
