"use client";

import { useState } from "react";

// ════════════════════════════════════════════════════════════════════════════
// HỘP XÁC THỰC SỐ ĐỂ XEM SỐ NGƯỜI BÁN
// ----------------------------------------------------------------------------
// Khách chưa có tài khoản bấm "hiện số": thay vì đá thẳng sang trang đăng nhập
// (bắt đặt mật khẩu, điền hồ sơ — phần lớn bỏ cuộc ngay đó), chỉ hỏi số điện
// thoại của họ rồi gửi mã. Nhập mã là xem được số người bán.
//
// Đổi lại, sàn có số điện thoại THẬT ĐÃ XÁC THỰC của người quan tâm, và người
// bán nhận được một lead gọi lại được ngay.
//
// Mã không gửi được (kênh Zalo chưa sẵn sàng) → nói thật và mở lối đăng nhập,
// KHÔNG bắt khách ngồi đợi một cái mã không bao giờ tới.
// ════════════════════════════════════════════════════════════════════════════

// Vé xác thực để trong máy khách. Vé do MÁY CHỦ ký, khách không tự chế được vé
// mang số người khác.
export const KHOA_VE = "cl-ve-xem-so";

export function veDaLuu(): string | null {
  try {
    return localStorage.getItem(KHOA_VE);
  } catch {
    return null;
  }
}

export default function HopXacThucSo({
  listingId,
  onXong,
  onDong,
}: {
  listingId: string;
  /** Xác thực xong — trả về số điện thoại người bán. */
  onXong: (sdtNguoiBan: string) => void;
  onDong: () => void;
}) {
  const [buoc, setBuoc] = useState<"sdt" | "ma">("sdt");
  const [sdt, setSdt] = useState("");
  const [ten, setTen] = useState("");
  const [ma, setMa] = useState("");
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState("");
  const [phaiDangNhap, setPhaiDangNhap] = useState(false);

  async function goi(kem: { ma?: string }) {
    setDangChay(true);
    setLoi("");
    try {
      const r = await fetch("/api/xem-so", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, sdt: sdt.trim(), ten: ten.trim(), ...kem }),
      });
      const j = await r.json();
      if (j.ok && j.sdt) {
        // Nhớ vé: lần sau xem tin khác không phải nhập mã lại. Vé chỉ nói "số
        // này đã xác thực", không mở được tài khoản hay ví.
        if (j.ve) { try { localStorage.setItem(KHOA_VE, j.ve as string); } catch { /* chặn lưu trữ → lần sau nhập mã lại */ } }
        return onXong(j.sdt as string);
      }
      if (j.ok && j.daGui) {
        setBuoc("ma");
        return;
      }
      if (j.khongGuiDuoc) setPhaiDangNhap(true);
      setLoi(j.loi || "Không thực hiện được, thử lại sau.");
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangChay(false);
    }
  }

  const next = typeof window === "undefined" ? "/" : window.location.pathname + window.location.search;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onDong}>
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold tracking-tight text-cvr-ink">
          {buoc === "sdt" ? "Xem số điện thoại người đăng" : "Nhập mã xác thực"}
        </h3>
        <p className="mt-1 text-sm text-cvr-muted">
          {buoc === "sdt"
            ? "Nhập số điện thoại của bạn để nhận mã — không cần tạo mật khẩu."
            : `Mã gồm 6 số vừa gửi tới ${sdt}.`}
        </p>

        {buoc === "sdt" ? (
          <div className="mt-4 space-y-3">
            <input
              value={sdt}
              onChange={(e) => setSdt(e.target.value)}
              inputMode="tel"
              placeholder="Số điện thoại của bạn"
              className={oNhap}
              autoFocus
            />
            <input
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              placeholder="Tên của bạn (không bắt buộc)"
              className={oNhap}
            />
          </div>
        ) : (
          <input
            value={ma}
            onChange={(e) => setMa(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="Mã 6 số"
            className={`${oNhap} mt-4 text-center text-lg tracking-[0.4em]`}
            autoFocus
          />
        )}

        {loi && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}

        {phaiDangNhap ? (
          <a
            href={`/dang-nhap?next=${encodeURIComponent(next)}`}
            className="mt-4 flex h-12 items-center justify-center rounded-full bg-cvr-ink text-sm font-bold text-white"
          >
            Đăng nhập để xem số
          </a>
        ) : (
          <button
            type="button"
            onClick={() => goi(buoc === "ma" ? { ma } : {})}
            disabled={dangChay || (buoc === "sdt" ? sdt.trim().length < 9 : ma.length < 6)}
            className="mt-4 h-12 w-full rounded-full bg-cvr-ink text-sm font-bold text-white disabled:opacity-40"
          >
            {dangChay ? "Đang xử lý…" : buoc === "sdt" ? "Nhận mã" : "Xem số"}
          </button>
        )}

        <button type="button" onClick={onDong} className="mt-2 h-10 w-full text-sm font-medium text-cvr-muted">
          Để sau
        </button>
      </div>
    </div>
  );
}

const oNhap =
  "h-12 w-full rounded-lg border border-cvr-line bg-white px-3.5 text-[15px] text-cvr-ink outline-none focus:border-cvr-ink";
