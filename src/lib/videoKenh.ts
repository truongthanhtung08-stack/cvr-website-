// ════════════════════════════════════════════════════════════════════════════
// GẮN VIDEO TỪ KÊNH YOUTUBE VỀ ĐÚNG TIN — nút "Gắn video từ YouTube" ở Admin → Tin đăng
// (chủ dự án 25/10/2026: "up lên YouTube, công khai là lên thẳng web"; chỉ chạy khi chủ bấm, không tự chạy).
// Cùng luật với scripts/video-len-kenh.mjs (lệnh `gan`) + scripts/doc-video-kenh.mjs — sửa luật thì sửa cả hai.
// Mỗi lần bấm: đọc trang kênh công khai (không cần khoá API) + một lượt đọc bảng listings. Không tốn thêm gì khi không bấm.
// ════════════════════════════════════════════════════════════════════════════

const TEN_KENH = "@CoastalLandvn";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type Video = { id: string; ten: string };

// Lấy khối JSON lớn nhúng trong trang kênh (ytInitialData)
function bocJson(html: string, moc: string): unknown {
  const i = html.indexOf(moc);
  if (i < 0) return null;
  const j = html.indexOf("{", i);
  if (j < 0) return null;
  let sau = 0, trongChuoi = false, thoat = false;
  for (let k = j; k < html.length; k++) {
    const c = html[k];
    if (thoat) { thoat = false; continue; }
    if (c === "\\") { thoat = true; continue; }
    if (c === '"') trongChuoi = !trongChuoi;
    else if (!trongChuoi) {
      if (c === "{") sau++;
      else if (c === "}" && --sau === 0) {
        try { return JSON.parse(html.slice(j, k + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

// Nhặt video ở cả tab Video (lockupViewModel / videoRenderer) lẫn Shorts (shortsLockupViewModel)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nhatVideo(nut: any, thung: Map<string, Video>, mocTiep: string[]) {
  if (!nut || typeof nut !== "object") return;
  if (Array.isArray(nut)) { for (const x of nut) nhatVideo(x, thung, mocTiep); return; }
  if (nut.continuationCommand?.token) mocTiep.push(nut.continuationCommand.token);
  const v = nut.videoRenderer ?? nut.reelItemRenderer;
  if (v?.videoId) thung.set(v.videoId, { id: v.videoId, ten: v.title?.runs?.[0]?.text ?? v.title?.simpleText ?? v.headline?.simpleText ?? "" });
  const g = nut.lockupViewModel;
  if (g?.contentId && g.contentType === "LOCKUP_CONTENT_TYPE_VIDEO")
    thung.set(g.contentId, { id: g.contentId, ten: g.metadata?.lockupMetadataViewModel?.title?.content ?? "" });
  const s = nut.shortsLockupViewModel;
  if (s) {
    const id = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ?? s.entityId?.replace(/^shorts-shelf-item-/, "");
    if (id) thung.set(id, { id, ten: s.overlayMetadata?.primaryText?.content ?? "" });
  }
  for (const k of Object.keys(nut)) nhatVideo(nut[k], thung, mocTiep);
}

// Toàn bộ video CÔNG KHAI của kênh (video không công khai / bị chặn thì kênh không liệt kê → không gắn)
export async function docVideoKenh(): Promise<Video[]> {
  const thung = new Map<string, Video>();
  for (const tab of ["shorts", "videos"]) {
    const r = await fetch(`https://www.youtube.com/${TEN_KENH}/${tab}`, { headers: { "user-agent": UA, "accept-language": "vi,en;q=0.9" }, cache: "no-store" });
    if (!r.ok) continue;
    const html = await r.text();
    const data = bocJson(html, "ytInitialData");
    if (!data) continue;
    const mocTiep: string[] = [];
    nhatVideo(data, thung, mocTiep);
    const khoa = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) ?? [])[1];
    const banWeb = (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) ?? [])[1];
    let tiep: string | undefined = mocTiep[0];
    for (let vong = 0; khoa && banWeb && tiep && vong < 20; vong++) {
      const res = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${khoa}`, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": UA },
        body: JSON.stringify({ context: { client: { clientName: "WEB", clientVersion: banWeb, hl: "vi", gl: "VN" } }, continuation: tiep }),
        cache: "no-store",
      });
      if (!res.ok) break;
      const mocSau: string[] = [];
      nhatVideo(await res.json(), thung, mocSau);
      tiep = mocSau[0];
    }
  }
  return [...thung.values()];
}

// Mã tin trong tiêu đề video: mã có đuôi ngày ở CUỐI ("… dn20-2410", YouTube hay đổi "-" thành dấu cách),
// hoặc [mã] trong ngoặc vuông, hoặc mã ở cuối tiêu đề. Không dò giữa câu (đo 17/09: "Bàu Làng 2" khớp bừa).
export function maTuTieuDe(ten: string): string {
  const t = String(ten).trim();
  const coNgay = /(?:^|[\s\-–—|,.[])([a-z]{2,10}\d{1,3})[\s-]+(\d{4})\s*\]?\s*$/i.exec(t);
  if (coNgay) return `${coNgay[1]}-${coNgay[2]}`.toLowerCase();
  const trongNgoac = /\[\s*([a-z]{2,10}\d{1,3})\s*\]/i.exec(t);
  if (trongNgoac) return trongNgoac[1].toLowerCase();
  const cuoi = /(?:^|[\s\-–—|,.])([a-z]{2,10}\d{1,3})\s*$/i.exec(t);
  return cuoi ? cuoi[1].toLowerCase() : "";
}

// Mã cũ không có ngày (dn06 có 3 tin) thì phải khớp cả 32 ký tự đầu tiêu đề, kẻo gắn nhầm nhà
function cungMotTin(tenVideo: string, tieuDeTin: string) {
  const goi = (x: string) => String(x ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const a = goi(tenVideo), b = goi(tieuDeTin);
  const n = Math.min(32, a.length, b.length);
  return n >= 12 && a.slice(0, n) === b.slice(0, n);
}

const laYt = (u: string) => /youtu\.be\/|youtube\.com\/(watch\?v=|shorts\/|embed\/)/i.test(String(u));

type Tin = { id: string; title: string | null; created_at: string; images: string[] | null; details: { maAnh?: string } | null };

// Việc cần gắn: tin MỚI NHẤT mang mã đó, chưa có video, mã có ngày (hoặc mã cũ mà tiêu đề khớp)
export function viecGanVideo(video: Video[], tins: Tin[]) {
  const theoMa = new Map<string, Video>();
  for (const v of video) { const ma = maTuTieuDe(v.ten); if (ma && !theoMa.has(ma)) theoMa.set(ma, v); }
  const tinMoiNhat = new Map<string, Tin>();
  for (const t of tins) {
    const ma = t.details?.maAnh;
    if (!ma) continue;
    const cu = tinMoiNhat.get(ma);
    if (!cu || String(t.created_at) > String(cu.created_at)) tinMoiNhat.set(ma, t);
  }
  const viec: { t: Tin; ma: string; images: string[] }[] = [];
  for (const [ma, v] of theoMa) {
    const t = tinMoiNhat.get(ma);
    if (!t) continue;
    if (!/-\d{4}$/.test(ma) && !cungMotTin(v.ten, t.title ?? "")) continue;
    const imgs = t.images ?? [];
    if (imgs.some(laYt)) continue;
    viec.push({ t, ma, images: [...imgs, `https://youtu.be/${v.id}`] });
  }
  return viec;
}
