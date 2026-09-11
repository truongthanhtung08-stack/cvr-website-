"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { chuanHoaSdt } from "@/lib/phone";
import HopXacThucSo from "@/components/HopXacThucSo";

// ============================================================================
// CỔNG SỐ ĐIỆN THOẠI — full SĐT người đăng chỉ hiện sau khi khách tự định danh.
//   · Chưa đăng nhập  → mở hộp XÁC THỰC SỐ ngay tại chỗ: nhập số của mình, nhận
//                        mã, nhập mã là xem được. KHÔNG bắt đặt mật khẩu hay điền
//                        hồ sơ — rào cản thấp hơn hẳn đăng ký nên nhiều người qua
//                        được hơn, mà sàn vẫn có số THẬT ĐÃ XÁC THỰC và người bán
//                        vẫn nhận được lead gọi lại được ngay.
//   · Đã đăng nhập    → gọi RPC reveal_contact: trả full số + GHI LEAD (người bán
//                        biết ai quan tâm). Số thật KHÔNG nằm sẵn trong HTML → không
//                        thể xem lén qua "view source", nên lead luôn được ghi nhận.
// Khối bên phải (ContactActions) và thanh dính mobile (ContactBarMobile) dùng chung
// một hook: hiện số ở chỗ này thì chỗ kia cũng hiện, không phải bấm lại.
// ============================================================================

const EVENT = "cl-reveal-phone";
const telOf = (p: string) => p.replace(/\s/g, "");
const digitsOf = (p: string) => p.replace(/\D/g, "");

function useReveal(listingId: string) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoiSo, setHoiSo] = useState(false);

  // Đồng bộ giữa các nút cùng tin trên một trang (bên phải ↔ thanh mobile).
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as { id: string; phone: string };
      if (d?.id === listingId) setPhone(d.phone);
    };
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, [listingId]);

  const reveal = useCallback(async () => {
    if (phone || loading) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Chưa đăng nhập → XÁC THỰC SỐ NGAY TẠI CHỖ, không đá sang trang đăng
        // nhập nữa. Bắt đặt mật khẩu và điền hồ sơ là phần lớn khách bỏ cuộc
        // ngay đó; hỏi số rồi gửi mã thì rào cản thấp hơn hẳn, mà sàn vẫn thu
        // được số thật đã xác thực của người quan tâm và người bán vẫn có lead.
        setHoiSo(true);
        return;
      }
      const { data, error: rpcErr } = await supabase.rpc("reveal_contact", {
        p_listing_id: listingId,
      });
      if (rpcErr) throw rpcErr;
      // Hiện ĐÚNG chuẩn 0 + 10 số — khớp với file gốc và với ô nhập trong admin,
      // kể cả tin cũ đã lưu lẫn dấu chấm / khoảng trắng / +84.
      const num = chuanHoaSdt((data as string | null) ?? "");
      if (!num) {
        setError("Tin này chưa có số điện thoại.");
        return;
      }
      setPhone(num);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: listingId, phone: num } }));
    } catch {
      setError("Không mở được số, thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [listingId, phone, loading]);

  // Xác thực xong → hiện số người bán ở MỌI nút cùng tin trên trang.
  const nhanSo = useCallback(
    (so: string) => {
      const num = chuanHoaSdt(so);
      if (!num) return;
      setPhone(num);
      setHoiSo(false);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: listingId, phone: num } }));
    },
    [listingId],
  );

  return { phone, loading, error, reveal, hoiSo, setHoiSo, nhanSo };
}

const PhoneIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" />
  </svg>
);

// ── Khối liên hệ bên phải (desktop + mobile trong luồng trang) ──────────────
export function ContactActions({ listingId, phoneMask }: { listingId: string; phoneMask: string }) {
  const { phone, loading, error, reveal, hoiSo, setHoiSo, nhanSo } = useReveal(listingId);

  return (
    <div className="mt-4 space-y-2.5">
      {phone ? (
        <>
          <a href={`tel:${telOf(phone)}`} className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-body">
            <PhoneIcon />
            {phone}
          </a>
          <a href={`https://zalo.me/${digitsOf(phone)}`} className="flex items-center justify-center gap-2 rounded-lg border border-cvr-line px-4 py-3 text-sm font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Nhắn Zalo
          </a>
        </>
      ) : (
        <>
          <button type="button" onClick={reveal} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-body disabled:opacity-60">
            <PhoneIcon />
            {loading ? "Đang mở…" : (
              <span>{phoneMask} <span className="font-medium opacity-80">· Bấm để hiện số</span></span>
            )}
          </button>
          <p className="text-center text-[12px] text-cvr-muted">Xác thực số của bạn để xem số người đăng</p>
          {error && <p className="text-center text-[12px] text-red-600">{error}</p>}
        </>
      )}
      {hoiSo && <HopXacThucSo listingId={listingId} onXong={nhanSo} onDong={() => setHoiSo(false)} />}
    </div>
  );
}

// ── Thanh liên hệ DÍNH đáy màn hình (mobile) ────────────────────────────────
// Trả về các NÚT bên trong (khung fixed do trang chi tiết giữ nguyên bọc ngoài).
export function ContactBarMobile({ listingId, phoneMask }: { listingId: string; phoneMask: string }) {
  const { phone, loading, reveal, hoiSo, setHoiSo, nhanSo } = useReveal(listingId);

  if (phone) {
    return (
      <>
        <a href={`tel:${telOf(phone)}`} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cvr-ink py-3 text-sm font-bold text-white transition active:scale-95">
          <PhoneIcon />
          Gọi ngay
        </a>
        <a href={`https://zalo.me/${digitsOf(phone)}`} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-cvr-line bg-white py-3 text-sm font-semibold text-cvr-body transition active:scale-95">
          Nhắn Zalo
        </a>
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={reveal} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cvr-ink py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60">
        <PhoneIcon />
        {loading ? "Đang mở…" : `${phoneMask} · Hiện số để gọi`}
      </button>
      {hoiSo && <HopXacThucSo listingId={listingId} onXong={nhanSo} onDong={() => setHoiSo(false)} />}
    </>
  );
}
