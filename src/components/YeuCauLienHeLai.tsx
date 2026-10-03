"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/useProfile";

// ============================================================================
// TIN HẾT HẠN — "Gửi yêu cầu để người đăng liên hệ lại" (giống Batdongsan, đo 03/10/2026).
// Tin hết hạn không hiện số; khách để lại tên + SĐT → /api/yeu-cau-lien-he báo THẲNG
// người đăng (email / Zalo) + ghi lead để người đăng thấy số khách trong tài khoản.
// ============================================================================
export default function YeuCauLienHeLai({ listingId }: { listingId: string }) {
  const { profile } = useProfile();
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setTen((v) => v || profile.full_name || "");
    setSdt((v) => v || profile.phone || "");
  }, [profile]);

  // Nút ghim đáy màn hình (điện thoại) mở form này.
  useEffect(() => {
    const moForm = () => setMo(true);
    window.addEventListener("mo-yeu-cau-lien-he", moForm);
    return () => window.removeEventListener("mo-yeu-cau-lien-he", moForm);
  }, []);

  async function gui() {
    setLoi("");
    if (!ten.trim()) return setLoi("Chưa nhập họ tên.");
    if (!sdt.trim()) return setLoi("Chưa nhập số điện thoại.");
    setDangGui(true);
    try {
      const r = await fetch("/api/yeu-cau-lien-he", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ten: ten.trim(), sdt: sdt.trim() }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; loi?: string };
      if (!r.ok || !j.ok) throw new Error(j.loi || "lỗi không rõ");
      setXong(true);
    } catch (e) {
      setLoi(`Gửi yêu cầu thất bại: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    }
    setDangGui(false);
  }

  return (
    <div id="yeu-cau-lien-he" className="scroll-mt-28">
      <p className="text-sm leading-relaxed text-cvr-body">
        Gửi yêu cầu để người đăng liên hệ lại nếu bất động sản vẫn còn giao dịch
      </p>
      {xong ? (
        <p className="mt-3 rounded-lg bg-cvr-surface px-3 py-2.5 text-sm text-cvr-ink">
          Đã gửi yêu cầu. Người đăng sẽ liên hệ lại với bạn.
        </p>
      ) : !mo ? (
        <button
          type="button"
          onClick={() => setMo(true)}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-cvr-ink text-sm font-semibold text-white transition hover:bg-cvr-body"
        >
          Gửi yêu cầu liên hệ
        </button>
      ) : (
        <div className="mt-3 space-y-2.5">
          <input
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            placeholder="Họ và tên *"
            aria-label="Họ và tên"
            className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white"
          />
          <input
            value={sdt}
            onChange={(e) => setSdt(e.target.value)}
            placeholder="Số điện thoại *"
            aria-label="Số điện thoại"
            type="tel"
            className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white"
          />
          {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}
          <button
            type="button"
            onClick={gui}
            disabled={dangGui}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-cvr-ink text-sm font-semibold text-white transition hover:bg-cvr-body disabled:opacity-50"
          >
            {dangGui ? "Đang gửi…" : "Gửi yêu cầu liên hệ"}
          </button>
        </div>
      )}
    </div>
  );
}

// Nút ghim đáy màn hình điện thoại cho tin hết hạn (thay thanh Gọi · Zalo).
export function NutYeuCauLienHe() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event("mo-yeu-cau-lien-he"));
        document.getElementById("yeu-cau-lien-he")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className="flex h-11 flex-1 items-center justify-center rounded-lg bg-cvr-ink text-sm font-semibold text-white"
    >
      Gửi yêu cầu liên hệ
    </button>
  );
}
