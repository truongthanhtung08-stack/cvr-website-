// Danh mục đơn vị hành chính — CẬP NHẬT THEO SÁT NHẬP 2025 (34 đơn vị toàn quốc).
// Cấu trúc: Tỉnh/Thành phố → Quận/Huyện/Thị xã → Phường/Xã/Thị trấn.
//
// 👉 7 đơn vị LÕI vùng Duyên Hải Trung Bộ (Huế, Đà Nẵng, Quảng Ngãi, Gia Lai,
//    Đắk Lắk, Khánh Hòa, Quảng Trị) có quận/huyện chi tiết; các tỉnh còn lại để
//    mức tỉnh (bổ sung dần). Có thể thay bằng dữ liệu Supabase (bảng `locations`).

export type Ward = string;

export type District = {
  name: string;
  wards: Ward[];
};

export type Province = {
  name: string;
  districts: District[];
};

export const provinces: Province[] = [
  // ===== 7 ĐƠN VỊ LÕI — DUYÊN HẢI TRUNG BỘ (sau sát nhập) =====
  {
    // TP. Huế trở thành thành phố trực thuộc TW (từ Thừa Thiên Huế)
    name: "Huế",
    districts: [
      { name: "Quận Phú Xuân", wards: ["Phú Hậu", "Phú Hội", "Phú Nhuận", "Vĩnh Ninh", "Phước Vĩnh", "Thuận Lộc", "Tây Lộc", "Kim Long", "Hương Long"] },
      { name: "Quận Thuận Hóa", wards: ["Trường An", "An Cựu", "An Đông", "An Tây", "Thủy Xuân", "Vỹ Dạ", "Xuân Phú", "Phú Thượng", "Thủy Vân"] },
      { name: "Hương Thủy", wards: ["Phú Bài", "Thủy Châu", "Thủy Dương", "Thủy Lương", "Thủy Phương", "Thủy Thanh"] },
      { name: "Hương Trà", wards: ["Tứ Hạ", "Hương Văn", "Hương Vân", "Hương Xuân", "Hương Chữ", "Hương An", "Hương Hồ"] },
      { name: "Phong Điền", wards: ["Phong Điền (TT)", "Phong Hòa", "Phong Bình", "Phong Chương", "Điền Hương", "Điền Lộc", "Phong Mỹ"] },
      { name: "Quảng Điền", wards: ["Sịa (TT)", "Quảng Phú", "Quảng Vinh", "Quảng An", "Quảng Thành", "Quảng Lợi"] },
      { name: "Phú Vang", wards: ["Thuận An", "Phú Đa (TT)", "Phú Mỹ", "Phú Hồ", "Vinh Thanh", "Phú Diên"] },
      { name: "Phú Lộc", wards: ["Phú Lộc (TT)", "Lăng Cô", "Lộc Sơn", "Lộc Bổn", "Lộc Trì", "Vinh Hiền", "Lộc Vĩnh"] },
      { name: "Nam Đông", wards: ["Khe Tre (TT)", "Hương Phú", "Hương Sơn", "Thượng Quảng", "Thượng Long"] },
      { name: "A Lưới", wards: ["A Lưới (TT)", "Hồng Vân", "Hồng Kim", "Hồng Bắc", "Quảng Nhâm", "Hương Phong"] },
    ],
  },
  {
    // Đà Nẵng (TP trực thuộc TW) = Đà Nẵng + Quảng Nam
    name: "Đà Nẵng",
    districts: [
      { name: "Hải Châu", wards: ["Hải Châu I", "Hải Châu II", "Thạch Thang", "Thanh Bình", "Thuận Phước", "Bình Hiên", "Bình Thuận", "Hòa Cường Bắc", "Hòa Cường Nam"] },
      { name: "Thanh Khê", wards: ["Tam Thuận", "Thanh Khê Đông", "Thanh Khê Tây", "Xuân Hà", "Tân Chính", "Chính Gián", "Vĩnh Trung", "Thạc Gián", "An Khê", "Hòa Khê"] },
      { name: "Sơn Trà", wards: ["Thọ Quang", "Nại Hiên Đông", "Mân Thái", "An Hải Bắc", "Phước Mỹ", "An Hải Tây", "An Hải Đông"] },
      { name: "Ngũ Hành Sơn", wards: ["Mỹ An", "Khuê Mỹ", "Hòa Quý", "Hòa Hải"] },
      { name: "Liên Chiểu", wards: ["Hòa Hiệp Bắc", "Hòa Hiệp Nam", "Hòa Khánh Bắc", "Hòa Khánh Nam", "Hòa Minh"] },
      { name: "Cẩm Lệ", wards: ["Khuê Trung", "Hòa Phát", "Hòa An", "Hòa Thọ Tây", "Hòa Thọ Đông", "Hòa Xuân"] },
      { name: "Hòa Vang", wards: ["Hòa Bắc", "Hòa Liên", "Hòa Ninh", "Hòa Sơn", "Hòa Nhơn", "Hòa Phú", "Hòa Phong", "Hòa Châu", "Hòa Tiến", "Hòa Khương", "Hòa Phước"] },
      // — Khu vực Quảng Nam (cũ) nay thuộc Đà Nẵng —
      { name: "Hội An", wards: ["Minh An", "Cẩm Phô", "Sơn Phong", "Thanh Hà", "Tân An", "Cẩm Châu", "Cửa Đại", "Cẩm Nam", "Tân Hiệp (Cù Lao Chàm)"] },
      { name: "Tam Kỳ", wards: ["An Mỹ", "An Sơn", "An Xuân", "Hòa Hương", "Tân Thạnh", "Trường Xuân", "An Phú", "Tam Thanh"] },
      { name: "Điện Bàn", wards: ["Vĩnh Điện", "Điện An", "Điện Ngọc", "Điện Nam Bắc", "Điện Nam Trung", "Điện Dương", "Điện Thắng Bắc"] },
      { name: "Duy Xuyên", wards: ["Nam Phước (TT)", "Duy Hải", "Duy Nghĩa", "Duy Thành", "Duy Vinh"] },
      { name: "Thăng Bình", wards: ["Hà Lam (TT)", "Bình Minh", "Bình Dương", "Bình Nguyên", "Bình Hải"] },
      { name: "Núi Thành", wards: ["Núi Thành (TT)", "Tam Hiệp", "Tam Hòa", "Tam Anh Bắc", "Tam Quang", "Tam Nghĩa"] },
      { name: "Đại Lộc", wards: ["Ái Nghĩa (TT)", "Đại Hiệp", "Đại Nghĩa", "Đại Hồng", "Đại Quang"] },
    ],
  },
  {
    // Quảng Ngãi = Quảng Ngãi + Kon Tum
    name: "Quảng Ngãi",
    districts: [
      { name: "TP. Quảng Ngãi", wards: ["Trần Phú", "Nguyễn Nghiêm", "Lê Hồng Phong", "Trần Hưng Đạo", "Nghĩa Chánh", "Chánh Lộ", "Nghĩa Lộ", "Nghĩa Dũng", "Tịnh Khê"] },
      { name: "Bình Sơn", wards: ["Châu Ổ (TT)", "Bình Dương", "Bình Thạnh", "Bình Đông", "Bình Trị"] },
      { name: "Sơn Tịnh", wards: ["Tịnh Hà", "Tịnh Ấn Tây", "Tịnh Phong", "Tịnh Thọ", "Tịnh Bắc"] },
      { name: "Tư Nghĩa", wards: ["La Hà (TT)", "Sông Vệ (TT)", "Nghĩa Hòa", "Nghĩa Thương", "Nghĩa Phương"] },
      { name: "Mộ Đức", wards: ["Mộ Đức (TT)", "Đức Nhuận", "Đức Thắng", "Đức Chánh", "Đức Lợi"] },
      { name: "Đức Phổ", wards: ["Nguyễn Nghiêm", "Phổ Hòa", "Phổ Văn", "Phổ Ninh", "Phổ Châu"] },
      { name: "Lý Sơn", wards: [] },
      // — Khu vực Kon Tum (cũ) —
      { name: "TP. Kon Tum", wards: ["Quang Trung", "Duy Tân", "Thắng Lợi", "Thống Nhất", "Trường Chinh"] },
      { name: "Ngọc Hồi", wards: [] },
      { name: "Đăk Hà", wards: [] },
      { name: "Sa Thầy", wards: [] },
      { name: "Kon Plông", wards: [] },
    ],
  },
  {
    // Gia Lai = Bình Định + Gia Lai (biển ở Quy Nhơn)
    name: "Gia Lai",
    districts: [
      { name: "TP. Quy Nhơn", wards: ["Trần Hưng Đạo", "Lê Lợi", "Lê Hồng Phong", "Trần Phú", "Lý Thường Kiệt", "Nguyễn Văn Cừ", "Ngô Mây", "Ghềnh Ráng", "Nhơn Bình", "Nhơn Phú", "Bùi Thị Xuân", "Nhơn Lý", "Nhơn Hải", "Nhơn Châu"] },
      { name: "An Nhơn", wards: ["Bình Định", "Đập Đá", "Nhơn Hưng", "Nhơn Thành", "Nhơn Hậu", "Nhơn An"] },
      { name: "Hoài Nhơn", wards: ["Bồng Sơn", "Tam Quan", "Hoài Hảo", "Hoài Thanh", "Hoài Hương", "Tam Quan Bắc"] },
      { name: "Tuy Phước", wards: ["Tuy Phước (TT)", "Diêu Trì (TT)", "Phước Sơn", "Phước Hòa", "Phước Nghĩa"] },
      { name: "Phù Cát", wards: ["Ngô Mây (TT)", "Cát Tiến", "Cát Hải", "Cát Khánh", "Cát Trinh"] },
      { name: "Phù Mỹ", wards: ["Phù Mỹ (TT)", "Bình Dương (TT)", "Mỹ Thành", "Mỹ Thọ", "Mỹ An"] },
      { name: "Tây Sơn", wards: ["Phú Phong (TT)", "Tây Giang", "Bình Nghi", "Tây Phú", "Bình Thành"] },
      // — Khu vực Gia Lai (cũ) —
      { name: "TP. Pleiku", wards: ["Hoa Lư", "Diên Hồng", "Ia Kring", "Hội Thương", "Yên Đỗ", "Thống Nhất"] },
      { name: "An Khê", wards: [] },
      { name: "Ayun Pa", wards: [] },
      { name: "Chư Sê", wards: [] },
      { name: "Đăk Đoa", wards: [] },
    ],
  },
  {
    // Đắk Lắk = Phú Yên + Đắk Lắk (biển ở Tuy Hòa)
    name: "Đắk Lắk",
    districts: [
      { name: "TP. Tuy Hòa", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 7", "Phường 9", "Bình Kiến", "Hòa Kiến"] },
      { name: "Sông Cầu", wards: ["Xuân Phú", "Xuân Thành", "Xuân Đài", "Xuân Yên"] },
      { name: "Đông Hòa", wards: ["Hòa Hiệp Trung", "Hòa Hiệp Bắc", "Hòa Hiệp Nam", "Hòa Vinh", "Hòa Xuân Tây"] },
      { name: "Tây Hòa", wards: ["Phú Thứ (TT)", "Hòa Bình 1", "Hòa Phong", "Hòa Mỹ Đông"] },
      // — Khu vực Đắk Lắk (cũ) —
      { name: "TP. Buôn Ma Thuột", wards: ["Tân Lập", "Tân Hòa", "Thành Công", "Thắng Lợi", "Tự An", "Ea Tam", "Tân Tiến"] },
      { name: "Buôn Hồ", wards: [] },
      { name: "Ea Kar", wards: [] },
      { name: "Krông Pắc", wards: [] },
      { name: "Cư M'gar", wards: [] },
    ],
  },
  {
    // Khánh Hòa = Khánh Hòa + Ninh Thuận
    name: "Khánh Hòa",
    districts: [
      { name: "TP. Nha Trang", wards: ["Lộc Thọ", "Tân Lập", "Phước Hải", "Vĩnh Hải", "Vĩnh Phước", "Vĩnh Nguyên", "Phước Long", "Vĩnh Hòa", "Vĩnh Trường"] },
      { name: "TP. Cam Ranh", wards: ["Cam Nghĩa", "Cam Phúc Bắc", "Cam Phúc Nam", "Cam Lộc", "Cam Lợi", "Cam Thuận", "Ba Ngòi"] },
      { name: "Ninh Hòa", wards: ["Ninh Hiệp", "Ninh Đa", "Ninh Giang", "Ninh Hà", "Ninh Diêm", "Ninh Thủy"] },
      { name: "Diên Khánh", wards: ["Diên Khánh (TT)", "Diên An", "Diên Toàn", "Diên Phú", "Diên Lạc"] },
      { name: "Vạn Ninh", wards: ["Vạn Giã (TT)", "Đại Lãnh", "Vạn Thọ", "Vạn Phước", "Vạn Long"] },
      // — Khu vực Ninh Thuận (cũ) —
      { name: "TP. Phan Rang - Tháp Chàm", wards: ["Mỹ Hải", "Mỹ Bình", "Mỹ Đông", "Đạo Long", "Đông Hải", "Văn Hải", "Tấn Tài"] },
      { name: "Ninh Hải", wards: ["Khánh Hải (TT)", "Vĩnh Hải", "Nhơn Hải", "Thanh Hải"] },
      { name: "Ninh Phước", wards: ["Phước Dân (TT)", "Phước Thuận", "An Hải", "Phước Hải"] },
      { name: "Ninh Sơn", wards: ["Tân Sơn (TT)", "Lâm Sơn", "Lương Sơn", "Quảng Sơn"] },
    ],
  },
  {
    // Quảng Trị = Quảng Bình + Quảng Trị
    name: "Quảng Trị",
    districts: [
      { name: "TP. Đông Hà", wards: ["Đông Lễ", "Đông Lương", "Đông Thanh", "Đông Giang", "Phường 1", "Phường 2", "Phường 3", "Phường 5"] },
      { name: "Thị xã Quảng Trị", wards: ["Phường 1", "Phường 2", "Phường 3", "An Đôn", "Hải Lệ"] },
      { name: "Vĩnh Linh", wards: ["Hồ Xá (TT)", "Cửa Tùng", "Bến Quan", "Vĩnh Thái", "Vĩnh Tú"] },
      { name: "Gio Linh", wards: ["Gio Linh (TT)", "Cửa Việt", "Gio Việt", "Gio Hải", "Trung Giang"] },
      { name: "Triệu Phong", wards: ["Ái Tử (TT)", "Triệu Thành", "Triệu Đông", "Triệu An", "Triệu Vân"] },
      { name: "Hải Lăng", wards: ["Hải Lăng (TT)", "Hải An", "Hải Khê", "Hải Ba", "Hải Dương"] },
      // — Khu vực Quảng Bình (cũ) —
      { name: "TP. Đồng Hới", wards: ["Hải Thành", "Đồng Phú", "Đồng Mỹ", "Bắc Lý", "Nam Lý", "Hải Đình", "Bảo Ninh"] },
      { name: "Ba Đồn", wards: ["Ba Đồn (TT)", "Quảng Long", "Quảng Thọ", "Quảng Phúc", "Quảng Thuận"] },
      { name: "Bố Trạch", wards: ["Hoàn Lão (TT)", "Phong Nha (TT)", "Thanh Trạch", "Đức Trạch", "Nhân Trạch"] },
      { name: "Lệ Thủy", wards: ["Kiến Giang (TT)", "Lệ Ninh (TT)", "Hồng Thủy", "Ngư Thủy Bắc", "Cam Thủy"] },
      { name: "Quảng Ninh", wards: ["Quán Hàu (TT)", "Hải Ninh", "Võ Ninh", "Gia Ninh", "Lương Ninh"] },
    ],
  },

  // ===== HAI ĐÔ THỊ LỚN (giữ quận để lọc; HCM sau sát nhập gồm Bình Dương + BR-VT) =====
  {
    name: "Hà Nội",
    districts: [
      "Hoàn Kiếm", "Ba Đình", "Đống Đa", "Hai Bà Trưng", "Tây Hồ", "Cầu Giấy", "Thanh Xuân",
      "Hoàng Mai", "Long Biên", "Hà Đông", "Nam Từ Liêm", "Bắc Từ Liêm", "Thanh Trì",
      "Gia Lâm", "Đông Anh", "Hoài Đức",
    ].map((name) => ({ name, wards: [] })),
  },
  {
    name: "TP. Hồ Chí Minh",
    districts: [
      "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11",
      "Quận 12", "Bình Thạnh", "Phú Nhuận", "Tân Bình", "Tân Phú", "Gò Vấp", "Bình Tân",
      "TP. Thủ Đức", "Nhà Bè", "Bình Chánh", "Hóc Môn", "Củ Chi",
      // — Bình Dương + Bà Rịa - Vũng Tàu (cũ) nay thuộc TP.HCM —
      "TP. Thủ Dầu Một", "Dĩ An", "Thuận An", "TP. Vũng Tàu", "Bà Rịa",
    ].map((name) => ({ name, wards: [] })),
  },

  // ===== CÁC TỈNH/THÀNH CÒN LẠI (sau sát nhập 2025) — mức tỉnh, bổ sung dần =====
  ...[
    "Hải Phòng", "Cần Thơ",
    "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên", "Ninh Bình",
    "Quảng Ninh", "Cao Bằng", "Lạng Sơn", "Lai Châu", "Điện Biên", "Sơn La",
    "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Lâm Đồng", "Đồng Nai", "Tây Ninh",
    "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang",
  ].map((name) => ({ name, districts: [] as District[] })),
];

// Tên các tỉnh/thành — dùng cho select cấp 1
export const provinceNames: string[] = provinces.map((p) => p.name);

// Lấy danh sách quận/huyện theo tên tỉnh (rỗng nếu không khớp)
export function districtsOf(provinceName: string): string[] {
  return provinces.find((p) => p.name === provinceName)?.districts.map((d) => d.name) ?? [];
}

// Lấy danh sách phường/xã theo tỉnh + quận/huyện (rỗng nếu không khớp)
export function wardsOf(provinceName: string, districtName: string): string[] {
  const p = provinces.find((p) => p.name === provinceName);
  return p?.districts.find((d) => d.name === districtName)?.wards ?? [];
}
