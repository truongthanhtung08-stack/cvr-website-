"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HopXacThucSo, { veDaLuu } from "@/components/HopXacThucSo";

// ════════════════════════════════════════════════════════════════════════════
// KHỐI ĐÁNH GIÁ TIN — nằm sẵn cuối nội dung MỌI trang tin (chủ dự án chốt 01/10/2026)
// Ai đọc tin cũng bấm được, KHÔNG cần xem số người đăng. Bấm gửi mới cần xác định người:
//   · đã đăng nhập → gửi luôn
//   · chưa đăng nhập → xác minh số của mình 1 lần (mã Zalo) → gửi; vé nhớ 30 ngày, đánh
//     giá tin khác không phải nhập mã lại.
// Bấm sao là gửi (kèm các ô đã tick) — một chạm, không có nút Gửi riêng.
// ════════════════════════════════════════════════════════════════════════════
const KHOA = "cl-dg-";

export default function KhoiDanhGiaTin({ listingId }: { listingId: string }) {
  const [sao, setSao] = useState(0);
  const [sai, setSai] = useState(false);
  const [khongGap, setKhongGap] = useState(false);
  const [daBan, setDaBan] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [xong, setXong] = useState(false);
  const [loi, setLoi] = useState("");
  const [cho, setCho] = useState<number | null>(null); // số sao đang chờ xác minh số

  useEffect(() => {
    try {
      if (localStorage.getItem(KHOA + listingId)) setXong(true);
    } catch { /* không đọc được thì cho đánh giá lại */ }
  }, [listingId]);

  async function gui(soSao: number) {
    setDangGui(true);
    setLoi("");
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const ve = session ? null : veDaLuu();
      if (!session && !ve) {
        setCho(soSao); // chưa đăng nhập, chưa có vé → xác minh số trước
        return;
      }
      const r = await fetch("/api/danh-gia", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ listingId, sao: soSao, sai, khongGap, daBan, ve }),
      });
      const j = await r.json();
      if (j.ok) {
        setXong(true);
        try { localStorage.setItem(KHOA + listingId, "1"); } catch { /* bỏ qua */ }
      } else if (j.canXacMinh) {
        setCho(soSao); // vé hết hạn → xác minh lại
      } else setLoi(j.loi || "Chưa gửi được đánh giá.");
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangGui(false);
    }
  }

  return (
    <section className="rounded-2xl border border-cvr-line bg-cvr-surface p-5">
      {xong ? (
        <p className="text-center text-sm font-medium text-cvr-ink">Cảm ơn bạn đã đánh giá tin này.</p>
      ) : (
        <>
          <p className="text-center text-[15px] font-semibold text-cvr-ink">Tin này có đúng như mô tả không?</p>
          <div className="mt-2.5 flex justify-center gap-1.5" onMouseLeave={() => setSao(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={dangGui}
                onMouseEnter={() => setSao(n)}
                onFocus={() => setSao(n)}
                onClick={() => gui(n)}
                aria-label={`${n} sao`}
                className="p-1 text-3xl leading-none transition active:scale-90"
              >
                <span className={n <= sao ? "text-[#f5a623]" : "text-cvr-line"}>★</span>
              </button>
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            <Tick bat={sai} doi={() => setSai((v) => !v)}>Sai thông tin</Tick>
            <Tick bat={khongGap} doi={() => setKhongGap((v) => !v)}>Không liên lạc được</Tick>
            <Tick bat={daBan} doi={() => setDaBan((v) => !v)}>Đã bán</Tick>
          </div>
          {loi && <p className="mt-2 text-center text-sm text-red-600">{loi}</p>}
        </>
      )}
      {cho !== null && (
        <HopXacThucSo
          listingId={listingId}
          chiXacMinh
          onDong={() => setCho(null)}
          onXong={() => {
            const s = cho;
            setCho(null);
            gui(s);
          }}
        />
      )}
    </section>
  );
}

function Tick({ bat, doi, children }: { bat: boolean; doi: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={doi}
      className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition ${bat ? "bg-cvr-ink text-white" : "bg-white text-cvr-body"}`}
    >
      {children}
    </button>
  );
}
