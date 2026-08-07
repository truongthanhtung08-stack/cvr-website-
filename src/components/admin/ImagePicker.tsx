"use client";

import { useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { isVideoUrl } from "@/lib/media";
import { uploadImageFile, uploadVideoFile } from "@/lib/uploadImage";

// Quản lý MEDIA tin đăng/dự án: ẢNH và VIDEO — TẢI TỪ MÁY hoặc DÁN LINK.
// value là mảng đường dẫn (ảnh + video xen kẽ theo thứ tự thêm). ẢNH ĐẠI DIỆN =
// ẢNH ĐẦU TIÊN trong mảng (video không làm đại diện). "Đặt làm đại diện" = đưa ảnh đó lên đầu.
export default function ImagePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (imgs: string[]) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  // Link ảnh không tải được (trang nguồn chặn hotlink / không phải ảnh trực tiếp)
  const [broken, setBroken] = useState<string[]>([]);

  // Chỉ số ẢNH ĐẠI DIỆN = ảnh (không phải video) ĐẦU TIÊN trong mảng.
  const coverIdx = value.findIndex((v) => !isVideoUrl(v));

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploadingImg(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const { url, error: e } = await uploadImageFile(file);
      if (e) setError(e);
      else if (url) added.push(url);
    }
    if (added.length) onChange([...value, ...added]);
    setUploadingImg(false);
    if (imgRef.current) imgRef.current.value = "";
  }

  async function handleVideoFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploadingVideo(true);
    const { url, error: e } = await uploadVideoFile(file);
    setUploadingVideo(false);
    if (e) setError(e);
    else if (url) onChange([...value, url]);
    if (videoRef.current) videoRef.current.value = "";
  }

  // Dán link: nhận cả link ảnh và link video (YouTube/Vimeo/mp4) — thêm vào mảng.
  function addLink() {
    const url = link.trim();
    if (!url) return;
    onChange([...value, url]);
    setLink("");
  }

  const setCover = (i: number) => onChange([value[i], ...value.filter((_, j) => j !== i)]);
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      {/* Lưới media đã có */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((src, i) => {
            const video = isVideoUrl(src);
            const isCover = !video && i === coverIdx;
            return (
              <div
                key={`${src}-${i}`}
                className={`group relative overflow-hidden rounded-xl border bg-cvr-surface ${
                  isCover ? "border-cvr-ink ring-2 ring-cvr-ink/15" : "border-cvr-line"
                }`}
              >
                <div className="aspect-[4/3]">
                  {video ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-cvr-ink/90 p-2 text-center text-white">
                      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      <span className="text-[10px] font-medium">Video</span>
                    </div>
                  ) : broken.includes(src) ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                      <svg className="h-6 w-6 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" /></svg>
                      <span className="text-[10px] font-medium text-cvr-muted">Link ảnh không hiện được</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={asset(src)}
                      alt={`Ảnh ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={() => setBroken((b) => (b.includes(src) ? b : [...b, src]))}
                    />
                  )}
                </div>

                {/* Xoá (góc trên phải) */}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Xoá"
                  className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/80"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Thanh đáy: ảnh đại diện / đặt đại diện (chỉ ẢNH). Video: nhãn "Video". */}
                {video ? null : isCover ? (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-cvr-ink/90 py-1 text-[11px] font-semibold text-white">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" /></svg>
                    Ảnh đại diện
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/45 py-1 text-[11px] font-medium text-white transition hover:bg-black/70"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5l2.35 5.09 5.55.62-4.13 3.74 1.14 5.46L11.48 21l-4.91-2.99 1.14-5.46-4.13-3.74 5.55-.62L11.48 3.5z" /></svg>
                    Đặt làm đại diện
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Nút tải ảnh / video + dán link */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          disabled={uploadingImg}
          className="inline-flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
          {uploadingImg ? "Đang tải ảnh…" : "Tải ảnh từ máy"}
        </button>
        <input ref={imgRef} type="file" accept="image/*" multiple onChange={(e) => handleImageFiles(e.target.files)} className="hidden" />

        <button
          type="button"
          onClick={() => videoRef.current?.click()}
          disabled={uploadingVideo}
          className="inline-flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
          {uploadingVideo ? "Đang tải video…" : "Tải video từ máy"}
        </button>
        <input ref={videoRef} type="file" accept="video/*" onChange={(e) => handleVideoFile(e.target.files)} className="hidden" />

        <span className="text-xs text-cvr-faint">hoặc</span>

        {/* Cả hàng dán link phải co được trong màn hình điện thoại */}
        <div className="flex w-full min-w-0 flex-1 items-center gap-2 sm:w-auto">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
            placeholder="Dán link ảnh hoặc video (YouTube/Vimeo/mp4)…"
            // min-w-0 (KHÔNG đặt bề rộng tối thiểu cứng) → trên điện thoại ô co lại
            // vừa màn hình, nút "Thêm" không bị đẩy ra ngoài mép phải.
            className="h-10 w-full min-w-0 flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
          />
          <button
            type="button"
            onClick={addLink}
            className="shrink-0 rounded-lg border border-cvr-line px-3 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Thêm
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}
      <p className="text-xs text-cvr-faint">
        Ảnh có nhãn <strong>“Ảnh đại diện”</strong> hiện trên thẻ tin (video không làm đại diện). Bấm <strong>“Đặt làm đại diện”</strong> dưới ảnh bất kỳ để đổi. Ảnh ≤ 10MB · Video ≤ 50MB.
      </p>
      <p className="text-xs text-cvr-faint">
        💡 Nên <strong>tải ảnh/video từ máy</strong> để chắc chắn hiện được. Link video hỗ trợ YouTube, Vimeo hoặc link .mp4 trực tiếp.
      </p>
    </div>
  );
}
