import {
  provinceNamesFor,
  districtsOf,
  wardsOf,
  wardsOfNew,
  wardsOfAny,
  quanHuyenToanTinh,
  newProvinceOf,
  type GeoMode,
} from "@/lib/locations";
import { normalizeVi } from "@/lib/filters";
import { suyRaHeCu, suyRaHeMoi } from "@/lib/diaChiHaiHe";

// ── GHIM TRÊN BẢN ĐỒ → ĐIỀN VÀO CÁC Ô KHU VỰC ────────────────────────────────
//
// Chiều ngược của "chọn khu vực thì bản đồ trỏ tới". Dùng CHUNG cho form đăng tin
// của khách và form admin — trước đây chỉ form khách có, nên admin ghim xong chỉ
// thấy ô địa chỉ có chữ còn ba ô khu vực phía trên đứng im.
//
// Tên OpenStreetMap trả về không khớp từng chữ với danh mục của web:
//   "Thành phố Đà Nẵng" ≠ "Đà Nẵng"   ·   "Phường Hòa Cường" ≠ "Hòa Cường Bắc"
// nên phải so KHÔNG DẤU, bỏ tiền tố cấp hành chính, và cho khớp lồng nhau.

export type DiaGioiBanDo = { tinh: string; quan: string; phuong: string };

// Bỏ tiền tố cấp hành chính rồi bỏ dấu — để "Phường Hòa Khánh" và "Hòa Khánh Bắc"
// còn so được với nhau.
function loiTen(s: string): string {
  return normalizeVi(s).replace(/^(thanh pho|tp.?|tinh|quan|huyen|phuong|xa|thi tran|thi xa|dac khu) /, "").trim();
}

// "Hòa Khánh" nằm trong "Hòa Khánh Bắc" — đúng. Nhưng "An Phú" KHÔNG nằm trong
// "Trần Phú", dù chuỗi ký tự có chứa nhau. Vì vậy chỉ chấp nhận khi tên ngắn là
// TRỌN VẸN MỘT CỤM TỪ của tên dài, không phải mẩu cắt giữa chừng — ghim Quy Nhơn
// từng ra "Phường An Phú" chính vì so bằng chuỗi con.
function chuaTronTu(dai: string, ngan: string): boolean {
  return (
    dai === ngan ||
    dai.startsWith(ngan + " ") ||
    dai.endsWith(" " + ngan) ||
    dai.includes(" " + ngan + " ")
  );
}

export function khopDanhMuc(ten: string, dsach: string[]): string {
  const t = loiTen(ten);
  if (!t) return "";
  // ⚠️ PHẢI LỘT TIỀN TỐ Ở CẢ HAI VẾ. Trước đây chỉ lột vế `ten`, còn danh mục để
  // nguyên "Phường Hòa Khánh" → bản đồ trả "Hòa Khánh Bắc" là so trượt, ô Phường/Xã
  // của hệ MỚI bỏ trống. Đây là chuyện xảy ra liên tục vì sau sáp nhập 2025, tên
  // bản đồ và tên danh mục của web lệch nhau gần như ở mọi phường.
  return (
    dsach.find((m) => loiTen(m) === t) ??
    dsach.find((m) => {
      const x = loiTen(m);
      return chuaTronTu(x, t) || chuaTronTu(t, x);
    }) ??
    ""
  );
}

// Trả về đúng ba giá trị nên đặt vào ba ô. Chuỗi rỗng = KHÔNG tìm ra mục có thật
// trong danh mục → nơi gọi phải GIỮ NGUYÊN lựa chọn cũ của người đăng, tuyệt đối
// không xoá trắng ô của họ.
export function ganDiaGioi(
  dc: DiaGioiBanDo,
  heDiaChi: GeoMode,
  dangCo: { province: string; district: string; ward?: string },
): { province: string; district: string; ward: string } {
  // ⚠️ GIỮ Ô PHƯỜNG/XÃ NGƯỜI ĐĂNG ĐÃ CHỌN khi bản đồ đọc ra tên web không có
  // (tên cũ, viết tắt, xã mới sáp nhập). Từ 03/09/2026 ghim ở đâu cũng cập nhật
  // địa giới, nên nếu không giữ thì mỗi lần ghim là ô Phường/Xã của họ bị xoá
  // trắng — chuyện xảy ra liên tục chứ không còn là trường hợp hiếm.
  const giuPhuong = dangCo.ward ?? "";
  const tinhKhop = dc.tinh ? khopDanhMuc(dc.tinh, provinceNamesFor(heDiaChi)) : "";
  const tinh = tinhKhop || dangCo.province;
  if (!tinh) return { province: dangCo.province, district: dangCo.district, ward: giuPhuong };

  // Nhảy sang TỈNH KHÁC thì phường cũ chắc chắn không còn đúng — lúc đó mới xoá.
  const doiTinh = !!tinhKhop && tinhKhop !== dangCo.province;

  if (heDiaChi === "moi") {
    const dsPhuongMoi = wardsOfNew(tinh);
    // Chưa có danh mục phường của tỉnh này → nhận thẳng tên bản đồ đọc được.
    let p = dsPhuongMoi.length ? khopDanhMuc(dc.phuong, dsPhuongMoi) : dc.phuong;

    // ⚠️ BẢN ĐỒ VẪN TRẢ TÊN CŨ. Google và OpenStreetMap chưa cập nhật hết tên
    // phường mới sau sáp nhập, nên ghim đúng chỗ mà vẫn đọc ra "Quận Hải Châu",
    // "An Hải Bắc"… → khớp với danh mục hệ MỚI là trượt, ô Phường/Xã bỏ trống.
    // Trượt thì tra tiếp theo danh mục hệ CŨ rồi QUY ĐỔI sang tên hệ mới. Đây là
    // nửa còn lại của cơ chế hai chiều (nửa kia: chuoiTimBanDo gửi cả hai hệ).
    if (!p) {
      // Tra TOÀN BỘ quận/huyện cũ của tỉnh hiện hành — kể cả phần thuộc các tỉnh
      // cũ đã gộp vào (Đà Nẵng còn có Hội An, Điện Bàn… của Quảng Nam).
      const dsQuanCu = quanHuyenToanTinh(tinh);
      // Cùng thứ tự với nhánh hệ cũ: phường nằm trong danh mục phường của quận →
      // cấp trung gian bản đồ trả về → cuối cùng mới thử tên phường khớp tên quận.
      // "Phường 1" của Vũng Tàu mà thử bước cuối trước là dính ngay "Quận 1".
      const quanCu =
        dsQuanCu.find((d) => khopDanhMuc(dc.phuong, d.wards)) ||
        dsQuanCu.find((d) => khopDanhMuc(dc.quan, [d.name])) ||
        dsQuanCu.find((d) => khopDanhMuc(dc.phuong, [d.name]));
      if (quanCu) {
        const phuongCu = khopDanhMuc(dc.phuong, quanCu.wards);
        p = suyRaHeMoi(quanCu.tinhCu ?? tinh, quanCu.name, phuongCu).phuong;
      }
    }

    return { province: tinh, district: "", ward: p || (doiTinh ? "" : giuPhuong) };
  }

  // ── TÊN TỈNH BẢN ĐỒ TRẢ VỀ LÀ TÊN HIỆN HÀNH, HỆ CŨ LẠI CHỌN THEO TÊN TRƯỚC
  // SÁP NHẬP. Ghim ở Hội An thì bản đồ nói "Đà Nẵng", mà trước sáp nhập Hội An
  // thuộc Quảng Nam — giữ nguyên "Đà Nẵng" thì danh sách quận/huyện không có Hội
  // An, ba ô địa giới bỏ trống. Vì vậy dò địa danh bản đồ đọc được trong TOÀN BỘ
  // quận/huyện của tỉnh hiện hành rồi lấy đúng tỉnh cũ chứa nó.
  const dsToanTinh = quanHuyenToanTinh(tinh);
  // Thứ tự dò: phường nằm trong danh mục phường của quận (chắc nhất) → cấp trung
  // gian bản đồ trả về → cuối cùng mới thử tên phường khớp tên quận. Không được
  // đảo hai bước cuối: tên phường kiểu số ("Phường 1") khớp lung tung với quận
  // kiểu số ("Quận 1") — ghim Vũng Tàu từng ra "TP.HCM / Quận 1" vì lẽ đó.
  // Thứ tự dò, từ chắc nhất xuống:
  //   1. Quận bản đồ nói ĐÚNG và quận đó CÓ CHỨA cái phường bản đồ nói — hai vế
  //      cùng khớp thì gần như không thể sai.
  //   2. Chỉ DUY NHẤT một quận trong cả tỉnh chứa cái phường đó (dùng khi bản đồ
  //      không trả cấp trung gian, hoặc trả sai như "Hòa Xuân, HỘI AN").
  //   3. Đành tin cấp trung gian bản đồ trả về.
  //   4. Tên phường trùng tên một quận (sau sáp nhập rất nhiều phường như vậy).
  // Không được dò theo tên phường trước cấp trung gian: cả nước có hàng trăm
  // "Phường 1", ghim Vũng Tàu từng nhảy sang Gò Vấp vì thế.
  const theoPhuong = dc.phuong ? dsToanTinh.filter((d) => khopDanhMuc(dc.phuong, d.wards)) : [];
  const theoQuan = dc.quan ? dsToanTinh.filter((d) => khopDanhMuc(dc.quan, [d.name])) : [];
  const quanToanTinh =
    theoQuan.find((d) => theoPhuong.includes(d)) ??
    (theoPhuong.length === 1 ? theoPhuong[0] : undefined) ??
    theoQuan[0] ??
    (dc.phuong ? dsToanTinh.find((d) => khopDanhMuc(dc.phuong, [d.name])) : undefined);
  const tinhCu = quanToanTinh?.tinhCu ?? tinh;
  // Nhảy sang tỉnh khác thì phường/quận cũ không còn đúng — so theo tỉnh CŨ vừa suy ra.
  const doiTinhCu = !!tinhKhop && tinhCu !== dangCo.province;

  // Hệ CŨ: phải có Quận/Huyện thì mới ra được danh sách Phường/Xã.
  const dsQuan = districtsOf(tinhCu);
  // ⚠️ TỈNH CHƯA CÓ DANH MỤC QUẬN/HUYỆN CŨ (Hải Phòng, Quảng Ninh, Thanh Hoá,
  // Nghệ An, Cần Thơ… — web mới nhập đủ danh mục cho các tỉnh trọng điểm) thì
  // NHẬN THẲNG tên bản đồ đọc được, đừng ép khớp rồi trả rỗng. Ô Quận/Huyện cho
  // gõ tay khi tỉnh chưa có danh mục, nên điền thẳng vào là dùng được ngay —
  // ba khối phải MẶC ĐỊNH có sẵn, người đăng chỉ lo mỗi số nhà.
  if (!dsQuan.length) {
    // Vẫn ưu tiên tên chuẩn trong danh mục của web, tên thô của bản đồ là hạng chót.
    const p = khopDanhMuc(dc.phuong, wardsOfAny(tinhCu));
    return {
      province: tinhCu,
      district: dc.quan || (doiTinhCu ? "" : dangCo.district),
      ward: p || dc.phuong || (doiTinhCu ? "" : giuPhuong),
    };
  }
  // ⚠️ THỨ TỰ BA BƯỚC NÀY QUAN TRỌNG — ĐỪNG ĐẢO LẠI.
  // TÊN PHƯỜNG đáng tin hơn cấp trung gian mà bản đồ trả về. Dữ liệu
  // OpenStreetMap sau sáp nhập 2025 còn gán sai cấp trung gian rất nhiều, ví dụ
  // thật: "Phường Hòa Xuân, HỘI AN, Thành phố Đà Nẵng" — Hoà Xuân thuộc Cẩm Lệ,
  // chẳng liên quan gì Hội An. Trước đây tin cấp trung gian trước nên ghim ở Hoà
  // Xuân / Cẩm Lệ đều ra Quận "Hội An" (chủ dự án báo 03/09/2026).
  //
  // Bước 1 — QUẬN NÀO CHỨA CÁI PHƯỜNG NÀY. Chắc nhất: tra ngược bằng danh mục
  // của chính web, không phụ thuộc bản đồ gán đúng hay sai.
  let quan = dc.phuong ? dsQuan.find((d) => khopDanhMuc(dc.phuong, wardsOf(tinhCu, d))) ?? "" : "";
  // Bước 2 — KHỚP THẲNG TÊN PHƯỜNG VỚI DANH SÁCH QUẬN. Sau sáp nhập, rất nhiều
  // phường mới mang đúng tên quận cũ: "Phường Ngũ Hành Sơn", "Phường Hải Châu",
  // "Phường Thanh Khê", "Phường Sơn Trà", "Phường Cẩm Lệ"…
  if (!quan && dc.phuong) quan = khopDanhMuc(dc.phuong, dsQuan);
  // Bước 3 — ĐÀNH TIN cấp trung gian của bản đồ. Chỉ dùng khi hai bước trên bó
  // tay (thường là huyện/xã vùng ven web chưa có trong danh mục phường cũ).
  if (!quan) quan = khopDanhMuc(dc.quan, dsQuan);
  // Bước 4 — BẢN ĐỒ ĐỌC RA TÊN HỆ MỚI. Nơi nào Google/OSM đã cập nhật thì nó trả
  // thẳng tên phường mới ("Phường An Cựu") — tên này không có trong danh mục
  // quận/huyện cũ nên ba bước trên đều trượt. Quy đổi ngược về hệ cũ để lấy đúng
  // quận/huyện. Đây là chiều còn lại của cơ chế hai chiều.
  if (!quan && dc.phuong) quan = suyRaHeCu(newProvinceOf(tinhCu), dc.phuong).quan;
  const quanDung = quan || (doiTinhCu ? "" : dangCo.district);
  // Việt Nam chạy SONG SONG hai hệ cho tới khi dân quen hệ mới → hệ CŨ cũng phải
  // điền được đủ ba khối. Bản đồ chỉ biết TÊN PHƯỜNG MỚI ("Phường Thuận Hoá"),
  // mà danh mục phường CŨ của quận đó không có tên ấy → không khớp. Lúc đó cứ
  // điền thẳng tên bản đồ đọc được: cùng một chỗ trên thực địa, chỉ khác cách gọi
  // cấp hành chính. Để trống là người đăng phải tự dò, mà ba khối phải MẶC ĐỊNH.
  // ⚠️ DANH MỤC CỦA WEB LÀ CHUẨN, TÊN BẢN ĐỒ CHỈ LÀ MANH MỐI.
  // OpenStreetMap cập nhật đơn vị hành chính Việt Nam không đầy đủ và không đều
  // (nơi còn tên cũ, nơi đã tên mới, nơi gán sai cấp). Web mình có danh mục đầy
  // đủ: 34 tỉnh · 3.321 phường/xã hệ mới. Vậy trước khi đành lấy tên thô của bản
  // đồ, thử khớp thêm một nhịp nữa với DANH MỤC PHƯỜNG MỚI của chính tỉnh đó —
  // ra được thì ô giữ đúng tên chuẩn của web, không phải tên lạ do bản đồ đặt.
  const phuongTheoDanhMucMoi = khopDanhMuc(dc.phuong, wardsOfAny(tinhCu));
  const phuongThoTuBanDo =
    phuongTheoDanhMucMoi || dc.phuong || (doiTinhCu ? "" : giuPhuong);
  if (!quanDung) return { province: tinhCu, district: "", ward: phuongThoTuBanDo };
  const phuongKhop = khopDanhMuc(dc.phuong, wardsOf(tinhCu, quanDung));
  return { province: tinhCu, district: quanDung, ward: phuongKhop || phuongThoTuBanDo };
}
