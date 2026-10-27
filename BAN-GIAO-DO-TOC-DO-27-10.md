# ĐO TỐC ĐỘ — nhánh `claude/clever-bardeen-15e4ot` (27/10/2026)

> Phiên cloud đã sửa xong phần làm nhẹ / bỏ chờ mạng, **không đổi giao diện, bố cục, cấu trúc** (chủ dự án quán triệt).
> Cloud KHÔNG có `.env.local` (khoá Supabase) và không vào được coastalland.vn → **chưa đo được với dữ liệu thật.**
> Tệp này là danh sách việc cho phiên trên máy: đo trước/sau, bấm thử, rồi mới chờ chủ dự án nói "Push".

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

## 4. Cần CHỦ DỰ ÁN quyết (không tự làm vì đụng giao diện / chi phí)

- Ảnh tĩnh trong `public/images/` là JPG gốc (100–370 KB/tấm), web tắt tối ưu ảnh của Vercel (`images.unoptimized`, giữ trong gói $20).
  Nén lại sang WebP/AVIF = đổi điểm ảnh → chờ chủ dự án. Trên web thật ảnh /gioi-thieu có thể đã do admin thay — đo trước.
