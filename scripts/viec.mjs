// ════════════════════════════════════════════════════════════════════════════
// BẢNG ĐIỀU KHIỂN VIỆC CHẠY TAY — MỘT CỬA VÀO CHO CÁC LỆNH RỜI
//
// VÌ SAO CÓ FILE NÀY: thư mục scripts/ có gần ba chục lệnh, mỗi lệnh một tên
// tiếng Anh không dấu và một bộ cờ riêng (--that · --ap · --ghi · --xoa ·
// --dry-run). Muốn dọn kho ảnh phải nhớ tên tệp, nhớ cờ nào là "xem thử", cờ
// nào là "ghi thật". Nhớ nhầm một chữ là ghi thật lúc chỉ định xem.
//
// Ở đây mọi việc có TÊN TIẾNG VIỆT, nói rõ KHI NÀO DÙNG, và luôn hiện nguyên
// câu lệnh sắp chạy để đọc lại trước khi gật.
//
//   npm run viec              → hiện bảng, chọn số
//   npm run viec -- soat-kho  → chạy thẳng một việc theo mã
//
// LUẬT: việc nào GHI THẬT (xoá tệp, sửa tin, đăng tin) thì mặc định chạy ở chế
// độ XEM TRƯỚC. Muốn ghi thật phải tự gật thêm một lần nữa.
//
// Việc máy TỰ làm mỗi ngày (không cần ai bấm) nằm ở src/lib/tuDong/danhSach.ts.
// ════════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import path from "node:path";
import fs from "node:fs";

const GOC = path.resolve(import.meta.dirname, "..");

// ── SỔ VIỆC ─────────────────────────────────────────────────────────────────
// tep      : tệp trong scripts/
// them     : tham số cố định đứng trước (vd "dat-ten")
// hoi      : câu hỏi xin tham số bắt buộc (bỏ trống = không cần)
// coGhi    : cờ bật ghi thật. Bỏ trống = việc chỉ đọc, không đổi gì → chạy thẳng.
// xemTruoc : cờ bắt buộc phải thêm để KHÔNG ghi (dùng cho lệnh mặc định ghi thật)
const NHOM = [
  {
    ten: "ĐĂNG TIN THEO ĐỢT",
    viec: [
      { ma: "dang-dot", ten: "Đăng một đợt tin từ file CSV", khi: "Ảnh của đợt đã có sẵn trong kho, giờ chỉ cần đăng tin và gắn ảnh về đúng tin.", tep: "dang-dot-tin.mjs", hoi: "Đường dẫn file CSV của đợt", coGhi: "--that" },
      { ma: "nhap-csv", ten: "Nhập tin hàng loạt từ CSV", khi: "Nhập tin mới vào bảng listings. Tin lên thẳng chế độ hiển thị.", tep: "import-tin-moi.mjs", hoi: "Đường dẫn file CSV", xemTruoc: "--dry-run", coGhi: "" },
      { ma: "sua-csv", ten: "Sửa file CSV của cowork trước khi nhập", khi: "File cowork gửi về hay lỗi khoảng trắng. Chỉ thêm/bớt khoảng trắng, không đổi chữ.", tep: "sua-csv-cowork.mjs", hoi: "Đường dẫn file CSV" },
      { ma: "soat-lac", ten: "Soát ảnh / video lạc tin", khi: "Chạy sau MỖI đợt đăng, trước khi yên tâm. Mã tin lặp giữa các đợt nên ảnh dễ chui nhầm tin." , tep: "soat-anh-video-lac.mjs" },
      { ma: "go-anh-lan", ten: "Gỡ ảnh bị nhét nhầm vào tin cũ", khi: "Khi soát ra ảnh của đợt này chui vào tin đợt trước.", tep: "go-anh-lan-tin.mjs", hoi: "Ngày của đợt (2026-09-15)", coGhi: "--that" },
      { ma: "don-tin-cu", ten: "Dọn lại tin đã đăng cho khớp chuẩn mới", khi: "Sau khi đổi chuẩn nhập tin, chỉnh lại tin cũ cho đồng bộ.", tep: "chuan-hoa-tin-da-dang.mjs", coGhi: "--ghi" },
      { ma: "sua-xuong-dong", ten: "Sửa lỗi mất xuống dòng trong mô tả tin", khi: "Mô tả tin dồn thành một khối chữ liền. Chỉ chèn xuống dòng, không đổi chữ.", tep: "sua-xuong-dong-tin.mjs", coGhi: "--ghi" },
    ],
  },
  {
    ten: "KHO ẢNH",
    viec: [
      { ma: "soat-kho", ten: "Soát kho ảnh — kho có sạch không", khi: "Chạy mỗi tháng một lần, hoặc sau mỗi đợt nhập tin. Chỉ đọc, không đổi gì.", tep: "soat-kho-anh.mjs" },
      { ma: "don-kho", ten: "Dọn kho ảnh — xoá tệp không ai dùng", khi: "Sau khi soát kho thấy có tệp rác. XOÁ THẬT, không lấy lại được.", tep: "don-kho-anh.mjs", coGhi: "--xoa" },
      { ma: "nen-anh", ten: "Nén ảnh nặng (giữ nguyên kích thước)", khi: "Kho có ảnh PNG vài MB. Chuyển sang WebP, ảnh gốc vẫn giữ nguyên.", tep: "nen-anh-nang.mjs", coGhi: "--ap" },
      { ma: "anh-nho", ten: "Tạo bản ảnh nhỏ cho thẻ tin", khi: "Giảm dung lượng khách phải tải khi xem danh sách. Ảnh gốc giữ nguyên.", tep: "tao-anh-nho.mjs", coGhi: "--ap" },
      { ma: "chuan-anh", ten: "Chuẩn hoá một thư mục ảnh trước khi đăng", khi: "Có thư mục ảnh vừa chụp / vừa xuất, cần đưa hết về đúng chuẩn của web.", tep: "chuan-hoa-anh.mjs", hoi: "Thư mục ảnh vào" },
      { ma: "thu-hoi-anh", ten: "Thu hồi ảnh đang mượn của sàn khác", khi: "Tin còn hiển thị ảnh lấy thẳng từ sàn khác — tải về kho mình rồi sửa tin.", tep: "thu-hoi-anh-san-khac.mjs", coGhi: "--ap" },
      { ma: "sang-r2", ten: "Chuyển ảnh từ Supabase sang Cloudflare R2", khi: "Việc hạ tầng — đọc docs/KE-HOACH-HA-TANG.md trước khi chạy.", tep: "chuyen-anh-sang-r2.mjs" },
      { ma: "dem-r2", ten: "Đếm tệp đang có trên R2", khi: "Theo dõi tiến độ chuyển ảnh. Chỉ đọc.", tep: "dem-anh-r2.mjs" },
    ],
  },
  {
    ten: "VIDEO YOUTUBE",
    viec: [
      { ma: "video-dat-ten", ten: "Đặt tên video một đợt để đưa lên YouTube", khi: "Bước 1 của mỗi đợt. Tên tệp chính là đường khớp về tin — ĐỪNG đổi tên sau đó.", tep: "video-len-kenh.mjs", them: ["dat-ten"], hoi: "Ngày của đợt hoặc thư mục video" },
      { ma: "video-gan", ten: "Gắn video trên kênh về đúng tin", khi: "Bước 2, chạy sau khi đã tải lên YouTube và để chế độ CÔNG KHAI.", tep: "video-len-kenh.mjs", them: ["gan"] },
      { ma: "video-dong-bo", ten: "Đồng bộ toàn bộ video kênh về tin", khi: "Thay video nằm trong kho Supabase bằng link YouTube (kho nhẹ đi ~16 MB mỗi video).", tep: "dong-bo-video-youtube.mjs", coGhi: "--ap" },
      { ma: "video-tai-ve", ten: "Tải video trong kho về máy để đưa lên YouTube", khi: "Tin cũ còn video tải lên kiểu cũ, cần đưa lên kênh.", tep: "tai-video-de-up-youtube.mjs" },
      { ma: "video-kenh", ten: "Đọc danh sách video của kênh", khi: "Xem kênh đang có những video nào (kể cả Shorts). Chỉ đọc.", tep: "doc-video-kenh.mjs" },
    ],
  },
  {
    ten: "SOÁT & KIỂM",
    viec: [
      { ma: "kiem-dns", ten: "Kiểm 6 bản ghi tên miền", khi: "Mất bản ghi A là web sập, mất bản ghi Resend là mất OTP. Máy chủ cũng tự canh mỗi ngày.", tep: "kiem-dns.mjs" },
      { ma: "kiem-supabase", ten: "Soi tài khoản Supabase", khi: "Xem kho, băng thông, hạn mức — không cần mở trình duyệt.", tep: "kiem-supabase.mjs" },
      { ma: "kiem-khoa", ten: "Kiểm khoá quản trị Supabase", khi: "Chạy SAU KHI đổi khoá service_role.", tep: "kiem-khoa-supabase.mjs" },
      { ma: "kiem-ads", ten: "Kiểm đã đủ điều kiện chạy Google Ads chưa", khi: "Chốt: chỉ chạy Ads khi hạ tầng xong hết.", tep: "kiem-san-sang-ads.mjs" },
      { ma: "do-dia-chi", ten: "Đo đổi hệ địa chỉ hai chiều", khi: "Chạy lại sau MỖI lần sửa gì đụng tới địa giới cũ/mới.", tep: "do-doi-he-dia-chi.mjs" },
      { ma: "do-ghim", ten: "Đo ghim bản đồ → điền địa giới", khi: "Chạy lại sau mỗi lần sửa phần bản đồ / toạ độ.", tep: "do-ghim-ban-do.mjs", them: ["moi"] },
    ],
  },
];

const TAT_CA = NHOM.flatMap((n) => n.viec);

// ── Chạy một việc ───────────────────────────────────────────────────────────
function chay(viec, thamSo, ghiThat) {
  const args = [path.join("scripts", viec.tep), ...(viec.them ?? [])];
  if (thamSo) args.push(thamSo);
  if (ghiThat && viec.coGhi) args.push(viec.coGhi);
  if (!ghiThat && viec.xemTruoc) args.push(viec.xemTruoc);

  const hienThi = args.map((a) => (a.includes(" ") ? JSON.stringify(a) : a)).join(" ");
  console.log("\n▶  node " + hienThi + "\n");
  const kq = spawnSync(process.execPath, args, { cwd: GOC, stdio: "inherit" });
  process.exit(kq.status ?? 1);
}

function bang() {
  console.log("\n═══ VIỆC CHẠY TAY — COASTAL LAND ═══\n");
  let i = 0;
  for (const nhom of NHOM) {
    console.log("  " + nhom.ten);
    for (const v of nhom.viec) {
      i++;
      // ✎ = việc có ghi thật. Xét theo "có khai coGhi hay không", KHÔNG xét
      // nội dung cờ: lệnh nhập CSV mặc định GHI THẬT (cờ rỗng, chỉ có cờ để
      // KHÔNG ghi) — đánh dấu "·" cho nó là nguy hiểm nhất bảng.
      const dau = v.coGhi !== undefined ? "✎" : "·";
      console.log("   " + String(i).padStart(2) + ". " + dau + " " + v.ten);
      console.log("       " + v.khi);
    }
    console.log("");
  }
  console.log("  ✎ = việc GHI THẬT (mặc định chỉ xem trước, phải gật thêm một lần).\n");
}

// ── Vào thẳng theo mã: npm run viec -- soat-kho ─────────────────────────────
const maGoi = process.argv[2];
if (maGoi) {
  const v = TAT_CA.find((x) => x.ma === maGoi);
  if (!v) {
    console.log('Không có việc nào mã "' + maGoi + '". Mã hiện có:');
    console.log("  " + TAT_CA.map((x) => x.ma).join(" · ") + "\n");
    process.exit(1);
  }
  if (v.hoi) {
    console.log('Việc "' + v.ten + '" cần tham số — chạy bằng bảng chọn cho dễ: npm run viec\n');
    process.exit(1);
  }
  chay(v, null, process.argv.includes("--that"));
}

// ── Bảng chọn ───────────────────────────────────────────────────────────────
bang();
const rl = createInterface({ input: process.stdin, output: process.stdout });

const so = Number((await rl.question("Chọn số việc (Enter để thoát): ")).trim());
if (!so || !TAT_CA[so - 1]) {
  rl.close();
  process.exit(0);
}
const viec = TAT_CA[so - 1];

let thamSo = null;
if (viec.hoi) {
  thamSo = (await rl.question(viec.hoi + ": ")).trim().replace(/^["']|["']$/g, "");
  if (!thamSo) {
    console.log("Chưa nhập — dừng.");
    rl.close();
    process.exit(0);
  }
  // Gõ nhầm đường dẫn là chuyện thường. Báo trước còn hơn để script tự chết giữa chừng.
  if (/[\\/]/.test(thamSo) && !fs.existsSync(thamSo)) {
    console.log("\n⚠️  Không thấy đường dẫn này trên máy:\n   " + thamSo + "\n");
    const co = (await rl.question("Vẫn chạy? (c = có): ")).trim().toLowerCase();
    if (co !== "c") {
      rl.close();
      process.exit(0);
    }
  }
}

let ghiThat = false;
if (viec.coGhi !== undefined) {
  console.log('\n"' + viec.ten + '" là việc GHI THẬT.');
  console.log("  Enter  → chỉ XEM TRƯỚC, không đổi gì");
  console.log("  t      → GHI THẬT\n");
  ghiThat = (await rl.question("Chọn: ")).trim().toLowerCase() === "t";
}

rl.close();
chay(viec, thamSo, ghiThat);
