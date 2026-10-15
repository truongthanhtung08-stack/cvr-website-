// ============================================================================
// INDEXNOW (MASTER mục 8.4, 15/10/2026) — báo Bing và các công cụ tham gia NGAY khi một
// trang đổi (tin vừa duyệt, vừa sửa, vừa hết hạn). Chỉ là thông báo, không bảo đảm lập chỉ mục.
// Khoá IndexNow là CÔNG KHAI theo thiết kế (tệp public/<khoá>.txt) — không phải bí mật.
// Mỗi lần tin đổi = một lệnh gửi; không lịch chạy riêng. Lỗi mạng → bỏ qua, không chặn việc chính.
// ============================================================================

const SITE = "https://coastalland.vn";
export const KHOA_INDEXNOW = "b56811c5c4663f004961d6aa9735b955";

export async function baoIndexNow(duongDan: string[]): Promise<void> {
  const urlList = Array.from(new Set(duongDan)).slice(0, 1000).map((p) => (p.startsWith("http") ? p : `${SITE}${p}`));
  if (urlList.length === 0 || process.env.VERCEL_ENV !== "production") return;
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "coastalland.vn", key: KHOA_INDEXNOW, keyLocation: `${SITE}/${KHOA_INDEXNOW}.txt`, urlList }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // bỏ qua — thông báo phụ, không ảnh hưởng duyệt tin
  }
}
