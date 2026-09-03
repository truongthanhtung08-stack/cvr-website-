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

export function khopDanhMuc(ten: string, dsach: string[]): string {
  const t = normalizeVi(ten).replace(/^(thanh pho|tinh|quan|huyen|phuong|xa|thi tran|thi xa) /, "");
  if (!t) return "";
  return (
    dsach.find((m) => normalizeVi(m) === t) ??
    dsach.find((m) => {
      const x = normalizeVi(m);
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
  dangCo: { province: string; district: string },
): { province: string; district: string; ward: string } {
  const tinhKhop = dc.tinh ? khopDanhMuc(dc.tinh, provinceNamesFor(heDiaChi)) : "";
  const tinh = tinhKhop || dangCo.province;
  if (!tinh) return { province: dangCo.province, district: dangCo.district, ward: "" };

  if (heDiaChi === "moi") {
    return { province: tinh, district: "", ward: khopDanhMuc(dc.phuong, wardsOfNew(tinh)) };
  }

  // Hệ CŨ: phải có Quận/Huyện thì mới ra được danh sách Phường/Xã.
  const dsQuan = districtsOf(tinh);
  let quan = khopDanhMuc(dc.quan, dsQuan);
  // Việt Nam đã BỎ cấp Quận/Huyện từ 2025 nên bản đồ thế giới phần lớn không còn
  // trả về tên quận → tự dò bằng danh mục của web: quận nào chứa cái phường/xã
  // vừa ghim thì chính là quận đó.
  if (!quan && dc.phuong) {
    quan = dsQuan.find((d) => khopDanhMuc(dc.phuong, wardsOf(tinh, d))) ?? "";
  }
  const quanDung = quan || (tinhKhop && tinhKhop !== dangCo.province ? "" : dangCo.district);
  if (!quanDung) return { province: tinh, district: "", ward: "" };
  return { province: tinh, district: quanDung, ward: khopDanhMuc(dc.phuong, wardsOf(tinh, quanDung)) };
}
