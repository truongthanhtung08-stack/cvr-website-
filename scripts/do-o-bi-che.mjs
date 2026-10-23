// ĐO "Ô ĐANG GÕ CÓ BỊ CHE KHÔNG" trên điện thoại giả lập (CLAUDE.md mục 0A1, 21/10/2026). Chạy: node --experimental-websocket scripts/do-o-bi-che.mjs http://localhost:3000/<trang> [470]
// Không số = kiểu Zalo/Facebook (không báo bàn phím); 470 = kiểu Android co màn hình. Mọi ô phải "OK", dòng cuối "BI CHE: 0". Trang cần đăng nhập (/dang-tin) thì đo ở máy với tài khoản thử.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { thuMucTam, TAM } from './_thuMucTam.mjs';
const [url, caoPhim] = process.argv.slice(2);
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9550 + Math.floor(Math.random() * 100);
const p = spawn(edge, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + thuMucTam('edge-dc' + port), 'about:blank']);
await new Promise(r => setTimeout(r, 4000));
const t = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(x => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true, userGesture: true })).result?.value;
const ngu = (ms) => new Promise(r => setTimeout(r, ms));
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
await send('Page.navigate', { url }); await ngu(14000);
console.log('pointer coarse:', await ev('matchMedia("(pointer: coarse)").matches'));
// Đáy thấp nhất của các thanh dính trên đầu (đo độc lập với BanPhimAo)
const DO = `(() => {
  const ds=[...document.querySelectorAll('header,.sticky,.fixed')].filter(n=>/^(sticky|fixed)$/.test(getComputedStyle(n).position)).map(n=>n.getBoundingClientRect()).filter(r=>r.height>0&&r.width>=innerWidth*0.5&&r.height<=innerHeight*0.4).sort((a,b)=>a.top-b.top);
  let day=0; for(const r of ds) if(r.top<=day+4) day=Math.max(day,r.bottom); return day; })()`;
const oGo = await ev(`[...document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), main textarea, main [contenteditable=true]')].filter(e=>e.offsetParent).map((e,i)=>{e.dataset.do=i;return (e.closest('div')?.querySelector('label')?.textContent||e.placeholder||e.tagName).trim().slice(0,30)})`);
console.log('so o go:', oGo.length);
let loi = 0;
for (let i = 0; i < oGo.length; i++) {
  if (caoPhim) await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await ev(`document.activeElement?.blur()`); await ngu(250);
  // đặt ô sát đáy màn hình (chỗ bàn phím sẽ che) rồi chạm vào
  await ev(`(()=>{const e=document.querySelector('[data-do="${i}"]');const r=e.getBoundingClientRect();scrollBy(0,r.top-innerHeight+60)})()`); await ngu(300);
  await ev(`document.querySelector('[data-do="${i}"]').focus()`);
  if (caoPhim) { await ngu(100); await send('Emulation.setDeviceMetricsOverride', { width: 390, height: Number(caoPhim), deviceScaleFactor: 2, mobile: true }); }
  await ngu(1200);
  const kq = await ev(`(()=>{const e=document.querySelector('[data-do="${i}"]');const r=e.getBoundingClientRect();const tren=${DO};const duoi=${caoPhim ? 'innerHeight' : 'innerHeight*0.5'};return {top:Math.round(r.top),bot:Math.round(r.bottom),tren:Math.round(tren),duoi:Math.round(duoi),focus:document.activeElement===e}})()`);
  const caoO = kq.bot - kq.top;
  const ok = caoO > (kq.duoi - kq.tren) ? (kq.top >= kq.tren - 2 && kq.top < kq.duoi - 30) : (kq.top >= kq.tren - 2 && kq.bot <= kq.duoi + 2);
  if (!ok) loi++;
  console.log(`${ok ? 'OK ' : 'CHE'} ${String(i).padStart(2)} ${oGo[i].padEnd(30)} o:${kq.top}-${kq.bot}  thay:${kq.tren}-${kq.duoi}${kq.focus ? '' : ' (mất focus)'}`);
}
console.log('BI CHE:', loi, '/', oGo.length);
const anh = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
fs.writeFileSync(TAM + '/doche.jpg', Buffer.from(anh.data, 'base64'));
ws.close(); p.kill(); process.exit(0);
