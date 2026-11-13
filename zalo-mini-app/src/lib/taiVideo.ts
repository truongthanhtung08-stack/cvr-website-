import { supabase } from "./supabase";

// TẢI VIDEO TIN — CÙNG CHUẨN WEB (src/lib/nenVideo.ts + uploadImage.ts uploadVideoFile, 14/11/2026: "một cái tin đăng lên web"):
// chuyển ngay trên máy khách sang MP4 · H.264 + AAC · cạnh ngắn ≤ 720px · ≤ ~44MB, rồi lưu kho "listings" tên = mã băm nội dung.
//   ① Đã là MP4 H.264 ≤ 44MB → giữ nguyên.  ② Máy đọc được phần hình (WebCodecs, mediabunny) → chuyển.
// Web còn bước ③ ffmpeg (lõi ~31MB tải từ jsDelivr) cho tệp máy không đọc được; Mini App không mang bước này — gặp tệp đó thì báo
// như web, không bao giờ lưu tệp mất hình (bài học tin 1e3be917).

export const TRAN_VIDEO_MB = 50;
const DICH_MB = 44;
const CANH_NGAN = 720;
const tenMp4 = (ten: string) => ten.replace(/\.[^.]+$/, "") + ".mp4";
const bitrateCho = (giay: number) => {
  const b = Math.min(3_000_000, Math.floor((DICH_MB * 8 * 1024 * 1024) / Math.max(1, giay)) - 128_000);
  return b < 300_000 ? 0 : b;
};

/** Mở bảng chọn video của máy (thư viện / quay mới). */
export function chonVideo(): Promise<File | null> {
  return new Promise((xong) => {
    const o = document.createElement("input");
    o.type = "file";
    o.accept = "video/*";
    o.onchange = () => xong(o.files?.[0] ?? null);
    o.click();
  });
}

async function nenVideo(file: File, onTienDo?: (p: number) => void): Promise<File | null> {
  try {
    const { Input, ALL_FORMATS, BlobSource, Output, Mp4OutputFormat, BufferTarget, Conversion, Quality } = await import("mediabunny");
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
    const track = await input.getPrimaryVideoTrack();
    if (!track) return null;
    const giay = await input.computeDuration().catch(() => 0);
    const laMp4 = (await input.getFormat()).name === "MP4";
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
      video: lon
        ? { ...coKhung, codec: "avc", quality: new Quality({ bitrate, bitrateMode: "constant" }), forceTranscode: true }
        : { ...coKhung, codec: "avc" },
      audio: { codec: "aac", quality: new Quality({ bitrate: 128_000 }) },
      showWarnings: false,
    });
    // Chỉ nhận khi GIỮ ĐƯỢC phần hình
    if (!conversion.isValid || !conversion.utilizedTracks.some((t) => t.type === "video")) return null;
    if (onTienDo) conversion.onProgress = (p) => onTienDo(Math.round(p * 100));
    await conversion.execute();
    const buf = output.target.buffer;
    return buf && buf.byteLength <= TRAN_VIDEO_MB * 1024 * 1024 ? new File([buf], tenMp4(file.name), { type: "video/mp4" }) : null;
  } catch {
    return null;
  }
}

/** Chuẩn hoá + tải video lên kho. Trả đường dẫn công khai hoặc { loi } — câu báo lỗi chép từ web (uploadVideoFile). */
export async function taiVideoLen(file: File, onTienDo?: (p: number) => void): Promise<{ url?: string; loi?: string }> {
  if (file.size > 200 * 1024 * 1024) return { loi: `Video "${file.name}" quá 200MB — chọn video ngắn hơn.` };
  const nen = await nenVideo(file, onTienDo);
  if (!nen || nen.size > TRAN_VIDEO_MB * 1024 * 1024)
    return { loi: `Video "${file.name}" quá dài, máy không nén được xuống ${TRAN_VIDEO_MB}MB — chọn video ngắn hơn.` };
  const bam = await crypto.subtle.digest("SHA-256", await nen.arrayBuffer());
  const ma = Array.from(new Uint8Array(bam).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
  const ten = `${ma}-${nen.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from("listings").upload(ten, nen, { upsert: false, contentType: "video/mp4" });
  if (error && !/exists|duplicate|409/i.test(error.message)) return { loi: `Tải lên thất bại: ${error.message}` };
  return { url: supabase.storage.from("listings").getPublicUrl(ten).data.publicUrl };
}
