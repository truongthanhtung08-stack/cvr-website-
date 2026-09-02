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
export function huongDanBatDinhVi(): string[] {
  if (laIOS())
    return [
      "Vào Cài đặt của iPhone → Quyền riêng tư & Bảo mật → Dịch vụ định vị: BẬT",
      "Vẫn màn hình đó, kéo tìm Safari (hoặc Chrome) → chọn Khi dùng ứng dụng",
      "Quay lại trang này, bấm chữ ẢA bên trái địa chỉ web → Cài đặt trang web → Vị trí → Hỏi hoặc Cho phép",
      "Tải lại trang rồi bấm lại nút định vị",
    ];
  if (laAndroid())
    return [
      "Vào Cài đặt điện thoại → Vị trí: BẬT",
      "Quay lại trang này, bấm ổ khoá 🔒 bên trái chữ coastalland.vn trên thanh địa chỉ",
      "Chọn Quyền (Permissions) → Vị trí → Cho phép",
      "Tải lại trang rồi bấm lại nút định vị",
    ];
  return [
    "Bấm ổ khoá 🔒 bên trái địa chỉ coastalland.vn trên thanh địa chỉ",
    "Chọn Vị trí (Location) → Cho phép (Allow)",
    "Máy Windows: Cài đặt → Quyền riêng tư và bảo mật → Vị trí: BẬT",
    "Tải lại trang (phím F5) rồi bấm lại nút định vị",
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
export function layViTri(
  nhan: (lat: number, lng: number, chinhXacHon: boolean) => void,
  bao: (ma: number) => void,
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
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
  );
}
