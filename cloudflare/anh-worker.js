// ════════════════════════════════════════════════════════════════════════════
// ẢNH QUA CLOUDFLARE — anh.coastalland.vn (anh 17/11/2026: "ảnh và video qua YouTube và Cloudflare",
// giới hạn chi phí Vercel + Supabase). Chạy trên Cloudflare Workers (gói miễn phí 100.000 lượt/ngày).
//
// Đường đi: khách → Cloudflare (bộ đệm gần VN) → R2 (băng thông miễn phí). Ảnh chưa có ở R2 (khách vừa tải lên
// Supabase) → lấy từ Supabase MỘT lần, chép vào R2, lần sau đọc R2. Không đụng cách khách tải ảnh lên (bước ④).
// Không gửi cookie → Vercel (rewrite /anh/* trong vercel.json) lưu được bộ đệm (HIT) thay vì MISS mỗi lượt.
//
// Cài (Cloudflare → Workers & Pages → Create → dán tệp này):
//   · Bindings → R2 bucket: tên biến ANH = bucket coastal-land-anh
//   · Settings → Domains & Routes → Custom domain: anh.coastalland.vn
// ════════════════════════════════════════════════════════════════════════════
const SUPABASE = "https://miyugmacyerqvzhgmbyd.supabase.co/storage/v1/object/public/";
const NAM = "public, max-age=31536000, immutable";

export default {
  async fetch(req, env, ctx) {
    if (req.method !== "GET" && req.method !== "HEAD") return new Response(null, { status: 405 });
    const url = new URL(req.url);
    const khoa = decodeURIComponent(url.pathname.slice(1));
    if (!khoa || khoa.includes("..")) return new Response("Not found", { status: 404 });

    const cache = caches.default;
    const daCo = await cache.match(req);
    if (daCo) return daCo;

    let res;
    const obj = await env.ANH.get(khoa);
    if (obj) {
      const h = new Headers();
      obj.writeHttpMetadata(h);
      h.set("etag", obj.httpEtag);
      res = new Response(obj.body, { headers: h });
    } else {
      const goc = await fetch(SUPABASE + khoa.split("/").map(encodeURIComponent).join("/"));
      if (!goc.ok) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });
      const loai = goc.headers.get("content-type") || "application/octet-stream";
      const buf = await goc.arrayBuffer();
      ctx.waitUntil(env.ANH.put(khoa, buf, { httpMetadata: { contentType: loai } }));
      res = new Response(buf, { headers: { "content-type": loai } });
    }
    res.headers.set("cache-control", NAM);
    res.headers.set("access-control-allow-origin", "*");
    ctx.waitUntil(cache.put(req, res.clone()));
    return res;
  },
};
