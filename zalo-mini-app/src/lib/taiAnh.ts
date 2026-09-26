import { chooseImage } from "zmp-sdk";
import { supabase } from "./supabase";

// Chọn ảnh tin + tải lên ĐÚNG như web (src/lib/uploadImage.ts):
// nén cạnh dài tối đa 2048px, WebP 80% (lùi JPEG), đóng dấu COASTAL LAND góc phải dưới,
// tên tệp = mã băm nội dung (ảnh trùng không bị lưu hai lần), kèm bản nhỏ 1280px ở nho/.

const CANH_TOI_DA = 2048;

/** Mở bảng chọn của Zalo: thư viện ảnh hoặc máy ảnh, chọn nhiều tấm. */
export async function chonAnh(toiDa: number): Promise<Blob[]> {
  try {
    const kq = await chooseImage({ count: toiDa, sourceType: ["album", "camera"] });
    return Promise.all(kq.filePaths.map(async (p) => (await fetch(p)).blob()));
  } catch {
    return chonAnhTrinhDuyet(toiDa); // chạy thử ngoài Zalo (trình duyệt máy tính)
  }
}

function chonAnhTrinhDuyet(toiDa: number): Promise<Blob[]> {
  return new Promise((xong) => {
    const o = document.createElement("input");
    o.type = "file";
    o.accept = "image/*";
    o.multiple = true;
    o.onchange = () => xong(Array.from(o.files ?? []).slice(0, toiDa));
    o.click();
  });
}

function dongDau(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const co = Math.max(13, Math.round(w * 0.028));
  const le = Math.round(w * 0.022);
  ctx.save();
  ctx.font = `600 ${co}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.round(co * 0.5);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText("COASTAL LAND", w - le, h - le);
  ctx.restore();
}

async function nen(anh: Blob, canh = CANH_TOI_DA, chatLuong = 0.8): Promise<Blob> {
  try {
    const bm = await createImageBitmap(anh);
    const ti = Math.min(1, canh / Math.max(bm.width, bm.height));
    const w = Math.round(bm.width * ti);
    const h = Math.round(bm.height * ti);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return anh;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bm, 0, 0, w, h);
    bm.close?.();
    dongDau(ctx, w, h);
    let b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", chatLuong));
    if (!b || b.type !== "image/webp") b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    return b ?? anh;
  } catch {
    return anh;
  }
}

/** Nén + tải một ảnh lên kho "listings". Trả về đường dẫn công khai. */
export async function taiAnhLen(anh: Blob): Promise<string> {
  const ban = await nen(anh);
  const bam = await crypto.subtle.digest("SHA-256", await ban.arrayBuffer());
  const ma = Array.from(new Uint8Array(bam).slice(0, 12), (x) => x.toString(16).padStart(2, "0")).join("");
  const ten = `${ma}-zalo${ban.type === "image/webp" ? ".webp" : ".jpg"}`;
  const { error } = await supabase.storage.from("listings").upload(ten, ban, { upsert: false, contentType: ban.type });
  if (error && !/exists|duplicate|409/i.test(error.message)) throw new Error(`Tải ảnh thất bại: ${error.message}`);
  // Bản nhỏ cho thẻ tin — hỏng cũng không sao, thẻ dùng ảnh gốc.
  nen(anh, 1280, 0.78)
    .then((nho) => supabase.storage.from("listings").upload(`nho/${ten}`, nho, { upsert: true, contentType: nho.type }))
    .catch(() => {});
  return supabase.storage.from("listings").getPublicUrl(ten).data.publicUrl;
}
