// ════════════════════════════════════════════════════════════════════════════
// KIỂM: TÊN MIỀN ĐÃ CHUYỂN SANG CLOUDFLARE CHƯA? EMAIL OTP CÒN SỐNG KHÔNG?
// Chạy: node scripts/kiem-dns.mjs   (hoặc bấm KIEM-DNS.bat)
// Bối cảnh + bản sao 6 bản ghi: docs/DNS-SAO-LUU-17-09-2026.md
// ════════════════════════════════════════════════════════════════════════════
const hoi = async (ten, loai) => {
  try {
    const r = await fetch(`https://dns.google/resolve?name=${ten}&type=${loai}`);
    return ((await r.json()).Answer || []).map((x) => x.data);
  } catch { return []; }
};

const CAN = [
  { ten: "coastalland.vn", loai: "A", mong: "216.198.79.1", vi: "Vercel — mất là WEB SẬP" },
  { ten: "www.coastalland.vn", loai: "CNAME", mong: "cname.vercel-dns.com", vi: "Vercel (www)" },
  { ten: "send.coastalland.vn", loai: "CNAME", mong: "send.forge.rmta.net", vi: "Resend — mất là MẤT OTP" },
  { ten: "rsend.coastalland.vn", loai: "CNAME", mong: "rsend.forge.rmta.net", vi: "Resend — mất là MẤT OTP" },
  { ten: "resend._domainkey.coastalland.vn", loai: "TXT", mong: "p=MIGfMA0GCS", vi: "Chữ ký thư (DKIM)" },
  { ten: "_dmarc.coastalland.vn", loai: "TXT", mong: "v=DMARC1", vi: "Chống giả mạo thư" },
];

const ns = await hoi("coastalland.vn", "NS");
const daChuyen = ns.some((x) => x.includes("ns.cloudflare.com"));

console.log("\n═══ TÊN MIỀN coastalland.vn ═══\n");
console.log(`Nameserver: ${ns.join(" · ") || "(chưa đọc được)"}`);
console.log(daChuyen
  ? "→ ✅ ĐÃ chuyển sang Cloudflare\n"
  : "→ ⏳ CHƯA chuyển (vẫn ở PA Vietnam). Tên miền .vn qua VNNIC nên mất 4–24 giờ — cứ chờ.\n");

let hong = 0;
for (const c of CAN) {
  const kq = await hoi(c.ten, c.loai);
  const ok = kq.some((x) => x.replace(/"/g, "").includes(c.mong));
  if (!ok) hong++;
  console.log(`${ok ? "✅" : "❌"} ${c.ten.padEnd(34)} ${c.loai.padEnd(6)} ${ok ? "đúng" : "SAI/THIẾU → " + c.vi}`);
}

const web = await fetch("https://coastalland.vn").then((r) => r.status).catch(() => 0);
console.log(`\nWeb coastalland.vn: ${web === 200 ? "✅ 200" : "❌ " + web}`);

if (hong) console.log(`\n⚠️ CÓ ${hong} BẢN GHI SAI — mở docs/DNS-SAO-LUU-17-09-2026.md đối chiếu và sửa lại bên Cloudflare.`);
else if (daChuyen) console.log("\n→ Xong phần DNS. Việc tiếp: gắn tên miền riêng cho ảnh (anh.coastalland.vn) — bảo Claude làm.");
else console.log("\n→ Chưa có gì phải lo. Chờ lan truyền rồi chạy lại lệnh này.\n");
