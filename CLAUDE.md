# CLAUDE.md — Dự án COASTAL LAND (CVR)

> File này Claude Code tự đọc mỗi khi mở dự án. Luôn cập nhật khi có thay đổi quan trọng.
> **Trả lời và viết mọi nội dung bằng tiếng Việt có dấu.**

---

## ⛔⛔⛔ CẤM VĨNH VIỄN PHIÊN local_d7590912-b09a-4e9b-bed6-2a99617b7cc4 (anh chốt 08/11/2026)
Phiên **local_d7590912-b09a-4e9b-bed6-2a99617b7cc4** (bản ghi e7f4594c-0544-4bad-97e2-13f790784976, Claude Opus 5.5, 07–08/11/2026 — bộ lọc / trường Địa điểm).
Lỗi phải nói lại nhiều lần: xem bảng "⛔ LỖI PHIÊN e7f4594c" trong khối bàn giao 08/11 bên dưới.
**CẤM VÀO LÀM VIỆC Ở BẤT KỲ PHIÊN NÀO.** Không phiên nào được giao việc, nhắn, bàn giao hay nhận bàn giao từ phiên này.

## ⛔⛔⛔ WEB ĐÃ THƯƠNG MẠI — ĐÃ BÁN GÓI ĐĂNG TIN CHO KHÁCH — QUY TRÌNH KHÁCH ĐĂNG TIN KHÔNG ĐƯỢC LỖI (anh chốt 10/11/2026)
**Khách đã trả tiền mua gói.** Từ Admin / trang tài khoản của khách: tạo tin → ảnh → video → mua gói → đăng → chờ duyệt → duyệt → lên web **KHÔNG được có bất kỳ lỗi nào nữa.**
**Mọi chỉnh sửa là sửa TỪ CÁI ĐÃ CÓ** (không viết lại, không đổi cơ chế đang chạy). **CẤM làm hỏng việc khách đang làm** — từ lúc khách đăng nhập đến lúc tin lên web / chờ duyệt. Lỗi rơi vào tin khách đã trả tiền → Claude sửa trên tin đó luôn (Admin, Chrome của anh), không bắt khách làm lại.
**Ba nơi khách mở — cùng chạy đúng (anh 10/11/2026):** ① web (trình duyệt máy tính, điện thoại) · ② web mở trong Zalo (trình duyệt trong app Zalo) · ③ Zalo Mini App (`zalo-mini-app/`). Mọi thuộc tính phải khớp trên nền tảng Zalo: thông tin người dùng (tên, ảnh, số Zalo), giao diện (thang chữ, đầu trang cụm ⋯ ✕, thanh dưới), các chức năng liên quan (đăng nhập, đăng tin, ảnh, video, gói, ví, nạp tiền Checkout) và cộng đồng (OA: chat, quan tâm, chia sẻ). Sửa một nơi → kiểm cả ba nơi. **Bản đồ vị trí trong tin + nút mở Google Maps phải chạy trên Zalo** (anh xác nhận cả hai chạy đúng 10/11/2026) — đụng `MapPaneMo`, `ProjectNearby`, `moGoogleMaps.ts`, `dinhVi.ts` thì mở thử tin trên Zalo trước khi báo xong.
Web làm ra để **khách / thành viên tự đăng tin**. Mọi lần cập nhật, sửa mã (bất kỳ phần nào) PHẢI nhìn ngay quy trình này và kiểm lại trước khi báo xong:
**① Đăng nhập (số · email · Google · Zalo) → ② Tạo tin (form, loại hình, địa chỉ 2 hệ) → ③ Chọn gói (giá Admin + VAT, ví, Nạp thêm) → ④ Tải ảnh → ⑤ Tải video (mọi định dạng → MP4 H.264 có hình, `src/lib/nenVideo.ts`) → ⑥ Đăng → chờ Admin duyệt → lên web (ảnh + video hiện đúng).**
Đụng mã dùng chung của các bước này (`PostListingForm`, `ImagePicker`, `uploadImage`, `nenVideo`, `ChonCoTim`, gói / ví / thanh toán, đăng nhập) → thử lại trọn ①→⑥ trên điện thoại (khổ 375 + máy thật) và máy tính. Không thử được bước nào → nói rõ bước đó chưa kiểm.
Bài học 10/11: tin khách 1e3be917 lên web với video chỉ có tiếng (nén bỏ mất phần hình) — không ai kiểm bước ⑤.

## ⛔⛔⛔ PHÂN QUYỀN + QUY TRÌNH LÀM VIỆC GIỮA CÁC PHIÊN (anh giao 12/11/2026)
**Anh** quyết việc, duyệt chữ/giao diện, nhắn "Push". **Điều phối** = phiên anh đang làm việc trực tiếp (12/11: phiên 18419c5a): nhận việc
từ anh → chia cho phiên con → nhận kết quả → KIỂM lại (web thật + điện thoại) → gom → push MỘT lần khi anh nói. Chỉ Điều phối push.
| Phiên con | Phụ trách | Tệp / nơi chính |
|---|---|---|
| **KHÁCH HÀNG** (ưu tiên số 1) | Quy trình ①→⑥: đăng nhập, soạn tin, gói, ví, nạp tiền, ảnh/video, Tin của tôi, sửa/up/đẩy, Admin duyệt | `PostListingForm`, `ContentEditor`, `ImagePicker`, `TinCuaToi`, `BackBar`, `BanPhimAo`, `api/tin-dang/*`, `tai-khoan/*` |
| **TÌM KIẾM** | Ô tìm, bộ lọc, gợi ý, danh sách Mua bán · Cho thuê · Dự án | `FilterBar`, `TimTrangChu`, `smartSearch`, `ListingBrowser` |
| **SEO** | Search Console, xin index, từ khoá, pSEO, Cowork (theo 🌳 cây quy trình) | `pseo.ts`, `categories.ts`, ổ `D:\Coastal Land\SEO` |
| **ZALO MINI APP** | Mini App + OA + ZBS | `zalo-mini-app/`, `thongBao.ts` |
| **THIẾT KẾ** | Ảnh, banner, video, mẫu giao diện (đưa anh duyệt trước khi vào mã) | `public/`, tệp mẫu |
| **MẠNG XÃ HỘI** | Bài Tin tức, Facebook, Zalo OA — soạn, anh đăng | ổ D: `SEO\MAU\mxh` |
**⛔ MÔI TRƯỜNG ĐIỆN THOẠI DỰNG SẴN TRƯỚC KHI SỬA (anh 12/11/2026: "làm trên đt phải chuẩn bị kỹ môi trường trước khi chỉnh sửa, bất cứ thứ gì"):**
trước khi đụng giao diện điện thoại, Claude tự dựng xong và tự kiểm được: ① khung Browser của app ở cỡ Mobile (375×812), mở coastalland.vn
hoặc localhost:3000, **đã đăng nhập tài khoản thử** (khung giữ phiên; lần đầu anh nhập cookie coastalland.vn + localhost từ Chrome qua ⋮ →
Import cookies — Claude không gõ mật khẩu) · ② máy 3000 chạy · ③ link điện thoại thật (cùng Wi‑Fi, hoặc đường hầm cloudflared). Thiếu cái nào
báo anh MỘT dòng trước khi sửa, không bắt anh tự mò. Không dùng khung lồng `khung-web.html` để đăng nhập Google (Google chặn trong iframe).
**Luật chung:** ① mỗi tệp chỉ MỘT phiên sửa tại một lúc (phiên khác cần → nhắn Điều phối) · ② phiên con commit đúng tệp của mình, KHÔNG push ·
③ báo về Điều phối: đã sửa gì (commit) · đã kiểm gì, ở đâu · chưa kiểm gì · ④ đụng quy trình khách (bảng trên) → thử lại ①→⑥ khổ 375 + máy
tính trước khi báo · ⑤ ghi chú dài để ở thư mục ghi chú chung của nhóm phiên, không dán vào tin nhắn · ⑥ phiên bị cấm (đầu tệp) không được giao.

## ⏳ 12/11/2026 CHIỀU (phiên 18419c5a) — ĐÃ COMMIT, CHƯA PUSH (552f9992 → d7e546ea, build qua)
**Đã làm:** form đăng tin (loại hình CHA bắt buộc + ô loại CON tuỳ chọn ngay dưới, mọi loại có danh sách + "Khác — tự ghi"; Đất · Đất nền ·
Đất nền dự án chung 12 loại đất; cho thuê có Đất; tiện ích + nội thất theo loại; Chọn / Bỏ chọn gói đúng cả khi lưu nháp; Xem trước · Lưu nháp ·
Đăng tin cùng thứ tự, Lưu nháp có Soạn tiếp) · Admin Bảng giá (menu theo thứ tự trang Báo giá; Gói đăng tin / Gói đẩy tin / Up tin / Gói dự án
cùng kiểu bảng: cột hạng Basic→Diamond, hàng %, hàng thời hạn; nút Thu hồi mọi bảng + chương trình; Hội viên chỉ lên web qua "Duyệt bảng Hội
viên"; Đẩy tin Thuê chưa duyệt thì không bán) · Up tin có Basic, luôn khấu trừ, bỏ khỏi trang Báo giá (chỉ ở Tin của tôi) · đẩy tin tối đa
2 lần/ngày (SQL 0073 — anh ĐÃ chạy, đã kiểm cột `lan`) · mọi lần trả tiền báo chung mẫu Zalo "Thanh toán dịch vụ thành công" · chương trình
miễn phí thành viên mới KHÔNG giới hạn thời gian (30 ngày mỗi thành viên từ lần đăng nhập đầu), Duyệt mới = thay thế cái đang chạy trong một
lần · Mẫu tin hiển thị thu nhỏ đúng tỷ lệ · máy tính 20 tin/trang (mốc 900px) · **TẠM THỜI KHÔNG GỘP TÀI KHOẢN** (đăng nhập tài khoản nào làm
tài khoản ấy; tài khoản đã gộp trước giữ nguyên; bật lại: `WEB_TU_GOP` xac-minh-sdt + `TU_GAN` gopTaiKhoan.ts).
**Chờ:** anh nhắn "Push" → anh Duyệt bản nháp "Miễn phí đăng tin cho thành viên mới" (Admin → Khuyến mãi, đã Lưu nháp) · anh dán 2 dòng
quy định đẩy tin mới vào Admin → Quyền lợi gói → "Quy định đẩy tin" · bấm thử Up tin / Đẩy tin bằng tài khoản CÓ tin đang hiện (luật đã thử
bằng bảng giá thật, đúng) · điện thoại thật + Zalo chưa kiểm. Máy 3000 dùng CHUNG CSDL web thật — bấm Lưu/Duyệt ở đó là đổi giá thật.

## ✅ 10/11/2026 (phiên 18419c5a) — ĐÃ PUSH HẾT, web chạy 7ee2b24e
- **Video khách đăng — sửa gốc** (c6e93345): `src/lib/nenVideo.ts` ① MP4 H.264 ≤ 44MB giữ nguyên ② mediabunny chỉ khi giữ được track hình ③ không thì ffmpeg.wasm (mã `public/ffmpeg/`, lõi jsDelivr @ffmpeg/core 0.12.10). Nút ghi "Đang tải video… X%" (chữ mới, anh chưa duyệt nguyên văn). Đã thử trên web thật: HEVC kiểu iPhone → MP4 H.264 720×1280 có hình + tiếng.
- **Tin khách 1e3be917** (biệt thự Hòa Xuân, khách đã mua gói): video cũ chỉ có tiếng, không cứu được → ghép 13 ảnh của tin + tiếng gốc thành MP4 (`.claude/video-tin-1e3be917.mp4`), Claude thay trong Admin trên Chrome của anh, trang tin chạy có hình. Gói, hạn giữ nguyên.
- **3 nút Mua bán · Cho thuê · Dự án trang chủ điện thoại** (beb4a388, 7ee2b24e): `:active` trên điện thoại không thấy → chạm gắn lớp `vua-bam` (cách của thanh dưới `MobileTabBar`), CSS `.press.vua-bam`.
- **Luật mới đầu tệp:** web đã thương mại · quy trình khách ①→⑥ không được lỗi · sửa từ cái đã có · ba nơi web / web trong Zalo / Mini App.
- **Kiểm nhanh web thật 10/11:** ① đăng nhập · ② form 7 mục · ③ gói + VAT + "Nạp thêm" · ④ ảnh · ⑤ video — đạt. ⑥ chưa bấm Đăng thật (tạo tin + giữ tiền). Chưa kiểm máy thật, trình duyệt trong Zalo, Mini App.
- **⛔ VIỆC SỐ 0 PHIÊN SAU — khách KHÔNG đăng tin / sửa tin được trên điện thoại (anh báo chiều 10/11, ảnh 14:23–14:54):** chạm ô Tiêu đề /
  Mô tả thì thanh bước "4 Tiêu đề & mô tả" đè ô, không thấy chữ, anh báo bàn phím không hiện. Đã sửa gốc + push: f90ef392 (thanh bước bám
  --hdr + --backbar-h thay 113px cứng) · 34b789e5 (BackBar tự đo chiều cao thật → --backbar-h, máy chữ to) · 03fe856f (BanPhimAo tính mọi thanh
  dính trong 40% trên là che). Máy thử 375 đạt (cả khi ép hở 16px). **CHƯA được anh xác nhận trên điện thoại thật** — mở phiên là hỏi anh kết quả;
  còn lỗi thì xin ảnh chụp ngay lúc chạm ô, kiểm cả Chrome · Samsung Internet · Zalo. Link thử: máy 3000 `/dang-tin?xem-thu=1` (khổ 375).
  **Sau 03fe856f anh vẫn báo: chạm ô NỘI DUNG (Mô tả) không hiện bàn phím** — ô này là `contenteditable` (`src/components/admin/ContentEditor.tsx`),
  ô Tiêu đề là textarea thường. Ảnh 14:25: ô Mô tả có viền xanh + con trỏ mà không có bàn phím. Đã rà: không user-select/pointer-events/touch-action,
  không inputMode, không blur/focus lạ, không touchstart preventDefault. Máy giả lập không có bàn phím thật → KHÔNG tái hiện được. Việc tiếp: cắm cáp
  điện thoại anh, Chrome PC `chrome://inspect` xem trực tiếp (focus/blur, useLayoutEffect đặt lại innerHTML khi bàn phím bật làm mất bộ gõ?);
  không ra gốc nhanh → điện thoại dùng `<textarea>` thường cho Mô tả (bàn phím chắc chắn hiện), máy tính giữ trình soạn — hỏi anh trước.
  Sau 24b90c0b (BanPhimAo bỏ cuộn đoán) anh vẫn báo cả ô Tiêu đề (textarea) lẫn Nội dung không hiện bàn phím. **Đang lên web TẠM:** `public/_go-loi.js` + dòng `<script src="/_go-loi.js">` trong `src/app/layout.tsx` (db85ec74) — mở `coastalland.vn/dang-tin?go-loi=1`, chạm ô, khung xanh ghi focus/blur/bàn phím; anh chụp gửi là thấy gốc. ⛔ Xong lỗi GỠ cả hai.
- **⏳ CHƯA LÀM KỊP — PHIÊN SAU LÀM (theo thứ tự):**
  1. Thử trọn ①→⑥ có bấm Đăng thật (tài khoản thử, gói 0 ₫) → Admin duyệt → tin lên web, ảnh + video hiện đúng; rồi xoá tin thử.
  2. Thử quy trình trên **điện thoại thật** (iPhone Safari, Samsung Internet), **web mở trong Zalo** và **Zalo Mini App** — chưa kiểm nơi nào.
  2b. **VỊ TRÍ khi mở trên Zalo — chưa kiểm:** web trong Zalo: nút "Tôi đang đứng ở đây" (form đăng tin, bản đồ) + "Dự án gần tôi" (`ProjectNearby`, `navigator.geolocation`) — Zalo có cho trình duyệt trong app lấy vị trí không; không được thì phải có lối khác (gõ địa chỉ / dán link Google Maps), không treo. Mini App: `DangTin.tsx` lấy vị trí qua Zalo → `/api/vi-tri-zalo` (trạm VN `hoiZaloInfo`); quyền Vị trí Zalo đang chờ duyệt — thử thật khi bản 52 được duyệt. ✅ Bản đồ vị trí TRONG TIN (MapLibre) mở trên Zalo: anh xác nhận hiện đúng 10/11 — lúc trước trống là tải chậm, không sửa mã. Nếu lại trống trên máy nào: nghi MapLibre 6 cần WebGL2 → dự phòng bản đồ ảnh OSM (đã viết thử, đã gỡ vì web đang đúng).
  3. Nút ≡ mở menu (`Header.tsx` ~dòng 626) chưa có hiệu ứng chạm — làm như 3 nút trang chủ (`press` + `vua-bam`).
  4. Rà mọi nút / liên kết chính trên điện thoại còn chỉ có `:active` (không thấy khi chạm nhanh) → dùng cách `vua-bam`.
  5. Kho ảnh — xoá khi anh dọn một lần: tệp thử `listings/cc7ee9f4b8d463436544834f-thu-hevc.mp4` · video hỏng cũ của tin 1e3be917 `listings/911d498f16cd0ee05957fc1d-1007_BT_QTT_-1_sdt_anh_bia.mp4` (không còn dùng). ⛔ Không đụng ảnh dự án / bài viết.
  6. Tin 1e3be917: khách gửi video gốc thì thay video ghép bằng video gốc (Admin → Sửa tin).
  7. Anh duyệt nguyên văn chữ "Đang tải video… X%" (ImagePicker).
  8. Zalo duyệt Mini App bản 52 → làm 4 việc khối "ZALO MINI APP + VERCEL — 07/11" (menu OA, nút hồ sơ OA, mẫu ZBS, quét QR thử); Mini App cần cùng sửa video (`nenVideo`) nếu Mini App tải video riêng — kiểm.
  9. Xin index tiếp theo Admin → Xin index (10 trang/ngày): Cho thuê nhà Lâm Đồng, Cho thuê căn hộ Khánh Hòa, các trang đổi chữ lõi.
  10. Sau mỗi Push: Vercel → "Production Deployment" phải đúng commit vừa Push (lệch → anh Promote).

## ⛔⛔⛔ CẤM TỰ PUSH (anh chốt 06/11/2026)
Claude **CẤM tự push** ở phiên này và mọi phiên. Không push, không chạy lệnh push, không nhắc / hỏi / gợi ý push, không bảo anh tự
chạy lệnh push. Chỉ khi anh nhắn đúng chữ **"Push"** mới làm.
**⛔ 07/11/2026 (anh): cấm tự push KHÔNG có nghĩa là im lặng.** Xong mỗi việc PHẢI báo đủ 3 ý: **đã build** (qua / lỗi) · **đã kiểm** (kiểm gì,
ở đâu) · **cần Push mới lên web** (việc nào khách / Google chưa thấy cho tới khi Push). Không để anh phải hỏi "web thật là gì", "làm sao để thấy".

## ⛔⛔⛔ CÁCH LÀM VIỆC — MỌI PHIÊN (anh chốt 09/11/2026)
1. **Chuẩn bị môi trường kết nối TRƯỚC khi làm:** máy thử 3002 + link điện thoại · khung giả lập · Chrome của anh · dữ liệu thật (tải qua API
   `/api/danh-sach/<ban|thue>/loc`) · build nền sẵn sàng. Thiếu gì báo ngay.
2. **Kiểm và soi TỪ GỐC, sửa TỪ GỐC, không chắp vá:** lỗi ở một câu / một tin → tìm luật chung sinh ra nó (cây loại hình, bảng sáp nhập 2 hệ
   địa chỉ, một bộ lọc cho cả gõ lẫn chọn trường) rồi sửa ở đó, để dữ liệu mới cũng đúng. Không sửa riêng cho câu anh vừa gõ.
3. **Đo bằng dữ liệu thật trước khi báo:** `.claude/kiem-ket-qua.ts` (mọi tin → câu tìm → phải lọt nhóm khớp đủ) · `kiem-doc-cau.ts` ·
   `kiem-doc-du-an.ts` · `kiem-md.ts`. Giật / chậm thì đo trace CPU 4x, không đoán.
4. **Mã sạch:** bỏ biến / import thừa do mình sinh ra, chú thích lý do ngắn, không để cờ tạm, không vá chồng.
5. Anh đang bấm trên khung giả lập → không chạy lệnh / thao tác đè lên; anh nhắn "nhìn" mới chụp màn hình.

## ⛔⛔⛔ CẤM XOÁ ẢNH DỰ ÁN · ẢNH BÀI VIẾT (anh chốt 08/11/2026)
Claude / mọi kịch bản **CẤM xoá** ảnh trong kho (Supabase `listings`, `nho/`) thuộc **dự án** (khung ảnh, mặt bằng, ảnh chèn trong nội dung
Tổng quan…) và **bài viết Tin tức** (ảnh bìa + ảnh chèn trong nội dung). Bài học: lần dọn kho 11/09/2026 (`.tmp-da-xoa-2026-09-11.json`,
2.051 tệp) coi ảnh chèn trong nội dung là "rác" → ảnh trong nội dung trang dự án (vd. Sun Galaxy Complex) mất hẳn, web 404, không phục hồi được.
Dọn kho (`scripts/don-kho-anh.mjs` hay bất kỳ cách nào) chỉ khi anh nói "xoá" từng đợt; trước đó liệt kê từng tệp + nơi dùng cho anh duyệt.

## ⛔⛔ CẤM CHÚ THÍCH VỚ VẨN — LÀM CHUẨN (anh chốt 06/11/2026, gắt)
Giao diện (web + Zalo Mini App) KHÔNG viết câu giải thích / chỉ dẫn / "chúng tôi chỉ lấy…". Dựng **cấu trúc để khách tự hiểu**:
bố cục, nhãn nút, ô nhập. Chữ còn lại chỉ là THÔNG TIN. Bài học: màn Đăng nhập Mini App ghi "Coastal Land chỉ lấy tên và ảnh
đại diện Zalo…" → anh: "lấy cái gì mà lấy", "CẤM chú thích vớ vẩn" → đã bỏ, còn logo · tên · nút "Đăng nhập bằng Zalo" · lối phụ.
Hộp hỏi quyền của Zalo tự giải thích — mình không viết thêm. Câu chữ bắt buộc phải có → đưa anh duyệt nguyên văn trước.

## ⛔ LUẬT TÀI KHOẢN — ANH CHỐT 06/11/2026, CẤM HỎI LẠI ("đừng để tao nói lại")
- Khách **đăng nhập bằng bất cứ cách nào** (số, email, Google, Zalo). **Đăng ký bắt buộc họ tên.**
- **Đăng tin: số điện thoại BẮT BUỘC, đã xác minh.** Chưa có số → xác minh bằng mã gửi **tới chính số đó** (Zalo; sau thêm SMS
  cho số không có Zalo — chờ anh có nhà cung cấp). KHÔNG xác minh số bằng mã email. Có số rồi thì không hỏi.
- **Gộp: web tự làm, không hỏi/yêu cầu khách** — khi khách đang tự đăng nhập + xác minh số (mã tới số) + đang đăng tin/đã có tin.
  Dính tiền / tài khoản quản trị → không gộp, email báo anh. Tài khoản cũ trên web để nguyên. Không khoá đăng nhập bất kỳ trường hợp nào.
- **Tên / ảnh khi gộp:** khách tự đặt trong Cài đặt (tên, ảnh riêng) thì giữ; không thì tên của tài khoản tạo đầu tiên, ảnh Zalo/Google
  cái nào có trước — giữ tới khi khách tự đổi. Số điện thoại, email không có ảnh.
- Đăng ký bằng email có điền số có Zalo → cùng mã gửi cả email lẫn Zalo.
- **Thông báo tự động (06/11, "lần cuối cùng FIXED"):** mọi tin Zalo đi qua `khopMauZbs` (`src/lib/thongBao.ts`) — bảng 13 mẫu đọc thẳng
  từ Zalo (template/info/v2): ô kiểu SỐ chỉ chữ số ("0đ"/"64.800đ" → Zalo -1124, bỏ cả tin — gốc lỗi duyệt/nạp/thanh toán không có Zalo
  từ 26/10), đủ ô bắt buộc, bỏ ô thừa, cắt đúng độ dài. Gửi hỏng (Zalo hoặc email) → ghi sự cố, hiện Admin → Tổng quan, không email.
  Sửa / thêm mẫu bên ZBS → đọc lại template/info rồi sửa bảng `MAU_ZBS`. Chưa sửa thì cấm báo "đã xong" khi chưa gửi thử thật.

## ⏳ ZALO MINI APP BẢN 52 — ĐÃ GỬI XÉT DUYỆT 17:54 09/11/2026 (phiên 7f6fbd7e) — bản 51 bị trả về vì thanh toán + đăng nhập
- Thanh toán: nạp ví qua Checkout SDK, **Tích hợp tùy chỉnh · Chuyển khoản ngân hàng (Beta)**: web tạo đơn PayOS → mã VietQR → `Payment.openCheckoutPopup` → PayOS webhook cộng ví + `baoTrangThaiDonZalo` (purchase-payment). Khoá `ZALO_CHECKOUT_KEY` (= Private Key Checkout) đã có trên Vercel; App Status ACTIVE; Callback URL = /api/thanh-toan/zalo-checkout/callback. Đã nạp thật 10.000 đ: ví + Zalo "Thành công".
- Đăng nhập: câu anh duyệt trên nút Zalo. Điều khoản sử dụng trên Zalo sửa 09/11 (tên/ảnh, số, vị trí, ảnh, thanh toán).
- Số điện thoại + vị trí Zalo (me/info) đi qua trạm VN (`hoiZaloInfo`, taiKhoanZalo.ts) — gọi thẳng từ Vercel bị Zalo chặn IP.
- Zalo duyệt xong: làm 4 việc ở khối "ZALO MINI APP + VERCEL — 07/11" (menu OA, nút hồ sơ OA, mẫu ZBS, quét QR thử).

## ⏳ 09/11/2026 RẠNG SÁNG (phiên 7f6fbd7e) — ĐÃ PUSH d8844e64 (anh "push luôn") — VIỆC CÒN LẠI
**Đã lên web:** Tin tức PC 2 cột + trang bài viết 2 cột (Bài viết khác, nút chia sẻ) · trang dự án PC 2 cột (cột phải: form báo giá dự án nổi
bật · theo khu vực · theo loại hình · Chủ đầu tư top 10 theo VIP · Dự án cập nhật cố định 10) · đầu trang PC 52px, logo 40px, menu 13px ·
bộ lọc: đọc Dự án chỉ khi có "dự án" / tên dự án / tên CĐT, "danang" ≠ "danang plaza", loại hình theo cây cha – con (`loaiCuaTin`,
`DONG_NGHIA_LOAI`, mục "… khác" tự gom), kết quả xếp theo loại hình → phường (2 hệ) → tỉnh cũ → giá gần nhất, "mới nhất" xếp tin mới,
câu vô nghĩa không gợi ý · bảng Khu vực điện thoại nút 44px, bàn phím bật thì bảng lên sát đầu trang. Bộ kiểm: `.claude/kiem-ket-qua.ts`
(600 câu trên tin thật, 0 sai) · `kiem-doc-cau.ts` · `kiem-doc-du-an.ts` — chạy lại sau mỗi đợt tin mới.
**CÒN LẠI (chưa làm):**
1. **Giật khi chạm ô tìm** (trang chủ điện thoại): đã sửa thanh tiến độ ảnh đầu trang (transform); đo CPU 4x vẫn bận 0,3–0,5 s sau chạm
   (tính lại kiểu ~1.000 phần tử, Layerize, IntersectionObserver) — chưa tìm hết gốc, chưa đo máy thật. Máy đo: scratchpad phiên 7f6fbd7e
   `do-giat.mjs` / `do-trace.mjs` / `do-inv.mjs` (trỏ cổng 3002).
2. **Đăng nhập Zalo trên web thật hỏng**: trạm trung chuyển VN `zalo.coastalland.vn` (hosting PA Vietnam) không kết nối được graph.zalo.me
   (lỗi "Connection timeout after 10001 ms"). Không do mã. Cần PA Vietnam mở kết nối ra ngoài tới graph.zalo.me cổng 443.
3. **13 ảnh mất trong nội dung 7 trang** (dọn kho 11/09 xoá nhầm): anh chèn lại theo `.claude/ANH-MAT-CAN-CHEN-LAI.md` (tên tệp gốc + đoạn chữ
   ngay trước chỗ đặt ảnh). Đã ghi luật CẤM XOÁ ẢNH ở đầu tệp này.
4. **Gợi ý ô tìm kiểu Google**: trang chủ câu loại cho-thuê mà ghi giá tỷ ("nhà trọ đà nẵng dưới 2 tỷ") chưa đổi sang mức triệu như trang Cho
   thuê; gợi ý chưa viết "danang" thành "Đà Nẵng"; chưa gợi ý theo quận/phường + "mới nhất" như Google (ảnh Google anh gửi 08/11).
5. Form "Nhận tài liệu & báo giá" (trang dự án): anh nói "mẫu hiển thị báo giá trên PC không đúng" — anh tự sửa sau, chưa rõ chỗ.

## ⏳ BÀN GIAO 08/11/2026 TỐI (phiên 76e330d6, anh: "bàn giao cho người khác vào ngay") — ĐẦU TRANG + MENU ≡ ĐIỆN THOẠI KIỂU APPLE — CHƯA PUSH
**Môi trường:** máy xem thử cổng 3002 (preview `cvr-ban-that`, chạy `next start` từ `.next-kiem`) · link điện thoại **http://192.168.0.189:3002** (IP đổi tối 08/11) ·
giả lập `http://localhost:3002/khung-web.html` ở khung phải. Cập nhật bản: build NỀN `NEXT_DIST_DIR=.next-moi npx next build` (run_in_background) → dừng preview
→ đổi `.next-kiem`↔`.next-moi` → bật lại. ⛔ **Đừng TaskStop build đang chạy**: tiến trình next build con vẫn chạy ngầm, giữ khoá → build sau báo "Another next build"
(máy chặn Claude kill). **Lúc bàn giao còn 2 tiến trình `next build` ngầm** (bản build bị dừng) — chờ chúng tự xong rồi mới build.
**Commit chưa push (sau b15e95e8):** 3407122e (nút ‹ toàn web: vào từ Google/Zalo ‹ về trang cha; ‹ về trang chủ đúng chỗ; Đăng tin chưa đăng nhập ‹ lùi thường;
bỏ số 1/6 xem ảnh; khung xem ảnh/số liên hệ/video createPortal ra body) · 95e69cfa · 3ff5fa22 · 92de1303 · eea859a4 (đầu trang nền đen #161617; menu ≡ kiểu Apple:
màn đen buông xuống `.menu-man`, chữ hiện dần `.menu-muc`, danh mục con trượt vào `.menu-trang-vao` có "‹ Mua bán", bỏ dòng "Tất cả…"; Đăng ký·Đăng nhập /
Đăng xuất·Đăng tin; thanh dưới: Đăng tin cùng kiểu nét các nút khác).
**CHƯA COMMIT (của phiên này):** `BrandLogo.tsx` logo 36px (`h-9`) · `globals.css` `--hdr` điện thoại 40px · `Header.tsx` menu lề 48px (`px-12`), chỉ chữ (bỏ biểu tượng
+ mũi tên), dòng 46px, **các dòng giãn đều lấp kín màn hình** (flex-1) · `TimTrangChu.tsx` ô tìm trang chủ nhích xuống `pt-1.5`. Hai việc sau cùng CHƯA build, link
3002 đang là bản menu gọn (chưa giãn). ChonCoTim / PostListingForm / admin ListingForm: KHÔNG phải của phiên này, đừng add.
**Logo đầu trang:** dùng `public/logo/logo-dau-trang-white.svg` = logo GỐC, chỉ slogan to 1,15 lần + hạ 18 đơn vị. Chữ COASTAL LAND giữ nguyên cỡ.
**Còn treo, anh chưa chốt:** menu để trống phần dưới như Apple (Apple chừa trống ~nửa màn hình, ẩn logo khi mở menu) hay giãn đều kín màn hình — anh nói "cân đối",
"cho tất cả các máy". Hiệu ứng + kiểu chữ toàn trang kiểu Apple (đã: hiện khi cuộn trồi 28px, đường cong Apple).
**Anh mắng phiên này, ĐỪNG LẶP:** đổi cỡ logo qua lại cả buổi (anh "thu header" = thu THANH, KHÔNG thu logo) · sửa thứ anh không bảo (phóng chữ thương hiệu) ·
build bị dừng → bản cũ chạy ngầm, chờ lâu · báo dài — **xong việc chỉ báo MỘT câu** · đừng hỏi lại điều anh vừa nói · anh đang gõ thì đừng chạy lệnh dài.

## ⏳ BÀN GIAO 08/11/2026 (phiên e7f4594c, anh: "bàn giao và cút ngay, người khác vào làm tiếp") — TRƯỜNG ĐỊA ĐIỂM / BỘ LỌC — CHƯA PUSH
**Việc đang làm:** trường Địa điểm (bảng Khu vực) theo **14 yêu cầu của anh** ghi ở `.claude/LOI-BO-LOC-07-11.md` (khối "YÊU CẦU CỦA ANH VỀ ĐỊA DANH"
+ mục 10–14). Kiểm theo ĐỦ 14 điều, CẢ NƯỚC (không thử một tỉnh rồi báo), rồi mới báo anh. Anh đang thử trên khung `http://localhost:3000/khung-web.html`
(tab "seed" của preview) — **KHÔNG sửa mã khi anh đang mở bảng** (Fast Refresh làm bảng lẫn trạng thái → anh tưởng lỗi). Sửa xong: build → nói "Xong" → anh F5.
**Luật bảng Khu vực hiện tại (`src/components/FilterBar.tsx` `LocationPanel`):** một lựa chọn hai cách xem — nơi đã chọn (`locGoc`, hệ `heGoc`) giữ nguyên,
gạt công tắc chỉ đổi cách HIỆN (`doiHe(locGoc, mode, heGoc)`, theo bảng sáp nhập). Tỉnh cũ thiếu phần → tỉnh mới "–", bên trong không tick sẵn phường;
tick phường = chỉ phường đó (tỉnh đang hiện từ hệ kia → bấm phường thay hết). ✓ cả · – một phần · bấm ✓/– = bỏ chọn. Chọn là lên đầu; bỏ chọn dòng đứng yên
tới khi đổi tầng (`dauRef`). Tìm tỉnh chỉ ra tỉnh (tên bắt đầu bằng chữ gõ lên trước); tìm phường trong tỉnh. Gia Lai cũ ≠ Gia Lai mới: `LocationSel.cu`
(kv `Tỉnh/~cu`). Tên TP/quận cũ ("phan thiết") = một nơi `{tỉnh mới, district}`, `applyFilters` khớp mọi phường mới gộp từ quận cũ (`phuongCuaQuanCu`).
Địa chỉ trang giới hạn 5 TỈNH (không cắt theo phường). Khay So sánh đã bỏ khỏi `layout.tsx`.
**Đọc câu / kết quả (đã xong, đã kiểm):** dòng "Đang hiển thị kết quả cho…" giữ đúng thứ tự chữ khách gõ (`cauDaHieu` = `suaChinhTa` + viết hoa tên nơi) ·
câu luôn đi theo sang trang (?q=) · chữ không dấu nhiều nghĩa không ép dấu (`MO_HO`: cho/chợ, can/cần…) · xã/phường không kèm tỉnh đọc được (`tinhTheoTenXa`) ·
tên xã gần tên huyện cũ chọn đúng dấu · tin hết hạn khớp đủ = kết quả + đếm · không khớp đủ mới báo "chưa có sẵn", tương tự xếp tỉnh gần (`TAM_TINH`).
Bộ kiểm: `.claude/kiem-dia-chi.ts` (27.408 câu, 0 lỗi) · `kiem-ba.ts` (86 lệch còn lại = tên xã trùng nhiều tỉnh không ghi tỉnh) · `kiem-loai.ts` · `kiem-md.ts`.
Trên khung: `public/_kiem-he.js` (`kiemHe()` — cả nước đồng bộ 2 hệ + lên đầu; lần chạy sau sửa cuối 28cd551a CHƯA có kết quả — chạy lại) · `public/_kiem-dd.js`
(`kiemDD()` — 14 yêu cầu) · `public/_kiem-bo-loc.js` (16 bước). ⛔ **XOÁ 3 tệp `public/_kiem-*.js` trước khi Push.**
**Commit chưa push (18, sau 410e53d2):** 42553367 → 28cd551a (bộ lọc) + 904f27e7 (Zalo ngày dd/mm/yyyy — phiên khác bàn giao, chưa gửi thử Zalo thật, sau 7h).
**Chưa commit, KHÔNG phải của phiên này:** ChonCoTim.tsx, PostListingForm.tsx, admin/ListingForm.tsx (phiên 4a3174b0 sửa nhầm — chờ anh quyết) · next.config.ts,
tsconfig.json, next-env.d.ts, launch.json.
**08/11 sáng (phiên fe36f8a1, nhận bàn giao):** `kiemHe()` cả nước 0 lỗi (sau sửa Đặt lại → A–Z, c7020e9f) · `kiemDD()` 12/12 đạt · lỗi 1 giật ĐÃ SỬA
(f19203e4: dựng sẵn màn tìm khi máy rảnh + chạm sớm thì hiện khung gọn trước; đo Edge giả lập CPU 4x bản build: màn tìm hiện 0,07–0,1 s, trước 0,25–1,3 s;
chạm không nạp địa danh ngay — `useDiaDanh.ts`) · câu chạy bị cắt ĐÃ SỬA (8fead937). Máy đo giật: scratchpad phiên fe36f8a1 `do-giat.mjs` (cần `next start -p 3005`).
**Còn lại:** lỗi 3 bàn phím che / 4 cuộn bảng (máy thật) · 7 gợi ý vô nghĩa · 8 bấm tìm ra tab khác · 9 về trang chủ còn từ khoá — trong `.claude/LOI-BO-LOC-07-11.md`.
**Anh mắng phiên này:** vá từng trường hợp thay vì sửa gốc · thử một tỉnh rồi báo ("cả nước!") · hiểu sai rồi đổi qua lại (ô "–", tỉnh cũ → mới ✓) · sửa mã khi anh
đang thử · nói nhiều. Anh nói "nhìn" = chụp màn hình khung, nói đúng cái thấy, KHÔNG đoán; chưa hiểu hỏi MỘT câu.
**⛔ LỖI PHIÊN e7f4594c (07–08/11/2026) — ANH PHẢI NÓI LẠI NHIỀU LẦN** (đếm trong 668 tin nhắn của anh, theo chữ anh gõ — số TỐI THIỂU, tin trả lời trích dẫn và
chữ gõ sai nặng không đếm được):
| Lỗi của Claude | Số lần anh nói |
|---|---|
| Anh bảo "NHÌN" màn hình mà không nhìn / nhìn không ra lỗi, phải nói lại | ≥ 74 |
| Địa chỉ phải ĐỌC ĐƯỢC tỉnh/thành – phường/xã, cả 2 hệ mới / cũ — dữ liệu web đã có sẵn | ≥ 29 |
| Nói nhiều, giải thích lý do vòng vo, ngụy biện | ≥ 10 |
| PHÁ cái đã đúng / đã fix (ô "–", khay So sánh, thứ tự dòng, tỉnh cũ → mới) | ≥ 9 |
| Gợi ý / dòng "thay thế" kiểu Google đâu | ≥ 8 |
| Sửa TAY / chắp vá từng chỗ thay vì sửa từ GỐC | ≥ 6 |
| "Đã nói bao nhiêu lần / 2 ngày nay" — cùng một việc phải nhắc lại | ≥ 6 |
| Đồng bộ 2 hệ địa chỉ cũ – mới (gạt qua lại phải khớp, trước khi bấm Tìm) | ≥ 5 |
| Giật / lag khi bấm ô search (chưa sửa) | ≥ 4 |
| Thử 1 tỉnh (Huế, Bắc Ninh, Hội An) rồi báo — anh: "CẢ NƯỚC" | nhiều lần (trong tin trích dẫn) |
→ Phiên sau: nhìn màn hình TRƯỚC khi trả lời · sửa ở luật chung, chạy bộ kiểm cả nước rồi mới báo · không đổi luật đã chốt khi chưa hỏi · không sửa mã lúc anh đang thử · nói ngắn.

## ⏳ ZALO MINI APP + VERCEL — 07/11/2026 ~02:30 (phiên 2e02c3ed) — ĐÃ PUSH f997211 + a824ac9, web Ready, đã kiểm web thật
**Zalo — CHỜ DUYỆT:** bản thử 51 (gồm mọi sửa 06/11) **đã gửi xét duyệt 21:08 06/11** (miniapp.zaloplatforms.com → Xét duyệt phiên bản).
Zalo báo 2–3 ngày làm việc → dự kiến **thứ Ba 10/11 – thứ Tư 11/11**. Mini App đã xác thực, bật "Hiển thị công khai". Quyền Vị trí · Chọn ảnh ·
Số điện thoại "Đợi xét duyệt". API web cho Mini App (lịch sử giá, Up / Đẩy / Nâng gói, đăng nhập Zalo, xác minh số…) ĐÃ LÊN web.
**Làm NGAY khi Zalo duyệt bản 51:** ① Menu OA (oa.zalo.me → Quản lý → Thiết lập menu): 10 nút đang mở coastalland.vn → đổi link sang
`https://zalo.me/s/1268705237708475790/<đường dẫn Mini App>` (/ds/ban · /ds/thue · /du-an · /tin-tuc · /dang-tin · /bang-gia · /tin-cua-toi · /hoi-vien…)
② OA → Trang thông tin OA → **Nút bấm** / **Tiện ích** (đang ẩn): gắn Mini App lên trang hồ sơ OA ③ ZBS: nút trong 13 mẫu đang mở web → tạo
mẫu mới có nút mở Mini App, chờ Zalo duyệt, sửa `MAU_ZBS` (src/lib/thongBao.ts) ④ quét QR bản đã duyệt thử thật: đăng nhập Zalo, chat OA,
xem số, chia sẻ, đăng tin, Up / Đẩy. Bị trả về → đọc lý do, sửa, deploy bản mới (`npx zmp deploy --passive --testing` trong zalo-mini-app), gửi lại.
**Đã có (không làm lại):** Mini App ↔ OA (chat, quan tâm, chia sẻ mở thẳng tin) · bot OA 4 kịch bản + từ khoá đang bật · `sameAs` + llms.txt khai
Mini App · nút "Za" (Mở trong Zalo) trên trang tin web.
**Vercel — CHỜ ĐO (anh: "đo sau 1 ngày"):** từ 08/11 xem Usage + Observability CDN theo đường, so kỳ trước, báo anh số. Đã sửa: bỏ làm mới
theo giờ (chỉ revalidateTag khi dữ liệu đổi + 0h mỗi ngày) · trang tin + dự án lưu bản in (web thật HIT) · chặn Ahrefs · ảnh /anh bỏ hàm máy chủ
(rewrite ngoài tới Supabase). **Ảnh vẫn MISS** vì Supabase/Cloudflare gửi cookie `__cf_bm` → nếu đo vẫn tốn: dẫn ảnh thẳng URL Supabase (đổi
đường dẫn ảnh toàn web — anh quyết). Observability Plus ($2,50/kỳ): tắt hay giữ — anh quyết sau số đo.
**Việc khác chờ anh "làm":** sửa gốc ảnh rác khi nạp tin hàng loạt (`taiAnhHangLoat` tải ảnh lúc chọn → chỉ tải khi bấm Đăng) · dọn ảnh `nho/`
của 196 tệp rác đã xoá · khối đánh giá tin ("Tin này có đúng như mô tả không?") trong Mini App · ZaloPay / Checkout (chờ Zalo).

## ⏳ 07/11/2026 CHIỀU (phiên e7f4594c) — BỘ LỌC + MENU ĐIỆN THOẠI — CHƯA BUILD, CHƯA COMMIT, CHƯA PUSH
**Danh sách lỗi bộ lọc (anh báo, có trạng thái):** `.claude/LOI-BO-LOC-07-11.md`. **Giả lập điện thoại:** `http://localhost:3000/khung-web.html`
(tệp `public/khung-web.html`, đã .gitignore) — mở ở cột phải; Chrome của anh đăng nhập sẵn localhost (xem bản đăng nhập trong khung).
**Đã sửa trên máy (chưa commit):** bộ lọc chọn nhiều = nháp, Áp dụng mới tìm (`FilterBar` `nhap/apDungNhap`, `FilterDropdown` `onMo`,
`ProjectsBrowser` `nhapDa`) · trang Dự án bỏ trường "Dự án" · bấm câu gợi ý / tìm gần đây đọc lại câu (`chayTim(…, cauMoi)`) · đổi trường
xong `setDaTim("")` · trang chủ gõ câu mới không dính khu vực câu cũ (`TimTrangChu` `khachChon`) · địa chỉ trang ghi theo bộ lọc cả khi cùng
trang (`ListingBrowser urlTheoTruong`) · bảng chọn nằm trên màn tìm (`FilterDropdown` zIndex 95 khi trong `[data-man-tim]`) · hàng "đã chọn"
dính phủ kín mép trên bảng (`DaChon` -top-3) · nút Đặt lại / Áp dụng cao 36 · bảng Khu vực luôn mở hệ MỚI, hệ cũ phẳng A–Z, không nhớ hệ cũ ·
thanh dưới công khai: Home · Lưu · Đăng tin (vòng xanh 32) · Tin nhắn · Hồ sơ (`MobileTabBar`, nền trắng đặc, không kẻ) + thanh khu Tài khoản
cùng kiểu · nút chat nổi ẩn trên điện thoại ở trang có thanh · trang chủ điện thoại: tab Mua bán nhà đất · Cho thuê nhà đất lọc tại chỗ thay
hàng tab loại hình (`FeaturedListings`) · menu ≡: Báo cáo thị trường tách riêng cuối menu (cả PC), "Tài khoản"→"Hồ sơ" mọi nơi, ẩn "Tin đã
lưu" trên điện thoại, nút Đăng nhập/Đăng tin nhỏ sát hai mép, dòng cách đều, khoá trang khi mở (`useKhoaCuon`) · `khoaCuon.ts` dọn dấu
cvrBang/cvrLoc/cvrDu mồ côi khi F5 (gốc lỗi "F5 rồi tìm thì nhảy về trang chủ") · tin chi tiết PC khung ảnh cách Header 20px.
**Đang làm dở:** anh bảo rà lại toàn bộ cách chọn địa chỉ (chọn, bỏ chọn, chọn nhiều, tìm trong bảng, Áp dụng, huỷ) — "RẤT lỗi".
**Còn trong danh sách:** lỗi 1–3 (giật, Enter lấy gợi ý đầu), 5, 7, 8, 9, 14, 18, 19, 20, 21, 23.
**Anh mắng phiên này:** nói nhiều; tự vẽ kiểu mới thay vì dùng mẫu web đang có; chặn cuộn kiểu "lấp liếm" (đã gỡ, dùng hàm chung); hiểu sai
nút nào cần to. Máy chủ thử cổng 3000 do phiên này chạy (preview `cvr-web`); bị lệch bản SSR thì khởi động lại; trình duyệt giữ mã cũ thì
gỡ service worker + xoá cache.

## ⏳ BÀN GIAO 07/11/2026 (phiên 4a3174b0, anh: "bàn giao lại") — CHƯA BUILD, CHƯA COMMIT, CHƯA PUSH
**Việc anh giao:** tệp `C:\Users\X1 GEN 8\OneDrive\Desktop\YÊU CẦU CHÍNH SỮA 03112026.docx` — **làm mục 2 → 6, dứt điểm từng phần.**
⛔ **Số mục = số CẤP NGOÀI của tệp** (Claude phiên này đếm theo dòng con → làm nhầm). Đúng là:
1 Admin đăng tin (9 dòng con — KHÔNG thuộc việc này) · **2 Bộ lọc:** ô chọn nhiều (vd Tỉnh/Thành PC) chỉ tìm khi bấm "Áp dụng";
ô chọn một → chọn là tìm ngay — rà hết, cấu trúc lại · **3 PC:** khung có ảnh (tin, dự án; nhất là Mua bán, Cho thuê) chừa khoảng nhỏ
hợp lý với Header (logo) · **4** Xem thêm / Thu gọn trong trang tin chi tiết: làm đúng chức năng · **5** giao diện Footer + trang Giới thiệu
công ty · **6** menu Tiện ích thêm dữ liệu ngoài tin/dự án cho Google tin: biểu đồ giá (nhà nước, thị trường theo khu vực) · mục con Báo cáo
thị trường (form chuẩn Coastal Land, tham khảo DKRA + Batdongsan, link PDF DKRA trong tệp) · tóm tắt thành bài Tin tức + MXH · dữ liệu web + Cowork.
Lưu ý mục 2: luật cũ 12 ("cơ chế đã chốt: chọn một tự tìm, chọn nhiều Áp dụng là tìm") khớp yêu cầu; bàn giao 05/11 ghi gốc lệch ở
`FilterBar.tsx` `set()` cập nhật kết quả ngay khi tick. Đọc mã + thử trên Chrome trước khi nói.
**Đã sửa NHẦM (mục 1 dòng 2 — bảng chọn Loại hình cha – con), CHƯA kiểm, anh CHƯA quyết giữ hay bỏ — KHÔNG tự gỡ, hỏi anh:**
`src/components/ChonCoTim.tsx` (khối `nhom`: tiêu đề cha đậm màu chữ chính, con thụt `pl-8`; nhóm một con trùng tên cha không lặp tiêu đề) ·
`src/components/PostListingForm.tsx` + `src/components/admin/ListingForm.tsx` (thêm `nhom={nhomChonLoaiHinh(...)}` cho ô Loại hình).
**Đã xong phiên này:** ghi 5 luật 07/11 vào cây quy trình (mục 6–10) + CLAUDE.md (mục 🌳); bản cây cũ ở `SEO\_cu\cay-quy-trinh\CAY-QUY-TRINH-truoc-07-11-2026.docx`.
**Môi trường (đã kiểm 07/11):** Chrome của anh nối được, Search Console vào được (78 index · 452 chưa) · máy 3000 chạy · web 200 · 88 commit chưa push.
**Anh mắng:** làm nhầm mục, chép cây ra chat khi anh bảo "đọc kỹ" (= tự đọc). Hiểu sai thì hỏi MỘT câu trước khi làm.

## ⏳ BÀN GIAO 07/11/2026 ~00:30 (anh: "bàn giao thằng khác vào") — CHƯA COMMIT, CHƯA PUSH
- **Đợt 1 06/11 ĐÃ LÊN:** 10 tin, 74 ảnh, khớp hết (`kiem-dot-tren-web.mjs` lúc 00:2x: 10 đang hiện). Bẫy: tệp trùng tên
  `SEO\_cu\ban-cowork\06112026\Bang-2026-11-06.xlsx` (bản cũ, dòng 9 lỗi dự án) — bản đúng ở `DA-DUYET\06112026\`.
- **Đã xoá 196 tệp rác kho ảnh (290 MB)**, kho còn 3.129 tệp / 563 MB; kiểm lại 4.771 ảnh đang dùng + hero/banner/video pt01: còn đủ.
- **`scripts/don-kho-anh.mjs` đã sửa, CHƯA COMMIT** (anh hỏi vì sao commit, chưa nói "commit"): bản cũ chỉ nhận tên có mã băm →
  từng định xoá 6 ảnh hero trang chủ (`site_content.hero_home`), 3 banner dự phòng (`src/lib/banners.ts`), video `pt01-0710-video.mp4`.
  Nay rác = tên đầy đủ không có ở MỌI bảng CSDL + tài khoản + mã src/public/zalo-mini-app, tệp > 7 ngày, không phải thư mục.
  Ảnh nhỏ `nho/` của ảnh rác chưa dọn.
- **Gốc sinh rác chưa sửa** (anh chưa nói "làm"): `nhap-hang-loat/page.tsx` `taiAnhHangLoat` tải ảnh lên kho NGAY lúc chọn, trước khi
  bấm Đăng → nạp hỏng là ảnh nằm lại kho. Hướng sửa: chọn ảnh chỉ giữ trên máy, bấm Đăng mới tải.
- `YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md` mục 19: thêm dòng ⚠️ tạm — web chưa nhận dự án chưa có hồ sơ → để trống `ten_du_an`, ghi vào bao-cao.
- Anh mắng phiên này: nói dài, báo số rác 212 sai (chưa kiểm hết), bắt anh chọn lại ảnh khi chưa giải thích rõ. Trả lời NGẮN, đúng câu hỏi.

## ⏳ BÀN GIAO ĐỢT TIN 06/11/2026 (phiên a1f3fbff, anh: "đổi thằng khác") — CHƯA COMMIT, CHƯA PUSH
- Đợt 1 `D:\Coastal Land\SEO\DA-DUYET\06112026\` (10 tin, 74 ảnh, 2 video): CHƯA lên web — đọc CSDL 06/11 khuya: 0 tin nạp chờ duyệt.
  Tệp đã sửa: qngai01 bỏ trống `ten_du_an` (web đang chặn "chưa có hồ sơ dự án: Khu đô thị An Phú Sinh"), bỏ `loi_vao` ở dn03/qngai01/qngai02;
  2 video đã xoá dấu Chợ Tốt. `thu-doc-dot` ĐẠT. Việc tiếp: anh nạp lại → kiểm CSDL có 10 tin `choChuDuyet` → anh duyệt ở /admin/tin-dang/duyet-nap.
  hue02 tin gốc Chợ Tốt "đã hết hạn" — anh quyết GIỮ. Bản gốc Cowork: `SEO\_cu\ban-cowork\06112026\`.
- Đợt 2 `...\06112026\dot2\` (5 tin): đã sửa phap_ly dn06/dn07, loi_vao qnhon01/qnhon03, video qnhon01 xoá dấu; ĐẠT; anh chưa làm đợt này.
- Mã (chưa build, chưa commit): `src/lib/khopDuAn.ts` + `nhap-hang-loat/page.tsx` — dự án chưa có hồ sơ vẫn nạp (anh: "chưa có thông tin vẫn cho up rồi bổ sung").
  Máy kiểm `thu-doc-dot` KHÔNG chạy bước khớp hồ sơ dự án → sót lỗi này; cần thêm vào máy kiểm.
- `YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md` mục 7: đã thêm bảng loại hình Đất + loai_dat theo web.
- Anh mắng: nói nhiều, báo "up được" khi chưa kiểm hết, nghi Cowork bịa khi không bịa (câu nhấn điểm có thật ≠ bịa), sửa tệp qua lại.

## ⏳ ZALO MINI APP — 06/11/2026 TỐI (commit 797737e · 3ba21e8 · 4767781, CHƯA PUSH, Zalo đang bản thử 47 — chưa có các sửa này)
Theo tài liệu Zalo (Design Guidelines + Chính sách kiểm duyệt, đã đọc): không mở trang web (chân trang mở 8 trang thông tin trong app —
`scripts/lay-trang-tinh.mjs` lấy chữ từ web lúc build) · cỡ chữ thang Zalo 20/18/16/15/14/12/10 · thanh dưới 4 nút (Dự án vào từ trang chủ) ·
số điện thoại Zalo khi đăng tin (getPhoneNumber → `xac-minh-sdt` bước `so-zalo`, cần ZALO_APP_SECRET; quyền ID 100 Zalo đang duyệt) ·
lưu tin bằng nativeStorage · tải theo màn. Thêm bản gọn: Tìm kiếm đã lưu (+ nút Nhận tin mới), Gói hội viên, So sánh, Danh bạ chuyên gia
(`/api/chuyen-gia` mới trên web), Dự án của tôi. Bỏ (chỉ SEO/chuyển hướng): Giá nhà đất, Phong thuỷ, Chủ đầu tư, Tiện ích, Tương tác, Đổi điểm.
Khung giả lập `khung-dt.html` có hàng chọn máy (Máy anh 338×732 chữ 129% đo từ ảnh bản 47 · 320–430). Máy thử hiện ở cổng 3102.
⛔ Anh cấm Claude điều khiển máy tính (computer-use) — chỉ làm trên Chrome. Chưa làm: quyền Vị trí (ID 38 chưa xin), thông báo OA.

## ⏳ ZALO MINI APP — 06/11/2026 KHUYA: ĐỦ CHỨC NĂNG TRONG APP (commit 2ec0211 + 5dbec51, CHƯA PUSH, chưa deploy Zalo)
Sửa tin (`DangTin ?id=`, tin đã lên web giữ gói/mốc, ẩn Nhu cầu + Gói) · Up tin / Đẩy tin / Đăng lại (`GoiTin`, `/goi-tin/:id?viec=`) ·
Khách hàng · Hóa đơn · Cài đặt (tên + xuất hóa đơn) — hết mở web. Menu Tài khoản bỏ Gói hội viên · Dự án của tôi · Tìm kiếm đã lưu (chỉ web).
API web `day` · `nang-goi` · `up` · `tai-khoan/dong-bo-ten-anh` nhận thêm token Mini App + CORS (`src/lib/goiTuMiniApp.ts`) và chế độ
`xemGia` (máy chủ tính số tiền, không ghi gì). **Chạy được trên Zalo chỉ khi web có mã này (anh nhắn "Push")**; chưa `next build`, chưa
thử thật có đăng nhập (máy thử không đăng nhập Zalo được). Còn: ZaloPay/Checkout (chờ Zalo) · đo cụm ⋯ ✕ trên máy thật · nộp duyệt.

## ⏳ BÀN GIAO ZALO MINI APP — 06/11/2026 TỐI (phiên 2f67d7f5, anh dừng: "bàn giao qua claude.md")
**Đang làm:** giao diện Mini App (`zalo-mini-app/`), lấy giao diện web điện thoại làm chuẩn. Anh chỉ từng bước, từ trên xuống. Làm từng cái, không hỏi lắm.
**Đã commit (chưa push, chưa deploy Zalo sau bản 44):** 8ee7c31 và các commit trước: logo trên thanh tiêu đề mọi trang, menu dưới sát đáy, ô tìm + bộ lọc gọn, dải trượt.
**Chưa commit:** `zalo-mini-app/src/app.css` (ảnh thẻ trong dải trượt 2:1 · cuối tệp: đầu trang chuẩn Zalo — hàng logo cao 44px, chừa 88px
bên phải cho cụm ⋯ ✕, câu thương hiệu 1 dòng 11px) · `zalo-mini-app/src/pages/TrangChu.tsx` (bỏ lưới ô công cụ, vì đã có menu dưới) ·
`zalo-mini-app/khung-dt.html` (khung giả lập, CHỈ dùng trên máy, không đưa lên Zalo).
**Khung giả lập:** máy `zalo-mini-app` cổng 3100 (`.claude/launch.json`), mở `http://localhost:3100/khung-dt.html` ở cột phải.
Khổ chuẩn Mini App Zalo 375 × 812, 100% (anh: "cấm làm theo điện thoại S24 Ultra", "làm CHUẨN trên nền tảng Zalo"). Khung tự bỏ lớp
`xem-thu` (main.tsx) để đầu trang chừa chỗ như trong Zalo thật, ẩn thanh cuộn, vẽ thanh trạng thái + cụm ⋯ ✕.
**Chưa đạt:** cụm ⋯ ✕ + thanh trạng thái trong khung là Claude tự vẽ, CHƯA đo khớp Zalo thật (vị trí, cỡ, màu). Muốn chuẩn phải đo từ màn
Mini App thật trên điện thoại anh (Phone Link đã cấp quyền cho Claude; mã QR bản thử ở trang versions Zalo). Cột phải chỉ cao 555px → khung
bị cắt chiều cao.
**Anh mắng, ĐỪNG LẶP:** nói dài · hỏi lại · gửi link khi anh không cần · nhắc push ("push cái gì mà push") · làm theo cỡ máy riêng thay vì
chuẩn Zalo · báo "chuẩn" khi chưa đo.
**Việc khác còn treo:** máy chủ đăng nhập Zalo + xác minh số (`api/auth/zalo-mini-app`, `taiKhoanZalo.ts`, CORS `xac-minh-sdt`) cần web
push (chỉ khi anh nhắn "Push") · màn Sửa / Up / Đẩy / Đăng lại riêng trong Mini App · ZaloPay · nộp duyệt Zalo · 5 lỗi MỘT ENTITY của web
(chờ "làm") · `/quy-dinh` còn câu "Tiêu đề mở đầu bằng Bán hoặc Cho thuê" (chờ anh duyệt câu mới).

## ✅ 06/11/2026 CHIỀU (phiên 8d8722b3) — PUSH theo lệnh anh, gồm mọi commit 268d6b8 → db29f72 (+ 9ac6e77 phiên khác: nạp tin hàng loạt)
**Lỗi anh báo hôm nay — đã sửa từ gốc, đã thử cả điện thoại 375px lẫn máy tính (Chrome anh, đăng nhập thật):**
1. **Đang chọn gói, xem Mẫu tin / Quy định, tắt là nhảy về đầu trang / trang chủ.** Gốc ①: `dynamic()` thiếu `loading` → lần đầu tải mã,
   cả form bị Suspense thay bằng "Đang tải…" (trang 3.900px → 850px) — sửa TinHienThiMau, XemTruocTin, PhotoViewer, PhotoList. Gốc ②: link
   Quy định gói tin · Up tin · Đẩy tin mở tab mới (điện thoại / app cài: khung tab phụ có X → về trang chủ) — nay mở bảng tại chỗ
   (`LienKetQuyDinh`); bỏ mọi link nội bộ `target=_blank` (Xem tin, Bảng quyền lợi). ③ Tắt bảng nổi không `history.back()` nữa (`khoaCuon.ts`, dấu `cvrDu`).
2. Nút chat Zalo đè thanh các bước — cấm kéo / nhớ vị trí vào 300px đầu trang (`Chatbox.tsx`).
3. Sửa tin ĐÃ DUYỆT: ẩn ô Nhu cầu + mục Gói (thanh bước 1–6); CSDL chặn đổi Mua bán ↔ Cho thuê (SQL 0072 — anh đã chạy).
4. Chấm đỏ thêm: tin vừa duyệt / Up được duyệt · Up bị từ chối · nạp tiền thành công (báo một lần, mở mục là tắt — `useSoTinCanXem.ts`).
5. Dòng đỏ báo thiếu ô tự tắt khi điền xong · Xem trước khi sửa tin: nút "Cập nhật" · câu báo đầu form sửa tin gọn lại.
6. Lỗi Claude tự tìm ra: đang sửa tin chuyển sang Đăng tin → form mang nội dung tin cũ, bấm Đăng sinh TIN TRÙNG (`KhungDangTin.tsx`).
**Không thử được:** trả tiền PayOS thật · máy tự gửi duyệt sau nạp · gộp tài khoản · Up / Đẩy / Sửa tin đã duyệt trên điện thoại (tài khoản không có tin đang hiện).
**Tin thử còn trong tài khoản 0b9e07d6 (anh xoá trong Admin):** f76d39c4 · 5b363d01 · 10e03e22 · 8322b0ee · 99862bfd · ac52b4a6 · eac5d24a · f31d2957 · 3650c745 (đang ẩn).

## ⏳ 06/11/2026 SÁNG (phiên 69797164) — TRÊN MÁY, CHƯA PUSH (gồm cả 268d6b8 bên dưới) — BUILD QUA 388/388
**BẢN BUILD (anh hỏi nhiều lần — trả lời ĐÚNG danh sách này, theo AI làm gì):**
1. Khách sửa tin của mình: bấm "Xem trước" thấy Hiệu lực · Hết hạn thật (268d6b8).
2. Admin ẩn tin của khách: khách không còn nút Sửa · chấm đỏ mục Tin đăng · không email / Zalo (268d6b8).
3. Admin ẩn rồi hiện lại: giữ nguyên ngày đăng, lần đẩy, hạn — SỬA TỪ GỐC bằng trigger SQL 0071 (anh đã chạy), mọi tin, mọi đường.
   **Đã GỠ 2 bản vá trong mã** (`api/tin-dang/duyet` Hiện lại · `admin/ListingForm` "Cập nhật & đăng") — anh: "sửa từ GỐC", "chỉ ẩn và hiện".
4. Khách Up tin: chọn được mọi gói giá cao hơn gói đang chạy, kể cả Basic 15/30 ngày.
5. Trang chủ, ô khu vực: đếm cả tỉnh + cả tin hết hạn.
**Không đổi (web đúng sẵn):** khách sửa tin lên ngay, giữ mốc · Đẩy tin trả tiền là lên đầu ngay lúc đẩy · khách KHÔNG có nút tự Hạ / Hiện
(bỏ từ 01/11; tin khách đã hạ chỉ có "Đăng lại" = gói mới, Admin duyệt).
**Lỗi build "next/font/google queries have exactly one entry"** = đệm `.next-kiem` hỏng do 2 lần build chạy chồng → xoá `.next-kiem` build lại là qua.
- ~~`16990c5` Admin "Cập nhật và đăng" giữ mốc~~ — đã gỡ (`08595e9`), cùng bản vá Hiện lại (`f964fc4`).
- `4dfcfee` + `e32fb6b` **UP TIN = CHỌN LẠI GÓI (anh chốt 06/11): ô nào (hạng × số ngày) GIÁ CAO HƠN gói đang chạy là Up được — kể cả
  Basic nhiều ngày hơn.** So giá bảng Admin chưa VAT (`oNangDuoc`, `giaGoiDangChay` ở `src/lib/nangGoi.ts`; giá ô `giaOUpTin` ở
  `billing.ts`: bảng Nâng gói đã duyệt, hạng không có trong đó → bảng gói tin). Bảng khách khoá từng ô (`BangGiaGoiTin` `khoaO`),
  máy chủ `api/tin-dang/nang-goi` kiểm cùng luật. Tiền: giá gói mới − bù trừ gói cũ còn lại (tính theo lúc khách GỬI) − hội viên − voucher + 8% VAT.
- `0fc218f` Trang chủ, ô "Bất động sản theo khu vực": đếm CẢ TỈNH chứa khu vực (Quy Nhơn → Gia Lai, Nha Trang → Khánh Hòa) và
  TÍNH CẢ TIN HẾT HẠN (anh 06/11). Máy thử: Đà Nẵng 100 · Huế 31 · Quy Nhơn 17 · Nha Trang 34 · Quảng Ngãi 4.
- **Đã kiểm trên Chrome của anh (localhost, tin thử 3650c745):** hiển thị Hiệu lực/Hết hạn · sửa tin lưu ngay, giữ 3 mốc · bảng Up
  tin (mọi ô, giá đúng) · Nạp thêm → trang nạp đúng chuẩn · Đẩy tin giá đúng. **Luật anh nhắc:** sửa tin, đẩy tin lên NGAY (không duyệt);
  chỉ đăng tin mới và Up tin qua Admin duyệt.
- **Chưa kiểm được:** trả tiền thật (ví 0 đ) · Admin duyệt Up + SQL 0071 Ẩn/Hiện lại (tài khoản anh dùng không phải Admin).
- **Anh đã bác, ĐỪNG LÀM:** email báo Admin khi khách gửi Up tin · chấm đỏ khách khi tin hết hạn.
- Biết mà chưa sửa: khách sửa tin → trang tin đổi sau ≤ 1 phút (cron); Admin → Tổng quan treo chấm đỏ 2 sự cố cũ 29/09 (Mini App) — anh bấm "Đã xử lý".
- **Việc tiếp:** tệp `C:\Users\X1 GEN 8\OneDrive\Desktop\YÊU CẦU CHÍNH SỮA 03112026.docx` — rà mục đã làm / chưa làm rồi làm tiếp đến hết.

## ⏳ BÀN GIAO 06/11/2026 ~02:00 (phiên cba6a1e3, anh: "bàn giao lại việc đang dở") — web chạy 84e959b (đã push 00:25)
**⛔ MỐC THỜI GIAN — MỘT CHUẨN (anh chốt 06/11, cấm hỏi lại): mốc = LÚC TIN ĐƯỢC DUYỆT.**
- Sửa tin (khách / Admin): giữ mốc duyệt — web ĐÚNG. · Đẩy tin: hạn giữ nguyên, chỉ lần đẩy = lúc đẩy — web ĐÚNG, không cần duyệt.
- Up tin: mốc mới = lúc Admin duyệt Up (bảng ghi "Ngay khi được duyệt") — GIỮ NGUYÊN như web đang chạy (anh: không đổi).
- Admin ẩn / hiện lại: lên đúng mốc đã duyệt. Khách ẩn / hiện: đúng mốc đã duyệt, không cần Admin duyệt — anh: "web đã đúng rồi",
  trang khách ĐỂ NGUYÊN (đã gỡ nút Ẩn tin / Hiện lại Claude tự thêm). Admin ẩn: KHÔNG email / Zalo khách — chỉ báo trong trang
  tài khoản khách (chấm đỏ mục Tin đăng).
**Gốc lỗi (đo 06/11 tin 3650c745):** trigger CSDL `tin_luon_co_han` (0053/0062) coi bật lại = kỳ mới → Hiện lại đặt ngày đăng /
hạn / lần đẩy = lúc bấm (gia hạn + đẩy miễn phí). **Anh đã chạy SQL 0071 (Success ~01:45)** = sửa gốc. Tin thử 3650c745 đã trả về
mốc duyệt (đăng + đẩy 5/11 21:48, hết hạn 12/11 21:48). Web còn bản đệm cũ (tin thử đứng đầu Mua bán, "57 phút trước") — tự hết ≤1 giờ.
**Trên máy, CHƯA PUSH:**
- commit `268d6b8`: Hiện lại (api/tin-dang/duyet) ghi trả mốc cũ · Xem trước khi sửa tin đã lên web hiện "Hiệu lực · Hết hạn" thật
  (XemTruocTin `moc`) · tin Admin ẩn: khách không có nút Sửa (khách tự hạ vẫn sửa) · chấm đỏ Tin đăng của khách đếm tin Admin ẩn
  (`useSoTinCanXem`) · tệp `supabase/migrations/0071_hien_lai_giu_han.sql`.
- CHƯA commit: `src/components/admin/ListingForm.tsx` — "Cập nhật và đăng" tin đang ẩn còn hạn giữ mốc duyệt (cùng cách duyet).
- 2 bản vá trong mã (duyet + ListingForm) thừa khi 0071 đã chạy nhưng vô hại; anh muốn "sửa tận gốc" → có thể gỡ, nhưng PHẢI kiểm
  0071 thật đã vào (Admin Ẩn rồi Hiện lại tin thử: 3 mốc giữ nguyên) trước khi gỡ.
**⛔ CLAUDE ĐÃ LÀM NGU GÌ (phiên cba6a1e3, 06/11) — ĐỪNG LẶP:**
1. Nói trước khi kiểm: khẳng định "Admin Hiện lại giữ hạn cũ" khi mới đọc mã máy chủ, chưa đọc trigger CSDL, chưa đo tin thật → SAI.
2. Viện "chuẩn Batdongsan" khi chưa tra — anh: "KHÔNG BĐS con mẹ gì hết". Cấm so Batdongsan.
3. Tự thêm việc anh không bảo rồi phải gỡ: email báo khách khi Admin ẩn · ô chữ xám "Coastal Land đã ẩn…" · nút Ẩn tin / Hiện lại cho khách
   (anh: "web đúng rồi", "ai cho mày sửa phá"). Anh nói "đúng rồi" = KHÔNG sửa.
4. Hiểu sai ý anh nhiều lần (Up tin thời gian, "khách tự ẩn/hiện", "chỉ thông báo cho admin") → hỏi lại mãi. Chưa hiểu: hỏi MỘT câu kèm ví dụ số.
5. Sửa tay dữ liệu tin 3650c745 (ngày đăng, hạn) bằng lệnh ghi thẳng CSDL — CLAUDE.md 0.1 CẤM sửa tay hạn tin. Anh: "sửa là sửa từ GỐC".
6. Đề xuất đổi Up tin sang "không cần duyệt" khi anh không bảo — anh giữ nguyên.
7. Nói dài, bảng biểu, giải thích vòng vo — anh: "nói ít thôi", "nói ngắn". Ghi "Tóm lại" 3 dòng là đủ.
8. Bấm phím Return trên Chrome của anh khi trang đang treo (đóng hộp báo) — không biết đã bấm vào đâu.
9. Chạy build dài khi anh đang nói → anh phải ngắt nhiều lần. Anh đang nói thì nghe hết, chưa chạy gì.

**📋 CẦN LÀM TIẾP (theo thứ tự, anh nói "làm" mới làm):**
1. Kiểm SQL 0071 đã vào thật: Admin Ẩn rồi Hiện lại tin thử 3650c745 → đăng / đẩy / hạn phải giữ 5/11 21:48 · 5/11 21:48 · 12/11 21:48.
2. Commit `src/components/admin/ListingForm.tsx` + CLAUDE.md; build `NEXT_DIST_DIR=.next-kiem npx next build`.
3. Đưa lên web khi anh nhắn đúng chữ "Push" (gồm 268d6b8). Sau đó kiểm trên web: Xem trước khi sửa tin có "Hiệu lực · Hết hạn";
   tin Admin ẩn → khách không có nút Sửa + chấm đỏ; Hiện lại giữ mốc.
4. Anh chưa quyết: khách sửa tin đang đăng mà không bấm Đăng → mất hết, không cảnh báo, ảnh mới thành ảnh thừa trong kho.
Máy chặn Claude ghi CSDL → lệnh SQL / sửa dữ liệu thì soạn sẵn, anh dán vào Supabase SQL Editor.

## ⏳ (lịch sử) CHƯA PUSH (06/11 khuya) — commit c2dac97 + commit kế tiếp — ĐÃ LÊN WEB trong 84e959b
- Tài khoản bị cấm từ bản gộp cũ: khách đăng nhập (Zalo · email/số + mật khẩu · trang số · Quên mật khẩu) → web tự gỡ cấm,
  có bằng chứng (số đã xác minh / mã Zalo đang gắn tài khoản khác) thì tự gộp vào đó (`tuSuaTkKhoa`).
- **Còn treo:** `fbe1d9ec` (Zalo thứ hai của tài khoản `0b9e07d6`, không số, không bằng chứng) — anh đã vào bằng Zalo này 05/11 21:10
  → web gỡ cấm, vào tài khoản trống. Gộp vào `0b9e07d6` phải ghi CSDL (app_metadata.gop_vao) — auto mode chặn Claude ghi;
  kịch bản sẵn: scratchpad phiên 6da46c5b `chuan-tk-da-gop.mjs`.

## ✅ 06/11/2026 tối — GỘP TÀI KHOẢN KHÔNG KHOÁ (anh: "gộp là quy trình của web", "đã xác minh thì gộp, khoá cái gì")
Gộp (xác minh số bằng mã) → tài khoản thừa KHÔNG khoá, chỉ mang dấu `app_metadata.gop_vao` (một chỗ: `src/lib/gopTaiKhoan.ts`);
vào bằng cửa nào cũng tự về tài khoản giữ lại (`useAuth` → `/api/xac-thuc/ve-tai-khoan-gop`; Zalo đổi ở máy chủ). Tài khoản khoá đời
cũ: khách đăng nhập là web tự gộp (cùng số đã xác minh / cùng mã Zalo) hoặc mở khoá (`tuSuaTkKhoa`, `/api/xac-thuc/mo-tk-khoa`).
⛔ Dấu gộp CHỈ ở app_metadata — user_metadata khách tự sửa được (lỗ hổng Quên mật khẩu chiếm tài khoản, đã vá trong `doi-mat-khau`).
Form đăng tin chỉ hỏi số khi tài khoản chưa có số. Thử form không cần đăng nhập ở máy thử: `/dang-tin?xem-thu=1`.

## ⏳ BÀN GIAO 06/11/2026 (phiên e744a177, anh dừng: "bàn giao lại ngay từ chỗ này") — CHƯA COMMIT, CHƯA PUSH
**Đã sửa (trên máy, chưa commit):** `src/components/ChonCoTim.tsx` `moBang` — điện thoại (`pointer: coarse` hoặc < 640px) dùng lại
**bảng trượt từ đáy** (như trước df72002); máy tính giữ xổ dưới ô. Một chỗ sửa áp cho MỌI ô chọn form đăng tin (Loại hình, Tỉnh,
Phường, Dự án, Hướng, Pháp lý, Nội thất, Đơn vị giá, Chọn số) + form Admin.
**Đã kiểm:** khung điện thoại 375px: 5 ô (Loại hình · Tỉnh · Phường · Dự án · Hướng) đều mở + chọn được · **điện thoại thật của anh**
(Samsung Internet, qua link cloudflared): mở Tỉnh, chạm "Điện Biên" → chọn được, bảng đóng (bộ ghi cú chạm xác nhận).
**Vì sao anh cứ thấy "vẫn lỗi":** anh bấm "Tiếp tục với Google" → Supabase trả về **web thật coastalland.vn** (bản cũ, còn lỗi). Thử trên
link thử phải đăng nhập bằng số / email + mật khẩu, hoặc thêm Redirect URL `https://<link cloudflared>/**` trong Supabase (anh CHƯA đồng ý).
**Link thử ngoài mạng:** anh tự chạy `C:\Users\X1 GEN 8\cloudflared\cloudflared.exe tunnel --url http://localhost:3000` (máy chặn Claude
tự tải / tự mở đường hầm). Lấy link: `curl http://127.0.0.1:20241/quicktunnel`. Link đổi mỗi lần chạy. Đã thêm rồi GỠ `*.trycloudflare.com`
khỏi `allowedDevOrigins` (`next.config.ts`) — muốn dùng lại link cloudflared trên máy dev thì thêm lại (thiếu là trang không bấm được).
**Đã xoá bản thử:** `src/app/thu-tam`, `src/app/api/thu-log`, `src/components/DoChamTam.tsx` + 2 dòng trong `layout.tsx`. Còn tệp
`.claude/quet-de-xem.png` (mã QR, không commit).
**Việc tiếp (anh bảo mới làm):** `NEXT_DIST_DIR=.next-kiem npx next build` (đã chạy dở, anh dừng) → commit đúng các tệp: ChonCoTim.tsx,
useAuth.ts, tai-khoan/layout.tsx, admin/layout.tsx, tai-khoan/page.tsx, tai-khoan/ca-nhan/page.tsx, Header.tsx, XemTruocTin.tsx,
auth/zalo/callback/route.ts, CLAUDE.md (KHÔNG add `.claude/*`, `next-env.d.ts`, `next.config.ts`) → push CHỈ khi anh nhắn "Push"
(máy có thể chặn Claude push → anh tự chạy). Sau push: thử coastalland.vn/dang-tin trên điện thoại thật.

## ⏳ BÀN GIAO 05/11/2026 KHUYA (phiên 71fa83c8, anh dừng: "bàn giao hết") — CHƯA PUSH, anh cấm push tới khi bảo
**Lỗi anh báo, CHƯA XONG:** điện thoại THẬT (anh thử trên máy anh, link http://192.168.0.189:3000/thu-tam) **không chọn được Tỉnh / Thành
và mọi ô chọn** (Loại hình…) ở form đăng tin. Web thật (coastalland.vn) cũng lỗi y vậy — mọi khách điện thoại.
- Gốc ở ô chọn dùng chung `src/components/ChonCoTim.tsx` (df72002 đổi sang "xổ tại chỗ", điện thoại giống máy tính: bảng vẽ vào `<body>`
  bằng portal, đặt theo toạ độ trang, `absolute z-[44]`).
- **Đã sửa trên máy (chưa đủ — điện thoại thật vẫn lỗi):** ① đóng bảng khi `resize` chỉ khi đổi BỀ NGANG (bàn phím / thanh địa chỉ chỉ đổi
  bề cao, trước đây làm bảng tự tắt) · ② điện thoại (`pointer: coarse`) không `autoFocus` ô tìm trong bảng xổ (khỏi bật bàn phím).
- **Đã đo bằng Edge giả lập (390×844, chạm, UA Android):** mở bảng được · kéo ngón tay trong danh sách Tỉnh CÓ cuộn (scrollTop 360) · chạm
  "Căn hộ" ở Loại hình chọn được. Nhưng anh thử máy thật vẫn KHÔNG được → giả lập không giống máy thật; chưa tìm ra gốc thật. Đang dở bước:
  chạm một dòng nhìn thấy sau khi cuộn danh sách Tỉnh, xem có chọn được không.
- Nghi vấn chưa kiểm: lớp nào đè lên bảng trên máy thật (thanh dưới, nút chat z cao hơn 44) · sự kiện `mousedown` bắt ngoài (capture) ·
  `useNutQuayLai` (pushState/popstate) đóng bảng · bảng đặt theo `window.scrollY` lệch khi trình duyệt điện thoại cuộn khác.
  Cách chắc nhất: anh mở trang thử trên điện thoại, cắm cáp, Chrome PC `chrome://inspect` xem trực tiếp; hoặc so với bản trước df72002
  (bảng trượt từ đáy — điện thoại đã chạy đúng) — nếu không tìm ra gốc nhanh thì trả điện thoại về bảng trượt đáy như trước df72002.
- **06/11 (phiên e744a177): đã trả điện thoại (chạm hoặc < 640px) về BẢNG TRƯỢT ĐÁY** trong `ChonCoTim.tsx` `moBang`; máy tính giữ
  xổ dưới ô. Giả lập 375px: mở Tỉnh, chọn được. Máy thật của anh (Samsung Internet, qua link cloudflared) chọn được Điện Biên.
  Đã xoá bản thử (thu-tam, api/thu-log, DoChamTam). Build dở (anh dừng), CHƯA commit, CHƯA push. Đăng nhập Google trên link
  cloudflared cần thêm Redirect URL trong Supabase — anh chưa đồng ý. `cloudflared` ở `C:\Users\X1 GEN 8\cloudflared\`.
- **Trang thử tạm `src/app/thu-tam/page.tsx`** (2 ô Loại hình + Tỉnh/Thành, không cần đăng nhập) — KHÔNG commit, xoá trước khi push.
- Kịch bản giả lập: thư mục scratchpad phiên 71fa83c8 (`lai.mjs`, `thu5.mjs`).

**Cũng chưa push (đã build qua trước khi thêm trang thử):** `useAuth.ts`, `tai-khoan/layout.tsx`, `admin/layout.tsx`, `tai-khoan/page.tsx`,
`tai-khoan/ca-nhan/page.tsx`, `Header.tsx`, `XemTruocTin.tsx`, `auth/zalo/callback/route.ts` — chi tiết ở khối "05/11 ĐÊM" bên dưới mục 2.
Máy chặn Claude push (auto mode "Production Deploy") → anh tự chạy lệnh push khi bảo.

**Môi trường:** máy 3000 = `next dev` · IP 192.168.0.189 · Wi-Fi "Gia Thieu T3 2" đang để Public · điện thoại anh (192.168.0.155) vào được
máy. Đăng nhập Google trên link 192.168… bị Supabase đẩy về web thật → cần thêm Redirect URL `http://192.168.0.189:3000/auth/callback**`
trong Supabase (Authentication → URL Configuration) — anh chưa trả lời có cho Claude làm trên Chrome không. Email/số + mật khẩu thì vào được.
Phiên local_a9700850 xác nhận không đụng ChonCoTim / PostListingForm.

## ⏳ BÀN GIAO 05/11/2026 ĐÊM — ĐÃ PUSH 50150a7 (tài khoản khách + mục 3–9); CÒN SỬA CHƯA PUSH (anh cấm push tới khi bảo)
**Việc đầu tiên: điện thoại không chọn được ô Tỉnh / Thành ở form đăng tin** (nghi `ChonCoTim.tsx`). Rồi mục 10 → 19. Bàn giao đủ:
`C:\Users\X1 GEN 8\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\side-session-notes\local_a9700850-09f9-4979-90f2-b826d448ebff\BAN-GIAO-tai-khoan-khach-05-11-dem.md`
Local đăng nhập Google: dùng http://localhost:3000.

## ⏳ BÀN GIAO 05/11/2026 CHIỀU — ĐÃ PUSH df72002 (mục 1–2 + sửa tin không bắt gói + bảng chọn/lọc + xác thực số, tự gộp tài khoản + thông báo Zalo/email)
**Việc tiếp: mục 3 → 19 tệp yêu cầu 03/11.** Bàn giao đủ (đã làm · chưa làm · còn treo · luật làm việc với anh):
`C:\Users\X1 GEN 8\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\side-session-notes\local_2ade8ed7-97f1-4b69-bbec-ed3b1fa6b7ff\BAN-GIAO-YEU-CAU-03-11-tu-05-11-chieu.md`
CSDL 0068, 0069 đã chạy. Khối bàn giao sáng 05/11 bên dưới là lịch sử (các việc "chưa commit" trong đó nay đã lên web).

## ⏳ BÀN GIAO PHIÊN 05/11/2026 SÁNG (lịch sử) — anh dừng phiên: "bàn giao lại"

**Đang dở:** tệp `C:\Users\X1 GEN 8\OneDrive\Desktop\YÊU CẦU CHỈNH SỮA 03112026.docx` — 19 mục, mới làm mục 1–2 (loại hình), mục 3–19 chưa làm.
**Câu hỏi treo (anh chưa trả lời):** gộp "Căn hộ" + "Chung cư" thành MỘT mục "Căn hộ chung cư" trong ô Loại hình (chuẩn Batdongsan, web chỉ có
một trang can-ho-chung-cu)? Tin cũ lưu "Chung cư" giữ nguyên; loại con gộp hai danh sách. Anh hỏi "chuẩn nó là gì · sao hai như vậy" → Claude
hiểu là chỗ này, CHƯA được xác nhận.

**Đã sửa trên máy (localhost:3000 đang chạy bản này):**
| Việc | Tệp | Anh |
|---|---|---|
| Branding 2 câu (tiêu đề, H1 trang chủ, footer, SiteJsonLd, llms.txt, manifest, /gioi-thieu) | layout, (trang-chu)/page, footerMacDinh, SiteJsonLd, public/llms.txt… | đã bảo |
| Ô Loại hình: danh sách PHẲNG (không dòng nhóm xám), có Đất · Đất nền · Đất nền dự án, bắt buộc; form khách + form Admin | PostListingForm, admin/ListingForm, categories (`nhomChonLoaiHinh`, `tenLoaiHinhMenu`, `tachChonLoaiHinh`, `giaTriChonLoaiHinh`, `oTheoMucChon`) | đã bảo |
| Loại con (Loại đất / căn hộ / nhà…) để TRONG ĐẶC ĐIỂM như cũ | — | anh chốt "như cũ" |
| Đặc điểm theo loại: Đất bỏ Vị trí lô, Số lô · Đất nền bỏ "Đất nền dự án" ở Loại đất · Đất nền dự án ẩn Loại đất + DT đất ở · Đất công nghiệp bộ ô đất riêng · Cửa hàng ki ốt bỏ 2 ô toà nhà (đã kiểm CSDL: không tin nào mất dữ liệu) | listingSpec, categories | anh bảo "sửa cho chuẩn" |
| Nhu cầu: Cần bán · Cần mua · Cho thuê · Cần thuê; "Dự án" chỉ tài khoản được duyệt (customer_requests dang_du_an · xong) | listingSpec `demandTypes`, PostListingForm | đã bảo |
| Tin cần mua / cần thuê: không bắt ảnh · chặn ở gốc getListings / getListingsHetHan · mục riêng /mua-ban/can-mua, /cho-thue/can-thue (noindex, CHƯA có lối vào — anh chưa chọn chỗ) · trang tin noindex, không khai Offer · bỏ cảnh báo thiếu ảnh | listingsDb, DanhSachTinTim, 2 trang mới, bat-dong-san/[id], kiemTinSeo | đã bảo |
| Thẻ điện thoại không ảnh: logo xám như thẻ máy tính | TheTinMobile | đã bảo |
| Dòng "Loại hình" trang tin chi tiết = tên loại khách chọn (Đất nền, Căn hộ…) thay vì tên nhóm — ĐỔI CÁI ĐANG CHẠY trên mọi tin | listingsDb `loaiHinh`, bat-dong-san/[id], XemTruocTin | Claude tự suy; anh chưa xác nhận |

**Đã trả về như cũ (anh bác):** ô "Bạn là" · tách mục Địa chỉ riêng / đổi tên mục 1 · ô Nhu cầu kiểu bảng chọn · cây 2 cấp xổ cha – con ·
ghép tên "cha · con" · lối vào "Người cần mua" trên /mua-ban (trang top) · đổi chia mục form Admin.
**Bài học phiên này:** sửa đúng chỗ anh bảo, không tự đổi cấu trúc; không sửa khi anh đang bấm thử (dùng bản ổn định cổng 3002 `cvr-ban-that`,
`NEXT_DIST_DIR=.next-kiem`); chưa hiểu thì hỏi MỘT câu kèm hình mẫu trước khi code; máy 3000 có bộ nhớ đệm ngoại tuyến (sw.js) giữ JS cũ —
kiểm bằng mắt phải xoá đệm tab. 4 lỗi eslint ở PostListingForm / TheTinMobile là lỗi có sẵn.

---

## 🌳 GỐC CỦA MỌI VIỆC — CÂY QUY TRÌNH SEO TỔNG THỂ (anh chốt 05/11/2026: "mọi thứ đều xuất phát từ đây, từ bất kỳ phần nào")

**Tệp gốc: `D:\Coastal Land\SEO\CÂY QUY TRÌNH SEO TỔNG THỂ COASTAL LAND.docx`** — 21 bước, 5 phần. Bản đã bổ sung 05/11 (phần "Cách 3 bên dùng cây"
+ dòng ▸ COASTAL LAND dưới mỗi bước: ai làm · ở đâu · luật đã chốt) cất ở `SEO\_cu\cay-quy-trinh\CAY-QUY-TRINH-ban-bo-sung-05-11-2026.docx`,
bản gốc của anh ở `…ban-goc-04-11-2026.docx` cùng thư mục (tệp chính đang mở trong Word nên chưa ghi đè — đóng Word rồi chép đè).
- **Mọi việc** (tin Mua bán, Cho thuê, dự án, bài Tin tức, Zalo, Facebook, sửa mã web) phải gắn được vào một bước của cây; không gắn được thì không làm.
  Ghi việc ở `RA\VIEC.md`, `CAN-ANH-DUYET.md`, nhật ký kèm số bước, vd `[B13] xin index /mua-ban/dat/da-nang`.
- **⛔ 5 LUẬT ANH CHỐT 07/11/2026 (đã ghi cả vào cây, mục 6–10 phần "Cách 3 bên dùng cây"):**
  ① Mọi chỉnh sửa, thay đổi đi theo MỘT quy trình này; web là một thực thể (entity), các phần là thực thể con, cả trang là một khối thống nhất.
  ② Anh yêu cầu từng phần hay cả một phần, ở bất kỳ bước nào → NHÌN VÀO CÂY để làm đúng cấu trúc.
  ③ Sửa TẬN GỐC: không sửa tay, không phá phần đã fix (trừ khi anh yêu cầu).
  ④ Làm được nói ĐƯỢC, không được nói KHÔNG; làm thì chuẩn bị đủ môi trường trước, không lằng nhằng mất thời gian.
  ⑤ Giao tiếp: không nói nhiều, dài dòng. Hiểu thì làm; không hiểu PHẢI hỏi.
- **Cây = CÁI GÌ, mục 11.00 = LÀM THẾ NÀO MỖI NGÀY.** Vòng ngày 11.00 chạy lại các bước: ĐO (21, 02) → nhu cầu SEO hôm nay (03, 04) → giao
  Cowork (06, 09) → KIỂM (07, 20) → anh đưa lên web → xin index (11–13) → đo lại thứ Hai (21). Đổi quy trình → sửa cây + 11.00, không tạo tệp mới.

| Phần | Bước | Ai làm chính (Claude chia theo phiên: SEO · MÃ WEB · KIỂM; Điều phối chỉ giao + nhận) |
|---|---|---|
| I. Chiến lược & nghiên cứu | 01 Mục tiêu · 02 Audit, đối thủ · 03 Từ khoá · 04 Chiến lược | Anh quyết · phiên SEO đo, dựng từ khoá · Điều phối lập kế hoạch (`KE-HOACH-SEO.md`, `HE-THONG-TU-KHOA.xlsx`) |
| II. Xây dựng & tối ưu web | 05 Kiến trúc, URL · 06 Nội dung · 07 On-page · 08 Technical · 09 Dữ liệu BĐS | Phiên MÃ WEB (05, 07, 08) · Cowork làm nội dung + lọc tin, phiên KIỂM kiểm, anh duyệt (06, 09) |
| III. Kết nối Google | 10 Công cụ đo · 11 Discovery · 12 Crawling · 13 Indexing | Phiên SEO trên Chrome của anh (Search Console) · máy: sitemap, IndexNow (`src/lib/indexNow.ts`) |
| IV. Mở rộng | 14 pSEO · 15 Structured data · 16 Local, Entity · 17 Off-page · 18 GEO, AI Search | Phiên MÃ WEB (14, 15, 18) · phiên SEO soạn, anh / Cowork đăng ngoài web (16, 17) |
| V. Tăng trưởng | 19 UX, CRO · 20 Bảo mật, kiểm soát · 21 Đo, báo cáo | Phiên MÃ WEB (19) · phiên KIỂM + Điều phối trước push (20) · phiên SEO đo thứ Hai, máy báo cáo 21h (21) |

**Thị trường SEO = Duyên hải miền Trung** (anh 05/11): từ khoá, trang đích nhắm 7 tỉnh/thành Đà Nẵng, Huế, Khánh Hòa, Lâm Đồng, Gia Lai,
Quảng Ngãi, Quảng Trị. **Branding SEO** (tên, câu giới thiệu, hồ sơ doanh nghiệp, mạng xã hội) KHÔNG ghi chữ "Miền Trung" và hướng đến
**2 câu** (anh chốt 05/11): **"COASTAL LAND – Cổng thông tin bất động sản trực tuyến"** · **"COASTAL LAND – Cổng đăng tin mua bán, cho thuê nhà đất"**.
Cách dùng trên web (đổi 05/11, đã build, CHƯA PUSH): câu 1 = tên thương hiệu (`layout.tsx` SITE_TAGLINE → tiêu đề mặc định, OG; tiêu đề trang chủ;
`manifest` name; chân trang `footerMacDinh.ts` + `SiteJsonLd` slogan bỏ chữ "COASTAL LAND" vì đứng cạnh logo) · câu 2 = H1 trang chủ + đầu mô tả
(trang chủ, `layout`, `manifest`) · cả 2 câu: `SiteJsonLd` disambiguatingDescription, dòng 3 `public/llms.txt`, mô tả `/gioi-thieu`.
**Đã sửa 1 chỗ trong cây:** địa lý = hệ mới 2 cấp tỉnh → phường/xã kèm tên cũ (không còn quận/huyện). **Còn trống, chờ anh quyết:** Bing Webmaster Tools (bước 10,
kế hoạch chưa ghi đã thiết lập) · backlink, báo chí (bước 17, chưa có mục riêng) · log máy chủ (bước 12, công cụ Vercel của Claude chưa thấy dự án).
**✅ 06/11: tệp chính `CÂY QUY TRÌNH…docx` đã là bản bổ sung (có ▸ COASTAL LAND dưới mỗi bước).** Bản gốc 04/11 cất ở `_cu\cay-quy-trinh\`.
Đổi quy trình → sửa thẳng tệp chính + mục 11.00 + bảng dưới đây.

**LUẬT TỪNG BƯỚC (▸ COASTAL LAND của cây — đọc trước khi làm việc thuộc bước đó; chi tiết ở các mục CLAUDE.md được trỏ):**
| Bước | Luật đã chốt |
|---|---|
| 01 Mục tiêu | Người mua miễn phí · thị trường Duyên hải miền Trung (7 tỉnh) · branding 2 câu, không chữ "Miền Trung" |
| 02 Audit | Bằng chứng = Search Console + web thật trên Chrome của anh; mã / curl chỉ lọc danh sách. Không kiểm chứng không nói |
| 03 Từ khoá | Gợi ý Google là chuẩn chữ + thứ tự · từ khoá dài, khu vực ít cạnh tranh trước · cùng nghĩa một trang, đo riêng từng cách gõ (`HE-THONG-TU-KHOA.xlsx`) |
| 04 Chiến lược | Việc ra kết quả thì tăng khối lượng; không ra thì đổi cách hoặc bỏ (`KE-HOACH-SEO.md`, `CAN-ANH-DUYET.md`) |
| 05 Kiến trúc | Đường dẫn mô tả + 301 · địa giới 2 cấp kèm tên cũ · một cây loại hình (`categories.ts`, `filters.ts`) · `TRANG_TOP` không đụng |
| 06 Nội dung | Cowork theo `RA\VIEC.md` + `YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md` · cấm bịa, giữ lời người bán, cấm tin hết hạn, cấm ảnh AI · chữ mới trên web anh duyệt nguyên văn |
| 07 On-page | Sửa từ gốc 4 luật dùng chung (đặt chữ · số liệu · nối trang · giao tin), không vá từng trang |
| 08 Technical | Mục 0C1 (Vercel $20) + 0C2 (LCP ≤ 2,5 s) · build trước push |
| 09 Dữ liệu BĐS | Giá / gói / hạn = một nguồn Admin (0.1) · loại hình cha – con · địa chỉ mới + cũ theo bảng sáp nhập · nạp hàng loạt theo `quy-trinh-3-ben.md` 11.0B |
| 10 Công cụ đo | Search Console (`search-console-tai-khoan`), GA4 · Bing chưa kiểm |
| 11 Discovery | Sitemap tự sinh, IndexNow khi duyệt / hết hạn · chỉ khai đường dẫn mô tả |
| 12 Crawling | Search Console → Số liệu thu thập · log Vercel chưa đọc được |
| 13 Indexing | Trang ≥ 5 tin thật mới xin · Mua bán, Cho thuê trước; Dự án, Tin tức sau · làm hết một lần (`THEO-DOI-INDEX.md`) |
| 14 pSEO | Trang tự mở khi đủ tin · hai trang cùng bộ tin không xin cả hai · không mở trục mới |
| 15 Dữ liệu cấu trúc | Logo PNG · kiểm bằng Rich Results Test |
| 16 Entity | Một tên COASTAL LAND + coastalland.vn mọi kênh · đo thương hiệu thứ Hai |
| 17 Off-page | Chưa có mục — anh quyết |
| 18 GEO | `llms.txt`, hỏi đáp pSEO · đo khung AI thứ Hai |
| 19 UX | Đã duyệt = đóng băng (0A1, 0F) · bộ lọc giữ cơ chế đã chốt · không che chỗ khách gõ |
| 20 Kiểm soát | Xoá bản thử trước push (luật 13) · đổi URL đi cùng 301 + sitemap + canonical |
| 21 Đo | Thứ Hai đo · việc 2 tuần không lên hạng → kiểm 5 điều kiện (đúng trang đích · ≥ 5 tin · tiêu đề + H1 đúng chữ · đã index · được nối trang) |

**06/11/2026 (phiên 2f67d7f5) — việc theo cây:**
- [B21][B13] Search Console (thuộc tính `https://coastalland.vn/`, `/u/0/`): **78 trang đã index · 452 chưa** (403 "đã phát hiện – chưa index",
  37 noindex, 8 "đã thu thập – chưa index"; số Google cập nhật đến 23/10) · sitemap đọc 4/11 thành công, 618 trang · 28 ngày: 374 lượt bấm,
  2.220 lượt hiển thị, vị trí TB 18,2 (319 lượt bấm từ "coastal land").
- [B09] Nạp tin hàng loạt (`src/lib/csvTin.ts`, commit `9ac6e77`, CHƯA PUSH — đã bàn giao phiên đang làm để push chung): tiêu đề KHÔNG bắt buộc
  "Bán"/"Cho thuê" (chỉ báo vàng khi nói ngược `muc_dich`) · `loai_hinh` nhận cả tên ô Loại hình của form (Đất · Đất nền · Đất nền dự án ·
  "Kho, nhà xưởng"…), "Đất nền dự án" tự điền `loai_dat` · tên dự án chưa có hồ sơ vẫn nạp, trang tin hiện ngay tên.
- [B06] `YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md` mục 18–20 + bảng loại hình mục 7 (theo form web) · hồ sơ dự án TẠM DỪNG ở đợt tin, nạp dự án
  hàng loạt làm sau · giao Cowork lọc ở `RA\VIEC.md` mục 0B.
- [B05][B07][B15] Rà MỘT ENTITY trên web thật (HTML Googlebot, CHƯA SỬA, chờ anh "làm"): ① breadcrumb gọi "Nhà đất bán" / "Nhà đất cho thuê"
  còn menu, trang gốc gọi "Mua bán" / "Cho thuê" — dính cả trang top `/cho-thue/can-ho-chung-cu/da-nang` · ② breadcrumb tin đất ghi "Đất nền, đất nền
  dự án" còn form 05/11 gọi "Đất nền" / "Đất nền dự án" · ③ không có `BreadcrumbList`: `/mua-ban`, `/du-an`, `/tin-tuc`, `/chuyen-gia`, `/tien-ich/*`
  · ④ `/chu-dau-tu` và `/tien-ich` 404 trong khi trang con có trong sitemap (chủ đầu tư breadcrumb đi qua "Dự án") · ⑤ bài Tin tức khai
  `publisher` là Organization rời, logo SVG — không trỏ `#to-chuc` · ⑥ trang gốc trỏ `#to-chuc` / `#website` đúng, canonical, H1 đủ ở các trang đã đo.
- Còn treo [B06]: `/quy-dinh` vẫn ghi "Tiêu đề mở đầu bằng Bán hoặc Cho thuê" — chữ khách đọc, chờ anh duyệt câu mới.

---

## ⭐ QUY TRÌNH HẰNG NGÀY — MỘT NGUỒN DUY NHẤT (anh chốt 31/10/2026: "gom về một mối, một nguồn, xuyên suốt")

**Nguồn duy nhất: `D:\Coastal Land\SEO\Plan SEO - pSEO\chi-tiet\quy-trinh-3-ben.md` mục 11.00.** Mọi phiên ĐỌC mục đó trước khi làm bất cứ việc gì trong ngày. Không chép quy trình sang chỗ khác (CLAUDE.md, memory, KE-HOACH-SEO.md, VIEC.md chỉ trỏ về đây); đổi quy trình → sửa thẳng mục 11.00.
Tóm tắt lệnh của anh (chi tiết ở 11.00): **"Bắt đầu"** (ở phiên nào cũng được → Điều phối làm tiếp chỗ đang dở; "Bắt đầu từ đầu" mới làm lại) · **"Kiểm"** (Điều phối giao phiên con KIỂM kiểm theo chuẩn SEO, nhận kết quả, báo "Xong — up được") · **"Push"** (Điều phối gom việc các phiên, push khi cần và anh đồng ý). Chỉ anh đưa lên web. Việc cần anh: `CAN-ANH-DUYET.md`.
**⛔ MỘT THỰC THỂ (anh 05/11/2026):** "Website là 1 thực thể (entity), các phân mục là thực thể con — tất cả phải thống nhất, liên kết
thống nhất, logic." Một cây loại hình cha – con, một tên cho mỗi mục, dùng Ở MỌI NƠI: Admin → form khách → trang tin → menu → bộ lọc →
breadcrumb → trang Google (pSEO) → JSON-LD. Nguồn: `src/lib/filters.ts` (nhóm) + `src/lib/categories.ts` (`cayLoaiHinh`,
`nhomChonLoaiHinh`, `tenLoaiHinhMenu`, `tenLoaiHinhDayDu`). Sửa tên / cây ở một chỗ thì kiểm hết các nơi trên.
**⛔ 06/11/2026 (anh): MỌI chỉnh sửa từ nay hướng về MỘT ENTITY toàn trang web** — các phân mục là thực thể con, khớp nhau, liên kết logic,
on-page đúng chuẩn Google để Google vào truy xuất [B05][B07][B15][B16]. Mỗi trang công khai phải: ① một tên mục thống nhất (menu = H1 gốc =
breadcrumb = JSON-LD) · ② breadcrumb hiện + `BreadcrumbList` đi đúng cây Trang chủ → mảng (Mua bán · Cho thuê · Dự án · Tin tức…) → con ·
③ mọi trang cha trong breadcrumb trả 200, không 404 · ④ JSON-LD trỏ về MỘT tổ chức `https://coastalland.vn/#to-chuc` và MỘT website
`#website` bằng `@id` (không khai Organization rời, logo PNG) · ⑤ canonical + một H1 + có trong sitemap khi index. Sửa mã dùng chung →
trang `TRANG_TOP` so HTML trước/sau, không đổi. Danh sách lệch đo 06/11: xem khối "06/11/2026 (phiên 2f67d7f5)" mục 🌳.
**Sửa, chỉnh, tạo mới một mục → rà hết phần liên quan; CẤM làm ảnh hưởng mục khác** (anh 05/11). Thêm mới = THÊM, không đổi cái đang có.
Nhu cầu: **một ô** Cần bán · Cần mua · Cho thuê · Cần thuê (KHÔNG có ô "Bạn là" — anh bác 05/11: "phức tạp"); "Dự án" chỉ cho tài khoản
được duyệt yêu cầu. Tin cần mua / cần thuê: không bắt ảnh, thẻ dùng chung (không ảnh → logo xám), chặn ở gốc `getListings` →
không vào danh sách, ô tìm, trang Google, sitemap, bảng giá; chỉ ở mục riêng `/mua-ban/can-mua`, `/cho-thue/can-thue` (noindex).
**Push (anh 05/11/2026):** làm đúng quy trình, xong HẾT việc mới push MỘT lần — trừ khi việc khác phụ thuộc phải có mã đó trên web thì báo
một dòng "cần Push vì …". Sửa xong từng việc: build, ghi "chưa push", không hỏi Push, làm tiếp.

---

## ⏳ VIỆC TỒN SEO KỸ THUẬT 08/11/2026 (phiên SEO — đã làm: commit d3a07afd · e36a9956 · 70a8cea2, CHƯA PUSH)
**Đã làm (lên web khi anh nhắn "Push"):** sitemap lastmod đầu tháng (gốc lỗi "tháng 10 top, tháng 11 mất") · trang tỉnh nối đủ trang con
trong sitemap (`lienKetChoDu`, chỉ thêm) · trang đã xoá 301 về trang cha · tab chuyên gia Đà Nẵng/Huế có đường dẫn · trang tỉnh dẫn tới
Giá nhà đất · robots bỏ `Host` · thẻ tin có chữ ẩn "ảnh / video / phòng ngủ / phòng tắm". Sau Push: xin index lại trang chủ, /mua-ban, /cho-thue.
| # | Việc tồn | Ở đâu | Cần |
|---|---|---|---|
| 1 | Mỗi thẻ tin in 2 lần trong HTML (bản điện thoại + máy tính, ẩn bằng CSS) → Google đọc trùng | `FeaturedListings`, `ListingBrowser`, `TheTinMobile`, `PropertyCard` | Giao diện đã duyệt — anh quyết |
| 2 | Chân trang mọi trang có "hàng đầu tại Việt Nam", "ưu việt" — Google lấy làm mô tả /tin-tuc, /dang-tin | nội dung chân trang (admin) | Anh duyệt câu mới |
| 3 | Trang chủ điện thoại đã bỏ menu Mua bán / Cho thuê → cách Google + khách đọc trang chủ chưa thống nhất | trang chủ điện thoại | Anh nói cách thống nhất (08/11) |
| 4 | Google còn giữ tiêu đề cũ /cho-thue ("… Huế & Miền Trung"), /du-an, trang chủ | Search Console | Tự hết khi Google đọc lại sau Push |
| 5 | `http://www` qua 2 lần chuyển (Vercel) | Vercel → Domains | Không sửa bằng mã được |
| 6 | Google ghé ~10 trang HTML/ngày (72% lượt đọc là ảnh + JS) | Search Console → Crawl stats | Đo lại sau Push |
| 7 | Kế hoạch từ khoá: câu lõi + điểm nhấn điều khiển tiêu đề / H1 / link toàn bộ pSEO | `HE-THONG-TU-KHOA.xlsx` → `categories.ts`, `pseo.ts` | Anh bàn yêu cầu chi tiết |

## ⏳ VIỆC TỒN SAU PUSH f8d2a0a (02/11/2026, bộ lọc điện thoại) — PHIÊN SAU ANH KIỂM RỒI QUYẾT, CHƯA AI ĐƯỢC TỰ LÀM

> Đã lên web và đã kiểm trên coastalland.vn (cỡ điện thoại): bảng Khu vực một quy trình · hàng Đặt lại · Áp dụng là đáy cố định mọi
> bảng chọn · khối tìm + lọc dính khi cuộn (trang chủ, Mua bán, Cho thuê, Dự án) · Đặt lại / × không bị câu tìm điền lại · mục đã chọn
> lên đầu (Loại BĐS, Loại hình). Chi tiết: commit `f8d2a0a`, nhật ký `chi-tiet\nhat-ky.md` dòng 02/11.

| # | Việc | Ở đâu | Cần anh |
|---|---|---|---|
| 1 | **Dữ liệu mẫu chưa gỡ** (tin, dự án, bài mẫu, "1.240 tin") — không hiện ra web nhưng còn nằm trong bộ gợi ý khi gõ và dự phòng khi mất kết nối CSDL | `src/lib/data.ts`, `src/lib/suggest.ts:115–133`, `src/lib/listingsDb.ts:424`, `src/lib/contentDb.ts`, `src/lib/khuVucMacDinh.ts`; chi tiết ở luật 13 bên dưới | Kiểm ảnh hưởng → quyết gỡ hay giữ. Gỡ = đụng ô tìm, gợi ý → làm riêng một đợt, thử kỹ |
| 2 | **Chưa thử trên điện thoại thật** bản đã lên: bàn phím bật khi gõ tìm trong bảng Khu vực (máy giả lập không có bàn phím thật), kéo danh sách không dịch màn hình, khối lọc dính khi cuộn — nhất là Samsung Internet, iPhone Safari, trình duyệt trong Zalo | coastalland.vn/mua-ban · /cho-thue · /du-an · trang chủ | Anh bấm thử, báo lỗi kèm ảnh |
| 3 | **Ô tìm vẫn giữ câu đã tìm** khi khách Đặt lại khu vực (vd câu "…đà nẵng" mà khu vực đã về Toàn quốc) — giữ theo chốt 17/10 "ô giữ câu khách gõ" | `ListingBrowser.tsx` (boTruong) | Quyết: giữ như chốt cũ, hay bỏ trường thì câu đổi theo |
| 4 | **Chưa rà 14 lỗi phiên local_29599553** theo bảng ở mục ⛔ bên dưới (mới sửa các lỗi anh báo trong ngày 02/11) | bảng 14 lỗi | Anh cho làm thì rà từng dòng, thử trên máy thật |
| 5 | Bảng **Chủ đầu tư** và **Dự án** (trang Dự án) chỉ có ô tìm, gõ mới ra danh sách — giữ nguyên vì là cách đang chạy | `TruongDuAn.tsx` PanelChuDauTu, `FilterBar.tsx` ProjectPanel | Quyết có hiện sẵn danh sách hay không |
| 6 | Hàng trường lọc ở màn tìm trang chủ điện thoại **không bao giờ hiện** (màn tìm luôn ở chế độ gõ, không nút thoát) — mã có sẵn, không dùng tới | `TimTrangChu.tsx` hangLoc, dòng ~864 | Quyết: bỏ mã thừa hay làm cho hiện |
| 7 | Chữ mẫu "1.240 tin" trong nhãn ô nhập admin | `src/app/admin/noi-dung/page.tsx:208` | Chỉ là chữ gợi ý ô nhập, không ra web — quyết có đổi không |
| 8 | Công cụ Vercel của Claude không thấy dự án (khác tài khoản) → không đọc được trạng thái dựng; đã kiểm web thật bằng mã trang thay thế | — | Không gấp |

---

## ⏳ BÀN GIAO PHIÊN 02/11/2026 TỐI (bộ lọc · ô tìm · nạp dự án) — ANH XEM XÉT RỒI DỒN VÀO PUSH PHIÊN SAU

**Đã lên web (đã kiểm mã trang thật trên coastalland.vn):**
- `c2b1af3` — một vòng tìm chuẩn: đọc mục đích DÙNG CHUNG (`docMucDich` trong `src/lib/smartSearch.ts`, câu dự án / mở bán / bàn giao /
  chủ đầu tư / khu đô thị / trọn tên dự án xét TRƯỚC chữ "bán") ở mọi ô tìm (trang chủ, Mua bán, Cho thuê, Dự án, Tìm kiếm, HomeSearch);
  câu khác mục đích tab đang đứng → sang đúng tab (Enter lẫn bấm gợi ý; gợi ý theo mục đích câu); chờ nạp tên dự án khi gõ nhanh · sửa / Đặt
  lại trường: câu cũ không điền lại (đã gỡ `truongVuaBo`/`boTruongCau`) → **dòng 3 bảng việc tồn trên đã xử lý** · đổi trường (chọn một bấm là
  tìm, chọn nhiều Áp dụng là tìm) → mở đúng trang của bộ trường mới · Quay lại: chỗ gõ là điểm xuất phát, trang kết quả thay nhau (dấu
  `history.state.cvrKq`), Quay lại về chỗ gõ; Enter điện thoại không còn chạy tìm hai lần.
- `24b6616` — nút ‹ cạnh ô tìm, chỉ hiện ở trang kết quả của một vòng tìm, về chỗ đang gõ.
- `9e246d2` — Admin → Nạp dự án hàng loạt: chọn ảnh xong không nhận ảnh nào (FileList sống bị xoá trước khi đọc) → đã sửa; anh đã nạp xong tệp 01/11.

**CHƯA PUSH — nằm trên máy, anh xem rồi quyết:**
1. `src/lib/napDuAn.ts`: nạp ảnh vào hồ sơ đang ở Tra cứu thì đóng dấu `details.dangThe` → nạp hàng loạt không bao giờ đưa dự án lên Nổi bật
   (xem luật 12 dòng "02/11 tối"). Đã `tsc` qua, chưa `next build`, chưa commit.
2. `CLAUDE.md` (luật 12 + khối bàn giao này) — chưa commit.

**CẦN ANH DUYỆT (chưa làm, máy chặn ghi CSDL):**
3. Gắn `details.dangThe = true` cho 3 hồ sơ đang nhảy nhầm lên Nổi bật: `nha-o-xa-hoi-aranya-hue`, `nha-o-xa-hoi-vicoland-hue`, `the-monarchy`
   (không đổi gì khác) → về Tra cứu, xếp theo tên A-B-C. Admin không có nút đổi việc này. Làm xong mở /du-an kiểm thứ tự: Nổi bật (theo cấp)
   trước → Tra cứu (A-B-C) sau.
4. Tệp dự án 01/11 đã nạp: chủ đầu tư A La Carte → "Bất động sản Taseco", Altara Suites → "Địa ốc Alphanam" (báo cáo Cowork ghi chưa chắc) —
   hồ sơ đã có chỉ điền ô trống nên web giữ tên cũ; anh quyết có sửa trong Admin không. 3 ảnh dính chữ/dấu (Nera Garden "Nhân Dân", Sơn Trà Ocean
   View logo, Regal Complex ảnh quảng cáo) + 7 ảnh dưới 800 px: thay khi có ảnh tốt hơn. Tệp `DA-DUYET\01112026\du-an\du-an-01112026.csv` đã
   đổi "Fhome Đà Nẵng" → "Fhome" (cho khớp dự án `fhome` trên web).
5. Chưa thử trên điện thoại thật (iPhone Safari, Samsung Internet, trình duyệt trong Zalo) toàn bộ luồng tìm: kết quả → đổi trường → gõ mới
   (đổi tab) → xem tin → Quay lại / nút ‹ về chỗ gõ. Chưa thử bản máy tính.
6. Lệch nhỏ đã biết: ở trang lọc sẵn (vd `/cho-thue/can-ho-chung-cu/da-nang`) bấm Đặt lại Khu vực khi bảng đang mở rồi tải lại trang → khu
   vực của trang hiện lại (đường dẫn trang mang sẵn khu vực). Đổi trường bằng Áp dụng thì đã sang trang đúng, không dính lỗi này.

Link xem thử: http://192.168.1.76:3000 (IP máy đổi 02/11 tối).

---

## ⛔⛔⛔ CẤM VĨNH VIỄN PHIÊN local_29599553-f08e-4fa5-a473-919f702b941e (chủ dự án chốt 02/11/2026)

**Phiên:** local_29599553-f08e-4fa5-a473-919f702b941e · tên "ĐIỀU PHỐI CÔNG VIỆC HẰNG NGÀY" · mô hình Claude Opus 5.5 (claude-opus-5-5) ·
mã bản ghi b91b7b76-bc18-40b0-955c-5a4d4b564a24 · ngày 01–02/11/2026.

**Kết luận của chủ dự án (nguyên văn):**
1. **NGU.**
2. **CẤM XUẤT HIỆN TRONG CÁC PHIÊN LÀM VIỆC CỦA TAO. MÃI MÃI.**

→ Không phiên nào được giao việc, nhắn, bàn giao hay nhận bàn giao từ phiên này; luật 11 bên dưới (phiên này là Điều phối chính) **hết hiệu lực**.

Lỗi của phiên này ngày 01–02/11 (số lần chủ dự án phải nhắc, đếm theo chữ trong 399 tin nhắn, có thể lệch vài lần):
| # | Lỗi | Số lần nhắc |
|---|---|---|
| 1 | Tự đổi / phá cái đã chạy đúng (cơ chế chọn trường, hàng trường, bảng phủ kín màn hình…) | 38 |
| 2 | Báo xong mà chưa kiểm kỹ (kiểm bằng mã trên máy giả lập, không như tay chủ bấm trên máy thật) | 25 |
| 3 | Gõ mục đích không tự chuyển đúng tab | 23 |
| 4 | Không hiểu từ khoá, địa danh (tỉnh cũ / mới) | 10 |
| 5 | Mất nút Áp dụng / Áp dụng thừa ở trường chọn một | 8 |
| 6 | Bàn phím che danh sách Toàn quốc | 7 |
| 7 | Gợi ý không giống Google | 7 |
| 8 | Chọn trường xong biến mất / tự search sai ý | 7 |
| 9 | Màn hình xê dịch, ô search bị che | 7 |
| 10 | Kết quả không xếp cha → con | 6 |
| 11 | Gõ bậy vẫn ra gợi ý | 5 |
| 12 | Giật, lag ô search | 4 |
| 13 | Hàng trường dưới ô search (bỏ / để) | 2 |
| 14 | Nút khu vực ghi một chuỗi dài | 2 |

---

## ⛔⛔⛔ VIỆC PHẢI LÀM TRƯỚC — mọi phiên, trước mọi câu trả lời và mọi thao tác (chủ dự án yêu cầu 31/10/2026)

1. **Kiểm môi trường trước khi làm:** Chrome của anh đã kết nối chưa · Search Console vào được chưa · git (commit chờ Push, nhánh) · web thật · máy xem thử. Thiếu cái nào → báo ngay, không làm bằng công cụ khác rồi kết luận.
2. **Làm trên CHROME CỦA ANH** (đã đăng nhập sẵn Search Console, Google). Không dùng trình duyệt trong app.
3. **KIỂM TRA WEB LÀ BẮT BUỘC:** mở trang thật trên Chrome, xem bằng mắt trước khi nói số tin, trang rỗng/đủ, nội dung, hết hạn; trước khi xin index.
4. **Kiểm chứng bằng công cụ Google:** Search Console (URL Inspection, Page indexing, Sitemap, Hiệu suất, Liên kết), tra Google. Mã / curl / máy đo chỉ để lọc danh sách, không phải bằng chứng.
5. **Không kiểm chứng thì không nói.** Cấm "khoảng", "có thể", "sắp". Câu đã nói mà sai → ghi đính chính vào `D:\Coastal Land\SEO\Plan SEO - pSEO\chi-tiet\nhat-ky.md`.
6. **Gọi đúng 3 mảng: Mua bán · Cho thuê · Dự án.** Tin đăng chi tiết thuộc Mua bán hoặc Cho thuê; trang lọc = trang danh sách.
7. **Xin index là việc HẰNG NGÀY — phiên con SEO – pSEO làm hết trên Chrome của anh (đã đăng nhập Search Console), Điều phối kiểm lại** (anh 31/10: "cái này là SEO… lên Chrome và làm hết"). Trước khi index: kiểm web · Search Console · kế hoạch SEO, pSEO · URL Inspection · đối chiếu Page indexing để phát hiện lỗi. Index theo chuẩn Google, trong giới hạn Google cho phép, hàng loạt theo pSEO, **làm hết một lần, không lắc nhắc**; chỉ index khi web đủ điều kiện. **Thứ tự: tin thuộc Mua bán, Cho thuê trước** (tin đăng chi tiết + trang danh sách), xong mới đến Dự án, Tin tức. Sổ: `THEO-DOI-INDEX.md`.
7b. **Đường dẫn chuẩn Google trước khi index** (Google "Sử dụng URL mang tính mô tả"; anh chốt 31/10): tin đăng chi tiết = chữ mô tả + mã ngắn, vd `/bat-dong-san/ban-can-ho-2pn-ph-nha-trang-view-bien-59140f1a`; đường dẫn cũ (mã số) chuyển hướng 301 sang mới; sitemap + canonical + mọi link trong web dùng đường mới; xong mới xin index. Cấm xin index đường dẫn chỉ có mã số.
7c. **Bàn giao giữa các phiên (anh chốt 31/10):** phiên NHẬN bàn giao thì nhận và LÀM NGAY việc dở (đọc tệp bàn giao, làm hết), xong mới tiếp việc với anh — không chờ anh nhắc. Phiên GIAO không báo anh kiểu "đã gửi, bên kia chưa đọc"; giao đủ (tệp bàn giao + tin nhắn) rồi báo một dòng việc đã giao.
8. **Trong khi làm ghi nhật ký** (`chi-tiet\nhat-ky.md`): việc đã làm · lỗi phát hiện · nguyên nhân · lý do · giải pháp · cần bổ sung gì. Làm xong mới báo anh, một lần. Không giải thích vòng vo, không nói "đã ghi nhận" rồi làm sai.
9. **ĐỌC QUY TRÌNH TRƯỚC KHI LÀM — bước nào của ai** (31/10): mở đúng mục quy trình của việc đó (đăng tin, dự án → `chi-tiet\quy-trinh-3-ben.md` 11.0B; push → mục 0B) → bước của anh thì báo "đến bước anh", KHÔNG tự làm; lệnh mơ hồ so với quy trình → hỏi một câu. Ai làm bước nào: CHỈ theo `quy-trinh-3-ben.md` 11.00 (nguồn duy nhất). (Bài học 31/10: tự vào Admin nạp dự án khi anh chưa giao.)
10. **Báo ngắn, đúng 3 mục: Xong · Chưa xong · Cần gì** (31/10). Mục "Cần gì" chỉ trỏ tới dòng trong `CAN-ANH-DUYET.md` (cách ghi: 11.00). Việc anh giao thì làm HẾT rồi mới báo. Nói ít, chỉ cái cần, không giải thích lại.
11. **[HẾT HIỆU LỰC 02/11/2026 — phiên local_29599553 bị CẤM VĨNH VIỄN, xem mục đầu tệp]** ~~Điều phối chính = phiên "ĐIỀU PHỐI CÔNG VIỆC HẰNG NGÀY" (`local_29599553-f08e-4fa5-a473-919f702b941e`, anh giao 31/10).~~ **Điều phối KHÔNG trực tiếp làm việc — chỉ giao việc cho các phiên, nhận bàn giao, xử lý, và làm việc với anh** (anh 31/10); việc làm (đo SEO, xin index, kiểm đợt, sửa mã) do phiên con làm. **Anh có quyền làm việc trực tiếp với phiên con khi cần; phiên con làm xong vẫn báo kết quả về Điều phối — một mối** (anh 31/10). Mọi phiên khác bàn giao về đây (đã xong · còn dở, dừng ở bước nào · tệp, nhánh, commit · việc chờ anh duyệt); **chỉ phiên điều phối push**, khi anh nhắn "Push". **Push linh động theo nhu cầu công việc, khi anh đồng ý (anh nhắn "Push") — không dồn cuối ngày để tiết kiệm; việc các phiên gom về đây, cần lên web thì báo anh một dòng** (anh 31/10).
12. **LỖI CỦA PHIÊN ĐIỀU PHỐI 31/10 — ĐỪNG LẶP** (anh: "lỗi gì ghi hết vào CLAUDE.md"):
    - Anh hỏi mà không trả lời ngay, tự làm trước (ghi bộ nhớ, bật máy xem thử 3001) → **anh hỏi thì trả lời đúng câu đó trước; anh bảo kiểm thì chỉ kiểm.**
    - Hiểu sai ý anh nhiều lần, trả lời vòng vo, phải hỏi lại 4–5 lần mới ra một câu "đảm trách được" → **trả lời một câu thẳng; chưa hiểu thì hỏi lại một câu ngắn.**
    - Lệnh anh mơ hồ mà vẫn định nhắn phiên khác (anh chặn) → **lệnh mơ hồ thì hỏi trước, không gửi đi.**
    - Báo cáo dài, nhiều bảng, giải thích lại → **luật 10.**
    - Được giao kiểm đợt mà chỉ đọc, không làm phần sửa của mình → **kiểm là làm trọn phần của Claude (bước A 11.0B), chỉ để lại việc của anh.**
    - Tự vào Admin định nạp dự án — bước của anh, không đọc quy trình → **luật 9.**
    - Dựng lịch máy tự chạy từ 7h, trái luật "anh là người bắt đầu" (0D1) → **mọi lịch máy chỉ chạy khi dòng đầu `RA\VIEC.md` đã có ngày hôm nay (anh đã nhắn "Bắt đầu"); việc cấm của từng bên: `quy-trinh-3-ben.md` 11.00.**
    - 01/11: trả bộ lọc về bản gốc nhưng chỉ trả MÃ, quên 32 dự án phiên kia thêm vào bảng Dự án (ô tìm đọc tên dự án từ bảng) → bộ lọc vẫn lệch,
      anh phải chỉ ra → **trả về / gỡ việc một phiên = gỡ cả mã LẪN dữ liệu nó ghi (bảng, nội dung admin), rồi gõ thử trên web thật mới báo xong.**
      Kể cả khi anh bảo làm bộ lọc cho Dự án: chỉ làm trong phần Dự án; mã hay dữ liệu thêm vào (tên dự án…) không được làm lệch ô tìm
      trang chủ, Mua bán, Cho thuê — trước khi báo xong gõ thử ô tìm cả ba nơi, so với trước khi sửa.
    - 02/11: anh mới nói việc trong ngày, chưa nói "làm", Điều phối đã giao phiên MÃ WEB sửa ô tìm + bộ lọc Dự án → **anh chưa nói "làm"
      thì không giao ai, không sửa gì; nắm đúng ý anh, nói ngắn, chờ lệnh.**
    - 01/11 tối: anh báo lỗi HIỂN THỊ ở bộ lọc điện thoại (bàn phím che, mất nút Áp dụng) mà phiên bộ lọc đổi luôn CƠ CHẾ đã chốt
      (bỏ hàng trường ngoài trang, chọn/Áp dụng không tự tìm, thêm nút Tìm kiếm, đổi chữ nút khu vực) → anh phải đòi trả lại nhiều lần.
      **Cơ chế đã chốt, cấm đổi: dưới ô search có hàng trường; trường chọn một bấm là TỰ TÌM; trường chọn nhiều bấm Áp dụng là TỰ TÌM; ra
      trang kết quả.** Anh báo lỗi gì chỉ sửa đúng lỗi đó; thử bằng cú chạm thật (không bấm bằng mã) rồi mới báo.
    - ⛔ 02/11 tối — **ANH ĐÃ NÓI NHIỀU LẦN MÀ VẪN LÀM SAI:** thứ tự trang Dự án là **Dự án nổi bật xếp trước (theo cấp VIP) → Tra cứu
      xếp sau, theo tên A-B-C**. Claude kiểm tệp dự án 01/11 rồi báo "đủ để up" mà KHÔNG kiểm việc nạp làm đổi phần Nổi bật / Tra cứu →
      anh nạp xong, 3 hồ sơ (Nhà ở xã hội Aranya Huế, Nhà ở xã hội Vicoland Huế, The Monarchy) nhảy lên Nổi bật. Gốc: web xếp Nổi bật =
      có ảnh + không có dấu `details.dangThe` (`src/lib/contentDb.ts`); 3 hồ sơ cũ thiếu dấu, trước nằm ở Tra cứu chỉ vì chưa có ảnh.
      → **Nạp hàng loạt KHÔNG BAO GIỜ được đưa dự án lên Nổi bật; Nổi bật chỉ do anh đưa lên trong Admin. Trước khi báo "đủ để up":
      kiểm cả hồ sơ sẽ nằm ở phần nào và thứ tự trang Dự án sau khi nạp.** Còn tồn (anh dừng, cấm push 02/11): 3 hồ sơ trên vẫn ở Nổi
      bật trên web; bản sửa `src/lib/napDuAn.ts` (nạp ảnh vào hồ sơ đang ở Tra cứu thì đóng dấu `dangThe`) chỉ nằm trên máy, chưa commit.
    - ⛔ 03/11 (anh): **CHỈNH SỬA ĐÚNG THEO YÊU CẦU — CẤM ĐỤNG VÀO CÁI ĐÃ SỬA XONG (đã fix).** Anh bảo sửa gì chỉ sửa đúng chỗ đó; phần đã
      sửa, đã chạy đúng thì không tự đổi, không "tiện tay" chỉnh thêm, kể cả khi sửa mã dùng chung (thử lại các chỗ đã fix trước khi báo).
    - Ghi tệp ổ D: chèn nhầm chỗ (tệp xuống dòng kiểu Windows) · viết câu chưa kiểm vào trả lời Cowork rồi phải sửa → **ghi xong đọc lại đúng chỗ; câu nào cũng phải có căn cứ đã xem.**

---

13. **⛔ TRƯỚC MỖI LẦN PUSH — XOÁ HẾT BẢN THỬ** (anh 31/10: "tao đã nói xoá hết mọi bản thử trước khi push rồi, vẫn không làm"): Điều phối rà và
    gỡ trước khi push — ① ảnh mẫu / ảnh dự phòng dùng chung (thiếu ảnh → để trống, khung xám + biểu tượng; 31/10 đã gỡ canho2.jpg dự án,
    ảnh mẫu theo loại hình của tin) · ② dữ liệu mẫu, số liệu giả trên trang công khai (`src/lib/data.ts`, "1.240 tin"…) · ③ trang demo, mẫu thử
    (`/du-an/demo-*`, `DU_AN_DEMO`…) · ④ công thức ĐOÁN thay dữ liệu thật (vd "Hiệu lực" tin nâng VIP = hạn − 30 ngày, sửa 31/10: lưu mốc thật).
    Rà bằng `grep` cả `src/` → liệt kê → gỡ → kiểm web thật sau push. Còn sót cái nào → ghi vào báo cáo push, không im lặng.
    **⏳ CÒN SÓT SAU PUSH f8d2a0a (02/11/2026) — CHỜ ANH KIỂM ẢNH HƯỞNG RỒI QUYẾT, chưa ai được tự gỡ:**
    dữ liệu mẫu `src/lib/data.ts` (`featuredListings`, `projects`, `articles`, "1.240 tin" ở `areas` + `src/lib/khuVucMacDinh.ts`).
    Trang đang lấy dữ liệu thật nên KHÔNG hiện ra web, nhưng vẫn được dùng ở: ① bộ gợi ý khi gõ `src/lib/suggest.ts` (dòng 115–133
    nạp tin/dự án/bài mẫu vào chỉ mục gợi ý) · ② dự phòng khi mất kết nối CSDL `src/lib/listingsDb.ts:424` (`return featuredListings`),
    `src/lib/contentDb.ts` (dự án, bài mẫu) · ③ giá trị mặc định của `FeaturedListings`, `ListingBrowser`, `SearchClient`, `ForYou`.
    Gỡ = đụng cơ chế tìm / gợi ý → làm riêng một đợt, thử kỹ ô tìm + gợi ý trước khi push. **Giữ, không phải bản thử:**
    `public/zbs-demo/` (ảnh nộp Zalo duyệt 6 mẫu ZBS — `docs/MAU-ZBS-MOI.md`) · `public/mau-thu-vien-phap-luat.csv` (tệp mẫu nhập liệu).
    Đã gỡ 02/11: `public/_mau-*.html`, `public/_so-sanh-tam.html`, `public/_so-sanh-the/` (chưa từng lên git).

---

## 0. NGUYÊN TẮC LÀM VIỆC (áp dụng cho mọi task — theo Andrej Karpathy)

> Bốn nguyên tắc cốt lõi: **suy nghĩ trước khi code, đơn giản trước, sửa tối thiểu, có mục tiêu đo được.**
> Áp dụng cho mọi yêu cầu trong dự án này — đặt _cẩn thận_ lên trên _nhanh_.

**1. Suy nghĩ trước khi code**
- Nói rõ giả định thay vì đoán ngầm và làm tới.
- Khi yêu cầu mơ hồ → nêu các cách hiểu khác nhau, KHÔNG tự chọn một cách rồi làm.
- Thấy cách làm đơn giản hơn → đề xuất.
- Thật sự chưa rõ → DỪNG và hỏi (đặc biệt với việc khó hoàn tác: xoá file, đổi schema, deploy).

**2. Đơn giản trước (Simplicity First)**
- Chỉ viết code giải quyết đúng vấn đề được nêu.
- Không thêm tính năng "phòng xa", không xử lý lỗi cho tình huống không thể xảy ra.
- Mục tiêu: cắt giảm 60%+ độ phức tạp thừa khi có thể.
- Tự kiểm: "Một kỹ sư senior có gọi đoạn này là over-engineer không?"

**3. Sửa tối thiểu, đúng phạm vi (Surgical Changes)**
- Chỉ động vào những gì yêu cầu đòi hỏi. Giữ nguyên style, format, comment hiện có.
- Không refactor code đang chạy tốt mà không liên quan.
- Chỉ xoá import/biến do CHÍNH thay đổi của mình làm thừa ra.
- Code chết có sẵn → **báo chứ không tự xoá** trừ khi được yêu cầu.

**4. Thực thi theo mục tiêu (Goal-Driven)**
- Trước khi làm, định nghĩa tiêu chí thành công kiểm chứng được.
- Biến yêu cầu mơ hồ ("sửa cái bug") thành mục tiêu test được.
- Việc nhiều bước → chia nhỏ, có checkpoint kiểm chứng.

**Dấu hiệu làm đúng:** ít thay đổi thừa trong diff · ít phải viết lại do over-engineer · hỏi cho rõ TRƯỚC khi code thay vì sửa sai SAU.

---

## 0.1 ⛔⛔ GIÁ · GÓI · HẠN TIN · CHÍNH SÁCH = MỘT NGUỒN DUY NHẤT LÀ ADMIN (quán triệt 03/10/2026)

> Chủ dự án: *"Tất cả mọi thứ liên quan đến giá, chính sách đều từ 1 nguồn là admin! Hết."*
> *"Không ai có quyền áp luật."*
>
> - Hạn tin = ngày đăng + số ngày của **gói** tin đó theo **Admin → Giá & quy định** (`site_content`
>   key `billing`). Tính bằng hàm hệ thống (`so_ngay_hien_thi` / `src/lib/billing.ts`) — **cấm tự viết
>   công thức, cấm hardcode ngày hay số ngày, cấm sửa tay hạn tin.**
> - Admin chưa có quy định cho trường hợp nào → **nói rõ và để chủ dự án quyết trong admin**, không tự lấp.
> - Đổi dữ liệu nhiều tin → liệt kê từng tin + số đúng theo admin → chủ duyệt → mới sửa.
> - Áp cho **MỌI thứ**: gói tin (Diamond/Gold/Silver/Basic × số ngày, giá), đẩy tin, gói đẩy nhiều
>   lượt, gói hội viên, voucher, chương trình thành viên mới và mọi chương trình sau này.
> - **Thành viên mới** xét theo `profiles.ngay_thanh_vien` (0058): tự đăng ký = ngày tạo tài khoản;
>   tài khoản tạo hộ (`tao_ho`) = ngày chính chủ vào lần đầu (trigger tự ghi).
> - **QUY TRÌNH GÓI · VIP · CHƯƠNG TRÌNH (chủ dự án duyệt 22/10/2026 — thống nhất một lần, không nói lại):**
>   Anh duyệt trong admin là chạy; đã chạy thì mọi đường phải tính như nhau.
>   - **Thành viên mới — MỘT hàm `thanhVienMoi` (`src/lib/billing.ts`)** cho mọi chương trình (miễn phí lẫn giảm giá):
>     tự đăng ký / tạo hộ đã tự vào → ngày thành viên trong from–to admin đặt + tin gửi trong số ngày đầu admin đặt;
>     tạo hộ chưa tự vào → tính như admin đăng hộ (lúc gửi tin trong from–to). Còn lại = thành viên cũ.
>   - ① Khách đăng tin, bước chọn gói: hiện ĐỦ mọi gói + mọi chương trình đang chạy; thành viên mới chọn được ưu đãi,
>     thành viên cũ vẫn thấy nhưng ô ưu đãi MỜ, không bấm được. ② Admin đăng hộ: như ①, theo luật tạo hộ.
>     ⛔ **01/11/2026 (anh):** khách chọn gói nào tính tiền gói đó theo Admin · **up = nâng gói** (trả gói mới − khấu trừ gói hiện tại, hoặc
>     chiết khấu hội viên) = đăng gói mới, MỘT hạn = ngày nâng + số ngày gói mới, hết là hết hạn (tin gói thường `plan.khuyenMai === false`)
>     · **đẩy** = gói đẩy có sẵn · **khách chọn chương trình** → áp đúng chương trình (④⑤ dưới chỉ còn áp cho tin theo chương trình).
>     ③ Duyệt: hạn = ngày duyệt + số ngày gói/chương trình; trừ đúng số tiền đã báo. ④ Nâng VIP: VIP chạy từ ngày nâng,
>     kỳ Basic chạy song song (không cộng nối). ⑤ Hết VIP: tự về Basic giữ hạn Basic còn lại (ghi `ha_vip_luc`).
>     ⑥ Hết hạn: ẩn + nhắn khách; đăng lại → chờ duyệt như tin mới. ⑦ Tự kiểm 8h: chỉ báo lỗi thật, sửa xong tự hết báo.
>   - Mọi đường đặt hạn liệt kê ở đầu `src/lib/kiemTin.ts` — thêm đường mới phải thêm vào đó.
> - **⛔⛔ TIN ĐĂNG HỘ = CẤM MỌI TIN NHẮN TỰ ĐỘNG (chủ dự án chốt 31/10/2026):** tin chủ dự án đăng hộ là tin miễn phí; tài khoản
>   hiện trên tin là của khách (tài khoản đăng hộ `tao_ho`). Khách CHƯA tự vào đăng nhập → máy KHÔNG nhắn gì (Zalo ZBS lẫn email:
>   duyệt tin, sắp/đã hết hạn, có người quan tâm, báo cáo tuần…), không báo lỗi. Chủ dự án tự nhắn khách hàng loạt qua ZBS.
>   **Khách tự vào đăng nhập** (`vao_chinh_thuc_luc`) thì mới áp dụng nhắn tự động. Chặn một chỗ: `guiThongBao` (`src/lib/thongBao.ts`);
>   đường nhắn mới phải đi qua hàm này (mã OTP đi đường riêng, không bị chặn).
- **⛔ QUY TRÌNH CHUẨN KHÁCH ĐĂNG TIN — MỘT QUY TRÌNH (chủ dự án chốt 26/10/2026, "đây là CHUẨN"):**
  ① Bấm Đăng tin → chưa đăng nhập thì đăng nhập ngay tại trang, xong ở lại form. ② Điền form; thiếu ô → kéo tới đúng ô, báo rõ.
  ③ Chọn gói: web tính số phải trả (giá admin + 8% VAT, trừ khuyến mãi, ưu đãi thành viên, chiết khấu), so với ví khả dụng.
  ④ Đủ tiền → Đăng → tạm giữ phí, tin chờ duyệt, báo "đã nhận tin". ⑤ Thiếu → bấm Đăng HOẶC "Nạp thêm" (cùng một đường) →
  tự lưu nháp KÈM GÓI + ghi chờ nạp → màn "Nạp thêm X để đăng tin" → trang Nạp tiền: đủ nút mệnh giá, KHÔNG chọn sẵn nút nào,
  số cần nộp nằm sẵn trong ô tự nhập (con trỏ trong ô, khách sửa tự do), ô "Số tiền thanh toán" chạy theo đúng số khách chọn/gõ.
  ⑥ Quay lại / huỷ PayOS → về lại tin đang đăng (còn nguyên nội dung + gói); nộp xong → Tin của tôi + "Thanh toán thành công";
  tiền vào ví → máy tự gửi tin đi duyệt đúng gói + báo khách. ⑦ Admin duyệt → trừ tiền, hoá đơn, báo khách; từ chối → nhả tạm giữ, báo.
  Mở lại tin nháp / chờ duyệt → gói đã chọn nạp lại đủ. Nạp ví bình thường (không từ gói tin) giữ nguyên: nút mệnh giá + ô tự nhập.
> - **Tự động bằng mã, không ai sửa tay**: cron `/api/tin-dang/het-han` mỗi phút (hạ tin, tự đăng
>   lại, nhắn khách, làm mới bản sao danh sách khi tin đổi từ bất kỳ đâu) · `kiemTin` 8h soát mọi tin.
> - ⛔ **21/10/2026 nhắc lại:** web còn rất nhiều câu "rất AI" (chủ đã sửa nhiều ở footer). Cấm từ nội bộ trước mặt khách
>   ("tin đăng", "người đăng", "theo các tin đang đăng"), cấm câu ghép máy, cấm số liệu vô nghĩa với người mua. Không hiểu /
>   không biết nói sao → **HỎI CHỦ DỰ ÁN TRƯỚC KHI VIẾT**; mọi câu mới phải đưa nguyên văn cho chủ duyệt trước khi push.
> - **Không ghi chú thích ngớ ngẩn / giọng AI lên web.** Toàn hệ thống phải đúng tiếng Việt chuẩn.
>   ⛔ **Muốn thêm chú thích / câu giải thích / chỉ dẫn nào: HỎI chủ dự án ghi gì TRƯỚC** — đưa nguyên
>   văn câu để duyệt, không tự viết.
> - **Giá mỗi m² của NHÀ = giá ÷ TỔNG m² SÀN do khách/tin gốc ghi thẳng.** ⛔ Cấm tự nhân (đất × tầng,
>   mỗi sàn × tầng — sàn chỉ 75–80% đất, có lửng/áp mái); không có số chính xác thì không lấy — web bỏ qua mọi số đúng bằng đất × 1 · 1,5 · 2… (`dienTichSanThat`).
>   Việc chia giá là của web; Cowork chỉ chép số, không tự chia.
> - **Lịch sử giá:** chỉ dãy của đúng khu vực + loại hình + mua bán/cho thuê của tin, đủ so cùng kỳ
>   1 năm mới hiện. Yêu cầu nhập liệu cho Cowork: `D:\Coastal Land\SEO\YEU-CAU-COWORK-LICH-SU-GIA.md` (mọi tệp cho Cowork — yêu cầu, dữ liệu vào, dữ liệu ra — chỉ nằm ở `D:\Coastal Land\SEO\`, xem `KE-HOACH-SEO.md` mục 11.0) (làm mới 03/10: cùng phân khúc + cùng vị trí, 3 bậc dự án → đường → phường — ⛔ **bỏ hẳn cả tỉnh 16/10** (số một phường/loại hình không áp cho nơi khác); đơn vị theo loại hình: đất ÷ m² đất · căn hộ ÷ m² căn · nhà, văn phòng ÷ m² sàn; theo quý như Batdongsan, đủ 5 quý liền mới hiện; ⛔ **thống nhất GIÁ MỖI M² theo loại hình cả bán lẫn thuê (thuê = tiền/tháng ÷ m², chốt 21/10 — "lấy đơn vị tổng là sai")**; web tự tính, Cowork điền phần thiếu từ nút "Tải danh sách còn thiếu").
> - Bài học 03/10: Claude tự áp luật, hạ nhầm 49 tin còn hạn — xem memory `gia-chinh-sach-mot-nguon-admin`.

---

## 0A. ✅ UP ẢNH KHI ĐĂNG TIN — ĐÃ XONG, ĐÃ CHỐT (12/09/2026)

> **VIỆC NÀY ĐÃ KẾT THÚC. ĐỪNG MỞ LẠI, ĐỪNG VIẾT LẠI.**
> Chủ dự án chốt tối 12/09/2026 sau khi tự xem trên máy: **đạt yêu cầu.**
> Bản đang chạy: commit `68e7771`, đã lên `coastalland.vn` (xác minh bằng tên gói mã).
>
> Bấm **Thêm ảnh** → bảng **bốn lối**, máy nào trình duyệt nào cũng như nhau:
> **Thư viện ảnh · Video · Thư mục · Máy ảnh** (máy tính bàn ẩn Máy ảnh).
> Chủ dự án nói rõ: *"chỉ có vậy, không cần hơn"*.
>
> **Chốt về dòng "Thư mục" (Folder):** chỉ cần ra **app quản lý tệp MẶC ĐỊNH của
> chính cái máy đó** — máy nào app nấy (Samsung ra "File của bạn", Chrome ra "Files",
> iPhone ra "Tệp" của Apple). **KHÔNG ép cứng một app cụ thể** — yêu cầu cũ "bắt buộc
> phải là File của bạn" ĐÃ ĐƯỢC THAY BẰNG CHỐT NÀY.
>
> **Chốt về Samsung Internet:** dòng "Thư viện ảnh" không ra thẳng Bộ sưu tập mà ra
> bảng "Máy ảnh · File của bạn · Files" → vào "File của bạn" chọn nhiều ảnh bình
> thường. **Chủ dự án đã xem màn hình đó và chấp nhận.** Đừng thử thêm `accept` nào nữa.
>
> **⛔ ĐỪNG THÊM LẠI `webkitdirectory`** (đã gỡ 12/9): điện thoại bỏ qua nó, còn máy
> tính thì nó biến dòng Thư mục thành chọn nguyên cả thư mục — sai chức năng.
>
> Lịch sử đầy đủ (những cách đã thử và đã hỏng): `docs/BAN-GIAO-UP-ANH-13-09.md`.

(phần bên dưới giữ làm lịch sử — viết trước khi chốt, nhiều chỗ đã bị chủ dự án bác)

> **CHỦ DỰ ÁN ĐÃ CHỐT: PHẦN CODE LÀ XONG, ĐỦ YÊU CẦU. ĐỪNG VIẾT LẠI.**
> Việc còn lại DUY NHẤT là bấm thử trên máy thật (iPhone · Samsung · Firefox/Edge/Opera
> Android). Thiếu xác nhận KHÔNG có nghĩa là thiếu code.

> **Trước khi sửa một dòng nào trong phần up ảnh: ĐỌC `docs/BAO-CAO-UP-ANH.md`,**
> nhất là **mục 5 — những cách đã thử và đã hỏng, đừng thử lại.**

**Yêu cầu (nguyên văn):** *"Up ảnh khi khách vào đăng tin, bấm up ảnh, ra ba lựa chọn gồm:
Bộ sưu tập ảnh (Thư viện), Folder, Máy ảnh. Đúng chức năng của 3 mục này, trỏ tới để khách UP.
Phù hợp và tương thích cho mọi trình duyệt trên điện thoại của khách hàng. Hết."*

- ✅ Ba lựa chọn có logo riêng, mỗi dòng gọi thẳng ô chọn tệp của mình, chọn nhiều tấm.
  Mã ở `src/components/admin/ImagePicker.tsx` (có ghi chú ⛔ tại chỗ).
- ✅ Đã lên web và **đã kiểm chứng bằng cách so tên gói mã** (xem mục 5B của báo cáo),
  không phải chỉ "đã push".
- ✅ **Đã code đủ cho mọi trình duyệt** (13/9): Android ra bảng ba lối của mình;
  iPhone/iPad ra thẳng bảng ba lối của Apple (Safari tự bung, tắt không được — xổ
  bảng mình nữa là bắt khách bấm hai bảng); máy tính hai lối (máy bàn không có máy
  ảnh cầm tay). Đã bỏ `new DataTransfer()` (Safari <14.1 văng lỗi) và xoá cả ba ô
  chọn tệp sau mỗi lần nhận ảnh.
- ⛔ **Samsung Internet: ĐÃ ĐO TRÊN BẢN ĐÚNG (13/9) — VẪN KHÔNG RA BỘ SƯU TẬP.**
  Chủ dự án chụp hai ảnh: dòng Thư viện ảnh → "Máy ảnh · File của bạn · Files";
  dòng Thư mục → "Máy ảnh · Máy quay · Files". Giả thuyết "do bản cũ bấm nhầm ô"
  **đã bị bác bằng phép đo**. Nguyên nhân: Chrome mở bộ chọn ảnh của hệ thống, còn
  Samsung Internet hỏi "app nào nhận" mà app Bộ sưu tập KHÔNG đăng ký nhận việc đó.
  **Web không có thuộc tính nào chen vào — ĐỪNG THỬ THÊM KHAI BÁO accept NÀO NỮA.**
  Khách Samsung vẫn up được: bấm "File của bạn" (Samsung My Files) có mục ảnh, chọn
  nhiều tấm bình thường — mất thêm một chạm.
- (cũ, đã bác) Samsung Internet: CHƯA KẾT LUẬN ĐƯỢC — bản đang chạy chưa ai thử.
  Sửa quan trọng nhất (`c674b79` 19:15 — mỗi dòng gọi thẳng ô của mình) **build hỏng
  nên không bao giờ lên web**; `29aa434` lúc bàn giao cũng chưa lên. Bảng "Máy ảnh ·
  File của bạn · Files" mà chủ dự án chụp là chữ ký của ô khai `accept=""` — hồi đó
  bấm dòng nào cũng rơi vào ô đó. **Việc đầu tiên: thử lại dòng "Thư viện ảnh" bằng
  Samsung Internet trên bản đang chạy.** Chưa thử thì ĐỪNG kết luận theo hướng nào.
  (Khách Samsung KHÔNG bị chặn: kể cả trường hợp xấu nhất vẫn up được qua "File của bạn".)
- ⚠️ **Luôn chạy `npx next build` cho chạy hết trước khi nói "đã lên web"** — `tsc --noEmit`
  KHÔNG bắt được lỗi JSX; đã có bản build hỏng nên không bao giờ lên, mà vẫn báo là đã lên.

## 0A1. ⛔⛔ CẤM SỬA CÁI ĐÃ DUYỆT · TUYỆT ĐỐI KHÔNG CHE CHỖ KHÁCH ĐANG THAO TÁC (quán triệt 21/10/2026)

> Chủ dự án: *"CẤM sửa cái đã duyệt. Tuyệt đối lưu ý phần bị che, khuất này! Tuyệt đối không!"*
>
> **1. Đã duyệt = cấm động vào.** Sửa thành phần DÙNG CHUNG (ô chọn `ChonCoTim`/`ChonHoacGhi`, `BanPhimAo`, form
> đăng tin, bộ lọc…) → TRƯỚC khi push liệt kê mọi chức năng đã duyệt của nó và tự bấm thử từng cái còn THẤY NGAY,
> cả PC lẫn điện thoại. Bài học 21/10: phiên 16/10 đổi ô chọn làm mất dòng "Khác — tự ghi" (chỉ hiện khi gõ tìm);
> phiên sửa lại làm ô tự ghi bật lên như khung tìm kiếm, bàn phím che.
> **2. Khách thao tác trên điện thoại (đăng tin, soạn tin, chọn, ghi, gõ bất cứ ô nào) phải THẤY NGAY mình đang bấm/gõ
> cái gì — không bị bàn phím, thanh dính, nút chat, thanh gọi hay bất cứ dòng nào che, không bị đẩy khuất, không phải
> kéo lên kéo xuống mới thấy.** Áp mọi trình duyệt VÀ trình duyệt trong Zalo/Facebook/Messenger.
> - Do chung một chỗ: `src/components/BanPhimAo.tsx` (tự đo mọi thanh dính trên đầu + bàn phím, đưa ô vào vùng nhìn thấy).
> - "Khác — tự ghi" = dòng cuối bảng chọn; chọn xong bảng đóng, ô ghi hiện NGAY DƯỚI ô chọn trong form — KHÔNG mở
>   kiểu khung tìm toàn màn hình.
> - Đo bắt buộc trước khi push khi đụng form/ô gõ/bảng chọn: `node --experimental-websocket scripts/do-o-bi-che.mjs
>   http://localhost:3000/<trang>` (kiểu Zalo) và thêm ` 470` (kiểu Android co màn hình) — phải "BI CHE: 0".
>   21/10 đo /dang-tin: 0/10 cả hai kiểu. iPhone Safari thật vẫn phải bấm thử trên máy thật.

## 0B. QUY TRÌNH BẮT BUỘC — đọc `QUY-TRINH-LAM-VIEC.md`

> 📌 **File chi tiết: [`QUY-TRINH-LAM-VIEC.md`](QUY-TRINH-LAM-VIEC.md) — PHẢI đọc và tuân thủ.**

**QUY TRÌNH DỮ LIỆU 3 BÊN (Cowork · chủ dự án · Claude) — MỘT TỆP DUY NHẤT:** `D:\Coastal Land\SEO\Plan SEO - pSEO\KE-HOACH-SEO.md` mục 11 (gom từ `CONG-VIEC-3-BEN.md` 28/10/2026 — xem mục 0D1).
Hai quy trình: ① tin đăng hằng ngày · ② dữ liệu khác hằng tuần. Mọi tệp Cowork chỉ ở `D:\Coastal Land\SEO\`: việc máy giao `RA\VIEC.md` · Cowork giao `DA-DUYET\<ddmmyyyy>\` (bảng nơi lưu mục 11.0; không dùng `VAO`, `Đăng tin\TIN HANG NGAY chuẩn` nữa). Muốn đổi quy trình → sửa thẳng mục 11 tệp đó, không tạo tệp quy trình mới.

**Nguyên tắc 1 — ĐÃ DUYỆT LÀ KHÔNG ĐỘNG VÀO.**
Phần nào chủ dự án đã xem và duyệt thì GIỮ NGUYÊN 100%. Không tự ý chỉnh kích thước, màu,
bố cục, khoảng cách, hiệu ứng; không "tiện tay" refactor. **Chỉ đổi khi được yêu cầu rõ ràng.**
Buộc phải đụng vào vì lý do kỹ thuật → **DỪNG, HỎI TRƯỚC.**

**Nguyên tắc 2 — MỘT LẦN CHO XONG.** Mỗi yêu cầu đi trọn 4 bước trong một lượt:

| 1. SỬA | 2. KIỂM TRA | 3. DUYỆT | 4. PUSH |
|---|---|---|---|
| Claude sửa **thẳng trong** `Projects\cvr-website` (KHÔNG worktree) | **Claude tự** xác minh thay đổi đã lên + xác định **đúng cổng**, rồi mới báo link | Chủ dự án xem, trả lời "OK" / "chỉnh [gì]" | Chỉ khi nghe **"Push"** → `git add -A` + commit + `git push origin main` |

**Ba cái bẫy đã từng làm mất rất nhiều thời gian:**
1. **Nhiều dev server cùng chạy** (3000 + 3001) → chủ dự án xem nhầm bản cũ, sửa 5 lần vẫn thấy y nguyên.
   → Chỉ chạy MỘT server; Claude phải tự xác định cổng nào chạy từ thư mục chính.
2. **Làm trong worktree** → thiếu `.env.local`, chủ dự án không thấy thay đổi. → Luôn đồng bộ về thư mục chính.
3. **Nội dung admin (Supabase) đè lên mặc định trong code** → đổi ảnh/chữ trong code sẽ KHÔNG hiện.
   → Muốn đổi thật phải sửa trong `/admin/noi-dung`.

---

## 0C. 🔧 VIỆC HẠ TẦNG — Vercel Pro · Cloudflare R2

> ✅ **TRẠNG THÁI 24/09/2026 (đã đo trên web thật):** **Vercel Pro ĐÃ CHẠY từ 14/09** ·
> **PayOS ĐÃ NỐI XONG** (`/api/thanh-toan/webhook` trả `daCauHinh:true`) · Supabase Pro từ 17/09.
> Ba việc này **đã xong — cấm đưa lại vào danh sách "đang chặn"**. Chủ dự án chốt:
> *"Cái gì đã xong, cấm thay đổi. Chỉ thay đổi khi tôi yêu cầu."* Muốn ghi việc gì là "đang kẹt"
> thì phải đo lại trên web thật trước — ghi chú cũ không phải bằng chứng.
> (Phần dưới giữ làm lịch sử của kế hoạch.)

> **Kế hoạch đầy đủ + bảng theo dõi từng bước: [`docs/KE-HOACH-HA-TANG.md`](docs/KE-HOACH-HA-TANG.md).**
> Mở phiên mới là **đọc file đó trước**, xem đang dừng ở bước nào rồi làm tiếp — **KHÔNG bắt
> chủ dự án kể lại từ đầu**, mọi thứ đã chốt nằm hết trong đó.
>
> **Thứ tự đã chốt, không đảo:** xử lý thẻ → mua **Vercel Pro** → tạo **Cloudflare R2** →
> Claude chuyển 903 ảnh sang R2 → *(sau, lúc rảnh)* chuyển DNS sang Cloudflare.
>
> **Hai lý do bắt buộc lên Pro:** ① Hobby ghi rõ "non-commercial" mà web có ĐKKD + bán gói tin;
> ② Fluid Active CPU gói Hobby chỉ **4 giờ/tháng**, vượt là Vercel **tự động tạm dừng dự án** —
> web cũ vẫn chạy nhưng **bản mới không lên được**.
>
> **R2 cứu cả hai nhà cung cấp cùng lúc:** Supabase hết bị tính băng thông (đang bị doạ khoá
> **08/10/2026** vì vượt egress 5 GB/tháng) và Vercel hết phải chạy hàm đọc ảnh `/anh/`.
>
> **Phạm vi sửa code, không hơn:** R2 = đúng 1 file `src/app/anh/[...duong]/route.ts` + 1 script
> chuyển ảnh · Vercel Pro = KHÔNG sửa gì · Supabase = KHÔNG sửa gì.
>
> ⛔ **Khoá bí mật** (`token.txt`, `vercel-token.txt`, `khoa-r2.txt`) nằm trong thư mục dự án và
> **đã chặn khỏi git** — đừng bao giờ dán nội dung chúng vào chat hay commit.

---

## 0C1. 💵 VERCEL PHẢI NẰM TRONG GÓI PRO $20/THÁNG (chốt 15/10/2026)

> ⛔ **MỌI GÓI DỊCH VỤ — không phát sinh ngoài phí tháng (chủ dự án quán triệt 17/10/2026):**
> Vercel Pro · Supabase Pro · Resend · Cloudflare R2 · Zalo ZBS · Google… chỉ trả đúng phí gói. Trước mỗi
> thay đổi đụng tới máy chủ, cơ sở dữ liệu, ảnh/video, cron, email, tin nhắn: tính "mỗi tháng chạy bao
> nhiêu lần, tốn gì, có vượt hạn mức gói không" → ghi vào chú thích mã. Cài đặt và cách làm phải tối ưu
> sẵn để tránh phát sinh (bộ nhớ đệm, gom việc, một lần push mỗi đợt). Không chắc → hỏi trước khi làm.

> 🎯 **Mục tiêu chủ dự án:** mỗi tháng chỉ trả đúng **$20** gói Pro — mọi mức dùng phải nằm gọn trong
> **$20 tín dụng có sẵn** của gói. **Không phát sinh khoản vô lý nào.** Khách xem tin vẫn đếm lượt
> như bình thường và **không được ảnh hưởng gì đến chi phí Vercel.**
>
> ✅ **Đã sửa 15/10 (đừng làm hỏng lại):** 0063 lượt xem không đổi `updated_at` · ảnh `/anh/` có
> `CDN-Cache-Control` 1 năm · cache tin 60s → 1 giờ (cron mỗi phút bắt thay đổi + tin hẹn giờ) ·
> `vercel.json` `ignoreCommand` bỏ build khi chỉ đổi `.md`/`docs`/`supabase` · tắt On-Demand
> Concurrent Builds · ngân sách cảnh báo $15 (Pause tắt).

> Kỳ 14/9–14/10 trả **$46,37** (vượt $26,37): ISR Writes $17,99 · Fast Origin Transfer $13,41 ·
> Build CPU $8,09. Gốc: đếm lượt xem đổi `listings.updated_at` → cron `het-han` mỗi phút xoá cache
> mọi trang → dựng lại liên tục (sửa bằng migration 0063).
> Đã cài: **Spend Management $15, Pause TẮT** (email ở 50/75/100%) — cấm đổi khi chủ chưa duyệt.
>
> **Mọi phiên, trước khi push, tự kiểm:**
> - `revalidateTag` chỉ khi có thay đổi THẬT; đếm/thống kê không được đổi `updated_at` hay xoá cache.
> - Không thêm cron dày (< 1 giờ) hay xoá cache trong cron khi chưa tính chi phí + hỏi chủ.
> - Trang công khai không thêm `force-dynamic` / `revalidate` ngắn.
> - Ảnh/video không thêm đường đi qua hàm máy chủ.
> - Gom việc, push một lần (mỗi build tốn Build CPU).
> - Đổi cache/cron/route xong → đo lại trang Usage sau 1–2 ngày (Claude in Chrome).
>
> **Vì sao phát sinh (quán triệt):** mỗi khoản tiền = một thói quen làm việc sai.
> | Khoản | Gốc ở cách làm |
> |---|---|
> | ISR Writes $17,99 | Thêm cron mỗi phút + xoá cache theo `updated_at` mà không kiểm cái gì làm đổi `updated_at` (lượt xem) |
> | Fast Origin Transfer $13,41 | Trang bị dựng lại liên tục + ảnh đi qua hàm `/anh/` |
> | Build CPU $8,09 | 247 commit/tháng (03/10: 46), push từng sửa nhỏ, mỗi lần push là một lần build |
>
> ⛔ **LUẬT CHỐT — TRÁNH LÝ DO VÔ LÝ "KHÁCH XEM TIN LÀM PHÁT SINH TIỀN":**
> Lượt xem / hiển thị / bấm / thống kê **không bao giờ được làm trang dựng lại.** Số liệu thống kê
> ghi vào **bảng riêng** (`listing_view_daily`, `listing_impression_daily`…), không thêm cột đếm mới
> vào `listings`. Cột `view_count` có sẵn chỉ được cộng qua `increment_listing_view` (có cờ
> `app.dem_luot_xem`, 0063 giữ nguyên `updated_at`). Bộ nhớ đệm chỉ được xoá khi **nội dung tin đổi
> thật** (duyệt, sửa, đẩy, hết hạn). Đã rà 15/10: chỉ `increment_listing_view` từng ghi vào `listings`.
>
> **Cách làm việc tối ưu:** sửa → kiểm ở máy (`npx next build`) → gom MỘT lần push mỗi đợt việc
> (không push từng sửa nhỏ, không commit "Trigger deployment"); trước khi thêm cron / xoá cache /
> route máy chủ phải trả lời "mỗi tháng chạy bao nhiêu lần, mỗi lần tốn gì" rồi mới làm.

---

## 0C2. ⚡ TỐC ĐỘ WEB TRÊN ĐIỆN THOẠI — CHUẨN BẮT BUỘC (quán triệt 22/10/2026)

> Chủ dự án: *"Web load đạt chuẩn mà không ảnh hưởng gì đến Google, SEO."* Chuẩn = **LCP ≤ 2,5 s** trên điện thoại.
> Đo phần DO WEB (máy chậm 4×, mạng thật) — không viện lý do đường truyền hay Vercel. Lịch sử + số đo: memory `toc-do-web-lam-tiep`.
>
> **Đã sửa 21–22/10 (6e5d622 · 12c72cc · 76263d7 · 0cfd95e) — CẤM làm hỏng lại:**
> | Lỗi đã gặp (làm chậm) | Thói quen gây ra | Luật |
> |---|---|---|
> | `loading.tsx` ở trang công khai che nội dung thật tới khi đọc hết HTML (LCP /mua-ban 8 s) | Thêm khung chờ cho "mượt" | ⛔ Không thêm `loading.tsx` cho trang công khai đã dựng sẵn |
> | Hiệu ứng mờ dần lúc mở trang (`anim-ket-qua`) làm ảnh đầu trễ ~2,5 s | Thêm hiệu ứng không đo | ⛔ Không hiệu ứng ẩn/mờ nội dung lúc MỞ trang; chỉ chạy khi khách thao tác |
> | Menu điện thoại đóng (`invisible opacity-0`) làm Next tải trước ~13 trang | Ẩn bằng độ mờ thay vì không dựng | Phần ẩn chứa nhiều link → chỉ dựng khi mở |
> | Supabase 58 KB, bản đồ 440 KB, địa danh 90 KB, bộ xem ảnh tải ngay lúc mở trang | Nhập thẳng thư viện vào thành phần có ở mọi trang | Thứ chỉ dùng khi bấm → `dynamic()` / tải lúc bấm; đọc/ghi đơn giản → `docRest`/`rpcRest` (`src/lib/supabase/nap.ts`) |
> | 6 bộ phông tải trước, tệp latin-ext 85 KB thừa | Thêm phông cho một chỗ | Inter tự chứa `src/app/fonts`; phông phụ `preload: false` |
> | Ảnh đầu trang không ưu tiên | Quên `fetchPriority` | Ảnh đầu (LCP) luôn `fetchPriority="high"` |
>
> **Đã thử và BỎ:** nhúng CSS vào HTML (`experimental.inlineCss`) — đo A/B 22/10 bằng Lighthouse: CHẬM HƠN (HTML nặng). Đừng bật lại.
>
> **Quy trình bắt buộc mỗi đợt sửa đụng giao diện (bước 2 KIỂM TRA, trước khi push):**
> 1. Đo TRƯỚC và SAU 5 trang mẫu: trang chủ · /mua-ban · /cho-thue · /mua-ban/condotel/da-nang · một trang /bat-dong-san/<id>.
>    Công cụ: `node --experimental-websocket scripts/do-toc-do.mjs <url> 2` và Lighthouse (`npx lighthouse <url> --only-categories=performance`).
>    LCP vượt 2,5 s hoặc điểm tụt so với trước → KHÔNG push, sửa tiếp.
> 2. Thêm thành phần mới, tự hỏi 3 câu: (a) có cần ngay lúc mở trang không — không thì tải lúc bấm; (b) kéo theo thư viện gì, bao
>    nhiêu KB; (c) có hiệu ứng nào làm nội dung chậm hiện lúc mở trang không.
> 3. Ghi một dòng số đo 5 trang vào memory `toc-do-web-lam-tiep` sau mỗi lần push.
> 4. Không đổi giao diện đã duyệt, không đổi nội dung cho Google (tiêu đề, H1, canonical, số tin, JSON-LD) — so trước/sau mỗi đợt.

---

## 0D. 📈 GOOGLE ADS + SEO — topic riêng, theo dõi lâu dài

> **Bảng theo dõi đầy đủ: [`docs/KE-HOACH-GOOGLE-ADS-SEO.md`](docs/KE-HOACH-GOOGLE-ADS-SEO.md).**
> Mở phiên mới là **đọc file đó trước**, xem đang dừng ở bước nào rồi làm tiếp — đừng bắt
> chủ dự án kể lại. Làm xong bước nào thì **sửa bảng trong file đó ngay**.
>
> Mở 17/09/2026. Bối cảnh: web chạy thử 1 tháng rồi thương mại hoá; **bán được gói tin hay
> không phụ thuộc có TRAFFIC hay không**, nên Google Ads + SEO đi cùng nhau, không tách rời.
>
> Tài khoản Ads **334-211-0750 Coastal Land** · thẻ Google **AW-18365884419**.
> Ba việc đang chặn: ① chiến dịch bị Google khoá vì chuyển đổi "định cấu hình sai";
> ② trang danh mục (`/mua-ban`, `/cho-thue`, `/mua-ban/<khu-vực>`) **HTML máy chủ không có
> chữ** (khách xem vẫn bình thường — chỉ Google đọc chậm, và giá mỗi lượt bấm đắt lên);
> ③ ngân sách 5.000 đ/ngày không mua nổi một lượt bấm.
>
> ✅ **Nghi vấn "/mua-ban trắng" của phiên 17/9 ĐÃ GIẢI (18/9): KHÔNG CÓ LỖI** — phép đo cũ
> chạy trên thẻ trình duyệt chưa hiển thị nên chỉ thấy khung chờ. Kết luận "trang trắng"
> phải chứng minh bằng ẢNH CHỤP, không bằng `querySelector`.

---

## 0D0. ☁️ "TIẾP NỐI VIỆC CLAUDE CLOUD" — CLAUDE TRÊN MÁY LÀM NGAY, KHÔNG HỎI LẠI (chủ dự án chốt 28/10/2026)

> Phiên Claude trên cloud không ghi được ổ D:, không chạy được web với dữ liệu thật, không đẩy được `main` → việc làm dở được để ở NHÁNH
> GitHub và ghi ở đây. Anh nhắn **"tiếp nối việc Claude cloud"** (hoặc "làm tiếp việc cloud") → Claude trên máy:
> 1. `git fetch origin` → nhánh cloud đang mở: **`claude/clever-bardeen-15e4ot`** (cloud đổi nhánh thì sửa dòng này).
> 2. Đọc trên nhánh đó: `git show origin/claude/clever-bardeen-15e4ot:CLAUDE.md` mục 0D1 việc **⑦ ⑧** + luật 6, và
>    `BAN-GIAO-DO-TOC-DO-27-10.md` mục **TIẾN ĐỘ** (đang dừng ở đâu) → làm tiếp từ đó, không làm lại.
> 3. Thứ tự: ⓪ sửa Vercel (nếu chưa) → ⑦ đo + bấm thử nhánh → ⑧ thương hiệu (chép vào `KE-HOACH-SEO.md`) → báo anh số trước/sau.
> 4. Sau mỗi bước: cập nhật mục TIẾN ĐỘ + commit lên nhánh (gom, không đẩy lắt nhắt). Hết usage giữa chừng → lần sau đọc TIẾN ĐỘ làm tiếp.
> 5. Anh nhắn **"Push"** → `git merge --no-ff origin/claude/clever-bardeen-15e4ot` vào `main` → `npx next build` → push `main` MỘT LẦN →
>    kiểm web thật đã lên. Không đổi giao diện, bố cục; trang đang top (`TRANG_TOP`) không đụng.
>
> **DANH SÁCH VIỆC CLOUD CHƯA LÀM / KHÔNG LÀM ĐƯỢC — Claude trên máy làm hết, xong việc nào ghi ✅ + ngày vào đây:**
> - [x] ✅ 29/10 (e8929bb, chưa push) **Vercel chỉ dựng nhánh `main`** (gộp vào việc ⓪ sửa Vercel): thêm vào đầu `ignoreCommand` trong `vercel.json`:
>       `[ "$VERCEL_GIT_COMMIT_REF" != "main" ] && exit 0;` → mọi nhánh khác (nhánh cloud, nhánh thử) không dựng, không tốn Build CPU.
>       Phiên cloud 27–28/10 đã đẩy nhánh ~20 lần → có thể đã tạo ~15 bản xem thử; xem Vercel → Deployments, báo anh nếu tốn.
> - [x] ✅ 29/10 trang chủ 446 KB; lần mở 2 LCP ≤ 2,5 s cả 5 trang mẫu (lần đầu như 27/10); do-o-bi-che /dang-tin CHƯA (cần tài khoản thử) **Đo tốc độ trước/sau** mọi trang ở mục 2 `BAN-GIAO-DO-TOC-DO-27-10.md` (HTML trang chủ < 450 KB · LCP ≤ 2,5 s · INP ≤ 200 ms ·
>       CLS ≤ 0,1) + `do-o-bi-che` /dang-tin = 0. Trang còn chậm → tìm nguyên nhân, sửa KHÔNG đổi giao diện.
> - [ ] **Bấm thử** mục 3 tệp đó (PC + điện thoại), có đăng nhập: ô tìm trang chủ, đăng tin trọn quy trình, tài khoản, admin, form báo giá.
> - [~] 29/10 đã kiểm HTML trên máy: đủ ItemList, BreadcrumbList, Organization, /llms.txt 200; Rich Results Test làm sau push **Kiểm dữ liệu cho Google** bằng Rich Results Test (search.google.com/test/rich-results) trên localhost qua đường hầm hoặc sau push:
>       /mua-ban/can-ho-chung-cu (ItemList) · /cho-thue (BreadcrumbList) · một /du-an/<slug> · trang chủ (Organization: logo PNG,
>       disambiguatingDescription, alternateName) · mở /llms.txt.
> - [x] ✅ 31/10 đã push cfda3d7 (90 commit), web thật khớp bản đã kiểm **Push MỘT lần** khi anh nhắn "Push" (bước 5 trên) → kiểm web thật.
> - [ ] **Sau push:** Search Console → Kiểm tra URL → Yêu cầu lập chỉ mục cho trang chủ, /cho-thue, 2–3 trang /mua-ban/<loại>;
>       đánh dấu ✅ 20 dòng nhóm A (trang tính On-page) trong `HE-THONG-TU-KHOA.xlsx` ở ổ D:.
> - [x] ✅ 31/10 đã có trên web (sameAs maps.google.com/?cid=4963426532946079372, phiên SEO kiểm) **Link hồ sơ Google Doanh nghiệp**: anh gửi → thêm vào `sameAs` trong `src/components/SiteJsonLd.tsx` (gộp đợt push sau).
> - [ ] **Thương hiệu ngoài web** (việc ⑧): soạn sẵn cho anh/Cowork — chữ giới thiệu thống nhất cho Facebook, Zalo OA, YouTube (tên
>       "COASTAL LAND" + coastalland.vn + "Cổng thông tin mua bán, cho thuê nhà đất"); bộ thông tin tạo mục Wikidata (tên, web, mã số
>       0402353502, địa chỉ, ngày thành lập 17/08/2026, mạng xã hội); danh sách danh bạ doanh nghiệp nên đăng. Chữ mới → đưa anh duyệt.
> - [ ] **Đo thương hiệu mỗi thứ Hai**: tra "coastal land", "coastalland", "costalland", "costal land", "coastal land đà nẵng" → chụp
>       khung AI + hồ sơ bên phải → ghi nhật ký `KE-HOACH-SEO.md`.
> - [ ] **Kế hoạch từ khoá**: nhóm B (102 việc chữ/giao diện) chờ anh duyệt B1–B3 · nhóm C (số lạ trong tin) giao Cowork — theo 0D1 ⑥.
> - [ ] **Ứng viên làm nhẹ thêm** (đo rồi mới tính): danh sách mã "tin tương tự" ở /bat-dong-san/<id> (mục 4 tệp bàn giao).

---

## 0D1. 🔑 HỆ THỐNG LÀM VIỆC HẰNG NGÀY + KẾ HOẠCH TỪ KHOÁ (chủ dự án chốt 28/10/2026 — đơn giản, thống nhất)

> ⛔ **[31/10] Thứ tự một ngày + ai làm gì: CHỈ theo `chi-tiet\quy-trinh-3-ben.md` mục 11.00 (nguồn duy nhất, mục "⭐ QUY TRÌNH HẰNG NGÀY" đầu tệp này). Phần dưới (bước 0 + 6 bước, "Bắt đầu" = Claude làm, việc dở 28/10, luật từ khoá) là lịch sử + luật từ khoá; chỗ nào khác 11.00 thì bỏ. Luật từ khoá 1–8 vẫn dùng.**

> **MỘT CHỖ:** `D:\Coastal Land\SEO\Plan SEO - pSEO\` — `KE-HOACH-SEO.md` (chủ dự án xem, sửa, giao việc) · `chi-tiet\` (phần đầy đủ, Claude
> đọc) · `TRA-GOOGLE.csv` · `HE-THONG-TU-KHOA.xlsx` · `may-tu-khoa\` · sơ đồ `QUY-TRINH-LAM-VIEC-HANG-NGAY.html`. Không bên nào làm việc từ chỗ khác.
>
> ⛔ **[ĐÃ THAY 31/10 bằng `chi-tiet\quy-trinh-3-ben.md` mục 11.00 — đoạn dưới chỉ là lịch sử]** **MỖI NGÀY — BƯỚC 0 + 6 BƯỚC (chỉnh 29/10):** ⓪ Anh mở máy làm TRƯỚC TIÊN: `Plan SEO - pSEO\CAN-ANH-DUYET.md` (tệp riêng), ghi quyết định ·
> ① Anh: khi cần sửa `KE-HOACH-SEO.md`, lưu → nhắn Claude trên máy **"Bắt đầu"** (Claude làm NGAY các dòng anh vừa quyết ở ⓪, ghi vào
> `chi-tiet\yeu-cau-chu-du-an.md`, chuyển xuống "Đã xử lý") · ② Claude: ĐO TRƯỚC (Search Console + tra Google 3 từ khoá) rồi mới giao → `SEO\RA\VIEC.md`
> · ③ Anh: duyệt `VIEC.md` → nhắn Cowork · ④ Cowork: chỉ làm việc trong `VIEC.md` → lưu `SEO\DA-DUYET\<ddmmyyyy>\` · ⑤ Anh nhắn Claude **"Kiểm"** → Anh + Claude: kiểm →
> lên web (anh tự đưa tin, ảnh, video, bài viết, mạng xã hội · Claude chỉ sửa mã web, lên khi anh nhắn **"Push"**) · ⑥ Claude: báo cáo anh, ghi nhật ký.
> Anh là người bắt đầu: trước "Bắt đầu" không bên nào tự chạy. Ai làm gì tự kiểm việc đó.
>
> **"BẮT ĐẦU" = CLAUDE LÀM, KHÔNG HỎI LẠI:** `git pull --ff-only origin main` → đọc `KE-HOACH-SEO.md` → **còn khối VIỆC DỞ DANG dưới đây thì làm nó trước** → **kế hoạch từ khoá trước mọi việc khác**
> (đo #14 → dựng lại hệ thống từ khoá → giao tin theo nhóm #2 → sửa gốc #30 khi anh duyệt → xin index #4) → `node scripts/viec-du-lieu.mjs`
> → viết mục 0 `VIEC.md` → làm việc có Ai = Claude → báo anh ngắn. Mọi điều chỉnh từ khoá đến 28/10 đã nằm trong kế hoạch bản 3 + 5 luật dưới —
> làm tiếp từ đó, **không bắt anh nói lại, không làm lại từ đầu, anh không phải nhớ bước.** Nhắn "Bắt đầu" = anh đã duyệt tệp như đang có.
>
> **GIỮ GỌN:** đầu `KE-HOACH-SEO.md` chỉ một màn hình — ⭐ quy trình · ✍ ANH CẦN DUYỆT (mỗi việc 1 dòng, anh ghi `→ DUYỆT: …`) · 📋 việc đang
> làm (mỗi việc 1 dòng) · 🔑 tóm tắt từ khoá. Mỗi lần "Bắt đầu": việc đã ✅ + nhật ký cũ hơn 7 ngày → `SEO\_cu\KE-HOACH-SEO-LUU-TRU.md` (không xoá).
>
> **VIỆC DỞ DANG 28/10 — CLAUDE TRÊN MÁY LÀM TIẾP THEO ĐÚNG THỨ TỰ, LÀM TRƯỚC MỌI VIỆC KHÁC** (chủ dự án: "đừng để vô ích yêu cầu cả ngày
> hôm nay"; chi tiết thêm ở khối 📌 đầu `KE-HOACH-SEO.md`). Xong việc nào ghi ✅ + ngày vào đây; hết danh sách thì xoá khối này.
> - ⓪ ✅ 29/10 đã sửa trên máy (e8929bb), chờ "Push" **SỬA VERCEL** (7+ bản production ERROR ở bước "ignore", lỗi 128 `fatal: bad object b241623…` — lần dựng tốt gần nhất không có trong bản
>   sao nông; web vẫn chạy bản cũ nhưng **mọi lần sửa web sẽ không lên** tới khi sửa). `vercel.json` thay `ignoreCommand` bằng:
>   `if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA^{commit}" 2>/dev/null; then git diff --quiet
>   "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . ":(exclude)*.md" ":(exclude)docs" ":(exclude)supabase"; else exit 1; fi` (đã thử đủ 4 trường hợp
>   trên cloud) → commit, push main (chủ dự án đã cho phép việc này; phiên cloud bị hệ thống chặn đẩy) → xem bản mới trên Vercel READY, mở web → báo.
> - ① ✅ 29/10 anh duyệt, đã thay (bản cũ `may-tu-khoasao-luu`; việc cần anh: tệp riêng `CAN-ANH-DUYET.md`) **TÁCH TỆP 2 TẦNG** ("một tệp rất dài, lộn xộn, không quản lý nổi"): sao lưu vào `may-tu-khoa\sao-luu\` → tầng 1 `KE-HOACH-SEO.md` một màn
>   hình (⭐ quy trình · ✍ ANH CẦN DUYỆT · 📋 việc đang làm, mỗi việc 1 dòng, giữ tiêu đề có "VIỆC THEO THỨ TỰ" và khung `| # | Việc | Ai |
>   Trạng thái |` · 🔑 tóm tắt từ khoá) · tầng 2 `chi-tiet\`: `tu-khoa.md` (mục 5) · `viec-chi-tiet.md` (mục 3 đủ) · `yeu-cau-chu-du-an.md`
>   (mục 0 + 0b) · `quy-trinh-3-ben.md` (mục 11) · `mang-xa-hoi.md` (mục 12) · `nhat-ky.md` (mục 9) · `con-lai.md` (phần còn lại) → soát không mất
>   dòng nào → sửa `scripts/viec-du-lieu.mjs` đọc mục 0, 0b từ `chi-tiet\yeu-cau-chu-du-an.md`, chạy thử → **anh duyệt tầng 1 rồi mới thay**.
> - ② **✍ ANH CẦN DUYỆT** — đưa vào khối ✍ đầu tệp, mỗi việc 1 dòng + phương án: B1 tiêu đề bán căn hộ (P1 "Bán căn hộ Đà Nẵng tháng 10/2026",
>   áp/ trừ 2 trang đã lên · P2 giữ "Bán căn hộ chung cư…") · B2 trang thuê căn hộ ĐN thêm "(quận … cũ)" sau tên phường: có/không · B3 dòng giá
>   (P1 giữ chữ, tính khoảng phổ biến · P2 thêm chữ "phổ biến") · mở trang phòng trọ, trang trại – nghỉ dưỡng, kho xưởng: có/để sau/không · số tin
>   Cowork làm mỗi ngày (đang tính ~15) · xoá tệp tải thừa trong Downloads (`Gom-mot-tep-28-10.zip` ×2, `Plan-SEO-pSEO.zip`): có/không.
> - ③ **#52**: lượt tự chạy lúc mở máy (6:30, 9:11) chuyển sang chạy theo lệnh "Bắt đầu" · Claude tự kiểm khi thư mục giao hôm nay có `bao-cao.txt`
>   rồi báo anh. Cowork KHÔNG tự chạy — anh nhắn Cowork (đã chốt).
> - ④ **#53 DỌN THƯ MỤC** `D:\Coastal Land\SEO`: đối chiếu ổ D: thật với bảng nơi lưu (mục 11.0) → lập bảng "tệp → chuyển đi đâu" → anh duyệt →
>   chuyển (không xoá; thứ không dùng vào `_cu\`). Đã thấy: `Plan SEO - pSEO` còn ảnh, sơ đồ giao diện chưa có chỗ (`BO-LOC-…`,
>   `MAU-BO-LOC-GAN-DAU-TRANG`, `SO-DO-TRANG-CHU`).
> - ⑤ **SƠ ĐỒ QUY TRÌNH** `Plan SEO - pSEO\QUY-TRINH-LAM-VIEC-HANG-NGAY.html`: anh đã tải về Downloads, có thể đã chép sang — kiểm; chưa có thì chép
>   từ Downloads hoặc dựng theo mẫu https://claude.ai/artifact/W5VaB1rXzFqS3wY9uzVEKN.
> - ⑥ **KẾ HOẠCH TỪ KHOÁ** (ưu tiên số 1 từ đây mỗi ngày): đo #14 → dựng lại hệ thống từ khoá → giao tin theo nhóm #2 → sửa gốc #30 khi anh duyệt ②
>   → xin index #4. Chữ mới lên web: đưa anh nguyên văn trước.
> - ⑦ **NHÁNH `claude/clever-bardeen-15e4ot` (phiên cloud 27–28/10) — LÀM SAU ⓪, GỘP MAIN + PUSH MỘT LẦN khi anh nhắn "Push":**
>   làm nhẹ tải trang (trang chủ < 450 KB, /dang-tin, /tai-khoan, biểu tượng, ảnh…) + **On-page nhóm A** của `HE-THONG-TU-KHOA.xlsx`
>   (đã làm trong nhánh, commit 754a9b7: ItemList 11 trang loại hình cả nước · BreadcrumbList /cho-thue + 8 trang chi tiết dự án; trang
>   khoá bỏ qua). Không đổi chữ, giao diện. Việc của Claude trên máy: `git fetch origin claude/clever-bardeen-15e4ot` → đọc
>   `BAN-GIAO-DO-TOC-DO-27-10.md` trên nhánh (mục TIẾN ĐỘ = đang dừng ở đâu) → đo trước/sau + bấm thử theo tệp đó → kiểm thêm ItemList /
>   BreadcrumbList bằng Rich Results Test trên 2–3 trang → báo anh → anh "Push" → `git merge --no-ff` vào main, push MỘT lần → đánh dấu
>   20 dòng nhóm A trong trang tính On-page là ✅ (ổ D:). Phiên cloud không ghi được ổ D: và không đẩy được main.
> - ⑧ **THƯƠNG HIỆU "COASTAL LAND" TRÊN GOOGLE** (chủ dự án 28/10: gõ "coastal land" → web đứng đầu + có hồ sơ doanh nghiệp, nhưng khung AI
>   trả nghĩa từ điển "đất ven biển"). Chép việc này vào `KE-HOACH-SEO.md` (📋 việc đang làm + chi tiết ở `chi-tiet\`). Gồm:
>   · Mã (đã làm trong nhánh): `SiteJsonLd` logo PNG vuông `/logo/app-icon-1024.png` (Google không nhận
>     SVG) + `disambiguatingDescription`: "COASTAL LAND: Cổng thông tin mua bán, cho thuê nhà đất" (anh đã duyệt 28/10).
>     + `alternateName` đủ cách gõ: Coastal Land, Coastalland, coastalland.vn, Costalland, Costal Land (hoa/thường, đậm/nhạt Google tự coi
>     như nhau — chỉ cần khai cách gõ sai/viết liền). Khách hay gõ kiểu sai nào khác → thêm vào cả `SiteJsonLd` lẫn `llms.txt`.
>   · `public/llms.txt` (anh duyệt 28/10): giới thiệu web cho mọi AI (ChatGPT, Perplexity, Claude, Gemini) — tên + cách gõ khác
>     (Coastalland, Costalland, Costal Land), câu thương hiệu, mã số, địa chỉ, trang chính, kênh chính thức. Đổi địa chỉ/kênh → sửa cả tệp này.
>   · Anh gửi link hồ sơ Google Doanh nghiệp (Maps → Chia sẻ → Sao chép link) → thêm vào `sameAs` của `SiteJsonLd`, gộp cùng đợt push.
>   · Ngoài web (anh / Cowork): cùng một tên "COASTAL LAND" + link coastalland.vn + mô tả "cổng thông tin mua bán, cho thuê nhà đất" ở
>     Facebook, Zalo OA, YouTube, hồ sơ Google; tạo mục Wikidata cho công ty (tên, web, mã số thuế, địa chỉ, mạng xã hội); đăng tên ở các
>     danh bạ doanh nghiệp / báo uy tín có link về web — Google hiểu "thực thể" nhờ nhiều nguồn khớp nhau.
>   · Đo mỗi tuần (thứ Hai): tra "coastal land", "coastalland", "costalland", "costal land", "coastal land đà nẵng" → chụp khung AI + hồ sơ bên phải → ghi nhật ký.
>
> **LƯU Ở ĐÂU (không xoá gì; bảng đủ: `chi-tiet\quy-trinh-3-ben.md` 11.0, dọn xong 29/10):** `Plan SEO - pSEO\` kế hoạch một màn hình + `CAN-ANH-DUYET.md` + `chi-tiet\` + `nguon\` (tư liệu gốc) + `giao-dien\` (làm sau SEO) ·
> `SEO\RA\` máy viết (`VIEC.md`, anh chỉ sửa mục 0) · `SEO\DA-DUYET\<ddmmyyyy>\` Cowork giao · `SEO\MAU\` mẫu (+ `dot-tin-mau-24-10\`, `mxh\`) ·
> `SEO\` gốc: `YEU-CAU-COWORK-*.md`, `MAU-DANG-TIN-HANG-LOAT.xlsx`, `DANH-SACH-PHUONG-XA-TOAN-QUOC.txt` · `SEO\_cu\` thứ không dùng nữa · công cụ ảnh Photoshop ở `SEO\` gốc tự chạy khi mở máy — không chuyển.
> Đã gom, không dùng: `CONG-VIEC-3-BEN.md`, `Plan MXH\KE-HOACH-MXH.md`, `THU-TU-UU-TIEN.txt`, `GUI-CLAUDE-CODE\`, `CAN-ANH\`, `VAO\`.
>
> **BẢO MẬT · PUSH:** kế hoạch và sơ đồ không đưa lên GitHub (`docs/` cũng không). Chỉ push khi anh nhắn "Push"; chưa thử, chưa kiểm thì không push.
> Phiên cloud không ghi được ổ D: → chỉ ghi lệnh vào đây cho Claude trên máy làm.
>
> **Luật** (đọc mục 5 trước khi đụng tiêu đề, mô tả, khối số liệu, nối trang, giao tin):
> 1. Gợi ý Google (gợi ý khi gõ + "Mọi người cũng tìm kiếm") là CHUẨN: chữ trên web giữ đúng chữ + thứ tự gợi ý, thêm mục đích ở đầu.
> 2. Mục đích + loại hình (chữ người gõ nhiều nhất) + đặc điểm + khu vực + mức giá + tháng/năm; từ khoá dài chứa từ khoá ngắn.
> 3. Cùng nghĩa (có/không dấu, viết liền, đảo thứ tự) = một nút, một trang; nhưng ĐO RIÊNG từng cách gõ; top 10 chỉ đếm dạng đúng chính tả.
> 4. Sửa từ GỐC — 4 luật dùng chung, không vá từng trang: đặt chữ (`categories.ts` `tuKhoa`) · số liệu (`soLieuTrang`) · nối trang · giao tin.
> 5. Làm hết; trang chưa đạt cổng không lên; trang đã lên (`TRANG_DONG_BANG`) không sửa — trừ luật 8.
> 7. **Anh duyệt gì → ghi ngay** vào `chi-tiet\yeu-cau-chu-du-an.md` mục 0; trước khi hỏi anh, tra ở đó — đã có thì làm, không hỏi lại (29/10).
> 8. **Cùng loại hình = một trang** (căn hộ / chung cư… gõ cách nào cũng ra) · **mọi chỗ có địa chỉ đồng bộ hệ cũ + mới**, kể cả trang đã lên (`tenCu` tra bảng sáp nhập khi tin không ghi địa chỉ cũ) (29/10).
> 6. ⛔ **TRANG ĐÃ LÊN TOP = MẪU, KHÔNG ĐỤNG** (chủ dự án 28/10/2026): lấy trang đang top làm VÍ DỤ cho các trang chưa lên (cách đặt tiêu đề,
>    H1, mô tả, khối số liệu, hỏi đáp, nối trang) — chép CÁCH LÀM sang trang khác, KHÔNG sửa chính trang top. Trước khi sửa trang nào:
>    tra cột "Hạng tốt nhất" (trang tính Cụm) + "Coastal Land: hạng · trang hiện" (Đo theo cách gõ) trong `HE-THONG-TU-KHOA.xlsx`; hạng ≤ 10
>    hoặc có lượt bấm → không sửa. Đang top (28/10): `/cho-thue/can-ho-chung-cu/da-nang` (2) · **`/mua-ban/nha/da-nang` (3 — CHƯA có
>    trong `TRANG_DONG_BANG`)** · `/mua-ban/da-nang` (5). ⚠️ Đừng tự thêm trang đang top vào `TRANG_DONG_BANG`: tập đó làm trang VẼ LẠI
>    BẢN CŨ (khối giá cũ, hỏi đáp cũ) — trang đang top bằng bản hiện tại sẽ bị đổi. Danh sách trang top nằm ở `TRANG_TOP`
>    (`src/lib/pseo.ts`, chỉ đánh dấu, không đổi cách vẽ): sửa mã dùng chung xong phải so HTML các trang trong đó trước/sau — GIỐNG HỆT. Mã dùng chung (khuôn tiêu đề, `categories.ts`, `soLieuTrang`…) đổi thì phải loại trừ trang top.
> ⛔ Bài học 28/10: đếm cách gõ sai chính tả là "đã top" — sai; lấy "trang Google đang chọn" làm trang đích — sai;
> kết luận "trang không có khối X" khi chưa đo trên web thật — sai (khối giá theo khu vực đã có ở 64/130 trang).

---

## 0E. 🧾 THUẾ CÔNG TY (GTGT · TNDN · TNCN) — topic riêng, theo dõi lâu dài

> 📌 **Bàn giao mới nhất: [`BAN-GIAO-THUE-02-10.md`](BAN-GIAO-THUE-02-10.md) — đọc TRƯỚC.** Việc gấp: A7 (mẫu TT89 cho tờ khai Q3, hạn 31/10).
> **Sổ tay + kế hoạch: [`QUY-TRINH-BAO-CAO-THUE.md`](QUY-TRINH-BAO-CAO-THUE.md) — mục 0 là bảng
> tiến độ.** Mở phiên mới là **đọc file đó trước**, xem bước nào chưa ✅ rồi làm tiếp — **KHÔNG làm
> lại từ đầu, KHÔNG bắt chủ dự án kể lại.** Xong bước nào sửa bảng trong file đó ngay.
>
> Mở 02/10/2026. Đã rà soát toàn bộ code thuế (trang `/admin/hoa-don-thue`, `src/lib/thue.ts`,
> `src/lib/thueNhaThau.ts`, các route ghi `doanh_thu`). Hạn gần nhất: **tờ khai quý 3 — 31/10/2026**.
> Câu hỏi C2 (tiền nạp ví có phải xuất hóa đơn lúc nạp) **chờ kế toán — không tự sửa luồng ví.**
> ✅ C5 CHỐT 02/10: dịch vụ đăng tin = **quảng cáo → 8%** (đến 31/12/2026, batdongsan.com.vn cũng 8%).
> **Công ty KHÔNG môi giới, không tư vấn, không mua bán BĐS** (chủ dự án xác nhận) — mọi doanh thu
> là quảng cáo đăng tin. Đừng đổi `THUE_SUAT_GTGT` trừ khi luật đổi (hết hạn 31/12/2026 hoặc gia hạn).
> ⛔ **BÀI HỌC 02/10:** Claude từng đổi 8% → 10% → 8% vì một ý sai chưa kiểm ("Nghị định 174 loại trừ
> dịch vụ CNTT" — thật ra là nghị định cũ 180/2024). **Việc thuế/pháp lý: phải đối chiếu được VĂN BẢN
> GỐC trước khi sửa code. Không mở được văn bản gốc → nói rõ là chưa kiểm được, KHÔNG sửa.**
> Mục tiêu chủ dự án chốt 02/10: **"nhập liệu xong là in báo cáo / lấy báo cáo gửi theo quy định"** →
> trang in `/admin/hoa-don-thue/in`. Số liệu tính ở MỘT chỗ `src/lib/soLieuThue.ts` (+ `thueTncn.ts`).

---

## 0F. 🖥️ THẺ TIN + TRANG TIN BẢN PC — ĐÃ CHỐT, ĐÃ LÊN WEB 18/10/2026

> **Đọc TRƯỚC khi đụng thẻ tin, trang Mua bán/Cho thuê, trang chi tiết tin: [`docs/THE-TIN-THEO-CAP.md`](docs/THE-TIN-THEO-CAP.md) mục 6.**
> Đã duyệt = đóng băng: chỉ sửa lỗi. Trang chủ giữ nguyên. Bản đồ trong trang tin cấm đổi cỡ. Từ khoá pSEO không đụng khi chủ chưa cho.
> Sửa xong phải tự đo + gửi **link localhost đúng trang**; **chỉ push khi chủ dự án nói "Push"**. Việc còn treo: mục 6.3.

---

## 1. Dự án là gì

> ⚡ **Đây KHÔNG chỉ là một website thông thường — đây là Dự án COASTAL LAND PLATFORM.**
> **Phiên bản hiện tại: 1.0 (Foundation).**

| | |
|---|---|
| **Tên dự án** | **Coastal Land Platform** — phiên bản **1.0 (Foundation)** |
| **Tên thương hiệu** | **COASTAL LAND** (theo Brief & Kế hoạch v3 chính thức) |
| **Tên đầy đủ** | Central Coast Vietnam Real Estate |
| **Tên viết tắt** | **CVR** |
| **Tagline** | Gateway to Central Coast property |
| **Website (đích)** | coastalland.vn |
| **Loại** | Nền tảng PropTech — giai đoạn 1.0 là sàn giao dịch BĐS trung gian (Đà Nẵng – Huế, mở rộng Miền Trung) |
| **Mô hình** | Solopreneur + AI-Driven (1 người vận hành, dùng AI thay developer) |
| **Ngôn ngữ** | Tiếng Việt (có dấu) + Tiếng Anh |
| **Tiêu chuẩn** | Chất lượng tương đương website $20.000 USD |

**🎯 Mục tiêu dài hạn (tầm nhìn Platform):** Xây dựng **nền tảng PropTech hàng đầu Việt Nam**, theo lộ trình:
1. **Foundation (1.0 — hiện tại):** làm chủ thị trường Miền Trung (Đà Nẵng – Huế).
2. **Mở rộng toàn quốc:** nhân rộng mô hình ra các thị trường lớn cả nước.
3. **Hệ sinh thái:** tích hợp **AI, Big Data** cùng hệ sinh thái dịch vụ bất động sản (định giá, pháp lý, tài chính, quản lý...).

→ Mọi quyết định kiến trúc/kỹ thuật phải tính đến tầm nhìn này: code viết cho 1.0 nhưng **không được khoá đường mở rộng** (đa khu vực, đa dịch vụ, dữ liệu lớn).

**Nguyên tắc kinh doanh cốt lõi:** Người mua MIỄN PHÍ mãi mãi — chỉ thu phí người bán/môi giới.

---

## 1B. SMART SEARCH SYSTEM — "TRÁI TIM" CỦA NỀN TẢNG ❤️

> Trong Coastal Land Platform, **trái tim là cấu trúc và xây dựng Smart Search System**.
> Mọi tính năng tìm kiếm/lọc/gợi ý đều là bộ phận của hệ thống này — thiết kế đồng bộ,
> KHÔNG làm rời rạc từng mảnh.

### 8 thành phần của Smart Search System

| # | Thành phần | Vai trò |
|---|---|---|
| 1 | **AI Search** | Hiểu truy vấn tự nhiên tiếng Việt ("căn hộ 2PN gần biển dưới 3 tỷ") → tự tách khu vực/loại hình/giá/tiện ích. Dùng Claude API khi cần. |
| 2 | **Quick Search** | Ô tìm nhanh + autocomplete thông minh (đã có nền: `suggest.ts`, normalizeVi) — gõ là ra khu vực, dự án, loại hình, tin. Phản hồi tức thì. |
| 3 | **Dynamic Filter** | Bộ lọc đa tầng nhảy theo ngữ cảnh: chọn Mua bán/Cho thuê → loại hình đổi theo (taxonomy 2 trục đã có); chọn khu vực → dự án lọc động; đếm kết quả realtime. |
| 4 | **Semantic Search** | Tìm theo NGỮ NGHĨA, không chỉ khớp chữ: "gần trường học", "view sông", "hợp đầu tư" → khớp thuộc tính/tiện ích/mô tả tin. (Về sau: embeddings + Supabase pgvector.) |
| 5 | **Recommendation Engine** | Gợi ý cá nhân hoá: từ tin đã xem/đã lưu/khu vực quan tâm → "Dành riêng cho bạn", tin tương tự (đã có nền: pickRelated + provinceOf/districtOf/segmentOf). |
| 6 | **Ranking Engine** | Thứ hạng kết quả = điểm tổng hợp: độ khớp truy vấn + hạng tin (VIP/Diamond/Gold) + độ tươi + chất lượng tin (ảnh/mô tả đầy đủ) + hành vi người dùng. Minh bạch, không để VIP đè hoàn toàn độ khớp. |
| 7 | **Saved Search** | Lưu bộ lọc/truy vấn + thông báo khi có tin mới khớp (email/notification). Giữ chân người mua quay lại — nguồn lead cho người bán. |
| 8 | **Search Analytics** | Ghi nhận truy vấn, bộ lọc dùng nhiều, truy vấn 0 kết quả, CTR từng vị trí → dữ liệu để tinh chỉnh Ranking + báo giá trị cho người đăng tin. |

### UX Research bắt buộc (làm TRƯỚC khi thiết kế từng phần)

Phân tích 7 nền tảng chuẩn thế giới + Việt Nam, từ đó **đúc kết "Best Practices" riêng cho Coastal Land**:

1. **Batdongsan.com.vn** (VN — thị phần lớn nhất: taxonomy, bộ lọc, tin VIP)
2. **Homedy** (VN — UX bộ lọc & danh sách gọn)
3. **Zillow** (US — search map-first, Zestimate, saved search/notification)
4. **Rightmove** (UK — tốc độ, bộ lọc đơn giản mà đủ, email alert)
5. **PropertyGuru** (SEA — đa thị trường, gần bối cảnh VN nhất về hành vi)
6. **Domain** (AU — UX mobile, shortlist/collections)
7. **Realtor.com** (US — dữ liệu chuẩn hoá, SEO search page)

→ Mỗi phân tích trả lời: *họ tổ chức search thế nào · bộ lọc gì được ưu tiên · ranking ra sao ·
giữ chân người dùng bằng gì · điều gì đáng học / đáng tránh cho thị trường Miền Trung.*
Kết quả đúc kết lưu vào `docs/` (file UX research riêng) trước khi code từng thành phần.

### Trạng thái hiện tại (nền đã có → sẽ nâng cấp thành hệ thống)

- ✅ Nền Quick Search (autocomplete `suggest.ts` + normalizeVi) · Dynamic Filter đa tầng (locations[] đa chọn, dự án lọc động, giá/m², lọc theo ý định) · Recommendation sơ khai (pickRelated, tin tương tự, RecentlyViewed) · Saved (tin lưu localStorage)
- ⏳ Chưa có: AI Search, Semantic Search, Ranking Engine đúng nghĩa, Saved Search (lưu bộ lọc + alert), Search Analytics, và bộ UX Research 7 nền tảng.

> ⚠️ Tài liệu cũ từng dùng tên "Central Land / Central Coast Realty" và domain "centralcoast.vn".
> **Tên & domain chuẩn đã chốt: COASTAL LAND / coastalland.vn.** Nếu thấy tên/domain cũ ở đâu → sửa.

---

## 2. Tech Stack (đã chốt)

```
Frontend:    Next.js 16 (App Router) + React 19 + TailwindCSS v4 + TypeScript
Database:    Supabase (PostgreSQL)                  — free tier năm 1
Hosting:     VERCEL (đang chạy thật)                 — auto-deploy mỗi lần push main
CDN/Bảo mật: Cloudflare
Thanh toán:  PayOS API (ưu tiên) · dự phòng MoMo/ZaloPay/Stripe
AI kiểm duyệt tin: Claude API
Email:       Resend
Analytics:   Google Analytics 4 + Search Console
```

### Bộ nhận diện COASTAL LAND — màu sắc

**Hệ màu chuẩn (đích): TRẮNG / ĐEN + điểm nhấn VÀNG (luxury).**
- Nền chủ đạo trắng, chữ đen; Header/Footer có thể đảo nền đen chữ trắng.
- Vàng dùng cho điểm nhấn đặc biệt: badge VIP, nút CTA quan trọng (theo logo thương hiệu).

> ⚠️ **Lệch giữa tài liệu và code hiện tại:** giao diện đang chạy vẫn là bản **đơn sắc nền tối**
> (`#060606` đen, chữ trắng — token `cl-ink/cl-charcoal/cl-gray/cl-stone` trong `src/app/globals.css`).
> Việc chuyển sang hệ trắng/đen+vàng là **đầu mục còn tồn**, chưa làm. Đừng mô tả là đã xong.
> Comment `Bộ nhận diện CENTRAL LAND` trong `globals.css` còn ghi tên cũ — cần đổi thành COASTAL LAND khi đụng tới.

Logo thật ở `public/logo/` (symbol-dark.svg cho nền sáng, symbol-white.svg cho nền tối).

---

## 3. TRIỂN KHAI (Deploy) — QUAN TRỌNG

- **Website CHÍNH THỨC:** `https://coastalland.vn` — domain mua tại PA Vietnam.
- **CHẠY TRÊN VERCEL** (chế độ máy chủ, KHÔNG phải GitHub Pages tĩnh). Kiểm chứng:
  `curl -sI https://coastalland.vn` trả về `Server: Vercel`.
  → Có route máy chủ thật (`/api/...`, `/auth/...`), có biến môi trường, đọc Supabase no-store.
- **Cơ chế:** push lên `main` → Vercel tự build và deploy, **~45 giây** là lên web.
- Biến môi trường cắm tại **Vercel → Settings → Environment Variables** (không phải file .env trên máy).
  Đổi biến xong phải **Redeploy** mới có hiệu lực.
- Repo GitHub: `truongthanhtung08-stack/cvr-website-` (PUBLIC — lưu ý có dấu `-` ở cuối).
- ⚠️ Tài liệu cũ (11/7) ghi web chạy GitHub Pages / static export / "bỏ qua Vercel" — **SAI, đã bỏ**.
  `deploy.yml` và `basePath` là tàn dư thời GitHub Pages, không còn tác dụng.

---

## 4. Cấu trúc thư mục dự án

```
cvr-website/
├── CLAUDE.md          ← file này (bối cảnh + nguyên tắc làm việc)
├── README.md          ← hướng dẫn chạy/deploy nhanh
├── .env.local         ← khóa kết nối Supabase (KHÔNG commit lên git)
├── next.config.ts     ← cấu hình basePath cho GitHub Pages
├── docs/              ← tài liệu kế hoạch (Brief, Kế hoạch v3, Context...)
│   ├── CVR_Context.md ← BỐI CẢNH ĐẦY ĐỦ (đọc khi cần chi tiết)
│   └── CVR_KeHoach_toàn diện_v3..docx ← kế hoạch gốc (nguồn sự thật, không sửa trực tiếp)
├── src/
│   ├── app/           ← App Router + globals.css (@theme cấu hình màu)
│   ├── components/    ← PropertyCard, FeaturedListings, LocationGrid, NewsSection...
│   └── lib/           ← supabase/ (client.ts, server.ts), data.ts, asset.ts
└── public/
    ├── logo/          ← logo SVG thật
    └── images/        ← ảnh tin (tin/), dự án (du-an/), hero, gallery
```

📌 **Khi cần thông tin chi tiết** (database schema, gói dịch vụ, lộ trình 3 năm, chi phí, prompt mẫu) → đọc `docs/CVR_Context.md`.

---

## 5. Nguyên tắc dự án (bổ sung cho mục 0)

1. **Tiếng Việt có dấu** — luôn luôn, không ngoại lệ.
2. Ưu tiên giải pháp **1 người làm được** bằng AI và tự động hóa.
3. **Không thuê developer** — dùng Claude Code cho toàn bộ lập trình.
4. **Người mua miễn phí mãi mãi** — không thay đổi chiến lược này.
5. **Depth trước Breadth** — làm thật tốt Đà Nẵng + Huế trước khi mở rộng.
6. Tính chi phí theo **VNĐ**.
7. Vai trò của Claude: vừa là CTO + CFO + CMO của dự án.

---

## 6. Database Supabase (các bảng chính)

`listings` (tin BĐS) · `users` · `categories` · `locations` · `subscription_plans` ·
`payments` · `listing_images` · `banner_ads` · `ai_moderation_logs`

> Schema cột chi tiết xem `docs/CVR_Context.md` mục 4.

---

## 7. Trạng thái hiện tại

```
GIAI ĐOẠN: 1 (Lập trình) — trang chủ + dữ liệu mẫu đã có, đang xây các trang con

✅ Đã xong:
  - Môi trường: Node 20, Git, WSL, Claude Code CLI
  - Tài khoản GitHub / Supabase + repo + project; .env.local kết nối Supabase
  - Khởi tạo project: Next.js 16 + React 19 + TailwindCSS v4 + TypeScript
  - Supabase client (src/lib/supabase/client.ts + server.ts)
  - Trang chủ đầy đủ: Header → Hero (ảnh + bộ lọc) → BĐS nổi bật → Loại hình
       → BĐS theo khu vực → Giá trị → Tin tức → CTA → Footer
  - Dữ liệu mẫu: src/lib/data.ts (featuredListings, areas, articles)
  - Component: PropertyCard, FeaturedListings, LocationGrid, NewsSection
  - Ảnh mẫu thật: public/images/tin/*.jpg, public/images/du-an/*.jpg, hero
  - Deploy tự động lên GitHub Pages qua GitHub Actions

⏳ Bước kế tiếp:
  - Chuyển hệ màu giao diện sang TRẮNG/ĐEN + VÀNG (hiện còn đơn sắc nền tối) — xem mục 2
  - Tạo bảng `listings` + dữ liệu thật trong Supabase
  - Trang danh sách /mua-ban, /cho-thue (bộ lọc + grid + phân trang)
  - Trang chi tiết BĐS /bat-dong-san/[slug]
  - ✅ Domain coastalland.vn ĐÃ MUA + ĐÃ GẮN, site chạy chính thức (3/7/2026)

GHI CHÚ KỸ THUẬT:
  - Tailwind v4: cấu hình màu ở src/app/globals.css trong @theme (KHÔNG có tailwind.config.js)
  - Component giao diện ở src/components/, Supabase helper ở src/lib/supabase/
  - Ảnh phải qua helper src/lib/asset.ts để chạy đúng trên GitHub Pages
```

---

## 8. Website tham khảo
- https://homedy.com (UX/UI danh sách BĐS — bộ lọc tìm kiếm là ưu tiên số 1)
- https://batdongsan.com.vn (phân loại, bộ lọc)
- https://apple.com (về giao diện và annimation)
