// ════════════════════════════════════════════════════════════════════════════
// SOI TÀI KHOẢN SUPABASE TỪ DÒNG LỆNH — không cần mở trình duyệt
//
// VÌ SAO: trang dashboard của Supabase KHÔNG lái được bằng tiện ích Chrome (đã
// thử lại 12/09/2026: vào được, đăng nhập sẵn, nhưng đọc chữ ra rỗng và chụp
// màn hình thì treo). Thành ra mỗi lần cần biết hạn mức lại phải nhờ chủ dự án
// chụp màn hình. Đường này đi thẳng qua API quản trị, tự đọc được.
//
// CẦN GÌ: một token cá nhân, tạo ở
//     https://supabase.com/dashboard/account/tokens
// rồi thêm vào .env.local (tệp này đã được git bỏ qua):
//     SUPABASE_ACCESS_TOKEN=sbp_...
//
// ⚠️ Token này mở được cả tài khoản. Đừng dán vào khung chat, đừng chụp màn
// hình có nó, và xoá đi khi không dùng nữa.
//
//   node scripts/kiem-supabase.mjs
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(GOC, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;
const REF_WEB = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^https:\/\//, "").split(".")[0];

if (!TOKEN) {
  console.error("❌ Chưa có SUPABASE_ACCESS_TOKEN trong .env.local.");
  console.error("   Tạo ở https://supabase.com/dashboard/account/tokens rồi thêm một dòng:");
  console.error("   SUPABASE_ACCESS_TOKEN=sbp_...");
  process.exit(1);
}

const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const goi = async (duong, tuyChon = {}) => {
  const r = await fetch(`https://api.supabase.com${duong}`, { headers: H, ...tuyChon });
  const chu = await r.text();
  let d = null;
  try {
    d = JSON.parse(chu);
  } catch {
    /* trả về không phải JSON */
  }
  return { ok: r.ok, ma: r.status, d, chu };
};

const MB = (b) => (b / 1048576).toFixed(0) + " MB";

console.log("SOI TÀI KHOẢN SUPABASE");
console.log("═".repeat(66));

// ── 1. TỔ CHỨC ──────────────────────────────────────────────────────────────
const to = await goi("/v1/organizations");
if (!to.ok) {
  console.error(`❌ Token không dùng được (${to.ma}): ${to.chu.slice(0, 150)}`);
  process.exit(1);
}
console.log(`\n① TỔ CHỨC (${to.d.length})`);
for (const o of to.d) console.log(`   · ${o.name}  [slug: ${o.id ?? o.slug}]  gói: ${o.plan?.name ?? o.plan ?? "?"}`);

// ── 2. PROJECT — cái nào là cái web đang dùng ───────────────────────────────
const pj = await goi("/v1/projects");
if (pj.ok) {
  console.log(`\n② PROJECT (${pj.d.length}) — web đang dùng: ${REF_WEB}`);
  for (const p of pj.d) {
    const dau = p.id === REF_WEB ? "👉 ĐANG DÙNG" : "   khác     ";
    console.log(`   ${dau} ${p.name} | ref ${p.id} | ${p.region} | ${p.status} | tạo ${String(p.created_at).slice(0, 10)}`);
  }
} else console.log(`\n② Không đọc được danh sách project (${pj.ma})`);

// ── 3. HẠN MỨC — thử các đường sẵn có ───────────────────────────────────────
// Supabase KHÔNG công bố một đường chính thức nào cho phần hạn mức/egress, nên
// thử lần lượt; đường nào trả về được thì in ra, không thì nói thẳng là không có.
console.log("\n③ HẠN MỨC");
const slug = to.d[0]?.id ?? to.d[0]?.slug;
const duongThu = [
  `/v1/organizations/${slug}/usage`,
  `/platform/organizations/${slug}/usage`,
  `/platform/organizations/${slug}/billing/subscription`,
  `/platform/projects/${REF_WEB}/usage`,
];
let raDuoc = false;
for (const d of duongThu) {
  const r = await goi(d);
  if (r.ok && r.d) {
    console.log(`   ✅ ${d}`);
    const ds = Array.isArray(r.d) ? r.d : r.d.usages ?? r.d.usage ?? null;
    if (Array.isArray(ds)) {
      for (const m of ds) {
        const dung = m.usage ?? m.usage_billable ?? m.current;
        const han = m.pricing_free_units ?? m.free_units ?? m.limit;
        const vuot = han && dung > han ? "  🔴 VƯỢT" : "";
        console.log(`      ${String(m.metric ?? m.key).padEnd(34)} ${dung} / ${han ?? "?"}${vuot}`);
      }
    } else console.log("      " + JSON.stringify(r.d).slice(0, 700));
    raDuoc = true;
    break;
  }
}
if (!raDuoc) {
  console.log("   ⚠️ API quản trị không trả phần hạn mức (các đường đã thử đều bị từ chối).");
  console.log("   → Phải xem bằng mắt ở dashboard: dải cam → Review usage.");
}

// ── 4. DUNG LƯỢNG THẬT — hỏi thẳng cơ sở dữ liệu ────────────────────────────
console.log("\n④ DUNG LƯỢNG ĐO TRỰC TIẾP TRONG CSDL");
const sql = async (q) => {
  const r = await goi(`/v1/projects/${REF_WEB}/database/query`, {
    method: "POST",
    body: JSON.stringify({ query: q }),
  });
  return r.ok ? r.d : null;
};
const co = await sql("select pg_database_size(current_database()) as b");
if (co) console.log(`   Cơ sở dữ liệu: ${MB(Number(co[0].b))} (gói free cho 500 MB)`);
else console.log("   ⚠️ Không chạy được câu lệnh SQL qua API (token thiếu quyền hoặc đường bị khoá).");

const kho = await sql(
  "select count(*) as so, coalesce(sum((metadata->>'size')::bigint),0) as b from storage.objects",
);
if (kho) console.log(`   Kho tệp: ${kho[0].so} tệp, ${MB(Number(kho[0].b))} (gói free cho 1 GB)`);

const bang = await sql(
  `select relname, pg_total_relation_size(c.oid) as b from pg_class c
   join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r'
   order by b desc limit 8`,
);
if (bang) {
  console.log("   Bảng nặng nhất:");
  for (const b of bang) console.log(`      ${String(b.relname).padEnd(26)} ${MB(Number(b.b))}`);
}

console.log("\n" + "═".repeat(66));
