// ============================================================================
// XOÁ DẤU TRANG TIN NGUỒN (chữ "chợTỐT" trắng mờ cố định) TRÊN VIDEO ĐỢT TIN — quy trình 11.0B bước 7
//   node scripts/xoa-dau-video.mjs "D:/Coastal Land/SEO/DA-DUYET/30102026"          → chỉ dò, in khung dấu từng video
//   node scripts/xoa-dau-video.mjs "D:/Coastal Land/SEO/DA-DUYET/30102026" --that   → xoá thật
// Cách (chủ dự án 25/10/2026: xoá HẲN, không làm mờ, không cắt khung):
//   ① ảnh MIN theo thời gian vùng góc trên trái → dấu cố định nổi lên → khung dấu (video không có dấu thì bỏ qua)
//   ② so khung gốc với bản delogo của ffmpeg → độ trong suốt từng điểm (trung vị nhiều khung)
//   ③ trừ ngược (gốc − a·255)/(1 − a) trên MỌI khung, làm mịn viền; tiếng giữ nguyên
// Bản gốc cất SEO\_cu\ban-cowork\<ngày>\Video-goc\ trước khi ghi đè (đúng tên cũ). Logo khách / chủ đầu tư không động.
// Cần ffmpeg + ffprobe trong PATH. Soát lại bằng mắt đầu–giữa–cuối trước khi báo.
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";

const thuMuc = process.argv[2];
const that = process.argv.includes("--that");
if (!thuMuc) { console.error('Cách dùng: node scripts/xoa-dau-video.mjs "<thư mục đợt>" [--that]'); process.exit(1); }
const vDir = path.join(thuMuc, "Video");
const ngay = path.basename(thuMuc);
const gocDir = path.join(thuMuc, "..", "..", "_cu", "ban-cowork", ngay, "Video-goc");

const probe = (f, k) => execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", `stream=${k}`, "-of", "csv=p=0", f]).toString().trim();
const docRaw = (args) => new Promise((ok, loi) => {
  const p = spawn("ffmpeg", ["-v", "error", ...args, "-f", "rawvideo", "-"]); const ds = [];
  p.stdout.on("data", (d) => ds.push(d)); p.on("error", loi); p.on("close", (c) => (c ? loi(new Error("ffmpeg " + c)) : ok(Buffer.concat(ds))));
});

// ① khung dấu trên ảnh MIN (xám) vùng nửa trái, 1/4 trên của khung
async function timKhung(f, W) {
  const cw = (W >> 2) * 2, ch = (W >> 3) * 2;
  const buf = await docRaw(["-i", f, "-vf", `fps=3,crop=${cw}:${ch}:0:0,format=gray`]);
  const F = cw * ch, n = Math.floor(buf.length / F), mn = new Uint8Array(F).fill(255);
  for (let k = 0; k < n; k++) for (let p = 0; p < F; p++) if (buf[k * F + p] < mn[p]) mn[p] = buf[k * F + p];
  const hp = new Float32Array(F), R = 6;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    let s = 0, c = 0;
    for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) { const yy = y + dy, xx = x + dx; if (yy < 0 || yy >= ch || xx < 0 || xx >= cw) continue; s += mn[yy * cw + xx]; c++; }
    hp[y * cw + x] = mn[y * cw + x] - s / c;
  }
  // ngưỡng tăng dần tới khi khung gọn (chữ chợTỐT rộng ~ 2,7 lần cao)
  for (const th of [14, 20, 26, 32, 40]) {
    let x0 = cw, y0 = ch, x1 = -1, y1 = -1, dem = 0;
    for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) if (hp[y * cw + x] > th) {
      let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (hp[(y + dy) * cw + x + dx] > th) k++;
      if (k < 4) continue; dem++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    if (dem < 80) return null; // không có dấu
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (h > 0 && w / h > 2 && w / h < 4 && w < W * 0.3) return { x: x0, y: y0, w, h };
  }
  return null;
}

async function xoa(f, ra, k, W, H) {
  const X0 = Math.max(0, (k.x - 6) & ~1), Y0 = Math.max(0, (k.y - 6) & ~1);
  const AW = ((k.x + k.w + 6 - X0 + 1) >> 1) * 2, AH = ((k.y + k.h + 6 - Y0 + 1) >> 1) * 2; // số chẵn: khung yuv420 cắt lẻ bị làm tròn
  const cat = `crop=${AW}:${AH}:${X0}:${Y0}`;
  const O = await docRaw(["-i", f, "-vf", cat, "-pix_fmt", "rgb24"]);
  const B = await docRaw(["-i", f, "-vf", `delogo=x=${Math.max(1, k.x - 3)}:y=${Math.max(1, k.y - 3)}:w=${k.w + 6}:h=${k.h + 6},${cat}`, "-pix_fmt", "rgb24"]);
  // ② độ trong suốt
  const Fc = AW * AH * 3, n = Math.floor(O.length / Fc), buoc = Math.max(1, Math.floor(n / 300));
  const A = new Float32Array(AW * AH), tam = [];
  for (let p = 0; p < AW * AH; p++) {
    tam.length = 0;
    for (let q = 0; q < n; q += buoc) { let s = 0; for (let c = 0; c < 3; c++) { const i = q * Fc + p * 3 + c; s += (O[i] - B[i]) / Math.max(8, 255 - B[i]); } tam.push(s / 3); }
    tam.sort((a, b) => a - b); const a = Math.max(0, Math.min(0.9, tam[tam.length >> 1])); A[p] = a < 0.03 ? 0 : a;
  }
  const Wt = new Float32Array(AW * AH);
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
    let m = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < AH && xx >= 0 && xx < AW) m = Math.max(m, A[yy * AW + xx]); }
    Wt[y * AW + x] = Math.min(1, m / 0.12);
  }
  // ③ trừ ngược từng khung, ghi ra mp4 (tiếng giữ nguyên)
  const fps = probe(f, "r_frame_rate");
  const vao = spawn("ffmpeg", ["-v", "error", "-i", f, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
  const ghi = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", fps, "-i", "-", "-i", f,
    "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", "-shortest", ra]);
  const FR = W * H * 3, inv = new Float32Array(AW * AH * 3); let du = Buffer.alloc(0);
  vao.stdout.on("data", (d) => {
    du = Buffer.concat([du, d]);
    while (du.length >= FR) {
      const fr = Buffer.from(du.subarray(0, FR)); du = du.subarray(FR);
      for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) { const a = A[y * AW + x], i = ((Y0 + y) * W + X0 + x) * 3; for (let c = 0; c < 3; c++) inv[(y * AW + x) * 3 + c] = a ? (fr[i + c] - a * 255) / (1 - a) : fr[i + c]; }
      for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
        const w = Wt[y * AW + x]; if (!w) continue; const i = ((Y0 + y) * W + X0 + x) * 3;
        for (let c = 0; c < 3; c++) {
          let s = 0, m = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy < 0 || yy >= AH || xx < 0 || xx >= AW) continue; s += inv[(yy * AW + xx) * 3 + c]; m++; }
          const v = inv[(y * AW + x) * 3 + c] * (1 - 0.85 * w) + (s / m) * 0.85 * w; fr[i + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
        }
      }
      if (!ghi.stdin.write(fr)) { vao.stdout.pause(); ghi.stdin.once("drain", () => vao.stdout.resume()); }
    }
  });
  vao.stdout.on("end", () => ghi.stdin.end());
  await new Promise((ok, loi) => ghi.on("close", (c) => (c ? loi(new Error("ffmpeg ghi " + c)) : ok())));
}

if (!fs.existsSync(vDir)) { console.log("Đợt không có thư mục Video"); process.exit(0); }
for (const ten of fs.readdirSync(vDir).filter((x) => /\.mp4$/i.test(x) && !/\.dang-xoa\.mp4$/i.test(x))) {
  const f = path.join(vDir, ten), W = Number(probe(f, "width")), H = Number(probe(f, "height"));
  const k = await timKhung(f, W);
  if (!k) { console.log(`— ${ten}: không thấy dấu trang nguồn, để nguyên`); continue; }
  console.log(`• ${ten}: dấu ở x${k.x} y${k.y} ${k.w}×${k.h}`);
  if (!that) continue;
  fs.mkdirSync(gocDir, { recursive: true });
  const goc = path.join(gocDir, ten);
  if (!fs.existsSync(goc)) fs.copyFileSync(f, goc);
  const tam = f.replace(/\.mp4$/i, ".dang-xoa.mp4");
  await xoa(goc, tam, k, W, H);
  fs.renameSync(tam, f);
  console.log(`  ✓ đã xoá, bản gốc: ${goc}`);
}
