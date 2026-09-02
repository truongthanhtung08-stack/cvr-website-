"use client";

import { useEffect, useRef, useState } from "react";
import { centerOfArea } from "@/lib/geo";
import {
  MAP_KEY,
  formatLatLng,
  loadMapsApi,
  onMapsAuthFailure,
  parseLatLng,
  type GMap,
  type GMarker,
  type LatLng,
} from "@/lib/googleMaps";

// ── GHIM VỊ TRÍ TRÊN BẢN ĐỒ (form đăng tin: khách & admin) ────────────────────
//
// VÌ SAO CẦN: rất nhiều bất động sản KHÔNG có địa chỉ chính xác — đất nền chưa
// có số nhà, lô dự án, nhà trong hẻm, đất nông nghiệp. Bắt người đăng gõ địa chỉ
// rồi để máy đoán là ghim sai. Cho họ tự bấm đúng điểm trên bản đồ là chắc chắn
// nhất, lại không tốn lượt tra địa chỉ với Google.
//
// Kết quả ghi ra chuỗi "lat, lng" lưu vào details.mapPin — đúng định dạng mà
// trang chi tiết tin đã đọc sẵn từ trước, không phải đổi gì ở tầng dữ liệu.
export default function MapPicker({
  value,
  onChange,
  // Địa chỉ khách đang gõ — chỉ dùng để CHỌN CHỖ MỞ bản đồ lần đầu cho đỡ phải
  // kéo từ giữa biển vào. Không ảnh hưởng toạ độ đã ghim.
  hint = "",
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const markerRef = useRef<GMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [loi, setLoi] = useState("");
  // Khoá Maps hỏng / Google từ chối → KHÔNG được để ô trắng. Lùi về bản nhúng để
  // người đăng vẫn nhìn thấy khu vực, và mở ô nhập toạ độ tay để vẫn ghim được.
  const [hongBanDo, setHongBanDo] = useState(!MAP_KEY);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const daGhim = parseLatLng(value);

  // Dựng bản đồ MỘT LẦN. Sau đó mọi thay đổi chỉ dời ghim, không dựng lại —
  // dựng lại là tính thêm một lượt tải bản đồ với Google.
  useEffect(() => {
    if (!MAP_KEY) return;
    let huy = false;
    (async () => {
      try {
        await loadMapsApi();
        if (huy || !boxRef.current || !window.google) return;
        const g = window.google;
        const saved = parseLatLng(value);
        const khuVuc = centerOfArea(hint);
        // Chưa ghim gì → mở giữa khu vực đang nhập, không có thì mở Đà Nẵng.
        const center: LatLng =
          saved ?? (khuVuc ? { lat: khuVuc[0], lng: khuVuc[1] } : { lat: 16.054, lng: 108.202 });

        const map = new g.maps.Map(boxRef.current, {
          center,
          zoom: saved ? 17 : khuVuc ? 13 : 11,
          gestureHandling: "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          keyboardShortcuts: false,
        });
        mapRef.current = map;

        const dat = (p: LatLng) => {
          if (markerRef.current) markerRef.current.setPosition(p);
          else
            markerRef.current = new g.maps.Marker({
              position: p,
              map,
              draggable: true,
              title: "Kéo để chỉnh đúng vị trí",
            });
          markerRef.current.addListener("dragend", () => {
            const q = markerRef.current?.getPosition();
            if (q) onChangeRef.current(formatLatLng({ lat: q.lat(), lng: q.lng() }));
          });
          onChangeRef.current(formatLatLng(p));
        };

        if (saved) {
          markerRef.current = new g.maps.Marker({
            position: saved,
            map,
            draggable: true,
            title: "Kéo để chỉnh đúng vị trí",
          });
          markerRef.current.addListener("dragend", () => {
            const q = markerRef.current?.getPosition();
            if (q) onChangeRef.current(formatLatLng({ lat: q.lat(), lng: q.lng() }));
          });
        }

        // Bấm vào đâu là ghim vào đó — thao tác chính, ai cũng đoán được.
        map.addListener("click", (e) => {
          const p = e.latLng;
          if (p) dat({ lat: p.lat(), lng: p.lng() });
        });
        // Google có thể nạp được thư viện mà vẫn KHÔNG vẽ (khoá sai, chưa bật
        // Maps JavaScript API, hết hạn mức) — lúc đó nó chỉ để lại một ô xám.
        // Kiểm lại sau 2 giây: không thấy lớp .gm-style thì coi như hỏng.
        setTimeout(() => {
          if (!huy && !boxRef.current?.querySelector(".gm-style")) setHongBanDo(true);
        }, 2000);
      } catch {
        if (!huy) setHongBanDo(true);
      }
    })();
    return () => {
      huy = true;
      mapRef.current = null;
      markerRef.current = null;
    };
    // Cố ý chỉ chạy một lần: value/hint đổi liên tục khi khách gõ, dựng lại bản đồ
    // theo từng phím là vừa giật vừa tốn lượt tải.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Google từ chối khoá → chuyển sang bản nhúng ngay, không đợi hết 2 giây
  useEffect(() => onMapsAuthFailure(() => setHongBanDo(true)), []);

  function viTriCuaToi() {
    if (!navigator.geolocation) {
      setLoi("Máy không hỗ trợ định vị.");
      return;
    }
    setDangDinhVi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDangDinhVi(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(formatLatLng(p));
        const map = mapRef.current;
        const g = window.google;
        if (map && g) {
          map.setCenter(p);
          map.setOptions({ zoom: 18 });
          if (markerRef.current) markerRef.current.setPosition(p);
          else markerRef.current = new g.maps.Marker({ position: p, map, draggable: true });
        }
      },
      () => {
        setDangDinhVi(false);
        setLoi("Không lấy được vị trí. Anh/chị bấm thẳng lên bản đồ để ghim.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function xoaGhim() {
    onChange("");
    markerRef.current?.setMap(null);
    markerRef.current = null;
  }

  // Bản nhúng dự phòng mở đúng khu vực đang nhập (chỉ để nhìn, không ghim được)
  const khuVucNhung = hint.trim() || "Đà Nẵng";

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-cvr-line">
        {hongBanDo ? (
          <iframe
            title="Bản đồ khu vực"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(khuVucNhung)}&z=13&output=embed`}
            className="h-[280px] w-full"
            loading="lazy"
          />
        ) : (
          <div ref={boxRef} aria-label="Bản đồ ghim vị trí" className="h-[280px] w-full bg-cvr-surface" />
        )}
      </div>

      {hongBanDo && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-900">Bản đồ ghim đang tạm nghỉ</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Bấm <strong>“Tôi đang đứng ở đây”</strong> khi đứng tại bất động sản là ghim được ngay.
            Hoặc mở Google Maps, giữ lâu vào đúng điểm để lấy toạ độ rồi dán vào ô dưới.
          </p>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputMode="decimal"
            placeholder="VD: 16.054407, 108.202167"
            className="mt-2 h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm text-cvr-ink outline-none focus:border-amber-500"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={viTriCuaToi}
          disabled={dangDinhVi}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
          </svg>
          {dangDinhVi ? "Đang định vị…" : "Tôi đang đứng ở đây"}
        </button>
        {daGhim && (
          <button
            type="button"
            onClick={xoaGhim}
            className="min-h-[38px] rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-muted transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Xoá ghim
          </button>
        )}
        {daGhim && (
          <span className="text-[13px] font-medium text-cvr-body">
            Đã ghim: <span className="tabular-nums">{value}</span>
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-cvr-faint">
        {daGhim
          ? "Kéo ghim đỏ để chỉnh cho khớp. Tin sẽ hiện đúng điểm này trên bản đồ."
          : "Bấm thẳng lên bản đồ để ghim vị trí. Nên ghim khi bất động sản chưa có địa chỉ chính xác (đất nền, lô dự án, nhà trong hẻm) — ghim rồi thì bản đồ trang tin chỉ đúng điểm, không đoán theo tên đường nữa."}
      </p>
      {loi && <p className="text-xs font-medium text-red-600">{loi}</p>}
    </div>
  );
}
