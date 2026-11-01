import { normalizeVi } from "@/lib/filters";
import { LOAI_HINH } from "@/lib/smartSearch";

// ============================================================================
// GÕ TIẾP KIỂU GOOGLE — đoán CHỮ CUỐI khách đang gõ dở (chủ dự án 01/11/2026: gõ "Căn hộ đà nẵng dưới 2 tỷ gần trung tâm" từng chữ,
// bước nào gợi ý cũng phải chuẩn và logic). Trước đây chữ dở ("đà", "dư", "gầ") bị chép nguyên vào câu gợi ý ("Bán căn hộ dư tại Đà
// Nẵng") hoặc làm mất gợi ý ("đà nẵ" → trống). Nay:
//   · chữ cuối (có thể nhiều chữ: "đà nẵ") là ĐẦU của một cụm trong bộ từ của web → điền trọn cụm ("đà" → Đà Nẵng, Đà Lạt);
//   · số đứng cuối ("dưới 2") → "2 tỷ" / "2 triệu"; từ nối còn thiếu vế ("gần") → các cụm có sẵn ("gần biển", "gần trung tâm"…);
//   · không đoán được → bỏ chữ dở ngắn, không chép vào gợi ý.
// Bộ từ: loại hình (smartSearch), đặc điểm, mức giá, mục đích + ĐỊA DANH ĐANG CÓ TIN (nơi gọi truyền vào từ dữ liệu thật).
// Gõ có dấu thì so có dấu, gõ không dấu thì so không dấu (như khopTen). MỘT hàm cho mọi ô tìm.
// ============================================================================

const CUM_CO_DINH = [
  // mục đích
  "bán", "mua", "cho thuê", "thuê", "dự án",
  // loại hình hay gõ (nhãn loại hình thêm từ LOAI_HINH)
  "nhà", "đất", "căn hộ", "chung cư", "nhà phố", "biệt thự", "liền kề",
  // đặc điểm — XẾP THEO ĐỘ PHỔ BIẾN (gõ "gần" → gần biển, gần trung tâm… theo đúng thứ tự này)
  "gần biển", "gần trung tâm", "view biển", "trung tâm", "gần trường", "gần chợ", "gần sông", "view sông", "cao cấp", "mới xây",
  "full nội thất", "sổ hồng", "sổ đỏ", "hẻm ô tô", "mặt tiền", "giá rẻ", "phòng ngủ",
  // đơn vị giá — chữ trọn, không phải chữ dở
  "tỷ", "triệu",
];
/** Từ nối cần vế sau — đứng cuối câu một mình thì chưa thành ý (bỏ khi dựng gợi ý) */
const NOI_CAN_VE = new Set(["duoi", "tren", "tu", "khoang", "gia", "tai", "o", "gan"]);

const thuong = (s: string) => s.normalize("NFC").toLowerCase();
const coDau = (s: string) => normalizeVi(s) !== s;

/** Bộ từ gõ tiếp: cụm cố định + nhãn loại hình + địa danh đang có tin */
export function boTuGoTiep(diaDanh: string[]): string[] {
  const ra = new Map<string, string>();
  for (const c of [...CUM_CO_DINH, ...LOAI_HINH.map(([nhan]) => nhan), ...diaDanh]) {
    const k = thuong(c.trim());
    if (k && !ra.has(k)) ra.set(k, c.trim());
  }
  return [...ra.values()];
}

/** Câu đã điền trọn chữ cuối — tối đa `toiDa` cách hiểu, theo thứ tự nên gợi ý. Câu đã trọn (kết thúc bằng dấu cách) giữ nguyên. */
export function goTiep(raw: string, boTu: string[], toiDa = 3): string[] {
  if (!raw.trim()) return [];
  if (/\s$/.test(raw)) return [boNoiCuoi(raw.trim())].filter(Boolean);
  const tu = raw.trim().split(/\s+/);
  const cuoi = tu[tu.length - 1];
  const truoc = tu.slice(0, -1).join(" ");
  const noi = (s: string) => (truoc ? `${truoc} ${s}` : s);

  // Số đứng cuối ("dưới 2") → đơn vị giá
  if (/^\d+([.,]\d+)?$/.test(cuoi)) return [noi(`${cuoi} tỷ`), noi(`${cuoi} triệu`)];

  // Thử cụm dài trước: 3 chữ cuối, 2 chữ cuối, 1 chữ cuối là ĐẦU của một cụm trong bộ từ
  for (let k = Math.min(3, tu.length); k >= 1; k--) {
    const duoi = thuong(tu.slice(-k).join(" "));
    const dau = tu.slice(0, -k).join(" ");
    const so = coDau(duoi) ? (c: string) => thuong(c) : (c: string) => normalizeVi(c);
    const khop = boTu
      .filter((c) => { const x = so(c); return x.startsWith(duoi) && (x.length === duoi.length || x.split(" ").length >= k); })
      // cụm trùng trọn ưu tiên, rồi GIỮ THỨ TỰ BỘ TỪ (độ phổ biến: đặc điểm theo danh sách, địa danh theo số tin)
      .sort((a, b) => (so(a) === duoi ? -1 : 0) - (so(b) === duoi ? -1 : 0));
    if (!khop.length) continue;
    // Gõ TRỌN một cụm ("căn hộ", "đà nẵng") → câu đã trọn, chỉ thêm các cụm dài hơn bắt đầu bằng nó ("gần" → gần biển…)
    const tron = khop.find((c) => so(c) === duoi);
    if (tron && !NOI_CAN_VE.has(normalizeVi(duoi))) return [raw.trim()];
    const ra = khop.filter((c) => so(c) !== duoi).slice(0, toiDa).map((c) => (dau ? `${dau} ${c}` : c));
    if (ra.length) return ra;
  }
  // Không đoán được: chữ dở ngắn (≤ 3 ký tự) bỏ đi; chữ dài giữ (có thể là từ khách muốn dò trong nội dung tin — "sân vườn")
  return [boNoiCuoi(cuoi.length <= 3 ? truoc : raw.trim())].filter(Boolean);
}

/** Bỏ từ nối còn thiếu vế ở cuối câu ("… dưới", "… gần") — chưa thành ý thì không đưa vào gợi ý */
function boNoiCuoi(cau: string): string {
  const tu = cau.split(/\s+/);
  while (tu.length && NOI_CAN_VE.has(normalizeVi(tu[tu.length - 1]))) tu.pop();
  return tu.join(" ");
}

/** Địa danh đang có tin — mỗi phần địa chỉ của tin (phường/xã bỏ chữ cấp, tỉnh/thành) */
export function diaDanhTuTin(diaChi: string[]): string[] {
  const dem = new Map<string, number>();
  for (const d of diaChi) for (const phan of d.split(",")) {
    const x = phan.trim().replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố|TP\.?)\s+/i, "");
    if (x && !/\d/.test(x) && x.length <= 30) dem.set(x, (dem.get(x) ?? 0) + 1);
  }
  // nơi nhiều tin đứng trước (gõ "đà" → Đà Nẵng trước Đà Lạt nếu Đà Nẵng nhiều tin hơn)
  return [...dem.entries()].sort((a, b) => b[1] - a[1]).map(([x]) => x);
}
