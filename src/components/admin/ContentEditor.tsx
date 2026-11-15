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
  // ── Ô SOẠN TRÊN ĐIỆN THOẠI = CHUẨN Ô VIẾT BÀI / Ô CHAT MẠNG XÃ HỘI (anh chốt 15/11/2026, 8 ý) ─────────────────────────────────────────
  // ① trình soạn văn bản cơ bản, phải chuẩn · ② mặc định cao 5 dòng · ③ chữ nhiều thì tự giãn · ④ giãn tới mức tối đa vừa màn hình điện
  // thoại, dài hơn thì CUỘN TRONG KHUNG · ⑤ thanh kéo để thu ô về 5 dòng · ⑥ chạm không nhảy, không bị kéo dịch, không bị che · ⑦ cuộn tới
  // đâu chạm đâu con trỏ đúng chỗ đó · ⑧ bấm vào chỉ hiện bàn phím, không nhảy / giật / tự cuộn. Thanh B · I · Chèn ảnh nằm yên đầu khung
  // (khung không cao quá màn hình nên thanh luôn thấy) — không dính trang, không gắn bàn phím.
  const laDt = useLaDt();
  const CAO_5_DONG = 150; // 5 dòng chữ 16px × 1,625 + lề trong
  // THANH KÉO dưới khung: kéo lên thu ô về 5 dòng, kéo xuống mở lại tới mức tối đa (đổi chiều cao TỐI ĐA của khung)
  const [caoKeo, setCaoKeo] = useState<number | null>(null);
  // MỨC TỐI ĐA = PHẦN MÀN HÌNH CÒN THẤY (anh 15/11/2026: "điện thoại đã có màn hình giới hạn"): bàn phím bật thì chỉ còn khoảng giữa thanh
  // "‹ Đăng tin" và bàn phím — cả khung (thanh B · I + chữ + thanh kéo) phải vừa khoảng đó, không thì thanh B · I trôi khuất, thanh kéo bị che.
  const [caoToiDa, setCaoToiDa] = useState(380);
  useEffect(() => {
    if (!laDt) return;
    const vv = window.visualViewport;
    const tinh = () => {
      const cao = vv ? vv.height : window.innerHeight;
      const tren = Math.max(document.querySelector("header")?.getBoundingClientRect().bottom ?? 0,
        document.querySelector(".thanh-quay-lai")?.getBoundingClientRect().bottom ?? 0, 0);
      // phần khung không phải chữ (thanh B · I + thanh kéo + viền) đo THẬT — máy chữ to / Zalo phóng chữ làm thanh cao hơn
      const ed = khungRef.current, khung = ed?.closest("[data-co-thanh]");
      const phu = ed && khung ? khung.getBoundingClientRect().height - ed.getBoundingClientRect().height : 85;
      setCaoToiDa(Math.max(CAO_5_DONG, Math.round(cao - tren - phu - 24)));
      // Đang soạn mà bàn phím vừa bật / đổi cỡ → khung co xong thì đặt khung nằm gọn dưới thanh trên
      if (ed && document.activeElement === ed) setTimeout(datKhung, 80);
    };
    tinh();
    vv?.addEventListener("resize", tinh);
    window.addEventListener("resize", tinh);
    return () => { vv?.removeEventListener("resize", tinh); window.removeEventListener("resize", tinh); };
  }, [laDt]); // eslint-disable-line react-hooks/exhaustive-deps
  // GIỮ DÒNG CON TRỎ TRONG KHUNG (điện thoại thật 15/11/2026: chạm "Dòng 24" thì chữ trong khung nhảy lên dòng 14–20, con trỏ khuất):
  // bàn phím bật / tắt làm khung đổi cao → vị trí cuộn trong khung lệch. Khung đổi cao lúc đang soạn → cuộn TRONG khung cho dòng con
  // trỏ nằm lại trong tầm nhìn (chỉ cuộn khung, không kéo trang).
  const giuConTro = () => {
    const ed = khungRef.current, sel = window.getSelection();
    if (!ed || !sel || !sel.rangeCount || document.activeElement !== ed || !ed.contains(sel.getRangeAt(0).startContainer)) return;
    const rg = sel.getRangeAt(0);
    const c = rg.getClientRects()[0] ?? (rg.startContainer instanceof Element ? rg.startContainer : rg.startContainer.parentElement)?.getBoundingClientRect();
    if (!c) return;
    const k = ed.getBoundingClientRect();
    if (c.top < k.top + 4) ed.scrollTop -= k.top + 8 - c.top;
    else if (c.bottom > k.bottom - 4) ed.scrollTop += c.bottom - k.bottom + 8;
  };
  useEffect(() => { requestAnimationFrame(giuConTro); }, [caoToiDa, caoKeo]); // eslint-disable-line react-hooks/exhaustive-deps
  // ĐẶT KHUNG VÀO TẦM NHÌN (một lần, mượt): khung vừa phần màn hình còn thấy mà đầu khung (thanh B · I) khuất dưới thanh trên, hoặc đáy
  // (thanh kéo) nằm dưới bàn phím → cuộn trang cho đầu khung nằm ngay dưới "‹ Đăng tin". Khung đã thấy trọn thì KHÔNG cuộn (không nhảy).
  const datKhung = () => {
    const ed = khungRef.current, khung = ed?.closest("[data-co-thanh]");
    if (!laDt || !ed || !khung || document.activeElement !== ed) return;
    const vv = window.visualViewport;
    const dinh = vv ? vv.offsetTop : 0, day = dinh + (vv ? vv.height : window.innerHeight);
    const tren = Math.max(document.querySelector("header")?.getBoundingClientRect().bottom ?? 0,
      document.querySelector(".thanh-quay-lai")?.getBoundingClientRect().bottom ?? 0, dinh);
    const k = khung.getBoundingClientRect();
    if (k.height <= day - tren - 4 && (k.top < tren - 2 || k.bottom > day + 2)) window.scrollBy({ top: k.top - tren - 4, behavior: "smooth" });
  };
  const keoRef = useRef<HTMLDivElement>(null);
  // Chạm thanh kéo KHÔNG bao giờ bật bàn phím (chặn ngay touchstart — React gắn touch ở chế độ passive nên phải gắn tay)
  useEffect(() => {
    const t = keoRef.current, el = khungRef.current;
    if (!t || !el) return;
    // ĐÚNG Ý ANH (15/11/2026, yêu cầu 5): thanh kéo để THU Ô VỀ MẶC ĐỊNH 5 DÒNG — kéo lên = về 5 dòng, kéo xuống = mở ra tối đa
    // (không co giãn từng chút). Trong lúc kéo ô đi theo ngón tay cho thấy đang kéo, thả tay thì chốt về một trong hai mức.
    let y0 = 0, h0 = 0, dy = 0;
    const dau = (e: TouchEvent) => { e.preventDefault(); y0 = e.touches[0].clientY; h0 = el.getBoundingClientRect().height; dy = 0; };
    const keo = (e: TouchEvent) => { e.preventDefault(); dy = e.touches[0].clientY - y0; setCaoKeo(Math.round(Math.max(CAO_5_DONG, h0 + dy))); };
    const tha = () => { if (Math.abs(dy) < 8) return; setCaoKeo(dy < 0 ? CAO_5_DONG : null); };
    t.addEventListener("touchstart", dau, { passive: false });
    t.addEventListener("touchmove", keo, { passive: false });
    t.addEventListener("touchend", tha);
    return () => { t.removeEventListener("touchstart", dau); t.removeEventListener("touchmove", keo); t.removeEventListener("touchend", tha); };
  }, [laDt]); // eslint-disable-line react-hooks/exhaustive-deps
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
    try {
      for (const file of Array.from(files)) {
        const { url, error: e } = await uploadImageFile(file);
        if (e) setError(e);
        else if (url) insertImage(url);
      }
    } finally {
      setUploadingImg(false); // lỗi bất ngờ cũng không để nút kẹt "Đang tải ảnh…"
      if (imgRef.current) imgRef.current.value = "";
    }
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
    // data-tu-cuon: ô tự lo vị trí khi soạn (datKhung) — BanPhimAo không kéo trang thêm, hai bên cùng kéo là giật
    <div data-co-thanh="" data-tu-cuon="" className="group/soan space-y-2 max-sm:space-y-0 max-sm:overflow-clip max-sm:rounded-lg max-sm:border max-sm:border-cvr-line max-sm:bg-white max-sm:focus-within:border-cvr-ink">
      {/* Thanh định dạng trên đầu ô (máy tính + điện thoại). Chạm nút không làm rời ô — bàn phím điện thoại không tắt, không mất vùng bôi đen. */}
      {/* ĐIỆN THOẠI: thanh nằm TRONG KHUNG Ô, đầu khung, KHÔNG dính / không chồng lên chữ (anh 14/11/2026, ảnh iPhone 22:53 + 23:15: thanh
          dính đè mép trên ô, dòng đang gõ bị che — iPhone tự cuộn theo con trỏ không biết thanh dính). Khung = [thanh][chữ cuộn bên dưới]. */}
      <div
        data-thanh-dinh=""
        onPointerDown={giuChon}
        onMouseDown={giuChon}
        // Thanh nằm YÊN đầu khung (không dính trang — dính thì con trỏ chui dưới thanh, ảnh Samsung anh 15/11/2026 11:49). MỘT DÒNG trên điện thoại kể cả trình duyệt Zalo phóng chữ (ảnh Zalo anh 15/11/2026 8:28: "Chèn ảnh" rớt dòng 2, thanh cao gấp đôi
        // đè lên chữ) — không xuống hàng; máy chữ quá to thì vuốt ngang thanh (chạm nút vẫn giữ vùng bôi đen, vuốt không bị chặn).
        className="no-scrollbar -mx-1 flex flex-wrap items-center gap-1 bg-white px-1 py-1 max-sm:mx-0 max-sm:flex-nowrap max-sm:justify-between max-sm:overflow-x-auto max-sm:gap-0.5 max-sm:border-b max-sm:border-cvr-line max-sm:px-1 max-sm:py-1.5 sm:mx-0 sm:gap-1.5 sm:px-0 sm:py-0"
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
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-cvr-ink/40 bg-white px-1 text-xs font-semibold text-cvr-ink transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60 sm:gap-1.5 sm:px-3"
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
          onFocus={() => { setTimeout(datKhung, 450); setTimeout(datKhung, 900); }}
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
          // Máy tính: tự cao + kéo góc dưới.
          // Điện thoại: 5 dòng → tự giãn theo chữ → tối đa vừa phần màn hình còn thấy (caoToiDa), dài hơn thì cuộn trong khung
          style={laDt ? { minHeight: CAO_5_DONG, maxHeight: Math.min(caoKeo ?? caoToiDa, caoToiDa), overflowY: "auto", overscrollBehavior: "contain" } : { minHeight: `${Math.max(rows, 7) * 1.6}rem` }}
          className="soan-thao w-full resize-none overflow-visible whitespace-pre-wrap break-words rounded-lg border border-cvr-line max-sm:rounded-none max-sm:border-0 bg-white px-3 py-2.5 text-[16px] leading-relaxed sm:resize-y sm:overflow-auto sm:text-sm text-cvr-ink outline-none transition focus:border-cvr-ink"
        />
        {!value.trim() && placeholder && (
          <p className="pointer-events-none absolute left-3 top-2.5 right-3 text-[16px] leading-relaxed text-cvr-faint sm:text-sm">{placeholder}</p>
        )}
        {/* Thanh kéo giãn / thu ô (điện thoại): chỉ kéo, không bao giờ bật bàn phím (chặn touchstart ở useEffect) */}
        {laDt && (
          <div ref={keoRef} role="separator" aria-label="Kéo để giãn hoặc thu khung soạn" className="flex h-5 touch-none select-none items-center justify-center">
            <span className="h-1 w-10 rounded-full bg-cvr-faint/70" />
          </div>
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
      className="flex h-8 w-6 shrink-0 items-center justify-center rounded-lg border border-cvr-line bg-white text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink sm:w-8"
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
