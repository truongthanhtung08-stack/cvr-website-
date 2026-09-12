// MÁY ĐO TẠM — ghi lại máy/trình duyệt đang mở phần up ảnh, để tìm vì sao
// bảng chọn ảnh không có Bộ sưu tập trên một số máy.
// Không hiện gì trên giao diện, không lưu vào cơ sở dữ liệu, chỉ in ra nhật ký
// máy chủ. XOÁ CẢ TỆP NÀY khi dò xong (đặt 12/09/2026).
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  console.log("DO-MAY " + JSON.stringify(b));
  return new Response(null, { status: 204 });
}
