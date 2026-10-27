# ĐO TỐC ĐỘ — nhánh `claude/clever-bardeen-15e4ot` (27/10/2026)

> Phiên cloud đã sửa xong phần làm nhẹ / bỏ chờ mạng, **không đổi giao diện, bố cục, cấu trúc** (chủ dự án quán triệt).
> Cloud KHÔNG có `.env.local` (khoá Supabase) và không vào được coastalland.vn → **chưa đo được với dữ liệu thật.**
> Tệp này là danh sách việc cho phiên trên máy: đo trước/sau, bấm thử, rồi mới chờ chủ dự án nói "Push".

## TIẾN ĐỘ (phiên đo cập nhật sau MỖI bước rồi commit lên nhánh — dừng giữa chừng thì phiên sau đọc mục này làm tiếp)

- [x] Đo TRƯỚC (main) — mục 2 (xong)
- [x] Đo SAU (nhánh) — mục 2 (xong, số ở ghi chú dưới)
- [~] do-o-bi-che /dang-tin (thường + 470) = "BI CHE: 0" — chạy chưa đăng nhập ra "so o go: 0" (chỉ có màn đăng nhập) → VÔ NGHĨA;
      cần tài khoản thử đăng nhập trong trình duyệt đo (đang chờ chủ dự án đưa tài khoản thử hoặc tự bấm thử)
- [ ] Bấm thử — mục 3
- [ ] Báo chủ dự án bảng số trước/sau
- [ ] Sửa tiếp trang còn LCP > 2,5 s (nếu có, không đổi giao diện)
- [ ] Chủ dự án nói "Push" → gộp main, push MỘT lần, kiểm web thật

Ghi chú tiến độ (27/10, phiên trên máy):
- Cách đo: `npx next build` + `npx next start -p 3000` (một server). Trang tin mẫu `/bat-dong-san/21687cfc-0fc6-42bf-8bc5-cfcefbe50310`,
  dự án mẫu `/du-an/sun-galaxy-complex-da-nang`. Lighthouse 3 lần/trang (Edge headless), lấy trung vị;
  cả do-toc-do lẫn Lighthouse đều dao động mạnh ở máy này (cùng trang lệch 2–5 s) → so trước/sau theo trung vị, không theo một lần.
- main 6a9d281: HTML trang chủ **507 133 byte** (mục tiêu < 450 KB) · trang tin 175 730 byte.
- main do-toc-do (LCP ms, 2 lần): / 2740·3956 · /mua-ban 9136·5668 · /cho-thue 4792·4224 · condotel/da-nang 4648·lỗi ·
  trang tin 6316·10592 · dự án 2096·5428 · /bao-gia-dang-tin 9448·3932 · /gioi-thieu 3376·3240 · /faq 5288·7508.
- main Lighthouse (trung vị 3 lần — điểm / LCP ms / TBT ms; CLS 0 trừ trang chủ 0,047): / 50·11728·1305 · /mua-ban 51·5394·1934 ·
  /cho-thue 54·4895·1903 · condotel/da-nang 53·5324·1783 · trang tin 56·4755·1266 · dự án 47·6420·2348 (2/3 lần Lighthouse lỗi NaN — đo lại) ·
  /bao-gia-dang-tin 50·5811·1673 · /gioi-thieu 57·5820·976 · /faq 62·4024·1247.
- NHÁNH (c064c98): HTML trang chủ **480 608 byte** (−26,5 KB, CHƯA đạt < 450 KB) · trang tin 174 725 byte.
- NHÁNH Lighthouse (trung vị 3 lần — điểm / LCP / TBT): / **76**·4523·312 · /mua-ban 68·4352·701 · /cho-thue 71·4072·626 ·
  condotel/da-nang 70·4418·593 · trang tin 74·4538·374 · /bao-gia-dang-tin 51·5707·1312 · /gioi-thieu 56·6360·684 · /faq 66·3704·1010.
  Dự án: Lighthouse báo NO_LCP cả main lẫn nhánh (không phải lỗi nhánh). Lighthouse cảnh báo máy chậm hơn mức nó giả định → số dao động.
  ⇒ Mọi trang LCP Lighthouse vẫn > 2,5 s (giả lập mạng chậm). Trang chủ nhẹ hẳn (TBT 1305 → 312 ms).
- /dang-tin, /tai-khoan khi đã đăng nhập: chưa có tài khoản thử để đo — cần chủ dự án bấm thử trên máy thật.

**CHƯA CHUẨN — danh sách đầy đủ sau đợt đo 27/10 (chủ dự án quyết từng mục; mục có ⛔ phải hỏi trước khi sửa):**
1. **LCP > 2,5 s ở MỌI trang** (Lighthouse giả lập mạng chậm: 3,7–6,4 s). Nhánh đã đỡ nhiều (TBT giảm 2–4 lần) nhưng chưa đạt.
   Cần đo thêm PageSpeed Insights trên coastalland.vn SAU khi push (số khách thật) mới kết luận được trang nào thật sự chậm.
2. **HTML trang chủ 481 KB > 450 KB.** Đã đo trong HTML: phần đếm "Xem N tin" (`tinDem`, `src/lib/goiYTrangChu.ts` →
   `TimTrangChu`) chở sẵn **157 tin = 48 KB** (~300 byte/tin) → bỏ ra là còn ~433 KB, ĐẠT. Còn lại: DOM 243 KB · dữ liệu RSC khác ~163 KB.
   ⛔ **Lỗi cấu trúc:** phần này lớn theo số tin — 10.000 tin ≈ 3 MB HTML trang chủ (memory `web-phai-chiu-10000-tin`).
   Hướng sửa (CHƯA LÀM, cần chủ duyệt vì đụng ô tìm trang chủ đã duyệt + thêm đường tải dữ liệu): máy chủ tính sẵn các câu chữ chạy
   (chỉ vài câu) gửi kèm trang; danh sách đếm tải khi khách MỞ ô lọc, từ một tệp JSON có bộ nhớ đệm CDN, xoá đệm cùng lúc trang chủ
   làm mới (không thêm cron, không thêm lần chạy máy chủ theo lượt xem). Sau khi sửa phải bấm thử lại: "Xem N tin" ra đúng số như cũ,
   công tắc Tin xác thực / Môi giới chuyên nghiệp, chữ chạy gợi ý.
3. **/gioi-thieu LCP 6,4 s** (main 5,8 s — trong sai số máy đo): ảnh đầu trang `hero-gioi-thieu.jpg` 300 KB. Nén thêm sẽ thấy giảm
   chất lượng (đã thử, mục 5). Hướng chuẩn: chủ dự án đặt ảnh điện thoại riêng ~1080 px ở Admin → Nội dung web → Giới thiệu.
4. **/bao-gia-dang-tin: không đỡ** (điểm 50 → 51, TBT 1 673 → 1 312 ms) — chưa tìm nguyên nhân; phiên sau xem thành phần nào chạy
   nặng lúc mở trang (Lighthouse → "bootup-time", "mainthread-work-breakdown").
5. **/du-an/<slug>: Lighthouse báo NO_LCP** cả main lẫn nhánh — trang không có phần tử nào Lighthouse tính được LCP (ảnh đầu có thể
   là nền CSS / khung trượt ẩn lúc mở). Google cũng sẽ không đo được LCP trang này. Phiên sau xem ảnh đầu trang dự án dựng thế nào.
6. **Chưa đo / chưa bấm thử (cần đăng nhập):** /dang-tin (thời gian form hiện + do-o-bi-che), /tai-khoan, trọn quy trình đăng tin,
   voucher, nạp thêm, admin đăng hộ. Cần tài khoản thử, hoặc chủ dự án tự bấm trên localhost:3000 (bản nhánh) + điện thoại thật.
7. **Bấm thử giao diện mục 3** (PC + điện thoại, so với web thật): chưa làm — chủ dự án bấm, hoặc phiên sau chụp so sánh.

**PHIÊN MỚI "LÀM TIẾP" — đọc trước:**
- Trạng thái máy: thư mục chính có thể đang ở **detached HEAD trên nhánh** (để build + đo). Xong việc đo/bấm thử phải
  `git checkout main` trả về. `src/lib/trichMoTa.ts` hiện "M" chỉ do khác ký tự xuống dòng (CRLF) — không phải sửa thật, để nguyên.
- Số đo phải lấy ĐÚNG cách như main: tắt mọi server cổng 3000 → `npx next build` → `npx next start -p 3000` → chạy 2 vòng dưới.
- Vòng 1 (do-toc-do + cỡ HTML), trong Git Bash ở thư mục chính:
  ```
  ID=21687cfc-0fc6-42bf-8bc5-cfcefbe50310; SLUG=sun-galaxy-complex-da-nang
  curl -s http://localhost:3000/ | wc -c
  for p in / /mua-ban /cho-thue /mua-ban/condotel/da-nang /bat-dong-san/$ID /du-an/$SLUG /bao-gia-dang-tin /gioi-thieu /faq; do
    curl -s -o /dev/null http://localhost:3000$p; echo "$p"; node --experimental-websocket scripts/do-toc-do.mjs http://localhost:3000$p 2; done
  ```
- Vòng 2 (Lighthouse 3 lần/trang, lấy trung vị điểm / LCP / TBT / CLS):
  ```
  export CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  npx -y lighthouse http://localhost:3000<trang> --only-categories=performance --output=json --output-path=lh.json --chrome-flags="--headless=new" --quiet
  ```
  (đọc `categories.performance.score`, `audits['largest-contentful-paint'|'total-blocking-time'|'cumulative-layout-shift'].numericValue`)
- Commit tiến độ lên nhánh mà không đổi thư mục làm việc (server đọc `public/` từ đĩa): dùng chỉ mục git tạm
  (`GIT_INDEX_FILE=… git read-tree origin/<nhánh>` → `hash-object -w` → `update-index --cacheinfo` → `write-tree` → `commit-tree -p` → `git push origin <sha>:refs/heads/claude/clever-bardeen-15e4ot`).
  ⛔ Không đặt dấu backtick trong chuỗi lệnh shell (bash chạy luôn lệnh bên trong — đã dính 27/10).

## 0. MỞ PHIÊN ĐO — dán nguyên đoạn này vào Claude Code trên máy, trong thư mục chính dự án (có `.env.local`)

```
Dự án COASTAL LAND. Trả lời bằng tiếng Việt có dấu.
Nhánh claude/clever-bardeen-15e4ot chứa các sửa làm nhẹ tải trang cho toàn web — KHÔNG đổi giao diện, bố cục, cấu trúc.
Chuẩn: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 trên điện thoại; HTML trang chủ < 450 KB.
1. git fetch origin claude/clever-bardeen-15e4ot; đọc BAN-GIAO-DO-TOC-DO-27-10.md trên nhánh đó.
2. Đo TRƯỚC (main) và SAU (nhánh) mọi trang ở mục 2; chạy do-o-bi-che cho /dang-tin. Chỉ MỘT server.
3. Bấm thử mọi mục ở mục 3, PC + điện thoại — giao diện, kết quả phải giống hệt main.
4. Báo tôi bảng số trước/sau + kết quả bấm thử. Trang còn LCP > 2,5 s: tìm nguyên nhân, sửa theo chuẩn KHÔNG đổi giao diện;
   việc đụng giao diện thì hỏi tôi.
5. Chỉ merge nhánh vào main và push MỘT LẦN khi tôi nói "Push". Ghi một dòng số đo vào memory toc-do-web-lam-tiep.
```

Gộp vào main (khi chủ dự án nói "Push"): `git checkout main && git pull && git merge --no-ff origin/claude/clever-bardeen-15e4ot`
→ `npx next build` chạy hết → `git push origin main` (MỘT lần) → kiểm web thật đã lên (tên gói mã) → đo lại trang chủ trên coastalland.vn.

## 1. Đã sửa (mỗi dòng một commit trên nhánh)

| Commit | Việc | Đo trong cloud (mã trình duyệt lúc mở trang, nén) |
|---|---|---|
| 979f4fc | Trang chủ: bớt dữ liệu thừa gửi kèm (cụm gợi ý ô tìm chỉ gửi 12 cụm đang hiện; tinDem: id → số, location → tên tỉnh khi có diaChiTim; ảnh dự án ≤ 6) | chưa đo được — **cần đo HTML trang chủ (mục tiêu < 450 KB, trước 497 KB)** |
| ecb5e0d | /dang-tin: khung Xem trước tải sau; ô mô tả không kéo bộ xem ảnh | 393 → 372 KB |
| e14e37c | /dang-tin: hồ sơ · ví · voucher hỏi cùng lúc | 5 → 3 nhịp mạng trước khi form hiện |
| da3641a | /dang-tin: đọc phiên có sẵn (getSession) | 3 → 2 nhịp mạng |
| fec6d15 | LeadForm (dự án, bảng giá, chuyên gia) + useQuyDinhGia: không tải thư viện Supabase lúc mở trang | /du-an/[slug] 350 → 287 · /bao-gia-dang-tin 310 → 247 |
| a55b3dc | Biểu tượng Phosphor bản gọn (chỉ kiểu nét đang dùng; SVG giống từng ký tự, đã so 49/49) | mọi trang −9 KB |
| a220a9f | Footer không kéo siteContent → filters, listingSpec… | trang tĩnh 193 → 180 |
| 099a216 | Ô khu vực trang chủ không kéo siteContent | trang chủ 276 → 274 |
| aa48f01 | Tải ngầm khi máy rảnh (taiKhiRanh) → bấm Xem trước / Gửi báo giá không chờ | không đổi mã lúc mở trang |
| bdf9bb7 | Thanh trên + khu Tài khoản: getUser → đọc phiên có sẵn (getUser giữ khoá → các lần gọi NỐI ĐUÔI ~5 nhịp mạng) | — |
| 9aa54bf | Admin ListingForm, LoginForm: như trên · /admin/khach-hang/[id] hỏi song song (5 → 3 nhịp) | — |
| 7bb98d8 | Ảnh đầu trang tải trước đúng máy (/gioi-thieu, Hero trang chủ khi ảnh điện thoại trùng ảnh máy tính); logo chân trang thôi tải trước | đo LCP /gioi-thieu, trang chủ (PC + điện thoại) |
| d74627f | Ảnh tĩnh `public/`: tối ưu mã hoá KHÔNG MẤT DỮ LIỆU 9 tấm (jpegtran/optipng, giữ baseline + ICC; so PIL giống hệt) | −226 KB tổng |

## 2. Việc phải ĐO trên máy (trước và sau — so `main` với nhánh)

Chuẩn: **LCP ≤ 2,5 s** trên điện thoại (CLAUDE.md mục 0C2). Công cụ có sẵn:

```
node --experimental-websocket scripts/do-toc-do.mjs <url> 2
npx lighthouse <url> --only-categories=performance
node --experimental-websocket scripts/do-o-bi-che.mjs http://localhost:3000/dang-tin        # và thêm " 470"
```

Trang phải đo:
1. Trang chủ · /mua-ban · /cho-thue · /mua-ban/condotel/da-nang · một trang /bat-dong-san/<id> (5 trang mẫu)
2. **Dung lượng HTML trang chủ** (curl -s http://localhost:3000/ | wc -c) — mục tiêu < 450 KB
3. /dang-tin **khi đã đăng nhập** — thời gian từ lúc mở tới khi form hiện (bỏ "Đang tải…")
4. /tai-khoan **khi đã đăng nhập** — thời gian tới khi số liệu hiện
5. /du-an/<slug> · /bao-gia-dang-tin · /gioi-thieu · /faq
6. Sau khi push: PageSpeed Insights (số đo khách thật) + Search Console → Core Web Vitals sau 28 ngày

Ghi một dòng số đo 5 trang vào memory `toc-do-web-lam-tiep`.

Đo Lighthouse trong cloud (máy chủ thử, KHÔNG dữ liệu thật, không CDN — chỉ tham khảo):
- /faq: LCP giả lập 3,3 s nhưng vẽ thật lúc 0,24 s — phần giả lập do lượng mã tải lúc mở trang.
- /gioi-thieu: LCP 4,5 s — ảnh đầu trang `public/images/gioi-thieu/hero-gioi-thieu.jpg` 300 KB, tải 2,9 s (xem mục 4).

## 3. Việc phải BẤM THỬ (PC + điện thoại)

- Ô tìm trang chủ: gợi ý cụm khi gõ, chọn khu vực / giá / hướng / pháp lý, công tắc "Tin xác thực", "Môi giới chuyên nghiệp" → nút "Xem N tin" ra số như bản `main`.
- Trang chủ: dải ảnh thẻ dự án, ô khu vực, chân trang (chữ, ảnh, mạng xã hội) như cũ.
- Biểu tượng thanh dưới điện thoại, menu, khu tài khoản (thường + tô khi đang chọn).
- Đăng tin trọn quy trình: chưa đăng nhập → đăng nhập tại trang; điền; chọn gói; ví đủ → đăng; ví thiếu → nạp thêm → quay lại; voucher hội viên; mở lại tin nháp; bấm "Xem trước" (phải hiện ngay).
- Form báo giá ở /du-an/<slug>, /bao-gia-dang-tin, /chuyen-gia/dang-ky: gửi → /admin/yeu-cau có dòng mới.
- Bảng giá: khối quy định / quyền lợi hiện như cũ.
- /tai-khoan: tổng quan, tin đăng, hội viên, khách hàng; nút hiện số liên hệ ở trang tin; lưu tìm kiếm.
- /dang-nhap khi đã đăng nhập → tự chuyển; đăng nhập xong về đúng nơi theo vai trò.
- /admin: đăng tin hộ (mặc định người đăng = admin), /admin/khach-hang/<id> (tương tác hiện đủ).
- Ảnh đầu trang chủ và /gioi-thieu hiện ngay như cũ (PC + điện thoại); logo chân trang vẫn hiện khi cuộn xuống cuối trang.
- Ảnh tĩnh đã tối ưu (mục 1, d74627f): app-mockup, ảnh dự án hero-*-3x1, villa-bien, hero-cty1/2 — nhìn như cũ.

## 4. Đã xem, KHÔNG sửa (để đo rồi tính)

- Google Analytics: đã nạp đúng chuẩn (gtag `lazyOnload`, thẻ Ads tắt) — giữ.
- /bat-dong-san/[id]: khối "tin tương tự" chở 8 tin bản nhẹ + danh sách MỌI mã tin cùng mục (`relatedIds`, cho nút "Xem thêm").
  Đo HTML trang tin: nếu danh sách mã chiếm đáng kể (hàng trăm mã × ~40 byte) thì cân nhắc tính thứ tự ở trình duyệt — phải
  chứng minh ra ĐÚNG thứ tự cũ trước khi làm.
- CSS chung 27 KB nén: thử chỉ quét `src/` chỉ bớt 0,6 KB → bỏ.
- Khung Next/React ~517 KB (chưa nén) mọi trang: không bớt được.

## 5. Ảnh — đã thử, chủ dự án cho làm nếu không giảm chất lượng (27/10)

- Ảnh /gioi-thieu nén lại bằng mozjpeg cùng 4:2:0: giữ độ giống ≥ 0,99 (SSIM độ sáng + R/G/B) chỉ bớt 2–10%, nhiều tấm không bớt
  → ảnh vốn đã nén tốt, KHÔNG thay (giảm thêm là thấy được ở chỗ nhiều chi tiết).
- Nếu đo xong /gioi-thieu vẫn LCP > 2,5 s trên điện thoại: hướng chuẩn còn lại là ảnh riêng cho điện thoại cỡ nhỏ hơn
  (admin → Nội dung web → ảnh điện thoại của trang Giới thiệu, ~1080 px rộng) — cùng chất lượng nhìn trên điện thoại.

## 6. Ghi chú cũ

- Ảnh tĩnh trong `public/images/` là JPG gốc (100–370 KB/tấm), web tắt tối ưu ảnh của Vercel (`images.unoptimized`, giữ trong gói $20).
  Nén lại sang WebP/AVIF = đổi điểm ảnh → chờ chủ dự án. Trên web thật ảnh /gioi-thieu có thể đã do admin thay — đo trước.
