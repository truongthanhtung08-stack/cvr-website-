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
// ════════════════════════════════════════════════════════════════════════════

const KHO = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

export async function GET(_req: Request, ctx: { params: Promise<{ duong: string[] }> }) {
  const { duong } = await ctx.params;
  const duongDan = duong.map(encodeURIComponent).join("/");

  let res = await fetch(`${KHO}/${duongDan}`, { cache: "no-store" });

  // KHÔNG CÓ BẢN NHỎ THÌ TRẢ ẢNH GỐC. Thẻ tin xin ảnh ở `nho/` (xem anhNho()
  // trong src/lib/asset.ts) để trang nhẹ đi, nhưng tin vừa đăng thì bản nhỏ
  // chưa kịp sinh ra. Không có lối lui này là ảnh vỡ ngay khi khách đăng tin —
  // hỏng đúng chỗ đau nhất. Có lối lui thì chậm hơn chút chứ không bao giờ vỡ.
  if (res.status === 404 && duong[1] === "nho") {
    const goc = [duong[0], ...duong.slice(2)].map(encodeURIComponent).join("/");
    res = await fetch(`${KHO}/${goc}`, { cache: "no-store" });
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
