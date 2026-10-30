import { centerOfArea } from "@/lib/geo";
import { parseLatLng } from "@/lib/googleMaps";

// ── TRA ĐỊA CHỈ RA TOẠ ĐỘ ────────────────────────────────────────────────────
//
// Dùng Nominatim của OpenStreetMap: miễn phí, không cần khoá, không cần thanh toán.
// (Geocoding của Google thì phải nạp tiền và đang bị Google chặn tài khoản — xem
// ghi chú đầu MapPaneLeaflet.tsx.)
//
// VÌ SAO CẦN: tin nào cũng phải có GHIM ĐỎ trên bản đồ. Chỉ khoảng một phần nhỏ
// tin được người đăng ghim tay; số còn lại chỉ có chuỗi địa chỉ. Có tên đường thì
// tra ra đúng đoạn đường, đó đã là ghim dùng được. Không tra ra mới lùi về tâm
// phường/xã — dấu đỏ giữa khu vực, bản đồ lùi ra cho thấy cả khu vực, kiểu Google
// Maps (chủ dự án 23/10/2026).

export type MucDoChinhXac = "ghim" | "duong" | "khuVuc";

export type ToaDoTim = {
  lat: number;
  lng: number;
  mucDo: MucDoChinhXac;
};

// Tra rồi thì nhớ luôn — khách chuyển qua lại giữa các tin không phải tra lại,
// và Nominatim có giới hạn 1 lượt/giây nên càng gọi ít càng tốt.
const daTra = new Map<string, ToaDoTim | null>();

// Nhận dạng từng mảnh địa chỉ khách ghi (timToaDo).
const LA_DIA_GIOI = /^(phường|xã|thị trấn|đặc khu|thành phố|tỉnh|quận|huyện|thị xã)\s/i;
const LA_DUONG = /^(đường|phố|kiệt|hẻm|ngõ|ngách|quốc lộ|tỉnh lộ|đại lộ)\s/i;
const SO_DAU = /^(?:số\s*)?\d+[a-z]?(?:\/\d+[a-z]?)*\s+/i; // "123 " / "số 12/3 " đứng trước tên đường
const LA_SO_NHA = /^(?:số\s*)?\d+[a-z]?(?:\/\d+[a-z]?)*$/i; // mảnh chỉ có số nhà

/** Mức phóng theo độ chính xác — MỌI bản đồ xem vị trí dùng chung (nền mở hôm nay, Google sau này chỉ thay khung vẽ).
 *  Đúng nhà / trên đường → mức nơi gọi đưa (thấy rõ đường); chỉ tới khu vực → lùi ra 14 cho thấy cả khu vực. */
export const zoomTheoMucDo = (mucDo: MucDoChinhXac, zoom: number) => (mucDo === "khuVuc" ? Math.min(zoom, 14) : zoom);

/** Hai cách ghi có cùng MỘT tên đường không ("50 Đường Bạch Đằng" ~ "Bạch Đằng") — bỏ số nhà, chữ Đường/Phố, dấu. */
export function cungTenDuong(a: string, b: string): boolean {
  const tenDuong = (s: string) => khongDau(boLoaiDuong(s.trim().replace(SO_DAU, "")));
  const x = tenDuong(a);
  return x.length >= 3 && x === tenDuong(b);
}


// ── CHIỀU NGƯỢC LẠI: TỪ TOẠ ĐỘ RA ĐỊA CHỈ ────────────────────────────────────
// Người đăng bấm ghim lên bản đồ thì phải thấy mình vừa ghim vào ĐÂU. Chỉ hiện
// một dấu đỏ trơ trọi thì họ không biết đúng hay sai, không kiểm được.
export type DiaChiTra = {
  // Đúng phần điền vào ô "Địa chỉ cụ thể": số nhà + tên đường. Không kèm phường,
  // quận, tỉnh vì mấy mục đó có ô CHỌN riêng — trả về ở hai trường dưới.
  ngan: string;
  // Câu đầy đủ để người đăng đọc mà kiểm: "123, Mê Linh, Phường Nha Trang, Khánh Hòa"
  day: string;
  // Để form tự chọn đúng mục trong các ô địa giới. Trả về CẢ Quận/Huyện vì web
  // đang chạy song song hai hệ: hệ CŨ 3 cấp (Tỉnh → Quận/Huyện → Phường/Xã) và
  // hệ MỚI 2 cấp sau sáp nhập (Tỉnh → Phường/Xã). Người đăng chọn hệ nào cũng
  // phải điền được.
  tinh: string;
  quan: string;
  phuong: string;
  // Ghim tới mức nào — để nói cho người đăng biết địa chỉ đã đủ chính xác chưa.
  mucDo: "soNha" | "duong" | "khuVuc";
  // Nguyên câu bản đồ đọc được (có tổ dân phố, khu phố) — để suy phường CŨ đúng chỗ ghim (phuongCuTheoGhim).
  chuoi: string;
};

const daTraNguoc = new Map<string, DiaChiTra | null>();

export async function traDiaChi(lat: number, lng: number): Promise<DiaChiTra | null> {
  // Làm tròn 5 số lẻ (~1 m) để nhích ghim vài xăng-ti-mét không phải gọi lại.
  const khoa = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (daTraNguoc.has(khoa)) return daTraNguoc.get(khoa) ?? null;
  try {
    const r = await fetch(
      `/api/dia-chi?viec=nguoc&lat=${lat}&lng=${lng}`,
    );
    const kq = (await r.json()) as {
      display_name?: string;
      address?: {
        house_number?: string; road?: string; neighbourhood?: string; suburb?: string;
        amenity?: string; building?: string; shop?: string; residential?: string;
        quarter?: string; village?: string; town?: string; hamlet?: string;
        city_district?: string; county?: string; district?: string;
        city?: string; state?: string; province?: string;
      };
    };
    const a = kq.address ?? {};
    // Tên đường OSM nhiều chỗ ghi trơn ("Hà Nội", "Bạch Đằng") → ô địa chỉ hiện "Hà Nội" trông như tên thành phố (đo 23/10/2026,
    // ghim ở Huế). Thiếu chữ loại đường thì thêm "Đường"; Kiệt, Hẻm, Ngõ, Quốc lộ… đã có thì giữ nguyên.
    const coLoaiDuong = (s: string) => /^(đường|phố|kiệt|hẻm|ngõ|ngách|quốc lộ|tỉnh lộ|đại lộ|xa lộ|cao tốc|hương lộ|liên xã|QL|ĐT|DT|tổ|thôn|ấp|khu|lô)(\s|$)/i.test(s);
    const road = a.road ? (coLoaiDuong(a.road) ? a.road : `Đường ${a.road}`) : "";
    const duong = road || a.neighbourhood || "";
    // Ghim vào chỗ CHƯA CÓ TÊN ĐƯỜNG — đất nền, lô trong dự án, đường mới mở —
    // thì lấy tên địa điểm/khu dân cư gần nhất, chứ để ô địa chỉ trống trơn là
    // người đăng tưởng ghim hỏng.
    const moc = a.amenity || a.building || a.shop || a.residential || "";
    // OpenStreetMap xếp phường/xã và quận/huyện vào nhiều khoá khác nhau tuỳ nơi,
    // phải dò lần lượt. Tách RIÊNG quận/huyện với phường/xã: hệ địa chỉ CŨ cần cả
    // hai, hệ MỚI (sau sáp nhập) chỉ dùng phường/xã.
    // ── ĐỌC TỈNH · QUẬN/HUYỆN · PHƯỜNG/XÃ TỪ display_name ────────────────────
    // ⚠️ ĐỪNG QUAY LẠI CHỈ DÙNG CÁC TRƯỜNG LẺ (a.city, a.state…). Sau sáp nhập
    // 2025, OpenStreetMap nhét lung tung: Thanh Hoá ra a.city = "Phường Hạc
    // Thành", Huế ra "Phường Thuận Hoá", Nha Trang ra "Nha Trang" — tức lấy tỉnh
    // theo a.city là SAI ở phần lớn tỉnh. Đo thật 03/09/2026: 12/15 tỉnh hỏng.
    //
    // display_name thì luôn đủ và đúng thứ tự:
    //   "…, Phường Quy Nhơn, Quy Nhơn, Tỉnh Gia Lai, 55111, Việt Nam"
    //   "…, Phường Thuận Hoá, Thành phố Huế, 49118, Việt Nam"
    // Bỏ "Việt Nam" và mã bưu chính thì:
    //   · phần tử CUỐI            = Tỉnh/Thành
    //   · phần tử ÁP CUỐI, nếu KHÔNG phải Phường/Xã = Thành phố/Huyện CŨ
    //     (đây là thứ duy nhất còn sót để suy ra Quận/Huyện của hệ địa chỉ CŨ —
    //      cấp quận/huyện đã bị xoá khỏi bản đồ vì Việt Nam đã bỏ cấp này)
    //   · phần tử bắt đầu bằng Phường/Xã/Thị trấn = Phường/Xã
    const manh = (kq.display_name ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !/^\d+$/.test(s) && s !== "Việt Nam");
    const laPhuongXa = (s: string) => /^(phường|xã|thị trấn)\s/i.test(s);
    const tinhTuTen = manh.length ? manh[manh.length - 1] : "";
    const apCuoi = manh.length >= 2 ? manh[manh.length - 2] : "";
    const phuongTuTen = [...manh].reverse().find(laPhuongXa) ?? "";

    const phuong = phuongTuTen || a.quarter || a.suburb || a.village || a.town || a.hamlet || "";
    const quan =
      a.city_district || a.county || a.district ||
      // Áp cuối là phường/xã nghĩa là không còn cấp trung gian nào để lấy.
      (apCuoi && !laPhuongXa(apCuoi) ? apCuoi : "");
    const tinh = tinhTuTen || a.state || a.province || a.city || "";
    // KHÁCH CHỈ GHIM, BẢN ĐỒ KHÔNG CÓ TÊN ĐƯỜNG / CÔNG TRÌNH Ở ĐÓ (chủ dự án 23/10/2026: "điền địa chỉ gần chính xác nhất")
    // → tên thôn / xóm / khu phố / tổ dân phố chứa điểm ghim (đo 23/10: đường đất chưa đặt tên ở Quảng Trị → "Trâm Lý",
    // Gia Lai → "An Nông"). Bỏ tên trùng cấp phường/xã. Không có nữa thì để trống — phường, tỉnh vẫn điền theo ghim.
    const khuNho = [a.hamlet, a.quarter, a.village].find((x) => x && x !== phuong && !laPhuongXa(x) && !/^đặc khu\s/i.test(x)) ?? "";
    const ngan = [a.house_number, duong || moc || khuNho].filter(Boolean).join(" ").trim();
    // display_name có cả "Việt Nam" và mã bưu chính ở cuối — cắt bớt cho gọn.
    const day = kq.display_name
      ? kq.display_name.split(",").map((s) => s.trim()).slice(0, 4).join(", ")
      : "";
    const mucDo: DiaChiTra["mucDo"] = a.house_number ? "soNha" : duong ? "duong" : "khuVuc";
    const ten: DiaChiTra | null =
      ngan || day ? { ngan, day: day || ngan, tinh, quan, phuong, mucDo, chuoi: kq.display_name ?? "" } : null;
    daTraNguoc.set(khoa, ten);
    return ten;
  } catch {
    daTraNguoc.set(khoa, null);
    return null;
  }
}

export async function timToaDo(diaChi: string): Promise<ToaDoTim | null> {
  const chuoi = diaChi.trim();
  if (!chuoi) return null;

  // Người đăng đã ghim tay → toạ độ nằm ngay trong chuỗi, khỏi tra.
  const ghim = parseLatLng(chuoi);
  if (ghim) return { lat: ghim.lat, lng: ghim.lng, mucDo: "ghim" };

  if (daTra.has(chuoi)) return daTra.get(chuoi) ?? null;

  const tamKhuVuc = centerOfArea(chuoi);
  const duPhong: ToaDoTim | null = tamKhuVuc
    ? { lat: tamKhuVuc[0], lng: tamKhuVuc[1], mucDo: "khuVuc" }
    : null;

  // ⚠️ VẪN PHẢI TRA kể cả khi chưa gõ tên đường. Bảng khu vực có sẵn trong web chỉ
  // liệt kê được vài chục nơi; người đăng chọn "Phường Hoà Xuân, Đà Nẵng" mà bảng
  // không có là bản đồ đứng im, họ không nhận ra mình đang xem chỗ nào.
  // Nominatim tra tên phường/xã Việt Nam khá tốt, cứ hỏi rồi lấy bảng làm dự phòng.
  // LÙI DẦN TỪNG CẤP CHO TỚI KHI BẢN ĐỒ NHẬN RA.
  // Bản đồ nền (OpenStreetMap) chưa cập nhật hết tên phường/xã sau sáp nhập 2025, và
  // nhiều đường mới mở cũng chưa có — nên luôn trỏ tới chỗ chính xác NHẤT CÓ THỂ.
  // TÁCH ĐỊA CHỈ: CHI TIẾT (số nhà, tên đường, tên toà nhà / dự án) · ĐỊA GIỚI (phường/xã, quận/huyện) · TỈNH.
  // Bỏ "Việt Nam" cuối chuỗi (trang dự án ghép thêm cho Google Maps) — để lại thì nó bị coi là tỉnh, đường trùng tên ở
  // tỉnh khác lọt qua.
  const phan = chuoi.split(",").map((x) => x.trim()).filter(Boolean);
  if (phan.length > 1 && /^vi[eệ]t\s*nam$/i.test(phan[phan.length - 1])) phan.pop();
  const tinh = phan[phan.length - 1];
  const iDiaGioi = phan.findIndex((x, i) => i === phan.length - 1 || LA_DIA_GIOI.test(x));
  const chiTiet = phan.slice(0, iDiaGioi);
  const diaGioi = phan.slice(iDiaGioi, -1);
  // Số nhà ghi riêng một mảnh ("76, Altara Residences, Đường Trần Hưng Đạo") thì ghép lại với tên đường.
  const soRieng = chiTiet.find((x) => LA_SO_NHA.test(x))?.replace(/^số\s*/i, "") ?? "";
  const ten = chiTiet.filter((x) => !LA_SO_NHA.test(x));
  // Mảnh tên đường: mảnh có chữ Đường/Phố/Kiệt…; không ghi loại đường thì mảnh sát phường nhất ("Ngô Quyền", "123 Lê Lợi").
  const duongGoc = ten.find((x) => LA_DUONG.test(x.replace(SO_DAU, ""))) ?? ten[ten.length - 1] ?? "";
  // GIAO LỘ / NGÃ BA / NGÃ TƯ / GÓC "X với Y" (chủ dự án 30/10/2026: hồ sơ ghi "Giao lộ Nguyễn Đình Thi với 29/3" → bản đồ không hiểu,
  // rơi về giữa phường): bỏ chữ giao lộ, lấy tên đường đầu để dò
  // "29/3" → "29 Tháng 3" (bản đồ ghi tên đường ngày tháng bằng chữ)
  const cacDuong = duongGoc.replace(/^(giao\s*lộ|ngã\s*(ba|tư|năm|sáu)|góc(\s*đường)?)\s+/i, "")
    .split(/\s+(?:với|và|giao|x)\s+|\s+[-–]\s+/i).map((x) => x.trim().replace(/^(\d{1,2})\/(\d{1,2})$/, "$1 Tháng $2")).filter(Boolean);
  const duong = cacDuong[0] ?? "";
  const hoiDuong = soRieng && duong && !SO_DAU.test(duong) ? `${soRieng} ${duong}` : duong;

  // LÙI DẦN TỚI CHỖ GẦN ĐÚNG NHẤT, KHÔNG BAO GIỜ NHẬN KẾT QUẢ NGOÀI TỈNH CỦA TIN (chủ dự án 23/10/2026: "khách gõ số, tên
  // đường chính xác mà bản đồ không có thì xử lý về địa chỉ gần chính xác nhất"):
  //   1. số nhà + tên đường có trên bản đồ                 → đúng nhà ("ghim")
  //   2. tên đường có, số nhà chưa có                      → trên đúng đoạn đường trong phường ("duong")
  //   3. tên toà nhà / dự án / địa danh khách ghi          → đúng chỗ đó ("duong")
  //   4. phường/xã → quận/huyện khách ghi (tên cũ cũng thử) → giữa khu vực đó ("khuVuc")
  //   5. tỉnh                                              → bảng toạ độ sẵn có, không cần mạng
  // Trước 23/10 hỏi nguyên chuỗi rồi nhận kết quả đầu tiên mà vẫn gọi là "duong" → dấu rơi giữa phường hoặc sang đường khác
  // trùng chữ (Tố Hữu → "Cửa Hữu"), "76, Altara…" thì đọc "76" là tên đường.
  // Giao lộ: thử lần lượt từng đường (đường đầu không có trên bản đồ thì lấy đường kia — chủ dự án 30/10/2026)
  for (const d of hoiDuong ? [hoiDuong, ...cacDuong.slice(1)] : []) {
    const kq = await timDuong(d, diaGioi, tinh);
    if (kq) {
      daTra.set(chuoi, kq);
      return kq;
    }
  }
  const trongTinh = (x: KqTim) => !!tinh && khongDau(x.display_name ?? "").includes(loi(tinh));
  // Tên toà nhà / dự án phải TRÙNG tên bản đồ ghi (tên dài từ 3 chữ thì chứa là đủ) — "Ngô Quyền" không được khớp sang
  // "Trường THCS Ngô Quyền".
  const dungTen = (tenCho: string) => (x: KqTim) => {
    const dau = khongDau((x.display_name ?? "").split(",")[0] ?? "");
    const t = khongDau(tenCho);
    return dau === t || (t.split(" ").length >= 3 && dau.includes(t));
  };
  const thu: [string, MucDoChinhXac, (x: KqTim) => boolean][] = [
    ...ten.filter((x) => !LA_DUONG.test(x.replace(SO_DAU, ""))).map((x): [string, MucDoChinhXac, (x: KqTim) => boolean] =>
      [`${x}, ${tinh}`, "duong", dungTen(x)]),
    ...diaGioi.map((x): [string, MucDoChinhXac, (x: KqTim) => boolean] => [`${x}, ${tinh}`, "khuVuc", () => true]),
  ];
  for (const [q, mucDo, dung] of thu) {
    const ds = (await hoiTim(q)).filter((x) => trongTinh(x) && dung(x));
    // Hỏi tên phường mà bản đồ trả cả đường / quán trùng tên → lấy RANH GIỚI hành chính trước.
    const hop = ds.find((x) => x.class === "boundary" || x.class === "place") ?? ds[0];
    if (hop) {
      const kq: ToaDoTim = { lat: Number(hop.lat), lng: Number(hop.lon), mucDo };
      daTra.set(chuoi, kq);
      return kq;
    }
  }
  daTra.set(chuoi, duPhong);
  return duPhong;
}

// ── DÒ THEO TỪNG BƯỚC, CÓ KIỂM KẾT QUẢ (chủ dự án 14/10/2026) ───────────────
// Tỉnh → Phường/Xã → số nhà, tên đường — tất cả bằng TÊN HỆ MỚI (xem diemTimBanDo).
// Mỗi kết quả bản đồ trả về đều phải ĐÚNG TỈNH, và nếu nó nói nằm ở phường/xã nào
// thì phải ĐÚNG phường/xã đã chọn — sai là bỏ, thử bước sau. Đo 15/10 trên 46 địa
// danh: cách cũ (nhận kết quả đầu tiên) trỏ đúng phường 24/46, sai hẳn tỉnh 4/46.
const khongDau = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase()
    .replace(/[’']/g, "'").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").trim();
const loi = (s: string) => khongDau(s).replace(/^(thanh pho|tinh|phuong|xa|thi tran|dac khu)\s+/, "");
// Mảnh "Phường …/Xã …/Đặc khu …" trong địa chỉ bản đồ trả về (không có thì rỗng).
const phuongTrongKetQua = (ten: string) =>
  ten.split(",").map((x) => x.trim()).find((x) => /^(phường|xã|đặc khu)\s/i.test(x)) ?? "";

// ── TÌM ĐÚNG CON ĐƯỜNG KHÁCH GHI — CHUẨN GOOGLE MAPS (chủ dự án 23/10/2026: "có số và tên đường thì ghim chính xác; có tên
// đường không có số thì ghim kiểu Google Maps") ───────────────────────────────────────────────────────────────────────
// Đo 23/10: "Đường Tố Hữu, Phường An Cựu, Huế" → bản đồ nền không ra gì (tên phường mới chưa có) nên dấu rơi giữa phường;
// "Đường Tố Hữu, Huế" → khớp NHẦM "Cửa Hữu"; "Tố Hữu, Thành phố Huế" → đúng. Đà Nẵng sau sáp nhập có 3 đường Bạch Đằng
// (Hải Châu, Hội An, Tam Kỳ) — hỏi "Bạch Đằng, Đà Nẵng" ra Hội An trước. Nên:
//   · hỏi bằng tên đường KHÔNG kèm chữ "Đường/Phố" (bản đồ nền ghi trơn) + tỉnh;
//   · kết quả PHẢI đúng tên đường (so không dấu) và đúng tỉnh — khớp nhầm thì bỏ;
//   · nhiều đoạn / nhiều đường trùng tên → đoạn ghi đúng phường khách chọn (tên mới hoặc tên cũ đã gộp), không có thì đoạn
//     gần tâm phường nhất;
//   · có số nhà mà bản đồ có đúng số đó → "ghim" (đúng nhà); còn lại → "duong" (dấu nằm trên đường, kiểu Google Maps).
type KqTim = { lat: string; lon: string; display_name?: string; class?: string };
async function hoiTim(q: string): Promise<KqTim[]> {
  try {
    // Trên MÁY CHỦ (cron toạ độ /api/tin-dang/toa-do) hỏi thẳng Nominatim, giãn 1 lượt/giây; trình duyệt đi qua /api/dia-chi.
    const ds = typeof window === "undefined"
      ? await (await import("@/lib/nominatim")).timNominatim(q)
      : await (await fetch("/api/dia-chi?viec=tim&q=" + encodeURIComponent(q))).json();
    return Array.isArray(ds) ? (ds as KqTim[]) : [];
  } catch {
    return [];
  }
}
const boLoaiDuong = (s: string) => s.trim().replace(/^(đường|phố)\s+/i, "").trim();

export async function timDuong(dau: string, phuongs: string[], tinh: string): Promise<ToaDoTim | null> {
  // Tên đường NGÀY THÁNG ("29 Tháng 3", "Đường 2 Tháng 9") giữ nguyên là tên đường — trước bị đọc thành số nhà 29 + đường "Tháng 3"
  const laNgayThang = /^(?:đường\s+)?\d{1,2}\s+tháng\s+\d{1,2}$/i.test(dau.trim());
  const m = laNgayThang ? null : dau.trim().match(/^(?:số\s*)?(\d+[a-z]?(?:\/\d+[a-z]?)*)\s+(.+)$/i);
  const soNha = m ? m[1] : "";
  const ten = boLoaiDuong(m ? m[2] : dau);
  if (ten.length < 3 || !tinh) return null;
  const tenLoi = khongDau(ten);
  const manh = (x: KqTim) => (x.display_name ?? "").split(",").map((s) => s.trim());
  const dungDuong = (x: KqTim) => manh(x).slice(0, 3).some((p) => khongDau(boLoaiDuong(p)) === tenLoi);
  const trongTinh = (x: KqTim) => khongDau(x.display_name ?? "").includes(loi(tinh));
  const ra = (x: KqTim, mucDo: MucDoChinhXac): ToaDoTim => ({ lat: Number(x.lat), lng: Number(x.lon), mucDo });

  // 1. Có số nhà → hỏi đúng số; bản đồ có số đó (mảnh "50" đứng ngay trước tên đường) thì ghim đúng nhà
  if (soNha) {
    const dung = (await hoiTim(`${soNha} ${ten}, ${tinh}`)).find((x) => {
      const p = manh(x);
      const i = p.findIndex((s) => khongDau(boLoaiDuong(s)) === tenLoi);
      return i > 0 && p[i - 1] === soNha && trongTinh(x);
    });
    if (dung) return ra(dung, "ghim");
  }
  // 2. Tên đường → các đoạn ĐÚNG tên, ĐÚNG tỉnh. Hỏi kèm phường trước: bản đồ chỉ trả 5 kết quả, tỉnh có nhiều đường trùng
  //    tên thì hỏi "tên, tỉnh" có thể không có đoạn của phường khách (đo 23/10: "999 Bạch Đằng, Phường Hải Châu" ra Bạch Đằng
  //    Hội An; "119 Hai Bà Trưng, Phường Quy Nhơn" ra Pleiku).
  const phuongLoi = phuongs.map(loi).filter(Boolean);
  const laTrongPhuong = (x: KqTim) => phuongLoi.some((p) => khongDau(x.display_name ?? "").includes(p));
  const doan: KqTim[] = [];
  for (const q of [...(phuongs[0] ? [`${ten}, ${phuongs[0]}, ${tinh}`] : []), `${ten}, ${tinh}`]) {
    for (const x of await hoiTim(q)) if (dungDuong(x) && trongTinh(x) && !doan.some((y) => y.lat === x.lat && y.lon === x.lon)) doan.push(x);
    const trongPhuong = doan.find(laTrongPhuong);
    if (trongPhuong) return ra(trongPhuong, "duong");
  }
  if (!doan.length) return null;
  // Không đoạn nào ghi đúng phường (tên phường mới chưa có trên bản đồ) → đoạn gần tâm phường nhất — nhưng xa quá 8 km là
  // đường trùng tên ở nơi khác: bỏ, để lùi về giữa phường (gần đúng hơn là dấu nằm ở thành phố khác).
  if (phuongs[0]) {
    const tam = (await hoiTim(`${phuongs[0]}, ${tinh}`)).find(trongTinh);
    if (tam) {
      const km = (x: KqTim) => Math.hypot(Number(x.lat) - Number(tam.lat), (Number(x.lon) - Number(tam.lon)) * Math.cos((Number(tam.lat) * Math.PI) / 180)) * 111;
      const gan = [...doan].sort((a, b) => km(a) - km(b))[0];
      return km(gan) <= 8 ? ra(gan, "duong") : null;
    }
  }
  return ra(doan[0], "duong");
}

const daTraBuoc = new Map<string, ToaDoTim | null>();

export async function timToaDoTheoBuoc(d: {
  soNha: string;
  tinh: string;
  phuong: string;
  tenCu: string[];
}): Promise<ToaDoTim | null> {
  if (!d.tinh) return null;
  const khoa = JSON.stringify(d);
  if (daTraBuoc.has(khoa)) return daTraBuoc.get(khoa) ?? null;

  const dungTinh = (ten: string) => khongDau(ten).includes(loi(d.tinh));
  const dungPhuong = (ten: string, batBuoc: boolean) => {
    const p = phuongTrongKetQua(ten);
    if (!p) return !batBuoc;
    return !d.phuong || loi(p) === loi(d.phuong);
  };

  // [chuỗi hỏi, mức độ, có bắt buộc kết quả ghi đúng tên phường không]
  const buoc: [string, MucDoChinhXac, boolean][] = [];
  if (d.soNha && d.phuong) buoc.push([`${d.soNha}, ${d.phuong}, ${d.tinh}`, "duong", false]);
  if (d.phuong) buoc.push([`${d.phuong}, ${d.tinh}`, "khuVuc", true]);
  if (d.soNha && !d.phuong) buoc.push([`${d.soNha}, ${d.tinh}`, "duong", false]);
  for (const c of d.tenCu.slice(0, 4)) buoc.push([`${c}, ${d.tinh}`, "khuVuc", false]);

  let kq: ToaDoTim | null = null;
  try {
    // Có số nhà / tên đường → tìm ĐÚNG con đường trước (timDuong, chuẩn Google Maps), không ra mới lùi về phường như cũ.
    if (d.soNha) kq = await timDuong(d.soNha, [d.phuong, ...d.tenCu], d.tinh);
    if (!kq) for (const [q, mucDo, batBuoc] of buoc) {
      const r = await fetch("/api/dia-chi?viec=tim&q=" + encodeURIComponent(q));
      const ds = (await r.json()) as { lat: string; lon: string; display_name?: string }[];
      const hop = ds.find((x) => dungTinh(x.display_name ?? "") && dungPhuong(x.display_name ?? "", batBuoc));
      if (hop) {
        kq = { lat: Number(hop.lat), lng: Number(hop.lon), mucDo };
        break;
      }
    }
    if (!kq) {
      // Không dò ra phường → về TÂM TỈNH (vẫn đúng tỉnh), không trỏ bừa.
      const bang = centerOfArea(d.tinh);
      if (bang) kq = { lat: bang[0], lng: bang[1], mucDo: "khuVuc" };
      else {
        const r = await fetch("/api/dia-chi?viec=tim&q=" + encodeURIComponent(d.tinh));
        const ds = (await r.json()) as { lat: string; lon: string; display_name?: string }[];
        const hop = ds.find((x) => dungTinh(x.display_name ?? ""));
        if (hop) kq = { lat: Number(hop.lat), lng: Number(hop.lon), mucDo: "khuVuc" };
      }
    }
  } catch {
    const bang = centerOfArea(d.tinh);
    kq = bang ? { lat: bang[0], lng: bang[1], mucDo: "khuVuc" } : null;
  }
  daTraBuoc.set(khoa, kq);
  return kq;
}

// ── GỢI Ý ĐỊA CHỈ KHI ĐANG GÕ ────────────────────────────────────────────────
//
// Khác `timToaDo` ở chỗ: hàm kia tra MỘT chuỗi đã hoàn chỉnh rồi trả đúng một
// điểm; hàm này trả VÀI lựa chọn để người dùng tự chọn cái đúng. Cần thiết vì
// tên đường ở Việt Nam trùng nhau rất nhiều — "Nguyễn Văn Linh" tỉnh nào cũng có,
// "Lê Lợi" thì phường nào cũng có. Bắt máy tự đoán là ghim sai.
//
// khuVuc: Tỉnh/Phường người dùng đã chọn — ghép vào truy vấn để kết quả ưu tiên
// đúng vùng đó thay vì nhảy sang tỉnh khác.
export type GoiYDiaChi = {
  ten: string;   // dòng chính: số nhà + tên đường (hoặc tên địa điểm)
  phu: string;   // dòng phụ: phường, quận, tỉnh
  lat: number;
  lng: number;
};

export async function goiYDiaChi(tuKhoa: string, khuVuc = ""): Promise<GoiYDiaChi[]> {
  const q = tuKhoa.trim();
  if (q.length < 3) return [];
  const truyVan = [q, khuVuc].filter(Boolean).join(", ");
  try {
    const r = await fetch(
      "/api/dia-chi?viec=goiy&q=" + encodeURIComponent(truyVan),
    );
    const ds = (await r.json()) as {
      lat: string;
      lon: string;
      display_name?: string;
      address?: Record<string, string>;
    }[];
    return ds.map((d) => {
      const a = d.address ?? {};
      const ten =
        [a.house_number, a.road].filter(Boolean).join(" ") ||
        a.amenity || a.building || a.neighbourhood ||
        (d.display_name ?? "").split(",")[0].trim();
      const phu = [
        a.quarter || a.suburb || a.village || a.town,
        a.city_district || a.county,
        a.city || a.province || a.state,
      ]
        .filter(Boolean)
        .join(", ");
      return { ten: ten || (d.display_name ?? ""), phu, lat: Number(d.lat), lng: Number(d.lon) };
    });
  } catch {
    return [];
  }
}
