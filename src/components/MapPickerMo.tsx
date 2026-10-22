"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import { napMapLibre, STYLE_MO, vietHoaNhan } from "@/lib/banDoMo";
import { formatLatLng, parseLatLng, type LatLng } from "@/lib/googleMaps";
import { centerOfArea } from "@/lib/geo";
import { traDiaChi, timToaDo, timToaDoTheoBuoc } from "@/lib/timToaDo";
import type { DiemTim } from "@/lib/diaChiHaiHe";
import { layViTri, loiDinhVi } from "@/lib/dinhVi";
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

export default function MapPickerMo({
  value,
  onChange,
  hint = "",
  onDiaChi,
  onDiaGioi,
  tim,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  onDiaChi?: (v: string) => void;
  onDiaGioi?: (v: { tinh: string; quan: string; phuong: string }) => void;
  // Dò theo từng bước Tỉnh → Phường/Xã → số nhà bằng tên hệ mới, có kiểm kết quả (diemTimBanDo).
  tim?: DiemTim;
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
  const ghiDeRef = useRef(false);
  // Ghim máy vừa tự đặt theo đường định vị nhanh — GPS chính xác về sau thì dời ghim tới đó, NẾU khách chưa tự dời.
  const ghimTuDongRef = useRef("");

  const [sanSang, setSanSang] = useState(false);
  // BẢN ĐỒ LỚN (chủ dự án 22/10/2026: "kéo bằng hai ngón rất mệt — dung hoà cả hai"): trong form một ngón là cuộn trang
  // (không vướng); bấm ⛶ thì bản đồ phủ kín màn hình, kéo bằng MỘT ngón, chạm để ghim, "Xong" là thu về.
  const [toan, setToan] = useState(false);
  useKhoaCuon(toan);
  const [hong, setHong] = useState(false);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [dangTra, setDangTra] = useState(false);
  const [dangGiai, setDangGiai] = useState(false);
  const [loi, setLoi] = useState("");
  const [loiDan, setLoiDan] = useState("");
  const [mucDo, setMucDo] = useState<"soNha" | "duong" | "khuVuc" | null>(null);
  // Địa chỉ đọc được NGAY TẠI ĐIỂM GHIM — luôn hiện cho người đăng thấy, kể cả
  // khi web không tự điền vào ô (vì ô đang có chữ của họ). Thấy rồi thì tự so:
  // trùng là yên tâm, lệch thì bấm một nút là lấy, hoặc kéo ghim cho khớp.
  const [diaChiGhim, setDiaChiGhim] = useState("");
  // Phần số nhà / tên đường của điểm ghim — đúng thứ sẽ đặt vào ô "Địa chỉ cụ thể"
  // nếu người đăng bấm nút sửa. Tách riêng để không nhét cả tên phường, tỉnh vào ô đó.
  const [soNhaGhim, setSoNhaGhim] = useState("");

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMucDo(null); setDiaChiGhim(""); setSoNhaGhim("");
  }, [value]);

  // ── Ghim xong → tra ngược ra địa chỉ, trả về form ────────────────────────
  async function traVeDiaChi(p: LatLng) {
    setDangTra(true);
    const ten = await traDiaChi(p.lat, p.lng);
    setDangTra(false);
    setMucDo(ten?.mucDo ?? null);
    if (!ten) {
      setDiaChiGhim("");
      setSoNhaGhim("");
      return;
    }
    setDiaChiGhim([ten.ngan, ten.phuong, ten.quan, ten.tinh].filter(Boolean).join(", "));
    setSoNhaGhim(ten.ngan ?? "");

    // Ba khối địa giới: luôn cập nhật, đó là sự thật suy từ toạ độ.
    if (ten.tinh || ten.quan || ten.phuong)
      onDiaGioiRef.current?.({ tinh: ten.tinh, quan: ten.quan, phuong: ten.phuong });

    // Số nhà / tên đường: quyền của khách. Chỉ viết khi ô trống hoặc đang giữ
    // đúng chữ máy điền lần trước.
    const oHienTai = (hintRef.current.split(",")[0] ?? "").trim();
    // Khách tự bấm "Tôi đang đứng ở đây" = VỊ TRÍ MỚI → số nhà, tên đường lấy theo GPS, không giữ
    // địa chỉ cũ (chủ dự án 15/10/2026).
    const ghiDe = ghiDeRef.current;
    ghiDeRef.current = false;
    if (ten.ngan && (ghiDe || !oHienTai || oHienTai === mayDienRef.current)) {
      onDiaChiRef.current?.(ten.ngan);
      mayDienRef.current = ten.ngan;
    }
  }

  // ── Đặt ghim — CHỈ gọi từ thao tác tay của khách ─────────────────────────
  async function datGhim(p: LatLng) {
    const map = mapRef.current;
    if (!map) return;

    if (ghimRef.current) ghimRef.current.setLngLat([p.lng, p.lat]);
    else {
      const ml = await napMapLibre();
      if (!mapRef.current) return;
      const m = new ml.Marker({ draggable: true, color: "#e11d48" }).setLngLat([p.lng, p.lat]).addTo(map);
      m.on("dragend", () => {
        const q = m.getLngLat();
        const moi = { lat: q.lat, lng: q.lng };
        onChangeRef.current(formatLatLng(moi));
        void traVeDiaChi(moi);
      });
      ghimRef.current = m;
    }
    onChangeRef.current(formatLatLng(p));
    void traVeDiaChi(p);
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
        if (ghimLuon && !chinhXacHon) { ghimTuDongRef.current = formatLatLng(p); ghiDeRef.current = true; void datGhim(p); }
        else if (ghimLuon && chinhXacHon && ghimRef.current) {
          const q = ghimRef.current.getLngLat();
          if (formatLatLng({ lat: q.lat, lng: q.lng }) === ghimTuDongRef.current) {
            ghimTuDongRef.current = formatLatLng(p);
            ghiDeRef.current = true;
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

  // Bản đồ lớn: tắt chế độ "một ngón là cuộn trang" để kéo bằng một ngón; thu về thì bật lại.
  // LỐI THOÁT (chủ dự án 22/10/2026: "mở ra thì phải tính cách thoát lại"): nút Xong · nút thu nhỏ · Esc (máy tính) ·
  // NÚT QUAY LẠI CỦA ĐIỆN THOẠI = thu bản đồ, KHÔNG rời trang đăng tin (cùng cách bộ xem ảnh GallerySlideVideo).
  const coBuocRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      if (toan) map.cooperativeGestures.disable();
      else map.cooperativeGestures.enable();
      requestAnimationFrame(() => map.resize());
    }
    if (!toan) {
      if (coBuocRef.current) {
        coBuocRef.current = false;
        history.back();
      }
      return;
    }
    history.pushState(history.state, "");
    coBuocRef.current = true;
    const quayLai = () => {
      coBuocRef.current = false;
      setToan(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setToan(false); };
    window.addEventListener("popstate", quayLai);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("popstate", quayLai);
      window.removeEventListener("keydown", esc);
    };
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
          // HAI NGÓN MỚI KÉO BẢN ĐỒ, MỘT NGÓN LÀ CUỘN TRANG — như Google Maps (chủ dự án 22/10/2026 tối, sau khi thử kiểu một
          // ngón: "vuốt xuống các phần bị vướng" — bản đồ ăn cú vuốt, trang đăng tin không cuộn được). Chạm một lần vẫn
          // ghim; máy tính: Ctrl/⌘ + lăn chuột mới phóng to, lăn thường là cuộn trang. Câu nhắc theo đúng chữ của Google.
          cooperativeGestures: true,
          locale: {
            "CooperativeGesturesHandler.WindowsHelpText": "Sử dụng Ctrl + cuộn để thu phóng bản đồ",
            "CooperativeGesturesHandler.MacHelpText": "Sử dụng ⌘ + cuộn để thu phóng bản đồ",
            "CooperativeGesturesHandler.MobileHelpText": "Bấm ⛶ để mở bản đồ lớn, kéo bằng một ngón",
          },
          // Dòng ghi nguồn bản đồ thu thành nút (i) — mở rộng sẵn thì che cả đáy bản đồ trên điện thoại.
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        // Điện thoại KHÔNG có +/− (chủ dự án 22/10/2026: "trên mobile chỉ cần nút full, off full, nút Location — hết";
        // phóng to bằng chụm hai ngón hoặc mở bản đồ lớn). Máy tính giữ +/− (không chụm được).
        if (window.matchMedia("(min-width: 640px)").matches) map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

        // Bấm vào đâu là ghim vào đó — thao tác chính, ai cũng đoán được.
        map.on("click", (e) => void datGhim({ lat: e.lngLat.lat, lng: e.lngLat.lng }));

        map.on("load", () => {
          if (huy) return;
          // Dòng ghi nguồn bản đồ: MapLibre mở sẵn lúc đầu, che đáy bản đồ → thu ngay thành nút (i).
          boxRef.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
          vietHoaNhan(map);
          setSanSang(true);
          if (saved) void datGhim(saved);
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
  }, [hint, khoaTim, sanSang]);

  function xoaGhim() {
    onChange("");
    ghimRef.current?.remove();
    ghimRef.current = null;
    mayDienRef.current = "";
    setMucDo(null);
    setDiaChiGhim("");
    setSoNhaGhim("");
  }

  // Nhận thứ người dùng dán: toạ độ thẳng "16.06,108.22", link dài của Google
  // (có @lat,lng), hoặc link RÚT GỌN maps.app.goo.gl — loại này không chứa toạ độ
  // nên phải nhờ máy chủ mở ra xem nó dẫn tới đâu.
  async function nhanChuoiDan(txt: string): Promise<boolean> {
    const t = txt.trim();
    if (!t) return false;
    const ngay = parseLatLng(t);
    if (ngay) {
      await datGhim(ngay);
      mapRef.current?.easeTo({ center: [ngay.lng, ngay.lat], zoom: 17, duration: 500 });
      return true;
    }
    if (!t.startsWith("http")) return false;
    setDangGiai(true);
    try {
      const r = await fetch("/api/dia-chi?viec=mo-rong&q=" + encodeURIComponent(t));
      const d = (await r.json()) as { url?: string };
      const p = d.url ? parseLatLng(d.url) : null;
      if (p) {
        await datGhim(p);
        mapRef.current?.easeTo({ center: [p.lng, p.lat], zoom: 17, duration: 500 });
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
            Chưa mở được bản đồ — vẫn ghim được bằng nút định vị hoặc dán link bên dưới.
          </span>
        )}
        {sanSang && dangTra && (
          <span className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-cvr-ink/85 px-3 py-1.5 text-[12px] font-semibold text-white">
            Đang tìm địa chỉ…
          </span>
        )}
        {/* CẤU TRÚC THAY CHÚ THÍCH (chủ dự án 22/10/2026): nút định vị + nút phóng to nằm NGAY TRÊN bản đồ góc phải (máy tính: dưới nút +/−; kiểu Google
            Maps — ai cũng hiểu); kết quả ghim là nhãn nhỏ góc trên trái bản đồ, dấu × để xoá ghim. */}
        <button
          type="button"
          aria-label="Tôi đang đứng ở đây"
          title="Tôi đang đứng ở đây"
          onClick={() => dinhVi(true)}
          disabled={dangDinhVi}
          className="absolute right-[10px] top-[10px] z-10 flex h-[29px] w-[29px] sm:top-[78px] items-center justify-center rounded-[4px] bg-white text-cvr-blue shadow-[0_0_0_2px_rgba(0,0,0,0.1)] disabled:opacity-60"
        >
          {dangDinhVi ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cvr-blue border-t-transparent" />
          ) : (
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
        <button
          type="button"
          aria-label={toan ? "Thu nhỏ bản đồ" : "Phóng to bản đồ"}
          title={toan ? "Thu nhỏ bản đồ" : "Phóng to bản đồ"}
          onClick={() => setToan(!toan)}
          className="absolute right-[10px] top-[47px] z-10 flex h-[29px] w-[29px] sm:top-[115px] items-center justify-center rounded-[4px] bg-white text-cvr-ink shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
        >
          <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            {toan
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
          </svg>
        </button>
        <button
          type="button"
          onClick={moGoogleMaps}
          className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-2 pr-3 text-[12.5px] font-semibold text-cvr-ink shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
        >
          <svg className="h-4 w-4 text-[#ea4335]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
          </svg>
          Google Maps
        </button>
        {toan && (
          <button
            type="button"
            onClick={() => setToan(false)}
            className="absolute bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 rounded-full bg-cvr-ink px-8 py-3 text-[15px] font-semibold text-white shadow-lg"
          >
            Xong
          </button>
        )}
        {daGhim && (
          <span className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-3 pr-1 text-[12px] shadow">
            <span className="font-semibold text-green-700">Đã ghim</span>
            {mucDo && <span className="text-cvr-body">· {mucDo === "soNha" ? "đúng số nhà" : mucDo === "duong" ? "đúng tên đường" : "mới tới phường/xã"}</span>}
            <button type="button" aria-label="Xoá ghim" onClick={xoaGhim} className="flex h-6 w-6 items-center justify-center rounded-full text-cvr-muted hover:bg-cvr-surface hover:text-cvr-ink">✕</button>
          </span>
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
          onChange={async (e) => {
            const o = e.target;
            const xong = await nhanChuoiDan(o.value);
            if (xong) {
              o.value = "";
              setLoiDan("");
            } else if (o.value.trim().length > 12)
              setLoiDan("Chưa đọc được vị trí từ chuỗi này — thử dán lại link Google Maps.");
          }}
          onPaste={async (e) => {
            const txt = e.clipboardData.getData("text");
            e.preventDefault();
            const xong = await nhanChuoiDan(txt);
            setLoiDan(xong ? "" : "Chưa đọc được vị trí từ link này — thử dán toạ độ dạng 16.0678, 108.2208.");
          }}
          className="h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint caret-cvr-blue outline-none transition focus:border-cvr-blue focus:ring-1 focus:ring-cvr-blue"
        />
        {dangGiai && <p className="mt-2 text-[12px] font-medium text-cvr-blue-ink">Đang đọc vị trí từ link…</p>}
        {loiDan && <p className="mt-2 text-[12px] font-medium text-red-600">{loiDan}</p>}
      </div>

      {daGhim && diaChiGhim && (
        <div className="rounded-xl bg-cvr-surface px-3 py-2.5 text-[13px] leading-relaxed text-cvr-body">
          Địa chỉ tại điểm ghim: <strong className="font-semibold text-cvr-ink">{diaChiGhim}</strong>
          {soNhaGhim && soNhaGhim !== (hint.split(",")[0] ?? "").trim() && (
            <button
              type="button"
              onClick={() => {
                onDiaChiRef.current?.(soNhaGhim);
                mayDienRef.current = soNhaGhim;
              }}
              className="mt-2 flex min-h-[36px] items-center rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              Sửa địa chỉ theo điểm ghim
            </button>
          )}
        </div>
      )}

      {loi && (
        <NhacBatDinhVi loi={loi} onThuLai={() => dinhVi(true)} dangDinhVi={dangDinhVi} onDong={() => setLoi("")} />
      )}
    </div>
  );
}
