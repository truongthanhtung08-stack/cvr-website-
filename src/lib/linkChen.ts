// LINK CHÈN DƯỚI TIN — quyền lợi CVR Diamond (quy định gói, chốt 01/10/2026).
// Chỉ nhận địa chỉ web http/https hợp lệ; còn lại bỏ (không lưu, không hiện).
export function linkHopLe(u?: string | null): string | null {
  const t = (u ?? "").trim();
  if (!t) return null;
  try {
    const x = new URL(t);
    return x.protocol === "http:" || x.protocol === "https:" ? x.toString() : null;
  } catch {
    return null;
  }
}
