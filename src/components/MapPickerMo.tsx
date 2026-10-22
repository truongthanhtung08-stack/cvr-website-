"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import { napMapLibre, STYLE_MO, vietHoaNhan } from "@/lib/banDoMo";
import { formatLatLng, parseLatLng, type LatLng } from "@/lib/googleMaps";
import { centerOfArea } from "@/lib/geo";
import { traDiaChi, timToaDo, timToaDoTheoBuoc, cungTenDuong } from "@/lib/timToaDo";
import type { DiemTim } from "@/lib/diaChiHaiHe";
import { layViTri, loiDinhVi, laTrongApp } from "@/lib/dinhVi";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";
import { useKhoaCuon } from "@/lib/khoaCuon";

// ════════════════════════════════════════════════════════════════════════════
// GHIM VỊ TRÍ — NỀN MỞ (MapLibre + OpenFreeMap). Dùng ở form đăng tin của khách
// và form sửa tin trong admin.
//
// VÌ SAO ĐỔI NỀN (chủ dự án chốt 11/09/2026): Google cấm Maps API với tài khoản
// Việt Nam nên chỗ này phải lùi về khung Google NHÚNG, mà khung nhúng chỉ XEM
// được — bấm lên bản đồ không ghim được, kéo ghim cũng không. Ghim chỉ còn cách
// bấm GPS hoặc dán link, quá bất tiện cho người đăng tin. Nền mở này trả lại đủ
// chức năng. Trang chi tiết tin thì GIỮ GOOGLE (chỉ cần xem, nền chi tiết hơn).
//
// BA NGUYÊN TẮC GIỮ NGUYÊN TỪ BẢN CŨ — ĐỪNG THÊM THẮT GÌ NGOÀI BA CÁI NÀY:
//   1. CHỌN TỈNH / GÕ ĐỊA CHỈ  → bản đồ BAY TỚI NGAY, và CHỈ bay. Toạ độ tâm
//      tỉnh nằm sẵn trong src/lib/geo.ts, không cần mạng.
//   2. GHIM CHỈ SINH RA KHI KHÁCH TỰ TAY LÀM: bấm lên bản đồ, kéo ghim, hoặc
//      bấm "Tôi đang đứng ở đây". MÁY KHÔNG BAO GIỜ TỰ GHIM — bản cũ từng tự
//      ghim theo chuỗi địa chỉ nên gõ thêm một chữ là ghim nhảy đi chỗ khác.
//   3. ĐÃ CÓ GHIM THÌ GHIM LÀ CHỦ. Gõ lại địa chỉ, đổi tỉnh, đổi hệ địa chỉ đều
//      KHÔNG được dời ghim. Muốn dời thì khách tự bấm chỗ khác.
// ════════════════════════════════════════════════════════════════════════════

// Địa chỉ / tên địa điểm ghi trong link Google Maps: …/maps/place/<tên>/… hoặc ?q=<tên> (không phải toạ độ).
function tenTrongLink(url: string): string {
  const m = url.match(/\/maps\/place\/([^/?#]+)/) || url.match(/[?&]q=([^&#]+)/);
  if (!m) return "";
  try {
    const ten = decodeURIComponent(m[1].replace(/\+/g, " ")).trim();
    return parseLatLng(ten) ? "" : ten;
  } catch {
    return "";
  }
}

export default function MapPickerMo({
  value,
  onChange,
  hint = "",
  onDiaChi,
  onDiaGioi,
  tim,
  diemChon,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  onDiaChi?: (v: string) => void;
  onDiaGioi?: (v: { tinh: string; quan: string; phuong: string; chuoi?: string }) => void;
  // Dò theo từng bước Tỉnh → Phường/Xã → số nhà bằng tên hệ mới, có kiểm kết quả (diemTimBanDo).
  tim?: DiemTim;
  // Toạ độ gợi ý địa chỉ khách vừa CHỌN dưới thanh địa chỉ (ODiaChiGoiY); n đổi mỗi lần chọn.
  diemChon?: { lat: number; lng: number; n: number } | null;
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ghimRef = useRef<MlMarker | null>(null);
  const chamRef = useRef<MlMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const onDiaChiRef = useRef(onDiaChi);
  const onDiaGioiRef = useRef(onDiaGioi);
  const hintRef = useRef(hint);
  const timRef = useRef(tim);
  const khoaTim = tim ? JSON.stringify(tim) : "";
  const valueRef = useRef(value);
  // Chuỗi địa chỉ MÁY vừa tự điền. Ô đang giữ đúng chuỗi này nghĩa là khách chưa
  // đụng vào → đổi ghim thì máy được viết lại. Khách sửa rồi thì giữ nguyên.
  const mayDienRef = useRef("");
  // Tên đường bản đồ đọc được TẠI CHỖ GHIM (rỗng = bản đồ không có đường ở đó) — để biết khách sửa địa chỉ là ghi thêm số
  // nhà trên cùng con đường (giữ ghim) hay ghi sang đường khác (dời ghim).
  const duongGhimRef = useRef("");
  // Chữ bản đồ vừa điền vào thanh địa chỉ (khác chữ khách tự gõ).
  const chuMayDienRef = useRef("");
  // Ghim máy vừa tự đặt theo đường định vị nhanh — GPS chính xác về sau thì dời ghim tới đó, NẾU khách chưa tự dời.
  const ghimTuDongRef = useRef("");

  const [sanSang, setSanSang] = useState(false);
  // BẢN ĐỒ LỚN — tuỳ khách, không bắt buộc (chủ dự án 22/10/2026 tối): trong khung đã kéo, phóng, ghim được bằng một ngón;
  // bấm ⛶ thì bản đồ phủ kín màn hình cho ai muốn xem lớn, ✕ là thu về.
  const [toan, setToan] = useState(false);
  useKhoaCuon(toan, () => setToan(false)); // khoá cuộn + nút Quay lại điện thoại thu bản đồ (hàm chung)
  const [hong, setHong] = useState(false);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [dangTra, setDangTra] = useState(false);
  const [dangGiai, setDangGiai] = useState(false);
  const [loi, setLoi] = useState("");
  const [loiDan, setLoiDan] = useState("");
  // Bỏ ghim → bản đồ trỏ lại theo địa chỉ đang gõ (bảng trường hợp chủ dự án duyệt 22/10/2026)
  const [lanBoGhim, setLanBoGhim] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
    onDiaChiRef.current = onDiaChi;
    onDiaGioiRef.current = onDiaGioi;
    hintRef.current = hint;
    timRef.current = tim;
    valueRef.current = value;
  });

  const daGhim = parseLatLng(value);
  // Form xoá ghim (khách chọn lại Tỉnh/Phường = địa chỉ mới, 15/10/2026) → bỏ ghim cũ trên bản đồ.
  useEffect(() => {
    if (parseLatLng(value) || !ghimRef.current) return;
    ghimRef.current.remove();
    ghimRef.current = null;
    mayDienRef.current = "";
  }, [value]);
  // Ghim đến SAU KHI bản đồ đã dựng (bấm "Soạn tiếp" bản nháp, form nạp tin chậm) → vẽ lại đúng chỗ, KHÔNG đè địa chỉ khách
  // đã ghi (đo 23/10/2026: nút bỏ ghim hiện mà dấu ghim không có trên bản đồ).
  useEffect(() => {
    const p = parseLatLng(value);
    const map = mapRef.current;
    if (!sanSang || !map || !p || ghimRef.current) return;
    void datGhim(p, false);
    map.jumpTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16) });
    void traDiaChi(p.lat, p.lng).then((t) => { if (t && t.mucDo !== "khuVuc") duongGhimRef.current = t.ngan; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, sanSang]);

  // ── Ghim xong → tra ngược ra địa chỉ, trả về form ────────────────────────
  // GHIM CHỖ NÀO, THANH ĐỊA CHỈ HIỆN ĐÚNG CHỖ ĐÓ (chủ dự án 23/10/2026 — đổi bảng 22/10): số nhà, tên đường đọc tại điểm ghim
  // vào thanh "Địa chỉ cụ thể"; khách sửa chữ trong thanh thì ghim dời theo (hiệu ứng "KHÁCH SỬA ĐỊA CHỈ" bên dưới).
  async function traVeDiaChi(p: LatLng) {
    setDangTra(true);
    const ten = await traDiaChi(p.lat, p.lng);
    setDangTra(false);
    if (!ten) return;
    // Ba khối địa giới: luôn cập nhật, đó là sự thật suy từ toạ độ.
    if (ten.tinh || ten.quan || ten.phuong)
      onDiaGioiRef.current?.({ tinh: ten.tinh, quan: ten.quan, phuong: ten.phuong, chuoi: ten.chuoi });
    duongGhimRef.current = ten.mucDo === "khuVuc" ? "" : ten.ngan;
    // BẢN ĐỒ THIẾU DỮ LIỆU TẠI CHỖ GHIM (chủ dự án 23/10/2026: "ghim chính xác 100% mà dữ liệu bản đồ không có thì sao"):
    // ghim vẫn đứng đúng chỗ khách ghim, thanh địa chỉ điền chỗ gần đúng nhất bản đồ biết (số nhà → tên đường → công trình →
    // thôn/khu phố). Khách ĐÃ GHI địa chỉ thì không để bản đồ đè bằng thứ kém hơn: bản đồ chỉ biết tới thôn/khu → giữ chữ
    // khách; bản đồ biết đường mà chưa có số nhà, khách đã ghi số trên CÙNG con đường đó → giữ số nhà của khách.
    // Chữ đang có mà do chính bản đồ điền ở lần ghim trước thì không phải chữ khách — ghim chỗ khác là thay (hoặc xoá nếu chỗ
    // mới bản đồ không biết gì), không giữ địa chỉ của chỗ cũ.
    const dangGhi = (hintRef.current.split(",")[0] ?? "").trim();
    const cuaKhach = !!dangGhi && dangGhi !== chuMayDienRef.current;
    const giuChuKhach = cuaKhach && (ten.mucDo === "khuVuc" || (ten.mucDo === "duong" && cungTenDuong(dangGhi, ten.ngan)));
    const chuMoi = giuChuKhach ? dangGhi : ten.ngan;
    if (chuMoi !== dangGhi) {
      mayDienRef.current = chuMoi; // ghi TRƯỚC khi đổi chữ → hiệu ứng dời ghim biết đây là máy điền, không dò ngược lại
      chuMayDienRef.current = chuMoi;
      onDiaChiRef.current?.(chuMoi);
    }
  }

  // ── Đặt ghim — CHỈ gọi từ thao tác tay của khách ─────────────────────────
  // dien = false: hiện lại ghim đã lưu (sửa tin) — KHÔNG đè địa chỉ khách đã ghi.
  async function datGhim(p: LatLng, dien = true) {
    const map = mapRef.current;
    if (!map) return;
    // Lúc ghim, chữ đang có trong thanh địa chỉ coi như đã khớp — không để hiệu ứng "khách sửa địa chỉ" kéo ghim về chữ cũ.
    mayDienRef.current = (hintRef.current.split(",")[0] ?? "").trim();

    if (ghimRef.current) ghimRef.current.setLngLat([p.lng, p.lat]);
    else {
      const ml = await napMapLibre();
      if (!mapRef.current) return;
      const m = new ml.Marker({ draggable: true, color: "#e11d48" }).setLngLat([p.lng, p.lat]).addTo(map);
      m.on("dragend", () => {
        mayDienRef.current = (hintRef.current.split(",")[0] ?? "").trim();
        const q = m.getLngLat();
        const moi = { lat: q.lat, lng: q.lng };
        onChangeRef.current(formatLatLng(moi));
        void traVeDiaChi(moi);
      });
      ghimRef.current = m;
    }
    onChangeRef.current(formatLatLng(p));
    if (dien) void traVeDiaChi(p);
  }

  // ── Chấm xanh "vị trí của bạn" — chỉ tham chiếu, KHÔNG phải ghim ─────────
  async function veCham(p: LatLng, bayToi: boolean) {
    const map = mapRef.current;
    if (!map) return;
    if (bayToi) map.easeTo({ center: [p.lng, p.lat], zoom: 17, duration: 500 });

    if (chamRef.current) chamRef.current.setLngLat([p.lng, p.lat]);
    else {
      const ml = await napMapLibre();
      if (!mapRef.current) return;
      const el = document.createElement("div");
      el.title = "Vị trí của bạn";
      el.className = "h-3.5 w-3.5 rounded-full bg-cvr-blue shadow ring-[3px] ring-white";
      chamRef.current = new ml.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
    }
  }

  // MỞ BẰNG GOOGLE MAPS (chủ dự án 22/10/2026: web không gắn được bộ Google Maps nên dùng bản đồ này — "phải có nút mở
  // bằng Google Maps"). Đã ghim → mở đúng điểm ghim; chưa ghim → mở đúng vùng đang xem. Điện thoại tự mở ứng dụng Google
  // Maps; khách tìm chính xác bên đó, Chia sẻ → chép link → dán vào ô "dán link Google Maps" dưới bản đồ.
  function moGoogleMaps() {
    const p = parseLatLng(valueRef.current);
    const map = mapRef.current;
    const c = map?.getCenter();
    const url = p
      ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
      : c
        ? `https://www.google.com/maps/@?api=1&map_action=map&center=${c.lat},${c.lng}&zoom=${Math.max(5, Math.round(map?.getZoom() ?? 12))}`
        : "https://www.google.com/maps";
    // LỐI VỀ: Android mở thẳng ứng dụng bản đồ bằng geo: — bấm Quay lại của máy là về đúng form đang soạn (mở tab mới
    // thì quay lại dễ rơi vào tab trống). iPhone / máy tính: tab mới — iPhone có "◀ Safari" và nút lùi đóng tab về form.
    // TRONG ZALO / FACEBOOK…: trình duyệt trong app KHÔNG mở được đường dẫn "geo:" (chủ dự án 23/10/2026: bấm Google Maps báo
    // không xem được) và thường chặn tab mới → mở link Google Maps ngay tại chỗ; bấm Quay lại của máy là về form.
    if (laTrongApp()) {
      location.href = url;
      return;
    }
    if (/Android/.test(navigator.userAgent)) {
      const q = p ?? (c ? { lat: c.lat, lng: c.lng } : null);
      if (q) {
        location.href = p ? `geo:${q.lat},${q.lng}?q=${q.lat},${q.lng}` : `geo:${q.lat},${q.lng}?z=${Math.round(map?.getZoom() ?? 12)}`;
        return;
      }
    }
    window.open(url, "_blank", "noopener");
  }

  function dinhVi(ghimLuon: boolean) {
    setLoi("");
    setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        const p = { lat, lng };
        void veCham(p, !chinhXacHon);
        if (ghimLuon && !chinhXacHon) { ghimTuDongRef.current = formatLatLng(p); void datGhim(p); }
        else if (ghimLuon && chinhXacHon && ghimRef.current) {
          const q = ghimRef.current.getLngLat();
          if (formatLatLng({ lat: q.lat, lng: q.lng }) === ghimTuDongRef.current) {
            ghimTuDongRef.current = formatLatLng(p);
            void datGhim(p);
          }
        }
      },
      (ma) => {
        setDangDinhVi(false);
        setLoi(loiDinhVi(ma));
      },
      true,
    );
  }

  // Máy tính: bản đồ lớn tắt "Ctrl + lăn chuột mới phóng to", thu về thì bật lại. Điện thoại: không bao giờ bật (xem lúc tạo bản đồ).
  // LỐI THOÁT (chủ dự án 22/10/2026: "mở ra thì phải tính cách thoát lại"): nút Xong · nút thu nhỏ · Esc (máy tính) ·
  // NÚT QUAY LẠI CỦA ĐIỆN THOẠI = thu bản đồ, KHÔNG rời trang đăng tin (useKhoaCuon ở trên — hàm chung mọi bảng nổi).
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      if (toan || matchMedia("(pointer: coarse)").matches) map.cooperativeGestures.disable();
      else map.cooperativeGestures.enable();
      requestAnimationFrame(() => map.resize());
    }
    if (!toan) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setToan(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [toan]);

  // ── Dựng bản đồ một lần ──────────────────────────────────────────────────
  useEffect(() => {
    let huy = false;
    void (async () => {
      try {
        const ml = await napMapLibre();
        if (huy || !boxRef.current) return;

        const saved = parseLatLng(valueRef.current);
        const kv = centerOfArea(hintRef.current);
        const tam: LatLng = saved ?? (kv ? { lat: kv[0], lng: kv[1] } : { lat: 16.054, lng: 108.202 });

        const map = new ml.Map({
          container: boxRef.current,
          style: STYLE_MO,
          center: [tam.lng, tam.lat],
          zoom: saved ? 17 : kv ? 12 : 5,
          // ĐIỆN THOẠI: KÉO, PHÓNG TO NHỎ, GHIM NGAY TRONG KHUNG BẰNG MỘT NGÓN — không bắt mở bản đồ lớn (chủ dự án 22/10/2026
          // tối: "khách không muốn xem full thì sao ép khách bấm full — muốn phóng to nhỏ, ghim, làm gì tuỳ ý từ khung bản đồ").
          // Cuộn trang: vuốt ngoài khung bản đồ. ⛶ vẫn còn cho ai muốn xem lớn.
          // MÁY TÍNH: kéo chuột, bấm ghim, nút +/− như thường; Ctrl/⌘ + lăn chuột mới phóng to, lăn thường là cuộn trang.
          cooperativeGestures: !matchMedia("(pointer: coarse)").matches,
          locale: {
            "CooperativeGesturesHandler.WindowsHelpText": "Sử dụng Ctrl + cuộn để thu phóng bản đồ",
            "CooperativeGesturesHandler.MacHelpText": "Sử dụng ⌘ + cuộn để thu phóng bản đồ",
          },
          // Dòng ghi nguồn bản đồ thu thành nút (i) — mở rộng sẵn thì che cả đáy bản đồ trên điện thoại.
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        // Điện thoại KHÔNG có +/− (chủ dự án 22/10/2026: "trên mobile chỉ cần nút full, off full, nút Location — hết";
        // phóng to bằng chụm hai ngón hoặc mở bản đồ lớn). Máy tính giữ +/− (không chụm được).
        if (window.matchMedia("(min-width: 640px)").matches) map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

        // Bấm vào đâu là ghim vào đó — thao tác chính, ai cũng đoán được.
        // Chạm ghim lúc đang nhìn xa (cả nước, cả tỉnh) → phóng sát vào ghim để khách thấy rõ, kéo ghim cho đúng nhà (23/10/2026).
        map.on("click", (e) => {
          void datGhim({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          if (map.getZoom() < 15) map.easeTo({ center: e.lngLat, zoom: 16, duration: 500 });
        });

        map.on("load", () => {
          if (huy) return;
          // Dòng ghi nguồn bản đồ: MapLibre mở sẵn lúc đầu, che đáy bản đồ → thu ngay thành nút (i).
          boxRef.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
          vietHoaNhan(map);
          setSanSang(true);
          // Ghim đã lưu (sửa tin) → hiệu ứng "ghim đến sau khi bản đồ đã dựng" ở trên vẽ lại, không đè địa chỉ.
        });
      } catch {
        if (!huy) setHong(true);
      }
    })();
    return () => {
      huy = true;
      mapRef.current?.remove();
      mapRef.current = null;
      ghimRef.current = null;
      chamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Khách chọn tỉnh / gõ địa chỉ → BAY TỚI, và CHỈ BAY ───────────────────
  // ⚠️ TUYỆT ĐỐI KHÔNG đụng vào ghim ở đây — xem nguyên tắc 2 và 3.
  //
  // TRỎ ĐÚNG TỚI ĐÂU HAY TỚI ĐÓ: trước đây chỗ này chỉ tra bảng khu vực có sẵn
  // trong web (centerOfArea) — bảng đó chỉ biết vài chục nơi và chỉ tới cấp
  // phường, nên gõ đủ số nhà tên đường thì bản đồ vẫn đứng giữa phường, người
  // đăng phải tự kéo đi tìm. Nay hỏi thẳng bản đồ (timToaDo, tự lùi dần số nhà →
  // đường → phường → tỉnh cho tới khi nhận ra), lấy bảng làm đường lui khi mạng
  // hỏng. Ra tới số nhà thì phóng sát để ghim chỉ còn là một cú bấm.
  useEffect(() => {
    if (!sanSang) return;
    const map = mapRef.current;
    if (!map || ghimRef.current || !hint.trim()) return;
    let huy = false;
    const t = setTimeout(async () => {
      const diem = timRef.current ? await timToaDoTheoBuoc(timRef.current) : await timToaDo(hint);
      if (huy || !mapRef.current || ghimRef.current) return;
      const kv = diem ? ([diem.lat, diem.lng] as [number, number]) : centerOfArea(hint);
      if (!kv) return;
      mapRef.current.easeTo({
        center: [kv[1], kv[0]],
        // Mỗi cấp một tầm nhìn (chủ dự án 22/10/2026: "trỏ vào tỉnh thành — bản đồ trỏ đến từng cấp bậc"):
        // số nhà 17 · đường 16 · phường/xã 14 · tỉnh/thành 10 (thấy trọn tỉnh, trước là 12 — chỉ thấy một góc).
        zoom: diem?.mucDo === "ghim" ? 17 : diem?.mucDo === "duong" ? 16 : hint.split(",").filter((s) => s.trim()).length >= 2 ? 14 : 10,
        duration: 600,
      });
    }, 500);
    return () => {
      huy = true;
      clearTimeout(t);
    };
  }, [hint, khoaTim, sanSang, lanBoGhim]);

  // ── KHÁCH SỬA ĐỊA CHỈ KHI ĐÃ GHIM → GHIM DỜI TỚI ĐÚNG CHỖ KHÁCH GHI (chủ dự án 23/10/2026: "khách có quyền sửa — sửa thì
  //    ghim chuyển đúng chỗ khách ghi, chính xác nhất"). Ngừng gõ ~1 giây thì dò; ra tới tên đường / số nhà mới dời, chỉ ra
  //    phường thì GIỮ ghim (ghim giữa phường là sai chỗ). Không đổi chữ của khách.
  useEffect(() => {
    if (!sanSang || !ghimRef.current) return;
    const soNha = (hint.split(",")[0] ?? "").trim();
    if (!soNha || soNha === mayDienRef.current) return;
    let huy = false;
    const t = setTimeout(async () => {
      const diem = timRef.current ? await timToaDoTheoBuoc(timRef.current) : await timToaDo(hint);
      if (huy || !mapRef.current || !ghimRef.current) return;
      mayDienRef.current = soNha;
      if (!diem || diem.mucDo === "khuVuc") return;
      // Bản đồ chỉ biết tới con đường (chưa có số nhà) mà ghim khách đang nằm trên chính con đường đó → GIỮ ghim: chỗ khách
      // ghim đúng hơn điểm giữa đoạn đường. Bản đồ không có đường nào tại chỗ ghim mà đường khách ghi ở cùng khu (< 1 km)
      // → cũng giữ. Chỉ dời khi bản đồ có đúng số nhà, hoặc khách ghi sang đường khác.
      if (diem.mucDo === "duong") {
        const cu = ghimRef.current.getLngLat();
        const xa = Math.hypot((diem.lat - cu.lat) * 111_000, (diem.lng - cu.lng) * 111_000 * Math.cos((cu.lat * Math.PI) / 180));
        if (cungTenDuong(soNha, duongGhimRef.current) || (!duongGhimRef.current && xa < 1000)) return;
      }
      ghimRef.current.setLngLat([diem.lng, diem.lat]);
      duongGhimRef.current = soNha; // ghim giờ nằm trên đường khách vừa ghi
      onChangeRef.current(formatLatLng({ lat: diem.lat, lng: diem.lng }));
      mapRef.current.easeTo({ center: [diem.lng, diem.lat], zoom: 17, duration: 500 });
    }, 1000);
    return () => {
      huy = true;
      clearTimeout(t);
    };
  }, [hint, khoaTim, sanSang]);

  // CHỌN GỢI Ý ĐỊA CHỈ = CHỌN VỊ TRÍ (chủ dự án 22/10/2026 tối: "theo chức năng bản đồ, theo logic chọn vị trí — làm gợi ý
  // khi khách gõ địa chỉ"): khách tự tay chọn một gợi ý → bản đồ tới đúng điểm đó và ghim, như dán link Google Maps. Gõ chữ
  // thôi thì vẫn chỉ bay, không ghim. Chưa đúng nhà thì khách kéo ghim / chạm chỗ khác.
  useEffect(() => {
    const map = mapRef.current;
    if (!diemChon || !sanSang || !map) return;
    const p = { lat: diemChon.lat, lng: diemChon.lng };
    void datGhim(p);
    map.easeTo({ center: [p.lng, p.lat], zoom: 17, duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diemChon?.n, sanSang]);

  function xoaGhim() {
    onChange("");
    ghimRef.current?.remove();
    ghimRef.current = null;
    mayDienRef.current = "";
    setLanBoGhim((n) => n + 1);
  }

  // Nhận thứ người dùng dán: toạ độ thẳng "16.06,108.22", link dài của Google
  // (có @lat,lng), hoặc link RÚT GỌN maps.app.goo.gl — loại này không chứa toạ độ
  // nên phải nhờ máy chủ mở ra xem nó dẫn tới đâu.
  async function nhanChuoiDan(txt: string): Promise<boolean> {
    const t = txt.trim();
    if (!t) return false;
    const ngay = parseLatLng(t);
    // Chỉ nhận điểm trong Việt Nam (gồm Hoàng Sa, Trường Sa) — ngoài khung đó là gõ nhầm / chép nhầm.
    if (ngay && ngay.lat >= 6 && ngay.lat <= 24 && ngay.lng >= 102 && ngay.lng <= 118) {
      await datGhim(ngay);
      mapRef.current?.easeTo({ center: [ngay.lng, ngay.lat], zoom: 17, duration: 500 });
      return true;
    }
    // Chép từ ứng dụng Google Maps thường kèm tên địa điểm trước link → lấy link nằm trong chuỗi.
    const link = t.match(/https?:\/\/\S+/)?.[0];
    if (!link) return false;
    setDangGiai(true);
    try {
      const r = await fetch("/api/dia-chi?viec=mo-rong&q=" + encodeURIComponent(link));
      const d = (await r.json()) as { url?: string };
      const url = d.url ?? link;
      let p = parseLatLng(url);
      let sat = true;
      // LINK CHIA SẺ TỪ ĐIỆN THOẠI (maps.app.goo.gl/…?g_st=…) mở ra trang địa điểm KHÔNG kèm toạ độ (chủ dự án dán thử
      // 22/10/2026 không được): lấy địa chỉ / tên địa điểm ghi trong link, tìm trên bản đồ rồi ghim — thường tới đúng
      // đường; nhãn "Đã ghim · đúng …" nói rõ mức, khách kéo ghim cho đúng nhà.
      if (!p) {
        const ten = tenTrongLink(url);
        const k = ten ? await timToaDo(ten) : null;
        if (k) { p = { lat: k.lat, lng: k.lng }; sat = k.mucDo === "ghim"; }
      }
      if (p) {
        await datGhim(p);
        mapRef.current?.easeTo({ center: [p.lng, p.lat], zoom: sat ? 17 : 16, duration: 500 });
        return true;
      }
    } catch {
      /* mạng hỏng — để người dùng thử lại */
    } finally {
      setDangGiai(false);
    }
    return false;
  }


  return (
    <div className="space-y-3">
      <div className={toan ? "fixed inset-0 z-[80] bg-white" : "relative overflow-hidden rounded-xl border border-cvr-line"}>
        <div ref={boxRef} aria-label="Bản đồ ghim vị trí" className={`w-full bg-cvr-surface ${toan ? "h-full" : "h-[240px] sm:h-[360px]"}`} />
        {!sanSang && !hong && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-medium text-cvr-muted">
            Đang mở bản đồ…
          </span>
        )}
        {hong && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] font-medium text-cvr-muted">
            Chưa mở được bản đồ.
          </span>
        )}
        {sanSang && dangTra && (
          <span className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-cvr-ink/85 px-3 py-1.5 text-[12px] font-semibold text-white">
            Đang tìm địa chỉ…
          </span>
        )}
        {/* CẤU TRÚC THAY CHÚ THÍCH (chủ dự án 22/10/2026): nút định vị + nút phóng to nằm NGAY TRÊN bản đồ góc phải (máy tính: dưới nút +/−; kiểu Google
            Maps — ai cũng hiểu); kết quả ghim là nhãn nhỏ góc trên trái bản đồ. Bỏ ghim nằm ở dòng điểm ghim (dưới thanh địa
            chỉ; bản đồ lớn: thẻ dưới đáy) — không hai nút cùng việc. */}
        <button
          type="button"
          aria-label="Tôi đang đứng ở đây"
          title="Tôi đang đứng ở đây"
          onClick={() => dinhVi(true)}
          disabled={dangDinhVi}
          className={`absolute right-[10px] ${toan ? "top-[calc(60px+env(safe-area-inset-top))]" : "top-[10px]"} z-10 flex h-[29px] w-[29px] sm:top-[78px] items-center justify-center rounded-[4px] bg-white text-cvr-blue shadow-[0_0_0_2px_rgba(0,0,0,0.1)] disabled:opacity-60`}
        >
          {dangDinhVi ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cvr-blue border-t-transparent" />
          ) : (
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
        {/* ⛶ MỞ BẢN ĐỒ LỚN — tuỳ khách. Trong bản đồ lớn nút này thành ✕ ĐÓNG ở góc trên phải; đóng là về đúng chỗ đang xem
            trong form (chủ dự án 22/10/2026 tối: "muốn bật full thì bấm, xem đã thèm, ghim, kéo thả, vuốt, xoá ghim; tắt thì X
            về lại vị trí cũ"). Nút Quay lại điện thoại, Esc máy tính cũng đóng (useKhoaCuon). */}
        <button
          type="button"
          aria-label={toan ? "Đóng bản đồ lớn" : "Phóng to bản đồ"}
          title={toan ? "Đóng bản đồ lớn" : "Phóng to bản đồ"}
          onClick={() => setToan(!toan)}
          className={toan
            ? "absolute right-[10px] top-[calc(10px+env(safe-area-inset-top))] z-10 flex h-10 w-10 sm:top-[115px] items-center justify-center rounded-full bg-white text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
            : "absolute right-[10px] top-[47px] z-10 flex h-[29px] w-[29px] sm:top-[115px] items-center justify-center rounded-[4px] bg-white text-cvr-ink shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"}
        >
          {toan ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          )}
        </button>
        {/* Đáy bản đồ: nút Google Maps; bản đồ lớn thêm thẻ điểm ghim ngay dưới (Dùng địa chỉ này · Bỏ ghim) */}
        <div className={toan ? "absolute inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-10 flex flex-col items-start gap-2" : "absolute bottom-2 left-2 z-10"}>
          <button
            type="button"
            onClick={moGoogleMaps}
            className="flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-2 pr-3 text-[12.5px] font-semibold text-cvr-ink shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
          >
            <svg className="h-4 w-4 text-[#ea4335]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
            </svg>
            Google Maps
          </button>
        </div>
        {/* BỎ GHIM = MỘT BIỂU TƯỢNG (chủ dự án 23/10/2026: "không cần câu dài dòng, chỉ bằng một biểu tượng hoặc dấu X"):
            📍✕ ở góc trên bên trái bản đồ, chỉ hiện khi đã ghim. */}
        {daGhim && (
          <button
            type="button"
            aria-label="Bỏ ghim"
            title="Bỏ ghim"
            onClick={xoaGhim}
            className="absolute left-2 top-2 z-10 flex h-9 items-center gap-0.5 rounded-full bg-white/95 pl-2 pr-2.5 text-cvr-ink shadow transition active:scale-95"
          >
            <svg className="h-4 w-4 text-[#e11d48]" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Dưới bản đồ chỉ còn: ô dán link Google Maps (người ở xa BĐS) + dòng địa chỉ tại điểm ghim (người đăng tự quyết
          có lấy hay không — số nhà là quyền của khách). */}
      <div>
        <input
          type="text"
          inputMode="text"
          defaultValue=""
          placeholder="Hoặc dán link Google Maps / toạ độ"
          // BÁO LỖI THEO CHUẨN (chủ dự án 22/10/2026: "lấy nguyên tắc chuẩn"): không báo khi khách đang gõ dở — chỉ báo sau
          // khi dán hỏng hoặc khi rời ô mà chuỗi vẫn chưa đọc được.
          onChange={async (e) => {
            const o = e.target;
            setLoiDan("");
            // Gõ tay toạ độ: chờ đủ số (≥ 4 số lẻ mỗi vế) hoặc bấm Enter — trước đây gõ tới "16.0612, 1" là ghim luôn sang
            // kinh độ 1 (đo 23/10/2026). Dán link / dán toạ độ đủ thì nhận ngay như cũ.
            if (!/https?:\/\/|\d\.\d{4,}\s*,\s*-?\d+\.\d{4,}/.test(o.value)) return;
            const xong = await nhanChuoiDan(o.value);
            if (xong) o.value = "";
            else if (o.value.trim() && document.activeElement !== o)
              setLoiDan("Chưa đọc được vị trí từ link này.");
          }}
          onKeyDown={async (e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const o = e.currentTarget;
            const xong = await nhanChuoiDan(o.value);
            if (xong) o.value = "";
            else if (o.value.trim()) setLoiDan("Chưa đọc được vị trí từ link này.");
          }}
          onBlur={(e) => {
            if (e.target.value.trim() && !dangGiai)
              setLoiDan("Chưa đọc được vị trí từ link này.");
          }}
          onPaste={async (e) => {
            const txt = e.clipboardData.getData("text");
            e.preventDefault();
            const xong = await nhanChuoiDan(txt);
            setLoiDan(xong ? "" : "Chưa đọc được vị trí từ link này.");
          }}
          className="h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint caret-cvr-blue outline-none transition focus:border-cvr-blue focus:ring-1 focus:ring-cvr-blue"
        />
        {dangGiai && <p className="mt-2 text-[12px] font-medium text-cvr-blue-ink">Đang đọc vị trí từ link…</p>}
        {loiDan && <p className="mt-2 text-[12px] font-medium text-red-600">{loiDan}</p>}
      </div>


      {loi && (
        <NhacBatDinhVi loi={loi} onThuLai={() => dinhVi(true)} dangDinhVi={dangDinhVi} onDong={() => setLoi("")} />
      )}
    </div>
  );
}
