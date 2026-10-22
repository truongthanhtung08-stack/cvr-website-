// ── ĐỊNH VỊ KHÁCH — dùng chung cho MỌI bản đồ trên web ───────────────────────
//
// BÀI HỌC 02/09/2026: khách báo "bấm định vị không được" ở tất cả bản đồ. Đo trên
// coastalland.vn thì ra `navigator.permissions` = **denied**. Trình duyệt đã ghi
// nhớ lần TỪ CHỐI trước đó, và một khi đã nhớ thì **nó không hỏi lại nữa** — bấm
// nút bao nhiêu lần cũng im re, không hiện hộp xin quyền nào.
//
// Web KHÔNG có cách nào tự mở lại quyền đó (nếu có thì mọi trang đều theo dõi
// được vị trí người dùng). Việc duy nhất làm được là **chỉ cho khách bật lại**,
// đúng từng bước theo máy họ đang dùng. Vì vậy mới có `huongDanBatDinhVi()`.

export type TrangThaiQuyen = "granted" | "prompt" | "denied" | "khong-ro";

// Trình duyệt cũ không có Permissions API → trả "khong-ro", cứ thử định vị bình thường.
export async function quyenDinhVi(): Promise<TrangThaiQuyen> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "khong-ro";
  try {
    const r = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return r.state as TrangThaiQuyen;
  } catch {
    return "khong-ro";
  }
}

function laIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function laAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/.test(navigator.userAgent);
}

// Các bước bật lại định vị — viết theo đúng máy khách đang cầm, không nói chung chung.
//
// ⚠️ ĐÚNG HAI BƯỚC, ĐỪNG VIẾT DÀI THÊM (chủ dự án chốt: "gợi ý ngắn gọn").
// Web KHÔNG có quyền tự mở màn hình Cài đặt hay bật/tắt GPS của máy — hệ điều
// hành chặn, mọi trang web đều vậy, không phải mình thiếu code. Thứ duy nhất web
// gọi được là hộp thoại xin quyền của trình duyệt, mà hộp đó chỉ hiện khi khách
// CHƯA từng bấm "Chặn". Đã bấm Chặn rồi thì chỉ còn cách chỉ họ tự bật.
// Web mở dạng ỨNG DỤNG đã cài lên màn hình chính (PWA) — KHÔNG có thanh địa chỉ, nên không có ổ khoá để bấm.
function laUngDung(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

// Web mở TRONG Zalo / Facebook / Messenger / Instagram / TikTok — trình duyệt trong app thường không cho trang dùng vị trí.
function laTrongApp(): boolean {
  return typeof navigator !== "undefined" && /Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|TikTok/i.test(navigator.userAgent);
}

// CÁCH BẬT THEO ĐÚNG CHỖ KHÁCH ĐANG MỞ WEB (chủ dự án 22/10/2026: "tôi bật định vị, bấm vào không ăn" — mở web dạng
// ứng dụng / trong Zalo thì không có thanh địa chỉ, hướng dẫn cũ "bấm ổ khoá trên thanh địa chỉ" làm theo không được).
//   ma 1 = máy đã nhớ "không cho phép" Coastal Land dùng vị trí · ma 2 = Vị trí của máy đang tắt.
export function huongDanBatDinhVi(ma = 1): string[] {
  if (ma === 2) {
    if (laIOS()) return ["Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị: BẬT", "Quay lại, bấm nút định vị lần nữa"];
    if (laAndroid()) return ["Vuốt từ trên xuống, bấm biểu tượng Vị trí cho sáng lên", "Quay lại, bấm nút định vị lần nữa"];
    return ["Windows: Cài đặt → Quyền riêng tư và bảo mật → Vị trí: BẬT", "Quay lại, bấm nút định vị lần nữa"];
  }
  if (laTrongApp()) return ["Bấm ⋯ ở góc trên → Mở bằng trình duyệt", "Trên trình duyệt, bấm nút định vị → Cho phép"];
  if (laUngDung() && laAndroid()) return ["Giữ biểu tượng Coastal Land trên màn hình chính → Thông tin ứng dụng", "Quyền → Vị trí → Cho phép"];
  if (laIOS()) return ["Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị → Trang web Safari → Khi dùng ứng dụng", "Quay lại, bấm nút định vị lần nữa"];
  if (laAndroid()) return ["Bấm ổ khoá 🔒 (hoặc ⓘ) cạnh địa chỉ web → Quyền → Vị trí → Cho phép", "Quay lại, bấm nút định vị lần nữa"];
  return ["Bấm ổ khoá 🔒 cạnh địa chỉ web → Vị trí → Cho phép", "Bấm nút định vị lần nữa"];
}

// MỘT DÒNG NÓI VIỆC CẦN LÀM (không nói "bị chặn trên trình duyệt" — chủ dự án 22/10/2026: "câu nói rất vớ vẩn").
// Cách làm cụ thể nằm sau "Xem cách bật" (NhacBatDinhVi), đúng theo chỗ khách đang mở web.
export function loiDinhVi(ma: number): string {
  if (ma === 1) return "Cho phép Coastal Land dùng vị trí của máy";
  if (ma === 2) return "Bật Vị trí của máy";
  return "Chưa lấy được vị trí, thử lại.";
}

// Ngược lại: từ câu báo → mã (NhacBatDinhVi chọn đúng bộ bước, khỏi sửa mọi bản đồ đang gọi).
export function maCuaLoi(loi: string): number {
  return loi === loiDinhVi(1) ? 1 : loi === loiDinhVi(2) ? 2 : 3;
}

// ĐỊNH VỊ HAI CHẶNG CHO NHANH:
//   Chặng 1 — KHÔNG bắt GPS chính xác cao + nhận vị trí cũ trong 10 phút → máy lấy
//     theo wifi/trạm phát sóng, thường có ngay dưới 1 giây.
//   Chặng 2 — GPS chính xác chạy ngầm, có kết quả sát hơn thì gọi lại `nhan` để
//     dời chấm cho đúng.
// Bật chính xác cao ngay từ đầu là sai lầm cũ: ngoài trời chờ 5–15 giây, trong nhà treo luôn.
// epGPS=true (khách TỰ BẤM nút định vị): không nhận vị trí cũ trong bộ nhớ nữa —
// máy buộc phải đo lại, tức là buộc bật GPS. Tắt GPS thì rơi vào `bao()` và khối
// hướng dẫn hiện lên bắt bật. Tự động định vị lúc mở trang thì để epGPS=false cho
// nhanh, lấy vị trí cũ trong 10 phút là đủ.
export function layViTri(
  nhan: (lat: number, lng: number, chinhXacHon: boolean) => void,
  bao: (ma: number) => void,
  epGPS = false,
) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    bao(2);
    return;
  }
  if (epGPS) {
    // KHÁCH TỰ BẤM NÚT: CHẠY SONG SONG HAI ĐƯỜNG (chủ dự án 22/10/2026: "bấm vào location không có cử động gì" — trước đây
    // chỉ chờ GPS chính xác cao, trong nhà 5–15 giây mới có, khách tưởng nút chết).
    //   · Đường nhanh: theo wifi/trạm phát, nhận vị trí cũ trong 10 phút → thường dưới 1 giây, bản đồ bay tới ngay.
    //   · Đường chính xác: enableHighAccuracy — ⚠️ ĐỪNG BỎ. Đây là chỗ làm Android + Chrome tự bung hộp hệ thống "Để tiếp
    //     tục, hãy bật dịch vụ vị trí của thiết bị — [Không] [OK]" khi máy đang tắt GPS (Google Play Services); xin chính
    //     xác thấp thì Chrome lặng lẽ báo hỏng, không bung hộp. Hộp chỉ hiện khi khách CHƯA bấm "Chặn" coastalland.vn.
    //     Có kết quả thì gọi nhan(..., true) để dời cho sát.
    // Chỉ báo lỗi khi CẢ HAI đều hỏng; có mã 1 (chưa cho phép) thì báo mã 1.
    let daCo = false;
    let hong = 0;
    let maLoi = 0;
    const loi = (e: GeolocationPositionError) => {
      hong++;
      if (e.code === 1 || !maLoi) maLoi = e.code;
      if (hong === 2 && !daCo) bao(maLoi);
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => { if (!daCo) { daCo = true; nhan(pos.coords.latitude, pos.coords.longitude, false); } },
      loi,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
    navigator.geolocation.getCurrentPosition(
      (pos) => { const truoc = daCo; daCo = true; nhan(pos.coords.latitude, pos.coords.longitude, truoc); },
      loi,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      nhan(pos.coords.latitude, pos.coords.longitude, false);
      navigator.geolocation.getCurrentPosition(
        (sat) => nhan(sat.coords.latitude, sat.coords.longitude, true),
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    },
    (e) => bao(e.code),
    // Không phải khách bấm nút (tự định vị lúc mở bản đồ): chỉ xin nhẹ, KHÔNG bung hộp bật GPS; GPS chính xác chạy ngầm sau.
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
  );
}

// Khoảng cách đường chim bay giữa hai điểm, tính bằng km. Chỉ để khách áng chừng
// "mình cách chỗ này bao xa", KHÔNG phải quãng đường xe chạy.
export function khoangCachKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function docKhoangCach(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
