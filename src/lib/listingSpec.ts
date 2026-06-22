// Bộ thuộc tính BĐS theo loại hình — dùng chung cho TRANG CHI TIẾT (hiển thị)
// và FORM ĐĂNG TIN (người bán chọn). Để sẵn đầy đủ mục, sản phẩm nào có thì điền.

export type Field = {
  key: string;
  label: string;
  type: "select" | "text" | "number";
  options?: string[];
  unit?: string;
  placeholder?: string;
};

export const directions = ["Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"];

// Tình trạng pháp lý
export const legalOptions = [
  "Sổ đỏ / Sổ hồng chính chủ",
  "Hợp đồng mua bán",
  "Đang chờ sổ",
  "Sổ chung / vi bằng",
  "Đang cập nhật",
];

// Tình trạng nội thất (mức độ)
export const furnishLevels = [
  "Bàn giao thô",
  "Nội thất cơ bản",
  "Nội thất đầy đủ",
  "Nội thất cao cấp",
];

// Tiện ích — chia nhóm Nội khu / Xung quanh (đầy đủ để người đăng tick)
export const amenityGroups: { group: string; items: string[] }[] = [
  {
    group: "Tiện ích nội khu",
    items: ["Hồ bơi", "Phòng gym", "Công viên cây xanh", "Khu BBQ", "Sân chơi trẻ em", "Thang máy", "Hầm / bãi đỗ xe", "An ninh 24/7", "Camera giám sát", "Khu thương mại"],
  },
  {
    group: "Tiện ích xung quanh",
    items: ["Gần biển", "Gần sông / hồ", "Gần chợ / siêu thị", "Gần trường học", "Gần bệnh viện", "Gần TTTM", "Gần công viên", "Gần sân bay", "Mặt tiền đường lớn", "Gần khu hành chính"],
  },
];

// Nội thất chi tiết (đầy đủ để người đăng tick)
export const interiorItems = [
  "Điều hoà", "Tủ lạnh", "Máy giặt", "Bếp từ / gas", "Máy hút mùi", "Tủ bếp",
  "Giường ngủ", "Tủ quần áo", "Sofa", "Bàn ăn", "Bình nóng lạnh", "Rèm cửa",
  "Tivi", "Lò vi sóng", "Bàn làm việc", "Đèn trang trí",
];

// Bộ trường riêng theo từng loại hình
export type CategorySpec = { label: string; match: string[]; fields: Field[] };

export const categorySpecs: CategorySpec[] = [
  {
    label: "Căn hộ / Chung cư",
    match: ["Căn hộ", "Chung cư"],
    fields: [
      { key: "loaiCanho", label: "Loại hình căn hộ", type: "select", options: ["Chung cư", "Duplex", "Penthouse", "Studio", "Officetel", "Shophouse khối đế"] },
      { key: "beds", label: "Số phòng ngủ", type: "select", options: ["1", "2", "3", "4", "5+"] },
      { key: "baths", label: "Số phòng tắm", type: "select", options: ["1", "2", "3", "4+"] },
      { key: "floor", label: "Tầng số", type: "text", placeholder: "VD: Tầng 18" },
      { key: "block", label: "Block / Toà / Tháp", type: "text", placeholder: "VD: Block A" },
      { key: "balcony", label: "Hướng ban công", type: "select", options: directions },
      { key: "furnish", label: "Tình trạng nội thất", type: "select", options: furnishLevels },
    ],
  },
  {
    label: "Nhà phố / Biệt thự / Shophouse",
    match: ["Nhà phố", "Villa", "Biệt thự", "Shophouse"],
    fields: [
      { key: "beds", label: "Số phòng ngủ", type: "select", options: ["2", "3", "4", "5", "6+"] },
      { key: "baths", label: "Số phòng tắm", type: "select", options: ["1", "2", "3", "4+"] },
      { key: "floors", label: "Số tầng", type: "select", options: ["1", "2", "3", "4", "5+"] },
      { key: "frontage", label: "Mặt tiền", type: "number", unit: "m" },
      { key: "roadWidth", label: "Đường vào", type: "number", unit: "m" },
      { key: "direction", label: "Hướng nhà", type: "select", options: directions },
      { key: "furnish", label: "Tình trạng nội thất", type: "select", options: furnishLevels },
    ],
  },
  {
    label: "Đất nền / Đất",
    match: ["Đất nền", "Đất"],
    fields: [
      { key: "landType", label: "Loại đất", type: "select", options: ["Đất thổ cư", "Đất ở đô thị", "Đất nền dự án", "Đất vườn", "Đất khác"] },
      { key: "frontage", label: "Mặt tiền", type: "number", unit: "m" },
      { key: "roadWidth", label: "Đường vào", type: "number", unit: "m" },
      { key: "direction", label: "Hướng đất", type: "select", options: directions },
      { key: "blocks", label: "Số lô / nền", type: "text", placeholder: "VD: Lô A12" },
    ],
  },
  {
    label: "Condotel / Nghỉ dưỡng",
    match: ["Condotel"],
    fields: [
      { key: "beds", label: "Loại phòng", type: "select", options: ["Studio", "1 phòng ngủ", "2 phòng ngủ", "3 phòng ngủ"] },
      { key: "view", label: "Hướng view", type: "select", options: ["Biển", "Thành phố", "Hồ bơi", "Sông / núi"] },
      { key: "furnish", label: "Tình trạng nội thất", type: "select", options: furnishLevels },
      { key: "profit", label: "Cam kết lợi nhuận", type: "text", placeholder: "VD: 8%/năm" },
      { key: "operator", label: "Đơn vị vận hành", type: "text" },
    ],
  },
  {
    label: "Đất công nghiệp / Kho xưởng",
    match: ["công nghiệp", "xưởng", "Kho"],
    fields: [
      { key: "frontage", label: "Mặt tiền", type: "number", unit: "m" },
      { key: "roadWidth", label: "Đường container", type: "number", unit: "m" },
      { key: "power", label: "Công suất điện", type: "text", placeholder: "VD: 560 KVA" },
      { key: "pccc", label: "Hệ thống PCCC", type: "select", options: ["Đã có", "Chưa có"] },
      { key: "term", label: "Thời hạn sử dụng đất", type: "text", placeholder: "VD: Đến 2068" },
    ],
  },
];

export function specForType(type: string): CategorySpec {
  return (
    categorySpecs.find((c) => c.match.some((m) => type.toLowerCase().includes(m.toLowerCase()))) ??
    categorySpecs[0]
  );
}

// Loại tin & loại hình BĐS cho form đăng tin
export const demandTypes = ["Cần bán", "Cho thuê", "Dự án"];
export const propertyCategories = categorySpecs.map((c) => c.label);
