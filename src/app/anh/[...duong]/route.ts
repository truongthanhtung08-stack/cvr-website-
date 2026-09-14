// ════════════════════════════════════════════════════════════════════════════
// ẢNH ĐI QUA CHÍNH coastalland.vn  →  /anh/<đường-dẫn-trong-kho>
//
// Vì sao cần (5/9/2026):
//   · Bộ tối ưu ảnh của Vercel hết hạn mức gói free → trả 402, TRẮNG hết ảnh.
//   · Cho tải thẳng từ miyugmacyerqvzhgmbyd.supabase.co thì lại phụ thuộc việc
//     máy khách có vào được tên miền đó không (nhà mạng / wifi / DNS chặn là hỏng).
//
// Cách này: web tự đọc ảnh từ kho rồi trả về cho khách dưới tên miền của mình.
// Không tốn hạn mức tối ưu ảnh, không phụ thuộc supabase.co ở phía người xem,
// và CDN của Vercel giữ bản sao 1 năm nên lần sau tức thì (ảnh có mã băm trong
// tên nên không bao giờ cũ).
//
// 14/9/2026 — ĐỔI KHO ẢNH SANG CLOUDFLARE R2:
//   Supabase tính băng thông (5 GB/tháng, đã bị doạ khoá dự án 08/10) còn R2
//   MIỄN PHÍ băng thông. Ảnh đã chép sang R2 bằng scripts/chuyen-anh-sang-r2.mjs,
//   giữ NGUYÊN đường dẫn nên địa chỉ /anh/... ngoài mặt không đổi một chữ.
//   ⚠️ VẪN GIỮ LỐI LUI ĐỌC SUPABASE: tin khách vừa đăng thì ảnh mới chỉ nằm ở
//   Supabase, chưa kịp chép sang R2 — không có lối lui là vỡ ảnh ngay chỗ đau nhất.
// ════════════════════════════════════════════════════════════════════════════

const KHO = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;
const R2 = "https://pub-5e85138c92944aca9e95aa0b4239c758.r2.dev";

// Hỏi R2 trước, không có thì quay về kho Supabase.
async function doc(duongDan: string) {
  const r2 = await fetch(`${R2}/${duongDan}`, { cache: "no-store" });
  if (r2.ok) return r2;
  return fetch(`${KHO}/${duongDan}`, { cache: "no-store" });
}

export async function GET(_req: Request, ctx: { params: Promise<{ duong: string[] }> }) {
  const { duong } = await ctx.params;
  const duongDan = duong.map(encodeURIComponent).join("/");

  let res = await doc(duongDan);

  // KHÔNG CÓ BẢN NHỎ THÌ TRẢ ẢNH GỐC. Thẻ tin xin ảnh ở `nho/` (xem anhNho()
  // trong src/lib/asset.ts) để trang nhẹ đi, nhưng tin vừa đăng thì bản nhỏ
  // chưa kịp sinh ra. Không có lối lui này là ảnh vỡ ngay khi khách đăng tin —
  // hỏng đúng chỗ đau nhất. Có lối lui thì chậm hơn chút chứ không bao giờ vỡ.
  if (res.status === 404 && duong[1] === "nho") {
    const goc = [duong[0], ...duong.slice(2)].map(encodeURIComponent).join("/");
    res = await doc(goc);
  }

  if (!res.ok || !res.body) {
    return new Response("Không tìm thấy ảnh", { status: res.status === 404 ? 404 : 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/webp",
      // Tên tệp có mã thời gian nên nội dung không bao giờ đổi → giữ thật lâu.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
