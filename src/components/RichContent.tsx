import { asset } from "@/lib/asset";
import VideoEmbed from "@/components/VideoEmbed";
import ContentPhoto from "@/components/ContentPhoto";
import { tachDinhDang } from "@/lib/dinhDangMoTa";

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

// Đậm / nghiêng trong 1 đoạn — đọc bằng bộ dùng chung (src/lib/dinhDangMoTa.ts): dấu * khách
// gõ ("5*20", "*") hiện đúng là dấu *, chỉ dấu định dạng do bộ soạn tạo mới thành đậm/nghiêng.
function renderInline(text: string): React.ReactNode[] {
  return tachDinhDang(text).map((d, k) =>
    d.b && d.i ? <strong key={k}><em>{d.t}</em></strong>
    : d.b ? <strong key={k}>{d.t}</strong>
    : d.i ? <em key={k}>{d.t}</em>
    : d.t,
  );
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
