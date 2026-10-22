// KIỂM HIỂN THỊ KIỂU TRÌNH DUYỆT TRONG ZALO / FACEBOOK (chủ dự án 22/10/2026: "trên nền tảng mạng xã hội là cái bạn không để ý").
// Chạy: node --experimental-websocket scripts/kiem-mxh.mjs http://localhost:3002 [/trang1 /trang2 …]
// Giả lập điện thoại 390px, phóng chữ 130% và 160% (Zalo/Facebook tự phóng chữ theo cỡ chữ của máy, CSS không chặn được),
// rồi bắt: trang tràn ngang · nút / liên kết mà chữ tràn khỏi khung (bị lẹm, bị cắt). Dòng cuối "TRAN: 0" là đạt.
// Chỉ đọc trang, không sửa gì. Chạy trước mỗi lần báo chủ dự án xem, sau khi đụng giao diện.
import { spawn } from "node:child_process";

const [goc = "http://localhost:3002", ...dsTrang] = process.argv.slice(2);
const TRANG = dsTrang.length ? dsTrang : ["/", "/mua-ban", "/cho-thue", "/du-an", "/tin-tuc", "/mua-ban/da-nang"];
const MUC = [1.3, 1.6];

const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9650 + Math.floor(Math.random() * 100);
const p = spawn(edge, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}/edge-mxh${port}`, "about:blank"]);
await new Promise((r) => setTimeout(r, 4000));
const t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page");
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0;
const cho = {};
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (cho[m.id]) { cho[m.id](m.result); delete cho[m.id]; } };
await new Promise((r) => (ws.onopen = r));
const gui = (method, params = {}) => new Promise((r) => { const i = ++id; cho[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await gui("Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

await gui("Page.enable");
await gui("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await gui("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

let tong = 0;
for (const trang of TRANG) {
  for (const k of MUC) {
    await gui("Page.navigate", { url: goc + trang });
    await ngu(9000);
    const kq = await ev(`(async () => {
      const els = [...document.querySelectorAll("body *")];
      const co = els.map((e) => parseFloat(getComputedStyle(e).fontSize));
      els.forEach((e, i) => { e.style.fontSize = co[i] * ${k} + "px"; });
      await new Promise((r) => setTimeout(r, 900));
      const loi = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) loi.push("TRANG TRÀN NGANG " + document.documentElement.scrollWidth + "px");
      for (const e of document.querySelectorAll("button, a")) {
        if (!e.offsetParent) continue;
        const r = e.getBoundingClientRect();
        if (r.width < 24 || r.width > innerWidth) continue;
        if (e.scrollWidth > e.clientWidth + 2) loi.push("TRÀN NÚT: " + (e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 40) + " (" + e.scrollWidth + ">" + e.clientWidth + ")");
      }
      return [...new Set(loi)].slice(0, 15);
    })()`);
    tong += kq?.length ?? 0;
    console.log(`${trang} · chữ ${Math.round(k * 100)}%: ${kq?.length ? "\n  " + kq.join("\n  ") : "OK"}`);
  }
}
console.log(`TRAN: ${tong}`);
ws.close();
p.kill();
process.exit(0);
