// Rung phản hồi nhẹ khi tương tác (II.7 — Haptic Feedback).
// Lưu ý: Vibration API chỉ hoạt động trên thiết bị hỗ trợ (đa số Android/Chrome);
// iOS Safari KHÔNG hỗ trợ → hàm tự bỏ qua, không lỗi.
export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms);
    } catch {
      /* bỏ qua nếu trình duyệt chặn */
    }
  }
}
