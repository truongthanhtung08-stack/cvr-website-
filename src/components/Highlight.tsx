import { normalizeVi } from "@/lib/filters";

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
  for (const t of list) {
    let from = 0;
    for (;;) {
      const i = norm.indexOf(t, from);
      if (i < 0) break;
      for (let k = i; k < i + t.length && k < mark.length; k++) mark[k] = true;
      from = i + t.length;
    }
  }

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
