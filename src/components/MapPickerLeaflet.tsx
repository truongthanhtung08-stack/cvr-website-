"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { formatLatLng, parseLatLng, type LatLng } from "@/lib/googleMaps";
import { xemTrenBanDo } from "@/lib/moGoogleMaps";
import { docKhoangCach, khoangCachKm, layViTri, loiDinhVi } from "@/lib/dinhVi";
import { timToaDo, traDiaChi } from "@/lib/timToaDo";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";

// ── GHIM VỊ TRÍ TRÊN BẢN ĐỒ (form đăng tin: khách & admin) ────────────────────
//
// BẢN ĐỒ NÀY ĐỂ LÀM GÌ (chủ dự án chốt 03/09/2026) — khác hẳn bản đồ trang tin:
// đây là bản đồ của NGƯỜI ĐĂNG, và nó phải chạy HAI CHIỀU:
//   · Gõ địa chỉ  → bản đồ TỰ GHIM tới đó (có tên đường là ghim được rồi)
//   · Bấm ghim    → HIỆN ĐỊA CHỈ của điểm vừa ghim, để người đăng kiểm lại
// Chỉ hiện một dấu đỏ trơ trọi là người đăng không biết mình ghim đúng hay sai.
//
// VÌ SAO CẦN GHIM TAY: rất nhiều bất động sản KHÔNG có địa chỉ chính xác — đất nền
// chưa có số nhà, lô dự án, nhà trong hẻm. Bắt gõ địa chỉ rồi để máy đoán là ghim sai.
//
// VÌ SAO NỀN KHÔNG PHẢI GOOGLE: Google đóng cờ "prohibited territory" vào tài khoản
// thanh toán nên Maps JS không vẽ được, và bản nhúng thì bắt hai ngón, không ghim
// được. Leaflet + OpenStreetMap không cần khoá, không cần thanh toán, kéo MỘT ngón.
// Tra địa chỉ dùng Nominatim của OpenStreetMap, cũng miễn phí — xem src/lib/timToaDo.ts.
//
// Toạ độ ghi ra vẫn là chuỗi "lat, lng" như cũ, tầng dữ liệu không đổi gì.
export default function MapPickerLeaflet({
  value,
  onChange,
  // Địa chỉ người đăng đang gõ — dùng để tự đưa bản đồ tới và tự ghim.
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
  const vongRef = useRef<LType.CircleMarker | null>(null);
  const duongRef = useRef<LType.Polyline | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const onChangeRef = useRef(onChange);
  const hintRef = useRef(hint);
  const toiRef = useRef<[number, number] | null>(null);

  const [sanSang, setSanSang] = useState(false);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [dangTimDiaChi, setDangTimDiaChi] = useState(false);
  const [loi, setLoi] = useState("");
  const [diaChiGhim, setDiaChiGhim] = useState("");
  const [khoangCach, setKhoangCach] = useState("");

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

  // Ghim xong là tra ngược ra địa chỉ và gắn ngay nhãn lên trên đầu ghim, để người
  // đăng đọc được mình vừa ghim vào đâu chứ không phải đoán theo dấu đỏ.
  async function hienTenChoGhim(p: LatLng) {
    const ten = await traDiaChi(p.lat, p.lng);
    setDiaChiGhim(ten ?? "");
    const m = ghimRef.current;
    if (!m) return;
    if (ten) m.bindTooltip(ten, { permanent: true, direction: "top", offset: [0, -40], className: "cl-nhan-ghim" });
    else m.unbindTooltip();
  }

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
        void hienTenChoGhim({ lat: q.lat, lng: q.lng });
        noiToiVoiGhim();
      });
      ghimRef.current = m;
    }
    onChangeRef.current(formatLatLng(p));
    void hienTenChoGhim(p);
    noiToiVoiGhim();
  }

  // Đường đứt nối chỗ người đăng đang đứng với điểm vừa ghim + khoảng cách. Đứng
  // ngay tại bất động sản thì thấy "cách 20 m" là biết ghim chuẩn.
  function noiToiVoiGhim() {
    const L = LRef.current;
    const map = mapRef.current;
    const toi = toiRef.current;
    const m = ghimRef.current;
    if (!L || !map || !toi || !m) return;
    const g = m.getLatLng();
    const bds: [number, number] = [g.lat, g.lng];
    setKhoangCach(docKhoangCach(khoangCachKm(toi, bds)));
    if (duongRef.current) duongRef.current.setLatLngs([toi, bds]);
    else
      duongRef.current = L.polyline([toi, bds], {
        color: "#0071e3",
        weight: 3,
        opacity: 0.85,
        dashArray: "7 7",
        interactive: false,
      }).addTo(map);
  }

  // Chấm xanh "vị trí của bạn" — chỉ để tham chiếu, KHÔNG phải điểm ghim
  function hienCham(lat: number, lng: number, doiTamNhin: boolean, zoom: number) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    toiRef.current = [lat, lng];
    if (doiTamNhin) map.setView([lat, lng], zoom);

    if (vongRef.current) vongRef.current.setLatLng([lat, lng]);
    else
      vongRef.current = L.circleMarker([lat, lng], {
        radius: 16,
        stroke: false,
        fillColor: "#0071e3",
        fillOpacity: 0.18,
        interactive: false,
      }).addTo(map);

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

    noiToiVoiGhim();
  }

  // ghimLuon=true: bấm "Tôi đang đứng ở đây" → ghim luôn tại chỗ đang đứng.
  // doiTamNhin=false: chỉ vẽ chấm, không kéo bản đồ đi (khi đã ghim / đã gõ địa chỉ).
  // Khách TỰ BẤM thì ép máy đo lại vị trí — tức buộc bật GPS.
  function dinhVi(ghimLuon: boolean, doiTamNhin = true, tuBam = true) {
    setLoi("");
    if (tuBam) setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        hienCham(lat, lng, doiTamNhin && !chinhXacHon, ghimLuon ? 18 : 16);
        if (ghimLuon && !chinhXacHon) datGhim({ lat, lng });
      },
      (ma) => {
        setDangDinhVi(false);
        if (!tuBam && ma !== 1) return;
        setLoi(loiDinhVi(ma));
      },
      tuBam,
    );
  }

  // ĐƯA BẢN ĐỒ VỀ ĐỊA CHỈ ĐANG NHẬP — và TỰ GHIM luôn nếu tra ra tới tên đường.
  // Người đăng gõ "123 Nguyễn Văn Linh, Hoà Xuân, Đà Nẵng" là bản đồ nhảy tới đó
  // và cắm ghim sẵn; sai chỗ thì kéo ghim vài chục mét là xong, nhanh hơn hẳn bắt
  // họ tự dò từ đầu.
  async function veDiaChi(tuBam: boolean) {
    const map = mapRef.current;
    const diaChi = hintRef.current.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
    if (!map || diaChi.length < 4) return;

    setDangTimDiaChi(true);
    const kq = await timToaDo(diaChi);
    setDangTimDiaChi(false);
    if (!kq) return;

    const sat = kq.mucDo !== "khuVuc";
    map.setView([kq.lat, kq.lng], sat ? 17 : 15);
    // Tự ghim khi tra ra tới tên đường. Chỉ ra được tâm phường thì KHÔNG ghim —
    // ghim giữa phường là ghim sai, để người đăng tự bấm đúng chỗ.
    // Người đăng đã ghim rồi thì tuyệt đối không giật ghim của họ đi, trừ khi họ
    // chủ động bấm nút "Về địa chỉ đã nhập".
    if (sat && (!parseLatLng(value) || tuBam)) datGhim({ lat: kq.lat, lng: kq.lng });
  }

  // ── DỰNG BẢN ĐỒ MỘT LẦN ────────────────────────────────────────────────────
  useEffect(() => {
    let huy = false;
    (async () => {
      const L = (await import("leaflet")) as unknown as typeof LType;
      if (huy || !boxRef.current || mapRef.current) return;
      LRef.current = L;

      const daCo = parseLatLng(value);
      const map = L.map(boxRef.current).setView(
        daCo ? [daCo.lat, daCo.lng] : [16.054, 108.202],
        daCo ? 17 : 13,
      );
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

      // Chưa ghim mà đã gõ địa chỉ → tự tra và ghim luôn.
      if (!daCo) void veDiaChi(false);

      // LUÔN định vị khi mở bản đồ để có chấm xanh làm mốc. Đã ghim / đã gõ địa chỉ
      // thì chỉ vẽ chấm, không kéo bản đồ đi chỗ khác.
      const daNhapDiaChi = hintRef.current.split(",").some((s) => s.trim().length > 0);
      setTimeout(() => dinhVi(false, !daCo && !daNhapDiaChi, false), 400);
    })();

    return () => {
      huy = true;
      mapRef.current?.remove();
      mapRef.current = null;
      ghimRef.current = null;
      chamRef.current = null;
      vongRef.current = null;
      duongRef.current = null;
    };
    // Cố ý chạy một lần: value/hint đổi liên tục khi khách gõ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Người đăng vừa chọn khu vực / gõ tiếp địa chỉ → tra lại sau 800ms cho hết gõ.
  // Đã ghim rồi thì veDiaChi() giữ nguyên ghim, chỉ dời khung nhìn.
  useEffect(() => {
    if (!sanSang) return;
    const t = setTimeout(() => void veDiaChi(false), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint, sanSang]);

  function xoaGhim() {
    onChange("");
    ghimRef.current?.remove();
    ghimRef.current = null;
    duongRef.current?.remove();
    duongRef.current = null;
    setDiaChiGhim("");
    setKhoangCach("");
  }

  const nutPhu =
    "inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-45";

  return (
    <div className="space-y-2">
      {/* Nhãn tên đường nổi trên đầu ghim đỏ */}
      <style>{`.cl-nhan-ghim{background:#1d1d1f;color:#fff;border:none;border-radius:8px;padding:4px 9px;font-size:12px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.3);white-space:normal;max-width:220px}.cl-nhan-ghim::before{border-top-color:#1d1d1f}`}</style>

      {/* GHIM ĐỂ LÀM GÌ — phải nói NGAY TRƯỚC bản đồ. Người đăng bấm ra một dấu đỏ
          rồi ngồi nhìn, không biết dấu đỏ đó dùng vào việc gì, cũng không biết
          xong chưa. Câu này trả lời cả hai. */}
      <p className="text-[13px] leading-relaxed text-cvr-body">
        <span className="font-semibold text-cvr-ink">Ghim để làm gì:</span> ghim rồi thì tin của anh/chị
        đứng <span className="font-semibold text-cvr-ink">đúng chỗ</span> trên bản đồ tìm kiếm, và người mua
        bấm chỉ đường là tới đúng nơi. Không ghim thì tin chỉ hiện chung chung giữa phường/xã, người mua khó
        tìm hơn.
      </p>

      <div className="relative overflow-hidden rounded-xl border border-cvr-line">
        <div ref={boxRef} aria-label="Bản đồ ghim vị trí" className="h-[280px] w-full bg-cvr-surface" />

        {/* CÁCH GHIM PHẢI VIẾT NGAY TRÊN BẢN ĐỒ. Để hướng dẫn dưới khung thì trên
            điện thoại nó tụt xuống dưới màn hình, người đăng nhìn bản đồ không
            biết làm gì. z-index trên 700 vì Leaflet xếp marker 600 / popup 700. */}
        <span className="pointer-events-none absolute left-1/2 top-3 z-[1200] -translate-x-1/2 whitespace-nowrap rounded-full bg-cvr-ink/85 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          {daGhim ? "Kéo ghim đỏ để chỉnh lại cho đúng" : "Bấm lên bản đồ để ghim vị trí"}
        </span>
      </div>

      {/* ĐÃ GHIM VÀO ĐÂU — tra ngược ra địa chỉ cho người đăng kiểm lại. Đây là thứ
          bản trước thiếu: ghim xong chỉ thấy dấu đỏ, không biết đúng hay sai. */}
      {daGhim ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-green-800">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Đã ghim vị trí
            {khoangCach && <span className="font-normal text-green-700">· cách chỗ anh/chị {khoangCach}</span>}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-cvr-body">
            {diaChiGhim ? (
              <>
                Điểm ghim đang nằm ở: <span className="font-medium text-cvr-ink">{diaChiGhim}</span>
              </>
            ) : (
              "Đã lưu điểm ghim."
            )}
          </p>
          {/* XONG RỒI THÌ LÀM SAO — câu này phải có. Thiếu nó là người đăng ghim
              xong ngồi chờ, tưởng còn phải bấm lưu ở đâu đó. */}
          <p className="mt-1.5 text-[13px] leading-snug text-green-800">
            Đúng chỗ rồi thì <span className="font-semibold">không phải làm gì thêm</span> — cứ điền tiếp các
            mục dưới, vị trí này tự lưu cùng tin. Chưa đúng thì kéo ghim đỏ tới đúng nơi.
          </p>
        </div>
      ) : (
        <ul className="space-y-1 text-[13px] text-cvr-body">
          <li className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-white bg-cvr-blue shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
            Chấm xanh: bạn đang ở đây
          </li>
          <li>Gõ địa chỉ có tên đường ở trên là bản đồ tự ghim tới nơi</li>
          <li>Hoặc kéo bản đồ tới bất động sản rồi bấm để ghim</li>
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

        <button type="button" onClick={() => void veDiaChi(true)} disabled={dangTimDiaChi} className={nutPhu}>
          {dangTimDiaChi ? "Đang tìm…" : "Ghim theo địa chỉ đã nhập"}
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
      </div>

      {loi && (
        <NhacBatDinhVi
          loi={loi}
          onThuLai={() => dinhVi(true)}
          dangDinhVi={dangDinhVi}
          onDong={() => setLoi("")}
        />
      )}
    </div>
  );
}
