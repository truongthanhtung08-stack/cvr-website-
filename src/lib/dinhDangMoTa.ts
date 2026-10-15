// ============================================================================
// ĐỌC ĐỊNH DẠNG MÔ TẢ — MỘT BỘ DÙNG CHUNG cho khung soạn (ContentEditor), trang tin
// (RichContent) và chữ trơn (chuThuan: thẻ tin, mô tả cho Google).
//
// Bộ soạn lưu đậm/nghiêng bằng dấu sao: **đậm** · *nghiêng* · ***cả hai***. Trước
// 15/10/2026 MỌI dấu * đều bị hiểu là định dạng nên khách ghi "5*20 và 6*18" thì chữ
// giữa bị nghiêng, dấu * biến mất; thẻ tin còn xoá sạch dấu * ("5*20" → "520").
//
// Quy tắc (chủ dự án 15/10/2026: "ký tự khách nhập phải hiển thị đúng"):
//   · `\*` và `\\` = dấu * / dấu \ THẬT do khách gõ (bộ soạn tự thêm khi lưu).
//   · Dấu * nằm giữa hai chữ số ("5*20") hoặc đứng trơ giữa hai khoảng trắng = chữ thật.
//   · Mở định dạng: dấu * theo sau là chữ (không phải khoảng trắng); đóng: dấu * cùng số
//     lượng, đứng sau chữ, trên CÙNG một dòng.
//   · Dấu ** / *** lẻ không có cặp (nội dung cũ bôi đậm nhiều dòng) → bỏ đi như trước.
// ============================================================================

export type DoanChu = { t: string; b: boolean; i: boolean };

const laSo = (c: string | undefined) => !!c && c >= "0" && c <= "9";
const laTrang = (c: string | undefined) => c === undefined || /\s/.test(c);

function demSao(s: string, i: number): number {
  let n = 0;
  while (s[i + n] === "*") n++;
  return n;
}

// Tìm dấu đóng cùng số lượng `n`, từ vị trí `tu`, trên cùng dòng.
function timDong(s: string, tu: number, n: number): number {
  for (let j = tu; j < s.length; j++) {
    const c = s[j];
    if (c === "\n") return -1;
    if (c === "\\" && (s[j + 1] === "*" || s[j + 1] === "\\")) { j++; continue; }
    if (c !== "*") continue;
    const m = demSao(s, j);
    if (m === n && !laTrang(s[j - 1]) && !(laSo(s[j - 1]) && laSo(s[j + m]))) return j;
    j += m - 1;
  }
  return -1;
}

// Bỏ dấu thoát: `\*` → `*`, `\\` → `\`.
const boThoat = (s: string) => s.replace(/\\([*\\])/g, "$1");

/** Tách một đoạn chữ thành các mảnh có/không đậm, nghiêng. */
export function tachDinhDang(s: string): DoanChu[] {
  const out: DoanChu[] = [];
  let tho = "";
  const day = (t: string, b = false, i = false) => {
    if (!t) return;
    if (!b && !i) { tho += t; return; }
    if (tho) { out.push({ t: tho, b: false, i: false }); tho = ""; }
    out.push({ t, b, i });
  };
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === "\\" && (s[k + 1] === "*" || s[k + 1] === "\\")) { day(s[k + 1]); k++; continue; }
    if (c !== "*") { day(c); continue; }
    const n = demSao(s, k);
    const giuaSo = laSo(s[k - 1]) && laSo(s[k + n]);
    const coTheMo = n <= 3 && !giuaSo && !laTrang(s[k + n]);
    const dong = coTheMo ? timDong(s, k + n, n) : -1;
    if (dong > k + n) {
      day(boThoat(s.slice(k + n, dong)), n >= 2, n !== 2);
      k = dong + n - 1;
      continue;
    }
    // Không thành cặp: dấu * đơn là chữ thật; ** / *** lẻ là dấu soạn thảo sót → bỏ.
    if (n === 1 || giuaSo) day("*".repeat(n));
    k += n - 1;
  }
  if (tho) out.push({ t: tho, b: false, i: false });
  return out;
}

/** Chữ trơn (bỏ định dạng, GIỮ ký tự khách gõ). */
export function boDinhDang(s: string): string {
  return tachDinhDang(s).map((d) => d.t).join("");
}

/** Bộ soạn → dữ liệu: dấu * và \ khách gõ phải được đánh dấu là chữ thật. */
export function thoatChu(s: string): string {
  return s.replace(/[\\*]/g, (c) => "\\" + c);
}
