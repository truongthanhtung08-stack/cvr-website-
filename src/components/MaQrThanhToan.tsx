"use client";

import { useEffect, useRef, useState } from "react";
import { vnd } from "@/lib/billing";
import { PHAP_LY } from "@/lib/phapLy";

// ============================================================================
// MÃ QR THANH TOÁN NGAY TRÊN COASTALLAND.VN — logo Coastal Land giữa mã (chủ dự án 26/10/2026: trang PayOS chỉ cho
// logo payOS). Dữ liệu mã (chuẩn VietQR) do PayOS trả lúc tạo đơn (api/thanh-toan/tao-don); tiền vẫn về tài khoản
// qua PayOS, webhook cộng ví như cũ. Trang hỏi trạng thái 3 giây/lần (api/thanh-toan/trang-thai), tối đa 15 phút.
// Thư viện qrcode chỉ tải khi mở mã (import động) — không nặng trang Nạp tiền lúc mở.
// ============================================================================

// MÁY TÍNH: nhấn logo → trang Internet Banking của ngân hàng (thẻ mới), khách chép số tài khoản / số tiền / nội dung ở bảng dưới.
// Địa chỉ đã mở thử được ngày 27/10/2026; logo theo VietQR.
const INTERNET_BANKING: { appId: string; appName: string; appLogo: string; href: string }[] = [
  ["VCB", "Vietcombank", "VCB", "https://vcbdigibank.vietcombank.com.vn"],
  ["ICB", "VietinBank", "ICB", "https://ipay.vietinbank.vn"],
  ["BIDV", "BIDV", "BIDV", "https://smartbanking.bidv.com.vn"],
  ["MB", "MB Bank", "MB", "https://online.mbbank.com.vn"],
  ["ACB", "ACB", "ACB", "https://online.acb.com.vn"],
  ["VPB", "VPBank", "VPB", "https://neo.vpbank.com.vn"],
  ["STB", "Sacombank", "SACOMBANK", "https://www.isacombank.com.vn"],
  ["TPB", "TPBank", "TPB", "https://ebank.tpb.vn"],
  ["MSB", "MSB", "MSB", "https://ebank.msb.com.vn"],
  ["SHB", "SHB", "SHB", "https://ibanking.shb.com.vn"],
].map(([appId, appName, anh, href]) => ({ appId, appName, appLogo: `https://cdn.vietqr.io/img/${anh}.png`, href }));

// Về tin đang đăng sau khi huỷ / quay lại: huy-tt=1 → form cuộn thẳng tới khối Gói tin — thanh toán (PostListingForm)
export const veHuy = (ve: string) => (ve.startsWith("/dang-tin?id=") ? `${ve}&huy-tt=1` : ve);

export type DonQr = {
  orderCode: number;
  amount: number;
  qrCode: string;
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  description?: string;
};

// urlXong: trang app ngân hàng trả khách về sau khi chuyển xong (tham số url bắt buộc của dl.vietqr.io)
export default function MaQrThanhToan({ don, onHuy, onXong, urlXong }: { don: DonQr; onHuy: () => void; onXong: () => void; urlXong: string }) {
  const [anh, setAnh] = useState("");
  const [daChep, setDaChep] = useState("");
  // Đã bấm Thanh toán → bước chọn ngân hàng. Từ app ngân hàng quay về mà trang tải lại → vẫn đứng bước này (mốc cvrNh)
  const [buocNganHang, setBuocNganHang] = useState(() => !!window.history.state?.cvrNh);
  // BACK LÙI ĐÚNG TỪNG BƯỚC Z→A (chủ dự án 27/10/2026): bước chọn ngân hàng là một mốc lịch sử (cvrNh) → Back về mã QR;
  // Back ở mã QR → trang nạp; Back ở trang nạp → tin, khối Gói tin. HUỶ THANH TOÁN → về thẳng tin (trang nạp lo).
  // Trang tải lại khi khách từ app ngân hàng quay về: mốc cvrNh còn nguyên → vẫn đứng bước chọn ngân hàng.
  function moNganHang() {
    window.history.pushState({ ...window.history.state, cvrQr: 1, cvrNh: 1 }, "");
    setBuocNganHang(true);
  }
  useEffect(() => {
    const lui = () => setBuocNganHang(!!window.history.state?.cvrNh);
    window.addEventListener("popstate", lui);
    return () => window.removeEventListener("popstate", lui);
  }, []);
  const huy = onHuy;
  const xongRef = useRef(onXong);
  xongRef.current = onXong;

  // Vẽ mã QR (mức sửa lỗi H — chịu được logo che giữa) + logo Coastal Land trên nền trắng
  useEffect(() => {
    let huy = false;
    (async () => {
      const QR = (await import("qrcode")).default;
      const cv = document.createElement("canvas");
      await QR.toCanvas(cv, don.qrCode, { errorCorrectionLevel: "H", margin: 2, width: 600 });
      const logo = new Image();
      logo.src = "/logo/symbol.png";
      await logo.decode().catch(() => {});
      const ctx = cv.getContext("2d");
      if (ctx && logo.naturalWidth) {
        const o = Math.round(cv.width * 0.22);
        const x = (cv.width - o) / 2;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.roundRect(x - 10, x - 10, o + 20, o + 20, 16);
        ctx.fill();
        ctx.drawImage(logo, x, x, o, o);
      }
      if (!huy) setAnh(cv.toDataURL("image/png"));
    })();
    return () => { huy = true; };
  }, [don.qrCode]);

  // Hỏi trạng thái — tiền về (webhook ghi "paid") là chuyển trang
  useEffect(() => {
    const batDau = Date.now();
    const t = setInterval(async () => {
      if (Date.now() - batDau > 15 * 60_000) return clearInterval(t);
      const r = await fetch(`/api/thanh-toan/trang-thai?ma=${don.orderCode}`).then((x) => x.json()).catch(() => null);
      if (r?.status === "paid") { clearInterval(t); xongRef.current(); }
    }, 3000);
    return () => clearInterval(t);
  }, [don.orderCode]);

  // DANH SÁCH NGÂN HÀNG trên điện thoại (chủ dự án 27/10/2026): chạm ngân hàng → mở thẳng app ngân hàng, số tài khoản +
  // số tiền + nội dung điền sẵn (đường dẫn dl.vietqr.io). Chuyển xong khách quay lại trình duyệt → trang hỏi trạng thái
  // thấy "paid" là tự về đúng chỗ. Danh sách lấy từ api.vietqr.io lúc mở mã (1 lần/đơn, không qua máy chủ Coastal Land).
  const [nganHang, setNganHang] = useState<{ appId: string; appLogo: string; appName: string; href?: string }[]>([]);
  const [mayTinh, setMayTinh] = useState(false);
  useEffect(() => {
    // Máy tính không mở được app ngân hàng → danh sách Internet Banking
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đo loại máy một lần lúc mở mã
    if (!window.matchMedia("(pointer: coarse)").matches) { setMayTinh(true); setNganHang(INTERNET_BANKING); return; }
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    fetch(`https://api.vietqr.io/v2/${ios ? "ios" : "android"}-app-deeplinks`)
      .then((r) => r.json())
      .then((j: { apps?: { appId: string; appLogo: string; appName: string; autofill?: number }[] }) =>
        // Đủ mọi ngân hàng; app tự điền sẵn số tiền + nội dung (autofill) xếp trước
        setNganHang([...(j.apps ?? [])]
          .filter((a, i, ds) => ds.findIndex((b) => b.appName === a.appName) === i) // danh sách VietQR có app trùng tên
          .sort((a, b) => (b.autofill ?? 0) - (a.autofill ?? 0))))
      .catch(() => {});
  }, []);
  // Tài khoản nhận theo đơn PayOS (để web tự nhận tiền); PayOS không trả thì dùng tài khoản công ty MB
  // Theo tài liệu vietqr.io/danh-sach-api/deeplink-app-ngan-hang: ba = SỐ_TK@mã ngân hàng (MB = "mb"), am, tn, app, url bắt buộc —
  // đủ thì app ngân hàng (loại tự điền) mở thẳng màn chuyển tiền, điền sẵn số tài khoản + số tiền + nội dung.
  const moApp = (appId: string) =>
    `https://dl.vietqr.io/pay?app=${appId}&ba=${don.accountNumber || PHAP_LY.soTaiKhoan}@${!don.bin || don.bin === "970422" ? "mb" : don.bin}` +
    `&am=${don.amount}&tn=${encodeURIComponent(don.description ?? "")}&bn=${encodeURIComponent(don.accountName || PHAP_LY.chuTaiKhoan)}` +
    `&url=${encodeURIComponent(urlXong)}`;

  // Quay lại từ app ngân hàng → hỏi trạng thái ngay, không đợi lượt 3 giây
  useEffect(() => {
    const hoi = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await fetch(`/api/thanh-toan/trang-thai?ma=${don.orderCode}`).then((x) => x.json()).catch(() => null);
      if (r?.status === "paid") xongRef.current();
    };
    document.addEventListener("visibilitychange", hoi);
    return () => document.removeEventListener("visibilitychange", hoi);
  }, [don.orderCode]);

  function chep(nhan: string, giaTri: string) {
    navigator.clipboard?.writeText(giaTri).then(() => { setDaChep(nhan); setTimeout(() => setDaChep(""), 1500); }, () => {});
  }

  // Tài khoản PayOS trả theo đơn (tài khoản ảo MB của công ty) — khớp mã QR nên chuyển tay cũng tự cộng ví
  // (chủ dự án 27/10/2026); PayOS không trả thì dùng tài khoản công ty (phapLy.ts)
  const dong: [string, string, boolean][] = [
    ["Ngân hàng", !don.bin || don.bin === "970422" ? PHAP_LY.nganHang : don.bin, false],
    ["Số tài khoản", don.accountNumber || PHAP_LY.soTaiKhoan, true],
    ["Chủ tài khoản", don.accountName || PHAP_LY.chuTaiKhoan, false],
    ["Số tiền", vnd(don.amount), false],
    ["Nội dung", don.description ?? "", true],
  ];

  // LƯU MÃ QR = tệp ảnh PNG (chủ dự án 27/10/2026):
  // · iPhone: bảng chia sẻ → "Lưu hình ảnh" vào Ảnh (Safari tải thẳng chỉ vào Tệp, không vào Ảnh)
  // · Android: tải thẳng → thư mục Download, hiện trong Bộ sưu tập / Google Ảnh
  // · Máy tính: hộp "Lưu thành" chọn chỗ lưu (Chrome, Edge); trình duyệt khác tải về theo cài đặt của trình duyệt
  async function luuMa() {
    if (!anh) return;
    const ten = `coastal-land-${don.orderCode}.png`;
    // Đổi ảnh sang tệp NGAY (không chờ mạng): Safari chỉ cho mở bảng chia sẻ liền sau cú bấm
    const nhiPhan = atob(anh.split(",")[1]);
    const anhTep = new Blob([Uint8Array.from(nhiPhan, (c) => c.charCodeAt(0))], { type: "image/png" });
    const iphone = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    if (iphone) {
      const tep = new File([anhTep], ten, { type: "image/png" });
      if (navigator.canShare?.({ files: [tep] })) { await navigator.share({ files: [tep] }).catch(() => {}); return; }
    }
    const hoiLuu = (window as unknown as { showSaveFilePicker?: (o: object) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker;
    if (mayTinh && hoiLuu) {
      try {
        const noi = await hoiLuu({ suggestedName: ten, types: [{ description: "Ảnh PNG", accept: { "image/png": [".png"] } }] });
        const ghi = await noi.createWritable();
        await ghi.write(anhTep);
        await ghi.close();
      } catch { /* khách bấm Huỷ ở hộp Lưu thành */ }
      return;
    }
    const lk = document.createElement("a");
    lk.href = anh;
    lk.download = ten;
    lk.click();
  }

  // HAI BƯỚC (chủ dự án 27/10/2026): ① mã QR + tài khoản + Lưu mã QR / Thanh toán → ② bấm Thanh toán: hướng dẫn một dòng
  // + logo ngân hàng như mẫu VNPAY, nhấn logo mở app ngân hàng. Huỷ thanh toán ở cả hai bước = về đúng chỗ đang làm.
  const bangTaiKhoan = (
      <dl className="mt-4 divide-y divide-cvr-line/70 text-sm">
        {dong.map(([nhan, giaTri, chepDuoc]) => (
          <div key={nhan} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="shrink-0 text-cvr-muted">{nhan}</dt>
            <dd className="flex min-w-0 items-center gap-2 text-right font-semibold text-cvr-ink">
              <span className="break-words">{giaTri}</span>
              {chepDuoc && giaTri && (
                <button type="button" onClick={() => chep(nhan, giaTri)} className="shrink-0 rounded-md border border-cvr-line px-2 py-1 text-xs font-medium text-cvr-body hover:border-cvr-ink">
                  {daChep === nhan ? "Đã chép" : "Chép"}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
  );
  const nutPhu = "flex h-12 items-center justify-center rounded-lg border border-cvr-line text-[15px] font-semibold text-cvr-body hover:border-cvr-ink hover:text-cvr-ink";
  return (
    <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
      <div className="rounded-xl bg-cvr-surface px-4 py-3">
        <p className="text-sm text-cvr-body">Thanh toán đơn hàng {don.orderCode}</p>
        <p className="mt-0.5 text-2xl font-bold text-cvr-ink">{vnd(don.amount)}</p>
      </div>
      <div className="mx-auto mt-4 w-full max-w-[260px]">
        {anh ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anh} alt="Mã QR thanh toán" className="aspect-square w-full" />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-lg bg-cvr-surface" />
        )}
      </div>
      {buocNganHang ? (
        <>
          <p className="mt-4 text-sm text-cvr-body">
            Quét mã hoặc <b className="text-cvr-ink">nhấn vào logo</b> để thanh toán {mayTinh ? "qua Internet Banking" : "trực tiếp trên App"}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {nganHang.map((n) => (
              <a
                key={n.appId}
                href={mayTinh ? n.href : moApp(n.appId)}
                {...(mayTinh ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex flex-col items-center gap-1 rounded-lg border border-cvr-line p-2 text-center hover:border-cvr-ink active:bg-cvr-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={n.appLogo} alt="" loading="lazy" className={mayTinh ? "h-10 w-full object-contain" : "h-10 w-10 rounded-lg"} />
                <span className="line-clamp-2 text-[11px] leading-tight text-cvr-body">{n.appName}</span>
              </a>
            ))}
          </div>
          {/* Máy tính: Internet Banking phải gõ tay → bảng tài khoản để chép */}
          {mayTinh && bangTaiKhoan}
        </>
      ) : (
        <>
          {bangTaiKhoan}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button type="button" onClick={luuMa} className={nutPhu}>Lưu mã QR</button>
            <button type="button" onClick={moNganHang} className="h-12 rounded-lg bg-cvr-ink text-[15px] font-bold text-white">
              Thanh toán
            </button>
          </div>
        </>
      )}
      <p className="mt-4 text-center text-sm text-cvr-muted">Đang chờ thanh toán…</p>
      <button type="button" onClick={huy} className={`mt-3 w-full bg-cvr-surface ${nutPhu}`}>
        Huỷ thanh toán
      </button>
    </section>
  );
}
