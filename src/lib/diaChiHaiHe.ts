// ============================================================================
// ĐỊA CHỈ HAI HỆ — HỆ MỚI (Tỉnh → Phường/Xã) ↔ HỆ CŨ (Tỉnh → Quận/Huyện → Phường/Xã)
//
// Từ 2025 cả nước chạy SONG SONG hai cách gọi địa giới: người đăng tin và người
// mua mỗi bên quen một hệ. Tin ghi "Phường An Hải, Đà Nẵng" (hệ mới) thì người
// quen hệ cũ tìm "Sơn Trà" không thấy, và ngược lại. Vì vậy mọi nơi hiển thị địa
// chỉ đều phải cho thấy CẢ HAI, còn ô nhập thì gõ hệ nào cũng được.
//
// ĐỘ CHẮC CHẮN — nói thẳng để không ai tưởng máy biết hết:
//   · Cấp TỈNH: chắc chắn 100% — có bảng sáp nhập đầy đủ (provinceMergers).
//   · Cấp PHƯỜNG/XÃ: CHƯA có bảng sáp nhập chính thức trong dự án, nên chỉ dò
//     theo TÊN trong danh mục hai hệ (phường mới thường mang tên quận/huyện hoặc
//     phường cũ). Dò ra thì ghi rõ, KHÔNG dò ra thì để trống chứ tuyệt đối không
//     đoán bừa — địa chỉ sai còn tệ hơn địa chỉ thiếu.
//
// Có bảng sáp nhập cấp phường/xã chính thức thì chỉ cần thay phần dò tên bên
// dưới, mọi nơi gọi hàm này tự đúng theo.
// ============================================================================

import {
  provinces,
  provinceMergers,
  newProvinceOf,
  wardsOfNew,
  provinceNamesNew,
  type GeoMode,
} from "@/lib/locations";
import { normalizeVi } from "@/lib/filters";

export type DiaChiCu = { tinh: string; quan: string; phuong: string };
export type DiaChiMoi = { tinh: string; phuong: string };

export type HaiHe = {
  moi: DiaChiMoi;
  cu: DiaChiCu;
  /** true = suy ra được tới cấp phường/xã; false = chỉ chắc tới cấp tỉnh */
  duToiPhuong: boolean;
};

// So tên địa giới: bỏ tiền tố cấp ("Phường", "Xã", "Quận", "Thị trấn"…) rồi bỏ dấu.
// "Phường Hải Châu" và "Hải Châu" phải coi là một.
function loiTen(s: string): string {
  return normalizeVi(s || "").replace(/^(thanh pho|tp\.?|tinh|quan|huyen|phuong|xa|thi tran|thi xa) /, "").trim();
}

function trung(a: string, b: string): boolean {
  const x = loiTen(a), y = loiTen(b);
  return !!x && !!y && x === y;
}

// ─── HỆ MỚI → HỆ CŨ ─────────────────────────────────────────────────────────
// Biết Tỉnh mới + Phường mới, tìm xem trước sáp nhập nó nằm ở tỉnh/quận/phường nào.
export function suyRaHeCu(tinhMoi: string, phuongMoi: string): HaiHe["cu"] & { duToiPhuong: boolean } {
  const tinhCuUngVien = provinceMergers[tinhMoi] ?? [];

  // ⚠️ DỮ LIỆU HỆ CŨ ĐƯỢC LƯU THEO **TÊN TỈNH MỚI**.
  // `locations.ts` là bảng lai: tên tỉnh đã là tên MỚI ("Huế", "Đà Nẵng") nhưng
  // cấp dưới vẫn là quận/huyện + phường/xã CŨ. Trước đây chỗ này dò bằng TÊN CŨ
  // ("Thừa Thiên Huế") nên không khớp tỉnh nào → mọi tin đều rớt xuống nhánh cuối
  // và chỉ hiện được mỗi tên tỉnh cũ. Đó chính là lỗi "Tên cũ: Thừa Thiên Huế"
  // trong ảnh chủ dự án gửi, dù phường An Cựu CÓ trong dữ liệu (Quận Thuận Hóa).
  const chiTietCu = provinces.find((p) => p.name === tinhMoi);

  // Nhãn tỉnh cho dòng "tên cũ": tỉnh mới gộp từ ĐÚNG MỘT tỉnh cũ thì ghi tên cũ
  // (Huế → Thừa Thiên Huế). Gộp từ nhiều tỉnh (Đà Nẵng ← Đà Nẵng + Quảng Nam) thì
  // KHÔNG đoán, giữ tên tỉnh hiện hành — phần quận/huyện + phường mới là thứ giúp
  // người quen hệ cũ nhận ra nơi đó.
  const tenTinhCho = tinhCuUngVien.length === 1 ? tinhCuUngVien[0] : tinhMoi;

  if (phuongMoi && chiTietCu) {
    // 1) Phường mới trùng tên một QUẬN/HUYỆN cũ — trường hợp phổ biến nhất sau
    //    sáp nhập ("Phường Hải Châu" ← "Quận Hải Châu").
    const quanTrung = chiTietCu.districts.find((d) => trung(d.name, phuongMoi));
    if (quanTrung) return { tinh: tenTinhCho, quan: quanTrung.name, phuong: "", duToiPhuong: true };

    // 2) Phường mới giữ nguyên tên một PHƯỜNG/XÃ cũ ("An Cựu" ← Quận Thuận Hóa).
    for (const d of chiTietCu.districts) {
      const phuongTrung = d.wards.find((w) => trung(w, phuongMoi));
      if (phuongTrung) return { tinh: tenTinhCho, quan: d.name, phuong: phuongTrung, duToiPhuong: true };
    }

    // 3) Phường mới GỘP nhiều phường cũ cùng gốc tên: "An Hải" ← An Hải Bắc ·
    //    An Hải Tây · An Hải Đông. Nêu đích danh một phường trong đó là SAI (nó
    //    chỉ là một phần), nên chỉ trả về QUẬN/HUYỆN chứa cả nhóm.
    const quanChua = new Set<string>();
    for (const d of chiTietCu.districts) {
      if (d.wards.some((w) => loiTen(w).startsWith(loiTen(phuongMoi) + " "))) quanChua.add(d.name);
    }
    if (quanChua.size === 1) {
      return { tinh: tenTinhCho, quan: [...quanChua][0], phuong: "", duToiPhuong: true };
    }
  }

  // Không dò ra phường: chỉ dám ghi tên tỉnh cũ khi tỉnh mới gộp từ đúng một tỉnh.
  const chiMotTinhCu = tinhCuUngVien.length === 1 ? tinhCuUngVien[0] : "";
  return { tinh: chiMotTinhCu, quan: "", phuong: "", duToiPhuong: false };
}

// ─── HỆ CŨ → HỆ MỚI ─────────────────────────────────────────────────────────
// Biết Tỉnh cũ (+ Quận/Huyện, Phường/Xã cũ), tìm tên theo hệ mới.
export function suyRaHeMoi(tinhCu: string, quanCu: string, phuongCu: string): DiaChiMoi & { duToiPhuong: boolean } {
  // Cấp tỉnh luôn chắc chắn.
  const tinhMoi = newProvinceOf(tinhCu) || (provinceNamesNew.includes(tinhCu) ? tinhCu : "");
  if (!tinhMoi) return { tinh: "", phuong: "", duToiPhuong: false };

  const phuongMoiDS = wardsOfNew(tinhMoi);
  // 1) Phường/xã cũ còn nguyên tên trong hệ mới.
  const theoPhuong = phuongCu ? phuongMoiDS.find((w) => trung(w, phuongCu)) : undefined;
  if (theoPhuong) return { tinh: tinhMoi, phuong: theoPhuong, duToiPhuong: true };
  // 2) Phường mới mang tên quận/huyện cũ.
  const theoQuan = quanCu ? phuongMoiDS.find((w) => trung(w, quanCu)) : undefined;
  if (theoQuan) return { tinh: tinhMoi, phuong: theoQuan, duToiPhuong: true };

  return { tinh: tinhMoi, phuong: "", duToiPhuong: false };
}

// ─── GỘP CHUNG ──────────────────────────────────────────────────────────────
// Nhận địa chỉ người đăng đã nhập theo MỘT hệ, trả về cả hai hệ.
export function dongBoHaiHe(
  he: GeoMode,
  diaChi: { tinh: string; quan?: string; phuong?: string },
): HaiHe {
  const tinh = diaChi.tinh || "";
  const quan = diaChi.quan || "";
  const phuong = diaChi.phuong || "";

  if (he === "moi") {
    const cu = suyRaHeCu(tinh, phuong);
    return {
      moi: { tinh, phuong },
      cu: { tinh: cu.tinh, quan: cu.quan, phuong: cu.phuong },
      duToiPhuong: cu.duToiPhuong,
    };
  }

  const moi = suyRaHeMoi(tinh, quan, phuong);
  return {
    moi: { tinh: moi.tinh, phuong: moi.phuong },
    cu: { tinh, quan, phuong },
    duToiPhuong: moi.duToiPhuong,
  };
}

// ─── ĐỔI HỆ: TỰ ĐIỀN SANG HỆ KIA ────────────────────────────────────────────
// Người nhập bấm nút "Hệ mới ↔ Hệ cũ" thì ba ô địa giới phải TỰ ĐIỀN theo hệ vừa
// chọn, KHÔNG bắt gõ lại từ đầu (yêu cầu của chủ dự án).
//
// Suy được tới đâu điền tới đó; chỗ nào không suy ra thì để TRỐNG cho người nhập
// tự chọn — tuyệt đối không điền bừa một phường gần đúng, vì địa chỉ sai thì tin
// lên nhầm khu vực, khách tìm không ra.
export function doiHeDiaChi(
  heDich: GeoMode,
  dangCo: { tinh: string; quan?: string; phuong?: string },
): { province: string; district: string; ward: string } {
  const tinh = dangCo.tinh || "";
  const quan = dangCo.quan || "";
  const phuong = dangCo.phuong || "";
  if (!tinh) return { province: "", district: "", ward: "" };

  if (heDich === "cu") {
    // Đang ở hệ MỚI (tỉnh + phường mới) → suy ra quận/huyện + phường cũ.
    const cu = suyRaHeCu(tinh, phuong);
    return { province: tinh, district: cu.quan, ward: cu.phuong };
  }

  // Đang ở hệ CŨ (tỉnh + quận/huyện + phường cũ) → suy ra phường theo hệ mới.
  const moi = suyRaHeMoi(tinh, quan, phuong);
  return { province: moi.tinh || tinh, district: "", ward: moi.phuong };
}

// ─── CHUỖI GỬI CHO BẢN ĐỒ — GỬI CẢ HAI HỆ ───────────────────────────────────
// Bản đồ (Google lẫn bảng toạ độ tĩnh trong geo.ts) vẫn chạy theo TÊN CŨ: bảng
// CENTERS khớp "Sơn Trà", "Thuận Hóa", "Hội An"… còn Google thì chưa cập nhật
// hết tên phường mới sau sáp nhập. Vì vậy người đăng chọn "Phường An Hải" (hệ
// mới) mà chỉ gửi đúng tên đó thì bản đồ dò không ra, chỉ kéo về giữa tỉnh.
//
// Gửi kèm tên theo hệ CÒN LẠI thì cả hai bên đều tra được: bên nào nhận ra tên
// nào thì dùng tên đó. Đây là chiều "ô nhập → bản đồ" của cơ chế hai chiều
// (chiều ngược lại — ghim bản đồ → điền ô — nằm ở diaGioiTuBanDo.ts).
export function chuoiTimBanDo(
  he: GeoMode,
  diaChi: { tinh: string; quan?: string; phuong?: string },
  soNha = "",
): string {
  const h = dongBoHaiHe(he, diaChi);
  // Thứ tự: số nhà → tên hệ đang nhập → tên hệ kia → tỉnh. Trùng nhau thì bỏ.
  const phan = he === "moi"
    ? [soNha, h.moi.phuong, h.cu.phuong, h.cu.quan, h.moi.tinh]
    : [soNha, h.cu.phuong, h.cu.quan, h.moi.phuong, h.cu.tinh || h.moi.tinh];
  // Loại trùng theo TÊN LÕI: "Phường An Cựu" và "An Cựu" là một chỗ, nhắc hai lần
  // chỉ làm loãng chuỗi tra cứu.
  const daCo = new Set<string>();
  return phan
    .map((x) => (x ?? "").trim())
    .filter((x) => {
      if (!x) return false;
      const loi = loiTen(x);
      if (daCo.has(loi)) return false;
      daCo.add(loi);
      return true;
    })
    .join(", ");
}

// Tin đã lưu chỉ có ba cột ward/district/province, không ghi nó nhập theo hệ nào.
// CÓ Quận/Huyện = hệ cũ (hệ mới đã bỏ cấp này) — đó là dấu hiệu duy nhất và đủ chắc.
export function heCuaTin(district: string | null | undefined): GeoMode {
  return district && district.trim() ? "cu" : "moi";
}

// ─── CÂU CHỮ HIỂN THỊ ───────────────────────────────────────────────────────
// Ghép thành một dòng đọc được. Trả "" khi không có gì chắc chắn để nói — thà
// không hiện còn hơn hiện nửa vời.
export function chuHeMoi(h: HaiHe): string {
  return [h.moi.phuong, h.moi.tinh].filter(Boolean).join(", ");
}

export function chuHeCu(h: HaiHe): string {
  return [h.cu.phuong, h.cu.quan, h.cu.tinh].filter(Boolean).join(", ");
}

// Dòng phụ hiện dưới địa chỉ chính: chỉ ra cách gọi theo hệ CÒN LẠI.
// he = hệ mà người đăng đã nhập (hệ chính đang hiển thị).
export function dongDiaChiConLai(he: GeoMode, h: HaiHe): string {
  const con = he === "moi" ? chuHeCu(h) : chuHeMoi(h);
  if (!con) return "";
  return he === "moi" ? `Tên cũ: ${con}` : `Tên mới: ${con}`;
}
