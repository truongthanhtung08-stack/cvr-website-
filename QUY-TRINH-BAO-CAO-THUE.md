# QUY TRÌNH BÁO CÁO THUẾ — CÔNG TY TNHH BẤT ĐỘNG SẢN COASTAL LAND

> Soạn 02/10/2026. Ba loại thuế công ty phải lo: **GTGT (VAT) · TNDN · TNCN**, kèm
> thuế nhà thầu nước ngoài (đã có quy trình trên web) và lệ phí môn bài (đã bãi bỏ).
>
> ⚠️ **Đây là sổ tay vận hành, KHÔNG thay kế toán.** Năm 2026 luật thuế đổi rất nhiều
> (Luật Quản lý thuế 108/2025/QH15 hiệu lực 01/7/2026, kèm Nghị định 252/2026/NĐ-CP và
> Thông tư 89/2026/TT-BTC; Luật Thuế TNCN 2025; Luật Thuế TNDN 67/2025/QH15). **Mã mẫu
> tờ khai và chỉ tiêu phải đối chiếu lại với bản đang hiện trên cổng thuế lúc nộp** —
> mục nào đánh dấu 🔎 là chỗ chưa kiểm được bằng văn bản gốc, cần kế toán xác nhận.

---

## 0. KẾ HOẠCH TỔNG THỂ — làm từng bước, xong bước nào đánh dấu bước đó

> Rà soát toàn bộ phần thuế trong code ngày 02/10/2026. Đã có sẵn: ghi doanh thu tự động
> (duyệt tin, đẩy tin, gói up, hội viên), xuất hóa đơn VNPT + nhắc 20:00/08:30, tờ khai 01/GTGT,
> tạm nộp TNDN, hóa đơn mua vào (XML), thuế nhà thầu nước ngoài, khối "Việc thuế cần làm".

### Bản đồ mọi mảng liên quan đến thuế (để không sót)

| Mảng | Gồm những gì | Web đã có | Còn thiếu / cần hỏi |
|---|---|---|---|
| **Chữ ký số** | Một USB token của công ty dùng cho **3 việc**: ký hóa đơn VNPT · ký tờ khai thuế · ký giấy nộp tiền | Không thể có — máy chủ không cắm được token, nên web chỉ **nhắc**, người ký bằng tay | B1: loại token, nhà cung cấp, **ngày hết hạn**; có dùng chung một token cho VNPT và cổng thuế không |
| **Hóa đơn điện tử ĐẦU RA** (VNPT) | Ký hiệu `1C26TCL` · hóa đơn riêng cho khách có MST · hóa đơn tổng cuối ngày cho khách lẻ · VNPT **chặn ký quá 1 ngày** | ✅ gom giao dịch chờ xuất, tải file cho VNPT, nhắc 20:00 + 08:30, khách tự xem ở `/tai-khoan/hoa-don`, Sổ khách hàng theo thuế | E1: đổi ký hiệu `1C27TCL` + đăng ký dải mới khi sang 2027 · C2: hóa đơn lúc nạp ví? |
| **Hóa đơn điện tử ĐẦU VÀO** | Hóa đơn GTGT mua trong nước (XML) | ✅ tải XML / nhập tay | B5: gửi hóa đơn quý 3 · đối chiếu với `hoadondientu.gdt.gov.vn` |
| **Khai thay — nhà thầu nước ngoài** | Vercel, Supabase, Anthropic… chưa đăng ký thuế VN → mình khai **01/NTNN** theo tháng, hạn ngày 20 | ✅ đọc PDF hóa đơn, tính GTGT 5% + TNDN 5%, tải CSV tờ khai, đánh dấu đã nộp, tự cộng khấu trừ | Không |
| **Khai thay — TNCN người lao động** | Công ty khấu trừ, khai 05/KK, quyết toán 05/QTT | ❌ chưa có | B4 → A4 |
| **Khai thay — người đăng tin (sàn)** | Nghị định 117/2025/NĐ-CP: sàn thương mại điện tử **có chức năng thanh toán** phải khấu trừ, khai nộp thay thuế cho hộ/cá nhân bán hàng trên sàn | Không áp dụng nếu đúng như hiện tại: web **chỉ thu phí đăng tin**, không thu hộ tiền mua bán/cho thuê giữa người mua và người bán | **C4**: kế toán xác nhận Coastal Land không thuộc diện này; và có phải **cung cấp thông tin người bán** định kỳ cho cơ quan thuế không 🔎 |
| **Tờ khai GTGT quý** | 01/GTGT + phụ lục giảm thuế 8% | ✅ tính sẵn chỉ tiêu | A2 ô [22] · A3 phụ lục |
| **TNDN** | Tạm nộp quý · quyết toán 03/TNDN | ✅ tạm nộp quý | Quyết toán làm cùng kế toán (E3) |
| **Báo cáo tài chính năm** | Nộp cùng quyết toán TNDN, hạn 31/3 | ❌ ngoài web | Kế toán lập — B7 |
| **Nộp tiền thuế** | Giấy nộp tiền điện tử qua ngân hàng liên kết | Không (làm trên cổng thuế) | B2 |
| **Lưu hồ sơ** | Tờ khai, thông báo chấp nhận, chứng từ nộp tiền, hóa đơn — **lưu 10 năm** | Hóa đơn nằm ở VNPT + Supabase | Chốt một thư mục lưu cố định (Google Drive `Thuế/<năm>/<quý>/`) |

### Giai đoạn A — Sửa web (Claude làm, chủ dự án duyệt từng bước)
| # | Việc | Vì sao | Trạng thái |
|---|---|---|---|
| A1 | **Sổ khách hàng theo thuế** — gom doanh thu theo MST, cột hóa đơn chưa xuất, CSV | Nhìn ra khách nào còn thiếu hóa đơn | ✅ đã lên web 02/10 |
| A2 | Tờ khai 01/GTGT thêm ô **[22] — thuế còn được khấu trừ kỳ trước** | Trước đây trang bỏ qua [22] → quý trước còn dư khấu trừ thì [40] bị **tính cao hơn thực tế** | ✅ 02/10 — ô nhập trong khối tờ khai, nhớ theo từng quý trên máy |
| A3 | **Phụ lục giảm thuế GTGT 8%** (mẫu 01 Phụ lục III Nghị định 174/2025) | Kỳ xuất hóa đơn 8% phải nộp kèm | ✅ 02/10 — có trong bản in quý |
| A4 | Mục **TNCN** (khai quý 05/KK + quyết toán 05/QTT) | Web chưa có gì về TNCN | ✅ 02/10 — dùng ngay trên trình duyệt, KHÔNG cần chạy SQL (lưu trong bảng `bi_mat` có sẵn, chỉ admin đọc được) |
| A5 | **Trang IN BÁO CÁO** `/admin/hoa-don-thue/in` — bố cục theo mẫu tờ khai, in A4 / lưu PDF | Mục tiêu chủ dự án: **nhập liệu xong là in báo cáo** | ✅ 02/10 — quý: 01/GTGT · phụ lục giảm thuế · bảng tính tạm nộp TNDN · 05/KK-TNCN · bảng kê hóa đơn. Năm: tổng hợp GTGT 4 quý · số liệu quyết toán TNDN · 05/QTT-TNCN + bảng kê 05-1, 05-2 |
| A7 | **Cập nhật bản in theo mẫu Thông tư 89/2026** — 01/GTGT và 05/KK-TNCN | Tờ khai quý 3/2026 trở đi PHẢI theo mẫu mới (Điều 100 khoản 1 TT 89) | ✅ 19/10 sửa trên máy, đã đối chiếu mẫu gốc, **chờ chủ dự án duyệt + "Push"**. Kỳ trước 01/7/2026 vẫn in mẫu cũ. 05/QTT-TNCN (năm) chưa đổi — xem mục 0.1 bước 9 |
| A6 | Xuất file **XML** nộp thẳng lên cổng thuế | Đỡ gõ tay | ⛔ chưa làm — chưa có đặc tả XML chính thức (XSD) của ngành thuế; đoán sai cấu trúc thì cổng từ chối. Hiện: chép số từ bản in vào "khai trực tuyến" trên cổng (01/GTGT chỉ ~10 ô có số) |

### Giai đoạn B — Chủ dự án cung cấp (xem mục 7)
| # | Việc | Trạng thái |
|---|---|---|
| B1 | Chữ ký số: loại + ngày hết hạn | ✅ có chữ ký số VNPT (chủ dự án báo 19/10) · ⏳ ngày hết hạn |
| B2 | Tài khoản thuế điện tử + email nhận thông báo + ngân hàng liên kết | ✅ 20/10 chủ dự án báo: đã có tài khoản thuế điện tử, đã đăng ký USB VNPT-CA trên cổng thuế |
| B3 | Đã nộp tờ khai GTGT Q1, Q2/2026 chưa · số [43] của tờ khai gần nhất | ⏳ |
| B4 | Có trả lương/hoa hồng cho cá nhân không | ⏳ |
| B5 | Hóa đơn mua vào quý 3 chưa có trên web | ⏳ trước 25/10 |
| B6 | Hợp đồng/tài khoản VNPT Invoice: gói đã mua còn bao nhiêu số hóa đơn, hạn dùng | ⏳ |
| B7 | Có kế toán / dịch vụ kế toán không — ai lập báo cáo tài chính năm | ⏳ |

### Giai đoạn C — Kế toán xác nhận (không tự kết luận được)
| # | Câu hỏi | Trạng thái |
|---|---|---|
| **C5** | ✅ **CHỐT 02/10/2026 — 8%.** Phí đăng tin, đẩy tin, gói up, hội viên, banner có bản chất là **dịch vụ quảng cáo** (công ty không mua bán, không môi giới căn nào) → được giảm còn 8% theo Nghị quyết 204/2025/QH15 + Nghị định 174/2025/NĐ-CP đến hết 31/12/2026. Thuế suất xét theo **dịch vụ thực tế bán ra**, không theo tên công ty / ngành đăng ký / ngành của khách. batdongsan.com.vn cũng đang áp 8%. **Công ty KHÔNG làm môi giới, không tư vấn, không mua bán BĐS** (chủ dự án xác nhận 02/10/2026) → toàn bộ doanh thu là dịch vụ quảng cáo đăng tin, không có khoản nào thuộc nhóm "kinh doanh bất động sản" bị loại trừ. (Ghi chú cũ "loại trừ dịch vụ CNTT" là SAI — đó là Nghị định 180/2024, Nghị định 174 đã bỏ.) Để chắc: hóa đơn ghi nội dung "Dịch vụ quảng cáo đăng tin"; tránh tự gọi là "sàn giao dịch BĐS" trên hóa đơn. Muốn có văn bản bảo vệ → hỏi Thuế cơ sở 4 Đà Nẵng. | ✅ |
| C1 | Các chỗ 🔎 trong file này (mã mẫu mới theo TT 89/2026, ngưỡng thuế TNCN, ngưỡng chi phí tiền mặt) | ⏳ |
| C2 | ⚠️ **Tiền khách NẠP VÍ có phải xuất hóa đơn ngay lúc nạp không?** Web hiện ghi doanh thu + xuất hóa đơn lúc **dùng** (duyệt tin), không phải lúc nạp. Nghị định 123/2020 (Điều 9) coi thu tiền trước khi cung cấp dịch vụ là thời điểm lập hóa đơn, trừ tiền đặt cọc/tạm ứng. Ví nạp trước thuộc loại nào → kế toán chốt. **Đổi cách này là đổi lớn — không tự sửa.** | ⏳ |
| C3 | Hóa đơn trạng thái "đã hủy" có còn tính doanh thu không (hiện vẫn tính) | ⏳ |
| C4 | Coastal Land có thuộc diện **sàn khấu trừ/khai thay thuế cho người đăng tin** (Nghị định 117/2025) hay phải **cung cấp thông tin người bán** cho cơ quan thuế không | ⏳ |

### CÁCH DÙNG HẰNG QUÝ (sau khi đã có A1–A5)
1. `/admin/hoa-don-thue` → chọn Quý / Năm.
2. Nhập: hóa đơn mua vào (XML), hóa đơn nước ngoài, doanh thu doanh nghiệp, **ô [22]**, **chi trả TNCN** (mỗi lần trả lương/hoa hồng).
3. Khối "Việc thuế cần làm" xanh hết.
4. Bấm **"In báo cáo Quý X/…"** → tab mới → **In / Lưu PDF**.
5. Mở cổng thuế, khai trực tuyến 01/GTGT (+ phụ lục) và 05/KK-TNCN (nếu có khấu trừ), chép số từ bản in → ký số → nộp → nộp tiền.
6. Cuối năm: bấm **"In báo cáo cả năm"** → đưa kế toán lập 03/TNDN + BCTC, nộp 05/QTT-TNCN.

### Giai đoạn D — Nộp quý 3/2026 (hạn **31/10/2026**)
D1 làm xong A2 + B1–B3 + B5 → D2 khối "Việc thuế cần làm" xanh hết → D3 Claude soạn tờ khai điền sẵn
từng ô → D4 chủ dự án ký số, nộp trên cổng (mục 6.3) → D5 nộp tiền GTGT + tạm nộp TNDN → D6 lưu hồ sơ.

### 0.1 KẾ HOẠCH NỘP QUÝ 3/2026 — cập nhật 19/10/2026 (giờ Việt Nam)

> **Hạn:** 31/10/2026 là **thứ Bảy** → lùi sang **thứ Hai 02/11/2026** (mục 2). Nên nộp xong trước 30/10.
> **Số trên web lúc 19/10:** Quý 3/2026 doanh thu 0 · mua vào 0 · nước ngoài 0 · TNCN 0.
> **20/10 — SỬA:** thư mục `D:\Coastal Land\Kế toán\Hóa đơn đầu vào` có **5 hóa đơn GTGT trong nước quý 3**
> (Google 07/9 · VNPT-CA 28/8 · Sắc Màu 25/9 · Zalo 26/9 · P.A Việt Nam 29/9) = tiền hàng **7.021.988** · thuế
> **600.660** → chưa nhập web. Nhập xong: [23] 7.021.988 · [24] [25] 600.660 · doanh thu 0 → [40] = 0,
> [43] = 600.660 chuyển sang quý 4. Không phải tờ khai trắng. Chỉ đúng nếu phương pháp đã là khấu trừ (bước 2).

| # | Việc | Căn cứ (đã đọc văn bản gốc) | Ai làm · ở đâu | Trạng thái |
|---|---|---|---|---|
| 1 | Bản in 01/GTGT + 05/KK-TNCN theo mẫu mới | **TT 89/2026/TT-BTC** (ban hành 30/6/2026, hiệu lực 01/7/2026; đính chính QĐ 2551/QĐ-BTC 15/9/2026 — không đụng 2 mẫu này). Mẫu 01/GTGT trang 241–243, 05/KK-TNCN trang 307–309 của bản PDF gốc. Điều 100 khoản 1: kỳ trước 01/7/2026 mới dùng mẫu cũ | Claude · `in/page.tsx`, `thueTncn.ts` | ✅ trên máy, chờ duyệt + Push |
| 2 | **Xác nhận phương pháp GTGT trên cổng thuế** (Kê khai → Đăng ký tờ khai: thấy **01/GTGT** = khấu trừ; thấy **04/GTGT** = vẫn trực tiếp) | Lỗi 1025 tháng 8 — xem memory `gtgt-phuong-phap-khau-tru` | **Chủ dự án** | ⏳ GẤP — nếu vẫn 04/GTGT thì phải khai mẫu 04/GTGT, bản in 01/GTGT không dùng được |
| 3 | Hóa đơn nước ngoài **tháng 9/2026** (Vercel Pro từ 14/9, Supabase Pro từ 17/9): trả bằng thẻ công ty → khai **01/NTNN, hạn 20/10/2026**; thẻ cá nhân → không khai, không khấu trừ | Quy trình đã có ở mục cuối `/admin/hoa-don-thue` | **Chủ dự án** chọn PDF · Claude soát số | ⏳ GẤP — hạn ngày mai |
| 4 | Ô **[22]** = chỉ tiêu [43] của tờ khai Quý 2/2026 (chưa nộp Q1, Q2 thì nói để xử lý trước) | — | **Chủ dự án** nhập trên `/admin/hoa-don-thue` (chọn Quý 3) | ⏳ |
| 5 | Hóa đơn mua vào trong nước Quý 3 (XML) — nếu có | — | **Chủ dự án** tải XML | ⏳ trước 25/10 · 20/10: chủ dự án báo hóa đơn đầu vào phát sinh từ **tháng 10** → thuộc Quý 4 (khai trước 31/01/2027), chủ bổ sung dần |
| 6 | Có trả lương / tiền công Quý 3 không. **Có trả là phải nộp 05/KK-TNCN, kể cả không khấu trừ đồng nào** (ghi chú mẫu gốc TT 89) | TT 89 mẫu 05/KK-TNCN | **Chủ dự án** nhập "Ghi một lần chi trả" | ⏳ |
| 7 | Bấm **In báo cáo Quý 3/2026** → khai trực tuyến trên cổng, chép SỐ theo TÊN chỉ tiêu → ký bằng **chữ ký số VNPT** → nộp | Mục 6.3 | **Chủ dự án** | ⏳ sau bước 2–6 |
| 8 | Chờ Thông báo chấp nhận → lưu hồ sơ `Thuế/2026/Q3/` | Mục 3.3 | **Chủ dự án** | ⏳ |
| 8a | Bản in **01/NTNN, NCCNN** theo TT 89 (trang 475–477 bản gốc) — nút "In tờ khai 01/NTNN tháng …" ở mục thuế nhà thầu; có chọn Phần I (nhà thầu) / Phần II (nhà cung cấp trên nền tảng số) — **kế toán chốt Vercel/Supabase thuộc phần nào** | TT 89 | Claude | ✅ 20/10 trên máy, chờ duyệt + Push |
| 8b | **Chuẩn hóa hóa đơn đầu ra theo đăng ký VNPT**: ký hiệu thật (`KY_HIEU_HOA_DON`, đang để tạm `1C26TCL`), mẫu số, chứng thư số | Thông báo chấp nhận 01/ĐKTĐ-HĐĐT | **Chủ dự án** gửi ảnh "Quản lý dải ký hiệu" trên hst.vnpt-invoice.com.vn + thông báo chấp nhận · Claude sửa | ⏳ |
| 9 | Sau 31/10, trước 31/3/2027: mẫu **05/QTT-TNCN** theo TT 89 (trang 313–315 bản gốc) · nút "Tải XML" (A6) | TT 89 | Claude | ⏳ chưa làm |

### 0.2 CRM THUẾ — LUỒNG CHUẨN (chốt 20/10/2026): nhập số → tải file → ký số → nộp online

| Bước | Ai | Làm gì |
|---|---|---|
| 1. Nhập | Web tự / chủ dự án | Hóa đơn RA web tự ghi khi duyệt tin · hóa đơn VÀO trong nước: XML (hoặc nhập tay từ PDF) · hóa đơn NƯỚC NGOÀI: PDF → web tính thuế khai thay · TNCN: mỗi lần trả lương |
| 2. Kiểm | Web | Khối "Việc thuế cần làm" xanh hết · đối chiếu với hoadondientu.gdt.gov.vn |
| 3. Xuất | Web | Mỗi tờ khai một bản in (đã có: 01/GTGT, phụ lục 8%, 05/KK-TNCN, 01/NTNN, tạm nộp TNDN) **+ file XML để nộp thẳng** (A6 — chưa có, xem dưới) |
| 4. Ký + nộp | Chủ dự án | Cổng thuế → Nộp tờ khai XML → chọn file → **cắm USB VNPT-CA → Ký → nhập PIN** → Nộp. Chưa có XML thì "Khai trực tuyến", chép số theo TÊN chỉ tiêu |
| 5. Nộp tiền | Chủ dự án | Lập giấy nộp tiền trên cổng, ký USB |

**✅ 20/10/2026 — XML 01/GTGT (TT80) ĐÃ CÓ:** trang in quý → nút **"Xuất XML 01/GTGT"** (`src/lib/xml01Gtgt.ts`). Cấu trúc theo XSD chuẩn `01_GTGT_TT80_283` (đã kiểm hợp lệ bằng lược đồ trong HTKK), mã tờ khai 842, CQT 50115, ngành nghề "00". Đã thử đưa lên cổng (dichvucong.gdt.gov.vn → Thủ tục 1.007014 → 01/GTGT TT80 → **Nộp XML** → View Form Xml): cổng đọc đúng CQT, Quý 3/2026, tờ khai chính thức. Ký số: chứng thư VNPT-CA SHA2 MST 0402353502 còn hạn đến 28/08/2028, USB đang cắm, VNPT-CA Plugin chạy. **Mỗi quý: Xuất XML → Chọn tệp → View Form Xml (soát số) → Ký hồ sơ (PIN) → Nộp tờ khai.** Tệp quý 3: `D:\Coastal Land\Kế toán\To khai XML\`.

**✅ ĐÃ NỘP 20/10/2026 ~14:28 — 01/GTGT Q3/2026 bằng XML của CRM, ký VNPT. Mã hồ sơ G12.18-261020-00178534.** Bài học: XML phải khớp tuyệt đối tệp mẫu cổng tạo (bước kê khai trực tuyến → "Tải về"): không `id` trên HSoKhaiThue, có `<CKyDTu/>` rỗng, ngày lập dd/mm/yyyy, tháng từ/đến mm/yyyy, ct21 true/false, NNT theo tài khoản thuế. Lệch là cổng báo "Có lỗi hệ thống". Tệp mẫu cổng: `Downloads\842-1.007014-20261020142350.xml`.

**⚠️ Ký số (20/10/2026, đã xử lý — đã đổi sang VNPT, thư 03/TB-TĐT lúc 13:59):** cổng ký qua **CTSigningHub** (`localhost:32001`, cài lại 20/10 tại `C:\Program Files (x86)\CT\CTSigningHub`; báo "chưa bật Plugin" thì mở CTSigningHub trong Start). Tài khoản **Khai thuế điện tử** còn đăng ký chứng thư **Viettel-CA** (5404FFFE…, 24/08/2026) trong khi USB là **VNPT-CA** sê-ri **54010101F4015F4362DEF50FD9A2E558** (28/08/2026–28/08/2028) → báo "Không tìm thấy chữ ký số với serial đã chọn". Phải đổi CKS (Quản lý thông tin → Thay đổi thông tin dịch vụ → Thay đổi CKS — cần eSigner bản chính thức ở Trợ giúp cổng; hoặc tổng đài 024.730.55999 nhánh 1). Đổi xong mới ký + nộp tờ 01/GTGT Q3 (hạn 02/11/2026).

**Mẫu nào đang có trên phần mềm ngành thuế (đọc "Nội dung nâng cấp HTKK" trên gdt.gov.vn, 20/10):**
- HTKK **5.7.9 (07/10/2026)** đã có **01/NTNN, NCCNN** theo TT 89.
- **01/GTGT và 05/KK-TNCN: các bản 5.7.4 → 5.8.1 (16/10/2026) KHÔNG ghi là đã nâng cấp theo TT 89** (bản 5.7.5 vẫn ghi phụ lục giảm thuế "đính kèm 01/GTGT (TT80/2021)"). → Lúc khai quý 3, cổng hiện mẫu nào thì khai mẫu đó. Với Coastal Land số liệu hai mẫu như nhau ([32b], [34a] = 0); 05/KK chỉ khác mã chỉ tiêu → chép theo TÊN.

**VNPT Invoice (đọc 20/10):** tờ khai 01/ĐKTĐ-HĐĐT chấp nhận 04/09/2026 · hóa đơn GTGT có mã CQT · chứng thư VNPT-CA đến 28/08/2028 · dải ký hiệu **C26TCV** (mẫu "HD GTGT", 1/001), chưa phát hành tờ nào → web đã sửa `KY_HIEU_HOA_DON = "1C26TCV"`.

**CẦN CHỦ DỰ ÁN BỔ SUNG:**
1. **File XML mẫu** cho A6 (không đoán cấu trúc): cài HTKK 5.8.1 (gdt.gov.vn → Hỗ trợ kê khai), lập thử 01/GTGT quý 3, 05/KK-TNCN quý 3, 01/NTNN tháng 9 → "Kết xuất XML" → để vào `D:\Coastal Land\Kế toán\XML mẫu\`.
2. **File "Tải mẫu upload"** của VNPT (Upload lô hóa đơn) — để file xuất hóa đơn của web đúng cột, có dấu.
3. **Ảnh xem trước mẫu hóa đơn HD GTGT** (trình sửa mẫu VNPT khóa trong khung, Claude không đọc được) — để soát tên, MST, địa chỉ, số tài khoản ngân hàng, logo.
4. Vercel 14/9 + Supabase 16/9 trả bằng **thẻ công ty?** → có thì khai 01/NTNN tháng 9, **hạn 20/10/2026**.
5. Duyệt cho Claude nhập 5 hóa đơn vào quý 3 (mục 0.1) — hoặc tự nhập.
6. Kế toán chốt: Vercel/Supabase khai Phần I hay Phần II của 01/NTNN, NCCNN.

**20/10 đã nhập CRM:** 5 hóa đơn vào Q3 (đối chiếu bản in: 5 chứng từ, [23] 7.021.988 · [24][25] 600.660 · [43] 600.660) · 01/NTNN tháng 9: Vercel KBVO2ERL-0002 $20 × 25.607 (NHNN 14/09) + Supabase ZKLSJK-00004 $25 × 25.626 (NHNN 16/09) → GTGT nộp thay 63.866 · TNDN 60.673 · **tổng nộp 124.539** (khấu trừ GTGT vào quý nộp tiền = Q4). Hóa đơn định kỳ hằng tháng: Vercel (ngày 14) + Supabase (ngày 16) → 01/NTNN mỗi tháng, hạn ngày 20 tháng sau.
**⚠️ 20/10 chiều — số 01/NTNN tháng 9 ở trên CHƯA ĐƯỢC NỘP, CHƯA CHỐT.** Đối chiếu văn bản gốc: NĐ 252/2026 Điều 43–45
(tổ chức khấu trừ mua dịch vụ nhà cung cấp nước ngoài trên nền tảng số phải khấu trừ, nộp thay GTGT + TNDN; doanh thu =
"số tiền tổ chức Việt Nam chi trả"; khai từng lần, nhiều lần/tháng thì theo tháng) · NĐ 320/2025 Điều 12.3: TNDN dịch vụ 5% ·
TT 20/2026 Điều 7: hợp đồng NET → quy đổi ngược · TT 69/2025 Điều 9.6.a: bảng tỷ lệ GTGT nhà thầu **trừ** dịch vụ qua nền tảng
số · TT 69 Điều 6: khấu trừ cần chứng từ nộp thay. → Tỷ lệ GTGT (5%/10%) + có quy đổi ngược không: **chờ Thuế cơ sở 4 trả lời**.
HTKK 5.8.1 (đã cài, `C:\Program Files (x86)\HTKK`): mẫu 01/NTNN, NCCNN TT89 áp dụng **từ kỳ 01/10/2026**; kỳ 9/2026 dùng
01/NTNN TT80 (MaToKhai 838, XML 2.5.1, khung `InterfaceTemplates\xml\01_NTNN_TT80_xml_251.xml`, XSD `Validate\01_NTNN_TT80_251.xsd`).
Cổng dichvucong chỉ cho **Nộp XML** với mẫu này. HTKK đòi quyền quản trị → Claude không điều khiển được; Claude dựng XML từ XSD.
Mã CQT Thuế cơ sở 4 ĐN = **50115**. .NET 3.5 đã cài (Windows 11 26H1 phải dùng bộ cài riêng của Microsoft).

**20/10 tối — XML 01/NTNN, NCCNN (TT89) ĐÃ CÓ, CHƯA NỘP THỬ:** trang in tháng (`?thang=`) → nút **"Xuất XML 01/NTNN"**
(`src/lib/xml01Ntnn.ts`), chỉ hiện từ kỳ 10/2026. MaToKhai 2012 · XML 3.0.9 · kieuKy M · phần chung `TKhaiThue_DBHC.xsd`
(NNT ghi `tenXaNNT` + `maXaNNT` 50115012, không có `phuongXa`). Phần I/II theo ô chọn ở trang in; phần không khai để một dòng
toàn `xsi:nil`; dòng Phần II bắt buộc thuộc tính `id`. Ngành nghề cột (1b) theo `TY_LE[loai].nganh` (01 dịch vụ · 16 bản quyền —
**chưa chốt**). Kiểm XSD `01_NTNN_NCCNN_TT89_309`: 0 lỗi cả Phần I, Phần II, tháng trống (phải bỏ `<CKyDTu/>` trước khi kiểm vì
DBHC.xsd không có thẻ này). **Không lấy được tệp mẫu từ cổng:** với 01/NTNN, NCCNN (TT89) cổng KHÓA "Kê khai trực tuyến", chỉ cho
"Nộp XML" → không có nút "Tải về". Tệp đối chiếu duy nhất là **HTKK 5.8.1 → lập thử 01/NTNN, NCCNN tháng 10/2026 → Kết xuất XML**
(HTKK đòi quyền quản trị — chủ dự án chạy, để tệp vào `D:\Coastal Land\Kế toán\To khai XML\`). Chưa đối chiếu thì CHƯA nộp.
Còn hở: có giữ `<CKyDTu/>` không, cách ghi `id`/`ID` dòng, `ct8`/`ct11` ghi 5 hay 0.05.
Chủ dự án không đăng nhập được HTKK (20/10) → đã so thứ tự thẻ với khung HTKK `InterfaceTemplates\xml\01_NTNN_NCCNN_TT89_xml_309.xml`:
khớp, chỉ khác phần tùy chọn (GiaHan, DLyThue — tờ 01/GTGT đã nộp cũng bỏ) và cuối tệp (khung HTKK có `<PLuc/>`, không có `CKyDTu`).
Lần nộp đầu: nếu cổng báo "Có lỗi hệ thống" thì thử bỏ `<CKyDTu/>` trước.

**Việc mã còn lại:** CRM tự lấy tỷ giá NHNN theo NGÀY HÓA ĐƠN (chủ dự án yêu cầu 20/10; hiện nút chỉ lấy tỷ giá hôm nay) · thông báo "Đã lưu ✓" cũ không xóa khi nhập tiếp (làm lẫn lần lưu hỏng).

**Đã xử lý, không cần làm:** Anthropic (MST VN 9000020034, tự thu 10%) và Google (Google Việt Nam, hóa đơn GTGT trong nước) — không khai thay. Adobe Photoshop 07/9 xuất cho "TRUONG TUNG", không tên công ty → không tính chi phí công ty; muốn tính thì đổi thông tin thanh toán Adobe sang tên công ty + MST.

**Chưa kiểm được bằng văn bản gốc (không đưa vào mã):**
- Phụ lục giảm thuế 8%: bản in vẫn theo Mẫu 01 Phụ lục III Nghị định 174/2025/NĐ-CP — chưa đối chiếu xem TT 89 có thay mẫu này không.
- Cổng thuế / HTKK đã nâng cấp đủ mẫu TT 89 chưa — bài tư vấn nói chưa xong; lúc khai phải nhìn mẫu trên cổng.
- Nghị định 254/2026/NĐ-CP (hóa đơn, thay NĐ 123/2020) — "Bảng thông tin chi tiết giao dịch" thay hóa đơn khách lẻ: mới đọc tóm tắt, chưa đọc văn bản gốc → hỏi kế toán cùng C2.

### Giai đoạn E — Cuối năm
E1 trước 15/12: hỏi kế toán thuế suất 2027 (8% hết 31/12/2026) → sửa `src/lib/thue.ts`, đổi ký hiệu
hóa đơn `1C27TCL`, đăng ký dải mới VNPT · E2 trước 31/1/2027: tờ khai Q4 + tạm nộp TNDN đủ 80% ·
E3 trước 31/3/2027: quyết toán TNDN + BCTC + quyết toán TNCN (nếu có).

---

## 1. Thông tin người nộp thuế

| | |
|---|---|
| Tên | CÔNG TY TNHH BẤT ĐỘNG SẢN COASTAL LAND |
| MST | 0402353502 |
| Cơ quan thuế quản lý | Thuế cơ sở 4 thành phố Đà Nẵng — **08 Nguyễn Nhàn, phường Cẩm Lệ, TP Đà Nẵng · ĐT 0236 3674 198** · quản lý địa bàn phường Liên Chiểu, Hải Vân, Cẩm Lệ, Hòa Xuân, xã Hòa Vang, Hòa Tiến, Bà Nà (Quyết định 1378/QĐ-CT ngày 30/6/2025, hiệu lực 01/7/2025) |
| Kỳ khai GTGT | **Theo quý** (doanh nghiệp mới thành lập, doanh thu năm trước ≤ 50 tỷ) |
| Phương pháp GTGT | Khấu trừ |
| Thuế suất GTGT dịch vụ đăng tin | **8%** (Nghị quyết 204/2025/QH15) — **hết 31/12/2026**, từ 2027 có thể quay lại 10% |
| Thuế suất TNDN | **15%** (doanh thu năm ≤ 3 tỷ — Luật 67/2025/QH15) |
| Hóa đơn điện tử | VNPT Invoice — ký hiệu xem `KY_HIEU_HOA_DON` trong `src/lib/thue.ts` |
| Số liệu trên web | **`/admin/hoa-don-thue`** |

---

## 2. LỊCH THUẾ CẢ NĂM (áp cho năm dương lịch)

| Hạn chót | Việc | Loại |
|---|---|---|
| **20 hằng tháng** | Tờ khai 01/NTNN + nộp thuế nhà thầu tháng trước (chỉ tháng có trả tiền Anthropic/Vercel/Supabase…) | Nhà thầu |
| **30/4** | Tờ khai GTGT **quý 1** · nộp tiền GTGT · tạm nộp TNDN quý 1 · tờ khai TNCN quý 1 (nếu có khấu trừ) | GTGT · TNDN · TNCN |
| **31/7** | Như trên cho **quý 2** | |
| **31/10** | Như trên cho **quý 3** ← **việc kế tiếp của năm 2026** | |
| **31/1 năm sau** | Như trên cho **quý 4** · tạm nộp 4 quý TNDN phải đủ **≥ 80%** số quyết toán năm | |
| **31/3 năm sau** | **Quyết toán TNDN** + **Báo cáo tài chính** · **Quyết toán TNCN** | TNDN · TNCN |

> Hạn rơi vào thứ Bảy, Chủ nhật, ngày lễ → lùi sang ngày làm việc kế tiếp.
> **Quý không có doanh thu vẫn phải nộp tờ khai GTGT** (khai số 0).

---

## 3. THUẾ GTGT (VAT) — tờ khai 01/GTGT, theo quý

### 3.1 Số liệu lấy ở đâu
Mở `/admin/hoa-don-thue` → chọn **Quý / Năm**. Khối **"Tờ khai thuế GTGT — mẫu 01/GTGT"** đã
tính sẵn các chỉ tiêu; bấm **Tải CSV** để lưu bản giấy làm việc.

| Nguồn | Bảng dữ liệu | Ai ghi |
|---|---|---|
| Đầu ra (bán gói tin, dịch vụ B2B) | `doanh_thu` | Web tự ghi khi duyệt tin; B2B nhập tay |
| Đầu vào trong nước | `hoa_don_vao` | Tải XML hóa đơn hoặc nhập tay |
| Thuế GTGT nộp thay nhà thầu nước ngoài (đã nộp) | `hoa_don_ngoai` | Mục cuối trang — tự cộng vào [23][24][25] |

### 3.2 Mẫu — các chỉ tiêu cần điền

| Chỉ tiêu | Nội dung | Lấy từ |
|---|---|---|
| [21] | Không phát sinh hoạt động trong kỳ | Chỉ tích khi quý trắng hoàn toàn |
| [22] | Thuế còn được khấu trừ kỳ trước chuyển sang | = chỉ tiêu [43] của tờ khai quý trước |
| [23] | Giá trị HHDV mua vào | Web |
| [24] | Thuế GTGT mua vào | Web |
| [25] | Thuế GTGT được khấu trừ kỳ này | Web |
| [32] | Doanh thu chịu thuế suất 8%/10% | Web (🔎 trên eTax 8% thường nằm chung dòng 10% + phụ lục giảm thuế) |
| [33] | Thuế GTGT đầu ra | Web |
| [34] [35] | Tổng doanh thu / tổng thuế đầu ra | Web |
| [36] | Thuế phát sinh = [35] − [25] | Web |
| [40] | **Thuế còn phải nộp** | Web — số này đi nộp tiền |
| [43] | Thuế còn được khấu trừ chuyển kỳ sau | Web — ghi lại để điền [22] quý sau |

**Phụ lục kèm theo:** 🔎 **Phụ lục giảm thuế GTGT** theo Nghị quyết 204/2025/QH15 (kỳ nào
xuất hóa đơn 8% thì kèm). Bảng kê hóa đơn mua vào/bán ra **không còn bắt buộc** nộp kèm —
nhưng vẫn lưu bản CSV "Bảng kê hóa đơn đầu ra" và "Sổ khách hàng theo thuế" làm hồ sơ.

### 3.3 Các bước mỗi quý
1. **Trước hạn 5 ngày:** mở `/admin/hoa-don-thue` → khối **"Việc thuế cần làm"** phải xanh hết
   (hóa đơn đã xuất đủ — xem cột "Hóa đơn" của **Sổ khách hàng theo thuế**; hóa đơn mua vào đã nhập đủ).
2. Đối chiếu tổng tiền hóa đơn đầu ra trên web với **tra cứu hóa đơn trên cổng hóa đơn điện tử**
   (`hoadondientu.gdt.gov.vn`) — lệch là thiếu hóa đơn, phải tìm ra trước khi khai.
3. Điền tờ khai 01/GTGT trên cổng thuế (mục 6) theo bảng 3.2, đính phụ lục giảm thuế.
4. Ký số → nộp → chờ **Thông báo chấp nhận** (email về hộp thư đăng ký với thuế).
5. Nộp tiền chỉ tiêu [40] (nếu > 0) cùng hạn.
6. Lưu: file XML tờ khai + thông báo chấp nhận + giấy nộp tiền + CSV của web vào thư mục `Thuế/2026/Q3/`.

---

## 4. THUẾ TNDN

### 4.1 Tạm nộp hằng quý — **không nộp tờ khai, chỉ nộp tiền**
- Số tiền: khối **"Tạm nộp thuế TNDN"** trên `/admin/hoa-don-thue` = (doanh thu − chi phí có hóa đơn) × 15%.
- Hạn: cùng hạn tờ khai GTGT quý (30/4 · 31/7 · 31/10 · 31/1).
- Giấy nộp tiền: tiểu mục TNDN, kỳ thuế ghi quý.
- **Luật 80%:** tổng tạm nộp 4 quý phải ≥ 80% thuế quyết toán năm; thiếu phần nào thì
  phần thiếu bị tính tiền chậm nộp từ ngày hết hạn quý 4. → Quý 4 nên nộp bù cho đủ.

⚠️ Số trên web **chưa gồm** lương, bảo hiểm, khấu hao, thuê văn phòng không có hóa đơn
trên web… nên thường **cao hơn** thực tế — nộp dư an toàn hơn nộp thiếu, quyết toán sẽ trừ lại.

### 4.2 Quyết toán năm — hạn 31/3 năm sau
| Hồ sơ | Ghi chú |
|---|---|
| Tờ khai quyết toán **03/TNDN** | 🔎 kiểm lại mã mẫu theo Thông tư 89/2026/TT-BTC |
| Phụ lục **03-1A/TNDN** (kết quả kinh doanh) | Doanh thu, giá vốn, chi phí |
| Phụ lục chuyển lỗ 03-2/TNDN | Chỉ khi năm trước lỗ |
| **Báo cáo tài chính năm** | Doanh nghiệp nhỏ và vừa: chế độ kế toán 🔎 (Thông tư 133/2016 hoặc thông tư thay thế) — gồm Bảng cân đối, Kết quả kinh doanh, Thuyết minh, Bảng cân đối tài khoản |

Chi phí được trừ phải có **hóa đơn hợp lệ** + **thanh toán không dùng tiền mặt** nếu hóa đơn
từ 5 triệu trở lên 🔎 (ngưỡng có thể đã đổi theo luật mới — kế toán xác nhận).

---

## 5. THUẾ TNCN — công ty khấu trừ thay người lao động

> **Chỉ phát sinh khi công ty TRẢ THU NHẬP cho cá nhân** (lương giám đốc, nhân viên, cộng tác
> viên, hoa hồng môi giới). Hiện web **chưa có mục TNCN** — số liệu lương nằm ngoài hệ thống,
> chủ dự án cung cấp (mục 7).

### 5.1 Luật áp dụng năm 2026 (Luật Thuế TNCN 2025, áp dụng từ kỳ tính thuế 2026)
- **Giảm trừ gia cảnh:** bản thân **15,5 triệu/tháng** · mỗi người phụ thuộc **6,2 triệu/tháng**.
- **Biểu lũy tiến 5 bậc:** 5% · 10% · 20% · 30% · 35% 🔎 (ngưỡng từng bậc tra lại văn bản gốc).
- Thu nhập tính thuế = lương − BHXH/BHYT/BHTN phần người lao động đóng − giảm trừ gia cảnh.
- **Cộng tác viên / hợp đồng dưới 3 tháng:** khấu trừ 10% trên mỗi lần trả từ 2 triệu trở lên 🔎
  (ngưỡng 2 triệu theo quy định cũ — kiểm lại). Người cam kết thu nhập thấp nộp mẫu 08/CK-TNCN.

### 5.2 Khai theo quý — tờ khai **05/KK-TNCN**
- Cùng kỳ và cùng hạn với GTGT (quý). **Từ quý 3/2026 (mẫu TT 89/2026): quý nào có trả tiền lương, tiền công là phải khai, kể cả không khấu trừ đồng nào.** Quý không trả thu nhập thì không khai.
- Mẫu điền: số người nhận thu nhập · tổng thu nhập chịu thuế · số người bị khấu trừ ·
  tổng thuế đã khấu trừ (tách nhóm cư trú có HĐLĐ ≥ 3 tháng / không HĐ hoặc < 3 tháng / không cư trú).

### 5.3 Quyết toán năm — **05/QTT-TNCN**, hạn 31/3 năm sau
- Bắt buộc nếu trong năm **có trả thu nhập**, kể cả khi không khấu trừ đồng nào.
- Kèm **05-1/BK-QTT-TNCN** (người có HĐLĐ ≥ 3 tháng), **05-2/BK-QTT-TNCN** (không HĐ / < 3 tháng),
  **05-3/BK-QTT-TNCN** (người phụ thuộc).
- Người lao động ủy quyền quyết toán → mẫu **08/UQ-QTT-TNCN**.
- Người phụ thuộc phải được đăng ký trước (mẫu **07/ĐK-NPT-TNCN**) thì mới được giảm trừ.

---

## 6. NỘP QUA MẠNG — CHUẨN BỊ MỘT LẦN, DÙNG MÃI

### 6.1 Ba thứ phải có
| Thứ | Để làm gì | Ghi chú |
|---|---|---|
| **Chữ ký số (CKS) của công ty** | Ký tờ khai, ký hóa đơn, ký giấy nộp tiền | USB token hoặc **ký số từ xa** (VNPT SmartCA, Viettel MySign…). Kiểm hạn sử dụng — hết hạn là không nộp được |
| **Tài khoản thuế điện tử** của MST | Đăng nhập cổng | Đăng ký bằng CKS; email nhận thông báo phải là email công ty đang đọc |
| **Tài khoản ngân hàng công ty đã liên kết nộp thuế điện tử** | Nộp tiền thuế | Đăng ký tại ngân hàng hoặc ngay trên cổng thuế |

### 6.2 Cổng nộp
- Năm 2026 việc khai thuế điện tử **đã chuyển sang Cổng dịch vụ công của ngành thuế**
  (`dichvucong.gdt.gov.vn`); cổng cũ `thuedientu.gdt.gov.vn` vẫn còn đường vào 🔎 — dùng cổng nào
  thì xem thông báo trên trang chủ cơ quan thuế lúc nộp.
- Đăng nhập bằng **MST + mật khẩu** hoặc **tài khoản định danh điện tử của doanh nghiệp (VNeID)**.
- Ứng dụng **HTKK** (phần mềm hỗ trợ kê khai) dùng để soạn tờ khai ra file XML rồi tải lên,
  hoặc **khai trực tuyến** thẳng trên cổng. Đọc file XML bằng **iTaxViewer**.

### 6.3 Trình tự một lần nộp
1. Cắm token / mở app ký số từ xa.
2. Đăng nhập cổng → **Khai thuế** → chọn tờ khai (01/GTGT, 05/KK-TNCN…) → chọn **kỳ (quý/năm)**,
   **tờ khai lần đầu** (sai thì nộp **tờ khai bổ sung**, không nộp lại lần đầu).
3. Điền / tải XML → **Ký điện tử** → **Nộp**.
4. Chờ email: **Thông báo tiếp nhận** rồi **Thông báo chấp nhận** (thường trong ngày).
5. **Nộp thuế** → lập giấy nộp tiền → chọn ngân hàng → ký → ngân hàng xác nhận.
6. Tra cứu nghĩa vụ thuế trên cổng: số đã nộp phải khớp số phải nộp, không còn nợ.

### 6.4 Phạt khi trễ (để biết mà tránh)
- Chậm **nộp tờ khai**: phạt hành chính theo số ngày trễ 🔎 (mức theo Nghị định xử phạt hiện hành).
- Chậm **nộp tiền**: tiền chậm nộp **0,03%/ngày** trên số thuế chậm nộp.

---

## 7. CHỦ DỰ ÁN CẦN CUNG CẤP (đánh dấu khi đã gửi)

**Hồ sơ pháp lý / truy cập — gửi MỘT lần:**
- [ ] Giấy chứng nhận ĐKDN (ngày thành lập, vốn điều lệ, ngành nghề) — để chốt kỳ khai và ưu đãi nếu có
- [ ] Thông báo phương pháp tính thuế / kỳ khai thuế của cơ quan thuế (nếu có văn bản)
- [ ] Loại chữ ký số đang dùng (token / ký từ xa), nhà cung cấp, **ngày hết hạn**
- [ ] Đã có tài khoản thuế điện tử chưa · email nhận thông báo thuế là email nào
- [ ] Ngân hàng nào đã liên kết nộp thuế điện tử
- [ ] Đã nộp tờ khai nào rồi trong năm 2026 (Q1, Q2?) — chụp danh sách "Tra cứu tờ khai" trên cổng
- [ ] Số chỉ tiêu [43] của tờ khai GTGT gần nhất (thuế được khấu trừ chuyển sang)
- [ ] Công ty có kế toán / dịch vụ kế toán thuê ngoài không — ai ký báo cáo tài chính

> ⛔ **KHÔNG dán mật khẩu, mã PIN token vào chat hay vào git.** Chỉ cần cho biết "đã có / chưa có".

**Mỗi quý:**
- [ ] Hóa đơn mua vào không có trên web (thuê văn phòng, điện thoại, quảng cáo Google Ads, thiết bị…) — gửi XML hoặc PDF
- [ ] Doanh thu ngoài web (dịch vụ B2B, môi giới) chưa nhập
- [ ] **Bảng lương:** họ tên, MST cá nhân/CCCD, loại hợp đồng, lương từng tháng, BHXH, số người phụ thuộc
- [ ] Tiền trả cộng tác viên / hoa hồng môi giới cá nhân (người nhận, số tiền, ngày trả)
- [ ] Sao kê tài khoản ngân hàng công ty của quý — để đối chiếu thu chi

**Cuối năm (trước 15/3):**
- [ ] Danh sách tài sản cố định (máy tính, thiết bị > 30 triệu) để tính khấu hao
- [ ] Chi phí không có trên web: lương, bảo hiểm, thuê nhà, phí ngân hàng
- [ ] Giấy ủy quyền quyết toán TNCN (08/UQ-QTT-TNCN) của từng nhân viên nếu họ ủy quyền

---

## 8. Ghi chú khác
- **Lệ phí môn bài:** đã **bãi bỏ từ 01/01/2026** (Nghị quyết 198/2025/QH15, Nghị định 362/2025/NĐ-CP) —
  không khai, không nộp.
- **Thuế nhà thầu nước ngoài:** quy trình đã có ở mục cuối `/admin/hoa-don-thue` (tờ khai 01/NTNN
  theo tháng, hạn ngày 20 tháng sau). Thuế GTGT nộp thay đã nộp được cộng vào khấu trừ ở tờ khai GTGT.
- **Sang 2027:** sửa `THUE_SUAT_GTGT` và `HAN_THUE_SUAT` trong `src/lib/thue.ts` theo thuế suất mới,
  đổi ký hiệu hóa đơn năm mới và đăng ký dải mới bên VNPT.

## 9. Nguồn tra cứu (02/10/2026)
- Luật Thuế TNCN 2025 — biểu 5 bậc, giảm trừ gia cảnh: thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/ho-tro-phap-luat/chinh-sach-moi/100277
- Bãi bỏ lệ phí môn bài từ 2026: vneconomy.vn/tu-2026-doanh-nghiep-ho-kinh-doanh-chinh-thuc-khong-phai-khai-va-nop-le-phi-mon-bai.htm
- Luật Quản lý thuế 108/2025/QH15: xaydungchinhsach.chinhphu.vn/toan-van-luat-quan-ly-thue-co-hieu-luc-tu-1-7-2026-119260626174633402.htm
- Hạn nộp các loại thuế 2026: amis.misa.vn/50915
- Nộp thuế điện tử 2026: aztax.com.vn/nop-thue-dien-tu/
- **Văn bản gốc TT 89/2026/TT-BTC** (đọc 19/10/2026): vanban.chinhphu.vn (docid=218974) → datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/89-btc.signed.pdf · đính chính QĐ 2551/QĐ-BTC: congbao.chinhphu.vn/van-ban/quyet-dinh-so-2551-qd-btc-470485.htm
