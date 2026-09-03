"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAP_KEY,
  formatLatLng,
  loadMapsApi,
  soatVeDuoc,
  onMapsAuthFailure,
  parseLatLng,
  type GMap,
  type GMarker,
  type LatLng,
} from "@/lib/googleMaps";
import { centerOfArea } from "@/lib/geo";
import { traDiaChi } from "@/lib/timToaDo";
import { docKhoangCach, khoangCachKm, layViTri, loiDinhVi } from "@/lib/dinhVi";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";

// ════════════════════════════════════════════════════════════════════════════
// GHIM VỊ TRÍ — NỀN GOOGLE MAPS (chủ dự án chốt 03/09/2026)
//
// Vì sao bỏ Leaflet/OpenStreetMap: đo thật ở Việt Nam thì máy chủ ảnh của OSM bị
// chặn thẳng, CARTO đóng dấu "API KEY REQUIRED" đầy mặt, Esri tải được nhưng
// CHẤT LƯỢNG BẢN ĐỒ KÉM — thiếu hẻm, thiếu tên đường nhỏ, đúng thứ người đăng
// bất động sản cần nhất. Google là nền duy nhất đủ chi tiết ở Việt Nam.
//
// BA NGUYÊN TẮC — ĐỪNG THÊM THẮT GÌ NGOÀI BA CÁI NÀY:
//   1. CHỌN TỈNH / GÕ ĐỊA CHỈ  → bản đồ BAY TỚI NGAY, và CHỈ bay. Toạ độ tâm
//      tỉnh nằm sẵn trong src/lib/geo.ts (đủ 34 tỉnh), không cần mạng, không cần
//      GPS, không chờ tra địa chỉ. Bấm là thấy.
//   2. GHIM CHỈ SINH RA KHI KHÁCH TỰ TAY LÀM: bấm lên bản đồ, kéo ghim, hoặc
//      bấm "Tôi đang đứng ở đây". MÁY KHÔNG BAO GIỜ TỰ GHIM.
//      Đây là chỗ bản cũ sai và bị bác nhiều lần: máy tự ghim theo chuỗi địa chỉ
//      nên mỗi lần gõ thêm một chữ là ghim nhảy đi chỗ khác — "ghim nhảy lung tung".
//   3. ĐÃ CÓ GHIM THÌ GHIM LÀ CHỦ. Gõ lại địa chỉ, đổi tỉnh, đổi hệ địa chỉ đều
//      KHÔNG được dời ghim. Muốn dời thì khách tự bấm chỗ khác.
//
// Ghim xong thì tra ngược ra địa chỉ và trả về form (onDiaChi / onDiaGioi) —
// phần đó dùng chung với bản cũ, không đổi gì ở tầng dữ liệu.
// ════════════════════════════════════════════════════════════════════════════

export default function MapPickerGoogle({
  value,
  onChange,
  hint = "",
  onDiaChi,
  onDiaGioi,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  onDiaChi?: (v: string) => void;
  onDiaGioi?: (v: { tinh: string; quan: string; phuong: string }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const ghimRef = useRef<GMarker | null>(null);
  const chamRef = useRef<GMarker | null>(null);
  const toiRef = useRef<LatLng | null>(null);
  const onChangeRef = useRef(onChange);
  const onDiaChiRef = useRef(onDiaChi);
  const onDiaGioiRef = useRef(onDiaGioi);
  const hintRef = useRef(hint);
  // Chuỗi địa chỉ MÁY vừa tự điền. Ô đang giữ đúng chuỗi này nghĩa là khách chưa
  // đụng vào → đổi ghim thì máy được viết lại. Khách sửa rồi thì giữ nguyên.
  const mayDienRef = useRef("");

  const [sanSang, setSanSang] = useState(false);
  const [hong, setHong] = useState(!MAP_KEY);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [dangTra, setDangTra] = useState(false);
  const [loi, setLoi] = useState("");
  const [khoangCach, setKhoangCach] = useState("");
  const [mucDo, setMucDo] = useState<"soNha" | "duong" | "khuVuc" | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
    onDiaChiRef.current = onDiaChi;
    onDiaGioiRef.current = onDiaGioi;
    hintRef.current = hint;
  });

  const daGhim = parseLatLng(value);

  // ── Ghim xong → tra ngược ra địa chỉ, trả về form ────────────────────────
  async function traVeDiaChi(p: LatLng) {
    setDangTra(true);
    const ten = await traDiaChi(p.lat, p.lng);
    setDangTra(false);
    setMucDo(ten?.mucDo ?? null);
    if (!ten) return;

    // Ba khối địa giới: luôn cập nhật, đó là sự thật suy từ toạ độ.
    if (ten.tinh || ten.quan || ten.phuong)
      onDiaGioiRef.current?.({ tinh: ten.tinh, quan: ten.quan, phuong: ten.phuong });

    // Số nhà / tên đường: quyền của khách. Chỉ viết khi ô trống hoặc đang giữ
    // đúng chữ máy điền lần trước.
    const oHienTai = (hintRef.current.split(",")[0] ?? "").trim();
    if (ten.ngan && (!oHienTai || oHienTai === mayDienRef.current)) {
      onDiaChiRef.current?.(ten.ngan);
      mayDienRef.current = ten.ngan;
    }
  }

  // ── Đặt ghim — CHỈ gọi từ thao tác tay của khách ─────────────────────────
  function datGhim(p: LatLng) {
    const g = window.google;
    const map = mapRef.current;
    if (!g || !map) return;

    if (ghimRef.current) ghimRef.current.setPosition(p);
    else {
      const m = new g.maps.Marker({ position: p, map, draggable: true, title: "Kéo để chỉnh đúng vị trí" });
      m.addListener("dragend", () => {
        const q = m.getPosition();
        if (!q) return;
        const moi = { lat: q.lat(), lng: q.lng() };
        onChangeRef.current(formatLatLng(moi));
        void traVeDiaChi(moi);
        doKhoangCach(moi);
      });
      ghimRef.current = m;
    }
    onChangeRef.current(formatLatLng(p));
    void traVeDiaChi(p);
    doKhoangCach(p);
  }

  function doKhoangCach(ghim: LatLng) {
    const toi = toiRef.current;
    if (!toi) return;
    setKhoangCach(docKhoangCach(khoangCachKm([toi.lat, toi.lng], [ghim.lat, ghim.lng])));
  }

  // ── Chấm xanh "vị trí của bạn" — chỉ tham chiếu, KHÔNG phải ghim ─────────
  function veCham(p: LatLng, bayToi: boolean) {
    const g = window.google;
    const map = mapRef.current;
    if (!g || !map) return;
    toiRef.current = p;
    if (bayToi) {
      map.setCenter(p);
      map.setOptions({ zoom: 17 });
    }
    if (chamRef.current) chamRef.current.setPosition(p);
    else
      chamRef.current = new g.maps.Marker({
        position: p,
        map,
        clickable: false,
        zIndex: 1,
        title: "Vị trí của bạn",
        // 0 = SymbolPath.CIRCLE — chấm tròn xanh viền trắng
        icon: { path: 0, scale: 7, fillColor: "#0071e3", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
      });
    const g2 = ghimRef.current?.getPosition();
    if (g2) doKhoangCach({ lat: g2.lat(), lng: g2.lng() });
  }

  function dinhVi(ghimLuon: boolean) {
    setLoi("");
    setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        const p = { lat, lng };
        veCham(p, !chinhXacHon);
        if (ghimLuon && !chinhXacHon) datGhim(p);
      },
      (ma) => {
        setDangDinhVi(false);
        setLoi(loiDinhVi(ma));
      },
      true,
    );
  }

  // ── Dựng bản đồ một lần ──────────────────────────────────────────────────
  useEffect(() => {
    if (!MAP_KEY) return;
    let huy = false;
    (async () => {
      try {
        await loadMapsApi();
        if (huy || !boxRef.current || !window.google) return;
        const g = window.google;
        const saved = parseLatLng(value);
        const kv = centerOfArea(hintRef.current);
        const tam: LatLng = saved ?? (kv ? { lat: kv[0], lng: kv[1] } : { lat: 16.054, lng: 108.202 });

        const map = new g.maps.Map(boxRef.current, {
          center: tam,
          zoom: saved ? 18 : kv ? 13 : 6,
          // Kéo MỘT ngón. Mặc định "auto" của Google bắt hai ngón trên điện thoại.
          gestureHandling: "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          keyboardShortcuts: false,
        });
        mapRef.current = map;
        setSanSang(true);
        // Google nhận khoá nhưng không vẽ thì cũng phải biết mà lùi về dự phòng.
        soatVeDuoc(boxRef.current, () => {
          if (!huy) setHong(true);
        });

        // Bấm vào đâu là ghim vào đó — thao tác chính, ai cũng đoán được.
        map.addListener("click", (e) => {
          const p = e.latLng;
          if (p) datGhim({ lat: p.lat(), lng: p.lng() });
        });

        if (saved) datGhim(saved);
      } catch {
        if (!huy) setHong(true);
      }
    })();
    return () => {
      huy = true;
      mapRef.current = null;
      ghimRef.current = null;
      chamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => onMapsAuthFailure(() => setHong(true)), []);

  // ── Khách chọn tỉnh / gõ địa chỉ → BAY TỚI, và CHỈ BAY ───────────────────
  // Toạ độ lấy từ bảng tĩnh trong web (đủ 34 tỉnh) nên bấm là tới ngay, không
  // chờ mạng. ⚠️ TUYỆT ĐỐI KHÔNG đụng vào ghim ở đây — xem nguyên tắc 2 và 3.
  useEffect(() => {
    if (!sanSang) return;
    const map = mapRef.current;
    if (!map || ghimRef.current) return;
    const kv = centerOfArea(hint);
    if (!kv) return;
    const t = setTimeout(() => {
      map.setCenter({ lat: kv[0], lng: kv[1] });
      map.setOptions({ zoom: hint.split(",").filter((s) => s.trim()).length >= 2 ? 14 : 12 });
    }, 250);
    return () => clearTimeout(t);
  }, [hint, sanSang]);

  function xoaGhim() {
    onChange("");
    ghimRef.current?.setMap(null);
    ghimRef.current = null;
    mayDienRef.current = "";
    setKhoangCach("");
    setMucDo(null);
  }

  const nutPhu =
    "inline-flex min-h-[38px] items-center rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-cvr-line">
        <div ref={boxRef} aria-label="Bản đồ ghim vị trí" className="h-[300px] w-full bg-cvr-surface sm:h-[360px]" />
        {!sanSang && !hong && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-medium text-cvr-muted">
            Đang mở bản đồ…
          </span>
        )}
        {hong && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] font-medium text-cvr-muted">
            Chưa mở được bản đồ. Anh/chị vẫn đăng tin bình thường, phần vị trí điền sau cũng được.
          </span>
        )}
        {sanSang && dangTra && (
          <span className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-cvr-ink/85 px-3 py-1.5 text-[12px] font-semibold text-white">
            Đang tìm địa chỉ…
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => dinhVi(true)}
          disabled={dangDinhVi}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-cvr-blue px-3.5 text-[13px] font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
          </svg>
          {dangDinhVi ? "Đang định vị…" : "Tôi đang đứng ở đây"}
        </button>
        {daGhim && (
          <button type="button" onClick={xoaGhim} className={nutPhu}>
            Xoá ghim
          </button>
        )}
      </div>

      <p className="text-[13px] leading-relaxed text-cvr-body">
        {daGhim ? (
          <>
            <span className="font-semibold text-green-700">Đã ghim</span>
            {khoangCach && <span className="text-cvr-muted"> · cách chỗ anh/chị {khoangCach}</span>}
            {mucDo && (
              <span className="ml-1.5 rounded-md bg-cvr-surface px-1.5 py-0.5 text-[11.5px] font-semibold text-cvr-body">
                {mucDo === "soNha" ? "đúng số nhà" : mucDo === "duong" ? "đúng tên đường" : "mới tới phường/xã"}
              </span>
            )}
            <span className="text-cvr-muted"> — kéo ghim hoặc bấm chỗ khác để chỉnh.</span>
          </>
        ) : (
          <span className="text-cvr-muted">
            Bấm thẳng lên bản đồ để ghim đúng vị trí bất động sản. Đang đứng tại đó thì bấm
            “Tôi đang đứng ở đây” cho nhanh và chính xác nhất.
          </span>
        )}
      </p>

      {loi && (
        <NhacBatDinhVi loi={loi} onThuLai={() => dinhVi(true)} dangDinhVi={dangDinhVi} onDong={() => setLoi("")} />
      )}
    </div>
  );
}
