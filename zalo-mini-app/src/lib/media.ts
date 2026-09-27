// ẢNH vs VIDEO trong cột images của tin — chép từ web (src/lib/media.ts).
// Video nằm chung mảng images (link YouTube/Vimeo hoặc tệp mp4…), phải tách ra:
// thẻ tin lấy ẢNH đầu tiên làm bìa, trang tin cho video đứng đầu dãy như web.

export const laVideo = (url: string) =>
  /youtube\.com|youtu\.be|vimeo\.com/i.test(url) || /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(url);

export const tachAnh = (ds: string[] | null | undefined) => (ds ?? []).filter((u) => u && !laVideo(u));
export const tachVideo = (ds: string[] | null | undefined) => (ds ?? []).filter((u) => u && laVideo(u));

// Link YouTube/Vimeo → địa chỉ nhúng (giống web: không gợi ý video kênh khác, phát ngay trong khung).
// Tệp video trực tiếp → null (dùng thẻ <video>).
export function nhungVideo(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1&color=white`;
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}?byline=0&portrait=0&title=0`;
  return null;
}
