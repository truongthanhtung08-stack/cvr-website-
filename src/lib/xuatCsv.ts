// Xuất dữ liệu ra tệp CSV mở được bằng Excel — để chủ dự án tự làm báo cáo
// thống kê mà không phải vào Supabase gõ lệnh.
//
// Dấu BOM ở đầu tệp là bắt buộc: thiếu nó Excel đọc tiếng Việt thành ký tự lạ
// ("Ä'à Náºµng"), mở ra là bỏ luôn không dùng.

function oCsv(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.split('"').join('""')}"` : s;
}

export function taiCsv(tenFile: string, cot: string[], dong: unknown[][]): void {
  const noiDung = [cot.map(oCsv).join(","), ...dong.map((d) => d.map(oCsv).join(","))].join("\r\n");
  const blob = new Blob(["﻿" + noiDung], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  a.click();
  URL.revokeObjectURL(url);
}

/** Ngày hôm nay dạng 2026-09-11 — gắn vào tên tệp cho khỏi lẫn các lần tải. */
export function homNay(): string {
  return new Date().toISOString().slice(0, 10);
}
