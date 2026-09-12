// ════════════════════════════════════════════════════════════════════════════
// SOÁT KHO ẢNH — MỘT LỆNH, BIẾT NGAY KHO CÓ SẠCH KHÔNG
//
// VÌ SAO CÓ FILE NÀY: ngày 12/09/2026 Supabase doạ khoá dự án vì vượt hạn mức,
// mà nhìn dung lượng kho thì thấy vẫn trống (327 MB / 1 GB) nên không ai ngờ.
// Thủ phạm là BĂNG THÔNG: trang chủ bắt mỗi khách tải 65 MB ảnh. Loại bệnh này
// không phát ra triệu chứng cho tới lúc bị khoá.
//
// Nên cần một lệnh SOÁT: chạy là biết kho đang lệch chuẩn ở đâu, và phải gõ
// lệnh nào để chữa. Chạy mỗi tháng một lần, hoặc sau mỗi đợt nhập tin.
//
// CHUẨN ẢNH CỦA WEB NÀY (mọi ảnh trong kho phải đạt):
//   ① Không có tệp nào không ai dùng          → don-kho-anh.mjs
//   ② Không ảnh nào quá 1 MB                  → nen-anh-nang.mjs
//   ③ Ảnh đang dùng phải có bản nhỏ ở nho/    → tao-anh-nho.mjs
//   ④ Không còn video nằm trong kho           → đưa lên YouTube
//   ⑤ Không mượn ảnh của sàn khác             → chủ dự án quyết
//
//   node scripts/soat-kho-anh.mjs
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(GOC, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "listings";
if (!KHOA) {
  console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}`, "Content-Type": "application/json" };
const MB = (b) => (b / 1048576).toFixed(1) + " MB";

async function liet(prefix) {
  let ra = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${URL_}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ prefix, limit: 1000, offset }),
    });
    const p = await r.json();
    if (!Array.isArray(p) || !p.length) break;
    ra = ra.concat(p);
    if (p.length < 1000) break;
  }
  return ra;
}

console.log("SOÁT KHO ẢNH — COASTAL LAND");
console.log("═".repeat(66));

const goc = await liet("");
const nho = await liet("nho");
const tongGoc = goc.reduce((a, f) => a + (f.metadata?.size ?? 0), 0);
const tongNho = nho.reduce((a, f) => a + (f.metadata?.size ?? 0), 0);

// Đọc mọi nơi có nhúng ảnh để biết tệp nào đang được dùng thật.
const BANG = ["listings?select=*&limit=20000", "projects?select=*&limit=5000", "articles?select=*&limit=5000", "site_content?select=*&limit=1000"];
let chu = "";
// Gom RIÊNG các đường dẫn thật (đi hết cây dữ liệu, nhặt đúng chuỗi bắt đầu
// bằng http). Đếm bằng cách quét chữ trong cả khối JSON là SAI: cùng một ảnh bị
// nhắc lại ở nhiều cột (mô tả, chuỗi tìm kiếm…) và dấu gạch chéo bị thoát khác
// nhau sinh ra hàng trăm "bản khác nhau" của cùng một đường. Ngày 12/09 bảng
// soát đã báo 367 trong khi sự thật là 25.
const duongDan = new Set();
const anhWeb = new Set();
const nhatDuong = (v) => {
  if (typeof v === "string") {
    if (/^https?:\/\//i.test(v.trim())) duongDan.add(v.trim());
    return;
  }
  if (Array.isArray(v)) return v.forEach(nhatDuong);
  if (v && typeof v === "object") return Object.values(v).forEach(nhatDuong);
};
for (const q of BANG) {
  const r = await fetch(`${URL_}/rest/v1/${q}`, { headers: H });
  if (!r.ok) {
    console.error(`❌ Không đọc được ${q}: ${r.status} — DỪNG, đọc hụt là soát sai.`);
    process.exit(1);
  }
  const rows = await r.json();
  nhatDuong(rows);
  chu += JSON.stringify(rows);
  // Ảnh/video THẬT SỰ hiện trên web nằm ở cột `images` (và ảnh bìa). Gom riêng
  // để phân biệt với mấy đường chỉ lưu làm ghi chú trong `details`.
  for (const row of rows)
    for (const u of [...(row.images ?? []), row.image, row.cover].flat())
      if (typeof u === "string" && /^https?:\/\//i.test(u)) anhWeb.add(u.trim());
}
// Link youtu.be / youtube.com là video CỦA MÌNH trên kênh Coastal Land — đó là
// quy trình đã chốt, KHÔNG phải "mượn của sàn khác". Đếm gộp vào là báo động giả.
const anhNgoai = new Set(
  [...anhWeb].filter((u) => !u.includes(new URL(URL_).hostname) && !/youtu.be|youtube.com/i.test(u)),
);
const dungThat = (ten) => chu.includes(ten) || chu.includes(encodeURIComponent(ten));

const dung = goc.filter((f) => dungThat(f.name));
const rac = goc.filter((f) => !dungThat(f.name));
const qua1MB = dung.filter((f) => (f.metadata?.size ?? 0) > 1048576);
const coNho = new Set(nho.map((f) => f.name));
const thieuNho = dung.filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name) && !coNho.has(f.name));
const video = goc.filter((f) => /\.(mp4|webm|mov|m4v)$/i.test(f.name));
// Khử trùng: một ảnh có thể bị nhắc nhiều lần trong cùng một tin. Đếm cả bản
// trùng là thổi phồng con số — đã suýt báo nhầm kiểu này hôm 12/09.
// CHỈ TÍNH ẢNH WEB THẬT SỰ TẢI. Cột `details` của tin nhập từ sàn khác có giữ
// `nguonTin` (địa chỉ tin gốc) và `linkAnhGoc` (địa chỉ ảnh gốc) làm GHI CHÚ để
// đối chiếu — web không tải mấy đường đó, nên đừng gộp vào rồi báo động nhầm.
// Đo 12/09: gộp tất thì ra 367, mà thật sự web dùng chỉ 25.
const sanKhac = anhNgoai.size;

console.log(`\nKho: ${goc.length} tệp · ${MB(tongGoc)} / 1 GB   (bản nhỏ: ${nho.length} tệp · ${MB(tongNho)})`);
console.log(`Đang dùng: ${dung.length} tệp\n`);

const loi = [];
const in_ = (ok, nhan, chiTiet, lenh) => {
  console.log(`${ok ? "✅" : "🔴"} ${nhan}`);
  if (chiTiet) console.log(`      ${chiTiet}`);
  if (!ok && lenh) {
    console.log(`      → ${lenh}`);
    loi.push(nhan);
  }
};

in_(rac.length === 0, "Không có tệp thừa", rac.length ? `${rac.length} tệp không ai dùng, ${MB(rac.reduce((a, f) => a + f.metadata.size, 0))}` : "", "node scripts/don-kho-anh.mjs");
in_(qua1MB.length === 0, "Không ảnh nào quá 1 MB", qua1MB.length ? `${qua1MB.length} ảnh nặng, tổng ${MB(qua1MB.reduce((a, f) => a + f.metadata.size, 0))} — nặng nhất ${MB(Math.max(...qua1MB.map((f) => f.metadata.size)))}` : "", "node scripts/nen-anh-nang.mjs --ap");
in_(thieuNho.length === 0, "Ảnh nào cũng có bản nhỏ cho thẻ tin", thieuNho.length ? `${thieuNho.length} ảnh chưa có bản nhỏ (web vẫn chạy, chỉ nặng hơn)` : "", "node scripts/tao-anh-nho.mjs --ap");
in_(video.length === 0, "Không còn video trong kho", video.length ? `${video.length} video, ${MB(video.reduce((a, f) => a + f.metadata.size, 0))}` : "", "đưa lên YouTube: xem docs/QUY-TRINH-VIDEO-YOUTUBE.md");
in_(sanKhac === 0, "Không mượn ảnh/video của sàn khác", sanKhac ? `${sanKhac} ảnh/video trên web đang lấy từ máy chủ sàn khác — họ đổi hoặc chặn là tin mình mất ảnh` : "", "chủ dự án quyết: tải về kho mình, hay bỏ ảnh đó");

// ── Ước tính băng thông ─────────────────────────────────────────────────────
// Cái này mới là thứ làm vượt hạn mức, không phải dung lượng kho.
const tbNho = nho.length ? tongNho / nho.length : 0;
const uocTrangChu = tbNho * 62; // trang chủ nạp cỡ 62 ảnh (đo thật 12/09/2026)
console.log("\n── Băng thông (chỗ thật sự làm vượt hạn mức) ──");
if (tbNho) {
  console.log(`   Bản nhỏ trung bình ${(tbNho / 1024).toFixed(0)} KB → một lượt xem trang chủ ≈ ${MB(uocTrangChu)}`);
  console.log(`   Gói Supabase free 5 GB/tháng ≈ ${Math.floor((5 * 1024 * 1024 * 1024) / uocTrangChu).toLocaleString("vi")} lượt xem/tháng`);
} else {
  console.log("   Chưa có bản nhỏ nào — chạy tao-anh-nho.mjs trước rồi soát lại.");
}
console.log("   Đo chính xác: mở web bằng trình duyệt rồi cộng encodedBodySize —");
console.log("   ĐỪNG grep HTML bằng curl, phần lớn đường dẫn trong HTML trình duyệt không tải.");

console.log("\n" + "═".repeat(66));
console.log(loi.length === 0 ? "KHO SẠCH — không phải làm gì." : `CẦN LÀM ${loi.length} việc ở trên.`);
