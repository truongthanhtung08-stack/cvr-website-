// Tiện ích media dùng chung: phân biệt ẢNH và VIDEO, và dựng URL nhúng cho
// YouTube/Vimeo. Video = link YouTube/Vimeo, hoặc tệp .mp4/.webm/.mov… (đã tải lên).

export function isVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url) || /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(url);
}

// Link YouTube/Vimeo → URL nhúng iframe. Tệp video trực tiếp → null (dùng thẻ <video>).
// rel=0: hết phim KHÔNG hiện gợi ý video của kênh khác (đối thủ) đè lên tin của mình.
export function videoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&playsinline=1`;
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
}

// KHUNG HÌNH CHỜ của video YouTube — để chỗ video trong thư viện ảnh KHÔNG phải là
// ô đen trơn. Mình không tự chứa video (tốn dung lượng) nên ít nhất phải có tấm hình
// như batdongsan. maxres không phải video nào cũng có → hỏng thì lùi về hq (luôn có).
export function videoPosterUrl(url: string): { hd: string; thuong: string } | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (!yt) return null;
  return {
    hd: `https://i.ytimg.com/vi/${yt[1]}/maxresdefault.jpg`,
    thuong: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
  };
}
