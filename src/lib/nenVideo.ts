// ============================================================================
// CHUẨN HOÁ VIDEO NGAY TRÊN MÁY KHÁCH TRƯỚC KHI TẢI LÊN (08/10/2026 · làm lại 10/11/2026)
// ----------------------------------------------------------------------------
// Web làm ra để KHÁCH tự đăng tin (anh 10/11/2026): video khách up định dạng nào cũng phải lên web CÓ HÌNH và xem được trên mọi
// máy. Chuẩn ra: MP4 · H.264 + AAC · cạnh ngắn ≤ 720px (dọc / ngang giữ như khách quay) · ≤ ~44MB (kho nhận tối đa 50MB/tệp).
//   ① Đã là MP4 H.264 và ≤ 44MB → giữ nguyên tệp gốc.
//   ② Trình duyệt tự chuyển được (WebCodecs, thư viện mediabunny) → chuyển, nhanh.
//   ③ Trình duyệt không đọc được phần hình (video iPhone HEVC trên máy không có HEVC, MOV ProRes, AVI, MKV…) → bộ chuyển dự phòng
//      ffmpeg (WebAssembly): mã đọc tệp ở /ffmpeg/ (chép từ @ffmpeg/ffmpeg), lõi ~31MB tải từ jsDelivr CHỈ khi gặp loại này.
// Không bao giờ trả tệp mất hình: trước 10/11 mediabunny bỏ track hình mà vẫn "hợp lệ" nhờ track tiếng → tin 1e3be917 chỉ có tiếng.
// Chi phí: chạy trên máy khách, không tốn máy chủ; lõi ffmpeg lấy từ CDN công cộng, không qua Vercel.
// ============================================================================

export const TRAN_VIDEO_MB = 50;
const DICH_MB = 44; // chừa khoảng cho phần đầu tệp MP4
const CANH_NGAN = 720;
const LOI_FFMPEG = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

const tenMp4 = (ten: string) => ten.replace(/\.[^.]+$/, "") + ".mp4";
// Bitrate để cả video nằm dưới DICH_MB (trừ 128 kbps tiếng), tối đa 3 Mbps. 0 = video quá dài, không nén nổi mà còn xem được.
const bitrateCho = (giay: number) => {
  const b = Math.min(3_000_000, Math.floor((DICH_MB * 8 * 1024 * 1024) / Math.max(1, giay)) - 128_000);
  return b < 300_000 ? 0 : b;
};

type TienDo = (phanTram: number) => void;

/** Trả tệp MP4 H.264 có hình, hoặc null khi máy không chuyển được (uploadVideoFile báo khách). */
export async function nenVideo(file: File, onTienDo?: TienDo): Promise<File | null> {
  let giay = 0;
  try {
    const { Input, ALL_FORMATS, BlobSource, Output, Mp4OutputFormat, BufferTarget, Conversion, Quality } = await import("mediabunny");
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
    const track = await input.getPrimaryVideoTrack();
    if (!track) return null; // tệp không có phần hình
    giay = await input.computeDuration().catch(() => 0);
    const laMp4 = (await input.getFormat()).name === "MP4";
    // ① — vài máy không khai loại tệp (type rỗng) → gắn video/mp4 để kho nhận
    if (laMp4 && track.codec === "avc" && file.size <= DICH_MB * 1024 * 1024)
      return file.type.startsWith("video/") ? file : new File([file], tenMp4(file.name), { type: "video/mp4" });

    const lon = file.size > DICH_MB * 1024 * 1024;
    const bitrate = bitrateCho(giay || 60);
    if (lon && !bitrate) return null;
    const ngang = track.displayWidth >= track.displayHeight;
    const canhNgan = Math.min(track.displayWidth, track.displayHeight);
    const coKhung = canhNgan > CANH_NGAN ? (ngang ? { height: CANH_NGAN } : { width: CANH_NGAN }) : {};
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
    const conversion = await Conversion.init({
      input,
      output,
      // forceTranscode + bitrate "constant": thiếu một trong hai thì trình duyệt chỉ chép lại hoặc bỏ qua mức bitrate (đo 08/10).
      // Nhỏ mà chỉ khác vỏ (MOV H.264) → không ép chuyển, mediabunny chỉ đóng lại vỏ MP4.
      video: lon
        ? { ...coKhung, codec: "avc", quality: new Quality({ bitrate, bitrateMode: "constant" }), forceTranscode: true }
        : { ...coKhung, codec: "avc" },
      audio: { codec: "aac", quality: new Quality({ bitrate: 128_000 }) },
      showWarnings: false,
    });
    // ② chỉ khi GIỮ ĐƯỢC phần hình; không thì sang ③
    if (conversion.isValid && conversion.utilizedTracks.some((t) => t.type === "video")) {
      if (onTienDo) conversion.onProgress = (p) => onTienDo(Math.round(p * 100));
      await conversion.execute();
      const buf = output.target.buffer;
      if (buf && buf.byteLength <= TRAN_VIDEO_MB * 1024 * 1024) return new File([buf], tenMp4(file.name), { type: "video/mp4" });
    }
  } catch {
    /* mediabunny không đọc được vỏ tệp (AVI, MKV lạ…) → ③ */
  }
  try {
    return await quaFfmpeg(file, giay, onTienDo);
  } catch {
    return null;
  }
}

// Tải tệp về rồi tạo đường dẫn blob: — worker của ffmpeg nạp lõi từ đây (khỏi phụ thuộc chính sách khác nguồn của CDN).
async function blobUrl(url: string, type: string) {
  const b = await (await fetch(url)).blob();
  return URL.createObjectURL(new Blob([b], { type }));
}

async function quaFfmpeg(file: File, giay: number, onTienDo?: TienDo): Promise<File | null> {
  const duong = "/ffmpeg/index.js"; // để trong biến: bộ đóng gói không gói tệp này, trình duyệt tải thẳng từ public/
  const { FFmpeg } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ duong)) as typeof import("@ffmpeg/ffmpeg");
  const ff = new FFmpeg();
  if (onTienDo) ff.on("progress", ({ progress }) => onTienDo(Math.round(Math.min(1, Math.max(0, progress)) * 100)));
  try {
    await ff.load({
      coreURL: await blobUrl(`${LOI_FFMPEG}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await blobUrl(`${LOI_FFMPEG}/ffmpeg-core.wasm`, "application/wasm"),
    });
    const vao = "vao" + (file.name.match(/\.[a-z0-9]{1,5}$/i)?.[0] ?? ".mov");
    await ff.writeFile(vao, new Uint8Array(await file.arrayBuffer()));
    const b = bitrateCho(giay || 120) || 300_000;
    // Cạnh ngắn ≤ 720, số chẵn (H.264 bắt buộc); dọc / ngang giữ nguyên.
    const khung = "scale='if(gte(iw,ih),-2,trunc(min(720,iw)/2)*2)':'if(gte(iw,ih),trunc(min(720,ih)/2)*2,-2)'";
    const ma = await ff.exec([
      "-i", vao, "-vf", khung, "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
      "-maxrate", String(b), "-bufsize", String(b * 2), "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "ra.mp4",
    ]);
    if (ma !== 0) return null;
    const ra = await ff.readFile("ra.mp4");
    if (typeof ra === "string" || ra.byteLength > TRAN_VIDEO_MB * 1024 * 1024) return null;
    return new File([new Uint8Array(ra)], tenMp4(file.name), { type: "video/mp4" });
  } finally {
    ff.terminate();
  }
}
