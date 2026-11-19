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
  const CAO_5_DONG = 202; // mặc định 7 dòng (anh 18/11/2026: "ô Mô tả to ra chút" — 177px rồi 202px; trước 4 dòng 125px), gõ thì tự giãn tới mức tối đa
  // THANH KÉO dưới khung: kéo lên thu ô về 5 dòng, kéo xuống mở lại tới mức tối đa (đổi chiều cao TỐI ĐA của khung)
  const [caoKeo, setCaoKeo] = useState<number | null>(null);
  // MỨC TỐI ĐA = PHẦN MÀN HÌNH CÒN THẤY (anh 15/11/2026: "điện thoại đã có màn hình giới hạn"): bàn phím bật thì chỉ còn khoảng giữa thanh
  // "‹ Đăng tin" và bàn phím — cả khung (thanh B · I + chữ + thanh kéo) phải vừa khoảng đó, không thì thanh B · I trôi khuất, thanh kéo bị che.
  const [caoToiDa, setCaoToiDa] = useState(380);
  // Cao tối đa của ô theo phần màn hình còn thấy (cao): dùng khi bàn phím đổi và khi DỰ BÁO lúc chạm (bàn phím chưa kịp bật)
  const tinhCao = (cao: number): number => {
      const tren = trenThanh();
      // phần khung không phải chữ (thanh B · I + thanh kéo + viền) đo THẬT — máy chữ to / Zalo phóng chữ làm thanh cao hơn
      const ed = khungRef.current, khung = ed?.closest("[data-co-thanh]");
      const sc = ed;
      const phu = sc && khung ? khung.getBoundingClientRect().height - sc.getBoundingClientRect().height : 85;
      const caoNhan = 4; // nhãn trượt lên khi gõ (datKhung) — chỉ chừa 4px dưới thanh bước
      // Tự giãn tối đa 3/4 màn hình (anh 15/11/2026); bàn phím bật thì không quá phần còn thấy giữa thanh trên và bàn phím
      // Bàn phím bật mà phần còn thấy hẹp (máy anh: chỉ ~215px dưới thanh trên + thanh bước) → ô CO dưới mức mặc định cho cả khung lọt trên
      // bàn phím (nhật ký 15/11/2026: ép tối thiểu 125px → khung tràn xuống dưới bàn phím → Chrome tự cuộn → nhảy)
      // Cao ô = TRỌN DÒNG (L2, 15/11/2026: dòng cuối bị cắt nửa ở mép dưới khung): đệm trên + dưới + số dòng nguyên × cao dòng
      const csEd = ed ? getComputedStyle(ed) : null;
      const dong = csEd ? parseFloat(csEd.lineHeight) || 26 : 26;
      const dem = csEd ? parseFloat(csEd.paddingTop) + parseFloat(csEd.paddingBottom) : 20;
      const caoTho = Math.max(72, Math.min(caoMan.current * 0.62 - phu, cao - tren - caoNhan - phu - 8));
      return Math.round(dem + Math.max(2, Math.floor((caoTho - dem) / dong)) * dong);
  };
  const giuCoLuc = useRef(0);
  const choConTro = useRef(0);
  useEffect(() => {
    if (!laDt) return;
    const vv = window.visualViewport;
    const tinh = () => {
      if (window.innerHeight > caoMan.current) caoMan.current = window.innerHeight; // cao màn hình khi KHÔNG có bàn phím
      const bp = banPhimBat();
      // Vừa chạm ô, bàn phím đang trượt lên: Chrome đổi cỡ thêm một nấc trung gian (thanh địa chỉ thu, nhật ký 18:45: 631→659→373) — nấc đó
      // không phải bàn phím tắt; tính theo nó thì ô giãn to, chữ nhảy về đầu rồi co lại = GIẬT. Bỏ qua trong 0,8 giây sau khi chạm.
      if (!bp && document.activeElement === khungRef.current && Date.now() < giuCoLuc.current) return;
      const ed = khungRef.current;
      // MIN · MAX CỐ ĐỊNH THEO MÀN HÌNH (anh 17/11/2026: "đã giãn ra thì bấm vào hiện như vậy, sao phải TỰ THU LẠI"): MAX tính theo cao màn hình
      // KHÔNG có bàn phím, bàn phím bật / tắt không đổi cỡ ô. Trước đây MAX = phần còn thấy trên bàn phím (máy anh ~135px ≈ MIN) → chạm vào là ô co.
      // 18/11/2026 (anh: "phải hiện hàng B / I phía trên để chỉnh sửa"): MAX = phần còn thấy KHI BÀN PHÍM BẬT (ước 55% màn hình, bàn phím
      // điện thoại chiếm ~40–45%) trừ thanh trên — cả khung (B · I + chữ) vừa trên bàn phím, gõ dài thì chữ cuộn TRONG khung, hàng B · I
      // không trôi khuất. Vẫn cố định theo màn hình, bàn phím bật / tắt không đổi cỡ (giữ luật 17/11).
      // 18/11/2026 tối (đo giả lập: gõ dài trang dịch 2 lần, khung đổi 4 lần): bàn phím BẬT THẬT thì mức tối đa = đúng phần còn thấy trên bàn
      // phím (đo, không ước) — khung giãn tới mép bàn phím rồi chữ cuộn TRONG khung, trang đứng yên. Không bao giờ nhỏ hơn cỡ khung đang có
      // (giữ luật 17/11: chạm vào ô không tự thu lại). Bàn phím tắt: mức tối đa lớn (0,62 màn hình — anh: "giãn max nhiều hơn chút").
      // Máy thật Samsung 18/11/2026: giữ cỡ lớn hơn phần còn thấy là khung tràn xuống dưới bàn phím → trình duyệt tự kéo trang = giật. Bàn phím bật
      // thì khung vừa ĐÚNG phần còn thấy (luật "cấm giật, cấm che" đứng trên luật 17/11 "không tự thu").
      setCaoToiDa(bp ? tinhCao(vv ? vv.height : window.innerHeight) : tinhCao(caoMan.current * 0.62));
      if (!bp) daDat.current = false; // bàn phím tắt → lần bật sau đặt khung lại một lần
      // Bàn phím vừa bật: đưa dòng con trỏ lên trên bàn phím + đặt khung NGAY (L5, 18:57: chờ 2 khung hình thì Chrome tự kéo trang đi tìm con trỏ
      // trước, rồi lệnh mình kéo lại = nhảy 3 lần)
      else if (ed && document.activeElement === ed) {
        thuDatKhung(); giuConTro();
      }
    };
    caoMan.current = window.innerHeight;
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
    const sc = ed;
    const k = sc.getBoundingClientRect();
    // Đáy phần ô CÒN THẤY: bàn phím bật mà ô cao hơn phần còn thấy → đáy là mép trên bàn phím (ô không co, chữ cuộn trong ô)
    const vv = window.visualViewport;
    const day = Math.min(k.bottom, vv ? vv.offsetTop + vv.height : window.innerHeight);
    if (c.top < k.top + 4) sc.scrollTop -= k.top + 8 - c.top;
    else if (c.bottom > day - 4) sc.scrollTop += c.bottom - day + 8;
  };
  useEffect(() => { requestAnimationFrame(giuConTro); }, [caoToiDa, caoKeo]); // eslint-disable-line react-hooks/exhaustive-deps
  // ĐẶT KHUNG VÀO TẦM NHÌN (một lần, mượt): khung vừa phần màn hình còn thấy mà đầu khung (thanh B · I) khuất dưới thanh trên, hoặc đáy
  // (thanh kéo) nằm dưới bàn phím → cuộn trang cho đầu khung nằm ngay dưới "‹ Đăng tin". Khung đã thấy trọn thì KHÔNG cuộn (không nhảy).
  // GỐC LỖI A1–A10 (nhật ký điện thoại thật 15/11/2026): lệnh cũ lấy chiều cao màn hình ĐÚNG LÚC bàn phím đã bật → tưởng bàn phím tắt → không
  // bao giờ đưa khung lên → bàn phím che khung. Nay: cao màn hình đo lúc mở trang / mọi lần đổi cỡ (lớn nhất = không có bàn phím); đặt khung
  // ĐÚNG MỘT LẦN mỗi lần bàn phím bật (không đặt lại khi chạm chữ, khi gõ, khi cuộn — không nhảy).
  const caoMan = useRef(0);
  const daDat = useRef(false);
  const banPhimBat = () => window.innerHeight < caoMan.current - 150 || (window.visualViewport?.height ?? 9999) < caoMan.current - 150;
  // Mép dưới các thanh dính trên đầu: đầu trang, "‹ Đăng tin", thanh bước form (luôn hiện — anh 15/11/2026: "thanh này phải để")
  // .zaui-header: form này chạy cả trong Zalo Mini App (đầu trang là thanh tiêu đề Zalo, không phải <header> của web) — 19/11/2026
  const trenThanh = () => Math.max(document.querySelector("header")?.getBoundingClientRect().bottom ?? 0,
    document.querySelector(".zaui-header")?.getBoundingClientRect().bottom ?? 0,
    document.querySelector(".thanh-quay-lai")?.getBoundingClientRect().bottom ?? 0,
    document.querySelector(".an-buoc-khi-go")?.getBoundingClientRect().bottom ?? 0, window.visualViewport?.offsetTop ?? 0);
  const datKhung = () => {
    const ed = khungRef.current, khung = ed?.closest("[data-co-thanh]");
    if (!laDt || !ed || !khung || document.activeElement !== ed) return;
    const tren = trenThanh();
    const k = khung.getBoundingClientRect();
    // ĐẶT HÀNG B · I SÁT DƯỚI THANH BƯỚC (đo Samsung Internet thật 18/11/2026: bàn phím bật còn 378px; đặt cả nhãn thì khung 7 dòng không lọt →
    // trình duyệt tự kéo trang +138px rồi web kéo về −137px = giật "đi rồi về"). Nhãn "Mô tả chi tiết" trượt lên trên khi đang gõ.
    const dau = k.top;
    // TỨC THÌ ("instant"): trang đặt cuộn mượt chung → cuộn mượt làm khung trôi từ từ, giật (nhật ký điện thoại thật 15/11/2026)
    if (Math.abs(dau - tren - 4) > 2) window.scrollTo({ top: window.scrollY + dau - tren - 4, behavior: "instant" }); // đầu khung (B · I) ngay dưới "‹ Đăng tin"
  };
  // Bàn phím vừa bật: đặt ngay, rồi đặt lại MỘT lần sau 450 ms — Chrome tự cuộn trang để lộ con trỏ ngay lúc bàn phím bật (nhật ký: trang tự
  // lùi 70px, khung chìm dưới bàn phím). Sau đó không đặt nữa cho tới lần bàn phím bật sau: chạm chữ, gõ, cuộn không kéo trang.
  const thuDatKhung = () => { if (daDat.current || !banPhimBat()) return; daDat.current = true; datKhung(); setTimeout(() => { if (banPhimBat()) datKhung(); }, 450); };
  // CHẠM LÚC BÀN PHÍM CHƯA BẬT (anh 15/11/2026 18:42: "rất giật khi bấm vào, cụ thể bấm dòng cuối"): trước đây trang kéo lên, rồi bàn phím
  // bật làm ô co lại, rồi chữ trong ô lăn tới con trỏ — ba lần dịch. Nay ngay lúc chạm: co ô SẴN đúng cỡ phần còn thấy khi bàn phím bật (đo
  // lần trước), đưa khung lên dưới thanh trên, cuộn trong ô cho dòng vừa chạm nằm trong tầm nhìn — cùng một khung hình, dịch MỘT lần.
  const duBao = () => {
    giuCoLuc.current = Date.now() + 800;
    // Ô GIỮ NGUYÊN CỠ khi chạm (anh 17/11/2026) — chỉ đưa khung lên + dòng vừa chạm vào phần sẽ còn thấy trên bàn phím
    datKhung();
    giuConTro();
    // CHẠM BẰNG NGÓN TAY: điện thoại đặt con trỏ SAU lệnh chạm (nhật ký 19:07: chọn chữ đổi sau click 17ms) → lúc này chưa có con trỏ ở dòng vừa
    // chạm; bàn phím bật lên Chrome tự kéo cả trang đi tìm con trỏ = giật. Chờ con trỏ đặt xong (selectionchange) rồi đưa dòng đó vào ô ngay.
    choConTro.current = Date.now() + 500;
    // Bàn phím không bật (máy có bàn phím rời…) → trả ô về cỡ thường. Ô còn đang gõ thì GIỮ: Samsung / Zalo / Facebook có bàn phím mà không báo
    // (trang không co) — trả về là khung giãn ra rồi co lại = giật (16/11/2026). Rời ô thì onBlur trả về.
    setTimeout(() => { if (!banPhimBat() && document.activeElement !== khungRef.current) setCaoToiDa(tinhCao(caoMan.current * 0.62)); }, 850);
  };
  const dangGoTruoc = useRef(false); // lúc chạm, ô đã đang gõ chưa (chạm chữ khi đang gõ ≠ chạm mở ô)
  const keoRef = useRef<HTMLDivElement>(null);
  // Chạm thanh kéo KHÔNG bao giờ bật bàn phím (chặn ngay touchstart — React gắn touch ở chế độ passive nên phải gắn tay)
  useEffect(() => {
    const t = keoRef.current, el = khungRef.current;
    if (!t || !el) return;
    // ĐÚNG Ý ANH (15/11/2026, yêu cầu 5): thanh kéo để THU Ô VỀ MẶC ĐỊNH 5 DÒNG — kéo lên = về 5 dòng, kéo xuống = mở ra tối đa
    // (không co giãn từng chút). Trong lúc kéo ô đi theo ngón tay cho thấy đang kéo, thả tay thì chốt về một trong hai mức.
    // Kéo bằng Pointer Events (ngón tay, chuột, bút — mọi trình duyệt, cả Zalo / Facebook) + bắt con trỏ: ngón tay trượt ra khỏi thanh vẫn kéo tiếp
    let y0 = 0, h0 = 0, dy = 0, dangKeo = false;
    // Chiều cao THẬT của chữ (không tính phần ô đang được kéo giãn) — ô trống / ít chữ thì kéo xuống không giãn thành khoảng trống (anh 15/11/2026)
    const caoChu = () => { const r = document.createRange(); r.selectNodeContents(el); const cs = getComputedStyle(el); return r.getBoundingClientRect().height + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + 4; };
    const chan = (e: TouchEvent) => e.preventDefault(); // chạm thanh không bật bàn phím, không cuộn trang
    // Bàn phím đang tắt mà ô còn giữ con trỏ → kéo góc xong Chrome bật lại bàn phím (điện thoại thật 15/11/2026 18:31) → rời ô trước khi kéo
    const dau = (e: PointerEvent) => { e.preventDefault(); if (document.activeElement === el && !banPhimBat()) el.blur(); dangKeo = true; t.setPointerCapture(e.pointerId); y0 = e.clientY; h0 = (el).getBoundingClientRect().height; dy = 0; };
    const keo = (e: PointerEvent) => { if (!dangKeo) return; dy = e.clientY - y0; setCaoKeo(Math.round(Math.max(CAO_5_DONG, Math.min(h0 + dy, caoChu())))); }; // kéo xuống: giãn theo tay, tối đa 3/4 màn hình (khung tự chặn), dài hơn thì cuộn trong ô
    const tha = () => { if (!dangKeo) return; dangKeo = false; if (Math.abs(dy) < 8) return; if (dy < 0) setCaoKeo(CAO_5_DONG); }; // kéo lên → thu về mặc định 5–6 dòng (anh: "thu gọn đến giới hạn mặc định"); kéo xuống → giữ đúng độ giãn đã kéo
    t.addEventListener("touchstart", chan, { passive: false });
    t.addEventListener("pointerdown", dau);
    t.addEventListener("pointermove", keo);
    t.addEventListener("pointerup", tha);
    t.addEventListener("pointercancel", tha);
    return () => { t.removeEventListener("touchstart", chan); t.removeEventListener("pointerdown", dau); t.removeEventListener("pointermove", keo); t.removeEventListener("pointerup", tha); t.removeEventListener("pointercancel", tha); };
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
      if (el && sel && sel.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        vungChon.current = sel.getRangeAt(0).cloneRange();
        if (Date.now() < choConTro.current) { choConTro.current = 0; giuConTro(); }
      }
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

  // Lịch sử Hoàn tác / Làm lại của ô (xem ghiLs)
  const lichSu = useRef<string[]>([]);
  const viTri = useRef(-1);
  const [nutLs, setNutLs] = useState({ truoc: false, sau: false });
  const capNutLs = () => setNutLs({ truoc: viTri.current > 0, sau: viTri.current < lichSu.current.length - 1 });
  // Giá trị đổi TỪ NGOÀI (nạp tin cũ, bản nháp, đăng tin khác) → vẽ lại khung soạn.
  // Giá trị do chính khung soạn phát ra thì KHÔNG vẽ lại — giữ con trỏ và bộ gõ tiếng Việt.
  useLayoutEffect(() => {
    const el = khungRef.current;
    if (!el || value === daPhat.current) return;
    el.innerHTML = giaTriSangHtml(value);
    daPhat.current = value;
    lichSu.current = [el.innerHTML]; viTri.current = 0; capNutLs();
  }, [value]);

  // GÕ KHÔNG GIẬT (anh 16/11/2026, Zalo: "RẤT GIẬT LAG"): trước đây MỖI CHỮ gõ đều phat() → onChange → cả form đăng tin
  // (PostListingForm, rất lớn) vẽ lại theo từng phím — chữ càng dài điện thoại càng giật. Nay gõ thì GOM: ngừng gõ 300 ms
  // mới báo ra ngoài; rời ô (onBlur), bấm B / I, chèn ảnh, đóng trang → báo ngay (phat) nên không mất chữ.
  const henPhat = useRef<number | null>(null);
  const phatSau = () => {
    if (henPhat.current) clearTimeout(henPhat.current);
    henPhat.current = window.setTimeout(() => { henPhat.current = null; phatRef.current(); }, 300);
  };
  // HOÀN TÁC / LÀM LẠI CỦA RIÊNG Ô (anh 18/11/2026: "các nút Hoàn tác, Làm lại trên Mobile KHÔNG có tác dụng"): bộ gõ điện thoại
  // (Gboard, Samsung, gõ dấu tiếng Việt) không ghi vào lịch sử của trình duyệt → execCommand("undo") không làm gì. Ô tự giữ các bản
  // chữ: mỗi lần chữ được báo ra (ngừng gõ 300 ms, B / I, chèn ảnh, dán, rời ô) ghi một bản; Hoàn tác / Làm lại đổi qua lại các bản đó.
  // Một cách cho mọi máy, mọi trình duyệt (cả Ctrl+Z / Ctrl+Y trên máy tính).
  const ghiLs = (html: string) => {
    if (lichSu.current[viTri.current] === html) return;
    lichSu.current = [...lichSu.current.slice(0, viTri.current + 1), html].slice(-100);
    viTri.current = lichSu.current.length - 1;
    capNutLs();
  };
  const doiLs = (buoc: number) => {
    const el = khungRef.current;
    if (!el) return;
    if (henPhat.current) phat(); // đang gõ dở → ghi bản đang gõ trước
    const moi = viTri.current + buoc;
    if (moi < 0 || moi >= lichSu.current.length) return;
    viTri.current = moi;
    el.innerHTML = lichSu.current[moi];
    el.focus({ preventScroll: true });
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
    const v = htmlSangGiaTri(el);
    daPhat.current = v;
    onChange(v);
    capNutLs();
  };
  const phatRef = useRef<() => void>(() => {});
  const phat = () => {
    if (henPhat.current) { clearTimeout(henPhat.current); henPhat.current = null; }
    const el = khungRef.current;
    if (!el) return;
    ghiLs(el.innerHTML);
    const v = htmlSangGiaTri(el);
    daPhat.current = v;
    if (v !== value) onChange(v);
  };
  useEffect(() => { phatRef.current = phat; });
  // Rời trang khi còn chữ chưa báo → báo nốt (khung soạn còn trong DOM lúc dọn)
  useEffect(() => () => { if (henPhat.current) phatRef.current(); }, []);

  // Lệnh định dạng của trình duyệt — giữ vùng chữ đang bôi đen (nút dùng onMouseDown).
  const lenh = (ten: string) => {
    khungRef.current?.focus();
    traVung();
    document.execCommand("defaultParagraphSeparator", false, "div");
    document.execCommand(ten, false);
    phat();
    document.dispatchEvent(new Event("selectionchange"));
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

  // NÚT ĐANG BẬT theo chỗ con trỏ (anh 18/11/2026: "logic các nút dòng B/I cho CHUẨN"): con trỏ trong chữ đậm thì B sáng, v.v.
  const [batNut, setBatNut] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const doc = () => {
      const el = khungRef.current, sel = window.getSelection();
      if (!el || !sel || !sel.rangeCount || !el.contains(sel.getRangeAt(0).startContainer)) return;
      const moi: Record<string, boolean> = {};
      for (const k of ["bold", "italic", "justifyLeft", "justifyCenter", "justifyRight", "justifyFull"]) {
        try { moi[k] = document.queryCommandState(k); } catch { moi[k] = false; }
      }
      setBatNut((cu) => (Object.keys(moi).some((k) => moi[k] !== cu[k]) ? moi : cu));
    };
    document.addEventListener("selectionchange", doc);
    document.addEventListener("input", doc);
    return () => { document.removeEventListener("selectionchange", doc); document.removeEventListener("input", doc); };
  }, []);
  const giuChon = (e: React.MouseEvent | React.PointerEvent) => e.preventDefault(); // bấm nút không làm rời ô, không mất vùng bôi đen

  // B · I · canh lề — một thanh trên đầu ô cho cả máy tính lẫn điện thoại
  const nutDinhDang = (
    <>
      {/* NÚT QUAY LẠI = HOÀN TÁC (anh 18/11/2026: ô Mô tả "có nút quay lại") — trả lại thao tác gõ / định dạng vừa làm */}
      {chiAnh && <ToolBtn label="Hoàn tác" tat={!nutLs.truoc} onClick={() => doiLs(-1)}><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" /></svg></ToolBtn>}
      {/* LÀM LẠI (anh 18/11/2026: "có Hoàn tác thì phải có Forward") */}
      {chiAnh && <ToolBtn label="Làm lại" tat={!nutLs.sau} onClick={() => doiLs(1)}><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H13" /></svg></ToolBtn>}
      {chiAnh && <span className="mx-1 hidden h-5 w-px shrink-0 bg-cvr-line sm:block" />}
      <ToolBtn label="In đậm" bat={!!batNut.bold} onClick={() => lenh("bold")}><span className="text-[13px] font-bold">B</span></ToolBtn>
      <ToolBtn label="In nghiêng" bat={!!batNut.italic} onClick={() => lenh("italic")}><span className="font-serif text-[13px] italic">I</span></ToolBtn>
      <span className="mx-1 hidden h-5 w-px shrink-0 bg-cvr-line sm:block" />
      <ToolBtn label="Canh trái" bat={!!batNut.justifyLeft} onClick={() => lenh("justifyLeft")}><AlignIcon lines={[16, 10, 16, 10]} /></ToolBtn>
      <ToolBtn label="Canh giữa" bat={!!batNut.justifyCenter} onClick={() => lenh("justifyCenter")}><AlignIcon lines={[16, 10, 16, 10]} center /></ToolBtn>
      <ToolBtn label="Canh phải" bat={!!batNut.justifyRight} onClick={() => lenh("justifyRight")}><AlignIcon lines={[16, 10, 16, 10]} right /></ToolBtn>
      <ToolBtn label="Canh đều 2 bên" bat={!!batNut.justifyFull} onClick={() => lenh("justifyFull")}><AlignIcon lines={[16, 16, 16, 16]} /></ToolBtn>
    </>
  );
  const bieuTuongAnh = <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" /></svg>;

  return (
    // data-tu-cuon: ô tự lo vị trí khi soạn (datKhung) — BanPhimAo không kéo trang thêm, hai bên cùng kéo là giật
    <div data-co-thanh="" data-tu-cuon="" className="group/soan space-y-2 max-sm:space-y-0 max-sm:overflow-clip max-sm:rounded-lg max-sm:border max-sm:border-cvr-line max-sm:bg-white max-sm:focus-within:border-cvr-blue max-sm:focus-within:ring-1 max-sm:focus-within:ring-cvr-blue">
      {/* Thanh định dạng trên đầu ô (máy tính + điện thoại). Chạm nút không làm rời ô — bàn phím điện thoại không tắt, không mất vùng bôi đen. */}
      {/* ĐIỆN THOẠI: thanh nằm TRONG KHUNG Ô, đầu khung, KHÔNG dính / không chồng lên chữ (anh 14/11/2026, ảnh iPhone 22:53 + 23:15: thanh
          dính đè mép trên ô, dòng đang gõ bị che — iPhone tự cuộn theo con trỏ không biết thanh dính). Khung = [thanh][chữ cuộn bên dưới]. */}
      <div
        data-thanh-dinh=""
        onPointerDown={giuChon}
        onMouseDown={giuChon}
        // Thanh nằm YÊN đầu khung (không dính trang — dính thì con trỏ chui dưới thanh, ảnh Samsung anh 15/11/2026 11:49). MỘT DÒNG trên điện thoại kể cả trình duyệt Zalo phóng chữ (ảnh Zalo anh 15/11/2026 8:28: "Chèn ảnh" rớt dòng 2, thanh cao gấp đôi
        // đè lên chữ) — không xuống hàng; máy chữ quá to thì vuốt ngang thanh (chạm nút vẫn giữ vùng bôi đen, vuốt không bị chặn).
        className={`${chiAnh ? "sm:sticky sm:top-[var(--hdr)] sm:z-10" : ""} no-scrollbar -mx-1 flex flex-wrap items-center gap-1 bg-white px-1 py-1 max-sm:mx-0 max-sm:flex-nowrap max-sm:justify-between max-sm:overflow-x-auto max-sm:gap-0.5 max-sm:border-b max-sm:border-cvr-line max-sm:px-1 max-sm:py-1.5 sm:mx-0 sm:gap-1.5 sm:px-0 sm:py-0`}
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
          {/* Điện thoại: thêm Hoàn tác / Làm lại thì "Chèn ảnh" bị cắt mép phải (Samsung thật 18/11/2026) → ghi gọn "Ảnh" cạnh biểu tượng */}
          {uploadingImg ? "Đang tải…" : <><span className="sm:hidden">Ảnh</span><span className="max-sm:hidden">Chèn ảnh</span></>}
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
        {/* Điện thoại: chữ gợi ý nằm CHUNG Ô LƯỚI với khung soạn — ô trống tự cao vừa đủ chữ gợi ý, không tràn xuống thanh kéo (K5, 15/11/2026) */}
        <div className={laDt ? "grid" : undefined}>
        <div
          ref={khungRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={() => { phatSau(); nhoKhoi(); }}
          onKeyUp={nhoKhoi}
          onKeyDown={(e) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
            const k = e.key.toLowerCase();
            if (k === "z" && !e.shiftKey) { e.preventDefault(); doiLs(-1); }
            else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); doiLs(1); }
          }}
          onMouseUp={nhoKhoi}
          // Chạm lúc bàn phím CHƯA bật → đưa khung lên NGAY (trước khi bàn phím trượt lên): khung đã nằm trong phần sẽ còn thấy nên Chrome không tự
          // cuộn thêm (nhật ký 15/11/2026: Chrome cuộn trang lúc bàn phím bật rồi lệnh mình kéo lại = nhảy 2 lần). Bàn phím đang bật thì chạm không kéo trang.
          onFocus={() => { daDat.current = false; setTimeout(thuDatKhung, 350); setTimeout(thuDatKhung, 900); }}
          onTouchEnd={nhoKhoi}
          // MỌI TRÌNH DUYỆT NHƯ CHROME (anh 16/11/2026: "Chrome chuẩn, tinh chỉnh cho Safari, Samsung Internet, Zalo, Facebook"): Samsung / Zalo /
          // Facebook có khi KHÔNG báo bàn phím đã bật (trang không co) → banPhimBat() luôn sai → trước đây MỖI lần chạm chữ lúc đang gõ lại kéo trang +
          // co khung, rồi ~0,85 giây sau giãn ra = nhảy lặp. Nay giống Chrome: chỉ lần chạm MỞ ô mới đưa khung lên; đang gõ chạm chữ thì không kéo gì.
          onClick={() => {
            if (!laDt || dangGoTruoc.current) return; // CHỈ khi CHẠM (click) — vuốt cuộn trang rồi nhấc tay thì không kéo trang về (nhật ký 17:51)
            if (!banPhimBat()) duBao();
            // ĐANG GÕ Ô KHÁC (bàn phím đã bật) RỒI CHẠM SANG MÔ TẢ — trình duyệt trong Zalo / FB (đo 16/11/2026): Zalo tự kéo trang +214px
            // (trượt) rồi khung soạn kéo về −74px = giật. Đặt khung NGAY lúc chạm → Zalo thấy ô đã nằm trong tầm nhìn, không kéo. Chrome giữ như cũ.
            else if (document.documentElement.classList.contains("trong-app")) datKhung();
          }}
          onBlur={() => {
            daDat.current = false; nhoKhoi(); phat();
            // Rời ô ở trình duyệt không báo bàn phím → trả khung về cỡ thường (Chrome: bàn phím tắt tự đổi cỡ, dòng này không làm gì thêm)
            if (laDt) setTimeout(() => { if (document.activeElement !== khungRef.current && !banPhimBat()) setCaoToiDa(tinhCao(caoMan.current * 0.62)); }, 300);
          }}
          onPaste={(e) => {
            // Chỉ lấy CHỮ — bỏ định dạng rác của nơi khác (màu, cỡ chữ, bảng…).
            e.preventDefault();
            const chu = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, chu);
            phat();
          }}
          // NÚT × BỎ ẢNH / VIDEO: xử lý NGAY lúc chạm (không chờ click, không bật bàn phím, không để ô nhận con trỏ)
          onPointerDown={(e) => {
            dangGoTruoc.current = document.activeElement === khungRef.current; // chạm chữ lúc đang gõ ≠ chạm mở ô (xem onClick)
            const nut = (e.target as HTMLElement).closest("[data-xoa]");
            if (!nut) return;
            e.preventDefault();
            nut.closest("[data-anh],[data-video]")?.remove();
            phat();
          }}
          // Máy tính: tự cao + kéo góc dưới.
          // Điện thoại: 5 dòng → tự giãn theo chữ → tối đa vừa phần màn hình còn thấy (caoToiDa), dài hơn thì cuộn trong khung
          // caoKeo: đã kéo → khung cao ĐÚNG mức kéo, KHÔNG quá caoToiDa (3/4 màn hình — anh 15/11/2026: "chỉ 3/4 trang, còn lại chạy trong ô"); chưa kéo → tự cao theo chữ
          // CON TRỎ ĐỨNG YÊN THEO CHỮ KHI CUỘN (15/11/2026, gốc trong mã Chrome box_fragment_painter.cc): chữ nằm THẲNG trong ô cuộn thì Chrome vẽ con
          // trỏ ở lớp KHÔNG cuộn của ô → con trỏ lơ lửng, trôi ra ngoài khung. Chữ nằm trong khối con thì con trỏ vẽ cùng lớp chữ (như ô gõ thường của
          // điện thoại: cuộn khuất thì khuất, cuộn lại thì hiện). flex cột = chữ rời luôn được bọc khối con (không đổi dữ liệu, giữ B / I).
          style={laDt ? { display: "flex", flexDirection: "column", gridArea: "1 / 1", minHeight: caoKeo && value.trim() ? Math.min(Math.max(caoKeo, CAO_5_DONG), caoToiDa) : Math.min(CAO_5_DONG, caoToiDa), maxHeight: caoKeo && value.trim() ? Math.min(Math.max(caoKeo, CAO_5_DONG), caoToiDa) : caoToiDa, overflowY: "auto", overscrollBehavior: "contain" } : chiAnh
            // MÁY TÍNH, ô Mô tả tin (anh 18/11/2026: "bỏ kéo giãn, cân đối; gõ nhiều tự giãn, nội dung đi trong phạm vi đó"): mặc định
            // ~7 dòng, chữ nhiều tự giãn tới MỨC TỐI ĐA (420px, không quá màn hình) rồi CUỘN TRONG KHUNG; góc phải dưới có nút kéo giãn
            // chuẩn (anh: "có nút kéo giãn chuẩn") — kéo trong khoảng 180px → mức tối đa, không giãn vô hạn.
            ? { minHeight: 180, maxHeight: "min(420px, calc(100dvh - 200px))", overflowY: "auto", overscrollBehavior: "contain" }
            : { minHeight: `${Math.max(rows, 7) * 1.6}rem` }}
          className={`soan-thao peer caret-[#1a73e8] w-full resize-none overflow-visible whitespace-pre-wrap break-words rounded-lg border border-cvr-line max-sm:rounded-none max-sm:border-0 bg-white px-3 py-2.5 text-[16px] leading-relaxed ${chiAnh ? "sm:resize-y sm:text-[15px]" : "sm:resize-y sm:overflow-auto sm:text-sm"} text-cvr-ink outline-none transition focus:border-cvr-ink`}
        />
        {!value.trim() && placeholder && (laDt
          ? <p aria-hidden style={{ gridArea: "1 / 1", maxHeight: Math.min(CAO_5_DONG, caoToiDa), display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4 }} className="pointer-events-none overflow-hidden px-3 py-2.5 text-[16px] leading-relaxed text-cvr-faint peer-focus:invisible">{placeholder}</p>
          : <p className="pointer-events-none absolute left-3 top-2.5 right-3 text-[16px] leading-relaxed text-cvr-faint sm:text-sm peer-focus:invisible">{placeholder}</p>
        )}
        </div>
        {/* GÓC KÉO giãn / thu ô (điện thoại) — đặt ở GÓC DƯỚI BÊN PHẢI ô theo chuẩn ô nhập (anh 15/11/2026: "để qua bên góc, theo chuẩn").
            Nhìn thấy: dấu góc nhỏ; vùng chạm 40×40 cho ngón tay. Chỉ kéo, không bao giờ bật bàn phím (chặn touchstart ở useEffect). */}
        {laDt && (
          <div ref={keoRef} role="separator" aria-label="Kéo để giãn hoặc thu khung soạn" className="absolute bottom-0 right-0 z-10 flex h-12 w-12 touch-none select-none items-end justify-end p-1">
            <svg aria-hidden className="h-6 w-6 text-cvr-muted" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><path d="M13 5L5 13M13 9.5L9.5 13" /></svg>
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
function ToolBtn({ label, onClick, onMouseDown, bat, tat, children }: { label: string; onClick: () => void; onMouseDown?: (e: React.MouseEvent) => void; bat?: boolean; tat?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={bat === undefined ? undefined : bat}
      disabled={tat}
      // Nút đang BẬT ở chỗ con trỏ (đậm, nghiêng, kiểu canh) nền đen chữ trắng — như trình soạn chuẩn (anh 18/11/2026)
      className={`flex h-8 w-6 shrink-0 items-center justify-center rounded-lg border transition sm:w-8 ${bat ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line bg-white text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"} disabled:pointer-events-none disabled:opacity-35`}
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
