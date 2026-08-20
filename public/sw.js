/* ============================================================================
   SERVICE WORKER — COASTAL LAND
   ----------------------------------------------------------------------------
   Mục tiêu: web cài lên màn hình chính chạy như app (mở nhanh, mất mạng vẫn có
   trang báo tử tế), NHƯNG KHÔNG được làm nội dung bị cũ.

   ⚠️ NGUYÊN TẮC SỐNG CÒN: nội dung sửa trong /admin phải hiện NGAY trên web.
   Vì vậy:
     · Trang (HTML) → LUÔN gọi mạng trước. Chỉ khi mất mạng mới lấy bản lưu.
     · Dữ liệu Supabase là tên miền khác → service worker KHÔNG đụng tới.
     · /api, /admin, /auth → không đụng, không lưu.
   Chỉ những thứ bất biến (JS/CSS có mã băm trong tên) mới lấy từ bộ nhớ trước.
   ========================================================================== */

// v2 (20/8/2026): dựng lại bộ icon app (logo to sát khung) → phải nâng số hiệu này,
// nếu không máy đã cài vẫn hiện icon cũ lấy từ bộ nhớ đệm.
const VERSION = "cl-v2";
const SHELL = `${VERSION}-shell`; // trang báo mất mạng + icon
const ASSETS = `${VERSION}-assets`; // JS/CSS/font có mã băm — bất biến
const MEDIA = `${VERSION}-media`; // ảnh trong /images, /logo
const PAGES = `${VERSION}-pages`; // bản lưu dự phòng của trang, CHỈ dùng khi mất mạng

const OFFLINE_URL = "/offline.html";

// Không bao giờ đụng tới các đường dẫn này.
const BYPASS = [/^\/api\//, /^\/admin/, /^\/auth\//, /^\/dang-nhap/, /^\/dang-ky/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

// Bản mới lên là dọn sạch bản cũ ngay, không để người dùng kẹt ở phiên bản cũ.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Cho phép trang yêu cầu service worker mới nhận việc ngay.
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Google Fonts… để nguyên
  if (BYPASS.some((re) => re.test(url.pathname))) return;

  // 1. Trang HTML — MẠNG TRƯỚC. Mất mạng mới lấy bản lưu, cuối cùng là trang báo lỗi.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(OFFLINE_URL))),
    );
    return;
  }

  // 2. JS/CSS/font của Next — tên có mã băm nên không bao giờ cũ → lấy bộ nhớ trước.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, ASSETS));
    return;
  }

  // 3. Ảnh, logo, icon — dùng bản lưu cho nhanh rồi âm thầm tải bản mới về thay.
  if (/^\/(images|logo|icons)\//.test(url.pathname) || /\.(png|jpe?g|webp|avif|svg)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, MEDIA));
  }

  // Còn lại (dữ liệu Next, manifest…) để trình duyệt tự lo — luôn mới.
});

function cacheFirst(req, cacheName) {
  return caches.match(req).then(
    (hit) =>
      hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(cacheName).then((c) => c.put(req, copy));
        return res;
      }),
  );
}

function staleWhileRevalidate(req, cacheName) {
  return caches.match(req).then((hit) => {
    const fresh = fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(cacheName).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => hit);
    return hit || fresh;
  });
}
