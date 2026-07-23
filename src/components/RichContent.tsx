import { asset } from "@/lib/asset";
import VideoEmbed from "@/components/VideoEmbed";

// Nội dung admin nhập được lưu dạng text: MỖI ĐOẠN 1 dòng. Ảnh/video chèn giữa bài là
// một dòng riêng theo cú pháp markdown:
//   • Ảnh:   ![](url)
//   • Video: @[video](url)   (tệp mp4/webm đã tải lên, hoặc link YouTube/Vimeo)
const IMG_MARKER = /^!\[[^\]]*\]\((.+)\)$/;
const VIDEO_MARKER = /^@\[video\]\((.+)\)$/i;

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
        return <p key={i}>{p}</p>;
      })}
    </>
  );
}
