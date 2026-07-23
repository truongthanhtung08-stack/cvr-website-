// Tiện ích media dùng chung: phân biệt ẢNH và VIDEO, và dựng URL nhúng cho
// YouTube/Vimeo. Video = link YouTube/Vimeo, hoặc tệp .mp4/.webm/.mov… (đã tải lên).

export function isVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url) || /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(url);
}

// Link YouTube/Vimeo → URL nhúng iframe. Tệp video trực tiếp → null (dùng thẻ <video>).
export function videoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
}
