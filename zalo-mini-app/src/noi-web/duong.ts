// Đường web → màn Mini App tương ứng (form đăng tin web chạy trong Mini App). Không có màn tương ứng → null (không đi đâu).
// ⛔ Nạp tiền: Zalo cấm trong Mini App (từ chối bản 78) → không bao giờ dẫn tới.
export function duongMiniApp(href: string): string | null {
  const [p, q = ""] = href.split("?");
  const qs = q ? `?${q}` : "";
  if (p.startsWith("/tai-khoan/nap-tien")) return null;
  if (p === "/dang-tin") return `/dang-tin${qs}`;
  if (p.startsWith("/tai-khoan/tin-dang")) return "/tin-cua-toi";
  if (p.startsWith("/tai-khoan/cai-dat") || p.startsWith("/tai-khoan/ca-nhan")) return "/cai-dat";
  if (p.startsWith("/tai-khoan/hoa-don")) return "/hoa-don";
  if (p.startsWith("/tai-khoan")) return "/tai-khoan";
  if (p.startsWith("/bao-gia") || p.startsWith("/bang-gia")) return "/bang-gia";
  if (p.startsWith("/bat-dong-san/")) return `/tin/${p.split("/").pop()?.split("-").pop()}`;
  if (p === "/" ) return "/";
  if (p.startsWith("/quy-dinh") || p.startsWith("/dieu-khoan") || p.startsWith("/chinh-sach")) return `/thong-tin${p}`;
  return null;
}
