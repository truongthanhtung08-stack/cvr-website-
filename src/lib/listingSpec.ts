// Bộ thuộc tính BĐS theo loại hình — dùng chung cho TRANG CHI TIẾT (hiển thị)
// và FORM ĐĂNG TIN (người bán chọn). Để sẵn đầy đủ mục, sản phẩm nào có thì điền.

export type Field = {
  key: string;
  label: string;
  type: "select" | "text" | "number";
  options?: string[];
  unit?: string;
  placeholder?: string;
  // THÔNG TIN CHÍNH của loại hình này → nằm ở khối "Thông tin chính" trong form
  // và hiện ngay đầu trang tin. Mục chính là mục BẮT BUỘC phải có (xem `main`
  // đi kèm `batBuoc`). Không đánh dấu = đặc điểm, để trống thì web không hiện.
  main?: boolean;
  batBuoc?: boolean;
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

// Bộ trường riêng theo từng loại hình.
// ⚠️ KHÔNG để "Hướng" và "Tình trạng nội thất" ở đây — chúng là trường DÙNG CHUNG,
//    form tự thêm 1 lần cho mọi loại (tránh lặp). Ở đây chỉ đặc điểm ĐẶC THÙ theo loại.
// `match`: từ khoá nhận diện loại hình (đối chiếu nhãn thật ở filters.ts). Thứ tự
//    trong mảng = ĐỘ ƯU TIÊN (specForType lấy khớp ĐẦU TIÊN) — loại đặc thù đứng trước
//    loại chung, vd "Đất công nghiệp" phải khớp Kho xưởng TRƯỚC khi khớp "Đất".
export type CategorySpec = { label: string; match: string[]; fields: Field[] };

const floorsField: Field = { key: "floors", label: "Số tầng", type: "select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"], main: true, batBuoc: true };
// Kích thước lô: mặt tiền = CHIỀU NGANG, depth = CHIỀU DÀI (chiều sâu). Đặt cạnh nhau
// cho mọi loại gắn với thửa đất (nhà, đất) để nhập/hiển thị "ngang × dài" khoa học.
const frontageField: Field = { key: "frontage", label: "Mặt tiền (chiều ngang)", type: "number", unit: "m", main: true, batBuoc: true };
const depthField: Field = { key: "depth", label: "Chiều dài (chiều sâu)", type: "number", unit: "m", main: true };
// (giữ nguyên nhãn "Chiều dài (chiều sâu)" — người đăng hay nhầm với chiều cao)
const roadField: Field = { key: "roadWidth", label: "Đường vào", type: "number", unit: "m", main: true, batBuoc: true };

// Mỗi LOẠI HÌNH có bộ đặc điểm ĐẶC THÙ riêng. Thứ tự = ĐỘ ƯU TIÊN khớp
// (loại đặc thù đứng trước loại chung: Biệt thự/Shophouse trước "nhà", Kho xưởng trước "đất").
export const categorySpecs: CategorySpec[] = [
  {
    label: "Condotel / Nghỉ dưỡng",
    match: ["condotel", "nghỉ dưỡng"],
    fields: [
      { key: "roomType", label: "Loại phòng", type: "select", options: ["Studio", "1 phòng ngủ", "2 phòng ngủ", "3 phòng ngủ"], main: true, batBuoc: true },
      { key: "view", label: "Hướng view", type: "select", options: ["Biển", "Thành phố", "Hồ bơi", "Sông / núi"] },
      { key: "profit", label: "Cam kết lợi nhuận", type: "text", placeholder: "VD: 8%/năm" },
      { key: "operator", label: "Đơn vị vận hành", type: "text" },
    ],
  },
  // CHUNG CƯ và CĂN HỘ là HAI loại hình RIÊNG BIỆT (yêu cầu 13/8/2026) — trước đây
  // gộp chung một bộ đặc điểm. "Chung cư" phải đứng TRƯỚC "Căn hộ" vì so khớp lấy
  // mục đầu tiên trúng từ khoá. Cả hai đều có Hướng ban công; "Hướng nhà / đất" là
  // trường DÙNG CHUNG do form tự thêm cho mọi loại nên không khai lại ở đây.
  {
    label: "Chung cư",
    match: ["chung cư"],
    fields: [
      { key: "floor", label: "Tầng số (căn)", type: "text", placeholder: "VD: Tầng 18", main: true, batBuoc: true },
      { key: "block", label: "Block / Toà / Tháp", type: "text", placeholder: "VD: Block A" },
      { key: "buildingFloors", label: "Tổng số tầng toà", type: "text", placeholder: "VD: 30 tầng" },
      { key: "balcony", label: "Hướng ban công", type: "select", options: directions },
      { key: "view", label: "Hướng view", type: "select", options: ["Biển", "Thành phố", "Hồ bơi", "Sông / công viên", "Nội khu"] },
    ],
  },
  {
    label: "Căn hộ",
    match: ["căn hộ", "officetel", "duplex", "penthouse", "studio"],
    fields: [
      { key: "loaiCanho", label: "Loại hình căn hộ", type: "select", options: ["Căn hộ dịch vụ", "Duplex", "Penthouse", "Studio", "Officetel"] },
      { key: "floor", label: "Tầng số (căn)", type: "text", placeholder: "VD: Tầng 18", main: true, batBuoc: true },
      { key: "block", label: "Block / Toà / Tháp", type: "text", placeholder: "VD: Block A" },
      { key: "buildingFloors", label: "Tổng số tầng toà", type: "text", placeholder: "VD: 30 tầng" },
      { key: "balcony", label: "Hướng ban công", type: "select", options: directions },
      { key: "view", label: "Hướng view", type: "select", options: ["Biển", "Thành phố", "Hồ bơi", "Sông / công viên", "Nội khu"] },
    ],
  },
  {
    label: "Đất công nghiệp / Nhà xưởng / Kho bãi",
    match: ["công nghiệp", "xưởng", "kho bãi", "nhà kho", "kho"],
    fields: [
      { key: "usableArea", label: "Diện tích xưởng/kho", type: "number", unit: "m²", main: true, batBuoc: true },
      { key: "roadWidth", label: "Đường container", type: "number", unit: "m", main: true, batBuoc: true },
      { key: "power", label: "Công suất điện", type: "text", placeholder: "VD: 560 KVA" },
      { key: "pccc", label: "Hệ thống PCCC", type: "select", options: ["Đã có", "Chưa có"] },
      { key: "crane", label: "Cẩu trục / tải nền", type: "text", placeholder: "VD: 5 tấn/m²" },
      { key: "term", label: "Thời hạn sử dụng đất", type: "text", placeholder: "VD: Đến 2068" },
    ],
  },
  {
    label: "Văn phòng / Mặt bằng kinh doanh",
    match: ["văn phòng", "mặt bằng", "cửa hàng", "kinh doanh"],
    fields: [
      { key: "usableArea", label: "Diện tích sử dụng", type: "number", unit: "m²", main: true, batBuoc: true },
      { key: "floor", label: "Tầng số", type: "text", placeholder: "VD: Tầng 3", main: true },
      frontageField,
      roadField,
      { key: "grade", label: "Hạng toà nhà", type: "select", options: ["Hạng A", "Hạng B", "Hạng C", "Nhà phố"] },
    ],
  },
  {
    label: "Biệt thự / Villa",
    match: ["biệt thự", "villa", "liền kề"],
    fields: [
      floorsField,
      frontageField,
      depthField,
      roadField,
      { key: "gardenArea", label: "Diện tích sân vườn", type: "number", unit: "m²" },
      { key: "pool", label: "Hồ bơi riêng", type: "select", options: ["Có", "Không"] },
      { key: "view", label: "View / cảnh quan", type: "select", options: ["Biển", "Sông / hồ", "Sân golf", "Công viên", "Nội khu"] },
    ],
  },
  {
    label: "Shophouse / Nhà phố thương mại",
    match: ["shophouse", "nhà phố thương mại", "thương mại"],
    fields: [
      floorsField,
      frontageField,
      depthField,
      roadField,
      { key: "bizFloors", label: "Số tầng kinh doanh", type: "select", options: ["1", "2", "3", "Cả toà"], main: true },
      { key: "corner", label: "Vị trí", type: "select", options: ["Lô góc 2 mặt tiền", "1 mặt tiền", "Trong khu"] },
    ],
  },
  {
    label: "Nhà mặt phố",
    match: ["nhà mặt phố", "mặt phố", "mặt tiền"],
    fields: [
      floorsField,
      frontageField,
      depthField,
      roadField,
      { key: "corner", label: "Vị trí", type: "select", options: ["Lô góc 2 mặt tiền", "1 mặt tiền"] },
    ],
  },
  {
    label: "Nhà trọ / Phòng trọ",
    match: ["nhà trọ", "phòng trọ", "trọ"],
    fields: [
      { key: "rooms", label: "Số phòng cho thuê", type: "number", main: true, batBuoc: true },
      { key: "roomArea", label: "Diện tích mỗi phòng", type: "number", unit: "m²", main: true, batBuoc: true },
      { key: "wc", label: "Vệ sinh", type: "select", options: ["Khép kín", "Chung"], main: true, batBuoc: true },
      floorsField,
    ],
  },
  {
    label: "Nhà riêng",
    match: ["nhà riêng", "nhà ngõ", "nhà hẻm", "nhà"],
    fields: [
      floorsField,
      frontageField,
      depthField,
      roadField,
    ],
  },
  {
    label: "Đất nền / Đất",
    match: ["đất nền", "đất nông nghiệp", "đất"],
    fields: [
      { key: "landType", label: "Loại đất", type: "select", options: ["Đất thổ cư", "Đất ở đô thị", "Đất nền dự án", "Đất nông nghiệp", "Đất vườn", "Đất khác"], main: true, batBuoc: true },
      frontageField,
      depthField,
      roadField,
      { key: "blocks", label: "Số lô / nền", type: "text", placeholder: "VD: Lô A12" },
      { key: "shape", label: "Hình dạng lô", type: "select", options: ["Vuông vức", "Nở hậu", "Thóp hậu", "Chữ L", "Khác"] },
    ],
  },
];

// ── TRƯỜNG RIÊNG CHO TIN CHO THUÊ ───────────────────────────────────────────
// Ba việc người thuê nào cũng hỏi trước khi đi xem. Áp cho MỌI loại hình nhưng
// CHỈ khi tin là cho thuê, nên để riêng chứ không nhét vào categorySpecs.
export const rentFields: Field[] = [
  { key: "moveIn", label: "Thời gian dự kiến vào ở", type: "text", placeholder: "VD: Vào ở ngay" },
  { key: "elecPrice", label: "Giá điện", type: "text", placeholder: "VD: 3.500đ/kWh · theo nhà nước" },
  { key: "waterPrice", label: "Giá nước", type: "text", placeholder: "VD: 15.000đ/m³ · theo nhà nước" },
];

// Bộ đặc điểm ĐẦY ĐỦ của một tin = đặc điểm theo LOẠI HÌNH (+ phần cho thuê nếu có).
// Dùng chung cho form đăng tin và trang chi tiết để hai bên không bao giờ lệch nhau.
export function fieldsFor(type: string, purpose?: string): Field[] {
  const base = specForType(type).fields;
  return purpose === "thue" ? [...base, ...rentFields] : base;
}

// ── TÁCH "THÔNG TIN CHÍNH" VÀ "ĐẶC ĐIỂM" ───────────────────────────────────
// Mỗi loại hình có bộ thông tin chính riêng: đất thì là chiều ngang · chiều dài ·
// đường vào · loại đất; căn hộ thì là tầng số; nhà thì là số tầng · mặt tiền ·
// đường vào… Phần còn lại xuống khối Đặc điểm. Mục nào người đăng để trống thì
// trang tin KHÔNG hiện — không bao giờ để ô trống lửng lơ.
export function fieldsSplit(type: string, purpose?: string): { chinh: Field[]; dacDiem: Field[] } {
  const all = fieldsFor(type, purpose);
  return { chinh: all.filter((f) => f.main), dacDiem: all.filter((f) => !f.main) };
}

// Những mục BẮT BUỘC của loại hình đang chọn còn đang để trống — form chặn đăng
// và chỉ đúng tên mục còn thiếu, không báo chung chung.
export function thieuMucBatBuoc(
  type: string,
  purpose: string | undefined,
  giaTri: Record<string, string>,
): string[] {
  return fieldsFor(type, purpose)
    .filter((f) => f.batBuoc && !(giaTri[f.key] ?? "").trim())
    .map((f) => f.label);
}

// ── MỤC NÀO KHÔNG THUỘC LOẠI HÌNH THÌ ĐỪNG HIỆN ─────────────────────────────
// Đất nền không có phòng ngủ/phòng tắm/diện tích xây dựng; kho xưởng và mặt bằng
// không có phòng ngủ. Hiện ra chỉ làm form dài và rối, người đăng phân vân không
// biết có phải điền không. Dùng chung cho form đăng tin của khách và của admin.
const KHONG_PHONG_NGU = ["Đất nền / Đất", "Đất công nghiệp / Nhà xưởng / Kho bãi", "Văn phòng / Mặt bằng kinh doanh"];
const KHONG_PHONG_TAM = ["Đất nền / Đất", "Đất công nghiệp / Nhà xưởng / Kho bãi"];
const KHONG_DT_XAY_DUNG = ["Đất nền / Đất"];

export function coPhongNgu(type: string): boolean {
  return !!type && !KHONG_PHONG_NGU.includes(specForType(type).label);
}
export function coPhongTam(type: string): boolean {
  return !!type && !KHONG_PHONG_TAM.includes(specForType(type).label);
}
export function coDienTichXayDung(type: string): boolean {
  return !!type && !KHONG_DT_XAY_DUNG.includes(specForType(type).label);
}

// Bộ tối giản cho loại không xác định ("Bất động sản khác") — chỉ dùng trường chung.
const genericSpec: CategorySpec = { label: "Bất động sản khác", match: [], fields: [] };

// Nhận diện bộ đặc điểm theo NHÃN LOẠI HÌNH thật. Khớp theo độ ưu tiên (mảng trên);
// không khớp gì → bộ tối giản (KHÔNG mặc định về Căn hộ như trước).
export function specForType(type: string): CategorySpec {
  const t = type.toLowerCase();
  return categorySpecs.find((c) => c.match.some((m) => t.includes(m))) ?? genericSpec;
}

// Loại tin cho form đăng tin — có cả tin RAO BÁN/CHO THUÊ và tin TÌM MUA/TÌM THUÊ.
//   Cần bán · Cho thuê  → người có bất động sản
//   Cần mua · Cần thuê  → người đang tìm bất động sản
export const demandTypes = ["Cần bán", "Cho thuê", "Cần mua", "Cần thuê", "Dự án"];

// Nhu cầu (nhãn form) → mục đích lưu trong dữ liệu
export function purposeOfDemand(demand: string): "ban" | "thue" | "mua" | "can-thue" {
  if (demand === "Cho thuê") return "thue";
  if (demand === "Cần mua") return "mua";
  if (demand === "Cần thuê") return "can-thue";
  return "ban";
}

// Mục đích → nhãn hiển thị
export function demandOfPurpose(purpose?: string): string {
  if (purpose === "thue") return "Cho thuê";
  if (purpose === "mua") return "Cần mua";
  if (purpose === "can-thue") return "Cần thuê";
  return "Cần bán";
}
export const propertyCategories = categorySpecs.map((c) => c.label);
