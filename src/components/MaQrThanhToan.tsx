"use client";

import { useEffect, useRef, useState } from "react";
import { vnd } from "@/lib/billing";

// ============================================================================
// MÃ QR THANH TOÁN NGAY TRÊN COASTALLAND.VN — logo Coastal Land giữa mã (chủ dự án 26/10/2026: trang PayOS chỉ cho
// logo payOS). Dữ liệu mã (chuẩn VietQR) do PayOS trả lúc tạo đơn (api/thanh-toan/tao-don); tiền vẫn về tài khoản
// qua PayOS, webhook cộng ví như cũ. Trang hỏi trạng thái 3 giây/lần (api/thanh-toan/trang-thai), tối đa 15 phút.
// Thư viện qrcode chỉ tải khi mở mã (import động) — không nặng trang Nạp tiền lúc mở.
// ============================================================================

const NGAN_HANG: Record<string, string> = { "970422": "MB Bank" };

export type DonQr = {
  orderCode: number;
  amount: number;
  qrCode: string;
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  description?: string;
};

export default function MaQrThanhToan({ don, onHuy, onXong }: { don: DonQr; onHuy: () => void; onXong: () => void }) {
  const [anh, setAnh] = useState("");
  const [daChep, setDaChep] = useState("");
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

  function chep(nhan: string, giaTri: string) {
    navigator.clipboard?.writeText(giaTri).then(() => { setDaChep(nhan); setTimeout(() => setDaChep(""), 1500); }, () => {});
  }

  const dong: [string, string, boolean][] = [
    ["Ngân hàng", NGAN_HANG[don.bin ?? ""] ?? don.bin ?? "", false],
    ["Số tài khoản", don.accountNumber ?? "", true],
    ["Chủ tài khoản", don.accountName ?? "", false],
    ["Số tiền", vnd(don.amount), false],
    ["Nội dung", don.description ?? "", true],
  ];

  return (
    <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
      <div className="mx-auto w-full max-w-[280px]">
        {anh ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anh} alt="Mã QR thanh toán" className="aspect-square w-full" />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-lg bg-cvr-surface" />
        )}
      </div>
      <dl className="mt-4 divide-y divide-cvr-line/70 text-sm">
        {dong.map(([nhan, giaTri, chepDuoc]) => (
          <div key={nhan} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="shrink-0 text-cvr-muted">{nhan}</dt>
            <dd className="flex min-w-0 items-center gap-2 text-right font-semibold text-cvr-ink">
              <span className="break-all">{giaTri}</span>
              {chepDuoc && giaTri && (
                <button type="button" onClick={() => chep(nhan, giaTri)} className="shrink-0 rounded-md border border-cvr-line px-2 py-1 text-xs font-medium text-cvr-body hover:border-cvr-ink">
                  {daChep === nhan ? "Đã chép" : "Chép"}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-center text-sm text-cvr-muted">Đang chờ thanh toán…</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <a href={anh || undefined} download={`coastal-land-${don.orderCode}.png`} className="flex h-12 items-center justify-center rounded-lg bg-cvr-ink text-[15px] font-bold text-white">
          Lưu mã QR
        </a>
        <button type="button" onClick={onHuy} className="h-12 rounded-lg border border-cvr-line text-[15px] font-semibold text-cvr-body hover:border-cvr-ink hover:text-cvr-ink">
          Huỷ
        </button>
      </div>
    </section>
  );
}
