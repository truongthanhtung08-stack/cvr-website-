// ============================================================================
// NÉN VIDEO NGAY TRÊN MÁY KHÁCH TRƯỚC KHI TẢI LÊN (chốt 08/10/2026)
// ----------------------------------------------------------------------------
// Kho Supabase nhận tối đa 50MB/tệp (đo thật 08/10: 51MB bị trả 413), mà video
// quay điện thoại 1–2 phút thường 60–120MB. Chủ dự án chốt: ảnh/video quá chuẩn
// thì web TỰ nén về chuẩn — khách hay admin up đều vậy.
//
// Chuẩn: cạnh ngắn ≤ 720px (dọc hay ngang giữ nguyên như khách quay), H.264/AAC
// MP4, dung lượng ≤ ~45MB. Nén bằng WebCodecs (thư viện mediabunny) — chạy trên
// trình duyệt, không tốn máy chủ.
// Trình duyệt không nén được → trả lại tệp gốc; uploadVideoFile tự báo nếu gốc
// vẫn quá 50MB.
// ============================================================================

export const TRAN_VIDEO_MB = 50;
const DICH_MB = 44; // chừa khoảng cho phần đầu tệp MP4
const CANH_NGAN = 720;

export async function nenVideo(file: File, onTienDo?: (phanTram: number) => void): Promise<File> {
  // Đã nhẹ thì giữ nguyên — nén thêm chỉ làm mờ hình.
  if (file.size <= DICH_MB * 1024 * 1024) return file;
  try {
    const { Input, ALL_FORMATS, BlobSource, Output, Mp4OutputFormat, BufferTarget, Conversion, Quality } = await import("mediabunny");
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
    const track = await input.getPrimaryVideoTrack();
    if (!track) return file;
    const giay = Math.max(1, await input.computeDuration());
    // Bitrate vừa đủ để cả video nằm dưới DICH_MB (trừ 128 kbps tiếng), tối đa 3 Mbps.
    const bitrate = Math.min(3_000_000, Math.floor((DICH_MB * 8 * 1024 * 1024) / giay) - 128_000);
    if (bitrate < 300_000) return file; // video quá dài — nén nữa thì hỏng hình

    const ngang = track.displayWidth >= track.displayHeight;
    const canhNgan = Math.min(track.displayWidth, track.displayHeight);
    const coKhung = canhNgan > CANH_NGAN ? (ngang ? { height: CANH_NGAN } : { width: CANH_NGAN }) : {};

    const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
    const conversion = await Conversion.init({
      input,
      output,
      // forceTranscode + bitrate "constant": thiếu một trong hai thì trình duyệt chỉ chép
      // lại hoặc bỏ qua mức bitrate — đo thật 08/10: 82MB → 66MB; đủ cả hai → 33MB.
      video: { ...coKhung, codec: "avc", quality: new Quality({ bitrate, bitrateMode: "constant" }), forceTranscode: true },
      audio: { codec: "aac", quality: new Quality({ bitrate: 128_000 }) },
      showWarnings: false,
    });
    if (!conversion.isValid) return file;
    if (onTienDo) conversion.onProgress = (p) => onTienDo(Math.round(p * 100));
    await conversion.execute();
    const buf = output.target.buffer;
    if (!buf || buf.byteLength >= file.size) return file;
    return new File([buf], file.name.replace(/\.[^.]+$/, "") + ".mp4", { type: "video/mp4" });
  } catch {
    return file;
  }
}
