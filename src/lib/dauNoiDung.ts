// Đọc dòng ảnh / video chèn giữa nội dung (cú pháp ở đầu src/components/RichContent.tsx).
// Tách khỏi RichContent (27/10/2026): ô soạn mô tả ở /dang-tin chỉ cần hai hàm này, nhập từ RichContent thì
// kéo theo cả bộ xem ảnh toàn màn hình vào mã tải lúc mở trang đăng tin.
const IMG_MARKER = /^!\[[^\]]*\]\((.+)\)$/;
const VIDEO_MARKER = /^@\[video\]\((.+)\)$/i;

export function imageMarkerUrl(line: string): string | null {
  const m = line.trim().match(IMG_MARKER);
  return m ? m[1].trim() : null;
}

export function videoMarkerUrl(line: string): string | null {
  const m = line.trim().match(VIDEO_MARKER);
  return m ? m[1].trim() : null;
}
