import { asset } from "@/lib/asset";
import VideoEmbed from "@/components/VideoEmbed";

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
  const re = /(\*\*.+?\*\*|\*[^*\n]+?\*)/g;
  const donLe = (s: string) => s.replace(/\*{1,2}/g, ""); // dọn dấu sao thừa
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(donLe(text.slice(last, m.index)));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
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
export default function RichContent({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((p, i) => {
        const video = videoMarkerUrl(p);
        if (video) return <VideoEmbed key={i} url={video} />;
        const src = imageMarkerUrl(p);
        if (src) {
          return (
            <figure key={i} className="overflow-hidden rounded-xl border border-cvr-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(src)} alt="" loading="lazy" className="h-auto w-full object-cover" />
            </figure>
          );
        }
        const am = p.match(ALIGN_MARKER);
        const body = am ? p.slice(am[0].length) : p;
        return (
          <p key={i} className={am ? ALIGN_CLASS[am[1]] : undefined}>
            {renderInline(body)}
          </p>
        );
      })}
    </>
  );
}
