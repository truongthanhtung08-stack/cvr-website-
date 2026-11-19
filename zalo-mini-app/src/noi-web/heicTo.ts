// NỐI WEB → MINI APP: thư viện đổi ảnh HEIC của web (heic-to/next, 3,08MB) vượt giới hạn 3MB mỗi tệp của Zalo (deploy bản 86 lỗi
// 19/11/2026) → nạp từ jsDelivr lúc gặp ảnh HEIC, cùng bản 1.6.7 của web (như lib/taiAnh.ts của Mini App).
const HEIC_TO = "https://cdn.jsdelivr.net/npm/heic-to@1.6.7/dist/heic-to.js";
type HeicTo = (o: { blob: Blob; type: string; quality?: number }) => Promise<Blob>;
export const heicTo: HeicTo = async (o) => ((await import(/* @vite-ignore */ HEIC_TO)) as { heicTo: HeicTo }).heicTo(o);
