"use client";

import { useRef, useState } from "react";
import { uploadImageFile, uploadVideoFile } from "@/lib/uploadImage";
import { isVideoUrl } from "@/lib/media";

// Ô nhập NỘI DUNG có chèn ẢNH & VIDEO giữa bài (Tin đăng · Dự án · Tin tức).
// Mỗi đoạn xuống 1 dòng. Chèn ảnh → dòng ![](url) · chèn video → dòng @[video](url)
// tại vị trí con trỏ. Web hiển thị đúng chỗ đó. Khung cao rộng trên MOBILE để dễ nhập.
export default function ContentEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [error, setError] = useState("");

  // Chèn 1 dòng (marker ảnh/video) tại con trỏ, luôn nằm trên dòng riêng.
  function insertLine(line: string) {
    const ta = taRef.current;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const pre = before && !before.endsWith("\n") ? "\n" : "";
    const post = after && !after.startsWith("\n") ? "\n" : "";
    const next = `${before}${pre}${line}${post}${after}`;
    onChange(next);
    const caret = (before + pre + line).length;
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(caret, caret);
    });
  }

  const insertImage = (url: string) => { if (url.trim()) insertLine(`![](${url.trim()})`); };
  const insertVideo = (url: string) => { if (url.trim()) insertLine(`@[video](${url.trim()})`); };

  async function handleImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploadingImg(true);
    for (const file of Array.from(files)) {
      const { url, error: e } = await uploadImageFile(file);
      if (e) setError(e);
      else if (url) insertImage(url);
    }
    setUploadingImg(false);
    if (imgRef.current) imgRef.current.value = "";
  }

  async function handleVideo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploadingVideo(true);
    const { url, error: e } = await uploadVideoFile(file);
    setUploadingVideo(false);
    if (e) setError(e);
    else if (url) insertVideo(url);
    if (videoRef.current) videoRef.current.value = "";
  }

  // Dán link: tự nhận diện video (YouTube/Vimeo/tệp video) hay ảnh.
  function addLink() {
    const url = link.trim();
    if (!url) return;
    if (isVideoUrl(url)) insertVideo(url);
    else insertImage(url);
    setLink("");
    setShowLink(false);
  }

  return (
    <div className="space-y-2">
      {/* Thanh công cụ chèn ảnh / video */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          disabled={uploadingImg}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" /></svg>
          {uploadingImg ? "Đang tải ảnh…" : "Chèn ảnh"}
        </button>
        <input ref={imgRef} type="file" accept="image/*" multiple onChange={(e) => handleImages(e.target.files)} className="hidden" />

        <button
          type="button"
          onClick={() => videoRef.current?.click()}
          disabled={uploadingVideo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
          {uploadingVideo ? "Đang tải video…" : "Chèn video"}
        </button>
        <input ref={videoRef} type="file" accept="video/*" onChange={(e) => handleVideo(e.target.files)} className="hidden" />

        <button
          type="button"
          onClick={() => setShowLink((v) => !v)}
          className="text-xs font-medium text-cvr-muted transition hover:text-cvr-ink"
        >
          hoặc dán link ảnh / video
        </button>
      </div>

      {showLink && (
        <div className="flex items-center gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
            placeholder="Dán link ảnh, hoặc video (YouTube/Vimeo/mp4)…"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
          />
          <button
            type="button"
            onClick={addLink}
            className="shrink-0 rounded-lg border border-cvr-line px-3 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Chèn
          </button>
        </div>
      )}

      {/* Khung nhập — cao rộng trên mobile, gọn lại trên màn lớn */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="min-h-[340px] w-full rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-sm leading-relaxed text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink sm:min-h-[240px]"
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}
      <p className="text-xs text-cvr-faint">
        Mỗi <strong>đoạn</strong> xuống 1 dòng. Bấm <strong>“Chèn ảnh”</strong> / <strong>“Chèn video”</strong> để thêm ngay giữa bài — ảnh &amp; video sẽ hiện đúng vị trí đó trên web.
      </p>
    </div>
  );
}
