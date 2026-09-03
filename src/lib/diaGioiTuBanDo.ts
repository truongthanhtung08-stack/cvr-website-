import { provinceNamesFor, districtsOf, wardsOf, wardsOfNew, type GeoMode } from "@/lib/locations";
import { normalizeVi } from "@/lib/filters";

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
  return normalizeVi(s).replace(/^(thanh pho|tinh|quan|huyen|phuong|xa|thi tran|thi xa) /, "");
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
      return x.includes(t) || t.includes(x);
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
    const p = dsPhuongMoi.length ? khopDanhMuc(dc.phuong, dsPhuongMoi) : dc.phuong;
    return { province: tinh, district: "", ward: p || (doiTinh ? "" : giuPhuong) };
  }

  // Hệ CŨ: phải có Quận/Huyện thì mới ra được danh sách Phường/Xã.
  const dsQuan = districtsOf(tinh);
  // ⚠️ TỈNH CHƯA CÓ DANH MỤC QUẬN/HUYỆN CŨ (Hải Phòng, Quảng Ninh, Thanh Hoá,
  // Nghệ An, Cần Thơ… — web mới nhập đủ danh mục cho các tỉnh trọng điểm) thì
  // NHẬN THẲNG tên bản đồ đọc được, đừng ép khớp rồi trả rỗng. Ô Quận/Huyện cho
  // gõ tay khi tỉnh chưa có danh mục, nên điền thẳng vào là dùng được ngay —
  // ba khối phải MẶC ĐỊNH có sẵn, người đăng chỉ lo mỗi số nhà.
  if (!dsQuan.length) {
    return {
      province: tinh,
      district: dc.quan || (doiTinh ? "" : dangCo.district),
      ward: dc.phuong || (doiTinh ? "" : giuPhuong),
    };
  }
  let quan = khopDanhMuc(dc.quan, dsQuan);
  // Việt Nam đã BỎ cấp Quận/Huyện từ 2025 nên bản đồ thế giới phần lớn không còn
  // trả về tên quận → tự dò bằng danh mục của web: quận nào chứa cái phường/xã
  // vừa ghim thì chính là quận đó.
  if (!quan && dc.phuong) {
    quan = dsQuan.find((d) => khopDanhMuc(dc.phuong, wardsOf(tinh, d))) ?? "";
  }
  // VẪN CHƯA RA → khớp thẳng TÊN PHƯỜNG với DANH SÁCH QUẬN.
  // Sau sáp nhập 2025, rất nhiều phường mới mang đúng tên quận cũ: "Phường Ngũ
  // Hành Sơn", "Phường Hải Châu", "Phường Thanh Khê", "Phường Sơn Trà"… Không có
  // bước này thì ghim vào mấy chỗ đó là ô Quận/Huyện của hệ CŨ bỏ trống — đúng
  // lỗi chủ dự án báo 03/09/2026 ("hệ mới hiện đúng, hệ cũ không có quận/huyện").
  if (!quan && dc.phuong) quan = khopDanhMuc(dc.phuong, dsQuan);
  const quanDung = quan || (doiTinh ? "" : dangCo.district);
  if (!quanDung) return { province: tinh, district: "", ward: doiTinh ? "" : giuPhuong };
  const phuongKhop = khopDanhMuc(dc.phuong, wardsOf(tinh, quanDung));
  return { province: tinh, district: quanDung, ward: phuongKhop || (doiTinh ? "" : giuPhuong) };
}
