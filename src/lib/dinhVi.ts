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
export function huongDanBatDinhVi(): string[] {
  if (laIOS())
    return [
      "Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị: BẬT",
      "Quay lại trang, bấm chữ ẢA bên trái thanh địa chỉ → Cài đặt trang web → Vị trí → Cho phép",
    ];
  if (laAndroid())
    return [
      "Vuốt từ trên xuống, bấm biểu tượng Vị trí cho sáng lên (hoặc Cài đặt → Vị trí: BẬT)",
      "Quay lại trang, bấm ổ khoá 🔒 trên thanh địa chỉ → Quyền → Vị trí → Cho phép",
    ];
  return [
    "Bấm ổ khoá 🔒 trên thanh địa chỉ → Vị trí → Cho phép",
    "Windows: Cài đặt → Quyền riêng tư và bảo mật → Vị trí: BẬT",
  ];
}

// Câu ngắn nói VÌ SAO hỏng — đi kèm các bước ở trên.
export function loiDinhVi(ma: number): string {
  if (ma === 1) return "Trình duyệt đang CHẶN định vị trên coastalland.vn. Bật lại theo 4 bước dưới đây:";
  if (ma === 2) return "Máy chưa bật Dịch vụ định vị (GPS). Bật theo các bước dưới đây:";
  return "Định vị lâu quá chưa có kết quả. Thử theo các bước dưới đây, hoặc ra chỗ thoáng rồi bấm lại:";
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
    { enableHighAccuracy: false, timeout: 8000, maximumAge: epGPS ? 0 : 600000 },
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
