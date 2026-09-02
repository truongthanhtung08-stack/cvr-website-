"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { centerOfArea } from "@/lib/geo";
import { formatLatLng, parseLatLng, type LatLng } from "@/lib/googleMaps";
import { xemTrenBanDo } from "@/lib/moGoogleMaps";

// ── GHIM VỊ TRÍ TRÊN BẢN ĐỒ (form đăng tin: khách & admin) ────────────────────
//
// VÌ SAO CẦN: rất nhiều bất động sản KHÔNG có địa chỉ chính xác — đất nền chưa có
// số nhà, lô dự án, nhà trong hẻm. Bắt người đăng gõ địa chỉ rồi để máy đoán là
// ghim sai. Cho họ tự bấm đúng điểm trên bản đồ mới chắc.
//
// VÌ SAO NỀN BẢN ĐỒ KHÔNG PHẢI CỦA GOOGLE (chốt 02/09/2026):
//   Google đã đóng cờ "prohibited territory" vào tài khoản thanh toán (do bật VPN
//   hôm 30/08) nên Maps JS KHÔNG vẽ được — ô xám trắng, hoặc tụt về bản nhúng mà
//   bản nhúng thì BẮT HAI NGÓN và không ghim được. Leaflet + OpenStreetMap không
//   cần khoá, không cần thanh toán, kéo MỘT ngón, bấm là ghim → không bao giờ trắng.
//   Phần CHỈ ĐƯỜNG vẫn dùng Google Maps thật (link mở app, miễn phí) — xem
//   src/lib/moGoogleMaps.ts.
//
// Toạ độ ghi ra là chuỗi "lat, lng" — ĐÚNG định dạng cũ, tầng dữ liệu không đổi gì,
// nên sau này muốn quay lại nền bản đồ Google chỉ phải sửa đúng file này.
export default function MapPickerLeaflet({
  value,
  onChange,
  // Địa chỉ khách đang gõ — dùng để đưa bản đồ về đúng chỗ, không ảnh hưởng ghim.
  hint = "",
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const ghimRef = useRef<LType.Marker | null>(null);
  const chamRef = useRef<LType.CircleMarker | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const onChangeRef = useRef(onChange);
  const hintRef = useRef(hint);

  const [sanSang, setSanSang] = useState(false);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [dangTimDiaChi, setDangTimDiaChi] = useState(false);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
    hintRef.current = hint;
  });

  const daGhim = parseLatLng(value);

  // Ghim đỏ vẽ bằng SVG trong divIcon — không dùng ảnh marker mặc định của Leaflet
  // vì đường dẫn ảnh đó hay vỡ khi qua bộ đóng gói.
  const HTML_GHIM =
    "<svg width=\"30\" height=\"40\" viewBox=\"0 0 30 40\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M15 39C15 39 28 24.5 28 14.5A13 13 0 1 0 2 14.5C2 24.5 15 39 15 39Z\" fill=\"#e11d48\" stroke=\"#fff\" stroke-width=\"2.5\"/>" +
    "<circle cx=\"15\" cy=\"14.5\" r=\"4.5\" fill=\"#fff\"/></svg>";

  const GHI_NGUON =
    "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>";

  function datGhim(p: LatLng) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (ghimRef.current) ghimRef.current.setLatLng([p.lat, p.lng]);
    else {
      const icon = L.divIcon({ className: "", html: HTML_GHIM, iconSize: [30, 40], iconAnchor: [15, 39] });
      const m = L.marker([p.lat, p.lng], { icon, draggable: true }).addTo(map);
      m.on("dragend", () => {
        const q = m.getLatLng();
        onChangeRef.current(formatLatLng({ lat: q.lat, lng: q.lng }));
      });
      ghimRef.current = m;
    }
    onChangeRef.current(formatLatLng(p));
  }

  // Chấm xanh "vị trí của bạn" — chỉ để tham chiếu, KHÔNG phải điểm ghim
  function hienCham(lat: number, lng: number, doiTamNhin: boolean, zoom: number) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (doiTamNhin) map.setView([lat, lng], zoom);
    if (chamRef.current) chamRef.current.setLatLng([lat, lng]);
    else
      chamRef.current = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: "#0071e3",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
  }

  // Định vị hỏng thì phải NÓI RÕ vì sao và bảo khách làm gì — im lặng là khách
  // đứng nhìn không hiểu chuyện gì.
  function loiDinhVi(ma: number): string {
    if (ma === 1)
      return "Anh/chị đang CHẶN định vị. Bấm ổ khoá 🔒 cạnh địa chỉ web → Vị trí → Cho phép, rồi bấm lại nút này.";
    if (ma === 2)
      return "Máy CHƯA BẬT GPS. Vào Cài đặt điện thoại → Vị trí, bật lên rồi bấm lại nút này.";
    return "Định vị lâu quá. Bật GPS rồi bấm lại, hoặc kéo bản đồ tới đúng chỗ và bấm để ghim.";
  }

  // ĐỊNH VỊ HAI CHẶNG CHO NHANH:
  //   Chặng 1 — không bắt GPS chính xác cao + nhận vị trí cũ trong 10 phút → máy
  //     lấy theo wifi/trạm phát sóng, thường có NGAY DƯỚI 1 GIÂY.
  //   Chặng 2 — GPS chính xác chạy ngầm, có kết quả sát hơn thì tự dời lại.
  // Bật chính xác cao ngay từ đầu là sai lầm cũ: ngoài trời chờ 5–15 giây, trong
  // nhà treo luôn.
  // doiTamNhin=false: chỉ VẼ CHẤM XANH chứ không kéo bản đồ đi — dùng khi khách đã
  // gõ địa chỉ hoặc đã ghim sẵn, kéo đi là mất chỗ họ đang xem.
  function dinhVi(ghimLuon: boolean, doiTamNhin = true) {
    if (!navigator.geolocation) {
      setLoi("Trình duyệt không hỗ trợ định vị. Anh/chị kéo bản đồ rồi bấm để ghim.");
      return;
    }
    setLoi("");
    setDangDinhVi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDangDinhVi(false);
        hienCham(pos.coords.latitude, pos.coords.longitude, doiTamNhin, ghimLuon ? 18 : 16);
        if (ghimLuon) datGhim({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        navigator.geolocation.getCurrentPosition(
          (sat) => hienCham(sat.coords.latitude, sat.coords.longitude, false, 16),
          () => {},
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      },
      (e) => {
        setDangDinhVi(false);
        setLoi(loiDinhVi(e.code));
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 },
    );
  }

  // Đưa bản đồ về địa chỉ khách đang nhập. Tra bằng Nominatim của OpenStreetMap —
  // miễn phí, không cần khoá.
  async function veDiaChi() {
    const map = mapRef.current;
    const phan = hintRef.current.split(",").map((s) => s.trim());
    // Ô "Địa chỉ cụ thể" là phần ĐẦU TIÊN — có số nhà hoặc tên đường thì trỏ thẳng
    // tới đó, chính xác hơn hẳn tâm phường.
    const coDuong = phan[0].length >= 3;
    const diaChi = phan.filter(Boolean).join(", ");
    if (!map || diaChi.length < 4) return;

    if (!coDuong) {
      const kv = centerOfArea(diaChi);
      if (kv) {
        map.setView([kv[0], kv[1]], 15);
        return;
      }
    }
    setDangTimDiaChi(true);
    try {
      const r = await fetch(
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=" +
          encodeURIComponent(diaChi),
      );
      const ds = (await r.json()) as { lat: string; lon: string }[];
      if (ds[0]) map.setView([Number(ds[0].lat), Number(ds[0].lon)], coDuong ? 17 : 15);
    } catch {
      // Tra không ra thì thôi, khách vẫn tự kéo bản đồ được
    }
    setDangTimDiaChi(false);
  }

  // ── DỰNG BẢN ĐỒ MỘT LẦN ────────────────────────────────────────────────────
  useEffect(() => {
    let huy = false;
    (async () => {
      const L = (await import("leaflet")) as unknown as typeof LType;
      if (huy || !boxRef.current || mapRef.current) return;
      LRef.current = L;

      const daCo = parseLatLng(value);
      const kv = centerOfArea(hintRef.current);
      const tam: [number, number] = daCo ? [daCo.lat, daCo.lng] : kv ? [kv[0], kv[1]] : [16.054, 108.202];

      const map = L.map(boxRef.current).setView(tam, daCo ? 17 : kv ? 14 : 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: GHI_NGUON,
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      // Bấm vào đâu ghim vào đó — thao tác chính, ai cũng đoán được
      map.on("click", (e: LType.LeafletMouseEvent) => {
        datGhim({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      if (daCo) datGhim(daCo);
      setSanSang(true);

      // LUÔN XIN ĐỊNH VỊ NGAY khi mở bản đồ. Bản trước chỉ định vị khi khách CHƯA gõ
      // địa chỉ — mà đăng tin thì bao giờ cũng gõ địa chỉ trước, nên chấm xanh không
      // bao giờ hiện, trong khi phần hướng dẫn vẫn ghi "chấm xanh: bạn đang ở đây".
      // Đã ghim sẵn hoặc đã gõ địa chỉ thì chỉ VẼ CHẤM, không kéo bản đồ đi chỗ khác.
      const daNhapDiaChi = hintRef.current.split(",").some((s) => s.trim().length > 0);
      setTimeout(() => dinhVi(false, !daCo && !daNhapDiaChi), 300);
    })();

    return () => {
      huy = true;
      mapRef.current?.remove();
      mapRef.current = null;
      ghimRef.current = null;
      chamRef.current = null;
    };
    // Cố ý chạy một lần: value/hint đổi liên tục khi khách gõ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khách vừa chọn khu vực / gõ địa chỉ → tự đưa bản đồ về đó. Đã ghim rồi thì giữ
  // nguyên, không giật ghim của khách đi chỗ khác.
  useEffect(() => {
    if (!sanSang || parseLatLng(value)) return;
    const t = setTimeout(() => void veDiaChi(), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint, sanSang]);

  function xoaGhim() {
    onChange("");
    ghimRef.current?.remove();
    ghimRef.current = null;
  }

  const nutPhu =
    "inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-45";

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-cvr-line">
        <div ref={boxRef} aria-label="Bản đồ ghim vị trí" className="h-[280px] w-full bg-cvr-surface" />

        {/* CÁCH GHIM PHẢI VIẾT NGAY TRÊN BẢN ĐỒ. Để hướng dẫn ở dưới khung thì trên
            điện thoại nó nằm dưới màn hình, người đăng nhìn bản đồ không biết làm gì.
            z-index trên 700 vì Leaflet xếp marker 600 / popup 700. */}
        <span className="pointer-events-none absolute left-1/2 top-3 z-[1200] -translate-x-1/2 whitespace-nowrap rounded-full bg-cvr-ink/85 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          {daGhim ? "Kéo ghim đỏ để chỉnh lại cho đúng" : "Bấm lên bản đồ để ghim vị trí"}
        </span>
      </div>

      {/* HƯỚNG DẪN 3 DÒNG — đúng 3 việc người đăng cần: mình ở đâu · bất động sản ở
          đâu · ghim chỗ nào. Ghim xong gọn còn một dòng. */}
      {daGhim ? (
        <p className="text-[13px] text-cvr-body">Kéo ghim đỏ nếu cần chỉnh lại cho đúng.</p>
      ) : (
        <ul className="space-y-1 text-[13px] text-cvr-body">
          <li className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-white bg-cvr-blue shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
            Chấm xanh: bạn đang ở đây
          </li>
          <li>Kéo và phóng bản đồ tới bất động sản</li>
          <li>Bấm lên bản đồ để ghim</li>
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => dinhVi(true)}
          disabled={dangDinhVi}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-cvr-blue px-4 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
          </svg>
          {dangDinhVi ? "Đang định vị…" : "Tôi đang đứng ở đây"}
        </button>

        <button type="button" onClick={() => void veDiaChi()} disabled={dangTimDiaChi} className={nutPhu}>
          {dangTimDiaChi ? "Đang tìm…" : "Về địa chỉ đã nhập"}
        </button>

        {/* SOI LẠI TRÊN GOOGLE MAPS — mở thẳng app bản đồ trên máy để người đăng
            kiểm tra ảnh vệ tinh, tên đường quanh điểm vừa ghim. Đây KHÔNG phải nút
            chỉ đường: người đăng đang ở đó rồi. Nút chỉ đường nằm ở TRANG TIN cho
            người mua. Link thường, không gọi API nên miễn phí. */}
        {daGhim && (
          <button type="button" onClick={() => xemTrenBanDo(`${daGhim.lat},${daGhim.lng}`)} className={nutPhu}>
            Soi lại trên Google Maps
          </button>
        )}

        {daGhim && (
          <button type="button" onClick={xoaGhim} className={nutPhu}>
            Xoá ghim
          </button>
        )}

        {daGhim && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Đã ghim vị trí
          </span>
        )}
      </div>

      {loi && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-[13px] font-medium leading-relaxed text-amber-900">{loi}</p>
          <button
            type="button"
            onClick={() => dinhVi(true)}
            disabled={dangDinhVi}
            className="mt-2 inline-flex min-h-[36px] items-center rounded-lg border border-amber-400 bg-white px-3 text-[13px] font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {dangDinhVi ? "Đang định vị…" : "Thử lại"}
          </button>
        </div>
      )}
    </div>
  );
}
