"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { uploadImageFile, uploadVideoFile } from "@/lib/uploadImage";
import { imageMarkerUrl, videoMarkerUrl } from "@/lib/dauNoiDung";
import { asset } from "@/lib/asset";
import { tachDinhDang, thoatChu } from "@/lib/dinhDangMoTa";

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

// Điện thoại (< 640px) — đọc ngay khi chạy, máy chủ coi như máy tính (không lệch HTML)
const MQ = "(max-width: 639px)";
function useLaDt(): boolean {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(MQ); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(MQ).matches,
    () => false,
  );
}

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
  // Cùng bộ đọc với trang tin (dinhDangMoTa) — dấu * khách gõ hiện đúng là dấu *.
  const html = tachDinhDang(chu)
    .map((d) => {
      const t = thoatHtml(d.t);
      return d.b && d.i ? `<b><i>${t}</i></b>` : d.b ? `<b>${t}</b>` : d.i ? `<i>${t}</i>` : t;
    })
    .join("");
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
        // Dấu * và \ KHÁCH GÕ → đánh dấu là chữ thật, không bị đọc nhầm thành đậm/nghiêng.
        if (!r.t.trim() || (!r.b && !r.i)) return thoatChu(r.t);
        // Giữ khoảng trắng đầu / cuối NGOÀI dấu định dạng ("** chữ**" không hiển thị đúng)
        const dau = r.t.match(/^\s*/)![0];
        const cuoiS = r.t.match(/\s*$/)![0];
        const giua = thoatChu(r.t.trim());
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
  chiAnh = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  /** Ô Mô tả tin đăng: CHỈ chèn ảnh — video đăng ở mục Hình ảnh & video, mỗi tin 1 video (anh 12/11/2026). */
  chiAnh?: boolean;
}) {
  const khungRef = useRef<HTMLDivElement>(null);
  // ── SOẠN TRÊN ĐIỆN THOẠI THEO CHUẨN (anh 13/11/2026: "hành trình phím trên mobile sai hết, cần CHUẨN, không chắp vá") ─────────────
  // Như ô gõ chuẩn (anh 14/11/2026 khuya: "bấm vào dòng nào thì chỉ hiện bàn phím, không che, không nhảy giật"): ô TỰ CAO theo chữ, không cuộn
  // trong ô, không tự kéo trang — trình duyệt tự giữ dòng đang gõ trên bàn phím. Thanh B · I · canh lề · Chèn ảnh nằm TRONG KHUNG, đầu ô
  // (không dính / không chồng lên chữ).
  const laDt = useLaDt();
  const daPhat = useRef<string | null>(null); // giá trị khung soạn vừa phát ra (để không vẽ lại khi đang gõ)
  // Dòng khách đứng LẦN CUỐI trong khung soạn — bấm "Chèn ảnh" / gõ link ở ô khác làm con trỏ rời
  // khung, vẫn chèn đúng chỗ khách đang soạn chứ không dồn xuống cuối bài.
  const khoiCuoi = useRef<Element | null>(null);
  // Vùng chữ khách bôi đen LẦN CUỐI trong khung soạn. Safari trên iPhone bỏ vùng bôi đen khi chạm
  // vào nút (B, I, canh lề, chèn) — khôi phục lại trước khi định dạng thì nút mới có tác dụng.
  const vungChon = useRef<Range | null>(null);
  useEffect(() => {
    const nho = () => {
      const el = khungRef.current;
      const sel = window.getSelection();
      if (el && sel && sel.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) vungChon.current = sel.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", nho);
    return () => document.removeEventListener("selectionchange", nho);
  }, []);
  const traVung = () => {
    const el = khungRef.current;
    const r = vungChon.current;
    if (!el || !r || !el.contains(r.commonAncestorContainer)) return;
    const sel = window.getSelection();
    // Vùng bôi đen còn nguyên thì thôi; chỉ còn con trỏ (Safari vừa bỏ vùng bôi đen) thì khôi phục.
    const hienTai = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    if (hienTai && el.contains(hienTai.commonAncestorContainer) && (!hienTai.collapsed || r.collapsed)) return;
    sel?.removeAllRanges();
    sel?.addRange(r);
  };
  const imgRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [tienDoVideo, setTienDoVideo] = useState(0); // % chuyển + tải video (video HEVC / dài cần vài phút trên điện thoại — 12/11/2026)
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
    traVung();
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
  const nhoKhoi = () => {
    const k = khoiDangDung();
    if (k) khoiCuoi.current = k;
  };

  // Chèn ảnh / video thành một khối riêng ngay sau dòng đang đứng, kèm một dòng trống để gõ tiếp.
  const chenKhoi = (dong: string) => {
    const el = khungRef.current;
    if (!el) return;
    const tam = document.createElement("div");
    tam.innerHTML = dongSangHtml(dong) + "<div><br></div>";
    const khoi = tam.children[0];
    let dongMoi: Element = tam.children[1];
    const conTrongKhung = khoiCuoi.current && el.contains(khoiCuoi.current) ? khoiCuoi.current : null;
    const sau = khoiDangDung() ?? conTrongKhung;
    // Con trỏ đang ở DÒNG TRỐNG → ảnh / video đứng vào chỗ đó, dòng trống giữ lại ngay sau để
    // gõ tiếp — không đẻ thêm dòng trống thừa (chèn liên tiếp nhiều ảnh / video vẫn liền nhau).
    const dongTrong = sau && !sau.hasAttribute("data-anh") && !sau.hasAttribute("data-video") && !(sau.textContent ?? "").trim();
    if (sau && dongTrong) {
      sau.before(khoi);
      dongMoi = sau;
    } else if (sau) sau.after(khoi, dongMoi);
    else el.append(khoi, dongMoi);
    const r = document.createRange();
    r.setStart(dongMoi, 0);
    r.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    khoiCuoi.current = dongMoi;
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
    setTienDoVideo(0);
    const { url, error: e } = await uploadVideoFile(file, setTienDoVideo);
    setUploadingVideo(false);
    if (e) setError(e);
    else if (url) insertVideo(url);
    if (videoRef.current) videoRef.current.value = "";
  }

  const giuChon = (e: React.MouseEvent | React.PointerEvent) => e.preventDefault(); // bấm nút không làm rời ô, không mất vùng bôi đen

  // B · I · canh lề — một thanh trên đầu ô cho cả máy tính lẫn điện thoại
  const nutDinhDang = (
    <>
      <ToolBtn label="In đậm" onClick={() => lenh("bold")}><span className="text-[13px] font-bold">B</span></ToolBtn>
      <ToolBtn label="In nghiêng" onClick={() => lenh("italic")}><span className="font-serif text-[13px] italic">I</span></ToolBtn>
      <span className="mx-1 hidden h-5 w-px shrink-0 bg-cvr-line sm:block" />
      <ToolBtn label="Canh trái" onClick={() => lenh("justifyLeft")}><AlignIcon lines={[16, 10, 16, 10]} /></ToolBtn>
      <ToolBtn label="Canh giữa" onClick={() => lenh("justifyCenter")}><AlignIcon lines={[16, 10, 16, 10]} center /></ToolBtn>
      <ToolBtn label="Canh phải" onClick={() => lenh("justifyRight")}><AlignIcon lines={[16, 10, 16, 10]} right /></ToolBtn>
      <ToolBtn label="Canh đều 2 bên" onClick={() => lenh("justifyFull")}><AlignIcon lines={[16, 16, 16, 16]} /></ToolBtn>
    </>
  );
  const bieuTuongAnh = <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" /></svg>;

  return (
    <div data-co-thanh="" className="group/soan space-y-2 max-sm:space-y-0 max-sm:overflow-hidden max-sm:rounded-lg max-sm:border max-sm:border-cvr-line max-sm:bg-white max-sm:focus-within:border-cvr-ink">
      {/* Thanh định dạng trên đầu ô (máy tính + điện thoại). Chạm nút không làm rời ô — bàn phím điện thoại không tắt, không mất vùng bôi đen. */}
      {/* ĐIỆN THOẠI: thanh nằm TRONG KHUNG Ô, đầu khung, KHÔNG dính / không chồng lên chữ (anh 14/11/2026, ảnh iPhone 22:53 + 23:15: thanh
          dính đè mép trên ô, dòng đang gõ bị che — iPhone tự cuộn theo con trỏ không biết thanh dính). Khung = [thanh][chữ cuộn bên dưới]. */}
      <div
        data-thanh-dinh=""
        onPointerDown={giuChon}
        onMouseDown={giuChon}
        className="-mx-1 flex flex-nowrap items-center gap-1 bg-white px-1 py-1 sm:flex-wrap max-sm:mx-0 max-sm:border-b max-sm:border-cvr-line max-sm:px-2 max-sm:py-1.5 sm:mx-0 sm:gap-1.5 sm:px-0 sm:py-0"
      >
        {nutDinhDang}
        <span className="mx-1 hidden h-5 w-px shrink-0 bg-cvr-line sm:block" />
        {/* Nút Chèn ảnh có chữ rõ (anh 14/11/2026: "biểu tượng chèn ảnh rõ để khách biết mà chèn"); máy hẹp thì xuống hàng */}
        <button
          type="button"
          onPointerDown={giuChon}
          onMouseDown={giuChon}
          onClick={() => imgRef.current?.click()}
          disabled={uploadingImg}
          title="Chèn ảnh"
          aria-label="Chèn ảnh"
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-cvr-ink/40 bg-white px-2 text-xs font-semibold text-cvr-ink transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60 sm:gap-1.5 sm:px-3"
        >
          {bieuTuongAnh}
          {uploadingImg ? "Đang tải ảnh…" : "Chèn ảnh"}
        </button>
        <input ref={imgRef} type="file" accept="image/*" multiple onChange={(e) => handleImages(e.target.files)} className="hidden" />
        {!chiAnh && (<>
        <button
          type="button"
          onPointerDown={giuChon}
          onMouseDown={giuChon}
          onClick={() => videoRef.current?.click()}
          disabled={uploadingVideo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
          {uploadingVideo ? `Đang tải video… ${tienDoVideo}%` : "Chèn video"}
        </button>
        <input ref={videoRef} type="file" accept="video/*" onChange={(e) => handleVideo(e.target.files)} className="hidden" />
        </>)}
      </div>

      {/* KHUNG SOẠN — chữ hiện đúng định dạng ngay khi gõ, như trên trang tin */}
      <div className="relative">
        <div
          ref={khungRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={() => { phat(); nhoKhoi(); }}
          onKeyUp={nhoKhoi}
          onMouseUp={nhoKhoi}
          onTouchEnd={nhoKhoi}
          onBlur={() => { nhoKhoi(); phat(); }}
          onPaste={(e) => {
            // Chỉ lấy CHỮ — bỏ định dạng rác của nơi khác (màu, cỡ chữ, bảng…).
            e.preventDefault();
            const chu = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, chu);
            phat();
          }}
          // NÚT × BỎ ẢNH / VIDEO: xử lý NGAY lúc chạm (không chờ click, không bật bàn phím, không để ô nhận con trỏ)
          onPointerDown={(e) => {
            const nut = (e.target as HTMLElement).closest("[data-xoa]");
            if (!nut) return;
            e.preventDefault();
            nut.closest("[data-anh],[data-video]")?.remove();
            phat();
          }}
          // Điện thoại: ô TỰ CAO THEO CHỮ như ô gõ chuẩn (anh 14/11/2026: "bấm vào dòng nào thì chỉ hiện bàn phím, không che, không nhảy giật")
          // — không cuộn bên trong ô (cuộn trong ô + trình duyệt cuộn trang theo con trỏ = hai lớp cuộn chồng nhau → che / giật). Máy tính: tự cao + kéo góc dưới.
          style={laDt ? { minHeight: 224 } : { minHeight: `${Math.max(rows, 7) * 1.6}rem` }}
          className="soan-thao w-full resize-none overflow-visible whitespace-pre-wrap break-words rounded-lg border border-cvr-line max-sm:rounded-none max-sm:border-0 bg-white px-3 py-2.5 text-[16px] leading-relaxed sm:resize-y sm:overflow-auto sm:text-sm text-cvr-ink outline-none transition focus:border-cvr-ink"
        />
        {!value.trim() && placeholder && (
          <p className="pointer-events-none absolute left-3 top-2.5 right-3 text-[16px] leading-relaxed text-cvr-faint sm:text-sm">{placeholder}</p>
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
      className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg border border-cvr-line bg-white text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink sm:w-8"
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
