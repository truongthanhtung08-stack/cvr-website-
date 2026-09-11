"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import { napMapLibre, STYLE_MO, vietHoaNhan } from "@/lib/banDoMo";
import { formatLatLng, parseLatLng, type LatLng } from "@/lib/googleMaps";
import { centerOfArea } from "@/lib/geo";
import { traDiaChi } from "@/lib/timToaDo";
import { docKhoangCach, khoangCachKm, layViTri, loiDinhVi } from "@/lib/dinhVi";
import NhacBatDinhVi from "@/components/NhacBatDinhVi";

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
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  onDiaChi?: (v: string) => void;
  onDiaGioi?: (v: { tinh: string; quan: string; phuong: string }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ghimRef = useRef<MlMarker | null>(null);
  const chamRef = useRef<MlMarker | null>(null);
  const toiRef = useRef<LatLng | null>(null);
  const onChangeRef = useRef(onChange);
  const onDiaChiRef = useRef(onDiaChi);
  const onDiaGioiRef = useRef(onDiaGioi);
  const hintRef = useRef(hint);
  const valueRef = useRef(value);
  // Chuỗi địa chỉ MÁY vừa tự điền. Ô đang giữ đúng chuỗi này nghĩa là khách chưa
  // đụng vào → đổi ghim thì máy được viết lại. Khách sửa rồi thì giữ nguyên.
  const mayDienRef = useRef("");

  const [sanSang, setSanSang] = useState(false);
  const [hong, setHong] = useState(false);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  const [dangTra, setDangTra] = useState(false);
  const [dangGiai, setDangGiai] = useState(false);
  const [loi, setLoi] = useState("");
  const [loiDan, setLoiDan] = useState("");
  const [khoangCach, setKhoangCach] = useState("");
  const [mucDo, setMucDo] = useState<"soNha" | "duong" | "khuVuc" | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
    onDiaChiRef.current = onDiaChi;
    onDiaGioiRef.current = onDiaGioi;
    hintRef.current = hint;
    valueRef.current = value;
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

  function doKhoangCach(ghim: LatLng) {
    const toi = toiRef.current;
    if (!toi) return;
    setKhoangCach(docKhoangCach(khoangCachKm([toi.lat, toi.lng], [ghim.lat, ghim.lng])));
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
        doKhoangCach(moi);
      });
      ghimRef.current = m;
    }
    onChangeRef.current(formatLatLng(p));
    void traVeDiaChi(p);
    doKhoangCach(p);
  }

  // ── Chấm xanh "vị trí của bạn" — chỉ tham chiếu, KHÔNG phải ghim ─────────
  async function veCham(p: LatLng, bayToi: boolean) {
    const map = mapRef.current;
    if (!map) return;
    toiRef.current = p;
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
    const g = ghimRef.current?.getLngLat();
    if (g) doKhoangCach({ lat: g.lat, lng: g.lng });
  }

  function dinhVi(ghimLuon: boolean) {
    setLoi("");
    setDangDinhVi(true);
    layViTri(
      (lat, lng, chinhXacHon) => {
        setDangDinhVi(false);
        const p = { lat, lng };
        void veCham(p, !chinhXacHon);
        if (ghimLuon && !chinhXacHon) void datGhim(p);
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
        });
        mapRef.current = map;
        map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

        // Bấm vào đâu là ghim vào đó — thao tác chính, ai cũng đoán được.
        map.on("click", (e) => void datGhim({ lat: e.lngLat.lat, lng: e.lngLat.lng }));

        map.on("load", () => {
          if (huy) return;
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
  useEffect(() => {
    if (!sanSang) return;
    const map = mapRef.current;
    if (!map || ghimRef.current) return;
    const kv = centerOfArea(hint);
    if (!kv) return;
    const t = setTimeout(() => {
      map.easeTo({
        center: [kv[1], kv[0]],
        zoom: hint.split(",").filter((s) => s.trim()).length >= 2 ? 14 : 12,
        duration: 600,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [hint, sanSang]);

  function xoaGhim() {
    onChange("");
    ghimRef.current?.remove();
    ghimRef.current = null;
    mayDienRef.current = "";
    setKhoangCach("");
    setMucDo(null);
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
            Chưa mở được bản đồ — vẫn ghim được bằng nút định vị hoặc dán link bên dưới.
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

      {/* Ở xa bất động sản thì vẫn dán được link Google Maps như cũ — giữ y
          đường cũ, không bỏ. */}
      <div className="rounded-xl bg-cvr-surface px-3 py-3">
        <input
          type="text"
          inputMode="text"
          defaultValue=""
          placeholder="Hoặc dán link Google Maps / toạ độ (VD: 16.0678, 108.2208)"
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
          className="h-11 w-full rounded-lg border border-transparent bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line"
        />
        {dangGiai && <p className="mt-2 text-[12px] font-medium text-cvr-blue-ink">Đang đọc vị trí từ link…</p>}
        {loiDan && <p className="mt-2 text-[12px] font-medium text-red-600">{loiDan}</p>}
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
          <span className="text-cvr-muted">Bấm lên bản đồ để ghim vị trí.</span>
        )}
      </p>

      {loi && (
        <NhacBatDinhVi loi={loi} onThuLai={() => dinhVi(true)} dangDinhVi={dangDinhVi} onDong={() => setLoi("")} />
      )}
    </div>
  );
}
