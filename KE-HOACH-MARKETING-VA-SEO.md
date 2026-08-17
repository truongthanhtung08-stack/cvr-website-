# KẾ HOẠCH ĐƯA COASTAL LAND ĐẾN KHÁCH HÀNG

> Lập ngày 17/08/2026 · cho giai đoạn sau khi hoàn thiện 500+ tin đăng.
> Dành cho mô hình **một người vận hành**, ngân sách khởi đầu gần bằng 0.

---

## 0. TÌNH TRẠNG THẬT HIỆN NAY (đo trực tiếp trên coastalland.vn)

| Hạng mục | Tình trạng |
|---|---|
| Domain + HTTPS | ✅ coastalland.vn chạy ổn định trên Vercel |
| Cho Google lập chỉ mục | ✅ đã bật từ 01/08/2026 |
| `robots.txt` | ✅ đúng chuẩn, chặn /admin /api /tai-khoan |
| `sitemap.xml` | ✅ **84 địa chỉ**, tự làm mới mỗi giờ |
| Thẻ chia sẻ Zalo/Facebook (OG) | ✅ có ảnh 1200×630 |
| Thẻ xác minh Search Console | ✅ đã cắm sẵn trong mã nguồn |
| Trang danh mục theo loại hình | ✅ có sẵn (`/mua-ban/can-ho-chung-cu`…) |
| **Tin đăng thật** | ⚠️ **mới 8 tin** — đây là điểm nghẽn lớn nhất |
| **Google Search Console** | ❌ **chưa nộp sitemap** |
| **Google Business Profile** | ❌ **chưa có** |
| Giấy ĐKKD | ❌ chưa có → chặn Zalo OA doanh nghiệp, Facebook verify, Google Ads |

**Kết luận:** phần kỹ thuật đã sẵn sàng. Thứ đang thiếu là **nội dung (tin đăng)** và
**việc khai báo với Google**. Hai việc này không tốn tiền, chỉ tốn thao tác.

---

## 0B. NỀN TẢNG KỸ THUẬT SEO — cái này quyết định mọi thứ phía sau

Quảng cáo tắt là hết khách. **Nền tảng kỹ thuật thì làm một lần, ăn mãi.** Đây là phần
đáng đầu tư nhất, và tin tốt là web đã có gần đủ.

### Đã có sẵn (kiểm tra thật trên web ngày 17/08/2026)

| Hạng mục | Vì sao quan trọng |
|---|---|
| ✅ **Địa chỉ chuẩn tắc (canonical)** riêng từng trang | Không bị Google coi là trùng lặp — lỗi giết SEO phổ biến nhất |
| ✅ **Sitemap tự làm mới mỗi giờ** | Tin đăng hôm nay, mai Google đã biết. Sitemap tĩnh thì tin mới vô hình |
| ✅ **Khai báo Tổ chức + Sàn BĐS** (`Organization`, `RealEstateAgent`) | Dựng "bảng thương hiệu" bên phải kết quả Google; có địa chỉ + hotline khớp Google Business |
| ✅ **Ô tìm kiếm trong kết quả Google** (`SearchAction`) | Khách gõ thẳng từ Google vào web mình |
| ✅ **Khai báo từng tin** (`RealEstateListing` + `Offer`) | Tin có thể hiện kèm giá, diện tích ngay trên Google |
| ✅ **Đường dẫn phân cấp** (`BreadcrumbList`) | Google hiện đường dẫn thay vì URL dài loằng ngoằng |
| ✅ **Trang danh mục theo loại hình** | Đây là trang chiếm từ khoá chính, không phải trang chủ |
| ✅ **Ảnh tự nén AVIF/WebP**, tải theo kích thước màn hình | Tốc độ là yếu tố xếp hạng; ảnh nặng giết điểm trên điện thoại |
| ✅ **Chặn trang mỏng** khỏi chỉ mục (`/tim-kiem`, `/tin-luu`, `/so-sanh`) | Trang sinh theo bộ lọc bị coi là rác, kéo tụt cả site |
| ✅ **Thẻ chia sẻ Zalo/Facebook** (ảnh 1200×630) | Link dán vào Zalo hiện đẹp → nhiều người bấm hơn |

Đây là mức nền tảng **tốt hơn phần lớn sàn nhỏ ở Việt Nam**. Không phải làm lại gì.

### Vừa bổ sung hôm nay

- **9 trang thông tin vào sitemap** — Điều khoản, Quy chế, Liên hệ, FAQ… Google dùng
  những trang này để chấm **độ tin cậy** của một sàn (có địa chỉ thật, có điều khoản,
  có kênh khiếu nại). Thiếu là mất điểm không đáng.
- **Khai báo FAQ cho Google** (`FAQPage`) ở trang Câu hỏi thường gặp → câu hỏi có thể
  hiện **thẳng trong kết quả tìm kiếm**, chiếm nhiều chỗ và kéo lượt bấm.

### Việc kỹ thuật còn nên làm (xếp theo giá trị)

| # | Việc | Giá trị |
|---|---|---|
| 1 | **Nộp sitemap trong Search Console** | Không làm thì mọi thứ trên đây Google phát hiện rất chậm |
| 2 | **Gắn Google Analytics 4** | Không đo được thì không biết tiêu tiền đúng hay sai |
| 3 | Trang **khu vực riêng** (`/mua-ban/da-nang`, `/mua-ban/hue`…) | Hiện lọc bằng tham số `?kv=` — Google không xếp hạng tốt. Có trang riêng sẽ ăn nhóm từ khoá "nhà đất + tên tỉnh" |
| 4 | **Tin đã bán → chuyển hướng** thay vì để trang chết | Giữ được sức mạnh SEO đã tích luỹ của tin đó |
| 5 | **Đánh giá của khách** (`AggregateRating`) | Hiện sao vàng trong kết quả tìm kiếm — chỉ làm khi có đánh giá thật |

> Mục 3 là việc đáng làm nhất sau khi đủ 500 tin — anh nói em làm.

---

## 1. NGUYÊN TẮC — ĐỌC TRƯỚC KHI LÀM BẤT CỨ GÌ

**1. SEO không có đường tắt.** Site mới cần **3–6 tháng** mới có thứ hạng thật.
Bắt đầu càng sớm càng tốt, nhưng đừng kỳ vọng tháng đầu ra khách.

**2. Đừng đăng 500 tin trong một ngày.** Site mới đổ hàng loạt nội dung là dấu hiệu
Google cảnh giác, và bot cũng không kịp đọc hết. **Đăng 30–50 tin/ngày trong 10–15 ngày.**
Đều đặn quan trọng hơn nhanh.

**3. Một tin đăng tốt đáng giá bằng mười tin cẩu thả.** Tin thiếu ảnh, mô tả một dòng,
địa chỉ chung chung thì Google xếp vào loại "nội dung mỏng" và **kéo tụt cả website**.

**4. Việc nào không cần ĐKKD thì làm trước.** Danh sách ở mục 2 và 3 đều làm được ngay.

**5. Có tiền thì tiêu đúng thứ tự, đừng tiêu sớm.** Đưa khách mua vào một sàn có 8 tin là
cách nhanh nhất để họ không quay lại. Với sàn giao dịch, **đồng tiền đầu tiên nên tiêu để
có NGUỒN TIN, không phải để có khách xem** — xem mục 7.

---

## 2. GIAI ĐOẠN 1 — LÊN GOOGLE (làm NGAY tuần này, trước khi đăng tin)

### 2.1. Google Search Console — quan trọng nhất, làm đầu tiên

Đây là kênh Google báo cho mình biết nó nhìn thấy gì trên web.

1. Vào **search.google.com/search-console**, đăng nhập bằng Gmail
2. Chọn **Thêm tài sản** → kiểu **Tiền tố URL** → nhập `https://coastalland.vn`
3. Chọn cách xác minh **Thẻ HTML** → **đã cắm sẵn trong mã nguồn rồi**, bấm Xác minh là xong
4. Vào mục **Sơ đồ trang web** → nhập `sitemap.xml` → **Gửi**
5. Vào **Kiểm tra URL** → dán `https://coastalland.vn` → bấm **Yêu cầu lập chỉ mục**

Làm xong 5 bước này, Google thường ghé trong **2–7 ngày**.

> Sau đó mỗi tuần vào xem mục **Trang** một lần: bao nhiêu trang đã lập chỉ mục, trang nào
> bị loại và vì sao. Đây là bảng điều khiển SEO của mình.

### 2.2. Google Business Profile — kênh mạnh nhất cho bất động sản địa phương

Khách gõ "bất động sản Đà Nẵng" trên điện thoại, khối bản đồ hiện **trước cả kết quả
tìm kiếm thường**. Miễn phí, và **không bắt buộc phải có ĐKKD**.

1. Vào **business.google.com** → Tạo hồ sơ
2. Tên: **Coastal Land** (đúng như trên web, không thêm bớt)
3. Danh mục: *Dịch vụ bất động sản* / *Cổng thông tin bất động sản*
4. Địa chỉ: **220 Nguyễn Mậu Tài, phường Hòa Xuân, thành phố Đà Nẵng**
5. Điện thoại: **0377 985 036** · Website: **coastalland.vn**
6. Xác minh: Google gửi thư bưu điện hoặc quay video cơ sở (mất 1–2 tuần)

Xác minh xong: đăng ảnh, cập nhật giờ làm việc, và **xin đánh giá từ khách thật**.
5 đánh giá thật giá trị hơn nhiều tháng SEO.

### 2.3. Bing Webmaster Tools — 5 phút, thêm ~5% lượt truy cập

Vào **bing.com/webmasters** → **Nhập từ Google Search Console** → xong. Không phải làm gì thêm.

### 2.4. Từ khoá — đánh vào đâu

Đừng đánh từ khoá lớn ("mua nhà", "bất động sản") — không bao giờ thắng nổi Batdongsan.
**Đánh từ khoá dài, có địa danh.** Đây là chỗ sàn nhỏ thắng được:

| Nhóm | Ví dụ | Trang đích |
|---|---|---|
| Loại hình + tỉnh | "bán căn hộ chung cư Đà Nẵng" | `/mua-ban/can-ho-chung-cu` |
| Loại hình + phường | "bán đất Hoà Xuân Đà Nẵng" | `/mua-ban?kv=Đà Nẵng//Hòa Xuân` |
| Địa danh dân gian | "nhà gần biển Mỹ Khê" | tin đăng có nhắc Mỹ Khê |
| Dự án | tên từng dự án | `/du-an/<slug>` |
| Câu hỏi | "thủ tục sang tên sổ đỏ Đà Nẵng" | bài viết `/tin-tuc` |

Bốn nhóm đầu **đã có trang sẵn**. Nhóm cuối là việc của mục 4.

---

## 3. GIAI ĐOẠN 2 — ĐĂNG 500 TIN (2–3 tuần)

### 3.1. Nhịp đăng

| Tuần | Việc | Số tin |
|---|---|---|
| 1 | Đà Nẵng — khu vực trung tâm | 150 |
| 2 | Đà Nẵng — vùng ven + Huế | 200 |
| 3 | Các tỉnh còn lại | 150 |

Mỗi ngày 30–50 tin. Đăng xong mỗi tuần, vào Search Console xem đã lập chỉ mục bao nhiêu.

### 3.2. Mỗi tin PHẢI đủ những thứ này

Không phải để đẹp — thiếu là Google bỏ qua tin đó:

- **Tiêu đề ≥ 30 ký tự**, có *loại hình + địa danh*: "Bán căn hộ 2PN view sông Hàn, Hải Châu, Đà Nẵng"
- **Mô tả ≥ 300 từ** — viết thật, nêu vị trí, pháp lý, tiện ích quanh đó kèm khoảng cách
- **≥ 5 ảnh thật**, ảnh đầu là ảnh đại diện
- **Địa chỉ tới cấp Phường/Xã** theo hệ mới (Tỉnh/Thành → Phường/Xã)
- **Đủ giá và diện tích** — thiếu là tin rơi khỏi bộ lọc
- **Đặc điểm, nội thất, tiện ích** — tick đủ, đây là dữ liệu để khách lọc ra tin

> 💡 Nhắc địa danh dân gian trong mô tả ("cách biển Mỹ Khê 600m", "gần cầu Rồng") là cách
> rẻ nhất để tin lên được các truy vấn địa phương. Ô tìm kiếm của web cũng dò vào mô tả.

### 3.3. Sau khi đăng xong

- Vào Search Console → **Kiểm tra URL** với 5–10 tin tiêu biểu → **Yêu cầu lập chỉ mục**
- Kiểm tra `coastalland.vn/sitemap.xml` — số địa chỉ phải nhảy lên hơn 500

---

## 4. GIAI ĐOẠN 3 — NỘI DUNG (chạy song song, dài hơi)

Tin đăng đưa khách **đang tìm mua**. Bài viết đưa khách **đang tìm hiểu** — nhóm này đông
gấp nhiều lần và ít sàn nào phục vụ tử tế.

**Mục tiêu: 12 bài trong 3 tháng — mỗi tuần 1 bài.** Viết trong `/admin/tin-tuc`.

Chủ đề nên viết, xếp theo độ dễ lên top:

1. **"Sáp nhập tỉnh 2025 ảnh hưởng gì tới sổ đỏ ở Đà Nẵng"** — đang rất nhiều người hỏi,
   gần như chưa sàn nào viết chuẩn. Web mình đã có sẵn dữ liệu 2 hệ địa giới.
2. "Giá đất phường Hoà Xuân, Cẩm Lệ 2026 — cập nhật thực tế"
3. "Thủ tục sang tên sổ đỏ tại Đà Nẵng: giấy tờ, chi phí, thời gian"
4. "Mua nhà gần biển Mỹ Khê: nên chọn khu nào, giá bao nhiêu"
5. "Kinh nghiệm mua đất nền Đà Nẵng — 7 điều kiểm tra trước khi đặt cọc"
6. "So sánh sống ở Hải Châu, Sơn Trà, Ngũ Hành Sơn"

Mỗi bài: **≥ 1.200 từ**, có ảnh, có bảng số liệu, **có link về trang danh mục và tin đăng**
liên quan. Bài viết dẫn khách sang tin đăng — đó mới là điểm quan trọng.

---

## 5. ZALO — kênh chốt khách số 1 tại Việt Nam

Người Việt xem web nhưng **chốt trên Zalo**. Đây là kênh phải làm.

### Làm ngay (không cần ĐKKD)

- Số **0377 985 036** đã có Zalo, và **nút Zalo trên web đã trỏ đúng** vào số này
- Đặt ảnh đại diện + tên hiển thị **Coastal Land** cho gọn gàng, chuyên nghiệp
- **Tham gia 10–15 nhóm Zalo bất động sản Đà Nẵng / Huế** — nhóm môi giới, nhóm cư dân
  → **Đừng spam.** Vào trả lời câu hỏi thật, ai hỏi thì gửi link tin phù hợp. Uy tín trước, khách sau.

### Khi có ĐKKD

- Tạo **Zalo OA** (Official Account) — có nút quan tâm, gửi tin hàng loạt, gắn được vào web
- **Zalo ZNS** — gửi thông báo tin mới cho khách đã lưu tìm kiếm (làm cùng tính năng Saved Search)

---

## 6. FACEBOOK

### Làm ngay

1. **Fanpage Coastal Land** — ảnh bìa, giới thiệu, nút *Xem website*
2. **Tham gia nhóm** BĐS Đà Nẵng, Huế (mỗi nhóm hàng chục nghìn thành viên)
   → Cùng nguyên tắc với Zalo: **giúp trước, bán sau**
3. Đăng đều **3–4 bài/tuần**: mỗi bài 1 tin đẹp, ảnh thật, giá rõ, kèm link về web

### Lưu ý về kỹ thuật

Ứng dụng Facebook (ID 2187272691890819) **chưa Live** vì vướng xác minh doanh nghiệp
(cần ĐKKD). Việc này **chỉ chặn nút "Đăng nhập bằng Facebook"**, không ảnh hưởng gì tới
fanpage hay quảng cáo.

### Quảng cáo

Xem mục **7** — có bảng thứ tự ưu tiên và ba mức ngân sách. Tóm tắt: quảng cáo **kéo người
bán** chạy được ngay; quảng cáo **kéo người mua** đợi đủ 300 tin.

---

## 6B. HỘI NHÓM & ĐÁNH LẺ — kênh 0 đồng mạnh nhất trong 3 tháng đầu

Google cần 3–6 tháng mới ra khách. Quảng cáo cần có hàng mới đáng tiêu tiền.
**Khoảng trống đó lấp bằng hội nhóm và đi từng người.** Đây cũng là cách lấy 500 tin đầu
tiên nhanh nhất, và là cách duy nhất không tốn đồng nào.

### 6B.1. Vào nhóm nào

| Loại nhóm | Tìm bằng từ khoá | Vì sao |
|---|---|---|
| **Nhóm môi giới khu vực** | "Môi giới BĐS Đà Nẵng", "Sale bất động sản Huế" | Nguồn tin đăng — quan trọng nhất |
| **Nhóm mua bán nhà đất** | "Nhà đất Đà Nẵng", "Mua bán nhà đất Sơn Trà / Hải Châu / Hoà Xuân" | Cả người bán lẫn người mua |
| **Nhóm cư dân chung cư, khu đô thị** | tên từng toà nhà, từng khu | Người bán căn hộ thật, ít môi giới cạnh tranh |
| **Nhóm hội đồng hương, người Đà Nẵng xa quê** | "Người Đà Nẵng tại Sài Gòn/Hà Nội" | Nhóm mua nhà quê hương, ít ai để ý |
| **Nhóm thuê nhà, tìm phòng** | "Thuê nhà Đà Nẵng", "Tìm phòng trọ Huế" | Mảng cho thuê, nhu cầu liên tục |

**Mục tiêu tuần đầu: vào 15–20 nhóm Facebook + 10 nhóm Zalo.** Ưu tiên nhóm đông và
**đang có bài mới mỗi ngày** — nhóm 50.000 thành viên mà chết thì vô dụng.

### 6B.2. Luật bất thành văn — không tuân là bị đá ra

1. **Bảy ngày đầu: chỉ đọc và trả lời, tuyệt đối không đăng bài bán.** Quản trị nhóm nhìn
   thành viên mới đăng bài quảng cáo là xoá và chặn ngay.
2. **Trả lời câu hỏi thật của người khác** — ai hỏi "khu này giá bao nhiêu", mình trả lời
   tử tế bằng hiểu biết, không kèm link. Làm 10–15 lần là mặt mình quen trong nhóm.
3. **Nhiều nhóm cấm dán link.** Cách hợp lệ: trả lời bằng nội dung, ai quan tâm thì
   *"em nhắn riêng nhé"*. Hoặc để link ở phần giới thiệu trang cá nhân.
4. **Đừng chép một bài dán 20 nhóm.** Facebook nhận ra ngay và chặn hiển thị. Mỗi nhóm
   viết lại một câu mở đầu khác.
5. **Dùng tài khoản cá nhân thật** có ảnh, có bạn bè. Tài khoản trống đăng bán nhà =
   bị coi là lừa đảo.

### 6B.3. Việc làm mỗi ngày — 45 phút

| Thời lượng | Việc |
|---|---|
| 15 phút | Lướt 5–7 nhóm, **trả lời 3–5 câu hỏi** thật của người khác |
| 15 phút | **Nhắn riêng 5–10 môi giới** đang đăng tin trong nhóm (mẫu ở dưới) |
| 10 phút | Đăng **1 tin đẹp** vào 2–3 nhóm phù hợp (ảnh thật, giá rõ) |
| 5 phút | Trả lời tin nhắn Zalo/Facebook đến |

Làm đều 30 ngày ăn đứt một tháng quảng cáo — và không tốn đồng nào.

### 6B.4. Đánh lẻ — đi từng người

Đây là cách gom tin nhanh nhất lúc kho còn trống:

**a) Nhắn môi giới đang đăng tin trong nhóm**

> *"Chào anh/chị, em thấy anh/chị đăng tin nhà ở [khu vực]. Em bên Coastal Land —
> sàn thông tin BĐS Miền Trung, coastalland.vn. Bên em đang mở nên **đăng tin miễn phí
> cho tài khoản mới**. Anh/chị đăng thử vài tin xem có khách không, không mất gì cả ạ."*

Ngắn, nói rõ mình là ai, nói rõ được gì. Không dài dòng.

**b) Gọi chủ nhà đang tự rao trên chợ tốt / nhóm Facebook**

Người tự rao thường thiếu kênh. Đề nghị **đăng giúp miễn phí** — vừa có tin, vừa có
người dùng thật.

**c) Đến trực tiếp sàn giao dịch, văn phòng môi giới ở Đà Nẵng**

Mỗi văn phòng có hàng chục tin. Gặp một người, có khi được 30–50 tin. **Hiệu quả nhất
trong tất cả các cách**, nhưng phải chịu khó đi.

**d) Facebook Marketplace**

Đăng tin lên Marketplace (miễn phí, lượng người xem lớn), phần mô tả ghi
*"Xem thêm hình và các căn tương tự tại coastalland.vn"*.

### 6B.5. GỌI ĐIỆN cho danh sách đã có — kênh ra tin nhanh nhất

Nếu anh đã có sẵn số của môi giới, chủ nhà, khách cũ thì **đây là kênh hiệu quả nhất
trong tất cả**: người ta đã biết mình, một cuộc gọi 2 phút bằng hàng chục tin nhắn nhóm.

**Chia danh sách làm ba nhóm, gọi theo thứ tự:**

| Thứ tự | Nhóm | Nói gì |
|---|---|---|
| 1 | **Môi giới đã quen** | Mời đăng tin miễn phí — ra tin ngay, họ có sẵn hàng chục căn |
| 2 | **Chủ nhà đang cần bán / cho thuê** | Đăng giúp miễn phí, không mất gì |
| 3 | **Khách từng hỏi mua** | Báo có sàn mới, có tin khu vực họ quan tâm |

**Kịch bản 30 giây đầu** — nói đúng ba ý, đừng dài:

> *"Alo anh/chị [tên], em [tên] đây ạ. Em vừa làm xong sàn thông tin bất động sản Miền Trung,
> coastalland.vn. Em gọi báo anh/chị một tiếng: giai đoạn đầu **đăng tin miễn phí**, anh/chị
> có căn nào cứ gửi em đăng giúp, không mất phí gì cả. Em gửi link qua Zalo anh/chị xem thử nhé?"*

Ba điều làm nên khác biệt:
- **Xưng tên thật, nhắc mối quan hệ cũ** — không mở đầu như tổng đài
- **Nói ngay cái họ được**, không kể lể về mình
- **Kết bằng một câu hỏi dễ gật** ("gửi Zalo nhé") — không ép ngay

**Cách làm cho hiệu quả:**

- **Gọi 20–30 cuộc/ngày**, tập trung 2 khung giờ: **9–11h sáng** và **14–16h chiều**.
  Tránh giờ cơm, tránh sau 19h.
- **Gọi xong gửi Zalo ngay** khi họ còn nhớ: link web + 3 bước đăng tin. Không gửi là nguội.
- **Ghi lại từng cuộc** vào `/admin/khach-hang` — ai đồng ý, ai hẹn lại, ai từ chối.
  Người hẹn lại thì **gọi lại sau 3–5 ngày**, đừng bỏ.
- Người đã đồng ý mà chưa đăng được → **đăng giúp họ luôn**. Có tin quan trọng hơn giữ nguyên tắc.

**Một lưu ý:** chỉ gọi những người anh **đã có quan hệ hoặc họ từng để lại thông tin cho mình**.
Danh sách mua ngoài thì đừng dùng — vừa phiền người ta, vừa vi phạm quy định về dữ liệu cá nhân
và tin nhắn, cuộc gọi rác.

### 6B.6. Bẫy phải tránh

| Đừng làm | Vì sao |
|---|---|
| Dán link vào mọi bình luận | Bị đánh dấu spam, khoá tài khoản |
| Dùng nhiều tài khoản ảo | Facebook quét ra, mất sạch |
| Chép nguyên tin của sàn khác | Vi phạm bản quyền, và tin trùng làm hại SEO |
| Hứa "cam kết bán được nhà" | Coastal Land là cổng thông tin, không môi giới — nói vậy là sai vị thế |
| Đăng 20 tin/ngày vào cùng một nhóm | Bị đá khỏi nhóm trong một buổi |

### 6B.6. Đo bằng gì

Ghi lại mỗi tuần, đơn giản trên giấy hay Excel cũng được:

- Số nhóm đã vào · số câu đã trả lời
- Số môi giới đã nhắn → **số người thật sự đăng tin**
- Số tin thu được từ kênh này

Sau 4 tuần sẽ thấy rõ nhóm nào ra tin, nhóm nào chỉ tốn thời gian → dồn sức vào nhóm hiệu quả.

---

## 7. CÓ NGÂN SÁCH THÌ TIÊU VÀO ĐÂU — THỨ TỰ ƯU TIÊN

> ⚠️ Mọi con số dưới đây là **khoảng ước tính** để lập kế hoạch. Giá quảng cáo thay đổi
> liên tục — chạy thử 2 tuần với ngân sách nhỏ rồi lấy số thật của mình mà tính lại.

### Điều quan trọng nhất phải hiểu trước khi tiêu đồng nào

Coastal Land là **sàn giao dịch** — có hai nhóm khách hoàn toàn khác nhau:

| | Người BÁN (chủ nhà, môi giới) | Người MUA |
|---|---|---|
| Mang lại gì | **Nguồn tin — tài sản của sàn** | Lượt xem, và tiền từ người bán |
| Chi phí có được | **Rẻ** — vài chục nghìn/người | **Đắt** — hàng trăm nghìn/lead |
| Giá trị theo thời gian | Tin ở lại, kéo Google, kéo khách mua | Xem xong là đi |

👉 **Đồng tiền đầu tiên phải tiêu để có NGƯỜI BÁN.** Có tin thì Google mới có cái để xếp
hạng, khách mua mới có cái để xem. Đổ tiền kéo khách mua khi kho tin còn mỏng là tưới nước
vào rổ.

### Thứ tự tiêu tiền

**Ưu tiên 1 — Kéo môi giới và chủ nhà lên sàn** *(2–5 triệu/tháng)*

- **Facebook Lead Ads** nhắm nhóm: môi giới BĐS, chủ nhà Đà Nẵng/Huế, độ tuổi 25–55
  → Thông điệp: *"Đăng tin nhà đất Đà Nẵng — Coastal Land, sàn mới, tin lên trang đầu"*
- Ưu đãi mở màn: **miễn phí đăng tin cho X tài khoản đầu tiên** (chức năng này Admin
  đã có sẵn trong mục Giá & khuyến mãi)
- Kênh 0đ đi kèm: nhắn trực tiếp môi giới trong các nhóm Zalo/Facebook đã tham gia

Đây là khoản rẻ nhất mà **để lại tài sản**: tin đăng còn nằm đó, còn kéo Google mãi.

**Ưu tiên 2 — Google Ads tìm kiếm** *(5–10 triệu/tháng, sau khi có ≥ 300 tin)*

Chỉ chạy **Search**, đừng chạy Performance Max hay Display lúc đầu — hai loại đó đốt tiền
vào lượt xem vô ích với sàn mới.

- Nhắm **từ khoá dài, có địa danh**: "bán căn hộ hải châu đà nẵng", "đất nền hoà xuân"
- **Tránh** từ khoá rộng ("nhà đất", "bất động sản") — đắt và chọi trực tiếp Batdongsan
- Đích đến: **trang danh mục hoặc trang khu vực**, không phải trang chủ
- Ước tính: BĐS là ngành giá thầu cao ở Việt Nam, khoảng **5.000–20.000đ/lượt bấm** tuỳ
  từ khoá → 5 triệu/tháng cho khoảng 300–800 lượt khách đúng nhu cầu

**Ưu tiên 3 — Facebook / Zalo Ads nhắm người mua** *(3–5 triệu/tháng)*

- Rẻ hơn Google nhiều nhưng khách "lướt qua", chưa sẵn nhu cầu → hợp để **gây nhận biết**
- Quảng cáo **từng tin đẹp** (ảnh thật, giá rõ) hiệu quả hơn quảng cáo thương hiệu chung
- **Zalo Ads** đáng thử ở Việt Nam: chi phí thường thấp hơn Facebook, người dùng địa phương nhiều

**Ưu tiên 4 — Bám đuổi (remarketing)** *(1–2 triệu/tháng)*

Người đã vào web mà chưa liên hệ → hiện lại quảng cáo cho họ. **Rẻ nhất, tỷ lệ quay lại
cao nhất** trong tất cả các loại. Chỉ chạy được khi web đã có lượng khách nhất định.

### Ba mức ngân sách gợi ý

| | 5 triệu/tháng | 10 triệu/tháng | 20 triệu/tháng |
|---|---|---|---|
| Kéo người bán | 3 tr | 4 tr | 5 tr |
| Google Ads tìm kiếm | — | 4 tr | 9 tr |
| Facebook / Zalo Ads | 2 tr | 2 tr | 4 tr |
| Bám đuổi | — | — | 2 tr |
| **Nên bắt đầu khi** | ngay sau khi đủ 500 tin | tháng thứ 2 | tháng thứ 3, khi đã có số liệu |

**Chạy tối thiểu 2 tháng liên tục** rồi mới đánh giá. Bật một tuần rồi tắt thì không có
dữ liệu gì để học cả.

### Việc cần làm TRƯỚC khi bật quảng cáo

Không có mấy thứ này thì tiền quảng cáo là tiền vứt đi — vì không biết đồng nào ra khách:

- [ ] **Google Analytics 4** đã gắn và có số liệu
- [ ] **Google Tag / Meta Pixel** đã gắn để đo chuyển đổi
- [ ] Đánh dấu **chuyển đổi**: bấm nút gọi · bấm Zalo · gửi biểu mẫu liên hệ
- [ ] Có người **trực trả lời trong giờ hành chính** — lead để quá 30 phút là nguội
- [ ] Kho tin **≥ 300 tin** cho quảng cáo nhắm người mua

### Khoản chi đáng tiền ngoài quảng cáo

| Khoản | Ước tính | Vì sao đáng |
|---|---|---|
| **Chụp ảnh chuyên nghiệp** cho 20–30 tin đẹp nhất | 3–5 triệu | Ảnh đẹp tăng lượt bấm gấp nhiều lần, dùng được mãi |
| **Giấy ĐKKD** | ~1–2 triệu | Mở khoá Zalo OA, PayOS, Facebook verify, hoá đơn quảng cáo |
| Cộng tác viên nhập tin | theo tin | Giải phóng thời gian anh để làm việc quan trọng hơn |

> 💡 **Giấy ĐKKD nên làm sớm.** Nó đang chặn cùng lúc: cổng thanh toán PayOS, Zalo OA,
> xác minh Facebook, và hoá đơn quảng cáo. Một khoản nhỏ mở được bốn cánh cửa.

---

## 8. ĐO LƯỜNG — nhìn vào đâu để biết đang đi đúng

| Công cụ | Xem gì | Bao lâu một lần |
|---|---|---|
| Google Search Console | Số trang đã lập chỉ mục · số lần hiển thị · từ khoá | mỗi tuần |
| Google Analytics 4 | Số người vào · vào từ đâu · xem trang nào | mỗi tuần |
| Google Business Profile | Số lần khách gọi · xin chỉ đường | mỗi tháng |
| Admin → Yêu cầu | Số khách để lại thông tin | mỗi ngày |

**Mốc hợp lý cho website mới:**

| Thời điểm | Trang được lập chỉ mục | Khách vào/tháng |
|---|---|---|
| Tháng 1 | 100–300 | 200–500 |
| Tháng 3 | 500+ | 1.500–3.000 |
| Tháng 6 | toàn bộ | 5.000–10.000 |

Chưa đạt cũng đừng vội đổi hướng — SEO cần thời gian. Chỉ xem lại khi **3 tháng liền
không nhúc nhích**.

---

## 9. LỊCH 90 NGÀY

| Tuần | Việc chính |
|---|---|
| **1** | Search Console + nộp sitemap · Google Business Profile · Bing · Fanpage · **gắn GA4 + Pixel** · **nộp hồ sơ ĐKKD** |
| **2** | Đăng 150 tin (Đà Nẵng trung tâm) · vào 10 nhóm Zalo/Facebook · **bật quảng cáo kéo người bán 2–3 tr** |
| **3** | Đăng 200 tin (vùng ven + Huế) · bài viết #1 (sáp nhập tỉnh & sổ đỏ) |
| **4** | Đăng 150 tin còn lại · yêu cầu lập chỉ mục · bài viết #2 · **chụp ảnh chuyên nghiệp 20 tin đẹp nhất** |
| **5–8** | Mỗi tuần 1 bài viết · 3–4 bài Facebook · trả lời nhóm Zalo · xin đánh giá Google · **bật Google Ads tìm kiếm 4–5 tr** |
| **9–12** | Đọc báo cáo Search Console + Google Ads → viết thêm bài cho từ khoá đã hiển thị mà chưa có click · **bật bám đuổi** · tăng ngân sách cho nhóm quảng cáo nào ra lead rẻ nhất |

---

## 10. BA VIỆC LÀM NGAY HÔM NAY

1. **Search Console** — xác minh (thẻ đã cắm sẵn) + nộp `sitemap.xml` → *15 phút*
2. **Google Business Profile** — tạo hồ sơ, chờ thư xác minh → *20 phút*
3. **Lập Fanpage Coastal Land** → *15 phút*

Ba việc này không tốn đồng nào, làm trong một buổi sáng, và là nền cho mọi thứ phía sau.
Không làm thì mọi nỗ lực đăng tin sau đó Google cũng chậm thấy.
