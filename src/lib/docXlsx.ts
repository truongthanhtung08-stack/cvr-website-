// ============================================================================
// ĐỌC FILE EXCEL (.xlsx) NGAY TRONG TRÌNH DUYỆT — KHÔNG cần thư viện ngoài.
// ----------------------------------------------------------------------------
// Vì sao tự viết: chủ dự án soạn tin bằng Excel rồi tải thẳng file .xlsx lên.
// Nếu bắt "Save as CSV" thì Excel hay lưu sai bảng mã → tiếng Việt vỡ dấu.
//
// .xlsx thực chất là một file ZIP chứa XML. Ở đây chỉ cần 2 phần:
//   · xl/sharedStrings.xml   — kho chuỗi dùng chung
//   · xl/worksheets/sheet1.xml — nội dung sheet đầu tiên
// Giải nén bằng DecompressionStream có sẵn của trình duyệt (Chrome/Edge/Safari đời mới).
// Trả về bảng string[][] y như đọc CSV để dùng chung một bộ kiểm tra.
// ============================================================================

type ZipEntry = { ten: string; offset: number; nen: number; coSize: number };

export async function docXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  const muc = docDanhMucZip(dv, bytes);

  const timEntry = (dieuKien: (t: string) => boolean) => muc.find((e) => dieuKien(e.ten));
  const sheetEntry =
    timEntry((t) => t === "xl/worksheets/sheet1.xml") ??
    timEntry((t) => /^xl\/worksheets\/.+\.xml$/.test(t));
  if (!sheetEntry) throw new Error("File Excel không đọc được (không tìm thấy sheet).");

  const sharedEntry = timEntry((t) => t === "xl/sharedStrings.xml");
  const khoChuoi = sharedEntry ? docSharedStrings(await docNoiDung(bytes, sharedEntry)) : [];
  return docSheet(await docNoiDung(bytes, sheetEntry), khoChuoi);
}

// ── ZIP ─────────────────────────────────────────────────────────────────────
function docDanhMucZip(dv: DataView, bytes: Uint8Array): ZipEntry[] {
  // Tìm End Of Central Directory (chữ ký 0x06054b50), quét ngược từ cuối file
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 66_000; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("File không phải Excel (.xlsx) hợp lệ.");

  const soMuc = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true); // vị trí bảng danh mục
  const ds: ZipEntry[] = [];
  const dec = new TextDecoder();

  for (let i = 0; i < soMuc; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const nen = dv.getUint16(p + 10, true);
    const coSize = dv.getUint32(p + 20, true);
    const nLen = dv.getUint16(p + 28, true);
    const eLen = dv.getUint16(p + 30, true);
    const cLen = dv.getUint16(p + 32, true);
    const offset = dv.getUint32(p + 42, true);
    const ten = dec.decode(bytes.subarray(p + 46, p + 46 + nLen));
    ds.push({ ten, offset, nen, coSize });
    p += 46 + nLen + eLen + cLen;
  }
  return ds;
}

async function docNoiDung(bytes: Uint8Array, e: ZipEntry): Promise<string> {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(e.offset, true) !== 0x04034b50) throw new Error("File Excel bị hỏng.");
  const nLen = dv.getUint16(e.offset + 26, true);
  const eLen = dv.getUint16(e.offset + 28, true);
  const dau = e.offset + 30 + nLen + eLen;
  const phan = bytes.subarray(dau, dau + e.coSize);

  if (e.nen === 0) return new TextDecoder().decode(phan);           // không nén
  if (e.nen !== 8) throw new Error("File Excel dùng kiểu nén không hỗ trợ.");

  // Sao ra vùng nhớ riêng để chắc chắn là ArrayBuffer thường (Blob không nhận SharedArrayBuffer)
  const dulieu = new Uint8Array(phan.length);
  dulieu.set(phan);
  const stream = new Blob([dulieu.buffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

// ── XML ─────────────────────────────────────────────────────────────────────
function goEntity(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&"); // giải mã & sau cùng để không hỏng các thực thể trên
}

// Kho chuỗi dùng chung: mỗi <si> có thể gồm nhiều đoạn <t> (chữ in đậm giữa câu…)
function docSharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => goEntity(t[1])).join(""),
  );
}

// "B3" → 1 (số thứ tự cột, bắt đầu từ 0) — để ô trống giữa chừng không bị dồn cột
function chiSoCot(ref: string): number {
  const chu = ref.replace(/[0-9]/g, "");
  let n = 0;
  for (const c of chu) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function docSheet(xml: string, kho: string[]): string[][] {
  const bang: string[][] = [];
  for (const rowM of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const hang: string[] = [];
    for (const cellM of rowM[1].matchAll(/<c([^>]*)\/>|<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const thuocTinh = cellM[1] ?? cellM[2] ?? "";
      const trong = cellM[3] ?? "";
      const ref = /r="([A-Z]+\d+)"/.exec(thuocTinh)?.[1];
      const kieu = /t="([^"]+)"/.exec(thuocTinh)?.[1] ?? "n";

      let gt = "";
      if (kieu === "s") {
        const i = Number(/<v>([\s\S]*?)<\/v>/.exec(trong)?.[1] ?? "-1");
        gt = kho[i] ?? "";
      } else if (kieu === "inlineStr") {
        gt = [...trong.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => goEntity(t[1])).join("");
      } else {
        gt = goEntity(/<v>([\s\S]*?)<\/v>/.exec(trong)?.[1] ?? "");
      }

      const cot = ref ? chiSoCot(ref) : hang.length;
      while (hang.length < cot) hang.push("");
      hang[cot] = gt;
    }
    bang.push(hang);
  }
  // Bỏ dòng trống hoàn toàn (giống khi đọc CSV)
  return bang.filter((r) => r.some((v) => v.trim() !== ""));
}
