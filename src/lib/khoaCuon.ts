// ============================================================================
// KHOÁ CUỘN TRANG NỀN — dùng chung cho mọi lớp phủ toàn màn hình
// ----------------------------------------------------------------------------
// Dùng position:fixed (KHÔNG dùng overflow:hidden — cách đó làm hỏng
// position:sticky của header, đã từng gây lỗi menu bị ẩn).
//
// ĐẾM SỐ LỚP ĐANG MỞ: danh sách ảnh mở trước, bấm 1 ảnh mở tiếp bộ xem ảnh →
// hai lớp cùng khoá. Nếu mỗi lớp tự mở khoá thì đóng bộ xem ảnh sẽ nhả trang
// nền trong khi danh sách ảnh còn mở → trang nền nhảy về đầu. Vì vậy chỉ lớp
// CUỐI CÙNG đóng mới trả trang về đúng chỗ cũ.
// ============================================================================

let dangMo = 0;
let viTri = 0;

export function khoaCuon(): () => void {
  if (dangMo === 0) {
    viTri = window.scrollY;
    const b = document.body.style;
    b.position = "fixed";
    b.top = `-${viTri}px`;
    b.left = "0";
    b.right = "0";
  }
  dangMo += 1;

  let daNha = false;
  return () => {
    if (daNha) return;
    daNha = true;
    dangMo -= 1;
    if (dangMo > 0) return;
    const b = document.body.style;
    b.position = ""; b.top = ""; b.left = ""; b.right = "";
    window.scrollTo(0, viTri);
  };
}
