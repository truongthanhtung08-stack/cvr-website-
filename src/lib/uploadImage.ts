// Tải 1 tệp media (ảnh/video) lên Supabase Storage (bucket "listings") → trả URL công khai.
// Dùng chung cho các ô nhập có chèn ảnh/video (ContentEditor, avatar…).
import { createClient } from "@/lib/supabase/client";

export type UploadResult = { url?: string; error?: string };

async function uploadMedia(file: File, kind: "image" | "video", maxMB: number): Promise<UploadResult> {
  if (!file.type.startsWith(`${kind}/`))
    return {
      error: kind === "image"
        ? "Chỉ tải được tệp ảnh (jpg, png, webp…)."
        : "Chỉ tải được tệp video (mp4, webm, mov…).",
    };
  if (file.size > maxMB * 1024 * 1024)
    return { error: `Tệp "${file.name}" quá ${maxMB}MB — vui lòng chọn tệp nhỏ hơn.` };

  const supabase = createClient();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safe}`;
  const { error } = await supabase.storage.from("listings").upload(path, file, { upsert: false });
  if (error) {
    return {
      error: /bucket not found|does not exist/i.test(error.message)
        ? "Chưa tạo kho ảnh. Chạy migration 0004_listings_storage.sql trong Supabase → SQL Editor."
        : `Tải lên thất bại: ${error.message}`,
    };
  }
  return { url: supabase.storage.from("listings").getPublicUrl(path).data.publicUrl };
}

// Ảnh tối đa 10MB · Video tối đa 50MB (giới hạn upload Supabase Storage mặc định).
export const uploadImageFile = (file: File) => uploadMedia(file, "image", 10);
export const uploadVideoFile = (file: File) => uploadMedia(file, "video", 50);
