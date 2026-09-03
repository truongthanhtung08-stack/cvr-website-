"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { formatLatLng, parseLatLng, type LatLng } from "@/lib/googleMaps";
import { xemTrenBanDo } from "@/lib/moGoogleMaps";
import { docKhoangCach, khoangCachKm, layViTri, loiDinhVi } from "@/lib/dinhVi";
import { timToaDo, traDiaChi } from "@/lib/timToaDo";
import { centerOfArea } from "@/lib/geo";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";
import TimDiaDiem from "@/components/TimDiaDiem";

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
  // Chữ trong ô địa chỉ — ô này do CHÍNH khối bản đồ vẽ ra, nằm dính ngay trên
  // mặt bản đồ. Form chỉ giữ giá trị, không tự dựng ô riêng nữa.
  diaChi = "",
  onDiaChi,
  onDiaGioi,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  diaChi?: string;
  // GHIM XONG THÌ ĐIỀN LUÔN VÀO Ô ĐỊA CHỈ. Hai chiều thật sự: gõ địa chỉ thì bản
  // đồ trỏ tới, ghim lên bản đồ thì ô địa chỉ tự có số nhà + tên đường. Nơi gọi
  // không truyền thì chỉ hiện ra để đọc, không đụng vào ô nào.
  onDiaChi?: (v: string) => void;
  // Ghim xong thì trả về luôn TỈNH/THÀNH và PHƯỜNG/XÃ của điểm đó, để form tự
  // chọn đúng mục trong hai ô kia — người đăng khỏi phải tự dò lại.
  // Trả về cả Quận/Huyện vì web chạy song song hệ địa chỉ CŨ (3 cấp) và MỚI (2 cấp).
  onDiaGioi?: (v: { tinh: string; quan: string; phuong: string }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const ghimRef = useRef<LType.Marker | null>(null);
  const chamRef = useRef<LType.CircleMarker | null>(null);
  const vongRef = useRef<LType.CircleMarker | null>(null);
  const duongRef = useRef<LType.Polyline | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const onChangeRef = useRef(onChange);
  const onDiaChiRef = useRef(onDiaChi);
  const onDiaGioiRef = useRef(onDiaGioi);
  const hintRef = useRef(hint);
  // Phần KHU VỰC của hint (bỏ đoạn đầu là địa chỉ cụ thể) — ghép vào truy vấn gợi
  // ý để kết quả ra đúng tỉnh/phường đang chọn, không nhảy sang tỉnh khác.
  // Phần khu vực để lọc gợi ý — phải là STATE chứ không phải ref, vì nó được đọc
  // lúc vẽ (ref đọc lúc vẽ là sai luật của React).
  const khuVuc = hint.split(",").slice(1).map((x) => x.trim()).filter(Boolean).join(", ");
  const toiRef = useRef<[number, number] | null>(null);

  const [sanSang, setSanSang] = useState(false);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [dangTimDiaChi, setDangTimDiaChi] = useState(false);
  const [loi, setLoi] = useState("");
  const [khoangCach, setKhoangCach] = useState("");
  // Ghim đang ở mức nào — hiện thành một nhãn nhỏ để người đăng tự thấy địa chỉ
  // của mình đã đủ chính xác chưa. Đây là THÔNG TIN, không phải câu nhắc nhở.
  const [mucDoGhim, setMucDoGhim] = useState<"soNha" | "duong" | "khuVuc" | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
    onDiaChiRef.current = onDiaChi;
    onDiaGioiRef.current = onDiaGioi;
    hintRef.current = hint;
  });

  const daGhim = parseLatLng(value);

  // MỘT CHUỖI DUY NHẤT cho cả ba chỗ: ô khu vực phía trên → nhãn trên ghim đỏ →
  // dòng chữ dưới bản đồ. Dựng từ chính giá trị các ô của form (truyền vào qua
  // hint), nên không thể lệch nhau. Trước đây dòng dưới lấy nguyên câu thô của
  // dịch vụ bản đồ ("Chợ Đầu mối…, Tổ dân phố 49") nên đọc một đằng, ô chọn phía
  // trên một nẻo.
  const chuoiDiaChi = hint.split(",").map((s) => s.trim()).filter(Boolean).join(", ");

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
    // Tra ngược qua mạng, có khi mất một hai giây. Không báo gì thì người đăng
    // ghim xong thấy ô địa chỉ đứng im, tưởng hỏng.
    setDangTimDiaChi(true);
    const ten = await traDiaChi(p.lat, p.lng);
    setDangTimDiaChi(false);
    // ĐIỀN THẲNG VÀO Ô ĐỊA CHỈ — đây là chiều ngược của "gõ địa chỉ thì bản đồ trỏ
    // tới". Người đăng ghim đúng nhà mình là ô địa chỉ có sẵn số nhà + tên đường,
    // khỏi gõ. Gõ sai chính tả tên đường cũng được sửa luôn theo bản đồ.
    if (ten?.ngan) onDiaChiRef.current?.(ten.ngan);
    // Trả cả Tỉnh/Thành + Phường/Xã về cho form tự chọn đúng mục trong hai ô kia.
    if (ten && (ten.tinh || ten.phuong || ten.quan))
      onDiaGioiRef.current?.({ tinh: ten.tinh, quan: ten.quan, phuong: ten.phuong });
    setMucDoGhim(ten?.mucDo ?? null);
  }

  // Nhãn nổi trên đầu ghim đỏ luôn bám theo ĐÚNG chuỗi địa chỉ của form, cập nhật
  // mỗi khi các ô đổi — để nhìn lên bản đồ và nhìn xuống ô nhập là một.
  useEffect(() => {
    const m = ghimRef.current;
    if (!m) return;
    if (chuoiDiaChi) {
      m.bindTooltip(chuoiDiaChi, {
        permanent: true,
        direction: "top",
        offset: [0, -40],
        className: "cl-nhan-ghim",
      });
    } else m.unbindTooltip();
  }, [chuoiDiaChi, daGhim?.lat, daGhim?.lng]);

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

    // TRỎ TỚI NGAY, ĐỪNG BẮT NGƯỜI ĐĂNG CHỜ. Web có sẵn bảng tâm các khu vực lớn —
    // dùng nó nhảy tới liền trong tích tắc, rồi mới hỏi dịch vụ tra địa chỉ để chỉnh
    // cho sát. Chờ mạng trả lời xong mới nhúc nhích thì bản đồ trông như đơ.
    if (!parseLatLng(value)) {
      const kvNhanh = centerOfArea(diaChi);
      if (kvNhanh) map.setView(kvNhanh, 14);
    }

    setDangTimDiaChi(true);
    const kq = await timToaDo(diaChi);
    setDangTimDiaChi(false);
    if (!kq) return;

    const sat = kq.mucDo !== "khuVuc";
    const daCoGhim = !!parseLatLng(value);

    // ⚠️ ĐÃ GHIM RỒI THÌ TUYỆT ĐỐI KHÔNG DỜI BẢN ĐỒ.
    // Lỗi cũ: ghim xong → ô địa chỉ tự điền → chuỗi địa chỉ đổi → hàm này chạy lại
    // và KÉO BẢN ĐỒ đi chỗ khác, ghim đỏ trôi ra ngoài màn hình. Người đăng bấm
    // ghim mà nhìn không thấy dấu đỏ đâu, tưởng ghim hỏng.
    // Chỉ dời khi CHƯA ghim, hoặc khi người đăng tự chọn một gợi ý địa chỉ.
    if (!daCoGhim || tuBam) map.setView([kq.lat, kq.lng], sat ? 17 : 15);

    // Tự ghim khi tra ra tới tên đường. Chỉ ra được tâm phường thì KHÔNG ghim —
    // ghim giữa phường là ghim sai, để người đăng tự bấm đúng chỗ.
    if (sat && (!daCoGhim || tuBam)) datGhim({ lat: kq.lat, lng: kq.lng });
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
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
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
    const t = setTimeout(() => void veDiaChi(false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint, sanSang]);

  function xoaGhim() {
    onChange("");
    ghimRef.current?.remove();
    ghimRef.current = null;
    duongRef.current?.remove();
    duongRef.current = null;
    setKhoangCach("");
    setMucDoGhim(null);
  }

  const nutPhu =
    "inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-45";

  return (
    <div className="space-y-2">
      {/* Nhãn tên đường nổi trên đầu ghim đỏ */}
      <style>{`.cl-nhan-ghim{background:#1d1d1f;color:#fff;border:none;border-radius:8px;padding:4px 9px;font-size:12px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.3);white-space:normal;max-width:220px}.cl-nhan-ghim::before{border-top-color:#1d1d1f}`}</style>

      {/* Ô ĐỊA CHỈ NẰM NGAY TRONG KHUNG BẢN ĐỒ — dính liền, không cách nhau dòng
          nào. Người đăng gõ tới đâu nhìn bản đồ nhảy tới đó, đối chiếu tại chỗ;
          bấm ghim thì chữ trong ô này tự đổi theo. Tách hai thứ ra là mất cái đó.
          ⚠️ Đừng chèn tiêu đề hay lời nhắc nào vào giữa hai phần này. */}
      <div className="relative overflow-hidden rounded-xl border border-cvr-line">
        {/* Ô địa chỉ NỔI TRÊN MẶT BẢN ĐỒ (kiểu thanh tìm của các app bản đồ) chứ
            không chiếm thêm một hàng riêng. Nhờ vậy trên điện thoại vẫn đủ chỗ cho
            bản đồ CAO — kéo xem và ghim thoải mái — mà cả ô địa chỉ lẫn bản đồ vẫn
            nằm trọn trong một màn hình, khỏi kéo lên kéo xuống đối chiếu.
            z-index trên 700 vì Leaflet xếp marker 600 / popup 700. */}
        {/* THANH "ĐỊA CHỈ CỤ THỂ" — BẮT BUỘC, không được bỏ.
            ⚠️ Nằm SÁT NGAY TRÊN bản đồ, chung một khung, KHÔNG nổi đè lên mặt bản
            đồ nữa: đặt nổi thì lúc kéo/ghim nó che mất đúng chỗ đang cần nhìn.
            Gõ vài chữ là ra gợi ý tên đường để chọn — chọn xong bản đồ bay tới và
            ghim luôn. Bảng gợi ý là thứ DUY NHẤT được phép đè, và chỉ trong lúc gõ. */}
        {onDiaChi && (
          <div className="border-b border-cvr-line bg-white">
            <TimDiaDiem
              value={diaChi}
              onChange={onDiaChi}
              onChon={(kq) => {
                mapRef.current?.setView([kq.lat, kq.lng], 18);
                datGhim({ lat: kq.lat, lng: kq.lng });
              }}
              khuVuc={khuVuc}
              nhan="Địa chỉ cụ thể (số nhà, tên đường)"
              batBuoc
              placeholder="Gõ tên đường rồi chọn — hoặc bấm thẳng lên bản đồ"
              dangBan={dangTimDiaChi}
            />
          </div>
        )}
        {/* Cao theo màn hình để điện thoại nào cũng được một bản đồ đủ rộng mà vẫn
            còn chỗ cho ô khu vực bên trên và hàng nút bên dưới. */}
        <div ref={boxRef} aria-label="Bản đồ ghim vị trí" className="h-[46vh] min-h-[280px] w-full bg-cvr-surface sm:h-[360px]" />
        {/* Mạng chậm thì bản đồ mất vài giây mới hiện. Không báo gì, người đăng
            nhìn ô xám trống là tưởng hỏng rồi bỏ đi. */}
        {!sanSang && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-medium text-cvr-muted">
            Đang mở bản đồ…
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

      {daGhim && (
        <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] leading-snug text-cvr-body">
          <span className="inline-flex items-center gap-1 font-semibold text-green-700">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Đã ghim
          </span>
          {chuoiDiaChi && <span className="font-medium text-cvr-ink">{chuoiDiaChi}</span>}
          {khoangCach && <span className="text-cvr-muted">· cách chỗ anh/chị {khoangCach}</span>}
          {/* Ghim đang chính xác tới đâu. Thấy "mới tới phường/xã" là người đăng tự
              biết nên kéo ghim sát hơn — không cần ai nhắc câu nào. */}
          {mucDoGhim && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold ${
                mucDoGhim === "soNha"
                  ? "bg-green-100 text-green-800"
                  : mucDoGhim === "duong"
                    ? "bg-cvr-surface text-cvr-body"
                    : "bg-amber-100 text-amber-900"
              }`}
            >
              {mucDoGhim === "soNha"
                ? "đúng số nhà"
                : mucDoGhim === "duong"
                  ? "đúng tên đường"
                  : "mới tới phường/xã"}
            </span>
          )}
        </p>
      )}

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
