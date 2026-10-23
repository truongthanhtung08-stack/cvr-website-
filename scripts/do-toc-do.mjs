// ĐO TỐC ĐỘ kiểu điện thoại tầm trung (CPU chậm 4x, 4G yếu): node --experimental-websocket scripts/do-toc-do.mjs <url> [so_lan] — xem memory toc-do-web-lam-tiep
import { spawn } from 'node:child_process';
import { thuMucTam } from './_thuMucTam.mjs';
const [url, lanArg] = process.argv.slice(2);
const lan = Number(lanArg || 3);
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 300);
const p = spawn(edge, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + thuMucTam('edge-hn' + port), 'about:blank']);
await new Promise(r => setTimeout(r, 4000));
const t = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(x => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Network.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setCPUThrottlingRate', { rate: 4 });
await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__do={lt:[],lcp:0,fcp:0};
  new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__do.lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask',buffered:true});
  new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__do.lcp=Math.round(e.startTime))).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(e.name==='first-contentful-paint')window.__do.fcp=Math.round(e.startTime)})).observe({type:'paint',buffered:true});
` });
const kq = [];
for (let i = 0; i < lan; i++) {
  await send('Network.clearBrowserCache');
  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 15000));
  const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(()=>{const d=window.__do;const n=performance.getEntriesByType('navigation')[0];const res=performance.getEntriesByType('resource');const js=res.filter(x=>x.name.endsWith('.js')||x.name.includes('.js?'));const tbt=d.lt.filter(x=>x[0]>d.fcp).reduce((a,x)=>a+Math.max(0,x[1]-50),0);return {fcp:d.fcp,lcp:d.lcp,tbt,lt:d.lt.slice(0,12),load:Math.round(n.loadEventEnd),html:n.transferSize,js:js.reduce((a,x)=>a+x.transferSize,0),nJs:js.length,img:res.filter(x=>x.initiatorType==='img').reduce((a,x)=>a+x.transferSize,0)}})()` });
  kq.push(r.result.value ?? r.exceptionDetails?.exception?.description ?? r);
}
console.log(JSON.stringify(kq, null, 0));
ws.close(); p.kill(); process.exit(0);
