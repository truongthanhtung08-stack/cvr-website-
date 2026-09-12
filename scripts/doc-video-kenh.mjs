// ════════════════════════════════════════════════════════════════════════════
// ĐỌC DANH SÁCH VIDEO CỦA KÊNH — KỂ CẢ SHORTS, KHÔNG CẦN KHOÁ API
//
// VÌ SAO VIẾT LẠI (đo thật 12/09/2026): bản cũ đọc đường RSS
// `youtube.com/feeds/videos.xml` — đường đó có hai tật chết người với kênh này:
//   ① KHÔNG liệt kê Shorts. Mà video bất động sản quay dọc dưới 3 phút thì
//      YouTube TỰ xếp thành Shorts → kênh có 14 video, RSS trả về 0.
//   ② Chỉ trả 15 video mới nhất, nên qua 15 tin là mất phần cũ.
//
// Nay đọc thẳng TRANG KÊNH CÔNG KHAI (cùng thứ trình duyệt tải khi người ta vào
// xem), lấy khối dữ liệu ytInitialData rồi lật tiếp từng trang. Miễn phí, không
// khoá API, không đăng nhập — quan trọng vì tài khoản Google của dự án đang bị
// gắn cờ từ vụ Maps, càng ít dính tới Google Cloud càng lành.
//
// Đổi tên kênh (@CoastalLandvn) thì sửa đúng hằng số TEN_KENH bên dưới.
// ════════════════════════════════════════════════════════════════════════════

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Lấy khối JSON lớn nhúng trong trang kênh. */
function bocJson(html, moc) {
  const i = html.indexOf(moc);
  if (i < 0) return null;
  let j = html.indexOf("{", i);
  if (j < 0) return null;
  let sau = 0,
    trongChuoi = false,
    thoat = false;
  for (let k = j; k < html.length; k++) {
    const c = html[k];
    if (thoat) {
      thoat = false;
      continue;
    }
    if (c === "\\") {
      thoat = true;
      continue;
    }
    if (c === '"') trongChuoi = !trongChuoi;
    else if (!trongChuoi) {
      if (c === "{") sau++;
      else if (c === "}") {
        sau--;
        if (sau === 0) {
          try {
            return JSON.parse(html.slice(j, k + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

/** Số trong "1.234 lượt xem" / "1,234 views". */
function docSoXem(s) {
  const n = String(s ?? "").replace(/[^\d]/g, "");
  return n ? Number(n) : 0;
}

/**
 * Đi khắp cây dữ liệu nhặt video. Trang kênh dùng HAI kiểu thẻ khác nhau:
 *   · videoRenderer          — tab "Video" (video thường)
 *   · shortsLockupViewModel  — tab "Shorts" (mã video nằm sâu trong onTap)
 * Nhặt cả hai, khử trùng theo mã video.
 */
function nhatVideo(nut, thung, mocTiep) {
  if (!nut || typeof nut !== "object") return;
  if (Array.isArray(nut)) {
    for (const x of nut) nhatVideo(x, thung, mocTiep);
    return;
  }

  if (nut.continuationCommand?.token) mocTiep.push(nut.continuationCommand.token);

  const v = nut.videoRenderer ?? nut.reelItemRenderer;
  if (v?.videoId) {
    thung.set(v.videoId, {
      id: v.videoId,
      ten: v.title?.runs?.[0]?.text ?? v.title?.simpleText ?? v.headline?.simpleText ?? "",
      xem: docSoXem(v.viewCountText?.simpleText ?? v.viewCountText?.runs?.[0]?.text),
    });
  }

  // Tab "Video" (video thường, quay ngang hoặc dài hơn 3 phút) — YouTube đã bỏ
  // videoRenderer ở đây, nay là lockupViewModel với mã nằm ở contentId.
  const g = nut.lockupViewModel;
  if (g?.contentId && g.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
    const md = g.metadata?.lockupMetadataViewModel;
    const dong = md?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
    const xem = dong
      .flatMap((r) => r.metadataParts ?? [])
      .map((p) => p.text?.content ?? "")
      .find((c) => /lượt xem|views/i.test(c));
    thung.set(g.contentId, {
      id: g.contentId,
      ten: md?.title?.content ?? "",
      xem: docSoXem(xem),
    });
  }

  const s = nut.shortsLockupViewModel;
  if (s) {
    const id =
      s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ??
      s.entityId?.replace(/^shorts-shelf-item-/, "");
    if (id) {
      thung.set(id, {
        id,
        ten: s.overlayMetadata?.primaryText?.content ?? "",
        xem: docSoXem(s.overlayMetadata?.secondaryText?.content),
      });
    }
  }

  for (const k of Object.keys(nut)) nhatVideo(nut[k], thung, mocTiep);
}

/**
 * Trả về mảng { id, ten, xem } của TOÀN BỘ video công khai trên kênh.
 * @param {string} tenKenh — dạng "@CoastalLandvn"
 */
export async function docVideoKenh(tenKenh = "@CoastalLandvn") {
  const thung = new Map();

  for (const tab of ["shorts", "videos"]) {
    const r = await fetch(`https://www.youtube.com/${tenKenh}/${tab}`, {
      headers: { "user-agent": UA, "accept-language": "vi,en;q=0.9" },
    });
    if (!r.ok) continue;
    const html = await r.text();
    const data = bocJson(html, "ytInitialData");
    if (!data) continue;

    const mocTiep = [];
    nhatVideo(data, thung, mocTiep);

    // ── Lật tiếp các trang sau ───────────────────────────────────────────────
    // Trang kênh chỉ vẽ sẵn ~10 thẻ đầu, phần còn lại tải thêm khi người xem kéo
    // xuống. Lấy đúng khoá + số hiệu bản web đang chạy rồi hỏi tiếp, y như trình
    // duyệt làm — nên không cần khoá API riêng.
    const khoa = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) ?? [])[1];
    const banWeb = (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) ?? [])[1];
    let tiep = mocTiep[0];
    let vong = 0;
    while (khoa && banWeb && tiep && vong < 20) {
      vong++;
      const res = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${khoa}`, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": UA },
        body: JSON.stringify({
          context: { client: { clientName: "WEB", clientVersion: banWeb, hl: "vi", gl: "VN" } },
          continuation: tiep,
        }),
      });
      if (!res.ok) break;
      const them = await res.json();
      const mocSau = [];
      nhatVideo(them, thung, mocSau);
      tiep = mocSau[0];
    }
  }

  return [...thung.values()];
}
