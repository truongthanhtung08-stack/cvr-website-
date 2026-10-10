"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { uploadImageFile, uploadVideoFile } from "@/lib/uploadImage";
import { isVideoUrl } from "@/lib/media";
import { imageMarkerUrl, videoMarkerUrl } from "@/components/RichContent";
import { asset } from "@/lib/asset";

// Ô nhập NỘI DUNG có chèn ẢNH & VIDEO giữa bài (Tin đăng · Dự án · Tin tức).
// Mỗi đoạn xuống 1 dòng. Chèn ảnh → dòng ![](url) · chèn video → dòng @[video](url)
// tại vị trí con trỏ. Web hiển thị đúng chỗ đó. Khung cao rộng trên MOBILE để dễ nhập.
// ── TRÌNH SOẠN KIỂU WORD (chủ dự án 10/10/2026: "chỉnh định dạng hiển thị ngay khi nhập liệu
// giống Word") ────────────────────────────────────────────────────────────────────────────
// Khách gõ trong khung soạn: bấm B / I là chữ đậm / nghiêng NGAY, canh lề là dòng canh NGAY,
// ảnh / video hiện NGAY trong bài — không còn ký hiệu ** hay ::center:: lẫn trong chữ.
// DỮ LIỆU LƯU GIỮ NGUYÊN định dạng cũ (mỗi dòng một đoạn · **đậm** · *nghiêng* · ::center:: ·
// ![](ảnh) · @[video](link)) nên RichContent và mọi nội dung cũ không phải đổi gì: khung soạn
// chỉ chuyển qua lại giữa định dạng đó và chữ có định dạng.
// Dán từ nơi khác (Zalo, Word, web): chỉ lấy CHỮ — không mang định dạng rác vào trang tin.

const thoatHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Một dòng dữ liệu → khối HTML trong khung soạn
function dongSangHtml(dong: string): string {
  const anh = imageMarkerUrl(dong);
  if (anh)
    return `<div data-anh="${thoatHtml(anh)}" contenteditable="false" class="khoi-media"><img src="${thoatHtml(asset(anh))}" alt="" /><button type="button" data-xoa aria-label="Bỏ ảnh">×</button></div>`;
  const video = videoMarkerUrl(dong);
  if (video)
    return `<div data-video="${thoatHtml(video)}" contenteditable="false" class="khoi-media khoi-video"><span>▶ Video</span><button type="button" data-xoa aria-label="Bỏ video">×</button></div>`;
  let canh = "";
  let chu = dong;
  const m = dong.match(/^::(center|right|justify)::\s?/);
  if (m) {
    canh = ` style="text-align:${m[1]}"`;
    chu = dong.slice(m[0].length);
  }
  const html = thoatHtml(chu)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<b><i>$1</i></b>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*\n]+?)\*/g, "<i>$1</i>");
  return `<div${canh}>${html || "<br>"}</div>`;
}
const giaTriSangHtml = (v: string) => (v ? v.split("\n").map(dongSangHtml).join("") : "<div><br></div>");

// Khung soạn → dữ liệu (mỗi khối / mỗi lần xuống dòng là một dòng)
const KHOI = new Set(["DIV", "P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "UL", "OL", "SECTION", "ARTICLE"]);
function htmlSangGiaTri(goc: HTMLElement): string {
  const dongs: string[] = [];
  let doan: { t: string; b: boolean; i: boolean }[] = [];
  let canh = "";
  const xongDong = () => {
    const gop: { t: string; b: boolean; i: boolean }[] = [];
    for (const r of doan) {
      const cuoi = gop[gop.length - 1];
      if (cuoi && cuoi.b === r.b && cuoi.i === r.i) cuoi.t += r.t;
      else gop.push({ ...r });
    }
    const chu = gop
      .map((r) => {
        if (!r.t.trim() || (!r.b && !r.i)) return r.t;
        // Giữ khoảng trắng đầu / cuối NGOÀI dấu định dạng ("** chữ**" không hiển thị đúng)
        const dau = r.t.match(/^\s*/)![0];
        const cuoiS = r.t.match(/\s*$/)![0];
        const giua = r.t.trim();
        const dauSao = r.b && r.i ? "***" : r.b ? "**" : "*";
        return `${dau}${dauSao}${giua}${dauSao}${cuoiS}`;
      })
      .join("")
      .replace(/ /g, " ");
    dongs.push(chu.trim() && canh && canh !== "left" && canh !== "start" ? `::${canh}:: ${chu}` : chu);
    doan = [];
  };
  const coChu = () => doan.some((r) => r.t.length > 0);
  const di = (n: Node, b: boolean, i: boolean) => {
    if (n.nodeType === Node.TEXT_NODE) {
      doan.push({ t: n.textContent ?? "", b, i });
      return;
    }
    if (!(n instanceof HTMLElement)) return;
    if (n.dataset.anh || n.dataset.video) {
      if (coChu()) xongDong();
      dongs.push(n.dataset.anh ? `![](${n.dataset.anh})` : `@[video](${n.dataset.video})`);
      return;
    }
    if (n.tagName === "BR") {
      xongDong();
      return;
    }
    if (n.tagName === "BUTTON") return;
    const kieu = n.style;
    const dam = b || n.tagName === "B" || n.tagName === "STRONG" || Number(kieu.fontWeight) >= 600 || kieu.fontWeight === "bold";
    const nghieng = i || n.tagName === "I" || n.tagName === "EM" || kieu.fontStyle === "italic";
    if (KHOI.has(n.tagName)) {
      if (coChu()) xongDong();
      const canhCu = canh;
      canh = kieu.textAlign || n.getAttribute("align") || canh;
      const truoc = dongs.length;
      n.childNodes.forEach((c) => di(c, dam, nghieng));
      if (coChu() || dongs.length === truoc) xongDong(); // khối rỗng = một dòng trống
      canh = canhCu;
      return;
    }
    n.childNodes.forEach((c) => di(c, dam, nghieng));
  };
  goc.childNodes.forEach((c) => di(c, false, false));
  if (coChu()) xongDong();
  while (dongs.length && !dongs[dongs.length - 1].trim()) dongs.pop();
  return dongs.join("\n");
}

export default function ContentEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const khungRef = useRef<HTMLDivElement>(null);
  const daPhat = useRef<string | null>(null); // giá trị khung soạn vừa phát ra (để không vẽ lại khi đang gõ)
  const imgRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [error, setError] = useState("");

  // Giá trị đổi TỪ NGOÀI (nạp tin cũ, bản nháp, đăng tin khác) → vẽ lại khung soạn.
  // Giá trị do chính khung soạn phát ra thì KHÔNG vẽ lại — giữ con trỏ và bộ gõ tiếng Việt.
  useLayoutEffect(() => {
    const el = khungRef.current;
    if (!el || value === daPhat.current) return;
    el.innerHTML = giaTriSangHtml(value);
    daPhat.current = value;
  }, [value]);

  const phat = () => {
    const el = khungRef.current;
    if (!el) return;
    const v = htmlSangGiaTri(el);
    daPhat.current = v;
    if (v !== value) onChange(v);
  };

  // Lệnh định dạng của trình duyệt — giữ vùng chữ đang bôi đen (nút dùng onMouseDown).
  const lenh = (ten: string) => {
    khungRef.current?.focus();
    document.execCommand("defaultParagraphSeparator", false, "div");
    document.execCommand(ten, false);
    phat();
  };

  // Khối của khung soạn đang chứa con trỏ (con trực tiếp của khung); không có → null.
  const khoiDangDung = (): Element | null => {
    const el = khungRef.current;
    const sel = window.getSelection();
    let n: Node | null = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
    if (!el || !n || !el.contains(n)) return null;
    while (n && n.parentNode !== el) n = n.parentNode;
    return n as Element | null;
  };

  // Chèn ảnh / video thành một khối riêng ngay sau dòng đang đứng, kèm một dòng trống để gõ tiếp.
  const chenKhoi = (dong: string) => {
    const el = khungRef.current;
    if (!el) return;
    const tam = document.createElement("div");
    tam.innerHTML = dongSangHtml(dong) + "<div><br></div>";
    const [khoi, dongMoi] = [tam.children[0], tam.children[1]];
    const sau = khoiDangDung();
    if (sau) sau.after(khoi, dongMoi);
    else el.append(khoi, dongMoi);
    const r = document.createRange();
    r.setStart(dongMoi, 0);
    r.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    phat();
  };

  const insertImage = (url: string) => { if (url.trim()) chenKhoi(`![](${url.trim()})`); };
  const insertVideo = (url: string) => { if (url.trim()) chenKhoi(`@[video](${url.trim()})`); };

  async function handleImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploadingImg(true);
    for (const file of Array.from(files)) {
      const { url, error: e } = await uploadImageFile(file);
      if (e) setError(e);
      else if (url) insertImage(url);
    }
    setUploadingImg(false);
    if (imgRef.current) imgRef.current.value = "";
  }

  async function handleVideo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploadingVideo(true);
    const { url, error: e } = await uploadVideoFile(file);
    setUploadingVideo(false);
    if (e) setError(e);
    else if (url) insertVideo(url);
    if (videoRef.current) videoRef.current.value = "";
  }

  // Dán link: tự nhận diện video (YouTube/Vimeo/tệp video) hay ảnh.
  function addLink() {
    const url = link.trim();
    if (!url) return;
    if (isVideoUrl(url)) insertVideo(url);
    else insertImage(url);
    setLink("");
    setShowLink(false);
  }

  const giuChon = (e: React.MouseEvent) => e.preventDefault(); // bấm nút không làm mất vùng bôi đen

  return (
    <div className="space-y-2">
      {/* Thanh định dạng: đậm · nghiêng · canh lề — hiện kết quả NGAY trong khung soạn */}
      <div className="flex flex-wrap items-center gap-1.5">
        <ToolBtn label="In đậm" onMouseDown={giuChon} onClick={() => lenh("bold")}>
          <span className="text-[13px] font-bold">B</span>
        </ToolBtn>
        <ToolBtn label="In nghiêng" onMouseDown={giuChon} onClick={() => lenh("italic")}>
          <span className="font-serif text-[13px] italic">I</span>
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-cvr-line" />
        <ToolBtn label="Canh trái" onMouseDown={giuChon} onClick={() => lenh("justifyLeft")}>
          <AlignIcon lines={[16, 10, 16, 10]} />
        </ToolBtn>
        <ToolBtn label="Canh giữa" onMouseDown={giuChon} onClick={() => lenh("justifyCenter")}>
          <AlignIcon lines={[16, 10, 16, 10]} center />
        </ToolBtn>
        <ToolBtn label="Canh phải" onMouseDown={giuChon} onClick={() => lenh("justifyRight")}>
          <AlignIcon lines={[16, 10, 16, 10]} right />
        </ToolBtn>
        <ToolBtn label="Canh đều 2 bên" onMouseDown={giuChon} onClick={() => lenh("justifyFull")}>
          <AlignIcon lines={[16, 16, 16, 16]} />
        </ToolBtn>
      </div>

      {/* Thanh công cụ chèn ảnh / video */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onMouseDown={giuChon}
          onClick={() => imgRef.current?.click()}
          disabled={uploadingImg}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" /></svg>
          {uploadingImg ? "Đang tải ảnh…" : "Chèn ảnh"}
        </button>
        <input ref={imgRef} type="file" accept="image/*" multiple onChange={(e) => handleImages(e.target.files)} className="hidden" />
        <button
          type="button"
          onMouseDown={giuChon}
          onClick={() => videoRef.current?.click()}
          disabled={uploadingVideo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
          {uploadingVideo ? "Đang tải video…" : "Chèn video"}
        </button>
        <input ref={videoRef} type="file" accept="video/*" onChange={(e) => handleVideo(e.target.files)} className="hidden" />
        <button
          type="button"
          onMouseDown={giuChon}
          onClick={() => setShowLink((v) => !v)}
          className="text-xs font-medium text-cvr-muted transition hover:text-cvr-ink"
        >
          hoặc dán link ảnh / video
        </button>
      </div>
      {showLink && (
        <div className="flex items-center gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
            placeholder="Dán link ảnh, hoặc video (YouTube/Vimeo/mp4)…"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
          />
          <button
            type="button"
            onClick={addLink}
            className="shrink-0 rounded-lg border border-cvr-line px-3 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Chèn
          </button>
        </div>
      )}

      {/* KHUNG SOẠN — chữ hiện đúng định dạng ngay khi gõ, như trên trang tin */}
      <div className="relative">
        <div
          ref={khungRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={phat}
          onBlur={phat}
          onPaste={(e) => {
            // Chỉ lấy CHỮ — bỏ định dạng rác của nơi khác (màu, cỡ chữ, bảng…).
            e.preventDefault();
            const chu = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, chu);
            phat();
          }}
          onClick={(e) => {
            const nut = (e.target as HTMLElement).closest("[data-xoa]");
            if (!nut) return;
            nut.closest("[data-anh],[data-video]")?.remove();
            phat();
          }}
          style={{ minHeight: `${Math.max(rows, 3) * 1.6}rem` }}
          className="soan-thao w-full overflow-x-hidden whitespace-pre-wrap break-words rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-sm leading-relaxed text-cvr-ink outline-none transition focus:border-cvr-ink"
        />
        {!value.trim() && placeholder && (
          <p className="pointer-events-none absolute left-3 top-2.5 right-3 text-sm leading-relaxed text-cvr-faint">{placeholder}</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}
    </div>
  );
}

// Nút trên thanh định dạng
function ToolBtn({ label, onClick, onMouseDown, children }: { label: string; onClick: () => void; onMouseDown?: (e: React.MouseEvent) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-cvr-line bg-white text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
    >
      {children}
    </button>
  );
}

// Biểu tượng canh lề — 4 vạch, dài/ngắn theo kiểu canh
function AlignIcon({ lines, center = false, right = false }: { lines: number[]; center?: boolean; right?: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      {lines.map((w, i) => {
        const x1 = center ? (20 - w) / 2 : right ? 20 - w - 2 : 2;
        return <line key={i} x1={x1} y1={4 + i * 4} x2={x1 + w - 2} y2={4 + i * 4} />;
      })}
    </svg>
  );
}
