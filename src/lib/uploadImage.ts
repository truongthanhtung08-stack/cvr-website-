// Tải 1 tệp media (ảnh/video) lên Supabase Storage (bucket "listings") → trả URL công khai.
// Dùng chung cho các ô nhập có chèn ảnh/video (ContentEditor, avatar…).
import { createClient } from "@/lib/supabase/client";

export type UploadResult = { url?: string; error?: string };

// ── TỰ NÉN ẢNH TRƯỚC KHI TẢI LÊN ────────────────────────────────────────────
// Kho ảnh Supabase gói miễn phí chỉ 1GB. Ảnh gốc điện thoại 3–5MB, 500 tin ×
// 7 ảnh là vài chục GB → chắc chắn vỡ trần. Thu cạnh dài về 1600px + JPEG chất
// lượng 82% cho ra ~150–350KB/ảnh, mắt thường không phân biệt được trên web.
// Ảnh vốn đã nhỏ hơn bản nén thì giữ nguyên bản gốc.
// 2048px = mức màn hình PC nét cao (retina/4K) cần cho ảnh lớn trang chi tiết.
// Điện thoại chỉ cần ~800px nên thừa sức. Để 1600 thì ảnh lớn trên PC bị mềm.
const CANH_TOI_DA = 2048;
// WebP nhẹ hơn JPEG ~30% ở cùng độ nét → ảnh to hơn 1,28 lần mà dung lượng gần
// như không đổi. Trình duyệt nào không xuất được WebP thì tự lùi về JPEG.
const CHAT_LUONG = 0.8;
const CHAT_LUONG_JPEG = 0.85;

// ── ĐÓNG DẤU CHÌM "COASTAL LAND" ────────────────────────────────────────────
// Ký hiệu MỜ ở góc dưới phải mọi ảnh tin đăng: ảnh bị lấy đi nơi khác vẫn nhận
// ra nguồn, nhưng không che nội dung. Cỡ chữ theo bề ngang ảnh nên ảnh to hay
// nhỏ đều cân. Vẽ trước khi xuất JPEG nên dấu nằm HẲN trong ảnh, không gỡ được.
function dongDauCvr(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const co = Math.max(13, Math.round(w * 0.028));
  const le = Math.round(w * 0.022);
  ctx.save();
  ctx.font = `600 ${co}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  // Viền tối rất nhẹ để chữ vẫn đọc được trên nền ảnh sáng
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.round(co * 0.5);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText("COASTAL LAND", w - le, h - le);
  ctx.restore();
}

async function nenAnh(file: File): Promise<File> {
  // Môi trường không có canvas (SSR) hoặc ảnh dạng đặc biệt → giữ nguyên
  if (typeof document === "undefined" || !/^image\/(jpeg|png|webp)$/i.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const ti = Math.min(1, CANH_TOI_DA / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * ti);
    const h = Math.round(bitmap.height * ti);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // PNG/WebP có vùng trong suốt → JPEG không có kênh trong suốt, phải lót nền
    // TRẮNG trước, nếu không vùng đó thành ĐEN.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    dongDauCvr(ctx, w, h);

    // WebP trước; trình duyệt cũ không xuất được thì lùi về JPEG.
    // toBlob trả về đúng loại đã yêu cầu — kiểm blob.type để biết có lùi hay không.
    let blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", CHAT_LUONG));
    if (!blob || blob.type !== "image/webp")
      blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", CHAT_LUONG_JPEG));
    // Dùng bản qua canvas KỂ CẢ khi không nhẹ hơn — vì bản này mới có đóng dấu
    // COASTAL LAND. Chỉ giữ ảnh gốc khi trình duyệt không xuất được.
    if (!blob) return file;
    const duoi = blob.type === "image/webp" ? ".webp" : ".jpg";
    const ten = file.name.replace(/\.[^.]+$/, "") + duoi;
    return new File([blob], ten, { type: blob.type });
  } catch {
    return file;
  }
}

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

// Ảnh: NÉN TRƯỚC rồi mới tải lên (xem nenAnh ở trên). Giới hạn 15MB tính trên
// ảnh GỐC — ảnh máy ảnh cỡ lớn vẫn nhận, nén xong chỉ còn vài trăm KB.
export const uploadImageFile = async (file: File) => {
  if (file.size > 15 * 1024 * 1024)
    return { error: `Ảnh "${file.name}" quá 15MB — chọn ảnh nhỏ hơn.` };
  return uploadMedia(await nenAnh(file), "image", 15);
};
export const uploadVideoFile = (file: File) => uploadMedia(file, "video", 50);
