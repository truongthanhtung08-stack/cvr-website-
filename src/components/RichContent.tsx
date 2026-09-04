import { asset } from "@/lib/asset";
import VideoEmbed from "@/components/VideoEmbed";
import ContentPhoto from "@/components/ContentPhoto";

// Nội dung admin nhập được lưu dạng text: MỖI ĐOẠN 1 dòng. Ảnh/video chèn giữa bài là
// một dòng riêng theo cú pháp markdown:
//   • Ảnh:   ![](url)
//   • Video: @[video](url)   (tệp mp4/webm đã tải lên, hoặc link YouTube/Vimeo)
//   • Đậm:   **chữ đậm**      • Nghiêng: *chữ nghiêng*
//   • Canh lề: ::center:: / ::right:: / ::justify:: đặt ở ĐẦU dòng
const IMG_MARKER = /^!\[[^\]]*\]\((.+)\)$/;
const VIDEO_MARKER = /^@\[video\]\((.+)\)$/i;
const ALIGN_MARKER = /^::(center|right|justify)::\s?/;

const ALIGN_CLASS: Record<string, string> = {
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

// Đậm / nghiêng trong 1 đoạn — cú pháp markdown quen thuộc, không cần thư viện.
// Hai điểm đã sửa để web hiện ĐÚNG như trong bảng soạn nội dung:
//   1. Dùng khớp KHÔNG THAM LAM (.+?) → chữ đậm có lẫn dấu * bên trong vẫn đậm.
//   2. Dấu sao LẺ (do nội dung cũ bôi đậm nhiều dòng cùng lúc) bị BỎ ĐI thay vì
//      hiện nguyên "**" ra ngoài web như trước.
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // ĐẬM+NGHIÊNG (***) phải đứng TRƯỚC đậm (**), nếu không "***chữ***" sẽ bị
  // khớp nhầm thành **…** và lòi ra một dấu * ở đầu (lỗi đã thấy trong ô soạn tin).
  const re = /(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*[^*\n]+?\*)/g;
  const donLe = (s: string) => s.replace(/\*{1,2}/g, ""); // dọn dấu sao thừa
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(donLe(text.slice(last, m.index)));
    const t = m[0];
    if (t.startsWith("***")) out.push(<strong key={k++}><em>{t.slice(3, -3)}</em></strong>);
    else if (t.startsWith("**")) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(donLe(text.slice(last)));
  return out;
}

export function imageMarkerUrl(line: string): string | null {
  const m = line.trim().match(IMG_MARKER);
  return m ? m[1].trim() : null;
}

export function videoMarkerUrl(line: string): string | null {
  const m = line.trim().match(VIDEO_MARKER);
  return m ? m[1].trim() : null;
}

// Hiển thị nội dung có ảnh/video chèn giữa bài. Tương thích ngược: nội dung cũ
// (toàn văn bản) vẫn hiện như trước — dòng nào không phải marker → đoạn văn <p>.
// Ảnh chèn giữa bài BẤM ĐƯỢC: mở toàn màn hình + zoom + vuốt qua các ảnh khác
// trong cùng bài (ContentPhoto → PhotoViewer).
export default function RichContent({
  paragraphs,
  title,
  wysiwyg = false,
}: {
  paragraphs: string[];
  title?: string;
  // wysiwyg = true (dùng cho MÔ TẢ TIN ĐĂNG): hiện Y HỆT người gõ — giữ nguyên xuống
  // dòng + dòng trống làm ngắt đoạn. false (dự án/bài viết): giữ chế độ cũ (mỗi dòng
  // 1 đoạn) để KHÔNG đổi hiển thị nội dung cũ của chúng.
  wysiwyg?: boolean;
}) {
  // Gom trước toàn bộ ảnh trong bài để bấm ảnh nào cũng vuốt qua lại được.
  // thuTuAnh: dòng thứ i trong bài là ảnh thứ mấy của bộ ảnh.
  const anhTrongBai: string[] = [];
  const thuTuAnh = new Map<number, number>();
  paragraphs.forEach((p, i) => {
    const s = imageMarkerUrl(p);
    if (s) {
      thuTuAnh.set(i, anhTrongBai.length);
      anhTrongBai.push(asset(s));
    }
  });

  // Ảnh / video / dòng có marker căn lề → luôn là MỘT KHỐI riêng (cả 2 chế độ).
  // Mặc định CANH TRÁI (dễ đọc); ai gõ ::center::/::right::/::justify:: thì theo marker.
  const khoiDacBiet = (p: string, i: number): React.ReactNode | null => {
    const video = videoMarkerUrl(p);
    if (video) return <VideoEmbed key={i} url={video} />;
    const viTri = thuTuAnh.get(i);
    if (viTri !== undefined) return <ContentPhoto key={i} images={anhTrongBai} index={viTri} title={title} />;
    const am = p.match(ALIGN_MARKER);
    if (am) return <p key={i} className={ALIGN_CLASS[am[1]]}>{renderInline(p.slice(am[0].length))}</p>;
    return null;
  };

  // ── WYSIWYG: gom các dòng chữ liền nhau (kể cả dòng trống) thành 1 đoạn <p>
  //    whitespace-pre-line → xuống dòng = xuống dòng, dòng trống = ngắt đoạn, đúng
  //    y người đăng gõ. Không cần "đoán" đoạn. Gộp >1 dòng trống về 1 cho gọn. ──
  if (wysiwyg) {
    const blocks: React.ReactNode[] = [];
    let buf: string[] = [];
    const xaBuf = (key: string) => {
      const text = buf.join("\n").replace(/^\n+|\n+$/g, "").replace(/\n{3,}/g, "\n\n");
      buf = [];
      if (text.trim()) {
        blocks.push(
          <p key={key} className="whitespace-pre-line text-left">
            {renderInline(text)}
          </p>,
        );
      }
    };
    paragraphs.forEach((p, i) => {
      const kb = khoiDacBiet(p, i);
      if (kb) {
        xaBuf(`t${i}`);
        blocks.push(kb);
        return;
      }
      buf.push(p); // gom cả dòng trống → pre-line giữ đúng ngắt đoạn
    });
    xaBuf("end");
    return <>{blocks}</>;
  }

  // ── Chế độ cũ (dự án / bài viết): mỗi dòng 1 đoạn, canh trái ──
  return (
    <>
      {paragraphs.map((p, i) => {
        const kb = khoiDacBiet(p, i);
        if (kb) return kb;
        return (
          <p key={i} className="text-left">
            {renderInline(p)}
          </p>
        );
      })}
    </>
  );
}
