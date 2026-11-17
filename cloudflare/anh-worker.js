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

    // Video: Safari / iPhone tải theo từng đoạn (Range) — trả 206 thẳng từ R2, không qua bộ đệm.
    if (req.headers.has("range")) {
      const doan = await env.ANH.get(khoa, { range: req.headers });
      if (!doan) return fetch(SUPABASE + khoa.split("/").map(encodeURIComponent).join("/"), { headers: { range: req.headers.get("range") } });
      const h = new Headers();
      doan.writeHttpMetadata(h);
      const tu = doan.range && "offset" in doan.range ? doan.range.offset : 0;
      const dai = doan.range && "length" in doan.range ? doan.range.length : doan.size - tu;
      h.set("content-range", "bytes " + tu + "-" + (tu + dai - 1) + "/" + doan.size);
      h.set("content-length", String(dai));
      h.set("accept-ranges", "bytes");
      h.set("cache-control", NAM);
      return new Response(doan.body, { status: 206, headers: h });
    }

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
      let goc = await fetch(SUPABASE + khoa.split("/").map(encodeURIComponent).join("/"));
      // Bản nhỏ chưa kịp tạo (tin vừa đăng) → trả ảnh gốc, như src/lib/asset.ts hứa; không ghi vào R2 dưới tên bản nhỏ.
      if (!goc.ok && khoa.startsWith("listings/nho/")) {
        const anhGoc = await env.ANH.get("listings/" + khoa.slice(13));
        if (anhGoc) return new Response(anhGoc.body, { headers: { "content-type": anhGoc.httpMetadata?.contentType || "image/webp", "cache-control": "public, max-age=300" } });
        goc = await fetch(SUPABASE + ("listings/" + khoa.slice(13)).split("/").map(encodeURIComponent).join("/"));
        if (goc.ok) return new Response(goc.body, { headers: { "content-type": goc.headers.get("content-type") || "image/webp", "cache-control": "public, max-age=300" } });
      }
      if (!goc.ok) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });
      const loai = goc.headers.get("content-type") || "application/octet-stream";
      const buf = await goc.arrayBuffer();
      ctx.waitUntil(env.ANH.put(khoa, buf, { httpMetadata: { contentType: loai } }));
      res = new Response(buf, { headers: { "content-type": loai } });
    }
    res.headers.set("cache-control", NAM);
    res.headers.set("access-control-allow-origin", "*");
    res.headers.set("accept-ranges", "bytes");
    ctx.waitUntil(cache.put(req, res.clone()));
    return res;
  },
};
