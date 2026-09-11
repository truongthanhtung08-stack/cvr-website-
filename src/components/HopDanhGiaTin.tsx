"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ════════════════════════════════════════════════════════════════════════════
// HỎI CHẤT LƯỢNG TIN — ngay sau khi khách xem số
// ----------------------------------------------------------------------------
// Người vừa bấm xem số là người DUY NHẤT biết tin đó thật hay ảo, giá đúng hay
// sai, môi giới có nghe máy không. Hỏi họ là cách rẻ nhất để lọc tin ảo.
//
// HỎI NGAY TRÊN WEB, không gửi tin nhắn: mỗi tin ZNS là tiền, mà khách vừa xem
// số xong vẫn đang ở trên trang — hỏi lúc đó họ còn nhớ rõ nhất.
//
// KHÔNG hỏi ngay giây đầu (khách còn đang bấm gọi) mà chờ một lúc. Khách bỏ qua
// thì thôi, không hỏi lại tin đó nữa — không ai chịu nổi cái hộp bám dai.
// ════════════════════════════════════════════════════════════════════════════

const CHO = 25_000;        // xem số xong bao lâu thì hỏi
const KHOA = "cl-dg-";     // đã hỏi/đã trả lời tin nào rồi

export default function HopDanhGiaTin({ listingId, sdtKhach }: { listingId: string; sdtKhach?: string }) {
  const [mo, setMo] = useState(false);
  const [sao, setSao] = useState(0);
  const [sai, setSai] = useState(false);
  const [khongGap, setKhongGap] = useState(false);
  const [daBan, setDaBan] = useState(false);
  const [xong, setXong] = useState(false);
  const [dangGui, setDangGui] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KHOA + listingId)) return;   // hỏi rồi thì thôi
    } catch {
      return;
    }
    const t = setTimeout(() => setMo(true), CHO);
    return () => clearTimeout(t);
  }, [listingId]);

  function dong() {
    // Đánh dấu đã hỏi — dù khách trả lời hay bỏ qua, không hỏi lại tin này nữa.
    try {
      localStorage.setItem(KHOA + listingId, "1");
    } catch {
      /* chặn lưu trữ → cùng lắm lần sau hỏi lại */
    }
    setMo(false);
  }

  async function gui(soSao: number) {
    setDangGui(true);
    try {
      await createClient().rpc("gui_danh_gia", {
        p_listing_id: listingId,
        p_sao: soSao,
        p_sdt: sdtKhach ?? null,
        p_sai: sai,
        p_khong_gap: khongGap,
        p_da_ban: daBan,
      });
      setXong(true);
      try {
        localStorage.setItem(KHOA + listingId, "1");
      } catch {
        /* không lưu được cũng không sao */
      }
      setTimeout(() => setMo(false), 1_600);
    } catch {
      // Chưa chạy migration 0032, chưa từng liên hệ tin, hoặc mất mạng → đóng êm.
      // Đây là việc phụ, tuyệt đối không làm phiền khách bằng thông báo lỗi.
      dong();
    } finally {
      setDangGui(false);
    }
  }

  if (!mo) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:left-auto sm:right-4 sm:max-w-sm sm:p-0 sm:pb-4">
      <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        {xong ? (
          <p className="py-2 text-center text-sm font-medium text-cvr-ink">Cảm ơn bạn đã đánh giá.</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-cvr-ink">Tin này có đúng như mô tả không?</p>
              <button type="button" onClick={dong} aria-label="Đóng" className="-mr-1 -mt-1 p-1 text-cvr-faint">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bấm sao là gửi luôn — một chạm, không có nút Gửi. Bắt thêm một
                bước nữa là mất phần lớn người đang định trả lời. */}
            <div className="mt-2.5 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={dangGui}
                  onMouseEnter={() => setSao(n)}
                  onFocus={() => setSao(n)}
                  onClick={() => gui(n)}
                  aria-label={`${n} sao`}
                  className="p-1 text-2xl leading-none transition active:scale-90"
                >
                  <span className={n <= sao ? "text-[#f5a623]" : "text-cvr-line"}>★</span>
                </button>
              ))}
            </div>

            {/* Ba vấn đề hay gặp nhất — tick nhanh, không bắt gõ chữ. */}
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              <Tick bat={sai} doi={() => setSai((v) => !v)}>Sai thông tin</Tick>
              <Tick bat={khongGap} doi={() => setKhongGap((v) => !v)}>Không liên lạc được</Tick>
              <Tick bat={daBan} doi={() => setDaBan((v) => !v)}>Đã bán</Tick>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Tick({ bat, doi, children }: { bat: boolean; doi: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={doi}
      className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition ${
        bat ? "bg-cvr-ink text-white" : "bg-cvr-surface text-cvr-body"
      }`}
    >
      {children}
    </button>
  );
}
