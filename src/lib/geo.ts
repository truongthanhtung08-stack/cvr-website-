// Toạ độ tâm khu vực (xấp xỉ) cho chế độ Bản đồ — đủ dùng với dữ liệu mẫu
// (tin chưa có toạ độ thật; sau này lấy lat/lng từ Supabase thì thay ở tầng gọi).
// ⚠️ Mục CỤ THỂ (quận/phường) đặt TRƯỚC mục tỉnh/thành — so khớp theo thứ tự.
const CENTERS: [name: string, lat: number, lng: number][] = [
  // Đà Nẵng — quận/khu
  ["Sơn Trà", 16.083, 108.25],
  ["Hải Châu", 16.06, 108.221],
  ["Thanh Khê", 16.064, 108.187],
  ["Cẩm Lệ", 16.017, 108.203],
  ["Ngũ Hành Sơn", 16.002, 108.264],
  ["Liên Chiểu", 16.093, 108.135],
  ["Hội An", 15.88, 108.335],
  ["Điện Bàn", 15.9, 108.25],
  ["Tam Kỳ", 15.573, 108.474],
  // Huế
  ["Phú Xuân", 16.475, 107.577],
  ["Thuận Hóa", 16.455, 107.596],
  ["Hương Thủy", 16.406, 107.685],
  // Quy Nhơn (Gia Lai mới) & lân cận
  ["Nhơn Lý", 13.845, 109.303],
  ["Ghềnh Ráng", 13.74, 109.222],
  ["An Nhơn", 13.885, 109.109],
  ["Quy Nhơn", 13.775, 109.223],
  // Hà Nội
  ["Nam Từ Liêm", 21.011, 105.764],
  // Tỉnh/thành (fallback)
  ["Đà Nẵng", 16.054, 108.202],
  ["Huế", 16.464, 107.591],
  ["Quảng Ngãi", 15.121, 108.804],
  ["Gia Lai", 13.983, 108.0],
  ["Khánh Hòa", 12.238, 109.196],
  ["Đắk Lắk", 12.667, 108.038],
  ["Quảng Trị", 16.816, 107.1],
  ["Lâm Đồng", 11.94, 108.458],
  ["Hà Nội", 21.028, 105.854],
];

// Suy toạ độ từ chuỗi địa chỉ ("Phước Mỹ, Sơn Trà, Đà Nẵng") + jitter TẤT ĐỊNH
// theo seed (id tin) để các marker cùng khu vực không chồng lên nhau.
export function coordOf(location: string, seed: string): [number, number] {
  const hit = CENTERS.find(([name]) => location.includes(name));
  const lat = hit ? hit[1] : 16.054;
  const lng = hit ? hit[2] : 108.202;
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const dLat = ((h % 1000) / 1000 - 0.5) * 0.014;
  const dLng = (((h >> 10) % 1000) / 1000 - 0.5) * 0.014;
  return [lat + dLat, lng + dLng];
}

// Tâm khu vực CHÍNH XÁC (không jitter) — dùng khi cần ghim một địa chỉ lên bản đồ
// mà không tra được toạ độ thật. Khác coordOf ở chỗ KHÔNG xê dịch ngẫu nhiên:
// ở đây mình cố ý nói "đây là giữa khu vực", không giả vờ là đúng căn nhà.
// Không khớp khu vực nào → null (nơi gọi tự quyết định làm gì).
export function centerOfArea(location: string): [number, number] | null {
  const hit = CENTERS.find(([name]) => location.includes(name));
  return hit ? [hit[1], hit[2]] : null;
}
