import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// Hiển thị 1 video: link YouTube/Vimeo → iframe nhúng; tệp video tải lên → thẻ <video>.
export default function VideoEmbed({ url, className = "" }: { url: string; className?: string }) {
  const embed = videoEmbedUrl(url);
  if (embed) {
    return (
      <div className={`overflow-hidden rounded-xl border border-cvr-line ${className}`}>
        <iframe
          src={embed}
          title="Video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    );
  }
  return (
    <video src={asset(url)} controls preload="metadata" className={`w-full rounded-xl border border-cvr-line ${className}`}>
      Trình duyệt không hỗ trợ phát video.
    </video>
  );
}
