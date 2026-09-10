// ============================================================================
// DỌN LẠI CÁC TIN ĐÃ ĐĂNG CHO KHỚP CHUẨN MỚI (chốt 10/09/2026)
// ----------------------------------------------------------------------------
// Bốn việc, chỉ động vào đúng bốn chỗ trong cột `details`:
//   1. contact.phone  → 0 + 10 số  ("0905.123.456" · "+84905123456" → "0905123456")
//   2. amenities      → đúng tên danh mục ("Bảo vệ 24/7" → "An ninh 24/7")
//   3. interior       → đúng tên danh mục ("Máy lạnh" → "Điều hoà")
//   4. legal, furnish → đúng tên danh mục ("Sổ hồng riêng" → "Sổ đỏ / Sổ hồng chính chủ")
//
// KHÔNG đụng tới tiêu đề, mô tả, giá, ảnh. Mục nào ngoài danh mục thì GIỮ NGUYÊN.
//
// CÁCH DÙNG:
//   node scripts/chuan-hoa-tin-da-dang.mjs              → xem trước (không ghi gì)
//   node scripts/chuan-hoa-tin-da-dang.mjs --ghi        → ghi thật vào Supabase
//   node scripts/chuan-hoa-tin-da-dang.mjs --hoan-tac <file-sao-luu.json>
//
// Ghi thật cần khoá service_role trong .env.local: SUPABASE_SERVICE_ROLE_KEY=...
//
// BẢNG ĐỒNG NGHĨA dưới đây là BẢN SAO của src/lib/chuanHoaThuocTinh.ts (file .ts
// không chạy thẳng bằng node được). Sửa bên kia thì nhớ sửa cả bên này.
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_DOC = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const KEY_GHI = env.SUPABASE_SERVICE_ROLE_KEY;

// ── SỐ ĐIỆN THOẠI (giống src/lib/phone.ts) ─────────────────────────────────
function chiSo(s) {
  let d = (s ?? "").replace(/[^0-9]/g, "");
  if (!d) return "";
  if (d.startsWith("0084")) d = d.slice(4);
  else if (d.startsWith("84") && d.length >= 11) d = d.slice(2);
  if (!d.startsWith("0")) d = "0" + d;
  return d;
}
// Ô hay chứa HAI số ("0707.435.555 / 0918.339.739") — phải tách, không dán liền.
const tachPhan = (raw) =>
  (raw ?? "").split(/[|;,\n/]+|\s+-\s+|\s{2,}/).map((s) => s.trim()).filter(Boolean);
const hopLe = (s) => s.length >= 10 && s.length <= 11;
function chuanHoaSdt(raw) {
  const t = (raw ?? "").trim();
  if (!t) return "";
  for (const phan of tachPhan(t)) { const s = chiSo(phan); if (hopLe(s)) return s; }
  const gop = chiSo(t);
  return hopLe(gop) ? gop : t;
}
const tachNhieuSdt = (o) => [...new Set(tachPhan(o).map(chiSo).filter(hopLe))];

// ── DANH MỤC CHUẨN (giống src/lib/listingSpec.ts) ──────────────────────────
const TIEN_ICH = [
  "Hồ bơi", "Phòng gym", "Công viên cây xanh", "Khu BBQ", "Sân chơi trẻ em", "Thang máy",
  "Hầm / bãi đỗ xe", "An ninh 24/7", "Camera giám sát", "Khu thương mại",
  "Gần biển", "Gần sông / hồ", "Gần chợ / siêu thị", "Gần trường học", "Gần bệnh viện",
  "Gần TTTM", "Gần công viên", "Gần sân bay", "Mặt tiền đường lớn", "Gần khu hành chính",
];
const NOI_THAT = [
  "Điều hoà", "Tủ lạnh", "Máy giặt", "Bếp từ / gas", "Máy hút mùi", "Tủ bếp",
  "Giường ngủ", "Tủ quần áo", "Sofa", "Bàn ăn", "Bình nóng lạnh", "Rèm cửa",
  "Tivi", "Lò vi sóng", "Bàn làm việc", "Đèn trang trí",
];
const PHAP_LY = [
  "Sổ đỏ / Sổ hồng chính chủ", "Hợp đồng mua bán", "Đang chờ sổ",
  "Sổ chung / vi bằng", "Đang cập nhật",
];
const MUC_NOI_THAT = ["Bàn giao thô", "Nội thất cơ bản", "Nội thất đầy đủ", "Nội thất cao cấp"];

// ── ĐỒNG NGHĨA (giống src/lib/chuanHoaThuocTinh.ts) ────────────────────────
const DN_TIEN_ICH = {
  "Bảo vệ 24/7": "An ninh 24/7", "Bảo vệ 24 24": "An ninh 24/7", "An ninh 24 24": "An ninh 24/7",
  "Bảo vệ": "An ninh 24/7", "An ninh": "An ninh 24/7", "Lễ tân 24/7": "An ninh 24/7",
  "Camera": "Camera giám sát", "Camera an ninh": "Camera giám sát",
  "Hầm xe": "Hầm / bãi đỗ xe", "Bãi xe": "Hầm / bãi đỗ xe", "Chỗ để xe": "Hầm / bãi đỗ xe",
  "Bãi đỗ xe": "Hầm / bãi đỗ xe", "Gara": "Hầm / bãi đỗ xe",
  "Bể bơi": "Hồ bơi", "Hồ bơi riêng": "Hồ bơi", "Hồ bơi vô cực": "Hồ bơi",
  "Gym": "Phòng gym", "Phòng tập": "Phòng gym",
  "Cây xanh": "Công viên cây xanh", "Công viên nội khu": "Công viên cây xanh",
  "BBQ": "Khu BBQ", "Sân chơi": "Sân chơi trẻ em", "Khu vui chơi trẻ em": "Sân chơi trẻ em",
  "Siêu thị": "Khu thương mại", "Trung tâm thương mại nội khu": "Khu thương mại",
  "Gần chợ": "Gần chợ / siêu thị", "Gần siêu thị": "Gần chợ / siêu thị",
  "Gần trường": "Gần trường học", "Gần trường đại học": "Gần trường học",
  "Gần sông": "Gần sông / hồ", "Gần hồ": "Gần sông / hồ", "View sông": "Gần sông / hồ",
  "Gần bãi tắm": "Gần biển", "View biển": "Gần biển", "Sát biển": "Gần biển",
  "Gần trung tâm thương mại": "Gần TTTM", "Gần bệnh viện đa khoa": "Gần bệnh viện",
  "Mặt tiền đường": "Mặt tiền đường lớn", "Đường lớn": "Mặt tiền đường lớn",
  "Mặt tiền kinh doanh": "Mặt tiền đường lớn", "Đường ô tô tránh": "Mặt tiền đường lớn",
  "Gần UBND": "Gần khu hành chính", "Gần trung tâm hành chính": "Gần khu hành chính",
};
const DN_NOI_THAT = {
  "Máy lạnh": "Điều hoà", "Máy điều hoà": "Điều hoà", "Điều hòa": "Điều hoà",
  "Máy nước nóng": "Bình nóng lạnh", "Nóng lạnh": "Bình nóng lạnh", "Bình nước nóng": "Bình nóng lạnh",
  "Bếp ga": "Bếp từ / gas", "Bếp gas": "Bếp từ / gas", "Bếp từ": "Bếp từ / gas", "Bếp điện": "Bếp từ / gas",
  "Hút mùi": "Máy hút mùi", "Kệ bếp": "Tủ bếp", "Giường": "Giường ngủ", "Tủ áo": "Tủ quần áo",
  "Salon": "Sofa", "Ghế sofa": "Sofa", "Bàn ghế ăn": "Bàn ăn", "Rèm": "Rèm cửa",
  "TV": "Tivi", "Ti vi": "Tivi", "Máy sấy": "Máy giặt", "Lò nướng": "Lò vi sóng",
  "Bàn học": "Bàn làm việc", "Đèn chùm": "Đèn trang trí",
};
const DN_PHAP_LY = {
  "Sổ hồng riêng": "Sổ đỏ / Sổ hồng chính chủ", "Sổ hồng": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ hồng lâu dài": "Sổ đỏ / Sổ hồng chính chủ", "Sổ đỏ": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ đỏ riêng": "Sổ đỏ / Sổ hồng chính chủ", "Sổ riêng": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ hồng chính chủ": "Sổ đỏ / Sổ hồng chính chủ", "Sổ đỏ chính chủ": "Sổ đỏ / Sổ hồng chính chủ",
  "Chính chủ": "Sổ đỏ / Sổ hồng chính chủ", "Đã có sổ": "Sổ đỏ / Sổ hồng chính chủ",
  "Sẵn sổ": "Sổ đỏ / Sổ hồng chính chủ", "HĐMB": "Hợp đồng mua bán", "Hợp đồng": "Hợp đồng mua bán",
  "Chờ sổ": "Đang chờ sổ", "Đang làm sổ": "Đang chờ sổ",
  "Sổ chung": "Sổ chung / vi bằng", "Vi bằng": "Sổ chung / vi bằng", "Giấy tay": "Sổ chung / vi bằng",
  "Chưa rõ": "Đang cập nhật",
};
const DN_MUC_NOI_THAT = {
  "Cơ bản": "Nội thất cơ bản", "Đầy đủ": "Nội thất đầy đủ", "Full nội thất": "Nội thất đầy đủ",
  "Full": "Nội thất đầy đủ", "Cao cấp": "Nội thất cao cấp", "Đầy đủ / Cao cấp": "Nội thất cao cấp",
  "Nội thất xịn": "Nội thất cao cấp", "Thô": "Bàn giao thô", "Không nội thất": "Bàn giao thô",
  "Nhà trống": "Bàn giao thô",
};

const khoa = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function bangTra(danhMuc, dongNghia) {
  const m = new Map();
  for (const t of danhMuc) m.set(khoa(t), t);
  for (const [v, c] of Object.entries(dongNghia)) m.set(khoa(v), c);
  return m;
}
const TRA_TI = bangTra(TIEN_ICH, DN_TIEN_ICH);
const TRA_NT = bangTra(NOI_THAT, DN_NOI_THAT);
const TRA_PL = bangTra(PHAP_LY, DN_PHAP_LY);
const TRA_MN = bangTra(MUC_NOI_THAT, DN_MUC_NOI_THAT);

function dichDs(ds, tra) {
  const ra = [];
  for (const v of ds ?? []) {
    const t = (v ?? "").trim();
    if (!t) continue;
    const c = tra.get(khoa(t)) ?? t;
    if (!ra.includes(c)) ra.push(c);
  }
  return ra;
}
const dichMot = (v, tra) => (v && v.trim() ? (tra.get(khoa(v)) ?? v.trim()) : v);

// ── Chạy ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const GHI = args.includes("--ghi");
const iHoan = args.indexOf("--hoan-tac");

async function sb(path, init = {}) {
  const key = init.method && init.method !== "GET" ? KEY_GHI : KEY_DOC;
  const r = await fetch(URL_SB + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 200));
  return r.status === 204 ? null : r.json();
}

if (iHoan >= 0) {
  const backup = JSON.parse(readFileSync(args[iHoan + 1], "utf8"));
  if (!KEY_GHI) {
    console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
    process.exit(1);
  }
  for (const t of backup) {
    await sb(`/rest/v1/listings?id=eq.${t.id}`, {
      method: "PATCH",
      body: JSON.stringify({ details: t.details }),
    });
    console.log("hoàn tác:", t.title.slice(0, 60));
  }
  console.log(`Đã trả lại nguyên trạng ${backup.length} tin.`);
  process.exit(0);
}

const tin = await sb("/rest/v1/listings?select=id,title,details&order=created_at.asc");
const doi = [];
for (const t of tin) {
  const d = t.details ?? {};
  const moi = { ...d };
  const ghiChu = [];

  const sdtCu = d.contact?.phone ?? "";
  const sdtMoi = chuanHoaSdt(sdtCu);
  if (sdtCu && sdtMoi !== sdtCu) {
    // Ô có hai số thì tách ra giữ ĐỦ: phone = số đầu (số hiện lên trang tin),
    // phones = tất cả (chìa khoá ghép tin về đúng tài khoản khách sau này).
    const dsSdt = tachNhieuSdt(sdtCu);
    moi.contact = {
      ...d.contact,
      phone: sdtMoi,
      ...(dsSdt.length > 1 ? { phones: dsSdt } : {}),
    };
    ghiChu.push(`SĐT ${sdtCu} → ${dsSdt.length > 1 ? dsSdt.join(" + ") : sdtMoi}`);
  }

  const tiCu = d.amenities ?? [];
  const tiMoi = dichDs(tiCu, TRA_TI);
  if (JSON.stringify(tiCu) !== JSON.stringify(tiMoi)) {
    moi.amenities = tiMoi;
    ghiChu.push("tiện ích");
  }

  const ntCu = d.interior ?? [];
  const ntMoi = dichDs(ntCu, TRA_NT);
  if (JSON.stringify(ntCu) !== JSON.stringify(ntMoi)) {
    moi.interior = ntMoi;
    ghiChu.push("nội thất");
  }

  const plMoi = dichMot(d.legal, TRA_PL);
  if (d.legal && plMoi !== d.legal) {
    moi.legal = plMoi;
    ghiChu.push(`pháp lý ${d.legal} → ${plMoi}`);
  }

  const mnMoi = dichMot(d.furnish, TRA_MN);
  if (d.furnish && mnMoi !== d.furnish) {
    moi.furnish = mnMoi;
    ghiChu.push(`mức nội thất ${d.furnish} → ${mnMoi}`);
  }

  if (ghiChu.length) doi.push({ id: t.id, title: t.title, details: d, moi, ghiChu });
}

console.log(`Tổng tin: ${tin.length} · cần dọn: ${doi.length}\n`);
for (const t of doi) {
  console.log(`· ${t.title.slice(0, 55).padEnd(55)} ${t.ghiChu.join(" · ")}`);
}

if (!GHI) {
  console.log("\n(Chưa ghi gì. Thêm --ghi để ghi thật.)");
  process.exit(0);
}
if (!KEY_GHI) {
  console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const fBackup = resolve(ROOT, `.sao-luu-details-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(
  fBackup,
  JSON.stringify(doi.map(({ id, title, details }) => ({ id, title, details })), null, 1),
  "utf8",
);
console.log("\nĐã sao lưu bản cũ:", fBackup);

for (const t of doi) {
  await sb(`/rest/v1/listings?id=eq.${t.id}`, {
    method: "PATCH",
    body: JSON.stringify({ details: t.moi }),
  });
  console.log("đã dọn:", t.title.slice(0, 60));
}
console.log(`Xong ${doi.length} tin.`);
