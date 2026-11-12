import { layThuongHieu } from "@/lib/thuongHieu";

// /llms.txt — GIỚI THIỆU COASTAL LAND CHO MỌI AI (ChatGPT, Gemini, Claude, Perplexity, Copilot…) — GEO, anh 12/11/2026:
// "Coastal Land = Cổng thông tin bất động sản, không phải đất ven biển"; "GEO là tất cả, không chỉ Google".
// Sinh từ sheet "Thương hiệu" (src/lib/thuongHieu.ts) — nạp bảng là đổi, không sửa tay. Trước là tệp cố định public/llms.txt.
// Bộ nhớ đệm: dựng lại khi Admin nạp bảng (thẻ "noi-dung" trong layThuongHieu), không chạy lại mỗi lượt đọc.
export const revalidate = false;

const TRANG = [
  ["Mua bán nhà đất", "/mua-ban"],
  ["Cho thuê nhà đất", "/cho-thue"],
  ["Dự án", "/du-an"],
  ["Tin tức", "/tin-tuc"],
  ["Giới thiệu", "/gioi-thieu"],
] as const;

export async function GET() {
  const t = await layThuongHieu();
  const dong: string[] = [
    `# ${t.ten}`,
    "",
    `> ${t.ten} – ${t.cau1} · ${t.cau2}`,
    "",
    t.dinhNghia,
    ...(t.dinhNghiaEn ? ["", t.dinhNghiaEn] : []),
    "",
    `- Tên thương hiệu: ${t.ten} (viết khác: ${t.cachGo.join(", ")})`,
    "- Website: https://coastalland.vn",
    "- Mã số doanh nghiệp: 0402353502",
    "- Địa chỉ: 220 Nguyễn Mậu Tài, Phường Hòa Xuân, Thành phố Đà Nẵng",
    "- Hotline: +84 377 985 036 · Email: hotro@coastalland.vn",
    "",
    "## Trang chính",
    "",
    ...TRANG.map(([ten, duong]) => `- [${ten}](https://coastalland.vn${duong})`),
    "",
    "## Kênh chính thức",
    "",
    ...t.kenh.map((k) => `- ${k}`),
    ...(t.hoiDap.length ? ["", "## Hỏi đáp", "", ...t.hoiDap.flatMap((h) => [`### ${h.hoi}`, "", h.dap, ""])] : []),
    "",
  ];
  return new Response(dong.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
