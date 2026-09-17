"use client";

import { useEffect, useRef } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import { napMapLibre, STYLE_MO, vietHoaNhan } from "@/lib/banDoMo";
import { parseLatLng } from "@/lib/googleMaps";
import { timToaDo } from "@/lib/timToaDo";
import { centerOfArea } from "@/lib/geo";

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
}: {
  /** Toạ độ "16.02,108.22" (ưu tiên) hoặc chuỗi địa chỉ. */
  query: string;
  zoom?: number;
  cao?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ghimRef = useRef<MlMarker | null>(null);

  useEffect(() => {
    let huy = false;
    (async () => {
      const el = boxRef.current;
      if (!el) return;

      // THỨ TỰ TÌM ĐIỂM — chắc chắn nhất trước, giống hệt bản Google cũ:
      //   1. toạ độ người đăng GHIM TAY → ghim đỏ, đúng tuyệt đối
      //   2. tra được tới tên đường      → ghim đỏ
      //   3. chỉ biết khu vực            → mở đúng vùng, KHÔNG cắm ghim
      //      (cắm ghim giữa phường là chỉ sai nhà người ta)
      // Phần lớn tin CHỈ CÓ địa chỉ chữ nên bước 2 là bước hay chạy nhất — thiếu
      // nó thì khối bản đồ trắng trơn, còn tệ hơn cả khung Google hỏng.
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
      });
      mapRef.current = map;
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => vietHoaNhan(map));

      if (ghim) {
        ghimRef.current = new ml.Marker({ color: "#e11d48" }).setLngLat([ghim.lng, ghim.lat]).addTo(map);
        return;
      }

      // Chưa ghim tay → tra địa chỉ ở NỀN. Bản đồ đã hiện sẵn khu vực nên khách
      // không phải nhìn ô trắng trong lúc chờ.
      const kq = await timToaDo(query);
      if (huy || !kq || !mapRef.current) return;
      mapRef.current.setCenter([kq.lng, kq.lat]);
      if (kq.mucDo === "khuVuc") return;   // chỉ tới được khu vực → không cắm ghim
      mapRef.current.setZoom(zoom);
      ghimRef.current = new ml.Marker({ color: "#e11d48" }).setLngLat([kq.lng, kq.lat]).addTo(mapRef.current);
    })().catch(() => {
      /* nạp bản đồ hỏng → để trống khối, không làm vỡ trang tin */
    });

    return () => {
      huy = true;
      ghimRef.current?.remove();
      ghimRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [query, zoom]);

  return <div ref={boxRef} aria-label="Bản đồ vị trí" className={`${cao} bg-cvr-surface`} />;
}
