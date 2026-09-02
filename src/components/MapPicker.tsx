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
  // CHẤM XANH "Vị trí của bạn" — khác hẳn ghim đỏ. Đọc được vị trí máy mà không
  // hiện gì thì khách không biết bản đồ vừa nhảy đi đâu và vì sao.
  const chamRef = useRef<GMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [dangDinhVi, setDangDinhVi] = useState(false);
  // Hàm định vị được gọi từ trong effect dựng bản đồ (chạy trước khi hàm được
  // khai báo) nên phải đi vòng qua ref.
  const viTriCuaToiRef = useRef<(ghimLuon?: boolean) => void>(() => {});
  const [loi, setLoi] = useState("");
  // Khoá Maps hỏng / Google từ chối → KHÔNG được để ô trắng. Lùi về bản nhúng để
  // người đăng vẫn nhìn thấy khu vực, và mở ô nhập toạ độ tay để vẫn ghim được.
  const [hongBanDo, setHongBanDo] = useState(!MAP_KEY);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const daGhim = parseLatLng(value);


  // Vẽ chấm xanh tại vị trí máy. Chấm này CHỈ để tham chiếu — không phải điểm
  // ghim, khách vẫn tự bấm chọn đúng điểm bất động sản.
  function hienChamViTri(p: LatLng) {
    const g = window.google;
    const map = mapRef.current;
    if (!g || !map) return;
    if (chamRef.current) {
      chamRef.current.setPosition(p);
      return;
    }
    chamRef.current = new g.maps.Marker({
      position: p,
      map,
      clickable: false,
      zIndex: 1,
      title: "Vị trí của bạn",
      // 0 = google.maps.SymbolPath.CIRCLE — chấm tròn xanh viền trắng, neo giữa
      icon: { path: 0, scale: 7, fillColor: "#0071e3", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 },
    });
  }

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
        // THỨ TỰ ƯU TIÊN chỗ mở bản đồ:
        //   1. Đã ghim rồi          → đúng điểm đó
        //   2. Đã chọn khu vực      → giữa khu vực đó
        //   3. Chưa biết gì         → CẢ VIỆT NAM (không phải riêng Đà Nẵng —
        //      tin đăng ở khắp nước), rồi ngay sau đó xin vị trí máy để bay về
        //      chỗ khách đang đứng: chắc ăn nhất vì người đăng thường ở ngay
        //      tại bất động sản.
        const center: LatLng =
          saved ?? (khuVuc ? { lat: khuVuc[0], lng: khuVuc[1] } : { lat: 16.054, lng: 108.202 });

        const map = new g.maps.Map(boxRef.current, {
          center,
          // LUÔN mở ở mức nhìn thấy đường phố. TUYỆT ĐỐI không mở mức cả nước /
          // cả thế giới — nhìn vào không biết ghim chỗ nào. Chưa biết khu vực thì
          // mở Đà Nẵng rồi bay tiếp theo vị trí máy hoặc khu vực khách chọn.
          zoom: saved ? 17 : khuVuc ? 15 : 13,
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

        // CHƯA ghim → xin vị trí máy ngay, KHÔNG cần khách nhập gì cả: mở form
        // ra là bản đồ đã nằm sẵn quanh chỗ khách đứng, bấm một cái là ghim.
        // CHỈ DỜI BẢN ĐỒ, không tự ghim — ghim vẫn là quyết định của khách.
        // Khách từ chối chia sẻ vị trí thì bản đồ vẫn ở Đà Nẵng, tự kéo được.
        const daNhapDiaChi = hint.split(",").some((s) => s.trim().length > 0);
        if (!saved && !daNhapDiaChi) {
          // Dùng CHUNG hàm định vị của nút, để lỡ máy chặn hay chưa bật GPS thì
          // khách thấy ngay lời nhắc, không phải đoán.
          setTimeout(() => { if (!huy) viTriCuaToiRef.current(false); }, 300);
        }
        // Google có thể nạp được thư viện mà vẫn KHÔNG vẽ (khoá sai, chưa bật
        // Maps JavaScript API, hết hạn mức) — lúc đó nó chỉ để lại một ô xám.
        // ⚠️ ĐỢI ĐỦ LÂU rồi hãy kết luận: trên điện thoại và mạng 3G/4G, Google
        // hay mất 3–6 giây mới vẽ xong. Trước đây chỉ đợi 2 giây nên bản đồ
        // THẬT bị coi nhầm là hỏng rồi thay bằng bản nhúng.
        for (const giay of [4, 8, 12]) {
          setTimeout(() => {
            if (huy) return;
            const daVe = !!boxRef.current?.querySelector(".gm-style");
            if (daVe) setHongBanDo(false);
            else if (giay === 12) setHongBanDo(true);
          }, giay * 1000);
        }
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

  // ── ĐƯA BẢN ĐỒ VỀ ĐÚNG KHU VỰC KHÁCH ĐANG CHỌN ──────────────────────────
  // Trước đây bản đồ mở cố định giữa Đà Nẵng ở mức phóng rất rộng và KHÔNG bao
  // giờ dời, nên khách ở tỉnh khác nhìn vào không biết ghim chỗ nào. Nay cứ chọn
  // xong Tỉnh/Phường là bản đồ tự bay về đó, phóng đủ gần để thấy từng con đường.
  const hintRef = useRef(hint);
  useEffect(() => {
    hintRef.current = hint;
  });

  const [dangTimKhuVuc, setDangTimKhuVuc] = useState(false);

  async function veKhuVuc() {
    const map = mapRef.current;
    const phan = hintRef.current.split(",").map((s) => s.trim());
    // Ô "Địa chỉ cụ thể" là phần ĐẦU TIÊN — có số nhà hoặc tên đường thì trỏ
    // thẳng tới đó, chính xác hơn hẳn tâm phường.
    const coDuong = phan[0].length >= 3;
    const diaChi = phan.filter(Boolean).join(", ");
    // Chuỗi rỗng hoặc quá ngắn (mới gõ một hai chữ) thì đừng hỏi Google — vừa
    // tốn lượt tra vừa nhận về kết quả bậy ở tận đâu.
    if (!map || diaChi.length < 4) return;

    // 1) CHƯA có tên đường → dùng bảng toạ độ sẵn trong code cho nhanh và miễn phí.
    //    CÓ tên đường thì BỎ QUA bảng này: bảng khớp lỏng theo tên tỉnh nên hễ
    //    địa chỉ có chữ "Đà Nẵng" là nó trả về tâm thành phố, vứt mất tên đường.
    if (!coDuong) {
      const kv = centerOfArea(diaChi);
      if (kv) {
        map.setCenter({ lat: kv[0], lng: kv[1] });
        map.setOptions({ zoom: 15 });
        return;
      }
    }
    // 2) Nhờ Google tra đúng địa chỉ (khoá đã bật Geocoding API). Có tên đường
    //    thì phóng sát hơn vì đã biết gần đúng chỗ.
    const g = window.google as unknown as {
      maps?: { Geocoder?: new () => { geocode: (r: object) => Promise<{ results?: { geometry?: { location?: { lat: () => number; lng: () => number } } }[] }> } };
    };
    if (!g?.maps?.Geocoder) return;
    setDangTimKhuVuc(true);
    try {
      const kq = await new g.maps.Geocoder().geocode({ address: diaChi + ", Việt Nam", region: "VN" });
      const p = kq.results?.[0]?.geometry?.location;
      if (p) {
        map.setCenter({ lat: p.lat(), lng: p.lng() });
        map.setOptions({ zoom: coDuong ? 17 : 16 });
      }
    } catch {
      // Tra không ra thì thôi, khách vẫn tự kéo bản đồ được
    }
    setDangTimKhuVuc(false);
  }

  // Khách vừa chọn xong khu vực → tự bay về đó. CHƯA ghim mới bay; đã ghim rồi
  // thì giữ nguyên, không giật ghim của khách đi chỗ khác.
  useEffect(() => {
    if (!hint.trim() || parseLatLng(value) || hongBanDo) return;
    const t = setTimeout(() => { void veKhuVuc(); }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint, hongBanDo]);

  // Định vị THẤT BẠI thì phải nói rõ vì sao và bảo khách làm gì — im lặng là
  // khách đứng nhìn không biết chuyện gì. Ba lý do hay gặp, mỗi lý do một cách xử.
  function loiDinhVi(ma: number): string {
    if (ma === 1)
      return "Trình duyệt đang CHẶN định vị. Bấm biểu tượng ổ khoá 🔒 cạnh địa chỉ web ở trên → Quyền / Vị trí → chọn Cho phép, rồi bấm lại nút này.";
    if (ma === 2)
      return "Máy chưa BẬT GPS / Vị trí. Vào Cài đặt của điện thoại → Vị trí và bật lên, rồi bấm lại nút này.";
    return "Định vị lâu quá chưa xong. Anh/chị ra chỗ thoáng hoặc bật GPS rồi bấm lại. Không được thì kéo bản đồ tới đúng chỗ và bấm để ghim.";
  }

  // `ghimLuon` = bấm nút "Tôi đang đứng ở đây" → vừa dời bản đồ vừa ghim.
  // Gọi tự động lúc mở form thì chỉ DỜI bản đồ và hiện chấm xanh, không ghim.
  function viTriCuaToi(ghimLuon = true) {
    if (!navigator.geolocation) {
      setLoi("Trình duyệt này không hỗ trợ định vị. Anh/chị kéo bản đồ tới đúng chỗ rồi bấm để ghim.");
      return;
    }
    setLoi("");
    setDangDinhVi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDangDinhVi(false);
        setLoi("");
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const map = mapRef.current;
        const g = window.google;
        if (map && g) {
          map.setCenter(p);
          map.setOptions({ zoom: ghimLuon ? 18 : 16 });
          hienChamViTri(p);
        }
        if (!ghimLuon) return;
        onChange(formatLatLng(p));
        if (map && g) {
          if (markerRef.current) markerRef.current.setPosition(p);
          else markerRef.current = new g.maps.Marker({ position: p, map, draggable: true });
        }
      },
      (e) => {
        setDangDinhVi(false);
        setLoi(loiDinhVi(e.code));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  useEffect(() => {
    viTriCuaToiRef.current = viTriCuaToi;
  });

  function xoaGhim() {
    onChange("");
    markerRef.current?.setMap(null);
    markerRef.current = null;
  }

  // Bản nhúng dự phòng mở đúng khu vực đang nhập (chỉ để nhìn, không ghim được).
  // ⚠️ hint được ghép sẵn dạng "địa chỉ, phường, quận, tỉnh" nên khi khách CHƯA
  // nhập gì nó là ", , ," — chuỗi toàn dấu phẩy vẫn TRUTHY. Đem nguyên chuỗi đó
  // đi hỏi Google thì Google không hiểu và trả về CẢ THẾ GIỚI. Phải lọc bỏ phần
  // rỗng trước; không còn phần nào thì mặc định Đà Nẵng.
  const khuVucNhung =
    hint.split(",").map((s) => s.trim()).filter(Boolean).join(", ") || "Đà Nẵng";

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
            Bấm <strong>“Tôi đang đứng ở đây”</strong> khi đang ở tại bất động sản là ghim được ngay.
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

      {/* HƯỚNG DẪN 3 DÒNG — đúng 3 việc khách cần: mình ở đâu · bất động sản ở
          đâu · ghim chỗ nào. Ghim xong thì gọn còn một dòng. */}
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
          onClick={() => viTriCuaToi(true)}
          disabled={dangDinhVi}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-cvr-blue px-4 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-60"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
          </svg>
          {dangDinhVi ? "Đang định vị…" : "Tôi đang đứng ở đây"}
        </button>
        <button
          type="button"
          onClick={() => void veKhuVuc()}
          disabled={dangTimKhuVuc || hongBanDo || !hint.trim()}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 text-[13px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-45"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          {dangTimKhuVuc ? "Đang tìm…" : "Về địa chỉ đã nhập"}
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
        {/* KHÔNG khoe toạ độ ra nữa. Khách chỉ bấm — kéo — phóng bản đồ rồi ghim;
            con số lat/lng chạy ngầm, hiện ra chỉ làm khách hoang mang. */}
        {daGhim && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Đã ghim vị trí
          </span>
        )}
      </div>

      {/* LỖI ĐỊNH VỊ — hiện thành khối rõ ràng kèm nút thử lại, không phải một
          dòng chữ đỏ bé xíu dễ bị bỏ qua. */}
      {loi && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-[13px] font-medium leading-relaxed text-amber-900">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {loi}
          </p>
          <button
            type="button"
            onClick={() => viTriCuaToi(true)}
            disabled={dangDinhVi}
            className="mt-2 inline-flex min-h-[36px] items-center rounded-lg border border-amber-400 bg-white px-3 text-[13px] font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {dangDinhVi ? "Đang định vị…" : "Bật xong rồi — thử lại"}
          </button>
        </div>
      )}
    </div>
  );
}
