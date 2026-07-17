"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { asset } from "@/lib/asset";

// Quản lý ảnh tin đăng: TẢI TỪ MÁY (Supabase Storage) hoặc DÁN LINK.
// value là mảng đường dẫn — phần tử ĐẦU TIÊN là ẢNH ĐẠI DIỆN (hiện trên thẻ tin).
// "Đặt làm đại diện" = đưa ảnh đó lên đầu mảng.
export default function ImagePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (imgs: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  // Link ảnh không tải được (trang nguồn chặn hotlink / không phải ảnh trực tiếp)
  const [broken, setBroken] = useState<string[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    const supabase = createClient();
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Chỉ tải được tệp ảnh (jpg, png, webp…).");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`Ảnh "${file.name}" quá 10MB — vui lòng chọn ảnh nhỏ hơn.`);
        continue;
      }
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safe}`;
      const { error: upErr } = await supabase.storage.from("listings").upload(path, file, { upsert: false });
      if (upErr) {
        setError(
          /bucket not found|does not exist/i.test(upErr.message)
            ? "Chưa tạo kho ảnh. Chạy migration 0004_listings_storage.sql trong Supabase → SQL Editor."
            : `Tải ảnh thất bại: ${upErr.message}`
        );
        continue;
      }
      added.push(supabase.storage.from("listings").getPublicUrl(path).data.publicUrl);
    }
    if (added.length) onChange([...value, ...added]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

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
      {/* Lưới ảnh đã có */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`group relative overflow-hidden rounded-xl border bg-cvr-surface ${
                i === 0 ? "border-cvr-ink ring-2 ring-cvr-ink/15" : "border-cvr-line"
              }`}
            >
              <div className="aspect-[4/3]">
                {broken.includes(src) ? (
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
                aria-label="Xoá ảnh"
                className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/80"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {/* Thanh đáy: ảnh đại diện (viền vàng) hoặc nút LUÔN HIỆN để đặt đại diện */}
              {i === 0 ? (
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
          ))}
        </div>
      )}

      {/* Nút tải ảnh + dán link */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
          {uploading ? "Đang tải ảnh…" : "Tải ảnh từ máy"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <span className="text-xs text-cvr-faint">hoặc</span>

        <div className="flex flex-1 items-center gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
            placeholder="Dán link ảnh (https://… hoặc /images/tin/1.jpg)"
            className="h-10 min-w-[200px] flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
          />
          <button
            type="button"
            onClick={addLink}
            className="rounded-lg border border-cvr-line px-3 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Thêm
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}
      <p className="text-xs text-cvr-faint">
        Ảnh có nhãn <strong>“Ảnh đại diện”</strong> sẽ hiện trên thẻ tin. Bấm <strong>“Đặt làm đại diện”</strong> dưới ảnh bất kỳ để đổi. Tối đa 10MB/ảnh.
      </p>
      <p className="text-xs text-cvr-faint">
        💡 Nên dùng <strong>“Tải ảnh từ máy”</strong> để chắc chắn hiện được. Link ảnh copy từ web khác (muaban, batdongsan…) thường bị chặn nên không hiển thị.
      </p>
    </div>
  );
}
