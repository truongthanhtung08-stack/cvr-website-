// ─────────────────────────────────────────────────────────────────────────────
// CHUẨN HOÁ ẢNH TIN trước khi đăng lên web
//
// Dùng khi có một thư mục ảnh vừa chụp / vừa xuất từ Photoshop, cần đưa hết về
// đúng chuẩn của Coastal Land rồi mới upload lên Supabase.
//
//   node scripts/chuan-hoa-anh.mjs <thư-mục-ảnh-vào> [thư-mục-ra]
//
// Không ghi đè ảnh gốc — kết quả ghi sang thư mục ra (mặc định: <vào>/da-chuan-hoa).
//
// Chuẩn áp dụng:
//   · Cạnh dài tối đa 1600 px (ảnh nhỏ hơn giữ nguyên, KHÔNG phóng to cho vỡ)
//   · JPEG mozjpeg chất lượng 72 — mắt thường không phân biệt được với bản gốc
//   · LÀM NÉT SAU KHI THU NHỎ — đúng quy tắc ảnh web. Làm nét (High Pass) ở kích
//     thước gốc rồi mới thu nhỏ thì độ nét bị xoá sạch lúc thu, chỉ còn lại dung
//     lượng thừa. Thu trước - nét sau cho ảnh sắc hơn mà file nhẹ hơn hẳn.
//   · Xoá toàn bộ metadata (máy ảnh, GPS, phần mềm) cho nhẹ và không lộ vị trí chụp
//   · Tự xoay theo hướng EXIF rồi mới xoá EXIF (ảnh điện thoại không bị nằm ngang)
//
// Tuỳ chọn: thêm --3-2 để cắt đều về đúng tỷ lệ 3:2 (khung thẻ tin trên web),
// cắt vào giữa khung ảnh. Không dùng cờ này thì giữ nguyên tỷ lệ gốc.
// ─────────────────────────────────────────────────────────────────────────────
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const CANH_DAI = 1600;
const CHAT_LUONG = 72;
// Làm nét nhẹ sau khi thu nhỏ. sigma 0.7 = vừa đủ sắc, không tạo viền sáng (halo)
// quanh cạnh vật thể như High Pass tay hay bị khi đẩy quá.
const LAM_NET = { sigma: 0.7 };
const DUOI_ANH = /\.(jpe?g|png|webp|avif|tiff?)$/i;

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const cat32 = process.argv.includes("--3-2");
const thuMucVao = args[0];
const thuMucRa = args[1] ?? (thuMucVao ? path.join(thuMucVao, "da-chuan-hoa") : null);

if (!thuMucVao || !fs.existsSync(thuMucVao)) {
  console.error("Thiếu thư mục ảnh. Ví dụ:\n  node scripts/chuan-hoa-anh.mjs \"D:/anh-tin-moi\"");
  process.exit(1);
}
fs.mkdirSync(thuMucRa, { recursive: true });

const danhSach = fs
  .readdirSync(thuMucVao)
  .filter((f) => DUOI_ANH.test(f) && fs.statSync(path.join(thuMucVao, f)).isFile());

if (danhSach.length === 0) {
  console.error(`Không thấy ảnh nào trong: ${thuMucVao}`);
  process.exit(1);
}

const kb = (n) => (n / 1024).toFixed(0).padStart(4) + " KB";
let tongTruoc = 0;
let tongSau = 0;
let soLoi = 0;

console.log(`\nChuẩn hoá ${danhSach.length} ảnh — cạnh dài ${CANH_DAI}px, chất lượng ${CHAT_LUONG}${cat32 ? ", cắt 3:2" : ""}\n`);
console.log("Tên ảnh".padEnd(28) + "Trước".padEnd(24) + "Sau");
console.log("─".repeat(74));

for (const ten of danhSach) {
  const vao = path.join(thuMucVao, ten);
  const ra = path.join(thuMucRa, ten.replace(DUOI_ANH, ".jpg"));
  try {
    const truoc = fs.statSync(vao).size;
    const goc = await sharp(vao).metadata();

    let anh = sharp(vao).rotate(); // xoay theo EXIF trước khi bỏ metadata

    if (cat32) {
      // Cắt vào GIỮA khung về đúng 3:2 rồi mới thu nhỏ — khớp khung thẻ tin.
      const rong = Math.min(CANH_DAI, goc.width);
      anh = anh.resize(rong, Math.round((rong * 2) / 3), { fit: "cover", position: "centre", withoutEnlargement: true });
    } else {
      anh = anh.resize(CANH_DAI, CANH_DAI, { fit: "inside", withoutEnlargement: true });
    }

    await anh.sharpen(LAM_NET).jpeg({ quality: CHAT_LUONG, mozjpeg: true, chromaSubsampling: "4:2:0" }).toFile(ra);

    const sau = fs.statSync(ra).size;
    const moi = await sharp(ra).metadata();
    tongTruoc += truoc;
    tongSau += sau;

    const giam = Math.round((1 - sau / truoc) * 100);
    console.log(
      ten.slice(0, 26).padEnd(28) +
        `${goc.width}x${goc.height} ${kb(truoc)}`.padEnd(24) +
        `${moi.width}x${moi.height} ${kb(sau)}  ${giam > 0 ? "−" + giam + "%" : "giữ nguyên"}`,
    );
  } catch (e) {
    soLoi++;
    console.log(ten.slice(0, 26).padEnd(28) + "LỖI: " + e.message);
  }
}

console.log("─".repeat(74));
console.log(
  `Tổng: ${kb(tongTruoc)} → ${kb(tongSau)}  (giảm ${Math.round((1 - tongSau / tongTruoc) * 100)}%)` +
    (soLoi ? `  ·  ${soLoi} ảnh lỗi` : ""),
);
console.log(`Ảnh đã chuẩn hoá nằm ở: ${path.resolve(thuMucRa)}\n`);
