import { normalizeVi } from "@/lib/filters";
import { LOAI_HINH, chuChuaHieu, parseQuery } from "@/lib/smartSearch";

// BÔI ĐẬM phần chữ khớp từ khoá tìm kiếm — dùng trong tiêu đề / địa chỉ kết quả.
// So khớp KHÔNG DẤU (gõ "da nang" vẫn bôi trúng "Đà Nẵng") nhưng vẫn hiện đúng
// chữ gốc có dấu của tin.
export default function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const list = terms.map((t) => normalizeVi(t)).filter((t) => t.length >= 2);
  if (list.length === 0) return <>{text}</>;

  const norm = normalizeVi(text);
  // Đánh dấu từng ký tự có nằm trong vùng khớp hay không.
  // normalizeVi giữ nguyên SỐ ký tự (chỉ bỏ dấu, hạ chữ thường) nên vị trí khớp
  // trên chuỗi không dấu dùng thẳng được cho chuỗi gốc.
  const mark = new Array(text.length).fill(false);
  // CHỈ KHỚP TRỌN TỪ (chủ dự án 21/10/2026: gõ "hội an" mà bôi vụn "an" trong "Tr-an-g", "Qu-an-g" — rối, không liên quan)
  const chu = (c: string | undefined) => !!c && /[a-z0-9]/.test(c);
  for (const t of list) {
    let from = 0;
    for (;;) {
      const i = norm.indexOf(t, from);
      if (i < 0) break;
      if (!chu(norm[i - 1]) && !chu(norm[i + t.length])) {
        for (let k = i; k < i + t.length && k < mark.length; k++) mark[k] = true;
      }
      from = i + 1;
    }
  }

  // HAI CỤM KHỚP CÁCH NHAU MỘT DẤU CÁCH → bôi liền một khối như Google ("Quy Nhơn", không "Quy" · "Nhơn" rời — 07/11/2026)
  for (let i = 1; i < text.length - 1; i++) if (!mark[i] && /\s/.test(text[i]) && mark[i - 1] && mark[i + 1]) mark[i] = true;

  // Gom các ký tự liền nhau thành đoạn để bọc <mark>
  const parts: { s: string; on: boolean }[] = [];
  let cur = "";
  let on = mark[0] ?? false;
  for (let i = 0; i < text.length; i++) {
    if (mark[i] === on) cur += text[i];
    else { parts.push({ s: cur, on }); cur = text[i]; on = mark[i]; }
  }
  if (cur) parts.push({ s: cur, on });

  return (
    <>
      {parts.map((p, i) =>
        p.on ? (
          <mark key={i} className="rounded bg-cvr-gold/25 px-0.5 font-semibold text-inherit">
            {p.s}
          </mark>
        ) : (
          <span key={i}>{p.s}</span>
        ),
      )}
    </>
  );
}

/** CỤM CẦN BÔI ĐẬM theo câu khách tìm — KIỂU GOOGLE: bôi theo CỤM máy đã hiểu (loại hình "căn hộ", tên nơi "Quy Nhơn", đặc điểm
 *  "view biển") và phần chữ còn lại, KHÔNG bôi chữ lẻ nằm trong cụm ("hộ" của "căn hộ") — anh 07/11/2026: "bôi theo từ, cụm từ". */
export function cumTuDam(kw: string): string[] {
  const cau = kw.trim();
  if (!cau) return [];
  const p = parseQuery(cau);
  const nq = ` ${normalizeVi(cau).replace(/[^a-z0-9]+/g, " ")} `;
  const ra: string[] = [];
  // loại hình: đúng cụm khách gõ ("can ho", "chung cu") + tên loại
  for (const [nhan, keys] of LOAI_HINH) if (p.types.includes(nhan)) { ra.push(nhan); for (const k of keys) if (nq.includes(` ${k} `)) ra.push(k); }
  // "nhà" / "nhà đất" chung (không phải loại con) — "nha trang" là nơi, không phải nhà
  const nqN = nq.replace(/ nha trang /g, " ");
  if (/ nha dat /.test(nqN)) ra.push("nhà đất"); else if (/ nha /.test(nqN)) ra.push("nhà");
  // nơi: tên riêng bỏ chữ cấp
  const boCap = (x?: string) => (x ?? "").replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố|TP\.?)\s+/i, "");
  for (const x of [p.place?.ward, p.place?.district, p.place?.province, ...p.places]) if (x) ra.push(boCap(x));
  for (const f of p.features) ra.push(f);
  // phần chữ chưa thành trường nào (tên dự án, đường…) — giữ nguyên cụm
  for (const c of chuChuaHieu(cau).split(",")) if (c.trim().length >= 2) ra.push(c.trim());
  // chỉ bôi cụm KHÁCH ĐÃ GÕ (như Google) — "Đà Nẵng" máy tự hiểu từ "sơn trà" thì không bôi
  const goTrong = (x: string) => nq.includes(` ${normalizeVi(x).replace(/[^a-z0-9]+/g, " ").trim()} `);
  return [...new Set(ra.filter((x) => normalizeVi(x).length >= 2 && goTrong(x)))];
}
