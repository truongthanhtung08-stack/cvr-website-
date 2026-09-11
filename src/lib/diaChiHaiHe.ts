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
  phuongMoiCua,
  phuongMoiCuaQuan,
  choCuCua,
  oldProvinceNames,
  chuanTenCap,
  chuanTen,
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
  return normalizeVi(s || "").replace(/^(thanh pho|tp\.?|tinh|quan|huyen|phuong|xa|thi tran|thi xa|dac khu) /, "").trim();
}

function trung(a: string, b: string): boolean {
  const x = loiTen(a), y = loiTen(b);
  return !!x && !!y && x === y;
}

// ─── HỆ MỚI → HỆ CŨ ─────────────────────────────────────────────────────────
// Biết Tỉnh mới + Phường mới, tìm xem trước sáp nhập nó nằm ở tỉnh/quận/phường nào.
export function suyRaHeCu(tinhMoi: string, phuongMoi: string): HaiHe["cu"] & { duToiPhuong: boolean } {
  // ① BẢNG ÁNH XẠ CHÍNH THỨC (Nghị quyết 202/2025/QH15) — đúng 100%, tra trước.
  // Một phường mới thường gộp 2–4 phường cũ; khi đó KHÔNG nêu đích danh một cái
  // (nêu ra là sai, nó chỉ là một phần) mà lùi lên quận/huyện chứa cả nhóm.
  if (phuongMoi) {
    const ds = choCuCua(tinhMoi, phuongMoi);
    if (ds.length) {
      const tinhs = new Set(ds.map((x) => x.tinh));
      const tinh = tinhs.size === 1 ? ds[0].tinh : dongGopNhieuNhat(ds.map((x) => x.tinh));
      const trongTinh = ds.filter((x) => x.tinh === tinh);

      // XÁC ĐỊNH PHƯỜNG TRƯỚC, RỒI LẤY QUẬN CỦA CHÍNH NÓ — làm ngược lại thì có
      // trường hợp quận chọn một đằng, phường một nẻo, ô Phường/Xã hiện giá trị
      // không nằm trong danh sách của quận đang chọn.
      //   · Gộp đúng một phường cũ → nêu tên luôn.
      //   · Gộp nhiều mà có ĐÚNG MỘT phường cũ trùng tên phường mới → đó là gốc
      //     ("Phường An Cựu" ← An Cựu + một phần khác).
      //   · Còn lại: không nêu đích danh (nêu ra là sai, nó chỉ là một phần), chỉ
      //     lùi lên quận/huyện ĐÓNG GÓP NHIỀU PHẦN NHẤT — thà gợi gần đúng còn hơn
      //     để trắng bắt người nhập dò lại từ đầu.
      const trungTen = trongTinh.filter((x) => trung(x.phuong, phuongMoi));
      const goc =
        trongTinh.length === 1 ? trongTinh[0] : trungTen.length === 1 ? trungTen[0] : null;
      const quan = goc ? goc.quan : dongGopNhieuNhat(trongTinh.map((x) => x.quan));
      const phuong = goc ? goc.phuong : "";
      if (tinh) return { tinh, quan, phuong, duToiPhuong: true };
    }
  }

  // ② Không có trong bảng (tên lạ, viết tắt) → dò theo tên như trước.
  const tinhCuUngVien = provinceMergers[tinhMoi] ?? [];

  // ⚠️ DỮ LIỆU HỆ CŨ ĐƯỢC LƯU THEO **TÊN TỈNH MỚI**.
  // `locations.ts` là bảng lai: tên tỉnh đã là tên MỚI ("Huế", "Đà Nẵng") nhưng
  // cấp dưới vẫn là quận/huyện + phường/xã CŨ. Trước đây chỗ này dò bằng TÊN CŨ
  // ("Thừa Thiên Huế") nên không khớp tỉnh nào → mọi tin đều rớt xuống nhánh cuối
  // và chỉ hiện được mỗi tên tỉnh cũ. Đó chính là lỗi "Tên cũ: Thừa Thiên Huế"
  // trong ảnh chủ dự án gửi, dù phường An Cựu CÓ trong dữ liệu (Quận Thuận Hóa).
  const chiTietCu = provinces.find((p) => p.name === tinhMoi);

  // Nhãn tỉnh cho dòng "tên cũ". Dò ra quận/huyện thì lấy luôn tỉnh cũ ghi trên
  // quận/huyện đó (Hội An → Quảng Nam) — chính xác nhất. Không dò ra thì mới dùng
  // nhãn dự phòng này: gộp từ ĐÚNG MỘT tỉnh cũ thì ghi tên cũ (Huế → Thừa Thiên
  // Huế), gộp từ nhiều tỉnh thì KHÔNG đoán, giữ tên tỉnh hiện hành.
  const tenTinhCho = tinhCuUngVien.length === 1 ? tinhCuUngVien[0] : tinhMoi;

  if (phuongMoi && chiTietCu) {
    // 1) Phường mới trùng tên một QUẬN/HUYỆN cũ — trường hợp phổ biến nhất sau
    //    sáp nhập ("Phường Hải Châu" ← "Quận Hải Châu").
    const quanTrung = chiTietCu.districts.find((d) => trung(d.name, phuongMoi));
    if (quanTrung) return { tinh: quanTrung.tinhCu ?? tenTinhCho, quan: quanTrung.name, phuong: "", duToiPhuong: true };

    // 2) Phường mới giữ nguyên tên một PHƯỜNG/XÃ cũ ("An Cựu" ← Quận Thuận Hóa).
    for (const d of chiTietCu.districts) {
      const phuongTrung = d.wards.find((w) => trung(w, phuongMoi));
      if (phuongTrung) return { tinh: d.tinhCu ?? tenTinhCho, quan: d.name, phuong: phuongTrung, duToiPhuong: true };
    }

    // 3) Phường mới GỘP nhiều phường cũ cùng gốc tên: "An Hải" ← An Hải Bắc ·
    //    An Hải Tây · An Hải Đông. Nêu đích danh một phường trong đó là SAI (nó
    //    chỉ là một phần), nên chỉ trả về QUẬN/HUYỆN chứa cả nhóm.
    const quanChua = chiTietCu.districts.filter((d) =>
      d.wards.some((w) => loiTen(w).startsWith(loiTen(phuongMoi) + " ")),
    );
    if (quanChua.length === 1) {
      return { tinh: quanChua[0].tinhCu ?? tenTinhCho, quan: quanChua[0].name, phuong: "", duToiPhuong: true };
    }
  }

  // Không dò ra phường: chỉ dám ghi tên tỉnh cũ khi tỉnh mới gộp từ đúng một tỉnh.
  const chiMotTinhCu = tinhCuUngVien.length === 1 ? tinhCuUngVien[0] : "";
  return { tinh: chiMotTinhCu, quan: "", phuong: "", duToiPhuong: false };
}

// Tên xuất hiện nhiều nhất trong danh sách (hoà thì lấy cái đầu).
function dongGopNhieuNhat(ds: string[]): string {
  const dem = new Map<string, number>();
  for (const x of ds) if (x) dem.set(x, (dem.get(x) ?? 0) + 1);
  let ten = "", n = 0;
  for (const [k, v] of dem) if (v > n) { ten = k; n = v; }
  return ten;
}

// ─── HỆ CŨ → HỆ MỚI ─────────────────────────────────────────────────────────
// Biết Tỉnh cũ (+ Quận/Huyện, Phường/Xã cũ), tìm tên theo hệ mới.
export function suyRaHeMoi(tinhCu: string, quanCu: string, phuongCu: string): DiaChiMoi & { duToiPhuong: boolean } {
  // Cấp tỉnh luôn chắc chắn.
  const tinhMoi = newProvinceOf(tinhCu) || (provinceNamesNew.includes(tinhCu) ? tinhCu : "");
  if (!tinhMoi) return { tinh: "", phuong: "", duToiPhuong: false };

  // ① BẢNG ÁNH XẠ CHÍNH THỨC — phường/xã cũ này nay thuộc phường/xã mới nào.
  if (phuongCu) {
    const m = phuongMoiCua(tinhCu, quanCu, phuongCu);
    if (m) return { tinh: m.tinh, phuong: m.phuong, duToiPhuong: true };
  }

  // ② CẢ QUẬN/HUYỆN CHỈ ĐỔ VỀ MỘT PHƯỜNG MỚI → chắc chắn là phường đó, kể cả khi
  // không biết phường cũ (người nhập mới chọn tới cấp quận) hoặc phường cũ mang tên
  // đã bị bỏ từ trước 2025 nên không có trong bảng.
  if (quanCu) {
    const ds = phuongMoiCuaQuan(tinhCu, quanCu);
    if (ds.length === 1) return { tinh: newProvinceOf(tinhCu), phuong: ds[0], duToiPhuong: true };
    // Phường mới mang đúng tên quận/huyện cũ là trường hợp phổ biến nhất sau sáp
    // nhập ("Quận Hải Châu" → "Phường Hải Châu") — nhận nó khi có.
    const trungTen = ds.filter((w) => trung(w, quanCu));
    if (trungTen.length === 1) return { tinh: newProvinceOf(tinhCu), phuong: trungTen[0], duToiPhuong: true };
  }

  const phuongMoiDS = wardsOfNew(tinhMoi);
  // ② Dò theo tên (chỉ dùng khi bảng không có): phường/xã cũ còn nguyên tên.
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
  // Bộ ba hệ CŨ mà người nhập từng chọn (form giữ lại). Bấm đổi hệ qua rồi đổi về
  // thì trả lại ĐÚNG cái họ đã chọn, không bắt chọn lại phường/xã — một phường mới
  // gộp 2–4 phường cũ nên máy tự suy là không thể biết họ ở phường nào.
  nhoHeCu?: { tinh: string; quan?: string; phuong?: string } | null,
): { province: string; district: string; ward: string } {
  const tinh = dangCo.tinh || "";
  const quan = dangCo.quan || "";
  const phuong = dangCo.phuong || "";
  if (!tinh) return { province: "", district: "", ward: "" };

  if (heDich === "cu") {
    // ƯU TIÊN TRẢ LẠI ĐÚNG THỨ NGƯỜI NHẬP ĐÃ CHỌN. Chỉ nhận khi chỗ nhớ đó thật sự
    // nằm trong phường mới đang chọn — người nhập đổi phường ở hệ mới thì chỗ nhớ cũ
    // không còn đúng nữa, lúc đó mới suy lại.
    if (nhoHeCu?.tinh && nhoHeCu.quan) {
      const hopLe =
        !phuong ||
        choCuCua(tinh, phuong).some(
          (x) =>
            chuanTenCap(x.quan) === chuanTenCap(nhoHeCu.quan ?? "") &&
            (!nhoHeCu.phuong || chuanTen(x.phuong) === chuanTen(nhoHeCu.phuong)),
        );
      if (hopLe) {
        return {
          province: nhoHeCu.tinh,
          district: nhoHeCu.quan ?? "",
          ward: nhoHeCu.phuong ?? "",
        };
      }
    }

    // CHUYỂN VÒNG KHÔNG ĐƯỢC MẤT DỮ LIỆU: nếu quận/huyện cũ vẫn còn trong ô (form
    // giữ lại khi sang hệ mới) và phường mới đang chọn thật sự có phần nằm ở quận
    // đó, thì giữ nguyên lựa chọn của người nhập — đừng thay bằng suy đoán của máy.
    if (quan && phuong) {
      const ds = choCuCua(tinh, phuong).filter((x) => chuanTenCap(x.quan) === chuanTenCap(quan));
      if (ds.length) {
        const trungTen = ds.filter((x) => trung(x.phuong, phuong));
        return {
          province: ds[0].tinh,
          district: ds[0].quan,
          ward: ds.length === 1 ? ds[0].phuong : trungTen.length === 1 ? trungTen[0].phuong : "",
        };
      }
    }
    // Đang ở hệ MỚI (tỉnh + phường mới) → suy ra TỈNH CŨ + quận/huyện + phường cũ.
    //
    // ⚠️ Ô TỈNH PHẢI ĐỔI THEO. Danh sách tỉnh ở hệ cũ là tên TRƯỚC sáp nhập, mà một
    // tỉnh mới có thể gồm nhiều tỉnh cũ: tin ở Hội An thuộc "Đà Nẵng" (mới) nhưng
    // hệ cũ là "Quảng Nam". Trước đây chỗ này giữ nguyên tên tỉnh mới nên ô
    // Quận/Huyện không tìm thấy "Hội An" trong Đà Nẵng cũ → bấm đổi hệ là trắng ô.
    const cu = suyRaHeCu(tinh, phuong);
    const tinhCu =
      cu.tinh ||
      (oldProvinceNames.includes(tinh) ? tinh : provinceMergers[tinh]?.[0] ?? tinh);
    return { province: tinhCu, district: cu.quan, ward: cu.phuong };
  }

  // Đang ở hệ CŨ (tỉnh + quận/huyện + phường cũ) → suy ra phường theo hệ mới.
  // Tên tỉnh cũng phải quy về tên hiện hành ("Quảng Nam" → "Đà Nẵng"), không thì ô
  // Tỉnh/Thành của hệ mới không có mục nào khớp và lại trắng.
  const moi = suyRaHeMoi(tinh, quan, phuong);
  // Hệ mới KHÔNG dùng cấp Quận/Huyện (ô bị ẩn), nhưng vẫn trả lại giá trị cũ để form
  // giữ trong bộ nhớ — bấm đổi qua đổi lại thì về đúng chỗ ban đầu, không mất.
  return { province: moi.tinh || newProvinceOf(tinh), district: quan, ward: moi.phuong };
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

// HAI DÒNG ĐỊA CHỈ TRÊN TRANG TIN — chủ dự án chốt 11/9/2026:
//   dòng trên  = địa chỉ theo hệ MỚI (tên đang dùng hiện nay)
//   dòng dưới  = "Địa chỉ hệ cũ: …"
// Người đăng nhập theo hệ nào cũng vậy — người xem luôn thấy một thứ tự.
//
// `moi` chỉ trả về khi suy được TỚI CẤP PHƯỜNG. Suy nửa vời (mỗi tên tỉnh) mà
// đem lên làm dòng chính thì hoá ra làm mất địa chỉ khách đã nhập — lúc đó nơi
// gọi giữ nguyên chuỗi gốc.
export function haiDongDiaChi(
  he: GeoMode,
  diaChi: { tinh: string; quan?: string; phuong?: string },
): { moi: string; cu: string } {
  const h = dongBoHaiHe(he, diaChi);
  const duMoi = he === "moi" || h.duToiPhuong;
  const moi = duMoi ? chuHeMoi(h) : "";
  // DÒNG HỆ CŨ = TRỌN KHỐI HÀNH CHÍNH 3 CẤP (phường → quận/huyện → tỉnh).
  // Sáp nhập 2025 chỉ đổi phần hành chính từ 3 cấp xuống 2 cấp; SỐ NHÀ và TÊN
  // ĐƯỜNG giữ nguyên nên không nhắc lại ở đây — nơi gọi để chúng ở dòng chính.
  //   VD: "Đường Võ Nguyên Giáp, Phường An Cựu, Huế"
  //       (Địa chỉ hệ cũ: An Cựu, Thuận Hóa, Thừa Thiên Huế)
  const cu = [h.cu.phuong, h.cu.quan, h.cu.tinh].filter(Boolean);
  // Không thêm được gì so với dòng trên thì thôi: suy ngược chỉ ra mỗi quận trùng
  // tên phường mới và vẫn tỉnh ấy ("Phường Thanh Khê, Đà Nẵng" ↔ "Thanh Khê, Đà
  // Nẵng") — ghi thêm chỉ rối mắt.
  const changThemGi =
    !h.cu.phuong &&
    (!h.cu.quan || giong(h.cu.quan, h.moi.phuong)) &&
    (!h.cu.tinh || giong(h.cu.tinh, h.moi.tinh));
  return { moi, cu: cu.length && !changThemGi ? cu.join(", ") : "" };
}

// Hai tên chỉ CÙNG MỘT CHỖ khi lõi tên trùng nhau ("Phường Hội An" = "Hội An").
function giong(a: string, b: string): boolean {
  return !!a && !!b && loiTen(a) === loiTen(b);
}

// Dòng phụ hiện dưới địa chỉ chính: chỉ ra cách gọi theo hệ CÒN LẠI.
// he = hệ mà người đăng đã nhập (hệ chính đang hiển thị).
export function dongDiaChiConLai(he: GeoMode, h: HaiHe): string {
  const con = he === "moi" ? chuHeCu(h) : chuHeMoi(h);
  if (!con) return "";
  return he === "moi" ? `Tên cũ: ${con}` : `Tên mới: ${con}`;
}
