// DÒ LỖI GIAO DIỆN CƠ BẢN TRÊN CẢ WEB — tự kiểm trước khi push (chủ dự án 22/10/2026: "tôi không thể kiểm, toàn lỗi cơ bản —
// làm cả hệ thống để sửa, không vá tay"). Mở từng trang ở khổ điện thoại (390, chạm) và máy tính (1280), tìm:
//   chu-bi-ep  : chữ dài bị ép thành cột hẹp (một vật bên cạnh không co lại — vd ô "Trong vòng 10 phút")
//   tu-bi-gay  : một từ dài hơn khung chứa → gãy giữa từ ("Riversid-e") hoặc lòi ra ngoài
//   chu-chong  : hai khối chữ nhìn thấy đè lên nhau
//   tran-ngang : trang rộng hơn màn hình (kéo ngang được)
//   anh-hong   : ảnh không hiện
//   nut-trung  : hai nút / link cùng chữ đứng sát nhau
// Chạy: node --experimental-websocket scripts/do-loi-giao-dien.mjs [http://localhost:3000] [trang1 trang2 …]  (vd: bao-gia-dang-tin faq)
// Không ghi trang thì dò danh sách trang chính bên dưới. Dòng cuối "TONG LOI: 0" mới được push.
import { spawn } from 'node:child_process';
import { thuMucTam } from './_thuMucTam.mjs';

const goc = (process.argv[2] && process.argv[2].startsWith('http')) ? process.argv[2] : 'http://localhost:3000';
// Git Bash đổi "/trang" thành đường dẫn ổ đĩa → nhận cả "trang" không gạch đầu, tự thêm "/"
const trangGhi = process.argv.slice(2).filter((x) => !x.startsWith('http')).map((x) => '/' + x.replace(/^.*?:[\\/].*?Git[\\/]/, '').replace(/^\/+/, ''));
const TRANG = trangGhi.length ? trangGhi : [
  '/', '/mua-ban', '/cho-thue', '/du-an', '/tin-tuc', '/chuyen-gia', '/tien-ich', '/bao-gia-dang-tin', '/lien-he',
  '/gioi-thieu', '/faq', '/huong-dan', '/mua-ban/condotel/da-nang', '/dang-nhap', '/dang-ky',
];

const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9650 + Math.floor(Math.random() * 100);
const p = spawn(edge, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + thuMucTam('edge-dl' + port), 'about:blank']);
await new Promise((r) => setTimeout(r, 4000));
const t = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find((x) => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = {};
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// Bộ dò chạy trong trang
const DO = `(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.8)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); }
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  const vw = innerWidth, loi = [];
  const an = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || c.opacity === '0') return true; if (x.parentElement?.tagName === 'DETAILS' && !x.parentElement.open && x.tagName !== 'SUMMARY') return true; } return false; };
  // khung nhìn thấy = giao với mọi cha cắt tràn (overflow hidden/auto) — chữ bị khung cắt đi thì không tính là đè
  const thay = (e) => { let r = e.getBoundingClientRect(); let l = r.left, t = r.top, rr = r.right, b = r.bottom;
    for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const c = getComputedStyle(x);
      if (c.overflow !== 'visible' || c.overflowX !== 'visible' || c.overflowY !== 'visible') { const k = x.getBoundingClientRect(); l = Math.max(l, k.left); t = Math.max(t, k.top); rr = Math.min(rr, k.right); b = Math.min(b, k.bottom); } }
    return { l, t, r: rr, b, w: rr - l, h: b - t }; };
  const ctx = document.createElement('canvas').getContext('2d');
  const la = [...document.querySelectorAll('p,h1,h2,h3,h4,h5,span,a,button,li,label,td,th,dd,dt,strong,div')].filter((e) => {
    const chu = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (chu.length < 3 || e.closest('svg,script,style,[aria-hidden=true],.maplibregl-map')) return false;
    const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !an(e);
  });
  for (const e of la) {
    const chu = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim();
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    if (c.textOverflow === 'ellipsis' || c.webkitLineClamp !== 'none' && c.webkitLineClamp) continue; // cố ý cắt "…"
    const lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.3;
    const rong = r.width - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight);
    if (chu.length > 25 && r.width < Math.min(160, vw * 0.42) && Math.round(r.height / lh) >= 4) loi.push({ loai: 'chu-bi-ep', w: Math.round(r.width), chu: chu.slice(0, 50) });
    ctx.font = c.fontStyle + ' ' + c.fontWeight + ' ' + c.fontSize + ' ' + c.fontFamily;
    const tu = chu.split(/\\s+/).filter((w) => !/^(https?:|www\\.)|@|\\//.test(w)).sort((a, b) => ctx.measureText(b).width - ctx.measureText(a).width)[0];
    if (tu && tu.length > 3 && ctx.measureText(tu).width > rong + 2 && c.whiteSpace !== 'nowrap') loi.push({ loai: 'tu-bi-gay', tu, w: Math.round(rong), chu: chu.slice(0, 40) });
  }
  // chữ đè chữ (chỉ phần nhìn thấy, không tính lớp nổi absolute/fixed)
  // bỏ chữ nằm trong lớp nổi / thanh dính (menu, thanh mục, nút nổi) — chúng cố ý nằm trên nội dung
  const noi = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) if (['absolute', 'fixed', 'sticky'].includes(getComputedStyle(x).position)) return true; return false; };
  const kh = la.filter((e) => !e.querySelector('p,span,a,button,li,label,strong,div') && !noi(e)).map((e) => [e, thay(e)]).filter(([, v]) => v.w > 0 && v.h > 0);
  let dem = 0;
  for (let i = 0; i < kh.length && dem < 6; i++) for (let j = i + 1; j < Math.min(kh.length, i + 30); j++) {
    const [a, ra] = kh[i], [b, rb] = kh[j]; if (a.contains(b) || b.contains(a)) continue;
    const x = Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l), y = Math.min(ra.b, rb.b) - Math.max(ra.t, rb.t);
    if (x > 8 && y > 6) { loi.push({ loai: 'chu-chong', a: a.textContent.trim().slice(0, 30), b: b.textContent.trim().slice(0, 30) }); dem++; }
  }
  if (document.documentElement.scrollWidth > vw + 1) loi.push({ loai: 'tran-ngang', rong: document.documentElement.scrollWidth });
  for (const im of document.querySelectorAll('img')) if (im.complete && im.naturalWidth === 0 && im.getBoundingClientRect().width > 0 && !an(im)) loi.push({ loai: 'anh-hong', src: (im.currentSrc || im.src).slice(-60) });
  const nut = [...document.querySelectorAll('button,a')].filter((b) => b.getBoundingClientRect().width > 0 && !an(b));
  for (let i = 1; i < nut.length; i++) { if (nut[i - 1].parentElement !== nut[i].parentElement) continue; const ta = nut[i - 1].textContent.trim(), tb = nut[i].textContent.trim();
    if (ta && ta === tb && ta.length > 3 && Math.abs(nut[i - 1].getBoundingClientRect().top - nut[i].getBoundingClientRect().top) < 60) loi.push({ loai: 'nut-trung', chu: ta.slice(0, 40) }); }
  const gon = new Map(); for (const l of loi) { const k = JSON.stringify(l); gon.set(k, l); }
  return [...gon.values()].slice(0, 30);
})()`;

// Thêm một trang tin + một trang dự án đang có trên web (lấy link đầu tiên ở trang danh sách — không ghi cứng mã tin)
if (!trangGhi.length) {
  for (const [ds, mau] of [['/mua-ban', '/bat-dong-san/'], ['/du-an', '/du-an/']]) {
    await send('Page.navigate', { url: goc + ds }); await ngu(8000);
    const link = await ev(`[...document.querySelectorAll('a[href^="${mau}"]')].map(a=>a.getAttribute('href')).find(h=>h.split('/').length>=3&&h.length>${mau.length + 3})`);
    if (link) TRANG.push(link.split('?')[0]);
  }
}

let tong = 0;
for (const [ten, cfg] of [['DIEN THOAI', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }], ['MAY TINH', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }]]) {
  await send('Emulation.setDeviceMetricsOverride', cfg);
  await send('Emulation.setTouchEmulationEnabled', { enabled: cfg.mobile, maxTouchPoints: cfg.mobile ? 5 : 0 });
  console.log('\n=== ' + ten + ' ===');
  for (const duong of TRANG) {
    await send('Page.navigate', { url: goc + duong }); await ngu(9000);
    const loi = (await ev(DO)) ?? [{ loai: 'khong-do-duoc' }];
    tong += loi.length;
    console.log((loi.length ? 'LOI ' + loi.length : 'OK') + '  ' + duong);
    for (const l of loi) console.log('   ' + JSON.stringify(l));
  }
}
console.log('\nTONG LOI: ' + tong);
ws.close(); p.kill();
process.exit(0);
