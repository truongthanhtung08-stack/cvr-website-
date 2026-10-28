# CLAUDE.md — Dự án COASTAL LAND (CVR)

> File này Claude Code tự đọc mỗi khi mở dự án. Luôn cập nhật khi có thay đổi quan trọng.
> **Trả lời và viết mọi nội dung bằng tiếng Việt có dấu.**

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
>     ③ Duyệt: hạn = ngày duyệt + số ngày gói/chương trình; trừ đúng số tiền đã báo. ④ Nâng VIP: VIP chạy từ ngày nâng,
>     kỳ Basic chạy song song (không cộng nối). ⑤ Hết VIP: tự về Basic giữ hạn Basic còn lại (ghi `ha_vip_luc`).
>     ⑥ Hết hạn: ẩn + nhắn khách; đăng lại → chờ duyệt như tin mới. ⑦ Tự kiểm 8h: chỉ báo lỗi thật, sửa xong tự hết báo.
>   - Mọi đường đặt hạn liệt kê ở đầu `src/lib/kiemTin.ts` — thêm đường mới phải thêm vào đó.
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
>   1 năm mới hiện. Yêu cầu nhập liệu cho Cowork: `D:\Coastal Land\SEO\YEU-CAU-COWORK-LICH-SU-GIA.md` (mọi tệp cho Cowork — yêu cầu, dữ liệu vào, dữ liệu ra — chỉ nằm ở `D:\Coastal Land\SEO\`, xem `CONG-VIEC-3-BEN.md` mục 0) (làm mới 03/10: cùng phân khúc + cùng vị trí, 3 bậc dự án → đường → phường — ⛔ **bỏ hẳn cả tỉnh 16/10** (số một phường/loại hình không áp cho nơi khác); đơn vị theo loại hình: đất ÷ m² đất · căn hộ ÷ m² căn · nhà, văn phòng ÷ m² sàn; theo quý như Batdongsan, đủ 5 quý liền mới hiện; ⛔ **thống nhất GIÁ MỖI M² theo loại hình cả bán lẫn thuê (thuê = tiền/tháng ÷ m², chốt 21/10 — "lấy đơn vị tổng là sai")**; web tự tính, Cowork điền phần thiếu từ nút "Tải danh sách còn thiếu").
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
Hai quy trình: ① tin đăng hằng ngày · ② dữ liệu khác hằng tuần. Mọi tệp Cowork (yêu cầu, mẫu, dữ liệu vào `VAO`, dữ liệu ra `RA`) chỉ ở `D:\Coastal Land\SEO\`; tin giao ở `D:\Coastal Land\Đăng tin\TIN HANG NGAY chuẩn\<ngày>`. Muốn đổi quy trình → sửa thẳng mục 11 tệp đó, không tạo tệp quy trình mới.

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

## 0D1. 🔑 MỘT TỆP CHO CẢ 3 BÊN · TỪ KHOÁ — GỢI Ý GOOGLE LÀ CHUẨN (chốt 28/10/2026)

> ⛔ **MỘT TỆP `D:\Coastal Land\SEO\Plan SEO - pSEO\KE-HOACH-SEO.md` = điểm bắt đầu của cả 3 bên** (chủ dự án 28/10: "1 chỗ, 1 file .md
> để yêu cầu và sửa — bất cứ bên nào cũng phải từ đây"). Mục 0 yêu cầu chủ dự án · 0b thứ tự việc Cowork · 3 mọi việc (kể cả mạng xã hội
> #41–#51; giao việc / yêu cầu Claude = thêm một dòng) · 5 kế hoạch từ khoá · 11 quy trình 3 bên · 12 kế hoạch mạng xã hội.
> Mỗi phiên Claude ĐỌC TỆP NÀY TRƯỚC, làm việc ở mục 3, ghi kết quả vào cột Trạng thái. `scripts/viec-du-lieu.mjs` chỉ đọc tệp này để
> dựng `SEO\RA\VIEC.md` cho Cowork. Đã gom, không dùng nữa: `CONG-VIEC-3-BEN.md` · `Plan MXH\KE-HOACH-MXH.md` · `THU-TU-UU-TIEN.txt` ·
> thư mục `GUI-CLAUDE-CODE\` · tệp `CAN-ANH\<ngày>.md` · mảng YEU_CAU trong mã. Tài liệu tra cứu (YEU-CAU-COWORK-…, MAU-…) giữ riêng,
> không yêu cầu hay sửa ở đó — muốn đổi thì ghi một dòng ở mục 3.
> **Hằng ngày — MỘT lệnh (chủ dự án chốt 28/10):** chủ dự án mở máy → mở tệp này xem (cần thì sửa, bổ sung) → nhắn Claude trên máy
> **"Bắt đầu"**. Claude làm đúng khối ⭐ đầu tệp, không hỏi lại: lấy mã mới (`git pull --ff-only`) · đọc tệp · kiểm web + Search Console,
> xin index · chạy `node scripts/viec-du-lieu.mjs` → `VIEC.md` · làm các dòng mục 3 có Ai = Claude · báo ngắn. Nhắn "Bắt đầu" = đã duyệt tệp
> như đang có (sửa hay không); đề xuất mới của Claude ghi thành dòng mục 3 chờ duyệt. Sau đó chủ dự án chỉ duyệt: "Đăng <ngày>" · "Push".

> **MỘT thư mục cho cả 3 bên: `D:\Coastal Land\SEO\Plan SEO - pSEO\`** — chủ dự án sửa, Claude đọc + sửa, máy giao việc hằng ngày
> (`scripts/viec-du-lieu.mjs`) đọc. Không tạo tệp kế hoạch / tệp nhập ở chỗ khác; trùng thì gom vào đây, không cần thì bỏ.
> - `KE-HOACH-SEO.md` — MỘT kế hoạch: mục 3 = việc (dòng chưa ✅ tự vào việc hằng ngày) · mục 5 = kế hoạch từ khoá bản 3.
> - `TRA-GOOGLE.csv` — MỘT tệp nhập: gợi ý Google (chuẩn) · kết quả từng lần tra · danh sách cần tra.
> - `HE-THONG-TU-KHOA.xlsx` — MỘT tệp kết quả (máy dựng): tiến độ hằng ngày, cây từ khoá, chẩn đoán, trang cần mở, on-page.
> - `may-tu-khoa\` — máy 6 bước `goc → kiem → onpage → chandoan → xuat → soat` + dữ liệu nguồn.
> **MỌI chỉnh sửa, điều chỉnh từ MỘT nguồn là thư mục này** (chủ dự án 28/10):
> - Phiên trên máy chủ dự án: sửa thẳng trong thư mục, không chép ra chỗ khác để sửa.
> - Muốn phiên đám mây ghi thẳng ổ D:: chủ dự án mở một phiên trên máy mình (Claude Desktop mở `D:\Coastal Land\SEO`, hoặc terminal
>   tại đó gõ `claude remote-control`) → phiên đám mây nhắn phiên đó làm.
> - Không có phiên trên máy: Claude trả MỘT tệp `Plan-SEO-pSEO.zip` cùng cấu trúc thư mục. Gói KHÔNG chứa `KE-HOACH-SEO.md`
>   (tệp này máy ghi nhật ký mỗi sáng — chép đè là mất); bản đã sửa đi kèm là `may-tu-khoa\KE-HOACH-SEO.moi.md`, và
>   `CAP-NHAT-MOT-LAN.bat` chỉ thay khi tệp trên máy còn ĐÚNG bản Claude đã dựa vào (so số byte), sao lưu bản cũ vào
>   `may-tu-khoa\sao-luu\`, lệch thì dừng không ghi. ⛔ Máy chủ dự án CÓ Node.js nhưng cửa sổ lệnh mở bằng bấm đúp
>   tệp .bat không tìm thấy `node` (đo 28/10) → tệp .bat chỉ dùng lệnh có sẵn của Windows. Chủ dự án: giải nén vào `D:\Coastal Land\SEO\` ("Overwrite without prompt"), bấm đúp `CAP-NHAT-MOT-LAN.bat`.
>
> **Luật** (đọc mục 5 trước khi đụng tiêu đề, mô tả, khối số liệu, nối trang, giao tin):
> 1. Gợi ý Google (gợi ý khi gõ + "Mọi người cũng tìm kiếm") là CHUẨN: chữ trên web giữ đúng chữ + thứ tự gợi ý, thêm mục đích ở đầu.
> 2. Mục đích + loại hình (chữ người gõ nhiều nhất) + đặc điểm + khu vực + mức giá + tháng/năm; từ khoá dài chứa từ khoá ngắn.
> 3. Cùng nghĩa (có/không dấu, viết liền, đảo thứ tự) = một nút, một trang; nhưng ĐO RIÊNG từng cách gõ; top 10 chỉ đếm dạng đúng chính tả.
> 4. Sửa từ GỐC — 4 luật dùng chung, không vá từng trang: đặt chữ (`categories.ts` `tuKhoa`) · số liệu (`soLieuTrang`) · nối trang · giao tin.
> 5. Làm hết; trang chưa đạt cổng không lên; trang đã lên (`TRANG_DONG_BANG`) không sửa.
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
