"use client";

import { useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { isVideoUrl } from "@/lib/media";
import { uploadImageFile, uploadVideoFile } from "@/lib/uploadImage";

// PHÂN BIỆT MÁY — quyết định có hiện dòng "Máy ảnh" hay không.
//   · Điện thoại (Android, iPhone) · Máy tính bảng, iPad → CÓ máy ảnh cầm tay → hiện
//   · Máy tính bàn / laptop (Windows, macOS, Linux) → KHÔNG → ẩn
// iPad đời mới khai mình là "Macintosh", chỉ lộ ra ở chỗ có nhiều điểm chạm —
// nên phải kiểm maxTouchPoints, không thể chỉ đọc tên hệ máy. Laptop cảm ứng
// Windows thì vẫn là máy tính, phải đọc tên hệ máy TRƯỚC.
// Bề rộng màn hình KHÔNG dùng làm căn cứ: tablet ngang rộng bằng laptop.
function coMayAnhCamTay() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPod/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return false;
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

// ⛔ accept CỦA DÒNG "THƯ VIỆN ẢNH" PHẢI LÀ "image/*" TRẦN — đừng kê dãy kiểu
// ảnh cụ thể (image/jpeg,image/png,…). Đo trên máy thật 12/09/2026: Samsung
// Internet không đọc được dãy đó, rơi về "chọn tệp bất kỳ" nên dòng Thư viện ra
// đúng cùng một bảng với dòng Thư mục (Máy ảnh · Máy quay · Files).
// Cũng đừng thêm "android/allowCamera": Chrome mất luôn lưới ảnh.

// BA LỐI CHỌN ẢNH. Mỗi lối một LOGO ĐẶC TRƯNG, đúng kiểu khách vẫn thấy trên
// điện thoại (ảnh núi-mặt trời xanh · thư mục vàng · máy ảnh đen), để nhìn phát
// biết bấm cái nào — chủ dự án chốt 12/09/2026: bảng xổ ra mà nhạt quá thì
// "thấy như đứng yên, không ai biết mà chọn".
const LOI_CHON = [
  {
    ma: "thuvien",
    ten: "Thư viện ảnh",
    accept: "image/*",
    capture: false,
    nhieu: true,
    nen: "bg-[#e8f1fe] text-[#0071e3]",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2.5" fill="currentColor" opacity=".16" />
        <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="8.6" cy="9.6" r="1.5" fill="currentColor" />
        <path d="M4 17.2l4.4-4.4a2 2 0 012.9 0l2.3 2.4 2-2a2 2 0 012.9 0L20 15.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    ma: "thumuc",
    // ⛔ KHAI THEO ĐUÔI TỆP, ĐỪNG ĐỂ TRỐNG. Ô không khai gì thì trình duyệt hiểu
    // là "tệp bất kỳ" và TỰ THÊM Máy ảnh + Máy quay vào bảng — bấm Thư mục lại
    // ra ba thứ, không vào thẳng thư mục (đo trên máy thật 12/09/2026, cả Chrome
    // lẫn Samsung Internet). Kê đuôi tệp thì trình duyệt mở THẲNG trình duyệt
    // tệp, và chỉ hiện ảnh cho khỏi lẫn. Cũng đừng khai "image/*" ở dòng này —
    // khai vậy là ra lưới ảnh, trùng với dòng Thư viện ảnh.
    ten: "Thư mục",
    accept: ".jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp",
    capture: false,
    nhieu: true,
    nen: "bg-[#fff3d6] text-[#e5a00d]",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 7.5A2.5 2.5 0 015.5 5h3.2l2 2.2h8A2.3 2.3 0 0121 9.5V17a2 2 0 01-2 2H5a2 2 0 01-2-2V7.5z" fill="currentColor" opacity=".2" />
        <path d="M3 7.5A2.5 2.5 0 015.5 5h3.2l2 2.2h8A2.3 2.3 0 0121 9.5V17a2 2 0 01-2 2H5a2 2 0 01-2-2V7.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    ma: "mayanh",
    ten: "Máy ảnh",
    accept: "image/*",
    capture: true,
    nhieu: false,
    nen: "bg-[#eceef1] text-[#3a3a3c]",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M4 8.5A1.5 1.5 0 015.5 7h1.9l1.2-1.7h6.8L16.6 7h1.9A1.5 1.5 0 0120 8.5v8.6a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.1V8.5z" fill="currentColor" opacity=".18" />
        <path d="M4 8.5A1.5 1.5 0 015.5 7h1.9l1.2-1.7h6.8L16.6 7h1.9A1.5 1.5 0 0120 8.5v8.6a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.1V8.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="12" cy="12.8" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
] as const;

// Quản lý MEDIA tin đăng/dự án: ẢNH và VIDEO — TẢI TỪ MÁY hoặc DÁN LINK.
// value là mảng đường dẫn (ảnh + video xen kẽ theo thứ tự thêm). ẢNH ĐẠI DIỆN =
// ẢNH ĐẦU TIÊN trong mảng (video không làm đại diện). "Đặt làm đại diện" = đưa ảnh đó lên đầu.
export default function ImagePicker({
  value,
  onChange,
  maxImages,
  maxVideos,
  tierName,
}: {
  value: string[];
  onChange: (imgs: string[]) => void;
  maxImages?: number;   // giới hạn ẢNH — mức chung 15, hoặc theo cấp tin khi admin bật
  maxVideos?: number;   // giới hạn VIDEO — mức chung 1, hoặc theo cấp tin khi admin bật
  tierName?: string;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  // Link ảnh không tải được (trang nguồn chặn hotlink / không phải ảnh trực tiếp)
  const [broken, setBroken] = useState<string[]>([]);
  // Đang mở bảng ba lối chọn ảnh hay chưa (bảng của mình, không phải của máy).
  const [moChon, setMoChon] = useState(false);

  // Điện thoại và máy tính bảng: đủ BA lối. Máy tính bàn/laptop: HAI lối.
  // Thuộc tính `capture` chỉ có tác dụng trên máy có máy ảnh cầm tay; để dòng
  // "Máy ảnh" trên máy bàn thì bấm vào lại ra hộp chọn tệp — ghi một đằng làm
  // một nẻo. Xem coMayAnhCamTay() ở đầu tệp.
  const loiHien = moChon ? LOI_CHON.filter((lo) => lo.ma !== "mayanh" || coMayAnhCamTay()) : LOI_CHON;

  // Chỉ số ẢNH ĐẠI DIỆN = ảnh (không phải video) ĐẦU TIÊN trong mảng.
  const coverIdx = value.findIndex((v) => !isVideoUrl(v));

  // Số ẢNH (không tính video) đang có và còn nhận thêm được bao nhiêu
  const soAnh = value.filter((v) => !isVideoUrl(v)).length;
  const conNhan = maxImages == null ? Infinity : Math.max(0, maxImages - soAnh);

  // Số VIDEO đang có và còn nhận thêm được bao nhiêu (đếm riêng, không lẫn với ảnh)
  const soVideo = value.filter(isVideoUrl).length;
  const conNhanVideo = maxVideos == null ? Infinity : Math.max(0, maxVideos - soVideo);

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");

    let ds = Array.from(files);
    if (ds.length > conNhan) {
      ds = ds.slice(0, conNhan);
      setError(
        conNhan === 0
          ? `Tin ${tierName ?? ""} chỉ đăng tối đa ${maxImages} ảnh — xoá bớt ảnh cũ hoặc nâng cấp gói tin.`
          : `Chỉ nhận thêm ${conNhan} ảnh (tối đa ${maxImages} ảnh cho tin ${tierName ?? ""}). Các ảnh chọn dư đã bỏ qua.`,
      );
      if (conNhan === 0) { if (imgRef.current) imgRef.current.value = ""; return; }
    }

    setUploadingImg(true);
    const added: string[] = [];
    for (const file of ds) {
      const { url, error: e } = await uploadImageFile(file);
      if (e) setError(e);
      else if (url) added.push(url);
    }
    if (added.length) onChange([...value, ...added]);
    setUploadingImg(false);
    if (imgRef.current) imgRef.current.value = "";
  }

  // Lối "Thư mục" cố ý không khai loại tệp (khai vào thì trình duyệt tệp lọc sạch,
  // vào thư mục nào cũng thấy trống). Đổi lại là có thể lẫn tệp khác, nên lọc tại đây.
  async function handleThuMuc(files: FileList | null) {
    if (!files || files.length === 0) return;
    const ds = Array.from(files);
    const anh = ds.filter((f) => f.type.startsWith("image/"));
    if (!anh.length) {
      setError("Tệp vừa chọn không phải ảnh.");
      return;
    }
    const dt = new DataTransfer();
    for (const f of anh) dt.items.add(f);
    await handleImageFiles(dt.files);
  }

  // Đang KHÔNG dùng: nút "Thêm video" đã bỏ 11/09/2026 (video đăng bằng link YouTube).
  // Giữ nguyên hàm để ngày nào lên gói trả phí muốn cho tải video lên lại thì chỉ
  // việc trả khối nút về, không phải viết lại.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleVideoFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    if (conNhanVideo <= 0) {
      setError(`Mỗi tin chỉ đăng tối đa ${maxVideos} video — xoá video cũ rồi thêm lại.`);
      if (videoRef.current) videoRef.current.value = "";
      return;
    }
    setUploadingVideo(true);
    const { url, error: e } = await uploadVideoFile(file);
    setUploadingVideo(false);
    if (e) setError(e);
    else if (url) onChange([...value, url]);
    if (videoRef.current) videoRef.current.value = "";
  }

  // Dán link: nhận cả link ảnh và link video (YouTube/Vimeo/mp4) — thêm vào mảng.
  function addLink() {
    const url = link.trim();
    if (!url) return;
    if (!isVideoUrl(url) && conNhan <= 0) {
      setError(`Tin ${tierName ?? ""} chỉ đăng tối đa ${maxImages} ảnh.`);
      return;
    }
    if (isVideoUrl(url) && conNhanVideo <= 0) {
      setError(`Mỗi tin chỉ đăng tối đa ${maxVideos} video.`);
      return;
    }
    onChange([...value, url]);
    setLink("");
  }

  const setCover = (i: number) => onChange([value[i], ...value.filter((_, j) => j !== i)]);
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      {/* Lưới media đã có */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((src, i) => {
            const video = isVideoUrl(src);
            const isCover = !video && i === coverIdx;
            return (
              <div
                key={`${src}-${i}`}
                className={`group relative overflow-hidden rounded-xl border bg-cvr-surface ${
                  isCover ? "border-cvr-ink ring-2 ring-cvr-ink/15" : "border-cvr-line"
                }`}
              >
                <div className="aspect-[4/3]">
                  {video ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-cvr-ink/90 p-2 text-center text-white">
                      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      <span className="text-[10px] font-medium">Video</span>
                    </div>
                  ) : broken.includes(src) ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                      <svg className="h-6 w-6 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" /></svg>
                      <span className="text-[10px] font-medium text-cvr-muted">Link ảnh không hiện được</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={asset(src)}
                      alt={`Ảnh ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={() => setBroken((b) => (b.includes(src) ? b : [...b, src]))}
                    />
                  )}
                </div>

                {/* Xoá (góc trên phải) */}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Xoá"
                  className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/80"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Thanh đáy: ảnh đại diện / đặt đại diện (chỉ ẢNH). Video: nhãn "Video". */}
                {video ? null : isCover ? (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-cvr-ink/90 py-1 text-[11px] font-semibold text-white">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" /></svg>
                    Ảnh đại diện
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/45 py-1 text-[11px] font-medium text-white transition hover:bg-black/70"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5l2.35 5.09 5.55.62-4.13 3.74 1.14 5.46L11.48 21l-4.91-2.99 1.14-5.46-4.13-3.74 5.55-.62L11.48 3.5z" /></svg>
                    Đặt làm đại diện
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bộ đếm ảnh theo cấp tin — nhìn là biết còn được thêm bao nhiêu */}
      {maxVideos != null && (
        <p className="text-xs text-cvr-muted">
          Video: <span className={soVideo >= maxVideos ? "text-red-600" : "text-cvr-ink"}>{soVideo}/{maxVideos}</span>
        </p>
      )}
      {maxImages != null && (
        <p className="text-sm font-medium text-cvr-body">
          Ảnh: <span className={soAnh >= maxImages ? "text-red-600" : "text-cvr-ink"}>{soAnh}/{maxImages}</span>
          {tierName ? <span className="text-cvr-muted"> · tin {tierName}</span> : null}
          {soAnh >= maxImages && <span className="text-red-600"> — đã đủ, nâng cấp gói để đăng thêm ảnh</span>}
        </p>
      )}

      {/* Nút tải ảnh / video + dán link
          ⚠️ ĐIỆN THOẠI — MỞ THẲNG BỘ SƯU TẬP, KHÔNG QUA TRÌNH DUYỆT THƯ MỤC.
          Đa số khách up ảnh/video từ Bộ sưu tập chứ không ai đi tìm thư mục.
          accept PHẢI là "image/*" (kiểu MIME), TUYỆT ĐỐI không ghi đuôi tệp kiểu
          ".jpg,.png" và không trộn "image/*,video/*" vào một ô — cả hai cách đó làm
          Android mở ứng dụng Tệp/Documents thay vì bộ sưu tập ảnh. Cũng KHÔNG thêm
          thuộc tính capture (ép mở thẳng camera).
          Nút gộp "ảnh & video" đã BỎ (11/9/2026): trộn hai loại thì Samsung hiện
          bảng "Chọn một thao tác — Máy ảnh · File của bạn · Files", không có Bộ
          sưu tập đâu cả. Tách riêng ảnh và video thì máy mở đúng thư viện.
          Ô chọn tệp phải nằm TRONG <label> và chỉ ẩn bằng sr-only.
          Trước đây để className="hidden" (display:none) rồi gọi input.click() —
          trình duyệt đời cũ trên Android/iOS bỏ qua ô đã display:none nên khách
          bấm không mở được thư viện ảnh, hoặc mở mà không chọn được nhiều tấm.
          Bấm thẳng vào nhãn là hành vi gốc của trình duyệt, máy nào cũng chạy. */}
      {/* ⛔ ĐỪNG THÊM `android/allowCamera` VÀO accept — đã thử và ĐÃ BÁC 12/09/2026.
          Mẹo đó được đồn là kéo lại mục Máy ảnh trên Android 14/15. Đo trên máy
          thật (Chrome, Android): thêm vào thì MẤT HẲN lưới ảnh, bảng chỉ còn
          Máy ảnh · Files. Tệ hơn hẳn. accept phải đúng "image/*" trần. */}

      {/* ⛔ BA LỐI NÀY LÀ YÊU CẦU CỨNG CỦA CHỦ DỰ ÁN — ĐỪNG RÚT BỚT.
          "1 bấm up ảnh: trở ra CẢ 3 (Thư viện ảnh, Thư mục, Máy ảnh)".

          Vì sao mình tự dựng bảng thay vì để bảng của máy lo: bảng của Android
          KHÔNG ổn định. Đo trên máy thật 12/09/2026, cùng một điện thoại:
            · Chrome + accept="image/*"          → lưới ảnh, KHÔNG có Máy ảnh
            · Samsung Internet + accept="image/*" → Máy ảnh · File của bạn · Files,
                                                    KHÔNG có Bộ sưu tập
          Nên bảng này do mình vẽ: ba lối luôn có mặt, máy nào trình duyệt nào
          cũng như nhau. Mỗi lối là một ô chọn tệp riêng, khai riêng:
            · Thư viện ảnh → accept="image/*"                (mở thư viện/lưới ảnh)
            · Thư mục      → KHÔNG khai accept                (mở trình duyệt tệp)
            · Máy ảnh      → accept="image/*" + capture       (mở thẳng máy ảnh)
          Ô "Thư mục" nhận lẫn tệp khác nên có handleThuMuc lọc lại. */}
      <div>
        {!moChon ? (
          <button
            type="button"
            onClick={() => setMoChon(true)}
            disabled={uploadingImg}
            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 ${uploadingImg ? "pointer-events-none opacity-60" : ""}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
            {uploadingImg ? "Đang tải ảnh…" : "Thêm ảnh"}
          </button>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] motion-safe:animate-[xoBang_.18s_ease-out]">
            <style>{"@keyframes xoBang{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}"}</style>
            {loiHien.map((lo, i) => (
              <label
                key={lo.ma}
                onClick={() => setMoChon(false)}
                className={`relative flex cursor-pointer items-center gap-3.5 px-4 py-3.5 transition active:bg-cvr-surface ${i > 0 ? "border-t border-cvr-line" : ""}`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${lo.nen}`}>
                  {lo.icon}
                </span>
                <span className="flex-1 text-[15px] font-semibold text-cvr-ink">{lo.ten}</span>
                <svg className="h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                <input
                  ref={lo.ma === "thuvien" ? imgRef : undefined}
                  type="file"
                  {...(lo.accept ? { accept: lo.accept } : {})}
                  {...(lo.capture ? { capture: "environment" as const } : {})}
                  {...(lo.nhieu ? { multiple: true } : {})}
                  disabled={uploadingImg}
                  onChange={(e) => (lo.ma === "thumuc" ? handleThuMuc(e.target.files) : handleImageFiles(e.target.files))}
                  // Samsung Internet: ô chọn tệp phải là Ô THẬT phủ kín dòng, không
                  // phải ô ẩn 1px. Đo 12/09/2026: với ô sr-only, trình duyệt đó rơi
                  // về bảng chọn chung ở CẢ BA lối (kể cả lối Thư mục) — đây là thứ
                  // duy nhất còn khác so với các trang web thường. Trình duyệt khác
                  // giữ sr-only vì đang chạy đúng.
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        )}

        {/* NÚT "THÊM VIDEO" ĐÃ BỎ (11/09/2026, chủ dự án chốt: "kiểu gì cũng phải
            chuyển qua kênh YouTube"). Video nay chỉ nhận LINK YOUTUBE ở ô bên dưới.
            Lý do: một video tải lên ăn ~16 MB kho, bằng 40 tấm ảnh — 14 video đã
            chiếm 41% cả kho trong khi 889 tấm ảnh mới chiếm phần còn lại. Link
            YouTube thì tốn 0 MB, mà trên trang tin hiện y hệt: vẫn nằm trong thư
            viện ảnh, vẫn bấm play chạy tại chỗ, vẫn xem lớn và xoay được.
            Hàm handleVideoFile GIỮ NGUYÊN bên trên — ngày nào lên gói trả phí
            muốn mở lại thì chỉ việc trả khối nút này về. */}

        {/* ⛔ ĐỪNG THÊM LẠI NÚT "CHỌN TỪ THƯ MỤC" — đã gỡ 12/09/2026.

            Ô đó cố ý không khai accept. Không khai loại tệp thì Android gửi ý
            định chọn tệp CHUNG CHUNG, mà app Thư viện (Bộ sưu tập) chỉ đăng ký
            nhận yêu cầu ảnh — nên nó BIẾN MẤT khỏi bảng "Chọn một thao tác",
            chỉ còn Máy ảnh · File của bạn · Files. Đúng cái bảng chủ dự án chụp
            lại và đã phải nhắc rất nhiều lần.

            Với accept="image/*" đơn thuần, bảng của Android TỰ CÓ đủ ba lối:
            Bộ sưu tập · Files · Máy ảnh. Nên MỘT nút là đủ; thêm nút phụ chỉ tạo
            chỗ cho khách bấm nhầm rồi tưởng web không mở được thư viện ảnh.

            Chỗ này đã phá đi dựng lại nhiều lần. ĐỂ YÊN. */}

      </div>




      {/* Ô dán link nằm HẲN Ở DÒNG RIÊNG bên dưới hai nút — không đứng chung
          hàng nữa nên không bao giờ bị đẩy ra ngoài mép màn hình. */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs text-cvr-faint">Thêm video (link YouTube) hoặc link ảnh</p>
        <div className="flex w-full min-w-0 items-center gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
            placeholder="Dán link YouTube của video, hoặc link ảnh…"
            // min-w-0 (KHÔNG đặt bề rộng tối thiểu cứng) → trên điện thoại ô co lại
            // vừa màn hình, nút "Thêm" không bị đẩy ra ngoài mép phải.
            className="h-10 w-full min-w-0 flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
          />
          <button
            type="button"
            onClick={addLink}
            className="shrink-0 rounded-lg border border-cvr-line px-3 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Thêm
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}
      {/* Nhãn "Ảnh đại diện" và nút "Đặt làm đại diện" đã nằm ngay dưới từng ảnh,
          ô dán link đã ghi rõ nhận YouTube/Vimeo/mp4 → chỉ còn giữ giới hạn dung
          lượng, thứ duy nhất khách không nhìn ra được. */}
      <p className="text-xs text-cvr-faint">Ảnh ≤ 10MB · Video ≤ 50MB.</p>
    </div>
  );
}
